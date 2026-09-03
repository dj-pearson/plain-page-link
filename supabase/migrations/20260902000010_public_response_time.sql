-- US-111: a response-time badge that reflects the agent's actual responses.
--
-- The public page hard-coded responseTime: '< 1 hour', and the sticky action
-- bar repeated "Responds in < 1 hour" as literal text. Neither was computed
-- from anything. On a licensed professional's page, shown to a member of the
-- public deciding whom to contact, that is an advertising claim the platform
-- invented on the agent's behalf.
--
-- The data to make it true exists: leads.first_responded_at - created_at, set
-- by the set_lead_first_responded_at trigger and by the contact actions
-- US-101 added.
--
-- It cannot be computed in the browser. `leads` is readable only by its owner
-- and the assignee (US-097, US-105), and it must stay that way — a visitor must
-- never be able to enumerate an agent's leads. So this is a SECURITY DEFINER
-- function returning ONE aggregate number and no rows.
--
-- The MEDIAN, not the mean: one lead answered a week late would drag an average
-- badly, and the median is what "typically responds in" actually means.
--
-- NULL below a floor of 5 responded leads in the window. A median over one or
-- two responses is not a track record, and rendering nothing is better than
-- rendering a number the agent cannot stand behind — which is the whole point
-- of this story.

-- Older databases may not have received the response-tracking column from the
-- baseline. It is nullable until a lead receives its first response.
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS first_responded_at timestamp with time zone;

CREATE OR REPLACE FUNCTION public.public_agent_response_hours(_user_id uuid)
RETURNS numeric
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
  SELECT CASE
    WHEN count(*) >= 5 THEN
      round(
        percentile_cont(0.5) WITHIN GROUP (
          ORDER BY EXTRACT(EPOCH FROM (first_responded_at - created_at)) / 3600.0
        )::numeric,
        1
      )
    ELSE NULL
  END
  FROM public.leads
  WHERE user_id = _user_id
    AND first_responded_at IS NOT NULL
    AND created_at IS NOT NULL
    AND first_responded_at >= created_at
    AND created_at >= now() - INTERVAL '90 days';
$$;

COMMENT ON FUNCTION public.public_agent_response_hours(uuid) IS
  'Median hours to first response over the last 90 days, or NULL below 5 '
  'responded leads. Aggregate only — exposes no lead rows (US-111).';

-- Anon needs this for the public profile; it returns a single number and
-- cannot be used to read or infer an individual lead.
GRANT EXECUTE ON FUNCTION public.public_agent_response_hours(uuid) TO anon, authenticated;
