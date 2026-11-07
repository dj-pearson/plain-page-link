/**
 * Publishing an agent's public page (US-265, first slice of US-142).
 *
 * `profiles.is_published` gates /:username — RLS lets anon read a profile
 * only when it is true ("Public can view limited profile info"), the crawler
 * Pages Function asks for `is_published=is.true`, and the sitemap lists only
 * published rows. Until now nothing in the dashboard read or wrote it, so an
 * agent could neither take their page down nor see what it looked like before
 * sharing it.
 *
 * The owner can always read their own row ("Users can view own full profile"),
 * so the page asks for "published, or mine": a visitor gets published pages
 * only, and the agent sees their own page whether it is live or not, with a
 * banner saying so.
 */

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * The PostgREST `or` filter for the public profile lookup.
 *
 * The viewer id comes from the session, but it is interpolated into a filter
 * string, so anything that is not a plain uuid is ignored rather than trusted.
 * RLS would refuse a widened filter anyway; this keeps the query honest.
 */
export function publicProfileFilter(viewerId: string | null | undefined): string {
  if (viewerId && UUID_RE.test(viewerId)) {
    return `is_published.eq.true,id.eq.${viewerId.toLowerCase()}`;
  }
  return 'is_published.eq.true';
}

/**
 * Whether a fetched profile is the owner looking at a page visitors cannot see.
 *
 * Only `true` is live: RLS compares `is_published = true`, so a NULL hides the
 * page from visitors exactly as `false` does.
 */
export function isUnpublishedPreview(
  profile: { is_published?: boolean | null } | null | undefined
) {
  return !!profile && profile.is_published !== true;
}
