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
import type { AgentFactRows } from '@/lib/agentPageFacts';

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

/**
 * The raw rows behind the page builder's Stats and Testimonial blocks
 * (US-305), keyed on the agent. useAgentPageFacts turns them into figures
 * with buildAgentPageFacts as a `select`, so the cache holds plain rows and
 * this module stays as light as the entry graph needs.
 *
 * Every read here is one a visitor may already make: years_experience is a
 * public profile column (US-073), listings are public, and only published
 * testimonials are selected (sample testimonials can never be published).
 * Sample listings are not counted.
 */
export const agentPageFactsQueryOptions = (userId: string | null | undefined) =>
  queryOptions({
    queryKey: ['agent-page-facts', userId ?? null] as const,
    queryFn: async (): Promise<AgentFactRows> => {
      const id = userId as string;
      const [profile, sold, active, testimonials] = await Promise.all([
        supabase.from('profiles').select('years_experience').eq('id', id).maybeSingle(),
        supabase
          .from('listings')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', id)
          .eq('status', 'sold')
          .eq('is_sample', false),
        supabase
          .from('listings')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', id)
          .eq('status', 'active')
          .eq('is_sample', false),
        supabase
          .from('testimonials')
          .select('id, client_name, client_title, client_photo, review, rating')
          .eq('user_id', id)
          .eq('is_published', true)
          .order('sort_order', { ascending: true }),
      ]);

      const error = profile.error || sold.error || active.error || testimonials.error;
      if (error) {
        logger.error('Failed to load agent page facts', error);
        throw error;
      }

      return {
        yearsExperience: profile.data?.years_experience ?? null,
        soldListings: sold.count,
        activeListings: active.count,
        testimonials: testimonials.data ?? [],
      };
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });

/** What agentFactRowsFromPublicPage reads from the public-profile payload. */
export interface PublicPageFactSource {
  profile: { id: string; years_experience: number | null };
  listings: ReadonlyArray<{ status: string | null }> | null;
  testimonials: AgentFactRows['testimonials'] | null;
}

/**
 * The page-builder facts, derived from a public-profile payload that has
 * already been fetched, or null when that payload cannot stand in for the
 * facts query (US-316).
 *
 * For a visitor the payload holds exactly the rows the facts query counts:
 * the visitor policies on listings and testimonials exclude sample rows
 * (US-308), the facts query counts only 'active' and 'sold' (both inside the
 * page's status list), and both read published testimonials in sort_order.
 * The agent viewing their own page reads through the owner policy, which does
 * return sample listings, and the payload does not say which rows are
 * samples, so for the owner this returns null and the blocks fetch for
 * themselves.
 */
export function agentFactRowsFromPublicPage(
  page: PublicPageFactSource,
  viewerId: string | null
): AgentFactRows | null {
  if (viewerId !== null && viewerId === page.profile.id) return null;
  const listings = page.listings ?? [];
  return {
    yearsExperience: page.profile.years_experience ?? null,
    soldListings: listings.filter((l) => l.status === 'sold').length,
    activeListings: listings.filter((l) => l.status === 'active').length,
    testimonials: (page.testimonials ?? []).map((t) => ({
      id: t.id,
      client_name: t.client_name,
      client_title: t.client_title,
      client_photo: t.client_photo,
      review: t.review,
      rating: t.rating,
    })),
  };
}
