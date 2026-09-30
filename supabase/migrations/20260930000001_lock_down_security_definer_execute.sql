-- US-213: SECURITY DEFINER functions were executable by anyone holding the anon key.
--
-- Supabase's default privileges grant EXECUTE on every new function in `public`
-- to anon and authenticated, and the squashed baseline contains no GRANT or
-- REVOKE at all. So each of the 93 SECURITY DEFINER functions — which run with
-- the owner's privileges and bypass RLS — was an anonymous RPC unless a later
-- migration had revoked it by hand (only the plan-limit helpers had).
--
-- The worst of them, reproduced as `anon` against a database built from these
-- migrations:
--
--   SELECT request_account_deletion('<any profile id>', 'x', NULL, NULL, -1);
--   SELECT process_scheduled_account_deletions();
--
-- deleted the victim's auth.users row on the spot. Profile ids are public.
-- get_user_sessions('<any id>') returned another user's IPs and locations, and
-- log_admin_action let anyone forge the admin audit trail.
--
-- The fix is deny-by-default: revoke EXECUTE on every SECURITY DEFINER function
-- in `public` from PUBLIC, anon and authenticated, keep it for service_role
-- (every edge function that calls these uses the service-role client, except
-- get-sessions), then grant back the few the browser is meant to call — each
-- one either public by design or checking auth.uid() itself.
--
-- Trigger functions lose nothing: EXECUTE is checked when a trigger is created,
-- not when it fires. RLS policies that call has_role / is_team_admin /
-- is_team_member are evaluated as the querying role, so those three stay
-- callable.
--
-- scripts/verify-schema.mjs now fails on any SECURITY DEFINER function callable
-- by anon or authenticated that is not in its DEFINER_CALLABLE allowlist, and on
-- any supabase.rpc() in src/ the browser roles cannot execute. A function added
-- by a later migration inherits Supabase's default EXECUTE grant, so it must
-- either REVOKE it or be added to that list with a reason.

-- ---------------------------------------------------------------------------
-- Deny by default.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  f record;
BEGIN
  FOR f IN
    SELECT p.oid::regprocedure AS sig
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
     WHERE n.nspname = 'public'
       AND p.prosecdef
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon, authenticated', f.sig);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', f.sig);
  END LOOP;
END;
$$;

-- ---------------------------------------------------------------------------
-- A guard for functions that take the subject's id as an argument.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.assert_caller_is(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
BEGIN
  IF coalesce(auth.role(), '') = 'service_role' THEN
    RETURN;
  END IF;
  IF p_user_id IS NULL OR p_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Not allowed for another user'
      USING ERRCODE = 'insufficient_privilege';
  END IF;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.assert_caller_is(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.assert_caller_is(uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.assert_caller_is_admin()
RETURNS void
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
BEGIN
  IF coalesce(auth.role(), '') = 'service_role' THEN
    RETURN;
  END IF;
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Admin only' USING ERRCODE = 'insufficient_privilege';
  END IF;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.assert_caller_is_admin() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.assert_caller_is_admin() TO service_role;

-- ---------------------------------------------------------------------------
-- Account deletion: service role only (gdpr-deletion), and never immediate.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.request_account_deletion(p_user_id uuid, p_reason text DEFAULT NULL::text, p_ip_address inet DEFAULT NULL::inet, p_user_agent text DEFAULT NULL::text, p_grace_period_days integer DEFAULT 30)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
DECLARE
  v_request_id UUID;
  v_scheduled_for TIMESTAMPTZ;
  v_existing_deletion UUID;
  -- The grace period is the only undo an erasure has. A caller cannot shorten
  -- it: a negative value used to schedule the deletion in the past, so the
  -- next process_scheduled_account_deletions() run executed it at once.
  v_grace_days INTEGER := greatest(coalesce(p_grace_period_days, 30), 30);
BEGIN
  PERFORM public.assert_caller_is(p_user_id);

  v_scheduled_for := now() + make_interval(days => v_grace_days);

  SELECT id INTO v_existing_deletion
  FROM account_deletion_scheduled
  WHERE user_id = p_user_id
    AND cancelled = false
    AND executed = false;

  IF v_existing_deletion IS NOT NULL THEN
    RAISE EXCEPTION 'An account deletion is already scheduled. Cancel it first to create a new request.';
  END IF;

  INSERT INTO gdpr_data_requests (
    user_id, request_type, status, scheduled_deletion_at, ip_address, user_agent
  )
  VALUES (
    p_user_id, 'deletion', 'pending', v_scheduled_for, p_ip_address, p_user_agent
  )
  RETURNING id INTO v_request_id;

  INSERT INTO account_deletion_scheduled (
    user_id, gdpr_request_id, reason, scheduled_for, ip_address
  )
  VALUES (
    p_user_id, v_request_id, p_reason, v_scheduled_for, p_ip_address
  );

  PERFORM log_audit_event(
    p_user_id,
    'account_deletion_request',
    'success',
    'account',
    p_user_id::TEXT,
    p_ip_address,
    p_user_agent,
    jsonb_build_object(
      'reason', p_reason,
      'scheduled_for', v_scheduled_for,
      'grace_period_days', v_grace_days
    ),
    'critical'
  );

  RETURN v_request_id;
END;
$function$;

-- ---------------------------------------------------------------------------
-- Called by the browser, so each checks who is asking.
-- ---------------------------------------------------------------------------

-- get-sessions calls this with the user's own JWT.
CREATE OR REPLACE FUNCTION public.get_user_sessions(p_user_id uuid)
 RETURNS TABLE(id uuid, ip_address inet, user_agent text, device_type text, browser text, os text, location_city text, location_country text, is_current boolean, last_activity_at timestamp with time zone, created_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
BEGIN
  PERFORM public.assert_caller_is(p_user_id);
  RETURN QUERY
  SELECT
    s.id, s.ip_address, s.user_agent, s.device_type,
    s.browser, s.os, s.location_city, s.location_country,
    s.is_current, s.last_activity_at, s.created_at
  FROM user_sessions s
  WHERE s.user_id = p_user_id
    AND s.revoked = false
    AND s.expires_at > now()
  ORDER BY s.is_current DESC, s.last_activity_at DESC;
END;
$function$;

-- Admin panel.
CREATE OR REPLACE FUNCTION public.get_user_statistics()
 RETURNS TABLE(total_users bigint, active_users_24h bigint, active_users_7d bigint, admin_count bigint, users_with_subscriptions bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
BEGIN
  PERFORM public.assert_caller_is_admin();
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM auth.users)::BIGINT,
    (SELECT COUNT(DISTINCT user_id) FROM user_activity_log WHERE created_at > NOW() - INTERVAL '24 hours')::BIGINT,
    (SELECT COUNT(DISTINCT user_id) FROM user_activity_log WHERE created_at > NOW() - INTERVAL '7 days')::BIGINT,
    (SELECT COUNT(DISTINCT user_id) FROM user_roles WHERE role = 'admin')::BIGINT,
    (SELECT COUNT(DISTINCT user_id) FROM subscriptions WHERE status = 'active')::BIGINT;
END;
$function$;

-- Admin panel. The recorded admin is always the caller: anyone could previously
-- write an entry in any admin's name.
CREATE OR REPLACE FUNCTION public.log_admin_action(p_admin_id uuid, p_action text, p_target_type text DEFAULT NULL::text, p_target_id uuid DEFAULT NULL::uuid, p_details jsonb DEFAULT '{}'::jsonb, p_ip_address text DEFAULT NULL::text, p_user_agent text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
DECLARE
  v_log_id UUID;
BEGIN
  PERFORM public.assert_caller_is_admin();
  PERFORM public.assert_caller_is(p_admin_id);

  INSERT INTO admin_audit_log (
    admin_id, action, target_type, target_id, details, ip_address, user_agent
  ) VALUES (
    p_admin_id, p_action, p_target_type, p_target_id, p_details, p_ip_address, p_user_agent
  )
  RETURNING id INTO v_log_id;
  RETURN v_log_id;
END;
$function$;

-- Admin panel.
CREATE OR REPLACE FUNCTION public.top_slow_queries(p_limit integer DEFAULT 10)
 RETURNS TABLE(query_hash text, endpoint text, max_ms integer, avg_ms numeric, calls bigint)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
BEGIN
  PERFORM public.assert_caller_is_admin();
  RETURN QUERY
  SELECT m.query_hash,
         m.endpoint,
         MAX(m.duration_ms) AS max_ms,
         ROUND(AVG(m.duration_ms), 0) AS avg_ms,
         COUNT(*) AS calls
  FROM public.query_metrics m
  WHERE m.created_at >= now() - INTERVAL '24 hours'
  GROUP BY m.query_hash, m.endpoint
  ORDER BY max_ms DESC
  LIMIT p_limit;
END;
$function$;

-- The workflow builder's Run button. Anyone who knew a workflow id could start
-- executions of it and inflate its counters.
CREATE OR REPLACE FUNCTION public.start_workflow_execution(p_workflow_id uuid, p_trigger_type text, p_trigger_data jsonb DEFAULT '{}'::jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
DECLARE
  v_workflow workflows%ROWTYPE;
  v_execution_id UUID;
BEGIN
  SELECT * INTO v_workflow FROM workflows WHERE id = p_workflow_id AND is_active = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Workflow not found or not active';
  END IF;

  PERFORM public.assert_caller_is(v_workflow.user_id);

  INSERT INTO workflow_executions (
    workflow_id, user_id, workflow_version,
    status, trigger_type, trigger_data,
    started_at, timeout_at
  )
  VALUES (
    p_workflow_id, v_workflow.user_id, v_workflow.version,
    'running', p_trigger_type, p_trigger_data,
    now(), now() + interval '1 hour'
  )
  RETURNING id INTO v_execution_id;

  UPDATE workflows
  SET
    execution_count = execution_count + 1,
    last_executed_at = now(),
    updated_at = now()
  WHERE id = p_workflow_id;

  RETURN v_execution_id;
END;
$function$;

-- Search-analytics settings: the caller's own connections only.
CREATE OR REPLACE FUNCTION public.get_connected_search_platforms(p_user_id uuid)
 RETURNS TABLE(platform text, is_connected boolean, last_sync timestamp with time zone, credential_status text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
  SELECT public.assert_caller_is(p_user_id);
  SELECT 'google_analytics' as platform,
         EXISTS(SELECT 1 FROM public.ga4_oauth_credentials WHERE user_id = p_user_id AND is_active = true) as is_connected,
         (SELECT MAX(last_synced_at) FROM public.ga4_properties WHERE user_id = p_user_id) as last_sync,
         CASE
           WHEN EXISTS(SELECT 1 FROM public.ga4_oauth_credentials WHERE user_id = p_user_id AND is_active = true AND expires_at > now()) THEN 'active'
           WHEN EXISTS(SELECT 1 FROM public.ga4_oauth_credentials WHERE user_id = p_user_id AND is_active = true) THEN 'expired'
           ELSE 'not_connected'
         END as credential_status

  UNION ALL

  SELECT 'google_search_console' as platform,
         EXISTS(SELECT 1 FROM public.gsc_oauth_credentials WHERE user_id = p_user_id AND is_active = true) as is_connected,
         (SELECT MAX(last_synced_at) FROM public.gsc_properties WHERE user_id = p_user_id) as last_sync,
         CASE
           WHEN EXISTS(SELECT 1 FROM public.gsc_oauth_credentials WHERE user_id = p_user_id AND is_active = true AND expires_at > now()) THEN 'active'
           WHEN EXISTS(SELECT 1 FROM public.gsc_oauth_credentials WHERE user_id = p_user_id AND is_active = true) THEN 'expired'
           ELSE 'not_connected'
         END as credential_status

  UNION ALL

  SELECT 'bing_webmaster' as platform,
         EXISTS(SELECT 1 FROM public.bing_webmaster_oauth_credentials WHERE user_id = p_user_id AND is_active = true) as is_connected,
         (SELECT MAX(last_synced_at) FROM public.bing_webmaster_sites WHERE user_id = p_user_id) as last_sync,
         CASE
           WHEN EXISTS(SELECT 1 FROM public.bing_webmaster_oauth_credentials WHERE user_id = p_user_id AND is_active = true AND expires_at > now()) THEN 'active'
           WHEN EXISTS(SELECT 1 FROM public.bing_webmaster_oauth_credentials WHERE user_id = p_user_id AND is_active = true) THEN 'expired'
           ELSE 'not_connected'
         END as credential_status

  UNION ALL

  SELECT 'yandex_webmaster' as platform,
         EXISTS(SELECT 1 FROM public.yandex_webmaster_oauth_credentials WHERE user_id = p_user_id AND is_active = true) as is_connected,
         (SELECT MAX(last_synced_at) FROM public.yandex_webmaster_sites WHERE user_id = p_user_id) as last_sync,
         CASE
           WHEN EXISTS(SELECT 1 FROM public.yandex_webmaster_oauth_credentials WHERE user_id = p_user_id AND is_active = true AND expires_at > now()) THEN 'active'
           WHEN EXISTS(SELECT 1 FROM public.yandex_webmaster_oauth_credentials WHERE user_id = p_user_id AND is_active = true) THEN 'expired'
           ELSE 'not_connected'
         END as credential_status;
$function$;


-- Admin panel.
CREATE OR REPLACE FUNCTION public.get_system_health_summary()
 RETURNS TABLE(metric_type text, avg_value numeric, min_value numeric, max_value numeric, count bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
BEGIN
  PERFORM public.assert_caller_is_admin();
  RETURN QUERY
  SELECT
    sm.metric_type,
    AVG(sm.value)::NUMERIC,
    MIN(sm.value)::NUMERIC,
    MAX(sm.value)::NUMERIC,
    COUNT(*)::BIGINT
  FROM system_metrics sm
  WHERE sm.recorded_at > NOW() - INTERVAL '1 hour'
  GROUP BY sm.metric_type;
END;
$function$;

-- ---------------------------------------------------------------------------
-- Grant back what the browser calls. Mirrors DEFINER_CALLABLE in
-- scripts/verify-schema.mjs.
-- ---------------------------------------------------------------------------

-- Public by design: visitors call these, or RLS policies evaluated for
-- visitors do.
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_team_admin(uuid, uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_team_member(uuid, uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_username_available(text, uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.list_public_open_houses(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_open_house(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_link_clicks(uuid, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.profile_shows_branding(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.public_agent_response_hours(uuid) TO anon, authenticated;

-- Signed-in agents; each checks auth.uid() (or admin) itself.
GRANT EXECUTE ON FUNCTION public.get_plan_usage() TO authenticated;
GRANT EXECUTE ON FUNCTION public.analytics_visible_since() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_plan(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_sessions(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_connected_search_platforms(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_lead_activity(uuid, text, text, text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_lead_call(uuid, text, integer, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_lead_email(uuid, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.start_workflow_execution(uuid, text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_statistics() TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_admin_action(uuid, text, text, uuid, jsonb, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.top_slow_queries(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_system_health_summary() TO authenticated;
