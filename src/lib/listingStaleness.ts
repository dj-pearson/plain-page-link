/**
 * When a listing has gone stale, decided in one place.
 *
 * It was decided in two. QuickStatusDashboard said:
 *
 *     daysSinceUpdate >= 7 && listing.status === 'active'
 *
 * and MobileListingCard, for the same listings, said:
 *
 *     daysSinceUpdate > 7
 *
 * Two disagreements fall out of that. A listing last touched exactly seven days
 * ago is Stale on the desktop dashboard and not stale on the phone. And a
 * listing that has SOLD is stale on the phone — the status test is missing
 * there — so an agent who closed a deal and stopped editing the listing gets
 * nagged about it, on the device they are most likely to be holding.
 *
 * Same agent, same listing, two answers depending on what they opened it on.
 *
 * The threshold is also stated here rather than being a bare 7 in a comparison,
 * because the UI has to be able to tell the agent what "Stale" means. A badge
 * that says Stale and nothing else asks them to guess the rule.
 */

/** A listing is stale once it has gone this many days without an update. */
export const STALE_AFTER_DAYS = 7;

/** Only a listing that is still being marketed can go stale. */
const MARKETABLE_STATUSES = new Set(['active']);

/** The fields staleness depends on. Loose, so both card shapes satisfy it. */
export interface StaleableListing {
  updatedAt: string;
  status: string;
}

/**
 * Whole days since the listing was last updated, or null if the timestamp is
 * missing or unparseable — which is not the same as "zero days ago", and must
 * not be reported as fresh.
 */
export function daysSinceUpdate(
  updatedAt: string | null | undefined,
  now = Date.now()
): number | null {
  if (!updatedAt) return null;
  const then = new Date(updatedAt).getTime();
  if (Number.isNaN(then)) return null;
  return Math.floor((now - then) / (1000 * 60 * 60 * 24));
}

/**
 * Whether the agent should be nudged about this listing.
 *
 * `>=` rather than `>`: a listing untouched for a full week has reached the
 * threshold, and the two components disagreed on exactly this boundary.
 */
export function isListingStale(listing: StaleableListing, now = Date.now()): boolean {
  if (!MARKETABLE_STATUSES.has(listing.status)) return false;
  const days = daysSinceUpdate(listing.updatedAt, now);
  return days !== null && days >= STALE_AFTER_DAYS;
}

/** What the badge's tooltip says, so "Stale" is a rule and not a mood. */
export function staleExplanation(listing: StaleableListing, now = Date.now()): string {
  const days = daysSinceUpdate(listing.updatedAt, now);
  const age = days === null ? 'an unknown length of time' : `${days} days`;
  return `No update in ${age}. Listings are marked stale after ${STALE_AFTER_DAYS} days without a change.`;
}
