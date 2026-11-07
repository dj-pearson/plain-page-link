import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/useAuthStore';
import { toListingViewStats, type ListingViewStatsById } from '@/lib/listingViews';

const EMPTY: ListingViewStatsById = {};

/**
 * Views per listing over the last 7 and 30 days (US-263), from
 * listing_view_stats(). The caller is auth.uid(); the plan's analytics history
 * window bounds it in the database.
 *
 * `isReady` is false while loading and after a failure, so the cards show no
 * views line at all rather than a misleading "No views in 30 days".
 */
export const useListingViewStats = () => {
  const user = useAuthStore((s) => s.user);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['listing-view-stats', user?.id],
    queryFn: async () => {
      const { data: rows, error } = await supabase.rpc('listing_view_stats');
      if (error) throw error;
      return toListingViewStats(rows);
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  return { stats: data ?? EMPTY, isLoading, isError, isReady: data !== undefined };
};
