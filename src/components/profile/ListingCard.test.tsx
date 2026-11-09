/**
 * US-113: the card was a role="button" div with two real <button>s nested
 * inside it. Nesting controls inside a control is invalid, and the container's
 * hand-rolled onKeyDown handled Enter only — so the card could not be activated
 * with Space, which is half of what a keyboard user will try. The save and
 * share buttons were `opacity-0 group-hover:opacity-100`, which on a touch
 * device (no hover) meant they were never visible at all.
 *
 * US-408: the one control became a <button> that navigated in onClick, which a
 * crawler cannot follow and a visitor cannot open in a new tab. It is a real
 * link to the listing page now.
 */
import type { ReactElement } from 'react';
import { beforeEach, describe, it, expect } from 'vitest';
import { render as rtlRender, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ListingCard from './ListingCard';
import type { PublicProfileListing } from '@/types';

const listing = {
  id: '00000000-0000-4000-8000-000000000010',
  image: null,
  photos: [],
  address: '412 Maple Avenue',
  city: 'Salt Lake City',
  price: '525000',
  bedrooms: 3,
  bathrooms: 2,
  square_feet: 1980,
  status: 'active',
  sort_order: 1,
  is_featured: false,
  days_on_market: 12,
  description: null,
  property_type: 'Single Family',
  state: 'UT',
  zip_code: '84103',
  mls_number: null,
  lot_size_acres: null,
  virtual_tour_url: null,
  highlights: [],
  created_at: '2026-03-01T12:00:00.000Z',
} as unknown as PublicProfileListing;

const HREF = '/jane/listing/00000000-0000-4000-8000-000000000010';

const render = (ui: ReactElement) =>
  rtlRender(
    <MemoryRouter initialEntries={['/jane']}>
      <Routes>
        <Route path="/jane" element={ui} />
        <Route path="/jane/listing/:id" element={<p>Listing page</p>} />
      </Routes>
    </MemoryRouter>
  );

describe('ListingCard', () => {
  // Saved listings persist in localStorage; one test saving must not flip the
  // next test's "Save property" into "Remove from saved".
  beforeEach(() => localStorage.clear());

  it('exposes the listing as one real link to its page, with no control nested in it', () => {
    render(<ListingCard listing={listing} href={HREF} />);

    const control = screen.getByRole('link', { name: /view listing/i });
    expect(control.tagName).toBe('A');
    expect(control).toHaveAttribute('href', HREF);
    // The address is part of the control's own accessible name, so a screen
    // reader announces which listing it opens.
    expect(control.textContent).toContain('412 Maple Avenue');
    // No control may contain another control, in either direction.
    expect(control.querySelector('a, button')).toBeNull();
    for (const button of screen.getAllByRole('button')) {
      expect(button.querySelector('a, button')).toBeNull();
      expect(button.closest('a')).toBeNull();
    }
    // It is the only link on the card: one tab stop for the listing.
    expect(screen.getAllByRole('link')).toHaveLength(1);
  });

  it('stretches the link over the card, with save and share kept above it', () => {
    const { container } = render(<ListingCard listing={listing} href={HREF} />);

    const card = container.firstElementChild as HTMLElement;
    expect(card.className.split(/\s+/)).toContain('relative');
    // The card div no longer carries a click handler pretending to be a link;
    // the whole-card target is the link's ::after.
    const link = screen.getByRole('link', { name: /view listing/i });
    expect(link.className).toContain('after:absolute');
    expect(link.className).toContain('after:inset-0');
    const actions = screen.getByRole('button', { name: /save property/i }).parentElement!;
    expect(actions.className.split(/\s+/)).toContain('z-10');
  });

  it('opens the listing page with Enter', async () => {
    render(<ListingCard listing={listing} href={HREF} />);

    screen.getByRole('link', { name: /view listing:/i }).focus();
    await userEvent.keyboard('{Enter}');
    expect(await screen.findByText('Listing page')).toBeInTheDocument();
  });

  it('saving does not navigate away', async () => {
    render(<ListingCard listing={listing} href={HREF} />);

    await userEvent.click(screen.getByRole('button', { name: /save property/i }));
    expect(screen.queryByText('Listing page')).toBeNull();
    expect(screen.getByRole('button', { name: /remove from saved/i })).toBeInTheDocument();
  });

  it('renders as a plain summary, not a dead control, without an href', () => {
    render(<ListingCard listing={listing} />);

    expect(screen.queryByRole('link')).toBeNull();
    expect(screen.getByText('412 Maple Avenue')).toBeInTheDocument();
    expect(screen.queryByText('View Details')).toBeNull();
  });

  it('keeps save and share visible below md, where there is no hover', () => {
    render(<ListingCard listing={listing} href={HREF} />);

    const actions = screen.getByRole('button', { name: /save property/i }).parentElement!;
    // The hidden state has to be breakpoint-scoped. An unqualified opacity-0
    // is the defect: it never lifts on a device that cannot hover.
    expect(actions.className).toContain('md:opacity-0');
    expect(actions.className.split(/\s+/)).not.toContain('opacity-0');
    expect(actions.className).toContain('md:group-hover:opacity-100');
    // And a keyboard user must not be tabbing through invisible controls.
    expect(actions.className).toContain('md:focus-within:opacity-100');
  });
});
