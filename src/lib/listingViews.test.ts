import { describe, it, expect } from 'vitest';
import {
  describeListingViews,
  formatListingViews,
  formatTopListingCounts,
  toListingViewStats,
  toTopListings,
} from './listingViews';

describe('toListingViewStats (US-263)', () => {
  it('indexes listing_view_stats() rows by listing id', () => {
    const stats = toListingViewStats([
      {
        listing_id: 'a',
        views_7d: 3,
        views_30d: 12,
        visitors_30d: 9,
        last_viewed_at: '2026-11-06T10:00:00Z',
      },
      { listing_id: 'b', views_7d: 0, views_30d: 1, visitors_30d: 1, last_viewed_at: null },
    ]);
    expect(stats.a).toEqual({
      views7d: 3,
      views30d: 12,
      visitors30d: 9,
      lastViewedAt: '2026-11-06T10:00:00Z',
    });
    expect(stats.b.lastViewedAt).toBeNull();
  });

  it('tolerates bigint-as-string and drops malformed rows instead of throwing', () => {
    const stats = toListingViewStats([
      { listing_id: 'a', views_7d: '2', views_30d: '1500', visitors_30d: 'x' },
      { views_30d: 4 },
      null,
      'nope',
      { listing_id: '', views_30d: 4 },
    ]);
    expect(Object.keys(stats)).toEqual(['a']);
    expect(stats.a).toEqual({ views7d: 2, views30d: 1500, visitors30d: 0, lastViewedAt: null });
  });

  it('returns an empty lookup for a non-array response', () => {
    expect(toListingViewStats(null)).toEqual({});
    expect(toListingViewStats({ listing_id: 'a' })).toEqual({});
  });
});

describe('formatListingViews / describeListingViews (US-263)', () => {
  const s = (views7d: number, views30d: number, visitors30d: number) => ({
    views7d,
    views30d,
    visitors30d,
    lastViewedAt: null,
  });

  it('says plainly when a listing has not been viewed', () => {
    expect(formatListingViews(undefined)).toBe('No views in 30 days');
    expect(formatListingViews(s(0, 0, 0))).toBe('No views in 30 days');
    expect(describeListingViews(undefined)).toBe(
      'No visitor opened this listing in the last 30 days'
    );
  });

  it('shows the 30-day total, and this week only when there is one', () => {
    expect(formatListingViews(s(7, 42, 30))).toBe('42 views · 7 this week');
    expect(formatListingViews(s(0, 1, 1))).toBe('1 view');
    expect(formatListingViews(s(0, 1500, 900))).toBe('1,500 views');
  });

  it('describes views, visitors and both windows', () => {
    expect(describeListingViews(s(1, 12, 1))).toBe(
      '12 views by 1 visitor in the last 30 days; 1 view in the last 7 days'
    );
  });
});

describe('toTopListings (US-325)', () => {
  it('keeps the database ranking and maps every field', () => {
    const rows = toTopListings([
      {
        listing_id: 'a',
        address: ' 1 Main St ',
        city: 'Austin',
        status: 'active',
        views: 12,
        visitors: 9,
        last_viewed_at: '2026-11-06T10:00:00Z',
      },
      {
        listing_id: 'b',
        address: '2 Oak Ave',
        city: 'Austin',
        status: 'sold',
        views: '3',
        visitors: '2',
      },
    ]);
    expect(rows.map((r) => r.listingId)).toEqual(['a', 'b']);
    expect(rows[0]).toEqual({
      listingId: 'a',
      address: '1 Main St',
      city: 'Austin',
      status: 'active',
      views: 12,
      visitors: 9,
      lastViewedAt: '2026-11-06T10:00:00Z',
    });
    expect(rows[1]).toMatchObject({ status: 'sold', views: 3, visitors: 2, lastViewedAt: null });
  });

  it('drops malformed and zero-view rows, and names an address-less listing', () => {
    const rows = toTopListings([
      { listing_id: '', views: 4 },
      { views: 4 },
      null,
      { listing_id: 'z', views: 0, visitors: 0 },
      { listing_id: 'n', address: '', city: null, status: '', views: 1, visitors: 1 },
    ]);
    expect(rows).toEqual([
      {
        listingId: 'n',
        address: 'Untitled listing',
        city: '',
        status: null,
        views: 1,
        visitors: 1,
        lastViewedAt: null,
      },
    ]);
  });

  it('returns nothing for a non-array response', () => {
    expect(toTopListings(null)).toEqual([]);
    expect(toTopListings({ listing_id: 'a', views: 3 })).toEqual([]);
  });

  it('words the counts with singular and plural forms', () => {
    expect(formatTopListingCounts({ views: 1, visitors: 1 })).toBe('1 view · 1 visitor');
    expect(formatTopListingCounts({ views: 1500, visitors: 2 })).toBe('1,500 views · 2 visitors');
  });
});
