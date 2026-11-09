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

/**
 * Human-readable form of COMPETITORS_VERIFIED_ON, for page copy ("8 September
 * 2026"). Derived, not a second literal (US-577): the note above says to change
 * VERIFIED_ON, and with two literals doing only that left every comparison page
 * showing the old date.
 */
export const COMPETITORS_VERIFIED_LABEL = new Date(
  `${COMPETITORS_VERIFIED_ON}T00:00:00Z`
).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

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
  /**
   * What their column says on our comparison tables, by feature. A feature
   * that is not listed renders as CHECK_THEIR_SITE — see "Feature cells"
   * below for what may and may not go here.
   */
  features: Partial<Record<ComparisonFeature, CompetitorCell>>;
}

/*
 * FEATURE CELLS (US-507).
 *
 * The comparison tables used to fill the competitor column with literals:
 * Linktree "Basic" lead forms and "Limited" calendar booking, Beacons a
 * "Generic Contact Form" and no testimonials, Later "Limited" branding. None of
 * that was recorded as checked, and most of it was a claim that somebody else's
 * product lacks something, which is the comparative claim most likely to be
 * wrong and the one a competitor is most likely to object to.
 *
 * So a competitor cell can now say only one of three things:
 *
 * - 'offered': a headline feature of their product, the kind their own home
 *   page leads with (Later's scheduling, Beacons' store and media kit). Renders
 *   as a tick.
 * - 'not-real-estate': the feature is specific to real estate (listing
 *   galleries, MLS numbers, buyer/seller forms) and the product is general
 *   purpose, as `builtFor` already says. This describes what they are built
 *   for; it does not claim they have no form or no gallery of any kind.
 * - anything else is left out and renders as CHECK_THEIR_SITE. We never put a
 *   cross, "Basic" or "Limited" in a competitor's column.
 *
 * COMPETITORS_VERIFIED_ON dates the tier names. If you check a feature against
 * their site and want to say more than the above, record it here, not in the
 * page, and update the date in the same commit.
 */

/** Every row a comparison table can have. */
export type ComparisonFeature =
  // Specific to real estate
  | 'listingGalleries'
  | 'listingDisclosures'
  | 'soldShowcase'
  | 'mlsNumbers'
  | 'realEstateLeadForms'
  | 'realEstateAnalytics'
  | 'leadScoring'
  | 'virtualTours'
  // Things AgentBio does that a general tool may or may not
  | 'leadCaptureForms'
  | 'calendarBooking'
  | 'testimonials'
  | 'leadsToCrm'
  // Any link page
  | 'linkInBioPage'
  | 'linkButtons'
  | 'customBranding'
  | 'mobileOptimization'
  | 'analyticsDashboard'
  | 'qrCodes'
  // Creator tools (Beacons)
  | 'emailMarketing'
  | 'onlineStore'
  | 'mediaKit'
  | 'tipping'
  // Publishing tools (Later)
  | 'socialScheduling'
  | 'contentCalendar'
  | 'instagramScheduling'
  | 'mediaLibrary'
  | 'hashtagSuggestions'
  | 'bestTimeToPost';

export type CompetitorCell = 'offered' | 'not-real-estate';

/** The cell for anything we have not recorded about them, prices included. */
export const CHECK_THEIR_SITE = 'Check their site';

/** Said under every comparison table, so the reader knows how to read the competitor column. */
export const COMPETITOR_CELLS_NOTE =
  'A tick in their column marks a feature their own site leads with. Where we have not checked, we say so rather than mark it missing.';

/** The cell for a real-estate-specific feature on a general-purpose product. */
export const NOT_REAL_ESTATE = 'Not real estate-specific';

export type CompetitorId = 'linktree' | 'beacons' | 'later';

const REAL_ESTATE_SPECIFIC: Partial<Record<ComparisonFeature, CompetitorCell>> = {
  listingGalleries: 'not-real-estate',
  listingDisclosures: 'not-real-estate',
  soldShowcase: 'not-real-estate',
  mlsNumbers: 'not-real-estate',
  realEstateLeadForms: 'not-real-estate',
  realEstateAnalytics: 'not-real-estate',
};

export const COMPETITORS: Record<CompetitorId, CompetitorFacts> = {
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
    features: {
      ...REAL_ESTATE_SPECIFIC,
      linkInBioPage: 'offered',
      linkButtons: 'offered',
      customBranding: 'offered',
      mobileOptimization: 'offered',
      qrCodes: 'offered',
    },
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
    features: {
      ...REAL_ESTATE_SPECIFIC,
      linkInBioPage: 'offered',
      linkButtons: 'offered',
      customBranding: 'offered',
      mobileOptimization: 'offered',
      analyticsDashboard: 'offered',
      emailMarketing: 'offered',
      onlineStore: 'offered',
      mediaKit: 'offered',
      tipping: 'offered',
    },
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
    features: {
      ...REAL_ESTATE_SPECIFIC,
      linkInBioPage: 'offered',
      linkButtons: 'offered',
      mobileOptimization: 'offered',
      analyticsDashboard: 'offered',
      socialScheduling: 'offered',
      contentCalendar: 'offered',
      instagramScheduling: 'offered',
      mediaLibrary: 'offered',
      hashtagSuggestions: 'offered',
      bestTimeToPost: 'offered',
    },
  },
};

/**
 * One competitor cell on a comparison table: `true` (a tick) for a headline
 * feature of theirs, otherwise a short phrase. Never `false` — we do not draw a
 * cross in somebody else's column.
 */
export function competitorCell(id: CompetitorId, feature: ComparisonFeature): true | string {
  const cell = COMPETITORS[id].features[feature];
  if (cell === 'offered') return true;
  if (cell === 'not-real-estate') return NOT_REAL_ESTATE;
  return CHECK_THEIR_SITE;
}
