/**
 * Which listing a visitor's enquiry may be filed against (US-555).
 *
 * submit-lead receives `listing_id` from the visitor's browser and inserts the
 * lead with the service role. validateLeadData only checks that it is a uuid,
 * and the first-enquiry insert used it as given:
 *
 *  - A listing deleted after the page was opened (or cached, or bookmarked) no
 *    longer exists, so the insert hit leads_listing_id_fkey (23503) and the
 *    whole request failed with a 500. The visitor saw "Submission failed" and
 *    the agent never heard of the enquiry at all.
 *  - Any other agent's listing id was accepted, so the lead was filed against
 *    a listing the agent does not own, and the visitor's auto-reply named that
 *    other agent's address under this agent's name.
 *
 * The repeat-enquiry path (US-513) and the open-house path already checked
 * ownership; the first enquiry, which is every lead, did not. This is the one
 * check all three use: the id is kept only when it names one of this agent's
 * own listings, and otherwise the lead is stored without a listing. An
 * enquiry is never refused because of the listing it came from.
 */

export interface OwnedListing {
  id: string;
  address: string | null;
}

/**
 * The slice of a supabase-js client this needs, so it can be tested without
 * one. Deliberately loose (string column names, unknown data) so the real
 * client satisfies it structurally under `deno check`.
 */
export interface ListingLookupFilter {
  eq(column: string, value: string): ListingLookupFilter;
  maybeSingle(): PromiseLike<{ data: unknown; error: { message: string } | null }>;
}

export interface ListingLookupClient {
  from(table: string): { select(columns: string): ListingLookupFilter };
}

export interface OwnedListingResult {
  listing: OwnedListing | null;
  /**
   * Why a listing id the visitor sent was not kept, for the function's log.
   * Null when none was sent or it was kept.
   */
  dropped: 'not_owned_or_deleted' | 'lookup_failed' | null;
}

/**
 * Resolve `listingId` to one of `userId`'s own listings. A missing id, an id
 * that names nothing, another agent's listing, or a failed read all give
 * `listing: null`: losing the listing reference is always better than losing
 * the lead.
 */
export async function resolveOwnedListing(
  supabase: ListingLookupClient,
  userId: string,
  listingId: string | null | undefined
): Promise<OwnedListingResult> {
  if (!listingId) return { listing: null, dropped: null };

  try {
    const { data, error } = await supabase
      .from('listings')
      .select('id, address')
      .eq('id', listingId)
      .eq('user_id', userId)
      .maybeSingle();
    if (error) return { listing: null, dropped: 'lookup_failed' };
    const row = data as { id?: unknown; address?: unknown } | null;
    if (!row || typeof row.id !== 'string') return { listing: null, dropped: 'not_owned_or_deleted' };
    return {
      listing: { id: row.id, address: typeof row.address === 'string' ? row.address : null },
      dropped: null,
    };
  } catch {
    return { listing: null, dropped: 'lookup_failed' };
  }
}
