-- US-396 (US-317): increment_link_clicks counts clicks only on a link a visitor
-- could actually see.
--
-- US-308 made unpublishing a page hide everything on it: the visitor policy on
-- links ("Anyone can view active links") now requires is_active, NOT is_sample
-- and a published owning profile. But increment_link_clicks is SECURITY
-- DEFINER and callable by anon, so it bypasses that policy. Anyone holding a
-- link id (it is in every page that was ever served, and in analytics_events
-- link_click rows) could keep raising click_count on an unpublished page, or
-- on a link the agent had switched off — numbers the agent then reads in the
-- dashboard as real visitor interest.
--
-- It also ran check_rate_limit before looking at the link at all, so every
-- call with a made-up link id wrote a rate_limit_entries row. The visibility
-- test now runs first: a call for a link nobody can see returns without
-- touching the rate-limit table or links.
--
-- The rule matches the US-308 functions (list_public_open_houses,
-- get_public_open_house, public_agent_response_hours): `is_published IS TRUE`
-- (a NULL is unpublished, as in the profile policy), unless the caller is the
-- agent. The owner is exempt so the function behaves for them exactly as it
-- did; the client already skips counting the owner's own clicks (US-265).
--
-- Signature, throttle and fire-and-forget behaviour (return quietly, never
-- raise) are unchanged from 20260902000012.

CREATE OR REPLACE FUNCTION public.increment_link_clicks(link_id uuid, visitor_id text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $function$
DECLARE
  v_allowed boolean;
  v_countable boolean;
BEGIN
  -- Only a link the "Anyone can view active links" policy would show a visitor,
  -- or any link of the caller's own.
  SELECT (l.user_id = auth.uid())
         OR (l.is_active IS TRUE AND NOT l.is_sample AND p.is_published IS TRUE)
    INTO v_countable
    FROM public.links l
    JOIN public.profiles p ON p.id = l.user_id
   WHERE l.id = increment_link_clicks.link_id;

  IF NOT COALESCE(v_countable, false) THEN
    RETURN;
  END IF;

  -- visitor_id comes from the client's localStorage and is trivially rotated,
  -- so this raises the cost of inflation rather than preventing it. Thirty
  -- clicks a minute on one link is far beyond a person tapping a link.
  SELECT rl.allowed INTO v_allowed
  FROM public.check_rate_limit(
    COALESCE(increment_link_clicks.visitor_id, 'anon') || ':' || increment_link_clicks.link_id::text,
    'link_click',
    30,
    60
  ) AS rl;

  IF NOT COALESCE(v_allowed, true) THEN
    RETURN;
  END IF;

  UPDATE public.links
     SET click_count = COALESCE(click_count, 0) + 1
   WHERE id = increment_link_clicks.link_id;
END;
$function$;

COMMENT ON FUNCTION public.increment_link_clicks(uuid, text) IS
  'US-115 / US-396: per-visitor throttled, and counts only links a visitor can see (active, not sample, page published) or the caller''s own. click_count is written only through this function; links has no anon UPDATE policy and must not get one.';

-- CREATE OR REPLACE keeps existing grants; restated so this file stands alone.
REVOKE ALL ON FUNCTION public.increment_link_clicks(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_link_clicks(uuid, text) TO anon, authenticated, service_role;
