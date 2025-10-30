import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

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
        let visitorId = localStorage.getItem("visitor_id");
        if (!visitorId) {
          visitorId = crypto.randomUUID();
          localStorage.setItem("visitor_id", visitorId);
        }

        // Get basic device/location info
        const device = /Mobile|Android|iPhone/i.test(navigator.userAgent)
          ? "mobile"
          : "desktop";
        
        const source = document.referrer || "direct";

        // Insert analytics view
        await supabase.from("analytics_views").insert({
          user_id: userId,
          visitor_id: visitorId,
          device,
          source,
          location: null, // Could be enhanced with geolocation API
        });
      } catch (error) {
        console.error("Error tracking profile view:", error);
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
    // Increment click count
    const { error } = await supabase.rpc("increment_link_clicks", {
      link_id: linkId,
    });

    if (error) {
      // Fallback: try direct update
      const { data: link } = await supabase
        .from("links")
        .select("click_count")
        .eq("id", linkId)
        .single();

      if (link) {
        await supabase
          .from("links")
          .update({ click_count: (link.click_count || 0) + 1 })
          .eq("id", linkId);
      }
    }
  } catch (error) {
    console.error("Error tracking link click:", error);
  }
}
