-- US-325 (US-273, a slice of US-141): "Top listings" on the Analytics page.
--
-- Landing (src/pages/public/Landing.tsx) and /features/analytics promise "see
-- which listings visitors view most". US-263 put per-listing view counts on the
-- Listings page through listing_view_stats(), but that function has fixed 7-
-- and 30-day windows and the Analytics page is driven by a 7d / 30d / 90d range
-- picker, so the page that the promise points at still had no listing figures.
--
-- top_listings(p_since, p_limit) ranks the caller's own listings by
-- listing_view events since p_since. It follows the same rules as
-- analytics_summary() and listing_view_stats():
--   * SECURITY INVOKER with search_path pinned, and no user id argument: the
--     caller is auth.uid() and RLS on analytics_events applies as usual;
--   * the plan's analytics history window (analytics_visible_since,
--     20260923000002) is applied explicitly as well, so a 90-day request on a
--     30-day plan counts 30 days and an extra SELECT policy cannot widen it;
--   * the join on listings (same owner) drops events whose target_id names
--     another agent's listing — a visitor can insert any target_id.
-- p_limit is clamped to 1..50 so a caller cannot ask for an unbounded result.
--
-- Visitors are counted from a client-generated id, so they are indicative.
-- The partial index idx_analytics_events_listing_view (20261107000263) serves
-- the (user_id, target_id, occurred_at) scan.

CREATE OR REPLACE FUNCTION public.top_listings(
  p_since timestamptz,
  p_limit integer DEFAULT 5
)
RETURNS TABLE (
  listing_id uuid,
  address text,
  city text,
  status text,
  views bigint,
  visitors bigint,
  last_viewed_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, extensions, pg_temp
AS $$
  SELECT l.id AS listing_id,
         l.address,
         l.city,
         l.status,
         count(*) AS views,
         count(DISTINCT e.visitor_id) AS visitors,
         max(e.occurred_at) AS last_viewed_at
    FROM public.listings l
    JOIN public.analytics_events e
      ON e.target_id = l.id
     AND e.user_id = l.user_id
   WHERE l.user_id = auth.uid()
     AND e.event_type = 'listing_view'
     AND e.occurred_at >= greatest(coalesce(p_since, now() - interval '30 days'),
                                   (SELECT public.analytics_visible_since()))
   GROUP BY l.id, l.address, l.city, l.status
   ORDER BY count(*) DESC, max(e.occurred_at) DESC, l.id
   LIMIT least(greatest(coalesce(p_limit, 5), 1), 50);
$$;

COMMENT ON FUNCTION public.top_listings(timestamptz, integer) IS
  'US-325: the caller''s own listings ranked by listing_view events since p_since, inside the plan analytics window. SECURITY INVOKER; visitors are indicative (client-generated ids).';

REVOKE EXECUTE ON FUNCTION public.top_listings(timestamptz, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.top_listings(timestamptz, integer) TO authenticated, service_role;
