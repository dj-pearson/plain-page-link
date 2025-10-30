import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/stores/useAuthStore";

export function useAnalytics() {
  const { user } = useAuthStore();

  // Fetch analytics views
  const { data: views = [], isLoading: viewsLoading } = useQuery({
    queryKey: ["analytics-views", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("analytics_views")
        .select("*")
        .eq("user_id", user.id)
        .order("viewed_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch leads for analytics
  const { data: leads = [], isLoading: leadsLoading } = useQuery({
    queryKey: ["analytics-leads", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .eq("user_id", user.id);

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
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
  };
}
