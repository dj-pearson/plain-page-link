// ============================================
// AgentBio.net Pricing Plans Configuration
// ============================================

export interface PricingTier {
  id: string;
  name: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  popular?: boolean;
  features: PlanFeatures;
  limits: PlanLimits;
  /**
   * Stripe price ids are NOT here (US-118).
   *
   * They used to be, as the literals 'price_starter_monthly' and friends —
   * strings that pass create-checkout-session's /^price_/ check and are then
   * rejected by Stripe with "No such price", which reached the agent as
   * "Could not start checkout". They are environment-specific and belong to
   * the Stripe account, so they live in subscription_plans, filled in per
   * environment. This file is the feature-matrix copy only.
   */
}

/**
 * The yes/no features of a plan, key for key the `features` jsonb that
 * 20260902000014 seeds into subscription_plans (plus openHouseManagement from
 * 20260923000002); pricing-plans.test.ts holds the two together. A key belongs
 * here only when the database carries it and something reads it (US-296: the
 * unbuilt followUpSequences, marketReports, virtualStaging, predictiveAnalytics,
 * videoTours, mortgageCalculator and cmaGenerator keys, and the pay-per-use
 * overage table that priced them and SMS, were removed).
 */
export interface PlanFeatures {
  // Core features
  customDomain: boolean;
  removeBranding: boolean;
  prioritySupport: boolean;
  analytics: boolean;
  customThemes: boolean;

  // Advanced features
  aiListingDescriptions: boolean;
  leadScoring: boolean;
  openHouseManagement: boolean;
}

export interface PlanLimits {
  // Content limits
  listings: number; // -1 = unlimited
  links: number;
  testimonials: number;
  soldProperties: number;

  // AI Generation limits (per month)
  aiListingDescriptions: number; // 0 = disabled, -1 = unlimited
  marketReports: number;
  virtualStagingPhotos: number;
  videoTours: number;
  cmaReports: number;

  // Automation limits
  followUpSequences: number;
  emailsPerMonth: number;
  smsPerMonth: number;

  // Open house
  openHousesPerMonth: number;

  // Client sphere (contacts, their families and key dates)
  contacts: number;

  // Analytics
  analyticsRetentionDays: number;

  // Lead management
  leadsPerMonth: number; // -1 = unlimited
}

export const PRICING_PLANS: PricingTier[] = [
  {
    id: 'free',
    name: 'Free',
    description: 'Perfect for getting started',
    price_monthly: 0,
    price_yearly: 0,
    features: {
      customDomain: false,
      removeBranding: false,
      prioritySupport: false,
      analytics: true,
      customThemes: false,
      aiListingDescriptions: false,
      leadScoring: false,
      openHouseManagement: true, // one a month, to try the sign-in kiosk
    },
    limits: {
      listings: 3,
      links: 5,
      testimonials: 3,
      soldProperties: 3,
      aiListingDescriptions: 0,
      marketReports: 0,
      virtualStagingPhotos: 0,
      videoTours: 0,
      cmaReports: 0,
      followUpSequences: 0,
      emailsPerMonth: 0,
      smsPerMonth: 0,
      openHousesPerMonth: 1,
      contacts: 50,
      analyticsRetentionDays: 30,
      leadsPerMonth: 10,
    },
  },

  {
    id: 'starter',
    name: 'Starter',
    description: 'Essential features for solo agents',
    price_monthly: 29,
    price_yearly: 290, // ~2 months free
    features: {
      customDomain: false,
      removeBranding: false,
      prioritySupport: false,
      analytics: true,
      customThemes: true,
      aiListingDescriptions: true,
      leadScoring: true,
      openHouseManagement: true,
    },
    limits: {
      listings: 10,
      links: 15,
      testimonials: 10,
      soldProperties: 10,
      aiListingDescriptions: 10, // 10 per month
      marketReports: 0,
      virtualStagingPhotos: 0,
      videoTours: 0,
      cmaReports: 0,
      followUpSequences: 3, // 3 active sequences
      emailsPerMonth: 500,
      smsPerMonth: 0, // SMS add-on
      openHousesPerMonth: 5,
      contacts: 500,
      analyticsRetentionDays: 90,
      leadsPerMonth: 100,
    },
  },

  {
    id: 'professional',
    name: 'Professional',
    description: 'Advanced AI features for power agents',
    price_monthly: 49,
    price_yearly: 490, // ~2 months free
    popular: true,
    features: {
      customDomain: true,
      removeBranding: true,
      prioritySupport: false,
      analytics: true,
      customThemes: true,
      aiListingDescriptions: true,
      leadScoring: true,
      openHouseManagement: true,
    },
    limits: {
      listings: 25,
      links: -1, // unlimited
      testimonials: 25,
      soldProperties: 25,
      aiListingDescriptions: 25, // 25 per month
      marketReports: 5, // 5 per month
      virtualStagingPhotos: 20, // 20 per month
      videoTours: 5, // 5 per month
      cmaReports: 10, // 10 per month
      followUpSequences: 10,
      emailsPerMonth: 2000,
      smsPerMonth: 500, // Included
      openHousesPerMonth: 15,
      contacts: 2500,
      analyticsRetentionDays: 365,
      leadsPerMonth: -1, // unlimited
    },
  },

  {
    id: 'team',
    name: 'Team',
    description: 'For small teams and brokerages',
    price_monthly: 99,
    price_yearly: 990,
    features: {
      customDomain: true,
      removeBranding: true,
      prioritySupport: true,
      analytics: true,
      customThemes: true,
      aiListingDescriptions: true,
      leadScoring: true,
      openHouseManagement: true,
    },
    limits: {
      listings: -1, // unlimited
      links: -1,
      testimonials: -1,
      soldProperties: -1,
      aiListingDescriptions: 100, // 100 per month
      marketReports: 20,
      virtualStagingPhotos: 100,
      videoTours: 20,
      cmaReports: 50,
      followUpSequences: -1, // unlimited
      emailsPerMonth: 10000,
      smsPerMonth: 2000,
      openHousesPerMonth: -1,
      contacts: -1,
      analyticsRetentionDays: 730, // 2 years
      leadsPerMonth: -1,
    },
  },

  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Custom solutions for large brokerages',
    price_monthly: 299,
    price_yearly: 2990,
    features: {
      customDomain: true,
      removeBranding: true,
      prioritySupport: true,
      analytics: true,
      customThemes: true,
      aiListingDescriptions: true,
      leadScoring: true,
      openHouseManagement: true,
    },
    limits: {
      listings: -1,
      links: -1,
      testimonials: -1,
      soldProperties: -1,
      aiListingDescriptions: -1, // unlimited
      marketReports: -1,
      virtualStagingPhotos: -1,
      videoTours: -1,
      cmaReports: -1,
      followUpSequences: -1,
      emailsPerMonth: -1,
      smsPerMonth: -1,
      openHousesPerMonth: -1,
      contacts: -1,
      analyticsRetentionDays: -1, // forever
      leadsPerMonth: -1,
    },
  },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get pricing plan by ID
 */
export function getPlanById(planId: string): PricingTier | undefined {
  return PRICING_PLANS.find((plan) => plan.id === planId);
}

/**
 * How many active listings each plan allows, in one sentence for marketing
 * copy (US-355). The /features/property-listings page said "unlimited
 * listings" and "Unlimited Listings on Pro Plan"; Professional allows 25 and
 * only Team and above are unlimited. Copy built from this moves with the plans.
 *
 * e.g. "3 listings on Free, 10 on Starter, 25 on Professional and unlimited from Team"
 */
export function listingAllowanceSummary(plans: PricingTier[] = PRICING_PLANS): string {
  const ordered = [...plans].sort((a, b) => a.price_monthly - b.price_monthly);
  const unlimitedIndex = ordered.findIndex((plan) => plan.limits.listings === -1);
  const capped = unlimitedIndex === -1 ? ordered : ordered.slice(0, unlimitedIndex);
  const parts = capped.map((plan, i) =>
    i === 0
      ? `${plan.limits.listings} listings on ${plan.name}`
      : `${plan.limits.listings} on ${plan.name}`
  );
  if (unlimitedIndex !== -1) parts.push(`unlimited from ${ordered[unlimitedIndex].name}`);
  if (parts.length <= 1) return parts.join('');
  return `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`;
}

/**
 * How many link buttons each plan allows, short enough for a comparison-table
 * cell (US-501). /vs/beacons and /vs/later ticked "Unlimited Links" for
 * AgentBio, but Free and Starter are capped.
 *
 * e.g. "5 on Free, 15 on Starter, unlimited from Professional"
 */
export function linkAllowanceSummary(plans: PricingTier[] = PRICING_PLANS): string {
  const ordered = [...plans].sort((a, b) => a.price_monthly - b.price_monthly);
  const unlimitedIndex = ordered.findIndex((plan) => plan.limits.links === -1);
  const capped = unlimitedIndex === -1 ? ordered : ordered.slice(0, unlimitedIndex);
  const parts = capped.map((plan) => `${plan.limits.links} on ${plan.name}`);
  if (unlimitedIndex !== -1) parts.push(`unlimited from ${ordered[unlimitedIndex].name}`);
  return parts.join(', ');
}

/** The cheapest plan whose listing allowance is unlimited, if any. */
export function firstUnlimitedListingsPlan(
  plans: PricingTier[] = PRICING_PLANS
): PricingTier | undefined {
  return [...plans]
    .sort((a, b) => a.price_monthly - b.price_monthly)
    .find((plan) => plan.limits.listings === -1);
}

export default PRICING_PLANS;
