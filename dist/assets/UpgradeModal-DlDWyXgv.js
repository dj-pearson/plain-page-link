import { u as useQuery } from './data-zpsFEjqp.js';
import { s as supabase } from './supabase-D4RJa1Op.js';
import { u as useAuthStore } from './state-stores-BQHzCYsU.js';
import { j as jsxRuntimeExports, L as Link } from './react-vendor-a6jLNMWt.js';
import { D as Dialog, l as DialogContent, m as DialogHeader, n as DialogTitle, G as DialogDescription, B as Badge, O as DialogFooter, j as Button } from './ui-components-DLW4dShh.js';
import { aA as Crown, T as TrendingUp, Z as Zap } from './icons-Bf8A6sFa.js';

function useSubscriptionLimits() {
  const { user } = useAuthStore();
  const { data: subscription, isLoading: subscriptionLoading } = useQuery({
    queryKey: ["subscription", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase.from("subscriptions").select("*").eq("user_id", user.id).single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });
  const { data: usage, isLoading: usageLoading } = useQuery({
    queryKey: ["usage", user?.id],
    queryFn: async () => {
      if (!user?.id) return { listings: 0, links: 0, testimonials: 0 };
      const [listings, links, testimonials] = await Promise.all([
        supabase.from("listings").select("id", { count: "exact" }).eq("user_id", user.id),
        supabase.from("links").select("id", { count: "exact" }).eq("user_id", user.id),
        supabase.from("testimonials").select("id", { count: "exact" }).eq("user_id", user.id)
      ]);
      return {
        listings: listings.count || 0,
        links: links.count || 0,
        testimonials: testimonials.count || 0
      };
    },
    enabled: !!user?.id
  });
  const canAdd = (feature) => {
    if (!subscription || !usage) return false;
    const limit = subscription[`max_${feature}`];
    const current = usage[feature];
    if (limit === -1) return true;
    return current < limit;
  };
  const hasFeature = (feature) => {
    return subscription?.[feature] || false;
  };
  const getLimit = (feature) => {
    if (!subscription) return 0;
    const limit = subscription[`max_${feature}`];
    return limit === -1 ? Infinity : limit;
  };
  const getUsage = (feature) => {
    return usage?.[feature] || 0;
  };
  const getRemainingCount = (feature) => {
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
    getRemainingCount
  };
}

const featureRecommendations = {
  listings: { plan: "Starter", icon: TrendingUp },
  testimonials: { plan: "Starter", icon: Crown },
  links: { plan: "Starter", icon: TrendingUp },
  custom_domain: { plan: "Professional", icon: Crown },
  lead_export: { plan: "Starter", icon: TrendingUp },
  analytics: { plan: "Professional", icon: TrendingUp },
  premium_themes: { plan: "Professional", icon: Crown }
};
function UpgradeModal({
  open,
  onOpenChange,
  feature,
  currentPlan = "Free",
  requiredPlan
}) {
  const recommendation = featureRecommendations[feature] || { plan: "Professional", icon: Zap };
  const Icon = recommendation.icon;
  const suggestedPlan = requiredPlan || recommendation.plan;
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open, onOpenChange, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "sm:max-w-md", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mx-auto mb-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "w-6 h-6 text-primary" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogTitle, { className: "text-center text-2xl", children: [
        "Upgrade to unlock ",
        feature.replace(/_/g, " ")
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogDescription, { className: "text-center pt-2", children: [
        "You've reached the limit of your ",
        /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "secondary", children: currentPlan }),
        " plan. Upgrade to ",
        /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "default", children: suggestedPlan }),
        " to unlock this feature."
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-muted/50 rounded-lg p-4 my-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "font-semibold mb-2", children: "What you'll get:" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("ul", { className: "space-y-2 text-sm", children: [
        feature === "listings" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("li", { className: "flex items-center gap-2", children: "✓ Up to 20 active listings (Starter)" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("li", { className: "flex items-center gap-2", children: "✓ Featured property showcase" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("li", { className: "flex items-center gap-2", children: "✓ Sold properties tracking" })
        ] }),
        feature === "testimonials" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("li", { className: "flex items-center gap-2", children: "✓ Up to 10 testimonials (Starter)" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("li", { className: "flex items-center gap-2", children: "✓ Client reviews showcase" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("li", { className: "flex items-center gap-2", children: "✓ Rating display" })
        ] }),
        feature === "links" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("li", { className: "flex items-center gap-2", children: "✓ Up to 15 custom links (Starter)" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("li", { className: "flex items-center gap-2", children: "✓ Link analytics" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("li", { className: "flex items-center gap-2", children: "✓ Custom icons" })
        ] }),
        feature === "lead_export" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("li", { className: "flex items-center gap-2", children: "✓ Export all leads to CSV" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("li", { className: "flex items-center gap-2", children: "✓ CRM integration ready" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("li", { className: "flex items-center gap-2", children: "✓ Lead management tools" })
        ] }),
        feature === "custom_domain" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("li", { className: "flex items-center gap-2", children: "✓ Connect your own domain" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("li", { className: "flex items-center gap-2", children: "✓ Professional branding" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("li", { className: "flex items-center gap-2", children: "✓ SSL certificate included" })
        ] }),
        feature === "premium_themes" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("li", { className: "flex items-center gap-2", children: "✓ 10+ premium themes" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("li", { className: "flex items-center gap-2", children: "✓ 3D animated backgrounds" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("li", { className: "flex items-center gap-2", children: "✓ Advanced customization" })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { className: "gap-2 sm:gap-0", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", onClick: () => onOpenChange(false), children: "Maybe Later" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/pricing", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { className: "w-full sm:w-auto", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Zap, { className: "w-4 h-4 mr-2" }),
        "View Plans"
      ] }) })
    ] })
  ] }) });
}

export { UpgradeModal as U, useSubscriptionLimits as u };
