-- The rest of what a plan sells, enforced.
--
-- 20260923000002 enforced the countable things an agent adds (listings,
-- clients, open houses …). This covers the remainder:
--
--   leads_per_month        Leads past the monthly allowance are still captured
--                          — a visitor's enquiry is never refused — but their
--                          contact details stay locked until the agent upgrades
--                          or the month turns. pii-crypto, notify-lead and
--                          submit-lead's Zapier hand-off all ask
--                          locked_lead_ids() before revealing anything.
--   workflows              Active follow-up sequences (workflows.is_active).
--   *_per_month quotas     Metered uses recorded in feature_usage and charged by
--                          consume_plan_quota() at the moment of use: AI listing
--                          descriptions and workflow emails today; market
--                          reports, CMA reports, virtual staging, video tours
--                          and SMS the moment those features exist — their
--                          quotas are here so the feature cannot ship unmetered.
--   customDomain           profiles.custom_domain can only be set on a plan
--                          that includes it.

-- ---------------------------------------------------------------------------
-- The limits. Kept in step with src/config/pricing-plans.ts by
-- src/lib/planLimits.test.ts.
-- ---------------------------------------------------------------------------
UPDATE public.subscription_plans p
   SET limits = p.limits || v.limits,
       updated_at = now()
  FROM (VALUES
    ('free',         '{"workflows": 0,  "ai_listing_descriptions_per_month": 0,   "emails_per_month": 0,     "sms_per_month": 0,    "market_reports_per_month": 0,  "cma_reports_per_month": 0,  "virtual_staging_photos_per_month": 0,   "video_tours_per_month": 0}'::jsonb),
    ('starter',      '{"workflows": 3,  "ai_listing_descriptions_per_month": 10,  "emails_per_month": 500,   "sms_per_month": 0,    "market_reports_per_month": 0,  "cma_reports_per_month": 0,  "virtual_staging_photos_per_month": 0,   "video_tours_per_month": 0}'::jsonb),
    ('professional', '{"workflows": 10, "ai_listing_descriptions_per_month": 25,  "emails_per_month": 2000,  "sms_per_month": 500,  "market_reports_per_month": 5,  "cma_reports_per_month": 10, "virtual_staging_photos_per_month": 20,  "video_tours_per_month": 5}'::jsonb),
    ('team',         '{"workflows": -1, "ai_listing_descriptions_per_month": 100, "emails_per_month": 10000, "sms_per_month": 2000, "market_reports_per_month": 20, "cma_reports_per_month": 50, "virtual_staging_photos_per_month": 100, "video_tours_per_month": 20}'::jsonb),
    ('enterprise',   '{"workflows": -1, "ai_listing_descriptions_per_month": -1,  "emails_per_month": -1,    "sms_per_month": -1,   "market_reports_per_month": -1, "cma_reports_per_month": -1, "virtual_staging_photos_per_month": -1,  "video_tours_per_month": -1}'::jsonb)
  ) AS v(name, limits)
 WHERE p.name = v.name;

-- feature_usage.feature_key references feature_catalog, which was never seeded.
-- One row per metered quota; the per-plan numbers live on subscription_plans,
-- so the catalog's own *_limit columns are left at their defaults.
INSERT INTO public.feature_catalog (feature_key, name, pricing_type, unit_name, category)
VALUES
  ('ai_listing_descriptions_per_month', 'AI listing descriptions', 'included', 'description', 'ai'),
  ('emails_per_month', 'Automated emails', 'included', 'email', 'automation'),
  ('sms_per_month', 'Automated texts', 'included', 'message', 'automation'),
  ('market_reports_per_month', 'Market reports', 'included', 'report', 'ai'),
  ('cma_reports_per_month', 'CMA reports', 'included', 'report', 'ai'),
  ('virtual_staging_photos_per_month', 'Virtual staging', 'included', 'photo', 'ai'),
  ('video_tours_per_month', 'Video tours', 'included', 'tour', 'ai')
ON CONFLICT (feature_key) DO NOTHING;

-- ---------------------------------------------------------------------------
-- plan_usage learns the new keys. Re-stated whole: CREATE OR REPLACE has no
-- way to add a branch.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.plan_usage(_user_id uuid, _key text, _at timestamptz DEFAULT now())
RETURNS integer
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $function$
BEGIN
  RETURN CASE
    WHEN _key = 'listings' THEN (
      SELECT count(*) FROM public.listings
       WHERE user_id = _user_id AND NOT is_sample AND status IS DISTINCT FROM 'sold')
    WHEN _key = 'sold_properties' THEN (
      SELECT count(*) FROM public.listings
       WHERE user_id = _user_id AND NOT is_sample AND status = 'sold')
    WHEN _key = 'links' THEN (
      SELECT count(*) FROM public.links WHERE user_id = _user_id AND NOT is_sample)
    WHEN _key = 'testimonials' THEN (
      SELECT count(*) FROM public.testimonials WHERE user_id = _user_id AND NOT is_sample)
    WHEN _key = 'contacts' THEN (
      SELECT count(*) FROM public.contacts WHERE user_id = _user_id)
    WHEN _key = 'workflows' THEN (
      SELECT count(*) FROM public.workflows WHERE user_id = _user_id AND is_active)
    WHEN _key = 'open_houses_per_month' THEN (
      SELECT count(*) FROM public.open_houses
       WHERE user_id = _user_id
         AND status <> 'cancelled'
         AND date_trunc('month', starts_at) = date_trunc('month', _at))
    WHEN _key = 'leads_per_month' THEN (
      SELECT count(*) FROM public.leads
       WHERE user_id = _user_id
         AND NOT is_sample
         AND created_at >= date_trunc('month', _at)
         AND created_at < date_trunc('month', _at) + interval '1 month')
    -- Everything metered by use lives in feature_usage, one row per month.
    WHEN _key LIKE '%\_per\_month' THEN (
      SELECT COALESCE(sum(usage_count), 0) FROM public.feature_usage
       WHERE user_id = _user_id
         AND feature_key = _key
         AND usage_period_start = date_trunc('month', _at))
    ELSE 0
  END;
END;
$function$;

-- ---------------------------------------------------------------------------
-- get_plan_usage reports the new keys too.
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

-- ---------------------------------------------------------------------------
-- consume_plan_quota — charge one (or _count) metered uses, or refuse.
--
-- Called by edge functions with the service role at the moment of use, before
-- the work is done (an OpenAI call, an email send). A negative _count refunds
-- a charge whose work then failed, never below zero. The row is locked for the
-- check-and-increment so two concurrent requests cannot both take the last
-- unit.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.consume_plan_quota(_user_id uuid, _key text, _count integer DEFAULT 1)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $function$
DECLARE
  v_period timestamptz := date_trunc('month', now());
  v_limit integer;
  v_used integer;
BEGIN
  IF _key NOT LIKE '%\_per\_month' THEN
    RAISE EXCEPTION 'consume_plan_quota: % is not a metered monthly quota', _key;
  END IF;

  INSERT INTO public.feature_usage (user_id, feature_key, usage_count, usage_period_start, usage_period_end)
  VALUES (_user_id, _key, 0, v_period, v_period + interval '1 month')
  ON CONFLICT (user_id, feature_key, usage_period_start) DO NOTHING;

  SELECT usage_count INTO v_used
    FROM public.feature_usage
   WHERE user_id = _user_id AND feature_key = _key AND usage_period_start = v_period
   FOR UPDATE;

  IF _count < 0 THEN
    UPDATE public.feature_usage
       SET usage_count = GREATEST(0, usage_count + _count)
     WHERE user_id = _user_id AND feature_key = _key AND usage_period_start = v_period;
    RETURN jsonb_build_object('allowed', true, 'used', GREATEST(0, v_used + _count));
  END IF;

  v_limit := public.plan_limit(_user_id, _key);
  IF v_limit <> -1 AND v_used + _count > v_limit THEN
    RETURN jsonb_build_object('allowed', false, 'used', v_used, 'limit', v_limit);
  END IF;

  UPDATE public.feature_usage
     SET usage_count = usage_count + _count
   WHERE user_id = _user_id AND feature_key = _key AND usage_period_start = v_period;

  RETURN jsonb_build_object('allowed', true, 'used', v_used + _count, 'limit', v_limit);
END;
$function$;

REVOKE ALL ON FUNCTION public.consume_plan_quota(uuid, text, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_plan_quota(uuid, text, integer) TO service_role;

-- ---------------------------------------------------------------------------
-- locked_lead_ids — which of these leads are past the agent's allowance.
--
-- A lead is locked when it is not among the first N non-sample leads of its
-- calendar month, N being the plan's leads_per_month today. So an upgrade
-- unlocks every locked lead at once, including last month's, and a lapsed plan
-- locks the overflow again. Sample leads never count and are never locked.
-- Service role only: pii-crypto, notify-lead and submit-lead ask it before
-- revealing contact details.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.locked_lead_ids(_user_id uuid, _lead_ids uuid[])
RETURNS SETOF uuid
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $function$
DECLARE
  v_limit integer := public.plan_limit(_user_id, 'leads_per_month');
BEGIN
  IF v_limit = -1 OR _lead_ids IS NULL OR cardinality(_lead_ids) = 0 THEN
    RETURN;
  END IF;

  RETURN QUERY
  WITH months AS (
    SELECT DISTINCT date_trunc('month', created_at) AS m
      FROM public.leads
     WHERE user_id = _user_id AND id = ANY(_lead_ids)
  ),
  ranked AS (
    SELECT l.id,
           row_number() OVER (PARTITION BY date_trunc('month', l.created_at)
                              ORDER BY l.created_at, l.id) AS rn
      FROM public.leads l
     WHERE l.user_id = _user_id
       AND NOT l.is_sample
       AND date_trunc('month', l.created_at) IN (SELECT m FROM months)
  )
  SELECT id FROM ranked WHERE rn > v_limit AND id = ANY(_lead_ids);
END;
$function$;

REVOKE ALL ON FUNCTION public.locked_lead_ids(uuid, uuid[]) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.locked_lead_ids(uuid, uuid[]) TO service_role;

-- ---------------------------------------------------------------------------
-- Workflows: active follow-up sequences. Checked when one is switched on.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_workflow_plan_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $function$
BEGIN
  IF auth.uid() IS NULL OR auth.uid() IS DISTINCT FROM NEW.user_id OR NOT NEW.is_active THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'INSERT' OR NOT OLD.is_active THEN
    PERFORM public.assert_within_plan(NEW.user_id, 'workflows');
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS enforce_workflow_limit ON public.workflows;
CREATE TRIGGER enforce_workflow_limit
  BEFORE INSERT OR UPDATE OF is_active ON public.workflows
  FOR EACH ROW EXECUTE FUNCTION public.enforce_workflow_plan_limit();

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
    WHEN 'workflows' THEN 'active follow-up workflows'
    ELSE _key
  END;
$function$;

-- ---------------------------------------------------------------------------
-- Custom domain: a plan feature, checked when the domain is set or changed.
-- Clearing it is always allowed, and a domain set before a plan lapsed is left
-- alone rather than silently removed from a live page.
-- ---------------------------------------------------------------------------
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
  IF NOT COALESCE((public.get_user_plan(NEW.id) -> 'features' ->> 'customDomain')::boolean, false) THEN
    RAISE EXCEPTION 'A custom domain is part of the Professional plan. Upgrade to connect yours.'
      USING ERRCODE = 'check_violation',
            DETAIL = 'plan_feature:customDomain',
            HINT = 'See /dashboard/subscription';
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS enforce_custom_domain_feature ON public.profiles;
CREATE TRIGGER enforce_custom_domain_feature
  BEFORE INSERT OR UPDATE OF custom_domain ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.enforce_custom_domain_feature();
