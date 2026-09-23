/**
 * The agent's plan, limits and current usage — one read, the same numbers the
 * database enforces (get_plan_usage, 20260923000002).
 *
 * Every successful mutation in the app invalidates this query (see the
 * MutationCache in main.tsx), so a meter moves as soon as a listing, client or
 * open house is added or removed, without each hook having to remember to.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/useAuthStore';
import { limitStatus, type LimitStatus, type PlanLimitKey } from '@/lib/planLimits';

export const PLAN_USAGE_QUERY_KEY = ['plan-usage'] as const;

export interface PlanUsage {
  plan_name: string;
  status: string | null;
  cancel_at_period_end: boolean;
  current_period_end: string | null;
  features: Record<string, unknown>;
  limits: Partial<Record<PlanLimitKey, number>>;
  usage: Partial<Record<PlanLimitKey, number>>;
}

function toPlanUsage(data: unknown): PlanUsage | null {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
  const d = data as Record<string, unknown>;
  const numbers = (v: unknown) =>
    v && typeof v === 'object' && !Array.isArray(v)
      ? Object.fromEntries(
          Object.entries(v as Record<string, unknown>).filter(([, n]) => typeof n === 'number')
        )
      : {};
  return {
    plan_name: typeof d.plan_name === 'string' ? d.plan_name : 'free',
    status: typeof d.status === 'string' ? d.status : null,
    cancel_at_period_end: d.cancel_at_period_end === true,
    current_period_end: typeof d.current_period_end === 'string' ? d.current_period_end : null,
    features:
      d.features && typeof d.features === 'object' ? (d.features as Record<string, unknown>) : {},
    limits: numbers(d.limits) as PlanUsage['limits'],
    usage: numbers(d.usage) as PlanUsage['usage'],
  };
}

export function usePlanUsage() {
  const { user } = useAuthStore();

  const query = useQuery({
    queryKey: [...PLAN_USAGE_QUERY_KEY, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_plan_usage');
      if (error) throw error;
      return toPlanUsage(data);
    },
    enabled: !!user?.id,
    staleTime: 30 * 1000,
  });

  const plan = query.data ?? null;

  /**
   * Where a limit stands. While the plan is loading this reports "ok" with no
   * limit, so the UI neither nudges nor blocks on a guess — the database still
   * refuses anything over the line.
   */
  const status = (key: PlanLimitKey): LimitStatus => {
    if (!plan) return limitStatus(0, -1);
    const limit = plan.limits[key];
    return limitStatus(plan.usage[key] ?? 0, limit ?? 0);
  };

  return {
    plan,
    planName: plan?.plan_name ?? 'free',
    isLoading: query.isLoading,
    refetch: query.refetch,
    status,
    canAdd: (key: PlanLimitKey) => status(key).canAdd,
    hasFeature: (feature: string) => plan?.features[feature] === true,
  };
}
