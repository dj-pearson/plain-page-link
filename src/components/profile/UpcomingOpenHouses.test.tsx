import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

let hookResult: { data: Record<string, unknown>[] | undefined };

vi.mock('@/hooks/useOpenHouses', () => ({
  usePublicOpenHouses: () => hookResult,
  formatOpenHouseAddress: (l: { address: string; city: string }) => `${l.address}, ${l.city}`,
}));

import { UpcomingOpenHouses } from './UpcomingOpenHouses';

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
    // No onViewListing → no "View home" button that would do nothing.
    expect(screen.queryByRole('button', { name: /view home/i })).toBeNull();
  });
});
