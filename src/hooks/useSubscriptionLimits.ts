/**
 * Listings, links and testimonials limits, for the pages that gate on them.
 *
 * This used to read the flat `subscriptions` copy that stripe-webhook writes,
 * and count rows itself — a second answer that could disagree with the plan
 * the database enforces (and did: it never lapsed with a cancelled plan, and
 * its counts included sample data the triggers exclude). It is now a thin view
 * over usePlanUsage, keeping the shape its callers already use.
 */
import { usePlanUsage } from '@/hooks/usePlanUsage';

export interface UsageCounts {
  listings: number;
  links: number;
  testimonials: number;
}

export function useSubscriptionLimits() {
  const { plan, isLoading, status, hasFeature } = usePlanUsage();

  const subscription = plan
    ? {
        plan_name: plan.plan_name,
        custom_domain_enabled: plan.features.customDomain === true,
        remove_branding: plan.features.removeBranding === true,
        priority_support: plan.features.prioritySupport === true,
      }
    : null;

  const usage: UsageCounts | undefined = plan
    ? {
        listings: plan.usage.listings ?? 0,
        links: plan.usage.links ?? 0,
        testimonials: plan.usage.testimonials ?? 0,
      }
    : undefined;

  const getLimit = (feature: keyof UsageCounts) => {
    const { limit } = status(feature);
    return limit === -1 ? Infinity : limit;
  };

  return {
    subscription,
    usage,
    isLoading,
    canAdd: (feature: keyof UsageCounts) => status(feature).canAdd,
    hasFeature,
    getLimit,
    getUsage: (feature: keyof UsageCounts) => usage?.[feature] ?? 0,
    getRemainingCount: (feature: keyof UsageCounts) => status(feature).remaining,
  };
}
