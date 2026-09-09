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
  /** Tailwind text colour for the compact status control, on a white surface. */
  color: string;
  /**
   * Tailwind classes for the solid pill on a listing card or detail modal.
   *
   * US-167: this field exists because ListingCard and ListingDetailModal each
   * hand-rolled their own `statusColors` map instead of following this list —
   * the exact divergence US-107 wrote this file to end — and both maps used the
   * 500 weights under white text. "Active" on the public profile ran at 2.27:1
   * against a required 4.5:1, and "Pending" at 1.92:1. On a property card that
   * word is the most material thing on the tile.
   *
   * Every value here is >= 4.5:1 with white, enforced by listingStatus.test.ts.
   * Pending is amber rather than yellow because no yellow weight dark enough to
   * pass still reads as yellow.
   */
  badge: string;
  /** Whether a listing in this state is shown on the agent's public page. */
  public: boolean;
}

export const LISTING_STATUSES: ListingStatus[] = [
  {
    value: 'active',
    label: 'Active',
    color: 'text-green-700',
    badge: 'bg-green-700 text-white',
    public: true,
  },
  {
    value: 'pending',
    label: 'Pending',
    color: 'text-amber-700',
    badge: 'bg-amber-700 text-white',
    public: true,
  },
  {
    value: 'under_contract',
    label: 'Under Contract',
    color: 'text-orange-700',
    badge: 'bg-orange-700 text-white',
    public: true,
  },
  {
    value: 'sold',
    label: 'Sold',
    color: 'text-blue-600',
    badge: 'bg-blue-600 text-white',
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
    color: 'text-slate-600',
    badge: 'bg-slate-600 text-white',
    public: false,
  },
];

/** Statuses that close a listing out, and so record a sold/closed date. */
export const CLOSED_LISTING_STATUSES = new Set(['sold']);

export function listingStatusLabel(value: string | null | undefined): string {
  return LISTING_STATUSES.find((s) => s.value === value)?.label ?? 'Active';
}

export function isPublicListingStatus(value: string | null | undefined): boolean {
  return LISTING_STATUSES.find((s) => s.value === value)?.public ?? false;
}

/**
 * Tailwind classes for the solid status pill.
 *
 * Falls back to the neutral badge rather than to a bare colour, so an unknown
 * status renders as something readable instead of inheriting whatever the
 * surrounding text happens to be.
 */
export function listingStatusBadgeClass(value: string | null | undefined): string {
  return (
    LISTING_STATUSES.find((s) => s.value === value)?.badge ??
    LISTING_STATUSES.find((s) => s.value === 'draft')!.badge
  );
}
