/**
 * profiles.timezone (US-433) — the agent's IANA time zone.
 *
 * A private column: read through get_own_profile (fetchOwnProfile), written
 * under the "own profile" UPDATE policy. Its own query key, so it never
 * collides with the notification-preferences query that reads the same RPC.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/useAuthStore';
import { fetchOwnProfile } from '@/lib/ownProfile';
import { detectBrowserTimeZone, isValidTimeZone } from '@/lib/timeZone';

export const agentTimeZoneKey = (userId: string | undefined) => ['agent-timezone', userId] as const;

export function useAgentTimeZone() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  const {
    data: stored = null,
    isLoading,
    isSuccess,
  } = useQuery({
    queryKey: agentTimeZoneKey(user?.id),
    enabled: !!user?.id,
    queryFn: async (): Promise<string | null> => {
      const { data, error } = await fetchOwnProfile();
      if (error) throw error;
      const zone = data?.timezone ?? null;
      return isValidTimeZone(zone) ? zone : null;
    },
  });

  const update = useMutation({
    mutationFn: async (timeZone: string) => {
      if (!isValidTimeZone(timeZone)) throw new Error('That is not a time zone we recognise.');
      const { error } = await supabase
        .from('profiles')
        .update({ timezone: timeZone })
        .eq('id', user!.id);
      if (error) throw error;
      return timeZone;
    },
    onSuccess: (timeZone) => {
      queryClient.setQueryData(agentTimeZoneKey(user?.id), timeZone);
    },
  });

  const detected = detectBrowserTimeZone();

  return {
    /** The saved zone, or null when the agent has not set one. */
    timeZone: stored,
    /** This device's zone: what the picker offers until one is saved. */
    detected,
    isLoading,
    /** True once the stored value has been read: null then really means unset. */
    isKnown: isSuccess,
    update,
  };
}
