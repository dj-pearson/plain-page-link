/**
 * The one list of listing statuses.
 *
 * US-107: there were three. The Add and Edit forms offered active / pending /
 * under_contract / sold / draft; the Listings page's filter chips offered the
 * same five; and QuickStatusUpdate offered a sixth, off_market, that neither
 * of the others knew about — so a listing set to Off Market vanished from
 * every filter and rendered an empty status dropdown. `draft` had the mirror
 * problem in QuickStatusUpdate.
 *
 * Adding a status means adding it here, and every surface follows.
 */
export interface ListingStatus {
  value: string;
  label: string;
  /** Tailwind text colour for the compact status control. */
  color: string;
  /** Whether a listing in this state is shown on the agent's public page. */
  public: boolean;
}

export const LISTING_STATUSES: ListingStatus[] = [
  { value: 'active', label: 'Active', color: 'text-green-600', public: true },
  { value: 'pending', label: 'Pending', color: 'text-yellow-600', public: true },
  { value: 'under_contract', label: 'Under Contract', color: 'text-orange-600', public: true },
  { value: 'sold', label: 'Sold', color: 'text-blue-600', public: true },
  // Not public: a draft is unfinished, and off-market is deliberately hidden.
  { value: 'draft', label: 'Draft', color: 'text-gray-600', public: false },
  { value: 'off_market', label: 'Off Market', color: 'text-gray-500', public: false },
];

/** Statuses that close a listing out, and so record a sold/closed date. */
export const CLOSED_LISTING_STATUSES = new Set(['sold']);

export function listingStatusLabel(value: string | null | undefined): string {
  return LISTING_STATUSES.find((s) => s.value === value)?.label ?? 'Active';
}

export function isPublicListingStatus(value: string | null | undefined): boolean {
  return LISTING_STATUSES.find((s) => s.value === value)?.public ?? false;
}
