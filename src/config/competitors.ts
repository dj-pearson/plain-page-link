/**
 * What we say about other products, in one place, with a date on it (US-156).
 *
 * The comparison pages previously asserted competitor prices as bare literals —
 * "$24 (Pro)" for Linktree, "$10/month" for Beacons, "$25-$80" for Later — with
 * nothing recording where the figures came from or when they were true. A
 * comparison page is the one place on a site where being wrong about somebody
 * else is both a credibility problem and a legal one, and a hardcoded price is
 * wrong the moment the other company runs a promotion.
 *
 * SO PRICES ARE DELIBERATELY ABSENT. Checking linktr.ee/s/pricing on the date
 * below returned the tier names but no figures: pricing is shown in local
 * currency and varies by region, and the page itself warns that tier names and
 * feature boundaries change frequently. A single USD number on our site would
 * be wrong for most readers on most days.
 *
 * Compare on what the products do instead. It is more durable, it is checkable
 * by the reader in thirty seconds, and it is the thing a real estate agent is
 * actually deciding between.
 *
 * WHEN YOU UPDATE THIS: change VERIFIED_ON in the same commit. The date is
 * rendered on every comparison page, so a stale date is visible to the reader
 * rather than only to us.
 */

/** The date the claims below were last checked against the vendors' own pages. */
export const COMPETITORS_VERIFIED_ON = '2026-09-08';

/** Human-readable form of {@link COMPETITORS_VERIFIED_ON}, for page copy. */
export const COMPETITORS_VERIFIED_LABEL = '8 September 2026';

export interface CompetitorFacts {
  name: string;
  /** Their own site, so a reader can check us in one click. */
  homepage: string;
  /** Plan tiers by name only. No prices — see the note above. */
  tiers: string[];
  /** What the product is genuinely built to do. Written to be fair, not flattering to us. */
  builtFor: string;
  /** Who should honestly pick them over AgentBio. */
  betterWhen: string[];
}

export const COMPETITORS: Record<'linktree' | 'beacons' | 'later', CompetitorFacts> = {
  linktree: {
    name: 'Linktree',
    homepage: 'https://linktr.ee',
    tiers: ['Free', 'Starter', 'Pro', 'Premium'],
    builtFor:
      'One link that holds all your other links, for anyone with an audience — musicians, shops, creators, charities. It is deliberately general, and it is very good at being general.',
    betterWhen: [
      'You want a link page for something other than real estate, or for several things at once.',
      'You need it live in two minutes and you are not collecting leads.',
      'The free tier covers you and you do not want another subscription.',
      'You already have a website that handles listings and enquiries, and you only need somewhere to point.',
    ],
  },
  beacons: {
    name: 'Beacons',
    homepage: 'https://beacons.ai',
    tiers: ['Free', 'Creator Pro', 'Store Pro', 'Business'],
    builtFor:
      'Creators who sell — digital products, media kits, brand deals, an email list. The link page is the front of a small creator business.',
    betterWhen: [
      'You are selling digital products or courses alongside your property work.',
      'You want creator-economy features like a media kit or brand-deal tooling.',
      'Your audience follows you as a personality first and an agent second.',
    ],
  },
  later: {
    name: 'Later',
    homepage: 'https://later.com',
    tiers: ['Starter', 'Growth', 'Advanced', 'Agency'],
    builtFor:
      'Social media scheduling and analytics across several networks. The link-in-bio page (Linkin.bio) is one feature of a much larger publishing tool.',
    betterWhen: [
      'Scheduling and planning posts is the actual problem you are solving.',
      'You manage several accounts, or a brand as well as yourself.',
      'You want post-level analytics across networks, not page-level analytics on one link.',
    ],
  },
};
