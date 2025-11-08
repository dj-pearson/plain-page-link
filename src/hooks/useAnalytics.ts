import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/stores/useAuthStore";

export type TimeRange = '7d' | '30d' | '90d';

export function useAnalytics(timeRange: TimeRange = '30d') {
  const { user } = useAuthStore();

  // Calculate date cutoff based on time range
  const getCutoffDate = (range: TimeRange) => {
    const cutoffDays = { '7d': 7, '30d': 30, '90d': 90 }[range];
    const date = new Date();
    date.setDate(date.getDate() - cutoffDays);
    return date.toISOString();
  };

  const cutoffDate = getCutoffDate(timeRange);

  // Fetch analytics views with optimizations
  const { data: views = [], isLoading: viewsLoading } = useQuery({
    queryKey: ["analytics-views", user?.id, timeRange],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("analytics_views")
        .select("viewed_at, visitor_id, page_url, referrer") // Only needed columns
        .eq("user_id", user.id)
        .gte("viewed_at", cutoffDate) // Filter by time range
        .order("viewed_at", { ascending: false })
        .limit(1000); // Hard limit for safety

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes instead of 60 seconds
    gcTime: 10 * 60 * 1000, // 10 minutes cache time
  });

  // Fetch leads for analytics with optimizations
  const { data: leads = [], isLoading: leadsLoading } = useQuery({
    queryKey: ["analytics-leads", user?.id, timeRange],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("leads")
        .select("created_at, lead_type, status, email, phone") // Only needed columns
        .eq("user_id", user.id)
        .gte("created_at", cutoffDate) // Filter by time range
        .order("created_at", { ascending: false })
        .limit(500); // Hard limit for safety

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes instead of 60 seconds
    gcTime: 10 * 60 * 1000, // 10 minutes cache time
  });

  // Calculate stats from data
  const stats = {
    totalViews: views.length,
    uniqueVisitors: new Set(views.map(v => v.visitor_id)).size,
    totalLeads: leads.length,
    conversionRate: views.length > 0 ? ((leads.length / views.length) * 100).toFixed(2) : "0.00",
  };

  // Group views by date for chart
  const viewsByDate = views.reduce((acc: any, view: any) => {
    const date = new Date(view.viewed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (!acc[date]) {
      acc[date] = { name: date, views: 0, visitors: new Set() };
    }
    acc[date].views++;
    if (view.visitor_id) {
      acc[date].visitors.add(view.visitor_id);
    }
    return acc;
  }, {});

  const viewsData = Object.values(viewsByDate).map((day: any) => ({
    name: day.name,
    views: day.views,
    visitors: day.visitors.size,
  }));

  // Group leads by type
  const leadsByType = leads.reduce((acc: any, lead: any) => {
    const type = lead.lead_type || 'contact';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  const leadsData = Object.entries(leadsByType).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
  }));

  return {
    stats,
    viewsData,
    leadsData,
    recentLeads: leads.slice(0, 10),
    isLoading: viewsLoading || leadsLoading,
    timeRange,
  };
}
