/**
 * The agent's custom CSS, sanitised and scoped for their public page (US-514).
 *
 * The stored text comes from profileCustomCssQueryOptions, which the public
 * profile query normally seeds from its one payload, so this makes no request
 * of its own on /:username. What it returns has been through sanitizeCustomCss:
 * every selector is prefixed with the profile container's class, and nothing
 * that loads from another origin survives. '' when there is nothing to apply.
 */
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { profileCustomCssQueryOptions } from '@/lib/publicProfileSideQueries';
import { sanitizeCustomCss } from '@/lib/customCss';

export function useProfileCustomCss(agentId: string | null | undefined): string {
  const { data } = useQuery(profileCustomCssQueryOptions(agentId));
  return useMemo(() => sanitizeCustomCss(data).css, [data]);
}
