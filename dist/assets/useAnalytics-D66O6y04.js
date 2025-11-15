import { u as useQuery } from "./data-kszmrHwg.js";
import { s as supabase } from "./supabase-eNUZs_JT.js";
import { u as useAuthStore } from "./state-stores-BzsyoW3J.js";
function useAnalytics(timeRange = "30d") {
  const { user } = useAuthStore();
  const getCutoffDate = (range) => {
    const cutoffDays = { "7d": 7, "30d": 30, "90d": 90 }[range];
    const date = /* @__PURE__ */ new Date();
    date.setDate(date.getDate() - cutoffDays);
    return date.toISOString();
  };
  const cutoffDate = getCutoffDate(timeRange);
  const { data: views = [], isLoading: viewsLoading } = useQuery({
    queryKey: ["analytics-views", user == null ? void 0 : user.id, timeRange],
    queryFn: async () => {
      if (!(user == null ? void 0 : user.id)) return [];
      const { data, error } = await supabase.from("analytics_views").select("viewed_at, visitor_id, page_url, referrer").eq("user_id", user.id).gte("viewed_at", cutoffDate).order("viewed_at", { ascending: false }).limit(1e3);
      if (error) throw error;
      return data;
    },
    enabled: !!(user == null ? void 0 : user.id),
    staleTime: 5 * 60 * 1e3,
    // 5 minutes instead of 60 seconds
    gcTime: 10 * 60 * 1e3
    // 10 minutes cache time
  });
  const { data: leads = [], isLoading: leadsLoading } = useQuery({
    queryKey: ["analytics-leads", user == null ? void 0 : user.id, timeRange],
    queryFn: async () => {
      if (!(user == null ? void 0 : user.id)) return [];
      const { data, error } = await supabase.from("leads").select("created_at, lead_type, status, email, phone").eq("user_id", user.id).gte("created_at", cutoffDate).order("created_at", { ascending: false }).limit(500);
      if (error) throw error;
      return data;
    },
    enabled: !!(user == null ? void 0 : user.id),
    staleTime: 5 * 60 * 1e3,
    // 5 minutes instead of 60 seconds
    gcTime: 10 * 60 * 1e3
    // 10 minutes cache time
  });
  const stats = {
    totalViews: views.length,
    uniqueVisitors: new Set(views.map((v) => v.visitor_id)).size,
    totalLeads: leads.length,
    conversionRate: views.length > 0 ? (leads.length / views.length * 100).toFixed(2) : "0.00"
  };
  const viewsByDate = views.reduce((acc, view) => {
    const date = new Date(view.viewed_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    if (!acc[date]) {
      acc[date] = { name: date, views: 0, visitors: /* @__PURE__ */ new Set() };
    }
    acc[date].views++;
    if (view.visitor_id) {
      acc[date].visitors.add(view.visitor_id);
    }
    return acc;
  }, {});
  const viewsData = Object.values(viewsByDate).map((day) => ({
    name: day.name,
    views: day.views,
    visitors: day.visitors.size
  }));
  const leadsByType = leads.reduce((acc, lead) => {
    const type = lead.lead_type || "contact";
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});
  const leadsData = Object.entries(leadsByType).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value
  }));
  return {
    stats,
    viewsData,
    leadsData,
    recentLeads: leads.slice(0, 10),
    isLoading: viewsLoading || leadsLoading,
    timeRange
  };
}
export {
  useAnalytics as u
};
