/**
 * US-113: the card was a role="button" div with two real <button>s nested
 * inside it. Nesting controls inside a control is invalid, and the container's
 * hand-rolled onKeyDown handled Enter only — so the card could not be activated
 * with Space, which is half of what a keyboard user will try. The save and
 * share buttons were `opacity-0 group-hover:opacity-100`, which on a touch
 * device (no hover) meant they were never visible at all.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

describe('ListingCard', () => {
  it('exposes the listing as one real button, not a role=button wrapping buttons', () => {
    render(<ListingCard listing={listing} />);

    const control = screen.getByRole('button', { name: /view listing/i });
    expect(control.tagName).toBe('BUTTON');
    // The address is part of the control's own accessible name, so a screen
    // reader announces which listing it opens.
    expect(control.textContent).toContain('412 Maple Avenue');
    // No control may contain another control.
    expect(control.querySelector('button')).toBeNull();
    for (const button of screen.getAllByRole('button')) {
      expect(button.querySelector('button')).toBeNull();
    }
  });

  it('activates with Space as well as Enter', async () => {
    const onClick = vi.fn();
    render(<ListingCard listing={listing} onClick={onClick} />);

    const control = screen.getByRole('button', { name: /view listing:/i });
    control.focus();
    await userEvent.keyboard(' ');
    expect(onClick).toHaveBeenCalledTimes(1);

    await userEvent.keyboard('{Enter}');
    expect(onClick).toHaveBeenCalledTimes(2);
  });

  it('keeps save and share visible below md, where there is no hover', () => {
    render(<ListingCard listing={listing} />);

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
