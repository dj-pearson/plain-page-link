-- US-062: Pin search_path on every SECURITY DEFINER function in public.
--
-- A SECURITY DEFINER function runs with the privileges of its owner. If it does
-- not pin search_path, the caller controls how unqualified names inside it
-- resolve -- so an attacker who can create objects in a reachable schema can
-- have the function operate on their object instead of the intended one, with
-- owner privileges. Postgres searches the temporary schema *first* for relation
-- names unless pg_temp is named explicitly, and any role can create temp
-- tables, so `CREATE TEMP TABLE leads (...)` is enough to redirect an
-- unqualified `INSERT INTO leads` inside one of these functions.
--
-- The pin is `public, extensions, pg_temp`:
--   * public     -- where these functions' own tables live.
--   * extensions -- pgcrypto and uuid-ossp are installed there, both locally
--                   (scripts/supabase-prelude.sql) and on hosted Supabase.
--                   generate_encryption_key() calls gen_random_bytes(), so a
--                   bare `public` pin would break it.
--   * pg_temp    -- named last precisely so it is searched last instead of
--                   first, which is the attack above.
--
-- ALTER FUNCTION rather than rewriting 50 bodies: it changes only the config,
-- so there is no chance of a transcription error in the logic, and it is
-- idempotent for the CI three-pass loop.
--
-- The two functions that were already pinned (search_path=public and
-- search_path=public, auth) are deliberately left alone.

ALTER FUNCTION public.auto_log_lead_status_change() SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.cancel_account_deletion(p_user_id uuid, p_cancel_reason text) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.check_feature_limit(_user_id uuid, _feature_key text) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.check_login_throttle(p_email text, p_ip_address inet, p_window_minutes integer, p_max_attempts integer) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.check_mfa_enabled(p_user_id uuid) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.check_rate_limit(p_identifier text, p_limit_type text, p_max_requests integer, p_window_seconds integer) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.check_subscription_limit(_user_id uuid, _limit_type text) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.cleanup_expired_mfa_codes() SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.cleanup_expired_sso_sessions() SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.cleanup_security_tables() SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.complete_workflow_execution(p_execution_id uuid, p_status text, p_result jsonb, p_error_message text, p_error_node_id text) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.find_or_create_sso_user(p_config_id uuid, p_email text, p_subject_id text, p_full_name text, p_groups text[], p_attributes jsonb) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.find_sso_config_by_email(p_email text) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.generate_encryption_key() SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.get_active_gsc_credential(p_user_id uuid) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.get_connected_search_platforms(p_user_id uuid) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.get_critical_alerts_count() SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.get_encrypted_fields(p_table_name text) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.get_lead_timeline(_lead_id uuid, _limit integer, _offset integer) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.get_open_alerts_count() SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.get_scheduled_workflows(p_limit integer) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.get_system_health_summary() SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.get_user_sessions(p_user_id uuid) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.get_user_statistics() SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.get_user_subscription_with_usage(_user_id uuid) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.increment_mfa_failed_attempts(p_user_id uuid) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.is_device_trusted(p_user_id uuid, p_device_fingerprint text) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.is_field_encrypted(p_table_name text, p_field_name text) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.is_gsc_token_expired(credential_id uuid) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.is_mfa_locked(p_user_id uuid) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.log_admin_action(p_admin_id uuid, p_action text, p_target_type text, p_target_id uuid, p_details jsonb, p_ip_address text, p_user_agent text) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.log_audit_event(p_user_id uuid, p_action text, p_status text, p_resource_type text, p_resource_id text, p_ip_address inet, p_user_agent text, p_details jsonb, p_risk_level text, p_actor_id uuid) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.log_encryption_operation(p_user_id uuid, p_operation text, p_table_name text, p_record_id text, p_fields text[], p_success boolean, p_error text, p_ip_address inet, p_user_agent text) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.log_error(p_user_id uuid, p_error_type text, p_error_message text, p_stack_trace text, p_user_context jsonb, p_severity text) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.log_lead_activity(_lead_id uuid, _activity_type text, _content text, _title text, _metadata jsonb) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.log_lead_call(_lead_id uuid, _outcome text, _duration_seconds integer, _notes text) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.log_lead_email(_lead_id uuid, _subject text, _recipient text, _body text) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.log_lead_status_change(_lead_id uuid, _previous_status text, _new_status text, _note text) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.log_sso_event(p_config_id uuid, p_user_id uuid, p_event_type text, p_details jsonb, p_ip_address inet, p_user_agent text) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.log_user_activity(p_user_id uuid, p_activity_type text, p_activity_data jsonb, p_page_url text) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.record_feature_usage(_user_id uuid, _feature_key text, _count integer, _metadata jsonb) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.record_login_attempt(p_email text, p_ip_address inet, p_user_id uuid, p_success boolean, p_failure_reason text, p_user_agent text, p_device_fingerprint text) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.record_system_metric(p_metric_type text, p_metric_name text, p_value numeric, p_unit text, p_metadata jsonb) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.refresh_unified_analytics(p_user_id uuid, p_start_date date, p_end_date date) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.request_account_deletion(p_user_id uuid, p_reason text, p_ip_address inet, p_user_agent text, p_grace_period_days integer) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.request_gdpr_data_export(p_user_id uuid, p_ip_address inet, p_user_agent text) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.reset_mfa_failed_attempts(p_user_id uuid) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.revoke_all_other_sessions(p_user_id uuid, p_current_session_id uuid) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.revoke_user_session(p_session_id uuid, p_user_id uuid, p_reason text) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.start_workflow_execution(p_workflow_id uuid, p_trigger_type text, p_trigger_data jsonb) SET search_path = public, extensions, pg_temp;
-- 50 functions pinned.
