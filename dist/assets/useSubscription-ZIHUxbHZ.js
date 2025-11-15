import { u as useQuery } from "./data-kszmrHwg.js";
import { s as supabase } from "./supabase-eNUZs_JT.js";
const useSubscription = () => {
  var _a, _b;
  const { data: session } = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    }
  });
  const { data: userSubscription, isLoading } = useQuery({
    queryKey: ["user-subscription", (_a = session == null ? void 0 : session.user) == null ? void 0 : _a.id],
    queryFn: async () => {
      var _a2;
      if (!((_a2 = session == null ? void 0 : session.user) == null ? void 0 : _a2.id)) return null;
      const { data, error } = await supabase.rpc("get_user_plan", {
        _user_id: session.user.id
      });
      if (error) throw error;
      return data;
    },
    enabled: !!((_b = session == null ? void 0 : session.user) == null ? void 0 : _b.id)
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
    if (!(userSubscription == null ? void 0 : userSubscription.limits)) return currentCount < 3;
    const limit = userSubscription.limits[resource];
    if (limit === -1) return true;
    if (limit === void 0) return false;
    return currentCount < limit;
  };
  const hasFeature = (feature) => {
    if (!(userSubscription == null ? void 0 : userSubscription.features)) return false;
    return userSubscription.features[feature] === true;
  };
  return {
    subscription: userSubscription,
    plans,
    isLoading,
    checkLimit,
    hasFeature,
    isPro: (userSubscription == null ? void 0 : userSubscription.plan_name) === "professional" || (userSubscription == null ? void 0 : userSubscription.plan_name) === "team" || (userSubscription == null ? void 0 : userSubscription.plan_name) === "enterprise",
    isTeam: (userSubscription == null ? void 0 : userSubscription.plan_name) === "team" || (userSubscription == null ? void 0 : userSubscription.plan_name) === "enterprise"
  };
};
export {
  useSubscription as u
};
