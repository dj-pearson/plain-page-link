import { describe, it, expect } from 'vitest';
import { describeListingViews, formatListingViews, toListingViewStats } from './listingViews';

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
