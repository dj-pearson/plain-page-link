/**
 * Whether a public profile shows "Powered by AgentBio".
 *
 * Removing it is a paid feature (removeBranding). The answer comes from
 * profile_shows_branding (20260923000002), which reads the agent's plan the
 * same way every other limit does. Until it answers the footer stays hidden,
 * so a paying agent's page never flashes the branding they paid to remove.
 *
 * The public profile query starts this same read alongside its own (US-307),
 * so on a profile page it is normally already answered when this mounts.
 */
import { useQuery } from '@tanstack/react-query';
import { profileShowsBrandingQueryOptions } from '@/lib/publicProfileSideQueries';

export function useProfileShowsBranding(agentId: string | null | undefined): boolean {
  const { data } = useQuery(profileShowsBrandingQueryOptions(agentId));
  return data === true;
}
