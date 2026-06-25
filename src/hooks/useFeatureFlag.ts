/**
 * useFeatureFlag — evaluate a feature flag for the current user.
 *
 * Loads all flags once (cached 5 minutes via TanStack Query) and evaluates
 * the requested flag client-side, so multiple flag checks share one fetch.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/useAuthStore';
import { evaluateFlag, type FeatureFlag } from '@/lib/feature-flags';

const FLAGS_STALE_TIME = 5 * 60 * 1000; // 5 minutes

async function fetchFlags(): Promise<FeatureFlag[]> {
  // feature_flags isn't in the generated types yet — isolated cast.
  const { data, error } = await (
    supabase as unknown as {
      from: (t: string) => {
        select: (c: string) => Promise<{ data: FeatureFlag[] | null; error: unknown }>;
      };
    }
  )
    .from('feature_flags')
    .select('name, enabled, rollout_percentage, user_ids');

  if (error) throw error;
  return data ?? [];
}

export function useFeatureFlags() {
  return useQuery({
    queryKey: ['feature-flags'],
    queryFn: fetchFlags,
    staleTime: FLAGS_STALE_TIME,
  });
}

/**
 * Returns whether `flagName` is enabled for the current user.
 * Defaults to false while loading or if the flag is missing (fail-closed).
 */
export function useFeatureFlag(flagName: string): { enabled: boolean; isLoading: boolean } {
  const { user } = useAuthStore();
  const { data: flags, isLoading } = useFeatureFlags();

  const flag = flags?.find((f) => f.name === flagName);
  const enabled = flag ? evaluateFlag(flag, user?.id) : false;

  return { enabled, isLoading };
}
