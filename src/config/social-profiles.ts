/**
 * The social accounts this organisation actually has (US-178).
 *
 * schema.org `sameAs` on an Organization is not a list of links. It is a claim
 * of identity — "these accounts are this organisation" — and it is what Google
 * reconciles an entity against when it builds a knowledge panel. Before this
 * file there were two `sameAs` lists, in src/lib/seo.ts and
 * src/components/seo/PageSEO.tsx, shipping on every page and claiming six
 * accounts:
 *
 *     https://twitter.com/agentbio
 *     https://www.facebook.com/agentbio
 *     https://www.linkedin.com/company/agentbio
 *     https://www.instagram.com/agentbio
 *     https://www.youtube.com/@agentbio
 *     https://github.com/agentbio
 *
 * The footer links four, and only LinkedIn is in both lists. The real accounts
 * are @agentbioapp / @AgentBioApp. So the site was telling Google it owned four
 * accounts under a handle it does not use — handles that either belong to
 * somebody else or do not exist — and asserting a YouTube channel and a GitHub
 * organisation that appear nowhere else in the repository.
 *
 * THE BAR FOR ADDING ONE: the site links to it from the footer. That is not a
 * formality; it is the only evidence available in this repository that an
 * account exists and is ours. Claiming an account you do not own is worse than
 * omitting one you do — an omitted profile costs a link, a wrong one hands the
 * entity to a stranger.
 *
 * src/social-profiles.test.ts holds the footer, the sameAs lists and llms.txt
 * to this list.
 */

export interface SocialProfile {
  /** Platform name, for aria labels and for the test's failure messages. */
  name: string;
  /** The profile URL, exactly as the footer links it. */
  url: string;
  /** The @handle, where the platform has one. Used for twitter:site. */
  handle?: string;
}

export const SOCIAL_PROFILES: readonly SocialProfile[] = [
  { name: 'Facebook', url: 'https://www.facebook.com/agentbioapp' },
  { name: 'X', url: 'https://x.com/AgentBioApp', handle: '@AgentBioApp' },
  { name: 'Instagram', url: 'https://www.instagram.com/agentbioapp/' },
  { name: 'LinkedIn', url: 'https://www.linkedin.com/company/agentbio/' },
] as const;

/** What Organization.sameAs should be, everywhere it appears. */
export const SAME_AS: readonly string[] = SOCIAL_PROFILES.map((profile) => profile.url);

/** The handle for twitter:site / twitter:creator. */
export const X_HANDLE =
  SOCIAL_PROFILES.find((profile) => profile.name === 'X')?.handle ?? '@AgentBioApp';

/**
 * A profile's URL by platform name.
 *
 * Throws rather than returning undefined: a footer link that silently became
 * `href="undefined"` is worse than a build that stops. The footer keeps its own
 * markup because each link carries that platform's icon, but it takes the URLs
 * from here so the two lists cannot drift apart again — which is the whole
 * defect this file exists to close.
 */
export function profileUrl(name: SocialProfile['name']): string {
  const profile = SOCIAL_PROFILES.find((candidate) => candidate.name === name);
  if (!profile) {
    throw new Error(`No social profile named ${name} in SOCIAL_PROFILES`);
  }
  return profile.url;
}
