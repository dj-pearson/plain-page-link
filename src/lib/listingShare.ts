/**
 * Addresses for a single listing on a public profile.
 *
 * US-114 gave a listing a URL: `/:username?listing=<id>`, which opened a modal
 * over the profile. US-275 replaces the modal with a page of its own at
 * `/:username/listing/:id` — something a search engine can index, a sitemap
 * can list and a share preview can describe. The old query-parameter links are
 * already on business cards and in text threads, so the profile redirects
 * `?listing=<id>` to the page rather than dropping it.
 *
 * `listing` is a fixed segment, so `/:username/listing/:id` cannot collide with
 * `/:username/review`, and `listing` is a reserved username.
 */

/** The query parameter the old modal links carried. Still honoured, by redirect. */
export const LISTING_PARAM = 'listing';

/** The path segment between the username and the listing id. */
export const LISTING_PATH_SEGMENT = 'listing';

/** `/:username/listing/:id`, with both parts encoded. */
export function listingPagePath(username: string, listingId: string): string {
  return `/${encodeURIComponent(username)}/${LISTING_PATH_SEGMENT}/${encodeURIComponent(listingId)}`;
}

/**
 * The canonical shareable URL for one listing.
 *
 * `profileUrl` is any URL on the agent's public pages — the profile itself, or
 * another listing's page: the username is its first path segment. Its query and
 * hash are dropped, so a tracking query the visitor arrived with is not passed
 * on to whoever they send it to.
 */
export function buildListingShareUrl(profileUrl: string, listingId: string): string {
  const url = new URL(profileUrl);
  const username = decodeURIComponent(url.pathname.split('/').filter(Boolean)[0] ?? '');
  return `${url.origin}${listingPagePath(username, listingId)}`;
}

/**
 * The share URL for a listing, built from the page the visitor is on right now
 * (the profile, or a listing page on it).
 *
 * Safe to call during render in a test environment: returns null rather than
 * throwing when there is no `window`.
 */
export function currentListingShareUrl(listingId: string): string | null {
  if (typeof window === 'undefined') return null;
  return buildListingShareUrl(window.location.href, listingId);
}

/**
 * Where an old `/:username?listing=<id>` link should go now, or null when the
 * URL carries no listing. Every other query parameter — a campaign's UTM tags —
 * travels with it.
 */
export function legacyListingRedirect(username: string, search: URLSearchParams): string | null {
  const listingId = search.get(LISTING_PARAM);
  if (!listingId) return null;
  const rest = new URLSearchParams(search);
  rest.delete(LISTING_PARAM);
  const query = rest.toString();
  return `${listingPagePath(username, listingId)}${query ? `?${query}` : ''}`;
}
