-- US-235: signed-in users could read every agent's Zapier webhook and plan.
--
-- 20260808000002 (US-073) revoked table-wide SELECT on profiles from anon and
-- re-granted only the public columns. authenticated kept table-wide SELECT,
-- and "Published profiles are publicly readable" reaches authenticated too, so
-- any free signup could `select=*` every published profile and read its
-- zapier_webhook_url (a URL that posts into the agent's CRM), its
-- notification_preferences, custom_domain, referred_by and signup_source. And
-- get_user_plan(uuid) answered for any id, so anyone signed in could read any
-- agent's plan, status and renewal date.
--
-- 1. authenticated gets the same column set as anon. Column privileges are not
--    row-aware, so this also takes the private columns away from the OWNER's
--    direct reads; the owner reads their full row through get_own_profile(),
--    which can only return auth.uid()'s row. Writes are unaffected (UPDATE is
--    still granted table-wide and scoped by the "own profile" policies); an
--    update that asks for its row back (`.select()`) must ask for public
--    columns only, or read it again through get_own_profile().
--
-- 2. get_user_plan(uuid) refuses another user's id from a browser role unless
--    the caller is an admin. Its body moves, unchanged, to
--    resolve_user_plan(uuid), which the browser cannot execute; the SQL that
--    asks for a plan that is not the caller's own -- profile_shows_branding for
--    a visitor, plan_limit inside triggers -- calls that instead.

-- ---------------------------------------------------------------------------
-- 1. Column-level SELECT for authenticated
-- ---------------------------------------------------------------------------

REVOKE SELECT ON public.profiles FROM authenticated;
GRANT SELECT (
  id, username, full_name, bio, avatar_url, theme, title,
  brokerage_name, brokerage_logo, years_experience, certifications, specialties,
  service_cities, service_zip_codes, license_number, license_state, phone,
  sms_enabled, email_display, calendly_url, instagram_url, facebook_url,
  linkedin_url, tiktok_url, youtube_url, zillow_url, realtor_com_url,
  website_url, seo_title, seo_description, og_image, created_at, is_published
) ON public.profiles TO authenticated;

-- The owner's whole row. No argument: the row is chosen by the JWT, so there is
-- no id to forge. Returns nothing without a session.
CREATE OR REPLACE FUNCTION public.get_own_profile()
 RETURNS SETOF public.profiles
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = public, extensions, pg_temp
AS $function$
  SELECT * FROM public.profiles WHERE id = auth.uid();
$function$;

COMMENT ON FUNCTION public.get_own_profile() IS
  'US-235: the caller''s own profile row, private columns included. authenticated holds SELECT on the public columns of profiles only.';

REVOKE EXECUTE ON FUNCTION public.get_own_profile() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_own_profile() TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 2. get_user_plan(uuid) answers only for the caller (or an admin)
-- ---------------------------------------------------------------------------

-- Idempotent: only rename when resolve_user_plan does not exist yet.
DO $$
BEGIN
  IF to_regprocedure('public.resolve_user_plan(uuid)') IS NULL THEN
    ALTER FUNCTION public.get_user_plan(uuid) RENAME TO resolve_user_plan;
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.resolve_user_plan(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_user_plan(uuid) TO service_role;

COMMENT ON FUNCTION public.resolve_user_plan(uuid) IS
  'US-235: the plan an agent''s subscription entitles them to, for any id. Not executable by the browser; get_user_plan is the checked entry point.';

CREATE OR REPLACE FUNCTION public.get_user_plan(_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path = public, extensions, pg_temp
AS $function$
BEGIN
  -- A request from the browser roles (PostgREST sets the role GUC) is asking
  -- for its own plan unless the caller is an admin; assert_caller_is lets the
  -- service role through. A direct database session (psql, pg_cron) is not a
  -- browser role and is trusted.
  IF current_setting('role', true) IN ('anon', 'authenticated')
     AND NOT COALESCE(public.has_role(auth.uid(), 'admin'::app_role), false) THEN
    PERFORM public.assert_caller_is(_user_id);
  END IF;
  RETURN public.resolve_user_plan(_user_id);
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.get_user_plan(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_user_plan(uuid) TO authenticated, service_role;

-- The SQL callers that ask for a plan other than the caller's own. Bodies are
-- as before (20260923000002 / 20260923000003) apart from the function called.

CREATE OR REPLACE FUNCTION public.profile_shows_branding(_user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = public, extensions, pg_temp
AS $function$
  SELECT NOT COALESCE((public.resolve_user_plan(_user_id) -> 'features' ->> 'removeBranding')::boolean, false);
$function$;

CREATE OR REPLACE FUNCTION public.plan_limit(_user_id uuid, _key text)
 RETURNS integer
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path = public, extensions, pg_temp
AS $function$
DECLARE
  v_value text;
BEGIN
  v_value := public.resolve_user_plan(_user_id) -> 'limits' ->> _key;

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

CREATE OR REPLACE FUNCTION public.enforce_custom_domain_feature()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, extensions, pg_temp
AS $function$
BEGIN
  IF auth.uid() IS NULL OR auth.uid() IS DISTINCT FROM NEW.id
     OR NEW.custom_domain IS NULL OR btrim(NEW.custom_domain) = '' THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'UPDATE' AND NEW.custom_domain IS NOT DISTINCT FROM OLD.custom_domain THEN
    RETURN NEW;
  END IF;
  IF NOT COALESCE((public.resolve_user_plan(NEW.id) -> 'features' ->> 'customDomain')::boolean, false) THEN
    RAISE EXCEPTION 'A custom domain is part of the Professional plan. Upgrade to connect yours.'
      USING ERRCODE = 'check_violation',
            DETAIL = 'plan_feature:customDomain',
            HINT = 'See /dashboard/subscription';
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_plan_usage()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
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

  v_plan := public.resolve_user_plan(v_uid);

  FOREACH v_key IN ARRAY ARRAY[
    'listings', 'sold_properties', 'links', 'testimonials', 'contacts',
    'open_houses_per_month', 'leads_per_month', 'analytics_days', 'workflows',
    'ai_listing_descriptions_per_month', 'emails_per_month', 'sms_per_month',
    'market_reports_per_month', 'cma_reports_per_month',
    'virtual_staging_photos_per_month', 'video_tours_per_month'
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
