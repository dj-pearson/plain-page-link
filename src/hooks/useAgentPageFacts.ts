import { useQuery } from '@tanstack/react-query';
import { buildAgentPageFacts } from '@/lib/agentPageFacts';
import { agentPageFactsQueryOptions } from '@/lib/publicProfileSideQueries';

/**
 * The agent's real figures and published testimonials, for the page builder's
 * Stats and Testimonial blocks (US-305). One query per agent, shared by every
 * block on the page through the query key.
 *
 * On /:username the public-profile read seeds this query from the payload it
 * already holds (US-316), so the blocks make no request of their own there.
 * The editor's preview, and the owner viewing their own page, fetch here.
 */
export function useAgentPageFacts(userId: string | undefined, enabled = true) {
  return useQuery({
    ...agentPageFactsQueryOptions(userId),
    enabled: Boolean(userId) && enabled,
    select: buildAgentPageFacts,
  });
}
