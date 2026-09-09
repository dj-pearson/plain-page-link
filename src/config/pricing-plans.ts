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

export interface PlanFeatures {
  // Core features
  customDomain: boolean;
  removeBranding: boolean;
  prioritySupport: boolean;
  analytics: boolean;
  customThemes: boolean;

  // Advanced features
  aiListingDescriptions: boolean | 'limited';
  leadScoring: boolean;
  followUpSequences: boolean | 'limited';
  virtualStaging: boolean | 'limited';
  predictiveAnalytics: boolean;
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
  virtualStagingPhotos: number;
  cmaReports: number;

  // Automation limits
  followUpSequences: number;
  emailsPerMonth: number;
  smsPerMonth: number;

  // Open house
  openHousesPerMonth: number;

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
      followUpSequences: false,
      virtualStaging: false,
      predictiveAnalytics: false,
      openHouseManagement: false,
    },
    limits: {
      listings: 3,
      links: 5,
      testimonials: 3,
      soldProperties: 3,
      aiListingDescriptions: 0,
      virtualStagingPhotos: 0,
      cmaReports: 0,
      followUpSequences: 0,
      emailsPerMonth: 0,
      smsPerMonth: 0,
      openHousesPerMonth: 0,
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
      aiListingDescriptions: 'limited',
      leadScoring: true,
      followUpSequences: 'limited',
      virtualStaging: false,
      predictiveAnalytics: true,
      openHouseManagement: true,
    },
    limits: {
      listings: 10,
      links: 15,
      testimonials: 10,
      soldProperties: 10,
      aiListingDescriptions: 10, // 10 per month
      virtualStagingPhotos: 0,
      cmaReports: 0,
      followUpSequences: 3, // 3 active sequences
      emailsPerMonth: 500,
      smsPerMonth: 0, // SMS add-on
      openHousesPerMonth: 5,
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
      followUpSequences: true,
      virtualStaging: 'limited',
      predictiveAnalytics: true,
      openHouseManagement: true,
    },
    limits: {
      listings: 25,
      links: -1, // unlimited
      testimonials: 25,
      soldProperties: 25,
      aiListingDescriptions: 25, // 25 per month
      virtualStagingPhotos: 20, // 20 per month
      cmaReports: 10, // 10 per month
      followUpSequences: 10,
      emailsPerMonth: 2000,
      smsPerMonth: 500, // Included
      openHousesPerMonth: 15,
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
      followUpSequences: true,
      virtualStaging: true,
      predictiveAnalytics: true,
      openHouseManagement: true,
    },
    limits: {
      listings: -1, // unlimited
      links: -1,
      testimonials: -1,
      soldProperties: -1,
      aiListingDescriptions: 100, // 100 per month
      virtualStagingPhotos: 100,
      cmaReports: 50,
      followUpSequences: -1, // unlimited
      emailsPerMonth: 10000,
      smsPerMonth: 2000,
      openHousesPerMonth: -1,
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
      followUpSequences: true,
      virtualStaging: true,
      predictiveAnalytics: true,
      openHouseManagement: true,
    },
    limits: {
      listings: -1,
      links: -1,
      testimonials: -1,
      soldProperties: -1,
      aiListingDescriptions: -1, // unlimited
      virtualStagingPhotos: -1,
      cmaReports: -1,
      followUpSequences: -1,
      emailsPerMonth: -1,
      smsPerMonth: -1,
      openHousesPerMonth: -1,
      analyticsRetentionDays: -1, // forever
      leadsPerMonth: -1,
    },
  },
];

// ============================================
// PAY-PER-USE PRICING (for overage/add-ons)
// ============================================
// REMOVED: add-on billing that priced features nobody built (US-171)
// ============================================
//
// USAGE_PRICING, FEATURE_KEYS, UsagePricing, calculateOverageCharge and
// calculateTotalCost lived here and were referenced by nothing — verified
// across src/, supabase/ and scripts/. Between them they set a per-use price
// for a Market Report ($10), a Video Tour ($15) and a CMA Report ($19.99),
// none of which exist in this application, and named a MORTGAGE_CALCULATOR
// feature whose 378-line implementation has no caller either.
//
// Dead config that prices unbuilt features is a trap: it reads as a decision
// someone made, so the next person costs a roadmap against it. If metered
// add-ons are built, price them then, against something shippable.
//
// The plan feature matrix itself is owned by
// supabase/migrations/20260902000014_seed_subscription_plans.sql — the
// pricing page reads subscription_plans, not this file. pricing-plans.test.ts
// holds the two in step.

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
 * Check if a plan has a feature enabled
 */
export function planHasFeature(planId: string, featureKey: string): boolean {
  const plan = getPlanById(planId);
  if (!plan) return false;

  // Map feature keys to plan features
  const featureMap: Record<string, keyof PlanFeatures> = {
    ai_listing_description: 'aiListingDescriptions',
    virtual_staging: 'virtualStaging',
    lead_scoring: 'leadScoring',
    predictive_analytics: 'predictiveAnalytics',
    follow_up_sequences: 'followUpSequences',
    open_house_management: 'openHouseManagement',
  };

  const planFeatureKey = featureMap[featureKey];
  if (!planFeatureKey) return false;

  const featureValue = plan.features[planFeatureKey];
  return featureValue === true || featureValue === 'limited';
}

/**
 * Get feature limit for a plan
 */
export function getFeatureLimit(planId: string, limitKey: keyof PlanLimits): number {
  const plan = getPlanById(planId);
  if (!plan) return 0;

  return plan.limits[limitKey];
}

/**
 * Get recommended plan based on usage
 */
export function getRecommendedPlan(monthlyUsage: {
  listings: number;
  aiGenerations: number;
  leads: number;
  emailsPerMonth: number;
}): PricingTier {
  // Logic to recommend plan based on usage patterns
  if (monthlyUsage.listings <= 3 && monthlyUsage.aiGenerations === 0) {
    return PRICING_PLANS[0]; // Free
  }

  if (monthlyUsage.listings <= 10 && monthlyUsage.aiGenerations <= 10) {
    return PRICING_PLANS[1]; // Starter
  }

  if (monthlyUsage.listings <= 25 && monthlyUsage.aiGenerations <= 25) {
    return PRICING_PLANS[2]; // Professional
  }

  if (monthlyUsage.listings <= 100 && monthlyUsage.aiGenerations <= 100) {
    return PRICING_PLANS[3]; // Team
  }

  return PRICING_PLANS[4]; // Enterprise
}

/**
 * How a plan feature is named to a customer.
 *
 * US-171: Pricing.tsx rendered the raw key —
 *
 *     <span className="capitalize">{key.replace(/_/g, ' ')}</span>
 *
 * The keys in `subscription_plans.features` are camelCase, so the underscore
 * replace is a no-op and CSS `capitalize` only uppercases the first letter.
 * The purchase page therefore listed "CustomThemes", "RemoveBranding",
 * "PrioritySupport", "LeadScoring" and — the one that gives it away —
 * "AiListingDescriptions". Programmer identifiers, on the page where money
 * changes hands. The `replace(/_/g, ' ')` says the author expected snake_case;
 * nothing has ever put snake_case in that column.
 *
 * Keys come from the database, not from this file, so this map is keyed on what
 * `20260902000014_seed_subscription_plans.sql` actually seeds.
 * pricing-plans.test.ts fails if that migration grows a key with no label here.
 */
export const PLAN_FEATURE_LABELS: Record<string, string> = {
  analytics: 'Analytics dashboard',
  customThemes: 'Custom themes',
  customDomain: 'Custom domain',
  removeBranding: 'AgentBio branding removed',
  prioritySupport: 'Priority support',
  leadScoring: 'Lead scoring',
  aiListingDescriptions: 'AI listing descriptions',
};

/**
 * A readable label for a feature key, and whether it is capped.
 *
 * Returns null for a feature the plan does not include, so a caller can map
 * over every key without filtering first.
 *
 * `'limited'` used to render as a plain tick, indistinguishable from full
 * inclusion — a customer comparing tiers could not see what they were paying
 * to lift. It is now said out loud.
 */
export function planFeatureLabel(key: string, value: unknown): string | null {
  if (value === false || value === null || value === undefined) return null;

  // An unknown key still has to read as English rather than as an identifier:
  // split the camelCase rather than printing it raw.
  const label =
    PLAN_FEATURE_LABELS[key] ??
    key
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
      .replace(/[_-]+/g, ' ')
      .toLowerCase()
      .trim()
      .replace(/^./, (c) => c.toUpperCase());

  return value === 'limited' ? `${label} (limited)` : label;
}

export default PRICING_PLANS;
