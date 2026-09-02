-- US-115: the headline counters and the analytics rows measured different things.
--
-- Three separate problems, all of them about numbers an agent is shown as
-- measurement:
--
--   1. profiles.view_count came from increment_profile_views, a SECURITY
--      DEFINER RPC callable by anon with no throttle at all. US-092 put a
--      ceiling on analytics_views inserts, but nothing on this — so the two
--      numbers drifted apart by design, and anyone holding the anon key (it
--      ships in the frontend bundle) could loop the RPC and inflate any
--      agent's headline view count without limit.
--
--   2. increment_link_clicks had the same shape and the same absence of any
--      bound.
--
--   3. Call, email and text taps were logger.info'd on the visitor's own
--      console and nowhere else, so an agent never learned that thirty people
--      tapped Call this week — the single most useful thing a link-in-bio page
--      can tell them.

-- ---------------------------------------------------------------------------
-- 1. view_count is derived from the throttled inserts, not counted separately
-- ---------------------------------------------------------------------------
-- analytics_views already has a BEFORE INSERT throttle (20260808000010) that
-- silently drops over-limit rows. Hanging the counter off the same insert makes
-- the headline number and the chart agree by construction, and gives the
-- counter the throttle for free.

CREATE OR REPLACE FUNCTION public.sync_profile_view_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $function$
BEGIN
  -- AFTER INSERT, so it only runs for rows the throttle let through.
  UPDATE public.profiles
  SET view_count = COALESCE(view_count, 0) + 1
  WHERE id = NEW.user_id;

  RETURN NULL;
END;
$function$;

COMMENT ON FUNCTION public.sync_profile_view_count() IS
  'US-115: profiles.view_count follows analytics_views, so the headline number and the chart cannot diverge.';

DROP TRIGGER IF EXISTS sync_profile_view_count ON public.analytics_views;
CREATE TRIGGER sync_profile_view_count
  AFTER INSERT ON public.analytics_views
  FOR EACH ROW EXECUTE FUNCTION public.sync_profile_view_count();

-- The RPC stays — a backfill or an admin tool may still want it — but it is no
-- longer a public write endpoint. The client no longer calls it; leaving it
-- executable by anon would leave the unthrottled path open next to the
-- throttled one.
--
-- FROM PUBLIC, not just FROM anon, authenticated. Postgres grants EXECUTE on a
-- new function to PUBLIC by default, and a revoke from the two role names
-- leaves that default in place — verified by execution: `SET ROLE anon; SELECT
-- increment_profile_views(...)` still succeeded and still bumped the counter.
REVOKE EXECUTE ON FUNCTION public.increment_profile_views(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_profile_views(uuid) TO service_role;

COMMENT ON FUNCTION public.increment_profile_views(uuid) IS
  'US-115: no longer the public view-count path — analytics_views drives the counter. Service-role only.';

-- ---------------------------------------------------------------------------
-- 2. increment_link_clicks gets the same per-visitor ceiling
-- ---------------------------------------------------------------------------
-- The one-argument version has to go rather than be overloaded: a call with a
-- single argument would match both it and a two-argument version with a
-- default, which Postgres rejects as ambiguous.
DROP FUNCTION IF EXISTS public.increment_link_clicks(uuid);

CREATE FUNCTION public.increment_link_clicks(link_id uuid, visitor_id text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $function$
DECLARE
  v_allowed boolean;
BEGIN
  -- Same bucketing and the same honesty as the view throttle: visitor_id comes
  -- from the client's localStorage and is trivially rotated, so this raises the
  -- cost of inflation rather than preventing it. Thirty clicks a minute on one
  -- link is far beyond a person tapping a link.
  SELECT rl.allowed INTO v_allowed
  FROM public.check_rate_limit(
    COALESCE(visitor_id, 'anon') || ':' || link_id::text,
    'link_click',
    30,
    60
  ) AS rl;

  IF NOT COALESCE(v_allowed, true) THEN
    -- Return quietly. The caller is fire-and-forget on a visitor's page, and a
    -- refused click must not surface as an error to them.
    RETURN;
  END IF;

  UPDATE public.links
  SET click_count = COALESCE(click_count, 0) + 1
  WHERE id = link_id;
END;
$function$;

COMMENT ON FUNCTION public.increment_link_clicks(uuid, text) IS
  'US-115: per-visitor throttled. click_count is written only through this function; links has no anon UPDATE policy and must not get one.';

GRANT EXECUTE ON FUNCTION public.increment_link_clicks(uuid, text) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- 3. Contact taps and link clicks become events an agent can actually see
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  -- Client-generated, same as analytics_views.visitor_id. Not an identity.
  visitor_id text,
  event_type text NOT NULL,
  /** The link that was clicked, where the event has one. */
  target_id uuid,
  /** A human label for the dashboard — the link's title, or the contact method. */
  target_label text,
  device text,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT analytics_events_type_check CHECK (
    event_type IN ('link_click', 'contact_call', 'contact_email', 'contact_text')
  )
);

CREATE INDEX IF NOT EXISTS idx_analytics_events_user_occurred
  ON public.analytics_events (user_id, occurred_at DESC);

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Public insert, like analytics_views: the visitor has no session and the
-- event happens in their browser. Unlike analytics_views' "WITH CHECK (true)",
-- this one at least requires the target profile to be published, so the table
-- cannot be used to write rows against accounts that are not public.
CREATE POLICY "Anyone can record an interaction on a published profile"
  ON public.analytics_events FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = analytics_events.user_id
        AND p.is_published = true
    )
  );

CREATE POLICY "Agents read their own interactions"
  ON public.analytics_events FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

COMMENT ON TABLE public.analytics_events IS
  'US-115: public interactions on a profile — link clicks and Call/Email/Text taps. visitor_id is client-generated, so counts are indicative.';

-- The same ceiling as views, for the same reason.
CREATE OR REPLACE FUNCTION public.throttle_analytics_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $function$
DECLARE
  v_allowed boolean;
BEGIN
  SELECT rl.allowed INTO v_allowed
  FROM public.check_rate_limit(
    COALESCE(NEW.visitor_id, 'anon') || ':' || NEW.user_id::text || ':' || NEW.event_type,
    'analytics_event',
    30,
    60
  ) AS rl;

  IF NOT COALESCE(v_allowed, true) THEN
    RETURN NULL;
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS throttle_analytics_events ON public.analytics_events;
CREATE TRIGGER throttle_analytics_events
  BEFORE INSERT ON public.analytics_events
  FOR EACH ROW EXECUTE FUNCTION public.throttle_analytics_event();
