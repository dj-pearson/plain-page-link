import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/useAuthStore';
import { toTopListings, type TopListing } from '@/lib/listingViews';
import type { TimeRange } from '@/hooks/useAnalytics';

const RANGE_DAYS: Record<TimeRange, number> = { '7d': 7, '30d': 30, '90d': 90 };

/**
 * The agent's most-viewed listings for the Analytics range (US-325), from
 * top_listings(). The caller is auth.uid(); the database also clamps the range
 * to the plan's analytics history window, so 90 days on a 30-day plan counts 30.
 *
 * The query key carries the range, not the computed timestamp, so the cache is
 * shared across renders instead of refetching on every millisecond of drift.
 */
export const useTopListings = (range: TimeRange, limit = 5) => {
  const user = useAuthStore((s) => s.user);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['top-listings', user?.id, range, limit],
    queryFn: async (): Promise<TopListing[]> => {
      const since = new Date(Date.now() - RANGE_DAYS[range] * 24 * 60 * 60 * 1000);
      const { data: rows, error } = await supabase.rpc('top_listings', {
        p_since: since.toISOString(),
        p_limit: limit,
      });
      if (error) throw error;
      return toTopListings(rows);
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  return { listings: data ?? [], isLoading, isError, refetch };
};
