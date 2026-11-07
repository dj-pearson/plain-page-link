/**
 * The two public-profile reads that are keyed on the agent id but are not part
 * of the profile payload itself (US-307, slice of US-287):
 *
 *   - profile_shows_branding — whether "Powered by AgentBio" shows; and
 *   - list_public_open_houses — the upcoming open houses section.
 *
 * Each is owned by its own hook (useProfileShowsBranding, usePublicOpenHouses),
 * which only mounts once FullProfilePage has rendered the profile. That made
 * them a third serial round trip: profile row, then the six related reads,
 * then these two. publicProfileQueryOptions now starts both under these same
 * keys the moment it knows the agent id, alongside the six related reads, and
 * the hooks find the request already in flight (or finished) and do not issue
 * another.
 *
 * Since US-329 both answers normally arrive inside get_public_profile_page's
 * single payload, and usePublicProfile seeds them under these keys instead;
 * the prefetch above remains for the table-read fallback.
 *
 * This module is imported by usePublicProfile, which is in the entry graph.
 * Keep it as light as that file: the Supabase client, react-query and the
 * logger only — no edge-function, pii or lead helpers.
 */
import { queryOptions } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { logger } from '@/lib/logger';

export type PublicOpenHouse =
  Database['public']['Functions']['list_public_open_houses']['Returns'][number];

/** Whether the agent's public page shows "Powered by AgentBio". */
export const profileShowsBrandingQueryOptions = (agentId: string | null | undefined) =>
  queryOptions({
    queryKey: ['profile-shows-branding', agentId ?? null] as const,
    queryFn: async (): Promise<boolean> => {
      const { data, error } = await supabase.rpc('profile_shows_branding', {
        _user_id: agentId as string,
      });
      // On error, show it: the free plan's answer is the safe default.
      if (error) return true;
      return data !== false;
    },
    enabled: !!agentId,
    staleTime: 10 * 60 * 1000,
  });

/** Upcoming public open houses for a profile page. */
export const publicOpenHousesQueryOptions = (agentId: string | null | undefined) =>
  queryOptions({
    queryKey: ['public-open-houses', agentId ?? null] as const,
    queryFn: async (): Promise<PublicOpenHouse[]> => {
      if (!agentId) return [];
      const { data, error } = await supabase.rpc('list_public_open_houses', { _user_id: agentId });
      if (error) {
        // A profile page must render without this section rather than fail.
        logger.error('Could not load public open houses', error);
        return [];
      }
      return data ?? [];
    },
    enabled: !!agentId,
    staleTime: 5 * 60 * 1000,
  });
