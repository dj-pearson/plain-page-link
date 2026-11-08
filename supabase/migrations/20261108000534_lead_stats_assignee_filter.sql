-- US-534 (US-526): the Leads status chips and the Needs-attention count follow
-- the assignee filter.
--
-- US-515 gave the owner a "who holds it" filter on the Leads list
-- (?assignee=unassigned or a teammate's id), and US-226 a member's
-- "Assigned to me" filter. lead_stats() kept counting every lead the caller
-- owns, so with either filter applied the chips (New 40, In progress 12, ...)
-- and the Needs-attention badge described leads the list was not showing.
--
-- lead_stats() gains p_assignee:
--   NULL          every lead the caller owns (unchanged; Analytics uses this)
--   'unassigned'  the caller's leads nobody holds
--   <uuid text>   leads held by that person among the caller's own leads and
--                 the leads assigned to the caller, which is the row set the
--                 list query uses (src/hooks/useLeads.ts leadsQuery:
--                 user_id = me OR assigned_to = me, then the assignee filter)
-- The comparison is on assigned_to::text, so a malformed value matches nothing
-- instead of raising a cast error.
--
-- The old two-argument function is dropped first: leaving it beside a
-- three-argument one with defaults would make every named-argument call from
-- PostgREST ambiguous. Still SECURITY INVOKER with the pinned search_path, so
-- RLS decides which rows the caller can read (an assignee reads the leads
-- assigned to them through the existing assignee policy); no user id argument
-- is trusted, so there is nothing to assert_caller_is. The won filter stays
-- equal to WON_STATUSES (src/lib/wonStatusesSql.test.ts).

DROP FUNCTION IF EXISTS public.lead_stats(timestamptz, integer);

CREATE OR REPLACE FUNCTION public.lead_stats(
  p_since timestamptz DEFAULT NULL,
  p_sla_hours integer DEFAULT 24,
  p_assignee text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, extensions, pg_temp
AS $$
  WITH mine AS (
    SELECT status, coalesce(nullif(source, ''), 'website') AS source, created_at, first_responded_at
      FROM public.leads
     WHERE (p_since IS NULL OR created_at >= p_since)
       AND CASE
             WHEN p_assignee IS NULL THEN user_id = auth.uid()
             WHEN p_assignee = 'unassigned' THEN user_id = auth.uid() AND assigned_to IS NULL
             ELSE (user_id = auth.uid() OR assigned_to = auth.uid())
                  AND assigned_to::text = lower(p_assignee)
           END
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

REVOKE EXECUTE ON FUNCTION public.lead_stats(timestamptz, integer, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.lead_stats(timestamptz, integer, text) TO authenticated, service_role;
