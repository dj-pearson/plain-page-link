import { u as useQuery } from './data-zpsFEjqp.js';
import { s as supabase } from './supabase-D4RJa1Op.js';

const useSubscription = () => {
  const { data: session } = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    }
  });
  const { data: userSubscription, isLoading } = useQuery({
    queryKey: ["user-subscription", session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return null;
      const { data, error } = await supabase.rpc("get_user_plan", {
        _user_id: session.user.id
      });
      if (error) throw error;
      return data;
    },
    enabled: !!session?.user?.id
  });
  const { data: plans } = useQuery({
    queryKey: ["subscription-plans"],
    queryFn: async () => {
      const { data, error } = await supabase.from("subscription_plans").select("*").eq("is_active", true).order("sort_order");
      if (error) throw error;
      return data;
    }
  });
  const checkLimit = (resource, currentCount) => {
    if (!userSubscription?.limits) return currentCount < 3;
    const limit = userSubscription.limits[resource];
    if (limit === -1) return true;
    if (limit === void 0) return false;
    return currentCount < limit;
  };
  const hasFeature = (feature) => {
    if (!userSubscription?.features) return false;
    return userSubscription.features[feature] === true;
  };
  return {
    subscription: userSubscription,
    plans,
    isLoading,
    checkLimit,
    hasFeature,
    isPro: userSubscription?.plan_name === "professional" || userSubscription?.plan_name === "team" || userSubscription?.plan_name === "enterprise",
    isTeam: userSubscription?.plan_name === "team" || userSubscription?.plan_name === "enterprise"
  };
};

export { useSubscription as u };
