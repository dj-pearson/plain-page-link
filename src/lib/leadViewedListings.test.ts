import { describe, it, expect } from 'vitest';
import { toViewedListings, viewedListingsHeadline } from './leadViewedListings';

const A = '11111111-1111-4111-8111-111111111111';
const B = '22222222-2222-4222-8222-222222222222';

describe('toViewedListings (US-531)', () => {
  it('collapses repeat views into one entry per listing, most recent first', () => {
    const viewed = toViewedListings([
      { target_id: A, target_label: '12 Main St', occurred_at: '2026-11-01T10:00:00Z' },
      { target_id: B, target_label: '40 Oak Ave', occurred_at: '2026-11-02T10:00:00Z' },
      { target_id: A, target_label: '12 Main St', occurred_at: '2026-11-03T10:00:00Z' },
    ]);
    expect(viewed).toEqual([
      { listingId: A, address: '12 Main St', lastViewedAt: '2026-11-03T10:00:00Z' },
      { listingId: B, address: '40 Oak Ave', lastViewedAt: '2026-11-02T10:00:00Z' },
    ]);
  });

  it('ignores views after the lead was created', () => {
    const viewed = toViewedListings(
      [
        { target_id: A, target_label: '12 Main St', occurred_at: '2026-11-01T10:00:00Z' },
        { target_id: B, target_label: '40 Oak Ave', occurred_at: '2026-11-05T10:00:00Z' },
      ],
      '2026-11-04T00:00:00Z'
    );
    expect(viewed.map((v) => v.listingId)).toEqual([A]);
  });

  it('keeps an address from any view when the latest one has none', () => {
    const viewed = toViewedListings([
      { target_id: A, target_label: '12 Main St', occurred_at: '2026-11-01T10:00:00Z' },
      { target_id: A, target_label: null, occurred_at: '2026-11-02T10:00:00Z' },
    ]);
    expect(viewed).toEqual([
      { listingId: A, address: '12 Main St', lastViewedAt: '2026-11-02T10:00:00Z' },
    ]);
  });

  it('skips malformed rows rather than throwing', () => {
    expect(
      toViewedListings([
        null,
        'x',
        { target_id: null, occurred_at: '2026-11-01T00:00:00Z' },
        { target_id: A, occurred_at: 'soon' },
      ])
    ).toEqual([]);
    expect(toViewedListings(null)).toEqual([]);
  });
});

describe('viewedListingsHeadline', () => {
  it('says nothing for zero', () => {
    expect(viewedListingsHeadline(0)).toBeNull();
  });

  it('words one and many', () => {
    expect(viewedListingsHeadline(1)).toBe('Viewed 1 listing before contacting you');
    expect(viewedListingsHeadline(4)).toBe('Viewed 4 listings before contacting you');
  });
});
