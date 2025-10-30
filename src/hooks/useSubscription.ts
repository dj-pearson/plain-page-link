import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SubscriptionPlan {
  id: string;
  name: string;
  price_monthly: number;
  price_yearly: number;
  limits: {
    listings?: number;
    sold_properties?: number;
    links?: number;
    testimonials?: number;
    analytics_days?: number;
    themes?: number;
  };
  features: Record<string, any>;
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
      return data as UserSubscription;
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
    isPro: userSubscription?.plan_name === 'professional' || 
           userSubscription?.plan_name === 'team' || 
           userSubscription?.plan_name === 'enterprise',
    isTeam: userSubscription?.plan_name === 'team' || 
            userSubscription?.plan_name === 'enterprise',
  };
};