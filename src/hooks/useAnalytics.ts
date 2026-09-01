import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/useAuthStore';
import type { Database } from '@/integrations/supabase/types';
import { decryptPIIBatch } from '@/lib/pii';

export type TimeRange = '7d' | '30d' | '90d';

/** One day's bucket while grouping; `visitors` is a Set until it is counted. */
interface ViewsByDate {
  name: string;
  views: number;
  visitors: Set<string>;
}

/**
 * A point on the views-over-time chart.
 *
 * A type alias rather than an interface on purpose: AnalyticsChart's DataPoint
 * carries an index signature, and only aliases get an implicit one.
 */
export type ViewsDatum = {
  name: string;
  views: number;
  visitors: number;
};

/** A slice of the leads-by-type breakdown. */
export type LeadsDatum = {
  name: string;
  value: number;
};

/**
 * Exactly the lead columns this hook exposes, and LeadsTable renders.
 *
 * `email` and `phone` are not columns any more — US-086 dropped the plaintext
 * pair — so they are produced by decrypting encrypted_email/encrypted_phone at
 * the read boundary below, the same way useLeads does.
 */
export type RecentLead = Pick<
  Database['public']['Tables']['leads']['Row'],
  'id' | 'name' | 'created_at' | 'lead_type' | 'status' | 'first_responded_at'
> & {
  email: string | null;
  phone: string | null;
};

type EncryptedLeadRow = Pick<
  Database['public']['Tables']['leads']['Row'],
  | 'id'
  | 'name'
  | 'created_at'
  | 'lead_type'
  | 'status'
  | 'encrypted_email'
  | 'encrypted_phone'
  | 'first_responded_at'
>;

/**
 * Decrypts a page of leads in one batched call.
 *
 * Batched for the same reason useLeads batches: since US-066 the crypto lives
 * in the pii-crypto Edge Function, so a call per field would be two network
 * round trips per row.
 */
async function decryptRecentLeads(rows: EncryptedLeadRow[]): Promise<RecentLead[]> {
  const [emails, phones] = await Promise.all([
    decryptPIIBatch(rows.map((row) => row.encrypted_email)),
    decryptPIIBatch(rows.map((row) => row.encrypted_phone)),
  ]);

  return rows.map(({ encrypted_email: _e, encrypted_phone: _p, ...rest }, i) => ({
    ...rest,
    email: emails[i] ?? null,
    phone: phones[i] ?? null,
  }));
}

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

  // US-087: the preceding window of the same length, so trends compare against
  // something real. AnalyticsDashboard used to synthesise the previous period as
  // `current * 0.85` with the comment "Estimate 15% growth", which made every
  // trend arrow read a constant +17.6% — including while the numbers fell.
  const RANGE_DAYS = { '7d': 7, '30d': 30, '90d': 90 }[timeRange];
  const previousCutoffDate = (() => {
    const date = new Date(cutoffDate);
    date.setDate(date.getDate() - RANGE_DAYS);
    return date.toISOString();
  })();

  // Fetch analytics views with optimizations
  const {
    data: views = [],
    isLoading: viewsLoading,
    isError: viewsError,
    error: viewsErrorObj,
    refetch: refetchViews,
  } = useQuery({
    queryKey: ['analytics-views', user?.id, timeRange],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('analytics_views')
        // Only real, used columns. The table has no page_url/referrer columns —
        // selecting them made every request error out ("column does not exist"),
        // which the catch below swallowed as [], so analytics always read empty.
        .select('viewed_at, visitor_id') // Only needed columns
        .eq('user_id', user.id)
        .gte('viewed_at', cutoffDate) // Filter by time range
        .order('viewed_at', { ascending: false })
        .limit(1000); // Hard limit for safety

      // Table/view may not exist yet — return empty instead of throwing
      if (error) {
        if (
          error.code === '42P01' ||
          error.message?.includes('does not exist') ||
          error.code === 'PGRST204'
        ) {
          return [];
        }
        throw error;
      }
      return data;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes instead of 60 seconds
    gcTime: 10 * 60 * 1000, // 10 minutes cache time
    retry: false, // Don't retry if table doesn't exist
  });

  // Fetch leads for analytics with optimizations
  const {
    data: leads = [],
    isLoading: leadsLoading,
    isError: leadsError,
    error: leadsErrorObj,
    refetch: refetchLeads,
  } = useQuery({
    queryKey: ['analytics-leads', user?.id, timeRange],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('leads')
        // id and name are here because LeadsTable renders both — it keyed every
        // row on an undefined id and printed an empty name cell without them.
        // email/phone come from the encrypted columns (US-086 dropped the
        // plaintext ones) and are decrypted below before any consumer sees them.
        .select(
          'id, name, created_at, lead_type, status, encrypted_email, encrypted_phone, first_responded_at'
        )
        .eq('user_id', user.id)
        .gte('created_at', cutoffDate) // Filter by time range
        .order('created_at', { ascending: false })
        .limit(500); // Hard limit for safety

      if (error) throw error;
      return decryptRecentLeads(data ?? []);
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes instead of 60 seconds
    gcTime: 10 * 60 * 1000, // 10 minutes cache time
  });

  // Previous-window counts. Deliberately head-only counts rather than rows:
  // the comparison needs totals, and pulling another 1,500 rows to length them
  // would double the payload for no benefit.
  const { data: previousCounts } = useQuery({
    queryKey: ['analytics-previous', user?.id, timeRange],
    queryFn: async () => {
      if (!user?.id) return { views: 0, visitors: 0, leads: 0, conversions: 0 };

      const [viewsResult, leadsResult] = await Promise.all([
        supabase
          .from('analytics_views')
          .select('visitor_id')
          .eq('user_id', user.id)
          .gte('viewed_at', previousCutoffDate)
          .lt('viewed_at', cutoffDate)
          .limit(1000),
        supabase
          .from('leads')
          .select('status')
          .eq('user_id', user.id)
          .gte('created_at', previousCutoffDate)
          .lt('created_at', cutoffDate)
          .limit(500),
      ]);

      const previousViews = viewsResult.data ?? [];
      const previousLeads = leadsResult.data ?? [];

      return {
        views: previousViews.length,
        visitors: new Set(previousViews.map((v) => v.visitor_id)).size,
        leads: previousLeads.length,
        conversions: previousLeads.filter((l) => l.status === 'converted').length,
      };
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  /**
   * Mean minutes between a lead arriving and the agent first responding, over
   * the leads that were responded to. US-087: this was hardcoded 0 and shown
   * on the KPI cards as though measured.
   */
  const avgResponseMinutes = (() => {
    const spans: number[] = [];
    for (const lead of leads as Array<{
      created_at?: string | null;
      first_responded_at?: string | null;
    }>) {
      if (!lead.created_at || !lead.first_responded_at) continue;
      spans.push(new Date(lead.first_responded_at).getTime() - new Date(lead.created_at).getTime());
    }
    if (spans.length === 0) return null;
    const total = spans.reduce((sum, span) => sum + span, 0);
    return Math.round(total / spans.length / 60000);
  })();

  // Calculate stats from data
  const stats = {
    totalViews: views.length,
    uniqueVisitors: new Set(views.map((v) => v.visitor_id)).size,
    totalLeads: leads.length,
    /** Percentage points, not a formatted string — callers format it. */
    conversionRate: views.length > 0 ? (leads.length / views.length) * 100 : 0,
    /** null when no lead in the window has been responded to yet. */
    avgResponseMinutes,
  };

  // Group views by date for chart. The accumulator used to be `any`, which
  // propagated all the way out: Object.entries below then produced
  // `value: unknown`, and Analytics.tsx divided by it and rendered it.
  const viewsByDate = views.reduce<Record<string, ViewsByDate>>((acc, view) => {
    // viewed_at is nullable; an undated view belongs in no bucket rather than
    // in a "Jan 1" one (new Date(null) is the epoch).
    if (!view.viewed_at) return acc;
    const date = new Date(view.viewed_at).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
    if (!acc[date]) {
      acc[date] = { name: date, views: 0, visitors: new Set<string>() };
    }
    acc[date].views++;
    if (view.visitor_id) {
      acc[date].visitors.add(view.visitor_id);
    }
    return acc;
  }, {});

  const viewsData: ViewsDatum[] = Object.values(viewsByDate).map((day) => ({
    name: day.name,
    views: day.views,
    visitors: day.visitors.size,
  }));

  // Group leads by type
  const leadsByType = leads.reduce<Record<string, number>>((acc, lead) => {
    const type = lead.lead_type || 'contact';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  const leadsData: LeadsDatum[] = Object.entries(leadsByType).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
  }));

  const previousStats = previousCounts ?? { views: 0, visitors: 0, leads: 0, conversions: 0 };

  return {
    stats,
    previousStats,
    /**
     * False when the preceding window holds no data at all — a first-week
     * account. Showing "+100%" against zero is worse than showing nothing.
     */
    hasPreviousPeriod: (previousCounts?.views ?? 0) + (previousCounts?.leads ?? 0) > 0,
    viewsData,
    leadsData,
    recentLeads: leads.slice(0, 10),
    isLoading: viewsLoading || leadsLoading,
    isError: viewsError || leadsError,
    error: viewsErrorObj || leadsErrorObj,
    refetch: () => {
      refetchViews();
      refetchLeads();
    },
    timeRange,
  };
}
