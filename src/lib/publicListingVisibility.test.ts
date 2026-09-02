/**
 * US-110: marking a listing Pending made it vanish from the agent's public
 * page. FullProfilePage filtered on `status === 'active'` alone, while
 * usePublicProfile fetched active, pending, under_contract and sold — so three
 * of the four fetched statuses were dropped on the floor, and ListingCard's
 * Pending badge had nothing to render on.
 */
import { describe, it, expect } from 'vitest';
import { selectAvailableListings, selectSoldListings } from './publicListingVisibility';

const l = (id: string, status: string) => ({ id, status });

describe('selectAvailableListings', () => {
  it('includes a pending listing — the bug', () => {
    const result = selectAvailableListings([l('a', 'active'), l('p', 'pending')]);
    expect(result.map((x) => x.id)).toContain('p');
  });

  it('includes under_contract too', () => {
    const result = selectAvailableListings([l('u', 'under_contract')]);
    expect(result.map((x) => x.id)).toEqual(['u']);
  });

  it('puts what is still available first', () => {
    const result = selectAvailableListings([
      l('u', 'under_contract'),
      l('p', 'pending'),
      l('a', 'active'),
    ]);
    expect(result.map((x) => x.id)).toEqual(['a', 'p', 'u']);
  });

  it('leaves sold listings to the sold gallery', () => {
    const result = selectAvailableListings([l('a', 'active'), l('s', 'sold')]);
    expect(result.map((x) => x.id)).toEqual(['a']);
  });

  it('never shows a draft or an off-market listing', () => {
    // A draft is unfinished and off_market is deliberately hidden — neither is
    // something a visitor should meet (US-107's status list decides this).
    const result = selectAvailableListings([
      l('d', 'draft'),
      l('o', 'off_market'),
      l('a', 'active'),
    ]);
    expect(result.map((x) => x.id)).toEqual(['a']);
  });

  it('ignores an unknown status rather than rendering it', () => {
    expect(selectAvailableListings([l('x', 'invented')])).toEqual([]);
  });

  it('handles a null status without throwing', () => {
    expect(selectAvailableListings([{ id: 'n', status: null }])).toEqual([]);
  });
});

describe('selectSoldListings', () => {
  it('returns only sold listings', () => {
    const result = selectSoldListings([l('a', 'active'), l('s', 'sold'), l('p', 'pending')]);
    expect(result.map((x) => x.id)).toEqual(['s']);
  });
});
