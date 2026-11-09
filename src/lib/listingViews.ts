/**
 * Per-listing view counts for the dashboard (US-263).
 *
 * The public profile records a `listing_view` event each time a visitor opens
 * a listing (trackListingView in analyticsEvents.ts). listing_view_stats()
 * aggregates them per listing in the database; this module turns its rows
 * into a lookup the Listings page can read by listing id, and words the line
 * shown on each card.
 *
 * Visitors are counted from a client-generated id, so they are indicative
 * rather than measured — the Analytics page carries the same caveat.
 */

export interface ListingViewStats {
  views7d: number;
  views30d: number;
  visitors30d: number;
  lastViewedAt: string | null;
}

export type ListingViewStatsById = Record<string, ListingViewStats>;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** PostgREST returns bigint as a number, but a numeric string is tolerated. */
const toCount = (value: unknown): number => {
  const n = typeof value === 'string' ? Number(value) : value;
  return typeof n === 'number' && Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
};

/**
 * Index listing_view_stats() rows by listing id. Malformed rows (no id) are
 * skipped rather than throwing: a stats line is never worth breaking the page.
 */
export function toListingViewStats(rows: unknown): ListingViewStatsById {
  const out: ListingViewStatsById = {};
  if (!Array.isArray(rows)) return out;
  for (const row of rows) {
    if (!isRecord(row) || typeof row.listing_id !== 'string' || !row.listing_id) continue;
    out[row.listing_id] = {
      views7d: toCount(row.views_7d),
      views30d: toCount(row.views_30d),
      visitors30d: toCount(row.visitors_30d),
      lastViewedAt: typeof row.last_viewed_at === 'string' ? row.last_viewed_at : null,
    };
  }
  return out;
}

const plural = (n: number, one: string, many: string) =>
  `${n.toLocaleString('en-US')} ${n === 1 ? one : many}`;

/**
 * The short line on a listing card, e.g. "42 views · 7 this week".
 *
 * A listing with no views in the window reads "No views in 30 days" rather
 * than "0 views": the absence is the information, and it tells the agent the
 * listing needs sharing.
 */
export function formatListingViews(stats: ListingViewStats | undefined): string {
  if (!stats || stats.views30d === 0) return 'No views in 30 days';
  const total = plural(stats.views30d, 'view', 'views');
  return stats.views7d > 0
    ? `${total} · ${stats.views7d.toLocaleString('en-US')} this week`
    : total;
}

/** The fuller description (title / screen reader) with the window and visitors. */
export function describeListingViews(stats: ListingViewStats | undefined): string {
  if (!stats || stats.views30d === 0) return 'No visitor opened this listing in the last 30 days';
  return `${plural(stats.views30d, 'view', 'views')} by ${plural(
    stats.visitors30d,
    'visitor',
    'visitors'
  )} in the last 30 days; ${plural(stats.views7d, 'view', 'views')} in the last 7 days`;
}

/** One row of top_listings() — a listing ranked by views in the chosen range (US-325). */
export interface TopListing {
  listingId: string;
  address: string;
  city: string;
  status: string | null;
  views: number;
  visitors: number;
  lastViewedAt: string | null;
}

/**
 * Parse top_listings() rows, keeping the database's ranking. Rows without an
 * id are skipped, and so are rows with no views (the function never returns
 * one, but a zero would read as "most viewed: 0 views").
 */
export function toTopListings(rows: unknown): TopListing[] {
  if (!Array.isArray(rows)) return [];
  const out: TopListing[] = [];
  for (const row of rows) {
    if (!isRecord(row) || typeof row.listing_id !== 'string' || !row.listing_id) continue;
    const views = toCount(row.views);
    if (views === 0) continue;
    out.push({
      listingId: row.listing_id,
      address:
        typeof row.address === 'string' && row.address.trim()
          ? row.address.trim()
          : 'Untitled listing',
      city: typeof row.city === 'string' ? row.city.trim() : '',
      status: typeof row.status === 'string' && row.status ? row.status : null,
      views,
      visitors: toCount(row.visitors),
      lastViewedAt: typeof row.last_viewed_at === 'string' ? row.last_viewed_at : null,
    });
  }
  return out;
}

/** "12 views · 9 visitors" for a ranked row. */
export function formatTopListingCounts(listing: Pick<TopListing, 'views' | 'visitors'>): string {
  return `${plural(listing.views, 'view', 'views')} · ${plural(listing.visitors, 'visitor', 'visitors')}`;
}
