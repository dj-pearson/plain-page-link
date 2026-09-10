/**
 * One place the canonical form of a username lives.
 *
 * Usernames are stored lower case — `derive_available_username` lowercases at
 * signup, `UsernameInput` lowercases as the agent types, and Settings
 * lowercases before it writes. Everything that *reads* one, however, compared
 * it exactly: `usePublicProfile` and `SubmitReview` both did
 * `.eq('username', slug)` with the slug straight out of the URL.
 *
 * So `agentbio.net/JaneDoe` was a 404 while `agentbio.net/janedoe` was the
 * page — on a link-in-bio product, where the URL is printed on business cards,
 * read aloud, and typed on phone keyboards that capitalise the first letter by
 * default. The lookup index the database already carries
 * (`idx_profiles_username_lower`) was never reachable from the read path.
 */

/** The canonical, storable form of a username. */
export function normalizeUsername(raw: string | null | undefined): string {
  return (raw ?? '').trim().toLowerCase();
}

/**
 * True when `raw` is a usable username that is not already canonical — i.e.
 * the visitor should be redirected to the canonical URL rather than served
 * this one, so a profile has a single address for analytics and for search
 * engines.
 */
export function needsCanonicalRedirect(raw: string | null | undefined): boolean {
  const normalized = normalizeUsername(raw);
  return normalized.length > 0 && raw !== normalized;
}
