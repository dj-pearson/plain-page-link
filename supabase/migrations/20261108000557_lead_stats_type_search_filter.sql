-- US-557 (US-545): the Leads status chips and the Needs-attention count follow
-- the type filter and the name search too.
--
-- US-534 made lead_stats() follow the assignee filters, but with ?type=buyer
-- or a name typed into the search box the chips (New 40, In progress 12, ...)
-- and the Needs-attention badge still counted every lead, while the list below
-- showed three. lead_stats() gains the two remaining list filters, applied the
-- way the list query applies them (src/hooks/useLeads.ts leadsQuery):
--   p_lead_type  lead_type = p_lead_type            (NULL: every type)
--   p_search     name ILIKE '%' || p_search || '%'   (NULL or blank: no search)
--                Name only: email and phone are ciphertext (US-086). PostgREST
--                reads '*' in an ilike pattern as '%', so the list matches it as
--                a wildcard; replace() keeps the two counting the same rows.
-- The status filter is deliberately not an argument: the chips ARE the status
-- breakdown, and narrowing them to one status would zero every other chip.
--
-- The three-argument function is dropped first: leaving it beside a
-- five-argument one with defaults would make every named-argument call from
-- PostgREST ambiguous. Older clients that send only p_since, p_sla_hours and
-- p_assignee still resolve to this one through the defaults. Still SECURITY
-- INVOKER with the pinned search_path, so RLS decides which rows the caller can
-- read; no user id argument is trusted, so there is nothing to
-- assert_caller_is. The won filter stays equal to WON_STATUSES
-- (src/lib/wonStatusesSql.test.ts).

DROP FUNCTION IF EXISTS public.lead_stats(timestamptz, integer, text);

CREATE OR REPLACE FUNCTION public.lead_stats(
  p_since timestamptz DEFAULT NULL,
  p_sla_hours integer DEFAULT 24,
  p_assignee text DEFAULT NULL,
  p_lead_type text DEFAULT NULL,
  p_search text DEFAULT NULL
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
       AND (p_lead_type IS NULL OR lead_type = p_lead_type)
       AND (nullif(btrim(p_search), '') IS NULL
            OR name ILIKE '%' || replace(btrim(p_search), '*', '%') || '%')
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

REVOKE EXECUTE ON FUNCTION public.lead_stats(timestamptz, integer, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.lead_stats(timestamptz, integer, text, text, text) TO authenticated, service_role;
