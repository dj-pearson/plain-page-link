import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/useAuthStore';

/**
 * Lead totals from the database (US-225).
 *
 * The Leads cards and the Analytics funnel used to count whatever pages of the
 * paged lead list happened to be loaded — 50 rows, filtered by the status in
 * the URL — so the numbers changed with scrolling and filtering. lead_stats()
 * counts every lead the agent owns, optionally since a date.
 *
 * US-534: with `assignee` set ('unassigned' or a user id) it counts the leads
 * the Leads list shows under that filter instead — the caller's own leads and
 * the ones assigned to them, held by that person — so the status chips and the
 * Needs-attention badge stop describing leads the list is not showing.
 *
 * US-557: `leadType` and `search` narrow the counts the same way the list's
 * type filter and name search do. Blank or 'all' means no filter.
 */
export interface LeadStats {
  total: number;
  byStatus: Record<string, number>;
  bySource: { source: string; leads: number; converted: number }[];
  avgResponseMs: number | null;
  needsAttention: number;
}

interface RawLeadStats {
  total?: number;
  by_status?: Record<string, number>;
  by_source?: { source: string; leads: number; converted: number }[];
  avg_response_ms?: number | null;
  needs_attention?: number;
}

export function parseLeadStats(raw: unknown): LeadStats {
  const r = (raw ?? {}) as RawLeadStats;
  return {
    total: Number(r.total ?? 0),
    byStatus: r.by_status ?? {},
    bySource: Array.isArray(r.by_source) ? r.by_source : [],
    avgResponseMs: r.avg_response_ms == null ? null : Number(r.avg_response_ms),
    needsAttention: Number(r.needs_attention ?? 0),
  };
}

export const useLeadStats = ({
  since,
  slaHours = 24,
  assignee = null,
  leadType = null,
  search = null,
}: {
  since?: Date;
  slaHours?: number;
  assignee?: string | null;
  leadType?: string | null;
  search?: string | null;
} = {}) => {
  const user = useAuthStore((s) => s.user);
  const sinceIso = since ? since.toISOString().slice(0, 10) : null;
  const type = leadType && leadType !== 'all' ? leadType : null;
  const term = search?.trim() || null;

  const { data, isLoading, error } = useQuery({
    queryKey: ['lead-stats', user?.id, sinceIso, slaHours, assignee, type, term],
    enabled: !!user?.id,
    staleTime: 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('lead_stats', {
        p_since: sinceIso ?? undefined,
        p_sla_hours: slaHours,
        p_assignee: assignee ?? undefined,
        p_lead_type: type ?? undefined,
        p_search: term ?? undefined,
      });
      if (error) throw error;
      return parseLeadStats(data);
    },
  });

  return { stats: data, isLoading, error };
};
