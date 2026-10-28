-- US-239: analytics totals from the database, not from the length of a capped page.
--
-- useAnalytics fetched analytics_views with .limit(1000), leads with .limit(500)
-- and analytics_events with .limit(1000), then reported each array's length as
-- the total. An agent past 1,000 views in the window read "1,000 views", the
-- conversion rate was computed from the two capped numbers, the views-by-date
-- chart silently lost its oldest days, and the previous-period comparison was
-- capped the same way — and read an error as zero, so a failed query showed
-- "+100%".
--
-- One aggregate per window. SECURITY INVOKER, like lead_stats() and
-- campaign_conversion(): RLS applies as usual, so the plan's analytics history
-- window (20260923000002) bounds what an agent can count exactly as it bounds
-- the rows they can read. The window is also applied explicitly below, so an
-- additional SELECT policy (an admin's, say) cannot widen it for the caller's
-- own figures. There is no user id argument — the caller is auth.uid() — so
-- there is nothing to assert_caller_is.
--
-- p_tz buckets views by the agent's calendar day rather than UTC's. An unknown
-- zone name falls back to UTC instead of raising.

CREATE OR REPLACE FUNCTION public.analytics_summary(
  p_since timestamptz,
  p_until timestamptz DEFAULT NULL,
  p_tz text DEFAULT 'UTC'
)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, extensions, pg_temp
AS $$
  WITH tz AS (
    SELECT CASE WHEN EXISTS (SELECT 1 FROM pg_catalog.pg_timezone_names WHERE name = p_tz)
                THEN p_tz ELSE 'UTC' END AS name
  ), visible AS (
    SELECT public.analytics_visible_since() AS since
  ), v AS (
    SELECT viewed_at, visitor_id
      FROM public.analytics_views
     WHERE user_id = auth.uid()
       AND viewed_at >= p_since
       AND (p_until IS NULL OR viewed_at < p_until)
       AND viewed_at >= (SELECT since FROM visible)
  ), e AS (
    SELECT event_type, target_label
      FROM public.analytics_events
     WHERE user_id = auth.uid()
       AND occurred_at >= p_since
       AND (p_until IS NULL OR occurred_at < p_until)
       AND occurred_at >= (SELECT since FROM visible)
  ), l AS (
    SELECT lead_type, status, created_at, first_responded_at
      FROM public.leads
     WHERE user_id = auth.uid()
       AND created_at >= p_since
       AND (p_until IS NULL OR created_at < p_until)
  )
  SELECT jsonb_build_object(
    'views', (SELECT count(*) FROM v),
    'visitors', (SELECT count(DISTINCT visitor_id) FROM v),
    'by_day', coalesce(
      (SELECT jsonb_agg(jsonb_build_object('day', day, 'views', n, 'visitors', u) ORDER BY day)
         FROM (SELECT to_char(viewed_at AT TIME ZONE (SELECT name FROM tz), 'YYYY-MM-DD') AS day,
                      count(*) AS n, count(DISTINCT visitor_id) AS u
                 FROM v WHERE viewed_at IS NOT NULL GROUP BY 1) d),
      '[]'::jsonb),
    'leads', (SELECT count(*) FROM l),
    'conversions', (SELECT count(*) FROM l WHERE status = 'converted'),
    'leads_by_type', coalesce(
      (SELECT jsonb_object_agg(t, n)
         FROM (SELECT coalesce(nullif(lead_type, ''), 'contact') AS t, count(*) AS n FROM l GROUP BY 1) s),
      '{}'::jsonb),
    'avg_response_ms', (
      SELECT round(avg(extract(epoch FROM first_responded_at - created_at) * 1000))
        FROM l WHERE first_responded_at IS NOT NULL AND first_responded_at >= created_at),
    'events', coalesce(
      (SELECT jsonb_agg(jsonb_build_object('type', event_type, 'label', label, 'count', n) ORDER BY n DESC)
         FROM (SELECT event_type,
                      CASE WHEN event_type = 'link_click' THEN target_label END AS label,
                      count(*) AS n
                 FROM e GROUP BY 1, 2) s),
      '[]'::jsonb)
  );
$$;

REVOKE EXECUTE ON FUNCTION public.analytics_summary(timestamptz, timestamptz, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.analytics_summary(timestamptz, timestamptz, text) TO authenticated, service_role;
