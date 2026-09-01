import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type SubscriptionPlanRow = Database['public']['Tables']['subscription_plans']['Row'];

/** The per-resource caps stored in `subscription_plans.limits` (jsonb). */
export interface PlanLimits {
  listings?: number;
  sold_properties?: number;
  links?: number;
  testimonials?: number;
  analytics_days?: number;
  themes?: number;
}

/**
 * A row from `subscription_plans`, with the two jsonb columns narrowed.
 *
 * Restated by hand this listed five of the sixteen columns — leaving out
 * stripe_price_id, stripe_price_id_monthly, stripe_price_id_yearly and both
 * payment_link columns, which is why nothing in the pricing page could see
 * that per-interval price IDs existed.
 */
export type SubscriptionPlan = Omit<SubscriptionPlanRow, 'limits' | 'features'> & {
  limits: PlanLimits;
  features: Record<string, unknown>;
};

/**
 * The Stripe price to charge for a plan at the chosen interval.
 *
 * Mirrors the get_stripe_price_id(_plan_name, _interval) function in the
 * squashed baseline, including its COALESCE order, so the two cannot disagree.
 */
export function stripePriceIdFor(
  plan: Pick<
    SubscriptionPlan,
    'stripe_price_id' | 'stripe_price_id_monthly' | 'stripe_price_id_yearly'
  >,
  interval: 'month' | 'year'
): string | null {
  return interval === 'year'
    ? (plan.stripe_price_id_yearly ?? plan.stripe_price_id_monthly ?? plan.stripe_price_id)
    : (plan.stripe_price_id_monthly ?? plan.stripe_price_id);
}

export interface UserSubscription {
  plan_name: string;
  limits: Record<string, number>;
  features: Record<string, any>;
  status: string;
  current_period_end?: string;
}

export const useSubscription = () => {
  const { data: session } = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    },
  });

  const { data: userSubscription, isLoading } = useQuery({
    queryKey: ['user-subscription', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return null;

      const { data, error } = await supabase.rpc('get_user_plan', {
        _user_id: session.user.id,
      });

      if (error) throw error;
      // get_user_plan RETURNS Json, so anything could come back; only an
      // object is a plan.
      if (data === null || typeof data !== 'object' || Array.isArray(data)) return null;
      return data as unknown as UserSubscription;
    },
    enabled: !!session?.user?.id,
  });

  const { data: plans } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (error) throw error;
      return data as SubscriptionPlan[];
    },
  });

  const checkLimit = (resource: string, currentCount: number): boolean => {
    if (!userSubscription?.limits) return currentCount < 3; // Free tier default

    const limit = userSubscription.limits[resource];
    if (limit === -1) return true; // Unlimited
    if (limit === undefined) return false; // Not allowed

    return currentCount < limit;
  };

  const hasFeature = (feature: string): boolean => {
    if (!userSubscription?.features) return false;
    return userSubscription.features[feature] === true;
  };

  return {
    subscription: userSubscription,
    plans,
    isLoading,
    checkLimit,
    hasFeature,
    isPro:
      userSubscription?.plan_name === 'professional' ||
      userSubscription?.plan_name === 'team' ||
      userSubscription?.plan_name === 'enterprise',
    isTeam: userSubscription?.plan_name === 'team' || userSubscription?.plan_name === 'enterprise',
  };
};
