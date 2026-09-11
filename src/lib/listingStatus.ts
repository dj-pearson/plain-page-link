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
  /**
   * Tailwind classes for the filled status badge on a listing card.
   *
   * US-206: ListingCard, FeaturedListingsCarousel and ListingDetailModal each
   * carried their own copy of this map, all of them white text on a 500-level
   * fill — 2.27:1 for Active, 1.9:1 for Pending. Three copies of a colour
   * decision is how a colour decision stops being one, and the public profile
   * is the page a visitor who is not the agent actually reads. These are the
   * 600/700 steps of the same hues, every one at or above 4.5:1 on white.
   */
  badge: string;
  /** Whether a listing in this state is shown on the agent's public page. */
  public: boolean;
}

export const LISTING_STATUSES: ListingStatus[] = [
  {
    value: 'active',
    label: 'Active',
    color: 'text-green-600',
    badge: 'bg-green-700 text-white',
    public: true,
  },
  {
    value: 'pending',
    label: 'Pending',
    color: 'text-yellow-600',
    badge: 'bg-yellow-700 text-white',
    public: true,
  },
  {
    value: 'under_contract',
    label: 'Under Contract',
    color: 'text-orange-600',
    badge: 'bg-orange-700 text-white',
    public: true,
  },
  {
    value: 'sold',
    label: 'Sold',
    color: 'text-blue-600',
    badge: 'bg-blue-700 text-white',
    public: true,
  },
  // Not public: a draft is unfinished, and off-market is deliberately hidden.
  {
    value: 'draft',
    label: 'Draft',
    color: 'text-gray-600',
    badge: 'bg-gray-600 text-white',
    public: false,
  },
  {
    value: 'off_market',
    label: 'Off Market',
    color: 'text-gray-500',
    badge: 'bg-gray-600 text-white',
    public: false,
  },
];

/** Statuses that close a listing out, and so record a sold/closed date. */
export const CLOSED_LISTING_STATUSES = new Set(['sold']);

export function listingStatusLabel(value: string | null | undefined): string {
  return LISTING_STATUSES.find((s) => s.value === value)?.label ?? 'Active';
}

/**
 * Badge classes for a status, falling back to Active's.
 *
 * The three badge maps this replaces had no entry for off_market at all, so a
 * listing in that state rendered an unstyled badge — invisible text on the
 * card's own background.
 */
export function listingStatusBadgeClass(value: string | null | undefined): string {
  return LISTING_STATUSES.find((s) => s.value === value)?.badge ?? LISTING_STATUSES[0].badge;
}

export function isPublicListingStatus(value: string | null | undefined): boolean {
  return LISTING_STATUSES.find((s) => s.value === value)?.public ?? false;
}
