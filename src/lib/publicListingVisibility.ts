/**
 * Which of an agent's listings a visitor sees, and in what order.
 *
 * US-110: FullProfilePage filtered on `status === 'active'` alone, so marking a
 * listing Pending in the dashboard made it disappear from the public page
 * entirely — even though usePublicProfile fetches pending and under_contract
 * and ListingCard has a Pending badge ready to render. A property under offer
 * is a selling point; hiding it is the opposite of what the agent intended.
 */
// Relative, not '@/': functions/_lib/profile-sitemap.ts imports this module, and
// the Pages Functions bundle does not resolve the Vite alias.
import { isPublicListingStatus } from './listingStatus';
import { listingPagePath } from './listingShare';

/** Available statuses, in the order a visitor should meet them. */
export const AVAILABLE_STATUS_ORDER = ['active', 'pending', 'under_contract'] as const;

interface HasStatus {
  status?: string | null;
}

/**
 * The "available" gallery: everything public and not yet sold, with what is
 * still freely available first.
 */
export function selectAvailableListings<T extends HasStatus>(listings: T[]): T[] {
  const rank = (status: string | null | undefined) =>
    AVAILABLE_STATUS_ORDER.indexOf(status as (typeof AVAILABLE_STATUS_ORDER)[number]);

  return listings
    .filter((listing) => isPublicListingStatus(listing.status) && rank(listing.status) !== -1)
    .sort((a, b) => rank(a.status) - rank(b.status));
}

/** The sold gallery, shown only when the agent's toggle allows it. */
export function selectSoldListings<T extends HasStatus>(listings: T[]): T[] {
  return listings.filter((listing) => listing.status === 'sold');
}

interface ListingPageSettings {
  show_listings?: boolean | null;
  show_sold_properties?: boolean | null;
}

/**
 * The listing a /:username/listing/:id page may show, or null (US-275).
 *
 * The same rules as the profile: an available listing while the agent shows
 * listings, a sold one only while they also show sold properties. A listing
 * the profile would not show is not reachable at its own address either —
 * hiding the gallery must not leave every home one guessable URL away.
 */
export function selectListingForPage<T extends HasStatus & { id: string }>(
  listings: T[],
  listingId: string | null | undefined,
  settings: ListingPageSettings | null | undefined
): T | null {
  if (!listingId || settings?.show_listings === false) return null;
  const listing = listings.find((l) => l.id === listingId);
  if (!listing) return null;
  if (listing.status === 'sold') {
    return settings?.show_sold_properties === false ? null : listing;
  }
  return selectAvailableListings([listing]).length > 0 ? listing : null;
}

/**
 * A function giving the listing page a card on the profile may link to, or
 * null when that page would refuse the listing (US-589).
 *
 * For cards outside the profile's own galleries — a page-builder listings
 * block — which the agent can fill with any of their public listings. A sold
 * home while sold properties are hidden, or anything while listings are
 * hidden, has no page (selectListingForPage), so its card is not a link to
 * "not found".
 */
export function reachableListingHref(
  username: string,
  settings: ListingPageSettings | null | undefined
): (listing: HasStatus & { id: string }) => string | null {
  return (listing) =>
    selectListingForPage([listing], listing.id, settings)
      ? listingPagePath(username, listing.id)
      : null;
}

/**
 * Every listing the agent's page shows, available first and then sold, each
 * held to selectListingForPage (US-586).
 *
 * The set the profile's JSON-LD offers, in both renderings: the crawler body
 * (functions/_lib/profile-route.ts) and FullProfilePage. A home the agent hid
 * (every listing while show_listings is off, sold ones while
 * show_sold_properties is off) is never in it.
 */
export function selectVisibleProfileListings<T extends HasStatus & { id: string }>(
  listings: T[],
  settings: ListingPageSettings | null | undefined
): T[] {
  const visible = listings.filter(
    (listing) => selectListingForPage([listing], listing.id, settings) !== null
  );
  return [...selectAvailableListings(visible), ...selectSoldListings(visible)];
}
