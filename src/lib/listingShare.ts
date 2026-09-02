/**
 * Deep links to a single listing on a public profile (US-114).
 *
 * Every share control — the card, the detail modal, the featured carousel —
 * shared `window.location.href`, which on a profile page is the profile. The
 * recipient opened it at the top of the page with no idea which of eleven
 * properties they were meant to be looking at. The modal's own JSON-LD could
 * not be indexed either, because there was no URL for a crawler to index.
 *
 * The listing is a query parameter rather than a path segment on purpose:
 * `/:username/:listingId` would collide with `/:username/review`, and the
 * profile route is already `/:slug` at the very bottom of the route table.
 */

export const LISTING_PARAM = 'listing';

/**
 * The canonical shareable URL for one listing on a profile page.
 *
 * `profileUrl` is whatever the visitor is currently looking at; its existing
 * query and hash are dropped, so sharing twice does not accumulate parameters
 * and a tracking query the visitor arrived with is not passed on to whoever
 * they send it to.
 */
export function buildListingShareUrl(profileUrl: string, listingId: string): string {
  const url = new URL(profileUrl);
  url.search = '';
  url.hash = '';
  url.searchParams.set(LISTING_PARAM, listingId);
  return url.toString();
}

/**
 * The share URL for the page the visitor is on right now.
 *
 * Safe to call during render in a test environment: returns null rather than
 * throwing when there is no `window`.
 */
export function currentListingShareUrl(listingId: string): string | null {
  if (typeof window === 'undefined') return null;
  return buildListingShareUrl(window.location.href, listingId);
}
