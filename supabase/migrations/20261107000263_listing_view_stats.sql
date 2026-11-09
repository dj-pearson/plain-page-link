-- US-263: per-listing view counts the agent can actually see.
--
-- The public profile has recorded a 'listing_view' analytics event every time
-- a visitor opens a listing since US-227 (trackListingView in
-- src/lib/analyticsEvents.ts, fired from FullProfilePage), and the CHECK on
-- analytics_events.event_type accepts it (20260930000007). Nothing ever read
-- them back: analytics_summary() groups events by type and keeps a label only
-- for link_click, so every listing's views collapsed into one anonymous count,
-- and the dashboard Listings page showed none at all. The Landing page and
-- /features/analytics promise "see which listings visitors view most".
--
-- listing_view_stats() answers that per listing, in one aggregate. Like
-- analytics_summary() it is SECURITY INVOKER with no user id argument: the
-- caller is auth.uid(), RLS on analytics_events applies, and the plan's
-- analytics history window (analytics_visible_since, 20260923000002) is also
-- applied explicitly so that an extra SELECT policy cannot widen it.
--
-- Only the caller's own listings come back. The join on listings matters:
-- analytics_events accepts a visitor's insert with any target_id, so a forged
-- id is dropped here rather than surfacing as a phantom listing.
--
-- visitor_id is client-generated (localStorage), so visitors are indicative,
-- not measured — the same caveat as everywhere else on the Analytics page.

CREATE INDEX IF NOT EXISTS idx_analytics_events_listing_view
  ON public.analytics_events (user_id, target_id, occurred_at DESC)
  WHERE event_type = 'listing_view';

CREATE OR REPLACE FUNCTION public.listing_view_stats()
RETURNS TABLE (
  listing_id uuid,
  views_7d bigint,
  views_30d bigint,
  visitors_30d bigint,
  last_viewed_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, extensions, pg_temp
AS $$
  SELECT l.id AS listing_id,
         count(*) FILTER (WHERE e.occurred_at >= now() - interval '7 days') AS views_7d,
         count(*) AS views_30d,
         count(DISTINCT e.visitor_id) AS visitors_30d,
         max(e.occurred_at) AS last_viewed_at
    FROM public.listings l
    JOIN public.analytics_events e
      ON e.target_id = l.id
     AND e.user_id = l.user_id
   WHERE l.user_id = auth.uid()
     AND e.event_type = 'listing_view'
     AND e.occurred_at >= greatest(now() - interval '30 days',
                                   (SELECT public.analytics_visible_since()))
   GROUP BY l.id;
$$;

COMMENT ON FUNCTION public.listing_view_stats() IS
  'US-263: the caller''s own listings with listing_view counts over 7 and 30 days, inside the plan analytics window. SECURITY INVOKER; visitors are indicative (client-generated ids).';

REVOKE EXECUTE ON FUNCTION public.listing_view_stats() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.listing_view_stats() TO authenticated, service_role;
