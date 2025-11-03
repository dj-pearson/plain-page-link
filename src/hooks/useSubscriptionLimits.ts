import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/stores/useAuthStore";

export interface SubscriptionLimits {
  plan_name: string;
  max_listings: number;
  max_links: number;
  max_testimonials: number;
  analytics_history_days: number;
  custom_domain_enabled: boolean;
  remove_branding: boolean;
  priority_support: boolean;
}

export interface UsageCounts {
  listings: number;
  links: number;
  testimonials: number;
}

export function useSubscriptionLimits() {
  const { user } = useAuthStore();

  const { data: subscription, isLoading: subscriptionLoading } = useQuery({
    queryKey: ["subscription", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      return data as SubscriptionLimits;
    },
    enabled: !!user?.id,
  });

  const { data: usage, isLoading: usageLoading } = useQuery({
    queryKey: ["usage", user?.id],
    queryFn: async () => {
      if (!user?.id) return { listings: 0, links: 0, testimonials: 0 };

      const [listings, links, testimonials] = await Promise.all([
        supabase.from("listings").select("id", { count: "exact" }).eq("user_id", user.id),
        supabase.from("links").select("id", { count: "exact" }).eq("user_id", user.id),
        supabase.from("testimonials").select("id", { count: "exact" }).eq("user_id", user.id),
      ]);

      return {
        listings: listings.count || 0,
        links: links.count || 0,
        testimonials: testimonials.count || 0,
      };
    },
    enabled: !!user?.id,
  });

  const canAdd = (feature: keyof UsageCounts) => {
    if (!subscription || !usage) return false;
    
    const limit = subscription[`max_${feature}` as keyof SubscriptionLimits] as number;
    const current = usage[feature];
    
    // -1 means unlimited
    if (limit === -1) return true;
    
    return current < limit;
  };

  const hasFeature = (feature: keyof Pick<SubscriptionLimits, 'custom_domain_enabled' | 'remove_branding' | 'priority_support'>) => {
    return subscription?.[feature] || false;
  };

  const getLimit = (feature: keyof UsageCounts) => {
    if (!subscription) return 0;
    const limit = subscription[`max_${feature}` as keyof SubscriptionLimits] as number;
    return limit === -1 ? Infinity : limit;
  };

  const getUsage = (feature: keyof UsageCounts) => {
    return usage?.[feature] || 0;
  };

  const getRemainingCount = (feature: keyof UsageCounts) => {
    const limit = getLimit(feature);
    const current = getUsage(feature);
    return limit === Infinity ? Infinity : Math.max(0, limit - current);
  };

  return {
    subscription,
    usage,
    isLoading: subscriptionLoading || usageLoading,
    canAdd,
    hasFeature,
    getLimit,
    getUsage,
    getRemainingCount,
  };
}