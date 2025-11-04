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
  stripe_price_id_monthly?: string;
  stripe_price_id_yearly?: string;
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
  followUpSequences: boolean;
  marketReports: boolean | 'limited';
  virtualStaging: boolean | 'limited';
  predictiveAnalytics: boolean;
  videoTours: boolean | 'limited';
  openHouseManagement: boolean;
  mortgageCalculator: boolean;
  cmaGenerator: boolean | 'limited';
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
      marketReports: false,
      virtualStaging: false,
      predictiveAnalytics: false,
      videoTours: false,
      openHouseManagement: false,
      mortgageCalculator: true, // Free tool
      cmaGenerator: false,
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
      marketReports: false,
      virtualStaging: false,
      predictiveAnalytics: true,
      videoTours: false,
      openHouseManagement: true,
      mortgageCalculator: true,
      cmaGenerator: false,
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
      analyticsRetentionDays: 90,
      leadsPerMonth: 100,
    },
    stripe_price_id_monthly: 'price_starter_monthly',
    stripe_price_id_yearly: 'price_starter_yearly',
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
      marketReports: 'limited',
      virtualStaging: 'limited',
      predictiveAnalytics: true,
      videoTours: 'limited',
      openHouseManagement: true,
      mortgageCalculator: true,
      cmaGenerator: 'limited',
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
      analyticsRetentionDays: 365,
      leadsPerMonth: -1, // unlimited
    },
    stripe_price_id_monthly: 'price_professional_monthly',
    stripe_price_id_yearly: 'price_professional_yearly',
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
      marketReports: true,
      virtualStaging: true,
      predictiveAnalytics: true,
      videoTours: true,
      openHouseManagement: true,
      mortgageCalculator: true,
      cmaGenerator: true,
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
      analyticsRetentionDays: 730, // 2 years
      leadsPerMonth: -1,
    },
    stripe_price_id_monthly: 'price_team_monthly',
    stripe_price_id_yearly: 'price_team_yearly',
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
      marketReports: true,
      virtualStaging: true,
      predictiveAnalytics: true,
      videoTours: true,
      openHouseManagement: true,
      mortgageCalculator: true,
      cmaGenerator: true,
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
      analyticsRetentionDays: -1, // forever
      leadsPerMonth: -1,
    },
    stripe_price_id_monthly: 'price_enterprise_monthly',
    stripe_price_id_yearly: 'price_enterprise_yearly',
  },
];

// ============================================
// PAY-PER-USE PRICING (for overage/add-ons)
// ============================================

export interface UsagePricing {
  feature_key: string;
  name: string;
  price_per_use: number;
  cost_to_provide: number;
  min_purchase?: number; // Minimum units to purchase
}

export const USAGE_PRICING: UsagePricing[] = [
  {
    feature_key: 'ai_listing_description',
    name: 'AI Listing Description',
    price_per_use: 2.00,
    cost_to_provide: 0.30,
  },
  {
    feature_key: 'market_reports',
    name: 'Market Report',
    price_per_use: 10.00,
    cost_to_provide: 2.00,
  },
  {
    feature_key: 'virtual_staging',
    name: 'Virtual Staging (per photo)',
    price_per_use: 5.00,
    cost_to_provide: 3.00,
  },
  {
    feature_key: 'video_tours',
    name: 'Video Tour',
    price_per_use: 15.00,
    cost_to_provide: 8.00,
  },
  {
    feature_key: 'cma_generator',
    name: 'CMA Report',
    price_per_use: 19.99,
    cost_to_provide: 3.00,
  },
  {
    feature_key: 'sms_messages',
    name: 'SMS Messages (per 100)',
    price_per_use: 10.00,
    cost_to_provide: 0.75, // ~$0.0075 per SMS
    min_purchase: 100,
  },
];

// ============================================
// FEATURE KEYS MAPPING
// ============================================

export const FEATURE_KEYS = {
  // AI Generation
  AI_LISTING_DESCRIPTION: 'ai_listing_description',
  MARKET_REPORTS: 'market_reports',
  VIRTUAL_STAGING: 'virtual_staging',
  VIDEO_TOURS: 'video_tours',
  CMA_GENERATOR: 'cma_generator',

  // Analytics & Scoring
  LEAD_SCORING: 'lead_scoring',
  PREDICTIVE_ANALYTICS: 'predictive_analytics',

  // Automation
  FOLLOW_UP_SEQUENCES: 'follow_up_sequences',
  EMAIL_AUTOMATION: 'email_automation',
  SMS_AUTOMATION: 'sms_automation',

  // Tools
  OPEN_HOUSE_MANAGEMENT: 'open_house_management',
  MORTGAGE_CALCULATOR: 'mortgage_calculator',
} as const;

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get pricing plan by ID
 */
export function getPlanById(planId: string): PricingTier | undefined {
  return PRICING_PLANS.find(plan => plan.id === planId);
}

/**
 * Get usage pricing for a feature
 */
export function getUsagePricing(featureKey: string): UsagePricing | undefined {
  return USAGE_PRICING.find(pricing => pricing.feature_key === featureKey);
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
    market_reports: 'marketReports',
    virtual_staging: 'virtualStaging',
    video_tours: 'videoTours',
    cma_generator: 'cmaGenerator',
    lead_scoring: 'leadScoring',
    predictive_analytics: 'predictiveAnalytics',
    follow_up_sequences: 'followUpSequences',
    open_house_management: 'openHouseManagement',
    mortgage_calculator: 'mortgageCalculator',
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
 * Calculate overage charges
 */
export function calculateOverageCharge(
  featureKey: string,
  overageCount: number
): number {
  const pricing = getUsagePricing(featureKey);
  if (!pricing) return 0;

  return pricing.price_per_use * overageCount;
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
 * Calculate monthly cost with usage
 */
export function calculateMonthlyCost(
  planId: string,
  usage: Partial<PlanLimits>
): number {
  const plan = getPlanById(planId);
  if (!plan) return 0;

  let totalCost = plan.price_monthly;

  // Calculate overage charges for each feature
  Object.entries(usage).forEach(([key, value]) => {
    const limitKey = key as keyof PlanLimits;
    const limit = plan.limits[limitKey];

    if (typeof value === 'number' && limit !== -1 && value > limit) {
      const overage = value - limit;
      // Map limit keys to feature keys for pricing
      const featureKey = limitKey.replace('PerMonth', '').replace(/([A-Z])/g, '_$1').toLowerCase();
      const charge = calculateOverageCharge(featureKey, overage);
      totalCost += charge;
    }
  });

  return totalCost;
}

export default PRICING_PLANS;
