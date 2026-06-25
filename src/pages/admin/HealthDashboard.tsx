/**
 * Platform Health Dashboard (admin-only)
 *
 * Operational overview for admins: platform metrics (users, signups, listings,
 * leads), system health (DB connectivity + latency via the health-check edge
 * function), revenue (MRR, active subscriptions by plan, churn), and trend
 * charts (signups + leads over the last 14 days). Auto-refreshes every 60s.
 */

import { Link, Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { Activity, Users, UserPlus, Building2, MessageSquare, DollarSign } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/useAuthStore';
import { edgeFunctions } from '@/lib/edgeFunctions';
import { PRICING_PLANS } from '@/config/pricing-plans';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const REFRESH_MS = 60_000;

function daysAgoISO(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

// Generic count helper for tables not (fully) in the generated types.
async function countRows(table: string, filter?: { column: string; gte: string }): Promise<number> {
  try {
    const client = supabase as unknown as {
      from: (t: string) => {
        select: (
          c: string,
          o: { count: 'exact'; head: true }
        ) => PromiseLike<{ count: number | null }> & {
          gte: (c: string, v: string) => PromiseLike<{ count: number | null }>;
        };
      };
    };
    const base = client.from(table).select('id', { count: 'exact', head: true });
    const { count } = await (filter ? base.gte(filter.column, filter.gte) : base);
    return count ?? 0;
  } catch {
    return 0;
  }
}

interface SubscriptionRow {
  plan_name: string | null;
  status: string | null;
}

async function fetchDated(table: string, column: string, since: string): Promise<string[]> {
  try {
    const client = supabase as unknown as {
      from: (t: string) => {
        select: (c: string) => {
          gte: (c: string, v: string) => Promise<{ data: Record<string, string>[] | null }>;
        };
      };
    };
    const { data } = await client.from(table).select(column).gte(column, since);
    return (data ?? []).map((r) => r[column]).filter(Boolean);
  } catch {
    return [];
  }
}

function bucketByDay(dates: string[], days: number): { date: string; count: number }[] {
  const buckets: { date: string; count: number }[] = [];
  const dayMs = 24 * 60 * 60 * 1000;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today.getTime() - i * dayMs);
    buckets.push({
      date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      count: 0,
    });
  }
  const startMs = today.getTime() - (days - 1) * dayMs;
  for (const iso of dates) {
    const t = new Date(iso).getTime();
    const idx = Math.floor((t - startMs) / dayMs);
    if (idx >= 0 && idx < buckets.length) buckets[idx].count++;
  }
  return buckets;
}

export default function HealthDashboard() {
  const { user, role } = useAuthStore();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-health'],
    enabled: role === 'admin',
    refetchInterval: REFRESH_MS,
    queryFn: async () => {
      const since7 = daysAgoISO(7);
      const since14 = daysAgoISO(14);

      const [
        totalUsers,
        newSignups,
        activeUsers,
        totalListings,
        totalLeads,
        signupDates,
        leadDates,
      ] = await Promise.all([
        countRows('profiles'),
        countRows('profiles', { column: 'created_at', gte: since7 }),
        countRows('profiles', { column: 'updated_at', gte: since7 }),
        countRows('listings'),
        countRows('leads'),
        fetchDated('profiles', 'created_at', since14),
        fetchDated('leads', 'created_at', since14),
      ]);

      // Subscriptions for revenue metrics (best-effort).
      let subs: SubscriptionRow[] = [];
      try {
        const client = supabase as unknown as {
          from: (t: string) => {
            select: (c: string) => Promise<{ data: SubscriptionRow[] | null }>;
          };
        };
        const { data: subData } = await client
          .from('user_subscriptions')
          .select('plan_name, status');
        subs = subData ?? [];
      } catch {
        subs = [];
      }

      // DB health via the health-check edge function.
      let dbHealth: { connected: boolean; latency_ms: number | null } = {
        connected: false,
        latency_ms: null,
      };
      try {
        const { data: hc } = await edgeFunctions.invoke('health-check', {});
        if (hc?.database) dbHealth = hc.database;
      } catch {
        /* leave as disconnected */
      }

      return {
        totalUsers,
        newSignups,
        activeUsers,
        totalListings,
        totalLeads,
        signups: bucketByDay(signupDates, 14),
        leads: bucketByDay(leadDates, 14),
        subs,
        dbHealth,
      };
    },
  });

  if (!user || role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  // Revenue metrics from subscriptions + pricing config.
  const activeSubs = (data?.subs ?? []).filter((s) => s.status === 'active');
  const canceledSubs = (data?.subs ?? []).filter((s) => s.status === 'canceled');
  const planPrice = (name: string | null): number => {
    const plan = PRICING_PLANS.find((p) => p.id === (name ?? '').toLowerCase());
    return plan?.price_monthly ?? 0;
  };
  const mrr = activeSubs.reduce((sum, s) => sum + planPrice(s.plan_name), 0);
  const byPlan = activeSubs.reduce<Record<string, number>>((acc, s) => {
    const key = s.plan_name ?? 'unknown';
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
  const totalLifecycle = activeSubs.length + canceledSubs.length;
  const churnRate =
    totalLifecycle > 0 ? Math.round((canceledSubs.length / totalLifecycle) * 100) : 0;

  const metricCards = [
    { label: 'Total Users', value: data?.totalUsers, icon: <Users className="h-5 w-5" /> },
    { label: 'Active (7d)', value: data?.activeUsers, icon: <Activity className="h-5 w-5" /> },
    { label: 'New Signups (7d)', value: data?.newSignups, icon: <UserPlus className="h-5 w-5" /> },
    {
      label: 'Total Listings',
      value: data?.totalListings,
      icon: <Building2 className="h-5 w-5" />,
    },
    { label: 'Total Leads', value: data?.totalLeads, icon: <MessageSquare className="h-5 w-5" /> },
  ];

  return (
    <div className="mx-auto max-w-7xl p-6">
      <div className="mb-6">
        <Link to="/admin" className="text-sm text-primary hover:underline">
          ← Back to Admin
        </Link>
        <h1 className="text-2xl font-bold text-foreground">Platform Health</h1>
        <p className="text-muted-foreground">Auto-refreshes every 60 seconds</p>
      </div>

      {/* System health */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>System Health</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-6">
          <div className="flex items-center gap-2">
            <span
              className={`inline-block h-3 w-3 rounded-full ${
                data?.dbHealth.connected ? 'bg-green-500' : 'bg-red-500'
              }`}
            />
            <span className="text-sm">
              Database: {data?.dbHealth.connected ? 'Connected' : 'Unreachable'}
              {data?.dbHealth.latency_ms != null && ` (${data.dbHealth.latency_ms}ms)`}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`inline-block h-3 w-3 rounded-full ${
                data?.dbHealth.connected ? 'bg-green-500' : 'bg-gray-400'
              }`}
            />
            <span className="text-sm">
              Edge Functions: {data?.dbHealth.connected ? 'Responding' : 'Unknown'}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Metric cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {metricCards.map((m) => (
          <Card key={m.label}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground">{m.icon}</div>
              <div className="mt-2 text-2xl font-bold text-foreground">
                {isLoading ? '…' : (m.value ?? 0).toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">{m.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            <CardTitle>Revenue</CardTitle>
          </div>
          <CardDescription>Based on active subscriptions and plan pricing</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <div className="text-2xl font-bold text-foreground">${mrr.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">MRR (est.)</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-foreground">{activeSubs.length}</div>
            <div className="text-xs text-muted-foreground">Active subscriptions</div>
            <div className="mt-1 text-xs text-muted-foreground">
              {Object.entries(byPlan)
                .map(([p, c]) => `${p}: ${c}`)
                .join(' · ') || 'No active plans'}
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-foreground">{churnRate}%</div>
            <div className="text-xs text-muted-foreground">Churn rate</div>
          </div>
        </CardContent>
      </Card>

      {/* Trends */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Signups (14d)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={data?.signups ?? []}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" fontSize={11} />
                <YAxis allowDecimals={false} fontSize={11} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Leads (14d)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={data?.leads ?? []}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" fontSize={11} />
                <YAxis allowDecimals={false} fontSize={11} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#22c55e"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
