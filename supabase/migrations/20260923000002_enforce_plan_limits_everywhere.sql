-- Plan limits that hold, for everything a plan sells that the product has.
--
-- Before this, three different things answered "what may this agent do":
--
--   * get_user_plan()  — subscription_plans via user_subscriptions, with the
--                        US-118 grace rules (paid through a cancellation, seven
--                        days past a failed payment). The pricing page and
--                        useSubscription read this.
--   * subscriptions    — a flat copy stripe-webhook writes max_listings /
--                        max_links / max_testimonials into. The US-080 triggers
--                        and useSubscriptionLimits read this. Nothing downgrades
--                        it when a period lapses, so an agent whose cancelled
--                        plan ran out kept its limits.
--   * nothing at all   — sold properties, clients, open houses, analytics
--                        history and profile branding were sold per tier and
--                        enforced nowhere.
--
-- This makes get_user_plan the one authority. plan_limit() and plan_usage()
-- answer from it, every metered table is guarded by a trigger that asks them, and
-- get_plan_usage() hands the dashboard the same numbers the triggers use, so a
-- meter cannot say "2 of 3" while the database says "no".
--
-- What is metered, and how:
--
--   listings                active (not sold) listings, sample data excluded
--   sold_properties         sold listings, sample data excluded
--   links, testimonials     rows, sample data excluded
--   contacts                the client sphere (20260923000001)
--   open_houses_per_month   non-cancelled open houses starting in a calendar month
--   analytics_days          how far back analytics_views / analytics_events read
--   removeBranding          whether the public profile shows "Powered by"
--
-- leads_per_month is reported but NOT enforced: a lead is a visitor's enquiry,
-- and turning one away because of the agent's tier loses the agent business
-- and tells the visitor nothing. It drives an upgrade nudge instead.
--
-- Only an owner acting on their own rows is metered, as in US-080: anonymous
-- inserts (a visitor's review) and the service role (webhooks, backfills) pass.

-- ---------------------------------------------------------------------------
-- The new limits, on the plans that sell them. Kept in step with
-- src/config/pricing-plans.ts by src/lib/planLimits.test.ts.
-- ---------------------------------------------------------------------------
UPDATE public.subscription_plans p
   SET limits = p.limits || v.limits,
       features = p.features || v.features,
       updated_at = now()
  FROM (VALUES
    ('free',         '{"contacts": 50,   "open_houses_per_month": 0}'::jsonb,  '{"openHouseManagement": false}'::jsonb),
    ('starter',      '{"contacts": 500,  "open_houses_per_month": 5}'::jsonb,  '{"openHouseManagement": true}'::jsonb),
    ('professional', '{"contacts": 2500, "open_houses_per_month": 15}'::jsonb, '{"openHouseManagement": true}'::jsonb),
    ('team',         '{"contacts": -1,   "open_houses_per_month": -1}'::jsonb, '{"openHouseManagement": true}'::jsonb),
    ('enterprise',   '{"contacts": -1,   "open_houses_per_month": -1}'::jsonb, '{"openHouseManagement": true}'::jsonb)
  ) AS v(name, limits, features)
 WHERE p.name = v.name;

-- ---------------------------------------------------------------------------
-- plan_limit / plan_usage — the two questions every check asks.
--
-- Internal: not granted to anon or authenticated. get_user_plan takes any user
-- id, and these would too; callers outside the database go through
-- get_plan_usage(), which answers for auth.uid() only.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.plan_limit(_user_id uuid, _key text)
RETURNS integer
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $function$
DECLARE
  v_value text;
BEGIN
  v_value := public.get_user_plan(_user_id) -> 'limits' ->> _key;

  -- A plan that does not mention a key gets the free plan's answer for it,
  -- and a key no plan mentions gets zero: the most restrictive reading, never
  -- NULL (which every comparison would treat as "not less than", failing open
  -- or shut depending on how it was written).
  IF v_value IS NULL THEN
    SELECT limits ->> _key INTO v_value
      FROM public.subscription_plans
     WHERE name = 'free';
  END IF;

  RETURN COALESCE(v_value::integer, 0);
END;
$function$;

CREATE OR REPLACE FUNCTION public.plan_usage(_user_id uuid, _key text, _at timestamptz DEFAULT now())
RETURNS integer
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $function$
BEGIN
  RETURN CASE _key
    WHEN 'listings' THEN (
      SELECT count(*) FROM public.listings
       WHERE user_id = _user_id AND NOT is_sample AND status IS DISTINCT FROM 'sold')
    WHEN 'sold_properties' THEN (
      SELECT count(*) FROM public.listings
       WHERE user_id = _user_id AND NOT is_sample AND status = 'sold')
    WHEN 'links' THEN (
      SELECT count(*) FROM public.links WHERE user_id = _user_id AND NOT is_sample)
    WHEN 'testimonials' THEN (
      SELECT count(*) FROM public.testimonials WHERE user_id = _user_id AND NOT is_sample)
    WHEN 'contacts' THEN (
      SELECT count(*) FROM public.contacts WHERE user_id = _user_id)
    WHEN 'open_houses_per_month' THEN (
      SELECT count(*) FROM public.open_houses
       WHERE user_id = _user_id
         AND status <> 'cancelled'
         AND date_trunc('month', starts_at) = date_trunc('month', _at))
    WHEN 'leads_per_month' THEN (
      SELECT count(*) FROM public.leads
       WHERE user_id = _user_id
         AND NOT is_sample
         AND created_at >= date_trunc('month', _at)
         AND created_at < date_trunc('month', _at) + interval '1 month')
    ELSE 0
  END;
END;
$function$;

REVOKE ALL ON FUNCTION public.plan_limit(uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.plan_usage(uuid, text, timestamptz) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.plan_limit(uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.plan_usage(uuid, text, timestamptz) TO service_role;

-- ---------------------------------------------------------------------------
-- get_plan_usage — the dashboard's single read: the caller's plan, its limits
-- and features, and current usage of every metered key.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_plan_usage()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_plan jsonb;
  v_limits jsonb := '{}'::jsonb;
  v_usage jsonb := '{}'::jsonb;
  v_key text;
BEGIN
  IF v_uid IS NULL THEN
    RETURN NULL;
  END IF;

  v_plan := public.get_user_plan(v_uid);

  FOREACH v_key IN ARRAY ARRAY[
    'listings', 'sold_properties', 'links', 'testimonials', 'contacts',
    'open_houses_per_month', 'leads_per_month', 'analytics_days'
  ] LOOP
    v_limits := v_limits || jsonb_build_object(v_key, public.plan_limit(v_uid, v_key));
    IF v_key <> 'analytics_days' THEN
      v_usage := v_usage || jsonb_build_object(v_key, public.plan_usage(v_uid, v_key));
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'plan_name', v_plan ->> 'plan_name',
    'status', v_plan ->> 'status',
    'cancel_at_period_end', COALESCE((v_plan ->> 'cancel_at_period_end')::boolean, false),
    'current_period_end', v_plan -> 'current_period_end',
    'features', COALESCE(v_plan -> 'features', '{}'::jsonb),
    'limits', v_limits,
    'usage', v_usage
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.get_plan_usage() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_plan_usage() TO authenticated;

-- ---------------------------------------------------------------------------
-- check_subscription_limit — kept for its callers, answered by the new pair.
-- It read the flat `subscriptions` copy, which does not lapse with the plan.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.check_subscription_limit(_user_id uuid, _limit_type text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $function$
DECLARE
  v_limit integer := public.plan_limit(_user_id, _limit_type);
BEGIN
  IF v_limit = -1 THEN
    RETURN true;
  END IF;
  RETURN public.plan_usage(_user_id, _limit_type) < v_limit;
END;
$function$;

-- ---------------------------------------------------------------------------
-- Enforcement: one trigger function for every metered table.
-- ---------------------------------------------------------------------------

-- What the limit is called in the message an agent reads.
CREATE OR REPLACE FUNCTION public.plan_limit_label(_key text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public, extensions, pg_temp
AS $function$
  SELECT CASE _key
    WHEN 'listings' THEN 'active listings'
    WHEN 'sold_properties' THEN 'sold properties'
    WHEN 'links' THEN 'links'
    WHEN 'testimonials' THEN 'testimonials'
    WHEN 'contacts' THEN 'clients'
    WHEN 'open_houses_per_month' THEN 'open houses this month'
    ELSE _key
  END;
$function$;

-- Raises the error the app recognises. The message is written for the agent,
-- because some screens show a database error as-is; the DETAIL carries the
-- machine-readable key (see isPlanLimitError in src/lib/planLimits.ts).
CREATE OR REPLACE FUNCTION public.assert_within_plan(_user_id uuid, _key text, _at timestamptz DEFAULT now())
RETURNS void
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $function$
DECLARE
  v_limit integer := public.plan_limit(_user_id, _key);
BEGIN
  IF v_limit = -1 THEN
    RETURN;
  END IF;
  IF public.plan_usage(_user_id, _key, _at) >= v_limit THEN
    RAISE EXCEPTION '%', CASE
        WHEN v_limit = 0 THEN
          format('Your plan does not include %s. Upgrade to add them.', public.plan_limit_label(_key))
        ELSE
          format('Your plan allows %s %s. Upgrade to add more.', v_limit, public.plan_limit_label(_key))
      END
      USING ERRCODE = 'check_violation',
            DETAIL = 'plan_limit:' || _key,
            HINT = 'See /dashboard/subscription';
  END IF;
END;
$function$;

REVOKE ALL ON FUNCTION public.assert_within_plan(uuid, text, timestamptz) FROM PUBLIC, anon, authenticated;

-- One trigger function per table shape: verify:schema holds each trigger
-- function to the columns of every table it is attached to, and a shared
-- function branching on TG_TABLE_NAME names columns some of them lack.

-- links, testimonials: a row is a unit; sample rows are free.
CREATE OR REPLACE FUNCTION public.enforce_plan_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $function$
BEGIN
  -- Only the owner acting on their own account is metered. See the header.
  IF auth.uid() IS NULL OR auth.uid() IS DISTINCT FROM NEW.user_id OR NEW.is_sample THEN
    RETURN NEW;
  END IF;
  PERFORM public.assert_within_plan(NEW.user_id, TG_TABLE_NAME);
  RETURN NEW;
END;
$function$;

COMMENT ON FUNCTION public.enforce_plan_limit() IS
  '20260923000002: links and testimonials, answered by get_user_plan via plan_limit/plan_usage.';

-- listings: counted against `listings` while for sale and `sold_properties`
-- once sold. Checked on entering a bucket; an update that stays in the same
-- bucket (editing the price) costs nothing.
CREATE OR REPLACE FUNCTION public.enforce_listing_plan_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $function$
BEGIN
  IF auth.uid() IS NULL OR auth.uid() IS DISTINCT FROM NEW.user_id OR NEW.is_sample THEN
    RETURN NEW;
  END IF;

  IF NEW.status = 'sold' THEN
    IF TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'sold' OR OLD.is_sample THEN
      PERFORM public.assert_within_plan(NEW.user_id, 'sold_properties');
    END IF;
  ELSIF TG_OP = 'INSERT' OR OLD.status = 'sold' OR OLD.is_sample THEN
    PERFORM public.assert_within_plan(NEW.user_id, 'listings');
  END IF;
  RETURN NEW;
END;
$function$;

-- contacts: the client sphere.
CREATE OR REPLACE FUNCTION public.enforce_contact_plan_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $function$
BEGIN
  IF auth.uid() IS NULL OR auth.uid() IS DISTINCT FROM NEW.user_id THEN
    RETURN NEW;
  END IF;
  PERFORM public.assert_within_plan(NEW.user_id, 'contacts');
  RETURN NEW;
END;
$function$;

-- open_houses: counted by the month they happen in. Checked when one is
-- scheduled, moved to another month, or brought back from cancelled.
CREATE OR REPLACE FUNCTION public.enforce_open_house_plan_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $function$
BEGIN
  IF auth.uid() IS NULL OR auth.uid() IS DISTINCT FROM NEW.user_id OR NEW.status = 'cancelled' THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'INSERT'
     OR OLD.status = 'cancelled'
     OR date_trunc('month', OLD.starts_at) <> date_trunc('month', NEW.starts_at) THEN
    PERFORM public.assert_within_plan(NEW.user_id, 'open_houses_per_month', NEW.starts_at);
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS enforce_listing_limit ON public.listings;
CREATE TRIGGER enforce_listing_limit
  BEFORE INSERT OR UPDATE OF status, is_sample ON public.listings
  FOR EACH ROW EXECUTE FUNCTION public.enforce_listing_plan_limit();

DROP TRIGGER IF EXISTS enforce_link_limit ON public.links;
CREATE TRIGGER enforce_link_limit
  BEFORE INSERT ON public.links
  FOR EACH ROW EXECUTE FUNCTION public.enforce_plan_limit();

DROP TRIGGER IF EXISTS enforce_testimonial_limit ON public.testimonials;
CREATE TRIGGER enforce_testimonial_limit
  BEFORE INSERT ON public.testimonials
  FOR EACH ROW EXECUTE FUNCTION public.enforce_plan_limit();

DROP TRIGGER IF EXISTS enforce_contact_limit ON public.contacts;
CREATE TRIGGER enforce_contact_limit
  BEFORE INSERT ON public.contacts
  FOR EACH ROW EXECUTE FUNCTION public.enforce_contact_plan_limit();

DROP TRIGGER IF EXISTS enforce_open_house_limit ON public.open_houses;
CREATE TRIGGER enforce_open_house_limit
  BEFORE INSERT OR UPDATE OF starts_at, status ON public.open_houses
  FOR EACH ROW EXECUTE FUNCTION public.enforce_open_house_plan_limit();

-- ---------------------------------------------------------------------------
-- Analytics history: the owner reads back only as far as the plan allows.
-- Rows are kept — upgrading shows the older history again immediately.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.analytics_visible_since()
RETURNS timestamptz
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $function$
DECLARE
  v_days integer;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN 'infinity'::timestamptz;
  END IF;
  v_days := public.plan_limit(auth.uid(), 'analytics_days');
  IF v_days = -1 THEN
    RETURN '-infinity'::timestamptz;
  END IF;
  RETURN date_trunc('day', now()) - make_interval(days => v_days);
END;
$function$;

REVOKE ALL ON FUNCTION public.analytics_visible_since() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.analytics_visible_since() TO authenticated;

-- `(SELECT …)` makes the planner evaluate it once per query, not once per row.
DROP POLICY IF EXISTS "Users can view their own analytics" ON public.analytics_views;
CREATE POLICY "Users can view their own analytics"
  ON public.analytics_views FOR SELECT TO authenticated
  USING (auth.uid() = user_id AND viewed_at >= (SELECT public.analytics_visible_since()));

DROP POLICY IF EXISTS "Agents read their own interactions" ON public.analytics_events;
CREATE POLICY "Agents read their own interactions"
  ON public.analytics_events FOR SELECT TO authenticated
  USING (auth.uid() = user_id AND occurred_at >= (SELECT public.analytics_visible_since()));

-- ---------------------------------------------------------------------------
-- Branding: whether a profile shows "Powered by AgentBio". Public, because the
-- profile page is; it reveals nothing the rendered page does not.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.profile_shows_branding(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $function$
  SELECT NOT COALESCE((public.get_user_plan(_user_id) -> 'features' ->> 'removeBranding')::boolean, false);
$function$;

GRANT EXECUTE ON FUNCTION public.profile_shows_branding(uuid) TO anon, authenticated;
