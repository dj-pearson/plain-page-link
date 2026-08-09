-- US-092: analytics_views accepts forged rows without limit.
--
-- "Anyone can insert analytics views" is FOR INSERT WITH CHECK (true) with no
-- TO clause, so anyone holding the anon key — which ships in the frontend
-- bundle — can insert as many view records as they like, for any profile.
--
-- The open INSERT itself stays: this is a public link-in-bio, visitors have no
-- session, and view tracking has to work for them. That is a deliberate
-- trade-off, not an accident. What was missing is any bound on it, so a single
-- visitor could inflate any agent's numbers arbitrarily — numbers the dashboard
-- presents to that agent as measurement.
--
-- A BEFORE INSERT trigger is the enforcement point rather than an edge
-- function, because the insert goes straight from the browser to PostgREST and
-- moving it would change the public tracking path for every profile.

CREATE OR REPLACE FUNCTION public.throttle_analytics_view()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $function$
DECLARE
  v_allowed boolean;
BEGIN
  -- Bucket by (profile, visitor). A visitor legitimately generates a handful of
  -- views while browsing — a few page loads, a back-navigation — so the ceiling
  -- is well above normal use and only bites on automation.
  --
  -- visitor_id comes from the client's localStorage and is trivially rotated,
  -- so this raises the cost of inflation rather than preventing it. Preventing
  -- it properly needs server-side attribution; the counters should be treated
  -- as indicative, which is what this story is really about.
  -- check_rate_limit RETURNS TABLE(allowed, remaining, reset_at), not a boolean,
  -- so the column has to be selected out of it.
  SELECT rl.allowed INTO v_allowed
  FROM public.check_rate_limit(
    coalesce(NEW.visitor_id::text, 'anon') || ':' || NEW.user_id::text,
    'analytics_view',
    30,   -- max requests
    60    -- per minute
  ) AS rl;

  IF NOT coalesce(v_allowed, true) THEN
    -- Drop the row rather than raising: a rejected view must not surface as an
    -- error on the visitor's page, and the client's insert is fire-and-forget.
    RETURN NULL;
  END IF;

  RETURN NEW;
END;
$function$;

COMMENT ON FUNCTION public.throttle_analytics_view() IS
  'US-092: bounds anonymous view-count inflation. Silently drops over-limit rows rather than erroring on a visitor page.';

DROP TRIGGER IF EXISTS throttle_analytics_views ON public.analytics_views;
CREATE TRIGGER throttle_analytics_views
  BEFORE INSERT ON public.analytics_views
  FOR EACH ROW EXECUTE FUNCTION public.throttle_analytics_view();
