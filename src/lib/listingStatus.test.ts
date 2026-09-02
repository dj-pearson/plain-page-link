/**
 * US-107: there were three status lists. The Add and Edit forms offered five
 * statuses, the Listings filter chips the same five, and QuickStatusUpdate a
 * sixth — off_market — that neither of the others knew about. A listing set to
 * Off Market matched no filter chip and rendered an empty status dropdown, and
 * `draft` had the mirror problem in QuickStatusUpdate.
 */
import { describe, it, expect } from 'vitest';
import {
  LISTING_STATUSES,
  CLOSED_LISTING_STATUSES,
  listingStatusLabel,
  isPublicListingStatus,
} from './listingStatus';

describe('LISTING_STATUSES', () => {
  it('includes every status any surface used to offer on its own', () => {
    const values = LISTING_STATUSES.map((s) => s.value);
    // The five the forms had, plus off_market, which only QuickStatusUpdate had.
    for (const v of ['active', 'pending', 'under_contract', 'sold', 'draft', 'off_market']) {
      expect(values).toContain(v);
    }
  });

  it('has no duplicate values', () => {
    const values = LISTING_STATUSES.map((s) => s.value);
    expect(new Set(values).size).toBe(values.length);
  });

  it('labels every status, so no dropdown can render empty', () => {
    for (const status of LISTING_STATUSES) {
      expect(status.label.trim()).not.toBe('');
      expect(listingStatusLabel(status.value)).toBe(status.label);
    }
  });

  it('falls back rather than showing a blank label for an unknown value', () => {
    expect(listingStatusLabel('something_else')).toBe('Active');
    expect(listingStatusLabel(null)).toBe('Active');
  });
});

describe('visibility', () => {
  it('keeps drafts and off-market listings off the public page', () => {
    expect(isPublicListingStatus('draft')).toBe(false);
    expect(isPublicListingStatus('off_market')).toBe(false);
  });

  it('shows the four states a buyer should see', () => {
    for (const v of ['active', 'pending', 'under_contract', 'sold']) {
      expect(isPublicListingStatus(v)).toBe(true);
    }
  });

  it('treats an unknown status as not public', () => {
    expect(isPublicListingStatus('invented')).toBe(false);
  });
});

describe('CLOSED_LISTING_STATUSES', () => {
  it('marks sold as the state that records a close date', () => {
    expect(CLOSED_LISTING_STATUSES.has('sold')).toBe(true);
    expect(CLOSED_LISTING_STATUSES.has('active')).toBe(false);
  });
});
