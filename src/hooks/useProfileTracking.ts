import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

/**
 * Hook to track profile page views
 * Call this on the public profile page to track analytics
 */
export function useProfileTracking(userId: string | undefined, username: string) {
  useEffect(() => {
    if (!userId) return;

    const trackView = async () => {
      try {
        // Generate or retrieve visitor ID from localStorage
        let visitorId = localStorage.getItem('visitor_id');
        if (!visitorId) {
          visitorId = crypto.randomUUID();
          localStorage.setItem('visitor_id', visitorId);
        }

        // Get basic device/location info
        const device = /Mobile|Android|iPhone/i.test(navigator.userAgent) ? 'mobile' : 'desktop';

        const source = document.referrer || 'direct';

        // Insert analytics view (table may not exist yet — fail silently)
        await supabase.from('analytics_views').insert({
          user_id: userId,
          visitor_id: visitorId,
          device,
          source,
          location: null, // Could be enhanced with geolocation API
        });
      } catch {
        // Silently ignore tracking errors (table may not exist)
      }
    };

    trackView();
  }, [userId, username]);
}

/**
 * Function to track link clicks
 * Call this when a link is clicked on the profile page
 */
export async function trackLinkClick(linkId: string) {
  try {
    // increment_link_clicks is SECURITY DEFINER, so it works for anonymous
    // visitors without any UPDATE grant on `links`. There is deliberately no
    // direct-update fallback: the permissive UPDATE policy that made one
    // possible let any visitor rewrite any profile's link targets, and was
    // dropped in migration 20260806000002. A failed click count is not worth
    // reopening that.
    const { error } = await supabase.rpc('increment_link_clicks', {
      link_id: linkId,
    });

    if (error) {
      logger.warn('Failed to increment link click count', { linkId });
    }
  } catch (error) {
    logger.error('Error tracking link click', error);
  }
}
