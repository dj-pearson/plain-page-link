/**
 * Which of an agent's listings a visitor sees, and in what order.
 *
 * US-110: FullProfilePage filtered on `status === 'active'` alone, so marking a
 * listing Pending in the dashboard made it disappear from the public page
 * entirely — even though usePublicProfile fetches pending and under_contract
 * and ListingCard has a Pending badge ready to render. A property under offer
 * is a selling point; hiding it is the opposite of what the agent intended.
 */
import { isPublicListingStatus } from '@/lib/listingStatus';

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
