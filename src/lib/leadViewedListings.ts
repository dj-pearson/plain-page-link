/**
 * The listings a lead opened before they got in touch (US-531, US-276).
 *
 * The public page records a `listing_view` in analytics_events each time a
 * visitor opens a listing (trackListingView in analyticsEvents.ts), keyed by
 * the browser's client-generated visitor id. Since US-531 submit-lead stores
 * the same id on the lead, so the two can be joined: "viewed 4 listings before
 * contacting you" is a different first call from a cold enquiry.
 *
 * The visitor id lives in the visitor's localStorage, so this is indicative,
 * not measured: another device, a cleared browser or a private window starts
 * a new id. The lead detail says so.
 */

export interface ViewedListing {
  listingId: string;
  /** The address recorded with the view (listings can be renamed or removed since). */
  address: string | null;
  /** The most recent time this visitor opened it before the lead was created. */
  lastViewedAt: string;
}

/** The most rows the lead detail asks for; a visitor who opened more is still counted up to this. */
export const VIEWED_LISTINGS_FETCH_LIMIT = 200;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * One entry per listing, most recently viewed first, from analytics_events
 * rows (target_id, target_label, occurred_at). Views after `before` (the
 * lead's created_at) are ignored, as are malformed rows: a list on the lead
 * detail is never worth breaking the modal for.
 */
export function toViewedListings(rows: unknown, before?: string | null): ViewedListing[] {
  if (!Array.isArray(rows)) return [];
  const cutoff = before ? Date.parse(before) : Number.NaN;
  const byListing = new Map<string, ViewedListing>();

  for (const row of rows) {
    if (!isRecord(row)) continue;
    const listingId = typeof row.target_id === 'string' ? row.target_id : '';
    const occurredAt = typeof row.occurred_at === 'string' ? row.occurred_at : '';
    const at = Date.parse(occurredAt);
    if (!listingId || Number.isNaN(at)) continue;
    if (!Number.isNaN(cutoff) && at > cutoff) continue;

    const address =
      typeof row.target_label === 'string' && row.target_label.trim()
        ? row.target_label.trim()
        : null;
    const existing = byListing.get(listingId);
    if (!existing) {
      byListing.set(listingId, { listingId, address, lastViewedAt: occurredAt });
      continue;
    }
    if (at > Date.parse(existing.lastViewedAt)) {
      existing.lastViewedAt = occurredAt;
      if (address) existing.address = address;
    } else if (!existing.address && address) {
      existing.address = address;
    }
  }

  return [...byListing.values()].sort(
    (a, b) => Date.parse(b.lastViewedAt) - Date.parse(a.lastViewedAt)
  );
}

/** "Viewed 3 listings before contacting you", or null when there is nothing to say. */
export function viewedListingsHeadline(count: number): string | null {
  if (count <= 0) return null;
  return `Viewed ${count.toLocaleString('en-US')} ${count === 1 ? 'listing' : 'listings'} before contacting you`;
}
