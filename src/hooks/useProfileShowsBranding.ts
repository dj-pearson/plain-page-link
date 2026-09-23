/**
 * Whether a public profile shows "Powered by AgentBio".
 *
 * Removing it is a paid feature (removeBranding). The answer comes from
 * profile_shows_branding (20260923000002), which reads the agent's plan the
 * same way every other limit does. Until it answers the footer stays hidden,
 * so a paying agent's page never flashes the branding they paid to remove.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useProfileShowsBranding(agentId: string | null | undefined): boolean {
  const { data } = useQuery({
    queryKey: ['profile-shows-branding', agentId],
    queryFn: async () => {
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
  return data === true;
}
