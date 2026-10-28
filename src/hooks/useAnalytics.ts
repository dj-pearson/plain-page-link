import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/useAuthStore';
import type { Database, Json } from '@/integrations/supabase/types';
import { decryptLeadContacts } from '@/lib/pii';
import { groupLeadsByChannel } from '@/lib/leadAttribution';

export type TimeRange = '7d' | '30d' | '90d';

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
 * One row of the interactions breakdown: a contact method, or a single link.
 *
 * `analytics_events` is where Call/Email/Text taps and dated link clicks live
 * (US-115). Before it, taps were logger.info'd on the visitor's own console,
 * and link clicks existed only as `links.click_count` — a lifetime total that
 * cannot be shown over a period or compared with anything.
 */
export type InteractionDatum = {
  name: string;
  value: number;
};

/** Human labels for the event types the CHECK constraint allows. */
const CONTACT_LABELS: Record<string, string> = {
  contact_call: 'Call',
  contact_email: 'Email',
  contact_text: 'Text',
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
  | 'id'
  | 'name'
  | 'created_at'
  | 'lead_type'
  | 'status'
  | 'first_responded_at'
  // Attribution (US-189). Named here rather than left off, so the type says
  // what the select above asks for and groupLeadsByChannel has something to
  // group by.
  | 'utm_source'
  | 'utm_medium'
  | 'utm_campaign'
  | 'referrer_url'
  | 'device'
> & {
  email: string | null;
  phone: string | null;
  /** Past the plan's monthly lead allowance; see Lead.contact_locked. */
  contact_locked?: boolean;
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
  | 'utm_source'
  | 'utm_medium'
  | 'utm_campaign'
  | 'referrer_url'
  | 'device'
>;

/**
 * Decrypts a page of leads in one batched call.
 *
 * By id, for the same reason useLeads is: pii-crypto no longer opens raw
 * ciphertext for anyone holding a JWT (US-119). One call per page, since the
 * crypto lives in an Edge Function.
 */
async function decryptRecentLeads(rows: EncryptedLeadRow[]): Promise<RecentLead[]> {
  const contacts = await decryptLeadContacts(rows.map((row) => row.id));

  return rows.map(({ encrypted_email: _e, encrypted_phone: _p, ...rest }) => ({
    ...rest,
    email: contacts.get(rest.id)?.email ?? null,
    phone: contacts.get(rest.id)?.phone ?? null,
    contact_locked: contacts.get(rest.id)?.locked === true,
  }));
}

/**
 * One window's figures, counted by `analytics_summary()` (US-239).
 *
 * These used to be the lengths of arrays fetched with .limit(1000) (views,
 * events) and .limit(500) (leads), so every total stopped at the cap, the
 * conversion rate was a ratio of two capped numbers, and the chart lost its
 * oldest days. The RPC counts in the database, inside the plan's history
 * window (it is SECURITY INVOKER, so RLS on analytics_views /
 * analytics_events applies).
 */
export interface AnalyticsSummary {
  views: number;
  visitors: number;
  leads: number;
  conversions: number;
  /** lead_type → count; an empty type is 'contact', as it always was here. */
  leadsByType: Record<string, number>;
  /** Mean ms from arrival to first response, or null with none responded to. */
  avgResponseMs: number | null;
  /** Calendar days in the viewer's zone, oldest first; 'YYYY-MM-DD'. */
  byDay: Array<{ day: string; views: number; visitors: number }>;
  /** Event counts by type; `label` is the link's label for link_click only. */
  events: Array<{ type: string; label: string | null; count: number }>;
}

export const EMPTY_SUMMARY: AnalyticsSummary = {
  views: 0,
  visitors: 0,
  leads: 0,
  conversions: 0,
  leadsByType: {},
  avgResponseMs: null,
  byDay: [],
  events: [],
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const toCount = (value: unknown): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const records = (value: unknown): Record<string, unknown>[] =>
  (Array.isArray(value) ? (value as unknown[]) : []).filter(isRecord);

/** Reads the RPC's jsonb defensively; anything missing reads as zero. */
export function toAnalyticsSummary(raw: Json | null | undefined): AnalyticsSummary {
  if (!isRecord(raw)) return EMPTY_SUMMARY;
  const byType = isRecord(raw.leads_by_type) ? raw.leads_by_type : {};
  const avg = raw.avg_response_ms;
  return {
    views: toCount(raw.views),
    visitors: toCount(raw.visitors),
    leads: toCount(raw.leads),
    conversions: toCount(raw.conversions),
    leadsByType: Object.fromEntries(Object.entries(byType).map(([k, v]) => [k, toCount(v)])),
    avgResponseMs: avg === null || avg === undefined ? null : toCount(avg),
    byDay: records(raw.by_day).map((d) => ({
      day: String(d.day ?? ''),
      views: toCount(d.views),
      visitors: toCount(d.visitors),
    })),
    events: records(raw.events).map((e) => ({
      type: String(e.type ?? ''),
      label: typeof e.label === 'string' ? e.label : null,
      count: toCount(e.count),
    })),
  };
}

/** 'YYYY-MM-DD' → 'Oct 28', read as a local calendar date (not UTC midnight). */
export function formatDayLabel(day: string): string {
  const [y, m, d] = day.split('-').map(Number);
  if (!y || !m || !d) return day;
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/** The viewer's IANA zone, so a day on the chart is the agent's day. */
function localTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
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

  // Views, visitors, leads, conversions, the by-day chart and the interaction
  // breakdown for the window, counted in the database (US-239).
  const {
    data: summary = EMPTY_SUMMARY,
    isLoading: summaryLoading,
    isError: summaryError,
    error: summaryErrorObj,
    refetch: refetchSummary,
  } = useQuery({
    queryKey: ['analytics-summary', user?.id, timeRange],
    queryFn: async () => {
      if (!user?.id) return EMPTY_SUMMARY;
      const { data, error } = await supabase.rpc('analytics_summary', {
        p_since: cutoffDate,
        p_tz: localTimeZone(),
      });
      if (error) throw error;
      return toAnalyticsSummary(data);
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // The latest leads, for the table and the channel breakdown. No total comes
  // from here any more: this page stops at 500.
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
        // The attribution columns ride along on the query that is already
        // running — the breakdown is one aggregate over this page, not a
        // query per lead (US-189).
        .select(
          'id, name, created_at, lead_type, status, encrypted_email, encrypted_phone, first_responded_at, utm_source, utm_medium, utm_campaign, referrer_url, device'
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

  // The preceding window, counted the same way. It throws on error: it used to
  // read a failed query's missing data as zero, and a zero previous period is
  // what turns every trend into "+100%". A failed comparison now shows none.
  const { data: previousSummary } = useQuery({
    queryKey: ['analytics-previous', user?.id, timeRange],
    queryFn: async () => {
      if (!user?.id) return EMPTY_SUMMARY;
      const { data, error } = await supabase.rpc('analytics_summary', {
        p_since: previousCutoffDate,
        p_until: cutoffDate,
        p_tz: localTimeZone(),
      });
      if (error) throw error;
      return toAnalyticsSummary(data);
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const stats = {
    totalViews: summary.views,
    uniqueVisitors: summary.visitors,
    totalLeads: summary.leads,
    /** Percentage points, not a formatted string — callers format it. */
    conversionRate: summary.views > 0 ? (summary.leads / summary.views) * 100 : 0,
    /**
     * Mean minutes between a lead arriving and the agent first responding, over
     * the leads that were responded to; null when none has been yet. US-087:
     * this was hardcoded 0 and shown on the KPI cards as though measured.
     */
    avgResponseMinutes:
      summary.avgResponseMs === null ? null : Math.round(summary.avgResponseMs / 60000),
  };

  // Bucketed by the server in the viewer's zone, oldest first, so no day is
  // lost to a row cap and an undated view lands in no bucket.
  const viewsData: ViewsDatum[] = summary.byDay.map((day) => ({
    name: formatDayLabel(day.day),
    views: day.views,
    visitors: day.visitors,
  }));

  const leadsData: LeadsDatum[] = Object.entries(summary.leadsByType).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
  }));

  // Which channel produced the leads in this window (US-189). Grouped over the
  // page already fetched above, so it costs no extra round trip. Leads captured
  // before US-188 land in "Not recorded" rather than being credited to Direct:
  // an honest gap reads better than a wrong attribution.
  const leadsByChannel: LeadsDatum[] = groupLeadsByChannel(leads).map(({ label, count }) => ({
    name: label,
    value: count,
  }));

  // Contact taps, by method — the number an agent actually wants ("thirty
  // people tapped Call this week"). Every allowed method is listed even at
  // zero, so a week with no email taps reads as zero rather than as absence.
  const contactTaps: InteractionDatum[] = Object.entries(CONTACT_LABELS).map(([type, name]) => ({
    name,
    value: summary.events.filter((e) => e.type === type).reduce((sum, e) => sum + e.count, 0),
  }));

  const totalContactTaps = contactTaps.reduce((sum, row) => sum + row.value, 0);

  // Link clicks in the same window, per link. `links.click_count` is a lifetime
  // total and cannot answer "this month", which is what the page is asking.
  const linkClicksByLabel = summary.events
    .filter((e) => e.type === 'link_click')
    .reduce<Record<string, number>>((acc, event) => {
      const name = event.label || 'Untitled link';
      acc[name] = (acc[name] || 0) + event.count;
      return acc;
    }, {});
  const linkClicks: InteractionDatum[] = Object.entries(linkClicksByLabel)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const previousStats = {
    views: previousSummary?.views ?? 0,
    visitors: previousSummary?.visitors ?? 0,
    leads: previousSummary?.leads ?? 0,
    conversions: previousSummary?.conversions ?? 0,
  };

  return {
    stats,
    previousStats,
    /**
     * False when the preceding window holds no data at all — a first-week
     * account — or could not be read. Showing "+100%" against zero is worse
     * than showing nothing.
     */
    hasPreviousPeriod: previousStats.views + previousStats.leads > 0,
    viewsData,
    leadsData,
    leadsByChannel,
    contactTaps,
    totalContactTaps,
    linkClicks,
    totalLinkClicks: linkClicks.reduce((sum, row) => sum + row.value, 0),
    recentLeads: leads.slice(0, 10),
    isLoading: summaryLoading || leadsLoading,
    isError: summaryError || leadsError,
    error: summaryErrorObj || leadsErrorObj,
    refetch: () => {
      refetchSummary();
      refetchLeads();
    },
    timeRange,
  };
}
