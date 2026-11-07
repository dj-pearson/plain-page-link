import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

let hookResult: { data: Record<string, unknown>[] | undefined };

vi.mock('@/hooks/useOpenHouses', () => ({
  usePublicOpenHouses: () => hookResult,
  formatOpenHouseAddress: (l: { address: string; city: string }) => `${l.address}, ${l.city}`,
}));

const downloadIcs = vi.fn();
vi.mock('@/lib/openHouseCalendar', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/openHouseCalendar')>()),
  downloadIcs: (...args: unknown[]) => downloadIcs(...args),
}));

import { UpcomingOpenHouses } from './UpcomingOpenHouses';

const STORAGE = 'https://db.example.com/storage/v1/object/public/listing-photos';

function oneOpenHouse(overrides: Record<string, unknown> = {}) {
  return {
    id: 'oh-1',
    listing_id: 'l-1',
    starts_at: '2026-10-03T18:00:00.000Z',
    ends_at: '2026-10-03T20:00:00.000Z',
    public_notes: null,
    address: '12 Elm St',
    city: 'Springfield',
    state: null,
    zip_code: null,
    price: '450000',
    image: null,
    photos: [],
    ...overrides,
  };
}

describe('UpcomingOpenHouses', () => {
  beforeEach(() => {
    hookResult = { data: [] };
  });

  it('renders nothing when there are no upcoming open houses', () => {
    const { container } = render(<UpcomingOpenHouses agentId="agent-1" />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing while loading', () => {
    hookResult = { data: undefined };
    const { container } = render(<UpcomingOpenHouses agentId="agent-1" />);
    expect(container).toBeEmptyDOMElement();
  });

  it('lists an open house with directions to it', () => {
    hookResult = {
      data: [
        {
          id: 'oh-1',
          listing_id: 'l-1',
          starts_at: '2026-10-03T18:00:00.000Z',
          ends_at: '2026-10-03T20:00:00.000Z',
          public_notes: null,
          address: '12 Elm St',
          city: 'Springfield',
          state: null,
          zip_code: null,
          price: '450000',
          image: null,
          photos: [],
        },
      ],
    };
    render(<UpcomingOpenHouses agentId="agent-1" />);
    expect(screen.getByRole('heading', { name: 'Open houses' })).toBeInTheDocument();
    expect(screen.getByText('12 Elm St, Springfield')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /get directions/i })).toHaveAttribute(
      'href',
      'https://www.google.com/maps/search/?api=1&query=12%20Elm%20St%2C%20Springfield'
    );
    // No listingHref → no "View home" control that would go nowhere.
    expect(screen.queryByRole('link', { name: /view home/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /view home/i })).toBeNull();
  });

  // US-408: "View home" was a <button> that navigated in onClick.
  it('links "View home" to the listing page with a real href', () => {
    hookResult = { data: [oneOpenHouse()] };
    render(
      <MemoryRouter>
        <UpcomingOpenHouses agentId="agent-1" listingHref={(id) => `/jane/listing/${id}`} />
      </MemoryRouter>
    );
    const link = screen.getByRole('link', { name: /view home/i });
    expect(link).toHaveAttribute('href', '/jane/listing/l-1');
    // Its name says which home, since a page can list several open houses.
    expect(link).toHaveAccessibleName(/12 Elm St/);
  });

  it('shows no "View home" when the listing has no page to open', () => {
    hookResult = { data: [oneOpenHouse()] };
    render(
      <MemoryRouter>
        <UpcomingOpenHouses agentId="agent-1" listingHref={() => null} />
      </MemoryRouter>
    );
    expect(screen.queryByRole('link', { name: /view home/i })).toBeNull();
  });

  // US-260: the add-to-calendar menu was a Radix DropdownMenu, which put the
  // whole ui-vendor chunk on every public profile for two links. It is a light
  // disclosure now; these hold its keyboard behaviour.
  describe('add to calendar', () => {
    it('is a collapsed disclosure until opened', async () => {
      hookResult = { data: [oneOpenHouse()] };
      render(<UpcomingOpenHouses agentId="agent-1" />);
      const trigger = screen.getByRole('button', { name: /add to calendar/i });
      expect(trigger).toHaveAttribute('aria-expanded', 'false');
      expect(screen.queryByRole('link', { name: /google calendar/i })).toBeNull();

      await userEvent.click(trigger);
      expect(trigger).toHaveAttribute('aria-expanded', 'true');
      const google = screen.getByRole('link', { name: /google calendar/i });
      expect(google.getAttribute('href')).toMatch(/^https:\/\/calendar\.google\.com\//);
      expect(trigger.getAttribute('aria-controls')).toBe(
        google.closest('[id]')?.getAttribute('id')
      );
    });

    it('opens from the keyboard, and Escape closes it and returns focus', async () => {
      hookResult = { data: [oneOpenHouse()] };
      const user = userEvent.setup();
      render(<UpcomingOpenHouses agentId="agent-1" />);
      const trigger = screen.getByRole('button', { name: /add to calendar/i });

      trigger.focus();
      await user.keyboard('{Enter}');
      expect(trigger).toHaveAttribute('aria-expanded', 'true');

      await user.tab();
      expect(screen.getByRole('button', { name: /apple \/ outlook/i })).toHaveFocus();

      await user.keyboard('{Escape}');
      expect(trigger).toHaveAttribute('aria-expanded', 'false');
      expect(screen.queryByRole('button', { name: /apple \/ outlook/i })).toBeNull();
      expect(trigger).toHaveFocus();
    });

    it('downloads the .ics and closes', async () => {
      hookResult = { data: [oneOpenHouse()] };
      downloadIcs.mockClear();
      render(<UpcomingOpenHouses agentId="agent-1" />);
      const trigger = screen.getByRole('button', { name: /add to calendar/i });
      await userEvent.click(trigger);
      await userEvent.click(screen.getByRole('button', { name: /apple \/ outlook/i }));
      expect(downloadIcs).toHaveBeenCalledTimes(1);
      expect(downloadIcs.mock.calls[0][1]).toBe('open-house-2026-10-03.ics');
      expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });

    it('closes on a click outside', async () => {
      hookResult = { data: [oneOpenHouse()] };
      render(<UpcomingOpenHouses agentId="agent-1" />);
      const trigger = screen.getByRole('button', { name: /add to calendar/i });
      await userEvent.click(trigger);
      await userEvent.click(screen.getByRole('heading', { name: 'Open houses' }));
      expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });
  });

  it('shows the 400px variant of the photo, lazily, falling back to the original', () => {
    hookResult = {
      data: [oneOpenHouse({ photos: [`${STORAGE}/u/l/abc.jpg`] })],
    };
    render(<UpcomingOpenHouses agentId="agent-1" />);
    const img = screen.getByRole('img', { name: '12 Elm St' });
    expect(img).toHaveAttribute('src', `${STORAGE}/u/l/abc-400.webp`);
    expect(img).toHaveAttribute('loading', 'lazy');
    img.dispatchEvent(new Event('error'));
    expect(img).toHaveAttribute('src', `${STORAGE}/u/l/abc.jpg`);
  });
});
