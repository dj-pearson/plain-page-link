-- US-225: lead totals from the database, not from whichever page is loaded.
--
-- The Leads page loads 50 rows at a time, filtered by the status in the URL,
-- and its New / Contacted / Converted cards counted those loaded rows: pick
-- "New" and Contacted and Converted read 0, and Total never passed the rows
-- scrolled so far. Analytics called the same paged hook with no filter, so its
-- funnel and lead-source table described the latest 50 leads of all time,
-- mixed with visitor numbers bound to the chosen date range — Converted could
-- exceed Contacted.
--
-- SECURITY INVOKER: RLS applies as usual, and the WHERE limits it to leads the
-- caller owns (RLS alone would also count leads assigned to them).

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
         FROM (SELECT source, count(*) AS n, count(*) FILTER (WHERE status = 'converted') AS c
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
