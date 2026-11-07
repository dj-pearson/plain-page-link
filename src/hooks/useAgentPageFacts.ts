import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { buildAgentPageFacts } from '@/lib/agentPageFacts';

/**
 * The agent's real figures and published testimonials, for the page builder's
 * Stats and Testimonial blocks (US-305). One query per agent, shared by every
 * block on the page through the query key.
 *
 * Every read here is one a visitor may already make: years_experience is a
 * public profile column (US-073), listings are public, and only published
 * testimonials are selected (sample testimonials can never be published —
 * testimonials_sample_not_published). Sample listings are not counted.
 */
export function useAgentPageFacts(userId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: ['agent-page-facts', userId],
    enabled: Boolean(userId) && enabled,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
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

      return buildAgentPageFacts({
        yearsExperience: profile.data?.years_experience ?? null,
        soldListings: sold.count,
        activeListings: active.count,
        testimonials: testimonials.data ?? [],
      });
    },
  });
}
