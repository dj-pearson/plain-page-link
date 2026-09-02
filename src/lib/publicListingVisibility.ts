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
