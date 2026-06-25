/**
 * Conversion Funnel widget
 *
 * Visualizes the lead lifecycle: Visitors → Leads → Contacted → Qualified →
 * Converted, with per-stage counts and drop-off percentages. Data is derived
 * from analytics_views (visitors) and the leads table status distribution.
 */

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/useAuthStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type Period = '7d' | '30d' | '90d' | 'all';

const PERIOD_DAYS: Record<Exclude<Period, 'all'>, number> = { '7d': 7, '30d': 30, '90d': 90 };

interface LeadStatusRow {
  status: string;
}

interface ViewsCountChain extends PromiseLike<{ count: number | null }> {
  gte: (c: string, v: string) => ViewsCountChain;
}

function sinceISO(period: Period): string | null {
  if (period === 'all') return null;
  const ms = PERIOD_DAYS[period] * 24 * 60 * 60 * 1000;
  return new Date(Date.now() - ms).toISOString();
}

const STAGE_COLORS = ['#6366f1', '#7c3aed', '#9333ea', '#a855f7', '#22c55e'];

export function ConversionFunnel() {
  const { user } = useAuthStore();
  const [period, setPeriod] = useState<Period>('30d');

  const { data, isLoading } = useQuery({
    queryKey: ['conversion-funnel', user?.id, period],
    enabled: !!user?.id,
    queryFn: async () => {
      const since = sinceISO(period);

      // Visitors from analytics_views (table not in generated types — isolated cast).
      // The chain is PromiseLike so it can be awaited with or without .gte().
      const viewsClient = supabase as unknown as {
        from: (t: string) => {
          select: (
            c: string,
            o: { count: 'exact'; head: true }
          ) => {
            eq: (c: string, v: string) => ViewsCountChain;
          };
        };
      };
      let visitors = 0;
      try {
        let q: ViewsCountChain = viewsClient
          .from('analytics_views')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user!.id);
        if (since) q = q.gte('viewed_at', since);
        const { count } = await q;
        visitors = count ?? 0;
      } catch {
        visitors = 0;
      }

      // Lead statuses (leads is typed; status select is fine).
      let leadQuery = supabase.from('leads').select('status').eq('user_id', user!.id);
      if (since) leadQuery = leadQuery.gte('created_at', since);
      const { data: leadRows, error } = await leadQuery;
      if (error) throw error;

      return { visitors, leads: (leadRows ?? []) as LeadStatusRow[] };
    },
  });

  const stages = useMemo(() => {
    const leads = data?.leads ?? [];
    const visitors = data?.visitors ?? 0;
    const total = leads.length;
    const contacted = leads.filter((l) => l.status !== 'new' && l.status !== 'lost').length;
    const qualified = leads.filter((l) =>
      ['qualified', 'nurturing', 'converted', 'closed'].includes(l.status)
    ).length;
    const converted = leads.filter((l) => ['converted', 'closed'].includes(l.status)).length;

    return [
      { label: 'Visitors', value: visitors },
      { label: 'Leads', value: total },
      { label: 'Contacted', value: contacted },
      { label: 'Qualified', value: qualified },
      { label: 'Converted', value: converted },
    ];
  }, [data]);

  const maxValue = Math.max(1, stages[0].value);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>Conversion Funnel</CardTitle>
            <CardDescription>From visitors to closed deals</CardDescription>
          </div>
          <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
            <SelectTrigger className="w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="py-8 text-center text-sm text-muted-foreground">Loading funnel…</div>
        ) : (
          <div className="space-y-2">
            {stages.map((stage, i) => {
              const prev = i === 0 ? null : stages[i - 1].value;
              const dropPct = prev && prev > 0 ? Math.round((stage.value / prev) * 100) : null;
              const widthPct = Math.max(6, Math.round((stage.value / maxValue) * 100));
              return (
                <div key={stage.label} className="flex items-center gap-3">
                  <div className="w-20 flex-shrink-0 text-right text-xs text-muted-foreground sm:w-24 sm:text-sm">
                    {stage.label}
                  </div>
                  <div className="flex-1">
                    <div
                      className="flex h-9 items-center rounded-md px-3 text-sm font-semibold text-white transition-all"
                      style={{
                        width: `${widthPct}%`,
                        minWidth: '3rem',
                        backgroundColor: STAGE_COLORS[i],
                      }}
                    >
                      {stage.value.toLocaleString()}
                    </div>
                  </div>
                  <div className="w-14 flex-shrink-0 text-xs text-muted-foreground">
                    {dropPct !== null ? `${dropPct}%` : ''}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
