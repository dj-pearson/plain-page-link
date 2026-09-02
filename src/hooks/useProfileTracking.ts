import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { getDeviceClass, getVisitorId, recordAnalyticsEvent } from '@/lib/analyticsEvents';

/**
 * Hook to track profile page views
 * Call this on the public profile page to track analytics
 */
export function useProfileTracking(userId: string | undefined, username: string) {
  useEffect(() => {
    if (!userId) return;

    const trackView = async () => {
      try {
        // One insert is now the whole story. profiles.view_count used to be
        // bumped separately by increment_profile_views, an unthrottled
        // SECURITY DEFINER RPC called from the anon client — so the headline
        // number and this table measured different things, and anyone holding
        // the anon key could inflate the headline without limit. A trigger on
        // this insert maintains the counter now, which makes the two agree by
        // construction and gives the counter US-092's throttle (US-115).
        await supabase.from('analytics_views').insert({
          user_id: userId,
          visitor_id: getVisitorId(),
          device: getDeviceClass(),
          source: document.referrer || 'direct',
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
export async function trackLinkClick(
  linkId: string,
  /** The profile the link belongs to. Without it the click is counted but not dated. */
  userId?: string,
  /** The link's title, for the dashboard's per-link breakdown. */
  label?: string | null
) {
  try {
    // increment_link_clicks is SECURITY DEFINER, so it works for anonymous
    // visitors without any UPDATE grant on `links`. There is deliberately no
    // direct-update fallback: the permissive UPDATE policy that made one
    // possible let any visitor rewrite any profile's link targets, and was
    // dropped in migration 20260806000002. A failed click count is not worth
    // reopening that.
    //
    // The visitor id is passed so the function can bucket its rate limit by
    // (visitor, link). It had no limit at all, so click_count was as inflatable
    // as view_count (US-115).
    const { error } = await supabase.rpc('increment_link_clicks', {
      link_id: linkId,
      visitor_id: getVisitorId() ?? undefined,
    });

    if (error) {
      logger.warn('Failed to increment link click count', { linkId });
    }
  } catch (error) {
    logger.error('Error tracking link click', error);
  }

  // The counter is a lifetime total on `links`; this is the dated row the
  // Analytics page needs to show clicks over a period, next to contact taps.
  if (userId) {
    await recordAnalyticsEvent({
      userId,
      eventType: 'link_click',
      targetId: linkId,
      targetLabel: label ?? null,
    });
  }
}
