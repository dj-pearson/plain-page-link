-- US-485: a lead the agent marks 'closed' is a conversion in the database's
-- figures too, not only in the dashboard's.
--
-- 'closed' joined the lead status vocabulary in 20261107000428 as a won
-- status, beside 'converted' (WON_STATUSES in src/lib/leadStatus.ts; the
-- Leads "Won" chip and the conversion funnel already count both). lead_stats()
-- (20260930000005) and analytics_summary() (20261028000007) still counted
-- status = 'converted' only, so moving a lead to Closed dropped it out of the
-- per-source conversion column on Analytics and out of the conversion rate and
-- its previous-period comparison.
--
-- Both functions are recreated unchanged apart from the won filter, which is
-- now status IN ('converted', 'closed'). A unit test
-- (src/lib/wonStatusesSql.test.ts) holds that list equal to WON_STATUSES.
-- Both stay SECURITY INVOKER with the pinned search_path; neither takes a user
-- id argument (the caller is auth.uid()), so there is nothing to
-- assert_caller_is. CREATE OR REPLACE keeps existing grants; they are restated
-- so this file stands on its own.

CREATE OR REPLACE FUNCTION public.lead_stats(p_since timestamptz DEFAULT NULL, p_sla_hours integer DEFAULT 24)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, extensions, pg_temp
AS $$
  WITH mine AS (
    SELECT status, coalesce(nullif(source, ''), 'website') AS source, created_at, first_responded_at
      FROM public.leads
     WHERE user_id = auth.uid()
       AND (p_since IS NULL OR created_at >= p_since)
  )
  SELECT jsonb_build_object(
    'total', (SELECT count(*) FROM mine),
    'by_status', coalesce(
      (SELECT jsonb_object_agg(coalesce(status, 'new'), n)
         FROM (SELECT status, count(*) AS n FROM mine GROUP BY status) s),
      '{}'::jsonb),
    'by_source', coalesce(
      (SELECT jsonb_agg(jsonb_build_object('source', source, 'leads', n, 'converted', c) ORDER BY n DESC)
         FROM (SELECT source, count(*) AS n,
                      count(*) FILTER (WHERE status IN ('converted', 'closed')) AS c
                 FROM mine GROUP BY source) s),
      '[]'::jsonb),
    'avg_response_ms', (
      SELECT round(avg(extract(epoch FROM first_responded_at - created_at) * 1000))
        FROM mine WHERE first_responded_at IS NOT NULL AND first_responded_at >= created_at),
    'needs_attention', (
      SELECT count(*) FROM mine
       WHERE status = 'new' AND created_at < now() - make_interval(hours => greatest(p_sla_hours, 1)))
  );
$$;

REVOKE EXECUTE ON FUNCTION public.lead_stats(timestamptz, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.lead_stats(timestamptz, integer) TO authenticated, service_role;

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
    'conversions', (SELECT count(*) FROM l WHERE status IN ('converted', 'closed')),
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
