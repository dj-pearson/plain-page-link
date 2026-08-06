-- US-060: squashed baseline.
--
-- Applying the previous 89 migrations to an empty database in filename order
-- failed in ten places, so a new environment could not be stood up from the
-- repo: four timestamp prefixes were duplicated (20250110, 20251031000001,
-- 20251031000002, 20251031000003) which put `keywords` and its FK to `articles`
-- before `articles` existed; several files created a table IF NOT EXISTS and
-- then indexed or added policies to columns a *later* migration adds;
-- 20260517000001 used CREATE OR REPLACE FUNCTION to rename a parameter, which
-- Postgres rejects without a DROP first; and 20260525000001 required pg_net,
-- absent from a plain Postgres. CI worked around all of it with three passes.
--
-- This file is the converged schema those 89 migrations produce, dumped from a
-- real Postgres with pg_dump --schema-only --schema=public. The originals are
-- preserved verbatim under supabase/migrations/archive/ for history; they are
-- outside the directory `supabase db push` reads, so they no longer run.
--
-- It expects the Supabase-managed objects to exist already: the auth and
-- storage schemas, auth.users, auth.uid(), and the anon/authenticated/
-- service_role roles. Hosted Supabase provides them; locally
-- scripts/supabase-prelude.sql does. Foreign keys below reference
-- auth.users(id) directly, so applying this to a bare Postgres without the
-- prelude will fail on the first such constraint.
--
-- 134 tables, 101 functions, 277 policies, 402 indexes, 80 triggers, 2 enums.
--
-- PRODUCTION: this must NOT be re-run against the existing database, which
-- already has every one of these objects. Mark it as applied instead:
--   supabase migration repair --status applied 20260806000005
-- See DEPLOYMENT.md.

--
-- PostgreSQL database dump
--



-- Dumped from database version 16.13 (Ubuntu 16.13-0ubuntu0.24.04.1)
-- Dumped by pg_dump version 16.13 (Ubuntu 16.13-0ubuntu0.24.04.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;  -- pg_dump default; DDL only, no data

-- pg_net, guarded (US-060). public.notify_lead_on_insert() calls net.http_post()
-- to reach the notify-lead edge function. Hosted Supabase ships pg_net; a plain
-- Postgres (CI, local sandboxes) does not, and an unguarded CREATE EXTENSION
-- there aborts the file -- which is one of the ten failures this baseline fixes.
-- Skip it when unavailable rather than failing: the trigger function already
-- exits quietly when its settings are unset, which is the same situation.
DO $pg_net_guard$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_available_extensions WHERE name = 'pg_net') THEN
    CREATE EXTENSION IF NOT EXISTS pg_net;
  ELSE
    RAISE NOTICE 'pg_net unavailable; skipping. Lead notification http_post will no-op.';
  END IF;
END
$pg_net_guard$;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

-- (schema public already exists)


--
-- Name: app_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.app_role AS ENUM (
    'admin',
    'user'
);


--
-- Name: subscription_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.subscription_status AS ENUM (
    'active',
    'canceled',
    'past_due',
    'incomplete',
    'trialing'
);


--
-- Name: audit_table_change(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.audit_table_change() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
    v_user_id UUID;
    v_resource_id TEXT;
    v_details JSONB;
    v_row JSONB;
BEGIN
    v_user_id := auth.uid();

    IF (TG_OP = 'DELETE') THEN
        v_row := to_jsonb(OLD);
        v_resource_id := OLD.id::text;
        v_details := jsonb_build_object('old', v_row);
    ELSIF (TG_OP = 'UPDATE') THEN
        v_row := to_jsonb(NEW);
        v_resource_id := NEW.id::text;
        v_details := jsonb_build_object('old', to_jsonb(OLD), 'new', v_row);
    ELSE -- INSERT
        v_row := to_jsonb(NEW);
        v_resource_id := NEW.id::text;
        v_details := jsonb_build_object('new', v_row);
    END IF;

    -- Best-effort subject: authenticated user, else the row's owner.
    IF v_user_id IS NULL THEN
        v_user_id := COALESCE(
            (v_row->>'user_id')::uuid,
            (v_row->>'id')::uuid
        );
    END IF;

    PERFORM log_audit_event(
        p_user_id        => v_user_id,
        p_action         => lower(TG_OP) || '_' || TG_TABLE_NAME,
        p_status         => 'success',
        p_resource_type  => TG_TABLE_NAME,
        p_resource_id    => v_resource_id,
        p_ip_address     => NULL,
        p_user_agent     => NULL,
        p_details        => v_details,
        p_risk_level     => 'low',
        p_actor_id       => auth.uid()
    );

    IF (TG_OP = 'DELETE') THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$;


--
-- Name: auto_assign_lead(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.auto_assign_lead() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_team_id UUID;
  v_rule RECORD;
  v_price NUMERIC;
  v_members UUID[];
  v_idx INTEGER;
BEGIN
  IF NEW.assigned_to IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Find the team owned by the lead's owner (the team the lead belongs to).
  SELECT id INTO v_team_id FROM public.teams WHERE owner_id = NEW.user_id LIMIT 1;
  IF v_team_id IS NULL THEN
    RETURN NEW; -- solo agent, no routing
  END IF;

  v_price := NULLIF(regexp_replace(COALESCE(NEW.price_range, ''), '[^0-9.]', '', 'g'), '')::NUMERIC;

  -- Evaluate active rules in priority order; first match wins.
  FOR v_rule IN
    SELECT * FROM public.lead_routing_rules
    WHERE team_id = v_team_id AND is_active = true
    ORDER BY priority ASC, created_at ASC
  LOOP
    IF (v_rule.criteria->>'lead_type' IS NULL OR v_rule.criteria->>'lead_type' = NEW.lead_type)
       AND (v_rule.criteria->>'source' IS NULL OR v_rule.criteria->>'source' = NEW.source)
       AND (v_rule.criteria->>'zip' IS NULL OR v_rule.criteria->>'zip' = NEW.property_address)
       AND (v_rule.criteria->>'price_min' IS NULL OR (v_price IS NOT NULL AND v_price >= (v_rule.criteria->>'price_min')::NUMERIC))
       AND (v_rule.criteria->>'price_max' IS NULL OR (v_price IS NOT NULL AND v_price <= (v_rule.criteria->>'price_max')::NUMERIC))
    THEN
      IF v_rule.assigned_to IS NOT NULL THEN
        NEW.assigned_to := v_rule.assigned_to;
        -- p_details is jsonb: do NOT cast to text (see header).
        PERFORM log_audit_event(NEW.user_id, 'lead_auto_assign', 'success', 'lead', NEW.id::text,
          NULL, NULL, jsonb_build_object('rule_id', v_rule.id, 'rule_name', v_rule.name), 'low', NULL);
        RETURN NEW;
      END IF;
    END IF;
  END LOOP;

  -- Fallback: round-robin among accepted members.
  SELECT array_agg(user_id ORDER BY invited_at) INTO v_members
  FROM public.team_members
  WHERE team_id = v_team_id AND accepted_at IS NOT NULL AND user_id IS NOT NULL;

  IF v_members IS NOT NULL AND array_length(v_members, 1) > 0 THEN
    INSERT INTO public.team_round_robin (team_id, last_index)
    VALUES (v_team_id, 0)
    ON CONFLICT (team_id) DO UPDATE
      SET last_index = (public.team_round_robin.last_index + 1) % array_length(v_members, 1)
    RETURNING last_index INTO v_idx;

    NEW.assigned_to := v_members[v_idx + 1]; -- arrays are 1-indexed
    PERFORM log_audit_event(NEW.user_id, 'lead_auto_assign', 'success', 'lead', NEW.id::text,
      NULL, NULL, jsonb_build_object('method', 'round_robin'), 'low', NULL);
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'auto_assign_lead failed: %', SQLERRM;
  RETURN NEW;
END;
$$;


--
-- Name: auto_log_lead_creation(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.auto_log_lead_creation() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.lead_activities (
    lead_id,
    user_id,
    activity_type,
    title,
    content,
    metadata
  )
  VALUES (
    NEW.id,
    NEW.user_id,
    'form_submission',
    'Lead created',
    'New lead captured from ' || COALESCE(NEW.source, 'direct'),
    jsonb_build_object(
      'source', NEW.source,
      'type', NEW.lead_type,
      'auto_logged', true
    )
  );

  RETURN NEW;
END;
$$;


--
-- Name: auto_log_lead_status_change(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.auto_log_lead_status_change() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'extensions', 'pg_temp'
    AS $$
BEGIN
  -- Only log if status actually changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.lead_activities (
      lead_id,
      user_id,
      activity_type,
      title,
      previous_status,
      new_status,
      metadata
    )
    VALUES (
      NEW.id,
      NEW.user_id,
      'status_change',
      'Status changed from ' || COALESCE(OLD.status, 'none') || ' to ' || NEW.status,
      OLD.status,
      NEW.status,
      jsonb_build_object('previous_status', OLD.status, 'new_status', NEW.status, 'auto_logged', true)
    );
  END IF;

  RETURN NEW;
END;
$$;


--
-- Name: calculate_content_freshness_score(timestamp with time zone); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.calculate_content_freshness_score(p_analyzed_at timestamp with time zone) RETURNS integer
    LANGUAGE plpgsql IMMUTABLE
    AS $$
DECLARE
  days_old INTEGER;
  freshness_score INTEGER;
BEGIN
  days_old := EXTRACT(DAY FROM now() - p_analyzed_at)::INTEGER;

  CASE
    WHEN days_old <= 7 THEN freshness_score := 100;
    WHEN days_old <= 30 THEN freshness_score := 90;
    WHEN days_old <= 90 THEN freshness_score := 75;
    WHEN days_old <= 180 THEN freshness_score := 50;
    WHEN days_old <= 365 THEN freshness_score := 25;
    ELSE freshness_score := 10;
  END CASE;

  RETURN freshness_score;
END;
$$;


--
-- Name: calculate_next_run_time(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.calculate_next_run_time(p_schedule_id uuid) RETURNS timestamp with time zone
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_frequency TEXT;
  v_time_of_day TIME;
  v_day_of_week INTEGER;
  v_day_of_month INTEGER;
  v_next_run TIMESTAMP WITH TIME ZONE;
BEGIN
  SELECT frequency, time_of_day, day_of_week, day_of_month
  INTO v_frequency, v_time_of_day, v_day_of_week, v_day_of_month
  FROM public.seo_monitoring_schedules
  WHERE id = p_schedule_id;

  CASE v_frequency
    WHEN 'hourly' THEN
      v_next_run := now() + INTERVAL '1 hour';
    WHEN 'daily' THEN
      v_next_run := (CURRENT_DATE + 1)::TIMESTAMP + COALESCE(v_time_of_day, '00:00:00'::TIME);
    WHEN 'weekly' THEN
      v_next_run := (CURRENT_DATE + ((7 + COALESCE(v_day_of_week, 0) - EXTRACT(DOW FROM CURRENT_DATE)::INTEGER) % 7))::TIMESTAMP + COALESCE(v_time_of_day, '00:00:00'::TIME);
    WHEN 'monthly' THEN
      v_next_run := (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' + (COALESCE(v_day_of_month, 1) - 1)::TEXT || ' days')::TIMESTAMP + COALESCE(v_time_of_day, '00:00:00'::TIME);
    ELSE
      v_next_run := now() + INTERVAL '1 day';
  END CASE;

  RETURN v_next_run;
END;
$$;


--
-- Name: calculate_next_run_time(text, text, timestamp with time zone); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.calculate_next_run_time(p_schedule_type text, p_cron_expression text DEFAULT NULL::text, p_current_time timestamp with time zone DEFAULT now()) RETURNS timestamp with time zone
    LANGUAGE plpgsql
    AS $$
BEGIN
  CASE p_schedule_type
    WHEN 'daily' THEN
      RETURN p_current_time + INTERVAL '1 day';
    WHEN 'weekly' THEN
      RETURN p_current_time + INTERVAL '7 days';
    WHEN 'monthly' THEN
      RETURN p_current_time + INTERVAL '1 month';
    WHEN 'cron' THEN
      -- For cron, we'll calculate in the edge function
      -- This is a placeholder - actual cron parsing would be more complex
      RETURN p_current_time + INTERVAL '1 hour';
    ELSE
      RETURN p_current_time + INTERVAL '1 day';
  END CASE;
END;
$$;


--
-- Name: cancel_account_deletion(uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.cancel_account_deletion(p_user_id uuid, p_cancel_reason text DEFAULT NULL::text) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'extensions', 'pg_temp'
    AS $$
DECLARE
  v_affected INTEGER;
BEGIN
  -- Cancel the scheduled deletion
  UPDATE account_deletion_scheduled
  SET
    cancelled = true,
    cancelled_at = now(),
    cancelled_reason = p_cancel_reason
  WHERE user_id = p_user_id
    AND cancelled = false
    AND executed = false;

  GET DIAGNOSTICS v_affected = ROW_COUNT;

  -- Update the GDPR request
  UPDATE gdpr_data_requests
  SET
    status = 'cancelled',
    updated_at = now()
  WHERE user_id = p_user_id
    AND request_type = 'deletion'
    AND status = 'pending';

  -- Log the audit event
  IF v_affected > 0 THEN
    PERFORM log_audit_event(
      p_user_id,
      'account_deletion_cancelled',
      'success',
      'account',
      p_user_id::TEXT,
      NULL,
      NULL,
      jsonb_build_object('cancel_reason', p_cancel_reason),
      'high'
    );
  END IF;

  RETURN v_affected > 0;
END;
$$;


--
-- Name: check_bio_email_sequence_complete(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.check_bio_email_sequence_complete() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  total_emails INTEGER;
  sent_emails INTEGER;
BEGIN
  -- Count total and sent emails for this capture
  SELECT COUNT(*), COUNT(*) FILTER (WHERE sent_at IS NOT NULL)
  INTO total_emails, sent_emails
  FROM instagram_bio_email_sequences
  WHERE email_capture_id = NEW.email_capture_id;

  -- If all emails sent, mark sequence as complete
  IF sent_emails >= total_emails THEN
    UPDATE instagram_bio_email_captures
    SET email_sequence_completed = true
    WHERE id = NEW.email_capture_id;
  END IF;

  RETURN NEW;
END;
$$;


--
-- Name: check_feature_limit(uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.check_feature_limit(_user_id uuid, _feature_key text) RETURNS TABLE(allowed boolean, current_usage integer, limit_amount integer, remaining integer)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'extensions', 'pg_temp'
    AS $$
DECLARE
  user_plan TEXT;
  feature_limit INTEGER;
  current_usage_count INTEGER;
BEGIN
  -- Get user's plan
  SELECT plan_name INTO user_plan
  FROM public.subscriptions
  WHERE user_id = _user_id;

  -- Default to free if no subscription
  user_plan := COALESCE(user_plan, 'free');

  -- Get feature limit for user's plan
  SELECT
    CASE user_plan
      WHEN 'free' THEN fc.free_limit
      WHEN 'starter' THEN fc.starter_limit
      WHEN 'professional' THEN fc.professional_limit
      WHEN 'team' THEN fc.team_limit
      WHEN 'enterprise' THEN fc.enterprise_limit
      ELSE fc.free_limit
    END INTO feature_limit
  FROM public.feature_catalog fc
  WHERE fc.feature_key = _feature_key;

  -- Default to 0 if feature not found
  feature_limit := COALESCE(feature_limit, 0);

  -- Get current usage for this period
  SELECT COALESCE(SUM(fu.usage_count), 0) INTO current_usage_count
  FROM public.feature_usage fu
  WHERE fu.user_id = _user_id
    AND fu.feature_key = _feature_key
    AND fu.usage_period_start = date_trunc('month', NOW());

  -- Return results
  RETURN QUERY SELECT
    (current_usage_count < feature_limit OR feature_limit IS NULL) AS allowed,
    current_usage_count AS current_usage,
    feature_limit AS limit_amount,
    GREATEST(0, feature_limit - current_usage_count) AS remaining;
END;
$$;


--
-- Name: check_listing_sequence_complete(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.check_listing_sequence_complete() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  total_emails INTEGER;
  sent_emails INTEGER;
BEGIN
  -- Count total and sent emails for this capture
  SELECT COUNT(*), COUNT(*) FILTER (WHERE sent_at IS NOT NULL)
  INTO total_emails, sent_emails
  FROM listing_email_sequences
  WHERE email_capture_id = NEW.email_capture_id;

  -- If all emails sent, mark sequence complete
  IF total_emails = sent_emails THEN
    UPDATE listing_email_captures
    SET email_sequence_completed = true
    WHERE id = NEW.email_capture_id;
  END IF;

  RETURN NEW;
END;
$$;


--
-- Name: check_login_throttle(text, inet, integer, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.check_login_throttle(p_email text, p_ip_address inet, p_window_minutes integer DEFAULT 15, p_max_attempts integer DEFAULT 5) RETURNS TABLE(is_blocked boolean, attempts_remaining integer, blocked_until timestamp with time zone, reason text)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'extensions', 'pg_temp'
    AS $$
DECLARE
  v_email_attempts INTEGER;
  v_ip_attempts INTEGER;
  v_window_start TIMESTAMPTZ;
BEGIN
  v_window_start := now() - (p_window_minutes || ' minutes')::INTERVAL;

  -- Count failed attempts by email
  SELECT COUNT(*) INTO v_email_attempts
  FROM login_attempts
  WHERE email = p_email
    AND success = false
    AND created_at > v_window_start;

  -- Count failed attempts by IP
  SELECT COUNT(*) INTO v_ip_attempts
  FROM login_attempts
  WHERE ip_address = p_ip_address
    AND success = false
    AND created_at > v_window_start;

  -- Check if blocked by email attempts (stricter limit)
  IF v_email_attempts >= p_max_attempts THEN
    RETURN QUERY SELECT
      true,
      0,
      v_window_start + (p_window_minutes * 2 || ' minutes')::INTERVAL,
      'Too many failed attempts for this email';
    RETURN;
  END IF;

  -- Check if blocked by IP attempts (higher limit)
  IF v_ip_attempts >= p_max_attempts * 3 THEN
    RETURN QUERY SELECT
      true,
      0,
      v_window_start + (p_window_minutes || ' minutes')::INTERVAL,
      'Too many failed attempts from this IP address';
    RETURN;
  END IF;

  -- Not blocked
  RETURN QUERY SELECT
    false,
    LEAST(p_max_attempts - v_email_attempts, (p_max_attempts * 3) - v_ip_attempts),
    NULL::TIMESTAMPTZ,
    NULL::TEXT;
END;
$$;


--
-- Name: check_mfa_enabled(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.check_mfa_enabled(p_user_id uuid) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'extensions', 'pg_temp'
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_mfa_settings
    WHERE user_id = p_user_id
    AND mfa_enabled = true
    AND verified_at IS NOT NULL
  );
END;
$$;


--
-- Name: check_rate_limit(text, text, integer, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.check_rate_limit(p_identifier text, p_limit_type text, p_max_requests integer DEFAULT 10, p_window_seconds integer DEFAULT 60) RETURNS TABLE(allowed boolean, remaining integer, reset_at timestamp with time zone)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'extensions', 'pg_temp'
    AS $$
DECLARE
  v_entry rate_limit_entries%ROWTYPE;
  v_window_end TIMESTAMPTZ;
BEGIN
  v_window_end := now() + (p_window_seconds || ' seconds')::INTERVAL;

  -- Try to get existing entry
  SELECT * INTO v_entry
  FROM rate_limit_entries
  WHERE identifier = p_identifier
    AND limit_type = p_limit_type
    AND window_end > now()
  FOR UPDATE;

  IF v_entry.id IS NULL THEN
    -- Create new entry
    INSERT INTO rate_limit_entries (identifier, limit_type, request_count, window_end)
    VALUES (p_identifier, p_limit_type, 1, v_window_end)
    ON CONFLICT (identifier, limit_type) DO UPDATE
    SET
      request_count = CASE
        WHEN rate_limit_entries.window_end < now() THEN 1
        ELSE rate_limit_entries.request_count + 1
      END,
      window_end = CASE
        WHEN rate_limit_entries.window_end < now() THEN v_window_end
        ELSE rate_limit_entries.window_end
      END,
      updated_at = now()
    RETURNING * INTO v_entry;
  ELSE
    -- Update existing entry
    UPDATE rate_limit_entries
    SET request_count = request_count + 1, updated_at = now()
    WHERE id = v_entry.id
    RETURNING * INTO v_entry;
  END IF;

  -- Return result
  IF v_entry.request_count > p_max_requests THEN
    RETURN QUERY SELECT false, 0, v_entry.window_end;
  ELSE
    RETURN QUERY SELECT true, p_max_requests - v_entry.request_count, v_entry.window_end;
  END IF;
END;
$$;


--
-- Name: check_subscription_limit(uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.check_subscription_limit(_user_id uuid, _limit_type text) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'extensions', 'pg_temp'
    AS $$
DECLARE
  current_count INTEGER;
  max_allowed INTEGER;
BEGIN
  -- Get max allowed for this user's plan
  SELECT 
    CASE 
      WHEN _limit_type = 'listings' THEN max_listings
      WHEN _limit_type = 'links' THEN max_links
      WHEN _limit_type = 'testimonials' THEN max_testimonials
      ELSE 0
    END INTO max_allowed
  FROM public.subscriptions
  WHERE user_id = _user_id;
  
  -- Count current usage
  current_count := CASE 
    WHEN _limit_type = 'listings' THEN (SELECT COUNT(*) FROM public.listings WHERE user_id = _user_id)
    WHEN _limit_type = 'links' THEN (SELECT COUNT(*) FROM public.links WHERE user_id = _user_id)
    WHEN _limit_type = 'testimonials' THEN (SELECT COUNT(*) FROM public.testimonials WHERE user_id = _user_id)
    ELSE 0
  END;
  
  -- Return true if under limit
  RETURN current_count < max_allowed;
END;
$$;


--
-- Name: check_usage_limit(uuid, text, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.check_usage_limit(_user_id uuid, _resource_type text, _limit integer) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  current_count INTEGER;
BEGIN
  SELECT COALESCE(count, 0) INTO current_count
  FROM usage_tracking
  WHERE user_id = _user_id AND resource_type = _resource_type;
  
  RETURN current_count < _limit;
END;
$$;


--
-- Name: check_username_available(text, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.check_username_available(_username text, _current_user_id uuid) RETURNS boolean
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  -- Check if username exists for a different user
  RETURN NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE LOWER(username) = LOWER(_username)
    AND id != _current_user_id
  );
END;
$$;


--
-- Name: cleanup_expired_mfa_codes(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.cleanup_expired_mfa_codes() RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'extensions', 'pg_temp'
    AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM mfa_temp_codes
  WHERE expires_at < now() OR (used = true AND created_at < now() - interval '1 day');

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;


--
-- Name: cleanup_expired_sso_sessions(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.cleanup_expired_sso_sessions() RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'extensions', 'pg_temp'
    AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  UPDATE sso_login_sessions
  SET status = 'expired'
  WHERE status = 'pending' AND expires_at < now();

  -- Delete old sessions (keep for 30 days for audit)
  DELETE FROM sso_login_sessions
  WHERE created_at < now() - interval '30 days';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;


--
-- Name: cleanup_query_metrics(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.cleanup_query_metrics() RETURNS void
    LANGUAGE sql
    AS $$
  DELETE FROM public.query_metrics WHERE created_at < now() - INTERVAL '30 days';
$$;


--
-- Name: cleanup_rate_limits(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.cleanup_rate_limits() RETURNS void
    LANGUAGE sql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
    DELETE FROM rate_limits WHERE window_start < NOW() - INTERVAL '1 day';
$$;


--
-- Name: cleanup_security_tables(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.cleanup_security_tables() RETURNS TABLE(sessions_cleaned integer, rate_limits_cleaned integer, login_attempts_cleaned integer)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'extensions', 'pg_temp'
    AS $$
DECLARE
  v_sessions INTEGER;
  v_rate_limits INTEGER;
  v_login_attempts INTEGER;
BEGIN
  -- Clean expired sessions
  DELETE FROM user_sessions
  WHERE (expires_at < now() AND revoked = false)
    OR (revoked = true AND revoked_at < now() - interval '30 days');
  GET DIAGNOSTICS v_sessions = ROW_COUNT;

  -- Clean expired rate limit entries
  DELETE FROM rate_limit_entries
  WHERE window_end < now() - interval '1 hour';
  GET DIAGNOSTICS v_rate_limits = ROW_COUNT;

  -- Clean old login attempts (keep 90 days)
  DELETE FROM login_attempts
  WHERE created_at < now() - interval '90 days';
  GET DIAGNOSTICS v_login_attempts = ROW_COUNT;

  RETURN QUERY SELECT v_sessions, v_rate_limits, v_login_attempts;
END;
$$;


--
-- Name: complete_workflow_execution(uuid, text, jsonb, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.complete_workflow_execution(p_execution_id uuid, p_status text, p_result jsonb DEFAULT NULL::jsonb, p_error_message text DEFAULT NULL::text, p_error_node_id text DEFAULT NULL::text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'extensions', 'pg_temp'
    AS $$
DECLARE
  v_execution workflow_executions%ROWTYPE;
BEGIN
  -- Get execution
  SELECT * INTO v_execution FROM workflow_executions WHERE id = p_execution_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Execution not found';
  END IF;

  -- Update execution
  UPDATE workflow_executions
  SET
    status = p_status,
    completed_at = now(),
    result = p_result,
    error_message = p_error_message,
    error_node_id = p_error_node_id
  WHERE id = p_execution_id;

  -- Update workflow stats
  IF p_status = 'completed' THEN
    UPDATE workflows
    SET success_count = success_count + 1, updated_at = now()
    WHERE id = v_execution.workflow_id;
  ELSIF p_status = 'failed' THEN
    UPDATE workflows
    SET failure_count = failure_count + 1, updated_at = now()
    WHERE id = v_execution.workflow_id;
  END IF;
END;
$$;


--
-- Name: create_default_subscription(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.create_default_subscription() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.subscriptions (
    user_id,
    plan_name,
    status,
    max_listings,
    max_links,
    max_testimonials,
    analytics_history_days
  ) VALUES (
    NEW.id,
    'free',
    'active',
    3,
    5,
    3,
    7
  );
  
  RETURN NEW;
END;
$$;


--
-- Name: ensure_single_active_page(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.ensure_single_active_page() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF NEW.is_active = true THEN
    UPDATE public.custom_pages
    SET is_active = false
    WHERE user_id = NEW.user_id
      AND id != NEW.id
      AND is_active = true;
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: extract_ab_test_metrics(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.extract_ab_test_metrics() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Extract metrics from analysis JSONB for easier querying
    NEW.ml_conversion_rate := (NEW.analysis->'mlResults'->>'conversionRate')::DECIMAL;
    NEW.rules_conversion_rate := (NEW.analysis->'rulesResults'->>'conversionRate')::DECIMAL;
    NEW.winner := NEW.analysis->>'winner';
    NEW.confidence := (NEW.analysis->>'confidence')::DECIMAL;
    NEW.duration_days := (NEW.analysis->>'duration')::DECIMAL;
    NEW.ml_count := (NEW.analysis->'mlResults'->>'count')::INTEGER;
    NEW.rules_count := (NEW.analysis->'rulesResults'->>'count')::INTEGER;
    NEW.ml_conversions := (NEW.analysis->'mlResults'->>'conversions')::INTEGER;
    NEW.rules_conversions := (NEW.analysis->'rulesResults'->>'conversions')::INTEGER;

    RETURN NEW;
END;
$$;


--
-- Name: find_duplicate_content(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.find_duplicate_content() RETURNS TABLE(content_hash text, url_count bigint, urls text[])
    LANGUAGE sql STABLE
    AS $$
  SELECT
    content_hash,
    COUNT(*)::BIGINT as url_count,
    ARRAY_AGG(url) as urls
  FROM public.seo_crawl_results
  WHERE content_hash IS NOT NULL
  GROUP BY content_hash
  HAVING COUNT(*) > 1
  ORDER BY url_count DESC;
$$;


--
-- Name: find_or_create_sso_user(uuid, text, text, text, text[], jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.find_or_create_sso_user(p_config_id uuid, p_email text, p_subject_id text, p_full_name text DEFAULT NULL::text, p_groups text[] DEFAULT NULL::text[], p_attributes jsonb DEFAULT '{}'::jsonb) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'extensions', 'pg_temp'
    AS $$
DECLARE
  v_user_id UUID;
  v_config enterprise_sso_config%ROWTYPE;
BEGIN
  -- Get SSO config
  SELECT * INTO v_config FROM enterprise_sso_config WHERE id = p_config_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'SSO config not found';
  END IF;

  -- Check if user already exists via SSO mapping
  SELECT user_id INTO v_user_id
  FROM sso_user_mappings
  WHERE config_id = p_config_id AND sso_subject_id = p_subject_id;

  IF v_user_id IS NOT NULL THEN
    -- Update existing mapping
    UPDATE sso_user_mappings
    SET
      sso_email = p_email,
      sso_groups = COALESCE(p_groups, sso_groups),
      sso_attributes = p_attributes,
      last_login_at = now(),
      login_count = login_count + 1,
      updated_at = now()
    WHERE config_id = p_config_id AND sso_subject_id = p_subject_id;

    RETURN v_user_id;
  END IF;

  -- Check if user exists by email
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = p_email;

  IF v_user_id IS NOT NULL THEN
    -- Link existing user to SSO
    INSERT INTO sso_user_mappings (user_id, config_id, sso_subject_id, sso_email, sso_groups, sso_attributes)
    VALUES (v_user_id, p_config_id, p_subject_id, p_email, p_groups, p_attributes);

    RETURN v_user_id;
  END IF;

  -- Auto-provision is handled at the application layer via Supabase Auth
  -- Return NULL to indicate new user needs to be created
  RETURN NULL;
END;
$$;


--
-- Name: find_sso_config_by_email(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.find_sso_config_by_email(p_email text) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'extensions', 'pg_temp'
    AS $$
DECLARE
  v_domain TEXT;
  v_config_id UUID;
BEGIN
  -- Extract domain from email
  v_domain := split_part(p_email, '@', 2);

  SELECT id INTO v_config_id
  FROM enterprise_sso_config
  WHERE organization_domain = v_domain
  AND active = true
  LIMIT 1;

  RETURN v_config_id;
END;
$$;


--
-- Name: find_topic_cluster_opportunities(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.find_topic_cluster_opportunities() RETURNS TABLE(primary_topic text, page_count bigint, has_pillar_content boolean, average_score numeric)
    LANGUAGE sql STABLE
    AS $$
  SELECT
    primary_topic,
    COUNT(*)::BIGINT as page_count,
    BOOL_OR(is_pillar_content) as has_pillar_content,
    AVG(topical_authority_score) as average_score
  FROM public.seo_semantic_analysis
  GROUP BY primary_topic
  HAVING COUNT(*) >= 3 -- At least 3 pieces of content on the topic
  ORDER BY page_count DESC, average_score DESC;
$$;


--
-- Name: generate_encryption_key(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.generate_encryption_key() RETURNS text
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'extensions', 'pg_temp'
    AS $$
BEGIN
    -- Generate 32 random bytes (256 bits) and encode as base64
    RETURN encode(gen_random_bytes(32), 'base64');
END;
$$;


--
-- Name: get_active_gsc_credential(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_active_gsc_credential(p_user_id uuid) RETURNS TABLE(id uuid, access_token text, refresh_token text, expires_at timestamp with time zone, is_expired boolean)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public', 'extensions', 'pg_temp'
    AS $$
  SELECT
    id,
    access_token,
    refresh_token,
    expires_at,
    expires_at < now() as is_expired
  FROM public.gsc_oauth_credentials
  WHERE user_id = p_user_id
  AND is_active = true
  ORDER BY created_at DESC
  LIMIT 1;
$$;


--
-- Name: get_average_page_score(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_average_page_score() RETURNS integer
    LANGUAGE sql STABLE
    AS $$
  SELECT COALESCE(AVG(overall_score)::INTEGER, 0)
  FROM public.seo_page_scores
  WHERE last_scored_at > now() - INTERVAL '30 days';
$$;


--
-- Name: get_connected_search_platforms(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_connected_search_platforms(p_user_id uuid) RETURNS TABLE(platform text, is_connected boolean, last_sync timestamp with time zone, credential_status text)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public', 'extensions', 'pg_temp'
    AS $$
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
$$;


--
-- Name: get_content_by_score_range(integer, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_content_by_score_range(min_score integer DEFAULT 0, max_score integer DEFAULT 100) RETURNS TABLE(url text, page_title text, optimization_score integer, optimization_level text, analyzed_at timestamp with time zone)
    LANGUAGE sql STABLE
    AS $$
  SELECT
    url,
    page_title,
    optimization_score,
    optimization_level,
    analyzed_at
  FROM public.seo_content_optimization
  WHERE optimization_score >= min_score
    AND optimization_score <= max_score
  ORDER BY optimization_score ASC, analyzed_at DESC;
$$;


--
-- Name: get_critical_alerts_count(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_critical_alerts_count() RETURNS integer
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public', 'extensions', 'pg_temp'
    AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.seo_alerts
  WHERE status = 'open'
  AND severity = 'critical';
$$;


--
-- Name: get_encrypted_fields(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_encrypted_fields(p_table_name text) RETURNS text[]
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'extensions', 'pg_temp'
    AS $$
DECLARE
    result TEXT[];
BEGIN
    SELECT array_agg(field_name)
    INTO result
    FROM encrypted_pii_config
    WHERE table_name = p_table_name
    AND is_encrypted = true;

    RETURN COALESCE(result, ARRAY[]::TEXT[]);
END;
$$;


--
-- Name: get_failing_cwv_pages(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_failing_cwv_pages() RETURNS TABLE(url text, device text, lcp numeric, fid numeric, cls numeric, measured_at timestamp with time zone)
    LANGUAGE sql STABLE
    AS $$
  SELECT
    url,
    device,
    lcp,
    fid,
    cls,
    measured_at
  FROM public.seo_core_web_vitals
  WHERE lcp_pass = false
     OR fid_pass = false
     OR cls_pass = false
  ORDER BY measured_at DESC;
$$;


--
-- Name: get_lead_timeline(uuid, integer, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_lead_timeline(_lead_id uuid, _limit integer DEFAULT 50, _offset integer DEFAULT 0) RETURNS TABLE(id uuid, activity_type text, title text, content text, metadata jsonb, activity_at timestamp with time zone, created_at timestamp with time zone)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'extensions', 'pg_temp'
    AS $$
BEGIN
  -- Verify user owns the lead
  IF NOT EXISTS (
    SELECT 1 FROM public.leads
    WHERE leads.id = _lead_id AND leads.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Lead not found or access denied';
  END IF;

  RETURN QUERY
  SELECT
    la.id,
    la.activity_type,
    la.title,
    la.content,
    la.metadata,
    la.activity_at,
    la.created_at
  FROM public.lead_activities la
  WHERE la.lead_id = _lead_id
  ORDER BY la.activity_at DESC
  LIMIT _limit
  OFFSET _offset;
END;
$$;


--
-- Name: get_open_alerts_count(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_open_alerts_count() RETURNS integer
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public', 'extensions', 'pg_temp'
    AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.seo_alerts
  WHERE status = 'open';
$$;


--
-- Name: get_pages_needing_optimization(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_pages_needing_optimization() RETURNS TABLE(url text, page_title text, optimization_score integer, critical_issues text[])
    LANGUAGE sql STABLE
    AS $$
  SELECT
    url,
    page_title,
    optimization_score,
    ARRAY(
      SELECT jsonb_array_elements_text(ai_suggestions)::jsonb->>'type'
      FROM public.seo_content_optimization sco
      WHERE sco.url = public.seo_content_optimization.url
        AND (ai_suggestions::jsonb->>'priority' = 'high' OR ai_suggestions::jsonb->>'priority' = 'critical')
    ) as critical_issues
  FROM public.seo_content_optimization
  WHERE optimization_score < 70
  ORDER BY optimization_score ASC;
$$;


--
-- Name: get_payment_link(text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_payment_link(_plan_name text, _interval text DEFAULT 'month'::text) RETURNS text
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  link TEXT;
BEGIN
  IF _interval = 'year' OR _interval = 'yearly' THEN
    SELECT payment_link_yearly INTO link
    FROM subscription_plans
    WHERE name = _plan_name AND is_active = true;
  ELSE
    SELECT payment_link_monthly INTO link
    FROM subscription_plans
    WHERE name = _plan_name AND is_active = true;
  END IF;

  RETURN link;
END;
$$;


--
-- Name: get_pending_bio_emails(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_pending_bio_emails() RETURNS TABLE(capture_id uuid, email text, first_name text, market text, sequence_number integer, days_since_capture integer, overall_score integer)
    LANGUAGE plpgsql
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    ec.id as capture_id,
    ec.email,
    ec.first_name,
    ec.market,
    es.sequence_number,
    EXTRACT(DAY FROM NOW() - ec.created_at)::INTEGER as days_since_capture,
    ia.overall_score
  FROM instagram_bio_email_captures ec
  JOIN instagram_bio_email_sequences es ON es.email_capture_id = ec.id
  LEFT JOIN instagram_bio_analyses ia ON ia.id = ec.analysis_id
  WHERE
    ec.email_sequence_started = true
    AND ec.email_sequence_completed = false
    AND es.sent_at IS NULL
    AND ec.created_at >= CURRENT_DATE - INTERVAL '14 days'
  ORDER BY ec.created_at ASC, es.sequence_number ASC;
END;
$$;


--
-- Name: get_pending_listing_emails(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_pending_listing_emails() RETURNS TABLE(id uuid, email text, first_name text, created_at timestamp with time zone, days_since_capture integer)
    LANGUAGE plpgsql
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    lec.id,
    lec.email,
    lec.first_name,
    lec.created_at,
    EXTRACT(DAY FROM (NOW() - lec.created_at))::INTEGER as days_since_capture
  FROM listing_email_captures lec
  WHERE
    -- Sequence started but not completed
    lec.email_sequence_started = true
    AND lec.email_sequence_completed = false
    -- At least 1 day since capture
    AND lec.created_at < NOW() - INTERVAL '1 day'
    -- Check if there's a pending email for today
    AND EXISTS (
      SELECT 1
      FROM listing_email_sequences les
      WHERE les.email_capture_id = lec.id
      AND les.sent_at IS NULL
      -- Check schedule: email 1 = day 2, email 2 = day 3, etc.
      AND (
        (les.sequence_number = 1 AND EXTRACT(DAY FROM (NOW() - lec.created_at))::INTEGER >= 1) OR
        (les.sequence_number = 2 AND EXTRACT(DAY FROM (NOW() - lec.created_at))::INTEGER >= 2) OR
        (les.sequence_number = 3 AND EXTRACT(DAY FROM (NOW() - lec.created_at))::INTEGER >= 3) OR
        (les.sequence_number = 5 AND EXTRACT(DAY FROM (NOW() - lec.created_at))::INTEGER >= 5) OR
        (les.sequence_number = 6 AND EXTRACT(DAY FROM (NOW() - lec.created_at))::INTEGER >= 6) OR
        (les.sequence_number = 7 AND EXTRACT(DAY FROM (NOW() - lec.created_at))::INTEGER >= 7)
      )
    )
  ORDER BY lec.created_at ASC;
END;
$$;


--
-- Name: get_scheduled_workflows(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_scheduled_workflows(p_limit integer DEFAULT 10) RETURNS TABLE(trigger_id uuid, workflow_id uuid, user_id uuid, trigger_config jsonb)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'extensions', 'pg_temp'
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    wt.id as trigger_id,
    wt.workflow_id,
    w.user_id,
    wt.config as trigger_config
  FROM workflow_triggers wt
  JOIN workflows w ON w.id = wt.workflow_id
  WHERE wt.trigger_type = 'schedule'
  AND wt.is_active = true
  AND w.is_active = true
  AND wt.next_run_at <= now()
  ORDER BY wt.next_run_at
  LIMIT p_limit
  FOR UPDATE OF wt SKIP LOCKED;
END;
$$;


--
-- Name: get_stripe_price_id(text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_stripe_price_id(_plan_name text, _interval text DEFAULT 'month'::text) RETURNS text
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  price_id TEXT;
BEGIN
  IF _interval = 'year' OR _interval = 'yearly' THEN
    SELECT COALESCE(stripe_price_id_yearly, stripe_price_id_monthly, stripe_price_id)
    INTO price_id
    FROM subscription_plans
    WHERE name = _plan_name AND is_active = true;
  ELSE
    SELECT COALESCE(stripe_price_id_monthly, stripe_price_id)
    INTO price_id
    FROM subscription_plans
    WHERE name = _plan_name AND is_active = true;
  END IF;

  RETURN price_id;
END;
$$;


--
-- Name: get_system_health_summary(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_system_health_summary() RETURNS TABLE(metric_type text, avg_value numeric, min_value numeric, max_value numeric, count bigint)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'extensions', 'pg_temp'
    AS $$
BEGIN
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
$$;


--
-- Name: get_user_plan(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_user_plan(_user_id uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  plan_data JSONB;
BEGIN
  SELECT jsonb_build_object(
    'plan_name', sp.name,
    'limits', sp.limits,
    'features', sp.features,
    'status', us.status,
    'current_period_end', us.current_period_end,
    'stripe_price_id', COALESCE(sp.stripe_price_id_monthly, sp.stripe_price_id),
    'stripe_price_id_yearly', sp.stripe_price_id_yearly,
    'price_monthly', sp.price_monthly,
    'price_yearly', sp.price_yearly
  ) INTO plan_data
  FROM user_subscriptions us
  JOIN subscription_plans sp ON us.plan_id = sp.id
  WHERE us.user_id = _user_id AND us.status = 'active';

  IF plan_data IS NULL THEN
    -- Return free plan limits
    SELECT jsonb_build_object(
      'plan_name', 'free',
      'limits', limits,
      'features', features,
      'status', 'free',
      'stripe_price_id', stripe_price_id_monthly,
      'stripe_price_id_yearly', stripe_price_id_yearly,
      'price_monthly', price_monthly,
      'price_yearly', price_yearly
    ) INTO plan_data
    FROM subscription_plans
    WHERE name = 'free' AND is_active = true;

    -- Fallback if no free plan exists
    IF plan_data IS NULL THEN
      plan_data := jsonb_build_object(
        'plan_name', 'free',
        'limits', jsonb_build_object(
          'listings', 3,
          'links', 5,
          'testimonials', 3,
          'analytics_days', 7
        ),
        'features', jsonb_build_object(),
        'status', 'free',
        'price_monthly', 0,
        'price_yearly', 0
      );
    END IF;
  END IF;

  RETURN plan_data;
END;
$$;


--
-- Name: get_user_sessions(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_user_sessions(p_user_id uuid) RETURNS TABLE(id uuid, ip_address inet, user_agent text, device_type text, browser text, os text, location_city text, location_country text, is_current boolean, last_activity_at timestamp with time zone, created_at timestamp with time zone)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'extensions', 'pg_temp'
    AS $$
BEGIN
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
$$;


--
-- Name: get_user_statistics(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_user_statistics() RETURNS TABLE(total_users bigint, active_users_24h bigint, active_users_7d bigint, admin_count bigint, users_with_subscriptions bigint)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'extensions', 'pg_temp'
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM auth.users)::BIGINT,
    (SELECT COUNT(DISTINCT user_id) FROM user_activity_log WHERE created_at > NOW() - INTERVAL '24 hours')::BIGINT,
    (SELECT COUNT(DISTINCT user_id) FROM user_activity_log WHERE created_at > NOW() - INTERVAL '7 days')::BIGINT,
    (SELECT COUNT(DISTINCT user_id) FROM user_roles WHERE role = 'admin')::BIGINT,
    (SELECT COUNT(DISTINCT user_id) FROM subscriptions WHERE status = 'active')::BIGINT;
END;
$$;


--
-- Name: get_user_subscription_with_usage(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_user_subscription_with_usage(_user_id uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'extensions', 'pg_temp'
    AS $$
DECLARE
  result JSONB;
  sub_record RECORD;
  usage_data JSONB;
BEGIN
  -- Get subscription details
  SELECT * INTO sub_record
  FROM public.user_subscription_details
  WHERE user_id = _user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'subscription', NULL,
      'usage', '{}'::JSONB,
      'has_subscription', FALSE
    );
  END IF;

  -- Get current period usage
  SELECT COALESCE(
    jsonb_object_agg(feature_key, jsonb_build_object('count', usage_count, 'billed', billed_count)),
    '{}'::JSONB
  ) INTO usage_data
  FROM public.feature_usage
  WHERE user_id = _user_id
    AND usage_period_start = date_trunc('month', NOW());

  -- Build result
  result := jsonb_build_object(
    'subscription', row_to_json(sub_record)::JSONB,
    'usage', usage_data,
    'has_subscription', TRUE
  );

  RETURN result;
END;
$$;


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  numeric_username TEXT;
BEGIN
  -- Generate numeric username from user ID (remove hyphens and take first 9 digits)
  numeric_username := REPLACE(new.id::TEXT, '-', '');
  numeric_username := SUBSTRING(numeric_username, 1, 9);
  
  INSERT INTO public.profiles (id, username, full_name)
  VALUES (
    new.id,
    numeric_username,
    COALESCE(new.raw_user_meta_data->>'full_name', '')
  );
  
  -- Assign default 'user' role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'user');
  
  RETURN new;
END;
$$;


--
-- Name: has_role(uuid, public.app_role); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;


--
-- Name: increment_link_clicks(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.increment_link_clicks(link_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  UPDATE public.links
  SET click_count = COALESCE(click_count, 0) + 1
  WHERE id = link_id;
END;
$$;


--
-- Name: increment_mfa_failed_attempts(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.increment_mfa_failed_attempts(p_user_id uuid) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'extensions', 'pg_temp'
    AS $$
DECLARE
  v_attempts INTEGER;
BEGIN
  UPDATE user_mfa_settings
  SET
    failed_attempts = failed_attempts + 1,
    locked_until = CASE
      WHEN failed_attempts >= 4 THEN now() + interval '15 minutes'
      ELSE locked_until
    END,
    updated_at = now()
  WHERE user_id = p_user_id
  RETURNING failed_attempts INTO v_attempts;

  RETURN COALESCE(v_attempts, 0);
END;
$$;


--
-- Name: increment_profile_leads(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.increment_profile_leads(_profile_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  UPDATE public.profiles
  SET lead_count = lead_count + 1
  WHERE id = _profile_id;
END;
$$;


--
-- Name: increment_profile_views(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.increment_profile_views(_profile_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  UPDATE public.profiles
  SET view_count = view_count + 1
  WHERE id = _profile_id;
END;
$$;


--
-- Name: init_listing_email_sequence(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.init_listing_email_sequence() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'extensions', 'pg_temp'
    AS $$
BEGIN
  -- Create 7 email sequence entries
  INSERT INTO listing_email_sequences (email_capture_id, sequence_number, email_subject)
  VALUES
    (NEW.id, 1, 'The listing description mistake that costs agents thousands'),
    (NEW.id, 2, 'Power words that make buyers take action'),
    (NEW.id, 3, 'How to choose the right description style for your listing'),
    (NEW.id, 5, 'Real data: What sells homes faster in 2025'),
    (NEW.id, 6, 'Your listing checklist: Beyond the description'),
    (NEW.id, 7, '20% off AgentBio (expires tonight) + Free listing templates');

  RETURN NEW;
END;
$$;


--
-- Name: initialize_bio_email_sequence(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.initialize_bio_email_sequence() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'extensions', 'pg_temp'
    AS $$
BEGIN
  -- Create placeholder entries for all 7 emails in the sequence
  INSERT INTO instagram_bio_email_sequences (email_capture_id, sequence_number, email_subject, sent_at)
  VALUES
    (NEW.id, 1, 'Your 3 Optimized Instagram Bios + Action Plan Inside', NULL),
    (NEW.id, 2, 'The Instagram bio mistake 73% of agents make', NULL),
    (NEW.id, 3, 'Your Instagram profile as a 24/7 showing scheduler', NULL),
    (NEW.id, 4, NEW.first_name || ', here''s your 30-day Instagram content calendar', NULL),
    (NEW.id, 5, 'Real data: What converts Instagram followers to clients', NULL),
    (NEW.id, 6, 'Linktree vs AgentBio for real estate (honest comparison)', NULL),
    (NEW.id, 7, NEW.first_name || ', final call: 20% off + free setup (expires tonight)', NULL);

  RETURN NEW;
END;
$$;


--
-- Name: is_device_trusted(uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_device_trusted(p_user_id uuid, p_device_fingerprint text) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'extensions', 'pg_temp'
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM mfa_trusted_devices
    WHERE user_id = p_user_id
    AND device_fingerprint = p_device_fingerprint
    AND revoked = false
    AND trusted_until > now()
  );
END;
$$;


--
-- Name: is_field_encrypted(text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_field_encrypted(p_table_name text, p_field_name text) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'extensions', 'pg_temp'
    AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM encrypted_pii_config
        WHERE table_name = p_table_name
        AND field_name = p_field_name
        AND is_encrypted = true
    );
END;
$$;


--
-- Name: is_gsc_token_expired(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_gsc_token_expired(credential_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public', 'extensions', 'pg_temp'
    AS $$
  SELECT expires_at < now()
  FROM public.gsc_oauth_credentials
  WHERE id = credential_id
  AND is_active = true;
$$;


--
-- Name: is_mfa_locked(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_mfa_locked(p_user_id uuid) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'extensions', 'pg_temp'
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_mfa_settings
    WHERE user_id = p_user_id
    AND locked_until IS NOT NULL
    AND locked_until > now()
  );
END;
$$;


--
-- Name: is_team_admin(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_team_admin(p_team_id uuid, p_user_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.teams t WHERE t.id = p_team_id AND t.owner_id = p_user_id
  ) OR EXISTS (
    SELECT 1 FROM public.team_members m
    WHERE m.team_id = p_team_id AND m.user_id = p_user_id
      AND m.role IN ('owner', 'admin') AND m.accepted_at IS NOT NULL
  );
$$;


--
-- Name: is_team_member(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_team_member(p_team_id uuid, p_user_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_id = p_team_id AND user_id = p_user_id AND accepted_at IS NOT NULL
  );
$$;


--
-- Name: log_admin_action(uuid, text, text, uuid, jsonb, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.log_admin_action(p_admin_id uuid, p_action text, p_target_type text DEFAULT NULL::text, p_target_id uuid DEFAULT NULL::uuid, p_details jsonb DEFAULT '{}'::jsonb, p_ip_address text DEFAULT NULL::text, p_user_agent text DEFAULT NULL::text) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'extensions', 'pg_temp'
    AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO admin_audit_log (
    admin_id,
    action,
    target_type,
    target_id,
    details,
    ip_address,
    user_agent
  ) VALUES (
    p_admin_id,
    p_action,
    p_target_type,
    p_target_id,
    p_details,
    p_ip_address,
    p_user_agent
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$;


--
-- Name: log_audit_event(uuid, text, text, text, text, inet, text, jsonb, text, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.log_audit_event(p_user_id uuid, p_action text, p_status text, p_resource_type text DEFAULT NULL::text, p_resource_id text DEFAULT NULL::text, p_ip_address inet DEFAULT NULL::inet, p_user_agent text DEFAULT NULL::text, p_details jsonb DEFAULT NULL::jsonb, p_risk_level text DEFAULT 'low'::text, p_actor_id uuid DEFAULT NULL::uuid) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'extensions', 'pg_temp'
    AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO audit_logs (
    user_id, actor_id, action, resource_type, resource_id,
    status, ip_address, user_agent, details, risk_level
  )
  VALUES (
    p_user_id, COALESCE(p_actor_id, p_user_id), p_action, p_resource_type, p_resource_id,
    p_status, p_ip_address, p_user_agent, p_details, p_risk_level
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$;


--
-- Name: log_automation_execution(text, uuid, text, text, jsonb, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.log_automation_execution(p_automation_type text, p_automation_id uuid, p_status text, p_message text DEFAULT NULL::text, p_details jsonb DEFAULT '{}'::jsonb, p_duration_ms integer DEFAULT NULL::integer) RETURNS uuid
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO seo_automation_logs (
    automation_type,
    automation_id,
    status,
    message,
    details,
    duration_ms
  ) VALUES (
    p_automation_type,
    p_automation_id,
    p_status,
    p_message,
    p_details,
    p_duration_ms
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$;


--
-- Name: log_encryption_operation(uuid, text, text, text, text[], boolean, text, inet, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.log_encryption_operation(p_user_id uuid, p_operation text, p_table_name text, p_record_id text DEFAULT NULL::text, p_fields text[] DEFAULT NULL::text[], p_success boolean DEFAULT true, p_error text DEFAULT NULL::text, p_ip_address inet DEFAULT NULL::inet, p_user_agent text DEFAULT NULL::text) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'extensions', 'pg_temp'
    AS $$
DECLARE
    audit_id UUID;
BEGIN
    INSERT INTO pii_encryption_audit (
        user_id,
        operation,
        table_name,
        record_id,
        fields_affected,
        success,
        error_message,
        ip_address,
        user_agent
    ) VALUES (
        p_user_id,
        p_operation,
        p_table_name,
        p_record_id,
        p_fields,
        p_success,
        p_error,
        p_ip_address,
        p_user_agent
    )
    RETURNING id INTO audit_id;

    RETURN audit_id;
END;
$$;


--
-- Name: log_error(uuid, text, text, text, jsonb, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.log_error(p_user_id uuid, p_error_type text, p_error_message text, p_stack_trace text DEFAULT NULL::text, p_user_context jsonb DEFAULT '{}'::jsonb, p_severity text DEFAULT 'medium'::text) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'extensions', 'pg_temp'
    AS $$
DECLARE
  v_error_id UUID;
BEGIN
  INSERT INTO error_logs (
    user_id,
    error_type,
    error_message,
    stack_trace,
    user_context,
    severity
  ) VALUES (
    p_user_id,
    p_error_type,
    p_error_message,
    p_stack_trace,
    p_user_context,
    p_severity
  )
  RETURNING id INTO v_error_id;

  RETURN v_error_id;
END;
$$;


--
-- Name: log_lead_activity(uuid, text, text, text, jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.log_lead_activity(_lead_id uuid, _activity_type text, _content text DEFAULT NULL::text, _title text DEFAULT NULL::text, _metadata jsonb DEFAULT '{}'::jsonb) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'extensions', 'pg_temp'
    AS $$
DECLARE
  new_activity_id UUID;
  current_user_id UUID := auth.uid();
BEGIN
  -- Verify user owns the lead
  IF NOT EXISTS (
    SELECT 1 FROM public.leads
    WHERE id = _lead_id AND user_id = current_user_id
  ) THEN
    RAISE EXCEPTION 'Lead not found or access denied';
  END IF;

  -- Insert the activity
  INSERT INTO public.lead_activities (
    lead_id,
    user_id,
    activity_type,
    title,
    content,
    metadata
  )
  VALUES (
    _lead_id,
    current_user_id,
    _activity_type,
    _title,
    _content,
    _metadata
  )
  RETURNING id INTO new_activity_id;

  -- Update lead's last_contacted_at for communication activities
  IF _activity_type IN ('email', 'call', 'meeting', 'sms') THEN
    UPDATE public.leads
    SET last_contacted_at = NOW(), updated_at = NOW()
    WHERE id = _lead_id;
  END IF;

  RETURN new_activity_id;
END;
$$;


--
-- Name: log_lead_call(uuid, text, integer, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.log_lead_call(_lead_id uuid, _outcome text, _duration_seconds integer DEFAULT NULL::integer, _notes text DEFAULT NULL::text) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'extensions', 'pg_temp'
    AS $$
DECLARE
  new_activity_id UUID;
  current_user_id UUID := auth.uid();
BEGIN
  -- Verify user owns the lead
  IF NOT EXISTS (
    SELECT 1 FROM public.leads
    WHERE id = _lead_id AND user_id = current_user_id
  ) THEN
    RAISE EXCEPTION 'Lead not found or access denied';
  END IF;

  -- Insert the call activity
  INSERT INTO public.lead_activities (
    lead_id,
    user_id,
    activity_type,
    title,
    content,
    call_duration_seconds,
    call_outcome,
    is_internal,
    metadata
  )
  VALUES (
    _lead_id,
    current_user_id,
    'call',
    'Phone call - ' || _outcome,
    _notes,
    _duration_seconds,
    _outcome,
    FALSE,
    jsonb_build_object('outcome', _outcome, 'duration', _duration_seconds)
  )
  RETURNING id INTO new_activity_id;

  -- Update last contacted
  UPDATE public.leads
  SET last_contacted_at = NOW(), updated_at = NOW()
  WHERE id = _lead_id;

  RETURN new_activity_id;
END;
$$;


--
-- Name: log_lead_email(uuid, text, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.log_lead_email(_lead_id uuid, _subject text, _recipient text, _body text DEFAULT NULL::text) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'extensions', 'pg_temp'
    AS $$
DECLARE
  new_activity_id UUID;
  current_user_id UUID := auth.uid();
BEGIN
  -- Verify user owns the lead
  IF NOT EXISTS (
    SELECT 1 FROM public.leads
    WHERE id = _lead_id AND user_id = current_user_id
  ) THEN
    RAISE EXCEPTION 'Lead not found or access denied';
  END IF;

  -- Insert the email activity
  INSERT INTO public.lead_activities (
    lead_id,
    user_id,
    activity_type,
    title,
    content,
    email_subject,
    email_recipient,
    is_internal,
    metadata
  )
  VALUES (
    _lead_id,
    current_user_id,
    'email',
    'Email: ' || _subject,
    _body,
    _subject,
    _recipient,
    FALSE,
    jsonb_build_object('subject', _subject, 'recipient', _recipient)
  )
  RETURNING id INTO new_activity_id;

  -- Update last contacted
  UPDATE public.leads
  SET last_contacted_at = NOW(), updated_at = NOW()
  WHERE id = _lead_id;

  RETURN new_activity_id;
END;
$$;


--
-- Name: log_lead_status_change(uuid, text, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.log_lead_status_change(_lead_id uuid, _previous_status text, _new_status text, _note text DEFAULT NULL::text) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'extensions', 'pg_temp'
    AS $$
DECLARE
  new_activity_id UUID;
  current_user_id UUID := auth.uid();
BEGIN
  -- Verify user owns the lead
  IF NOT EXISTS (
    SELECT 1 FROM public.leads
    WHERE id = _lead_id AND user_id = current_user_id
  ) THEN
    RAISE EXCEPTION 'Lead not found or access denied';
  END IF;

  -- Insert the status change activity
  INSERT INTO public.lead_activities (
    lead_id,
    user_id,
    activity_type,
    title,
    content,
    previous_status,
    new_status,
    metadata
  )
  VALUES (
    _lead_id,
    current_user_id,
    'status_change',
    'Status changed to ' || _new_status,
    _note,
    _previous_status,
    _new_status,
    jsonb_build_object('previous_status', _previous_status, 'new_status', _new_status)
  )
  RETURNING id INTO new_activity_id;

  RETURN new_activity_id;
END;
$$;


--
-- Name: log_sso_event(uuid, uuid, text, jsonb, inet, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.log_sso_event(p_config_id uuid, p_user_id uuid, p_event_type text, p_details jsonb DEFAULT '{}'::jsonb, p_ip_address inet DEFAULT NULL::inet, p_user_agent text DEFAULT NULL::text) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'extensions', 'pg_temp'
    AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO sso_audit_logs (config_id, user_id, event_type, event_details, ip_address, user_agent)
  VALUES (p_config_id, p_user_id, p_event_type, p_details, p_ip_address, p_user_agent)
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$;


--
-- Name: log_user_activity(uuid, text, jsonb, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.log_user_activity(p_user_id uuid, p_activity_type text, p_activity_data jsonb DEFAULT '{}'::jsonb, p_page_url text DEFAULT NULL::text) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'extensions', 'pg_temp'
    AS $$
DECLARE
  v_activity_id UUID;
BEGIN
  INSERT INTO user_activity_log (
    user_id,
    activity_type,
    activity_data,
    page_url
  ) VALUES (
    p_user_id,
    p_activity_type,
    p_activity_data,
    p_page_url
  )
  RETURNING id INTO v_activity_id;

  RETURN v_activity_id;
END;
$$;


--
-- Name: notify_lead_on_insert(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.notify_lead_on_insert() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_functions_url TEXT := current_setting('app.settings.functions_url', true);
  v_service_key   TEXT := current_setting('app.settings.service_role_key', true);
BEGIN
  -- No-op when not configured (keeps local/dev inserts working).
  IF v_functions_url IS NULL OR v_service_key IS NULL THEN
    RETURN NEW;
  END IF;

  PERFORM net.http_post(
    url := v_functions_url || '/notify-lead',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_service_key
    ),
    body := jsonb_build_object('record', row_to_json(NEW))
  );

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Never let notification failure block lead capture.
    RAISE WARNING 'notify_lead_on_insert failed: %', SQLERRM;
    RETURN NEW;
END;
$$;


--
-- Name: notify_new_lead(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.notify_new_lead() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message, data)
  VALUES (
    NEW.user_id,
    'new_lead',
    'New lead: ' || COALESCE(NEW.name, 'Someone'),
    COALESCE(NEW.message, 'A new ' || COALESCE(NEW.lead_type, 'inquiry') || ' was captured.'),
    jsonb_build_object('lead_id', NEW.id, 'lead_type', NEW.lead_type)
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'notify_new_lead failed: %', SQLERRM;
  RETURN NEW;
END;
$$;


--
-- Name: process_scheduled_account_deletions(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.process_scheduled_account_deletions() RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'auth'
    AS $$
DECLARE
  v_row   account_deletion_scheduled%ROWTYPE;
  v_count INTEGER := 0;
BEGIN
  FOR v_row IN
    SELECT *
    FROM account_deletion_scheduled
    WHERE cancelled = false
      AND executed = false
      AND scheduled_for <= now()
    ORDER BY scheduled_for ASC
  LOOP
    BEGIN
      -- Mark the GDPR/data request completed before the row cascades away.
      UPDATE gdpr_data_requests
        SET status       = 'completed',
            processed_at = now(),
            completed_at = now(),
            updated_at   = now()
        WHERE id = v_row.gdpr_request_id;

      -- Write the durable record first; it survives the cascade delete below.
      INSERT INTO account_deletion_log (user_id, gdpr_request_id, scheduled_for, requested_at)
      VALUES (v_row.user_id, v_row.gdpr_request_id, v_row.scheduled_for, v_row.created_at);

      -- Erase the user. FK ON DELETE CASCADE removes the profile and every
      -- dependent row, including this account_deletion_scheduled record itself.
      DELETE FROM auth.users WHERE id = v_row.user_id;

      v_count := v_count + 1;

    EXCEPTION WHEN OTHERS THEN
      -- The failed subtransaction (including its log insert) is rolled back.
      -- Record the failure durably and move on; the schedule row stays intact
      -- (executed = false) so it is retried on the next run.
      INSERT INTO account_deletion_log
        (user_id, gdpr_request_id, scheduled_for, requested_at, status, error_detail)
      VALUES
        (v_row.user_id, v_row.gdpr_request_id, v_row.scheduled_for, v_row.created_at,
         'failed', SQLERRM);
    END;
  END LOOP;

  RETURN v_count;
END;
$$;


--
-- Name: queue_seo_notification(text, text, text, text, text[], text[], jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.queue_seo_notification(p_notification_type text, p_title text, p_message text, p_severity text, p_channels text[], p_recipients text[], p_data jsonb DEFAULT '{}'::jsonb) RETURNS uuid
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO seo_notification_queue (
    notification_type,
    title,
    message,
    severity,
    channels,
    recipients,
    data
  ) VALUES (
    p_notification_type,
    p_title,
    p_message,
    p_severity,
    p_channels,
    p_recipients,
    p_data
  )
  RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$$;


--
-- Name: record_feature_usage(uuid, text, integer, jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.record_feature_usage(_user_id uuid, _feature_key text, _count integer DEFAULT 1, _metadata jsonb DEFAULT '{}'::jsonb) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'extensions', 'pg_temp'
    AS $$
DECLARE
  current_period_start TIMESTAMPTZ := date_trunc('month', NOW());
  current_period_end TIMESTAMPTZ := date_trunc('month', NOW()) + INTERVAL '1 month';
BEGIN
  -- Insert or update usage record
  INSERT INTO public.feature_usage (
    user_id,
    feature_key,
    usage_count,
    usage_period_start,
    usage_period_end,
    metadata
  )
  VALUES (
    _user_id,
    _feature_key,
    _count,
    current_period_start,
    current_period_end,
    _metadata
  )
  ON CONFLICT (user_id, feature_key, usage_period_start)
  DO UPDATE SET
    usage_count = public.feature_usage.usage_count + _count,
    metadata = public.feature_usage.metadata || _metadata,
    updated_at = NOW();

  RETURN TRUE;
EXCEPTION WHEN OTHERS THEN
  RETURN FALSE;
END;
$$;


--
-- Name: record_login_attempt(text, inet, uuid, boolean, text, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.record_login_attempt(p_email text, p_ip_address inet, p_user_id uuid DEFAULT NULL::uuid, p_success boolean DEFAULT false, p_failure_reason text DEFAULT NULL::text, p_user_agent text DEFAULT NULL::text, p_device_fingerprint text DEFAULT NULL::text) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'extensions', 'pg_temp'
    AS $$
DECLARE
  v_attempt_id UUID;
BEGIN
  INSERT INTO login_attempts (
    email, ip_address, user_id, success, failure_reason,
    user_agent, device_fingerprint
  )
  VALUES (
    p_email, p_ip_address, p_user_id, p_success, p_failure_reason,
    p_user_agent, p_device_fingerprint
  )
  RETURNING id INTO v_attempt_id;

  RETURN v_attempt_id;
END;
$$;


--
-- Name: record_system_metric(text, text, numeric, text, jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.record_system_metric(p_metric_type text, p_metric_name text, p_value numeric, p_unit text DEFAULT NULL::text, p_metadata jsonb DEFAULT '{}'::jsonb) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'extensions', 'pg_temp'
    AS $$
DECLARE
  v_metric_id UUID;
BEGIN
  INSERT INTO system_metrics (
    metric_type,
    metric_name,
    value,
    unit,
    metadata
  ) VALUES (
    p_metric_type,
    p_metric_name,
    p_value,
    p_unit,
    p_metadata
  )
  RETURNING id INTO v_metric_id;

  RETURN v_metric_id;
END;
$$;


--
-- Name: refresh_unified_analytics(uuid, date, date); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.refresh_unified_analytics(p_user_id uuid, p_start_date date, p_end_date date) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'extensions', 'pg_temp'
    AS $$
DECLARE
  inserted_count INTEGER := 0;
  row_count_temp INTEGER;
BEGIN
  -- Insert/Update GSC data
  INSERT INTO public.unified_search_analytics (
    user_id, source_platform, source_property_id, date, page_url, query,
    country, device, clicks, impressions, ctr, average_position
  )
  SELECT
    gp.user_id,
    'google_search_console'::TEXT,
    gpp.property_id,
    gpp.date,
    gpp.url,
    NULL, -- GSC page data doesn't include query
    gpp.country,
    gpp.device,
    gpp.clicks,
    gpp.impressions,
    gpp.ctr,
    gpp.position
  FROM public.gsc_page_performance gpp
  JOIN public.gsc_properties gp ON gpp.property_id = gp.id
  WHERE gp.user_id = p_user_id
    AND gpp.date BETWEEN p_start_date AND p_end_date
  ON CONFLICT (user_id, source_platform, date, page_url, query, device, country)
  DO UPDATE SET
    clicks = EXCLUDED.clicks,
    impressions = EXCLUDED.impressions,
    ctr = EXCLUDED.ctr,
    average_position = EXCLUDED.average_position,
    updated_at = now();

  GET DIAGNOSTICS row_count_temp = ROW_COUNT;
  inserted_count := inserted_count + row_count_temp;

  -- Insert/Update GA4 data
  INSERT INTO public.unified_search_analytics (
    user_id, source_platform, source_property_id, date, page_url, page_title,
    country, device, sessions, users, pageviews, bounce_rate, engagement_rate
  )
  SELECT
    gp.user_id,
    'google_analytics'::TEXT,
    gtd.property_id,
    gtd.date,
    gtd.page_path,
    gtd.page_title,
    gtd.country,
    gtd.device_category,
    gtd.sessions,
    gtd.users,
    gtd.pageviews,
    gtd.bounce_rate,
    gtd.engagement_rate
  FROM public.ga4_traffic_data gtd
  JOIN public.ga4_properties gp ON gtd.property_id = gp.id
  WHERE gp.user_id = p_user_id
    AND gtd.date BETWEEN p_start_date AND p_end_date
  ON CONFLICT (user_id, source_platform, date, page_url, query, device, country)
  DO UPDATE SET
    sessions = EXCLUDED.sessions,
    users = EXCLUDED.users,
    pageviews = EXCLUDED.pageviews,
    bounce_rate = EXCLUDED.bounce_rate,
    engagement_rate = EXCLUDED.engagement_rate,
    updated_at = now();

  GET DIAGNOSTICS row_count_temp = ROW_COUNT;
  inserted_count := inserted_count + row_count_temp;

  -- Insert/Update Bing data
  INSERT INTO public.unified_search_analytics (
    user_id, source_platform, source_property_id, date, page_url, query,
    country, device, clicks, impressions, ctr, average_position
  )
  SELECT
    bs.user_id,
    'bing_webmaster'::TEXT,
    bsd.site_id,
    bsd.date,
    bsd.page_url,
    bsd.query,
    bsd.country,
    bsd.device,
    bsd.clicks,
    bsd.impressions,
    bsd.ctr,
    bsd.average_position
  FROM public.bing_webmaster_search_data bsd
  JOIN public.bing_webmaster_sites bs ON bsd.site_id = bs.id
  WHERE bs.user_id = p_user_id
    AND bsd.date BETWEEN p_start_date AND p_end_date
  ON CONFLICT (user_id, source_platform, date, page_url, query, device, country)
  DO UPDATE SET
    clicks = EXCLUDED.clicks,
    impressions = EXCLUDED.impressions,
    ctr = EXCLUDED.ctr,
    average_position = EXCLUDED.average_position,
    updated_at = now();

  GET DIAGNOSTICS row_count_temp = ROW_COUNT;
  inserted_count := inserted_count + row_count_temp;

  -- Insert/Update Yandex data
  INSERT INTO public.unified_search_analytics (
    user_id, source_platform, source_property_id, date, page_url, query,
    device, clicks, impressions, ctr, average_position
  )
  SELECT
    ys.user_id,
    'yandex_webmaster'::TEXT,
    ysd.site_id,
    ysd.date,
    ysd.page_url,
    ysd.query,
    ysd.device,
    ysd.clicks,
    ysd.shows, -- Yandex uses "shows" as impressions
    ysd.ctr,
    ysd.position
  FROM public.yandex_webmaster_search_data ysd
  JOIN public.yandex_webmaster_sites ys ON ysd.site_id = ys.id
  WHERE ys.user_id = p_user_id
    AND ysd.date BETWEEN p_start_date AND p_end_date
  ON CONFLICT (user_id, source_platform, date, page_url, query, device, country)
  DO UPDATE SET
    clicks = EXCLUDED.clicks,
    impressions = EXCLUDED.impressions,
    ctr = EXCLUDED.ctr,
    average_position = EXCLUDED.average_position,
    updated_at = now();

  GET DIAGNOSTICS row_count_temp = ROW_COUNT;
  inserted_count := inserted_count + row_count_temp;

  RETURN inserted_count;
END;
$$;


--
-- Name: request_account_deletion(uuid, text, inet, text, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.request_account_deletion(p_user_id uuid, p_reason text DEFAULT NULL::text, p_ip_address inet DEFAULT NULL::inet, p_user_agent text DEFAULT NULL::text, p_grace_period_days integer DEFAULT 30) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'extensions', 'pg_temp'
    AS $$
DECLARE
  v_request_id UUID;
  v_scheduled_for TIMESTAMPTZ;
  v_existing_deletion UUID;
BEGIN
  v_scheduled_for := now() + (p_grace_period_days || ' days')::INTERVAL;

  -- Check for existing deletion request
  SELECT id INTO v_existing_deletion
  FROM account_deletion_scheduled
  WHERE user_id = p_user_id
    AND cancelled = false
    AND executed = false;

  IF v_existing_deletion IS NOT NULL THEN
    RAISE EXCEPTION 'An account deletion is already scheduled. Cancel it first to create a new request.';
  END IF;

  -- Create GDPR request
  INSERT INTO gdpr_data_requests (
    user_id, request_type, status, scheduled_deletion_at, ip_address, user_agent
  )
  VALUES (
    p_user_id, 'deletion', 'pending', v_scheduled_for, p_ip_address, p_user_agent
  )
  RETURNING id INTO v_request_id;

  -- Create deletion schedule
  INSERT INTO account_deletion_scheduled (
    user_id, gdpr_request_id, reason, scheduled_for, ip_address
  )
  VALUES (
    p_user_id, v_request_id, p_reason, v_scheduled_for, p_ip_address
  );

  -- Log the audit event
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
      'grace_period_days', p_grace_period_days
    ),
    'critical'
  );

  RETURN v_request_id;
END;
$$;


--
-- Name: request_gdpr_data_export(uuid, inet, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.request_gdpr_data_export(p_user_id uuid, p_ip_address inet DEFAULT NULL::inet, p_user_agent text DEFAULT NULL::text) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'extensions', 'pg_temp'
    AS $$
DECLARE
  v_request_id UUID;
  v_pending_count INTEGER;
BEGIN
  -- Check for existing pending request
  SELECT COUNT(*) INTO v_pending_count
  FROM gdpr_data_requests
  WHERE user_id = p_user_id
    AND request_type = 'export'
    AND status IN ('pending', 'processing')
    AND created_at > now() - interval '24 hours';

  IF v_pending_count > 0 THEN
    RAISE EXCEPTION 'A data export request is already pending. Please wait for it to complete.';
  END IF;

  -- Create the request
  INSERT INTO gdpr_data_requests (
    user_id, request_type, status, ip_address, user_agent
  )
  VALUES (
    p_user_id, 'export', 'pending', p_ip_address, p_user_agent
  )
  RETURNING id INTO v_request_id;

  -- Log the audit event
  PERFORM log_audit_event(
    p_user_id,
    'gdpr_export_request',
    'success',
    'gdpr_request',
    v_request_id::TEXT,
    p_ip_address,
    p_user_agent,
    NULL,
    'medium'
  );

  RETURN v_request_id;
END;
$$;


--
-- Name: reset_mfa_failed_attempts(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.reset_mfa_failed_attempts(p_user_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'extensions', 'pg_temp'
    AS $$
BEGIN
  UPDATE user_mfa_settings
  SET
    failed_attempts = 0,
    locked_until = NULL,
    last_used_at = now(),
    updated_at = now()
  WHERE user_id = p_user_id;
END;
$$;


--
-- Name: revoke_all_other_sessions(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.revoke_all_other_sessions(p_user_id uuid, p_current_session_id uuid DEFAULT NULL::uuid) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'extensions', 'pg_temp'
    AS $$
DECLARE
  v_affected INTEGER;
BEGIN
  UPDATE user_sessions
  SET
    revoked = true,
    revoked_at = now(),
    revoked_reason = 'revoke_all_by_user'
  WHERE user_id = p_user_id
    AND revoked = false
    AND (p_current_session_id IS NULL OR id != p_current_session_id);

  GET DIAGNOSTICS v_affected = ROW_COUNT;

  -- Log the action
  IF v_affected > 0 THEN
    PERFORM log_audit_event(
      p_user_id,
      'revoke_all_sessions',
      'success',
      'session',
      NULL,
      NULL,
      NULL,
      jsonb_build_object('sessions_revoked', v_affected, 'preserved_session', p_current_session_id),
      'high'
    );
  END IF;

  RETURN v_affected;
END;
$$;


--
-- Name: revoke_user_session(uuid, uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.revoke_user_session(p_session_id uuid, p_user_id uuid, p_reason text DEFAULT 'user_revoked'::text) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'extensions', 'pg_temp'
    AS $$
DECLARE
  v_affected INTEGER;
BEGIN
  UPDATE user_sessions
  SET
    revoked = true,
    revoked_at = now(),
    revoked_reason = p_reason
  WHERE id = p_session_id
    AND user_id = p_user_id
    AND revoked = false;

  GET DIAGNOSTICS v_affected = ROW_COUNT;

  -- Log the session revocation
  IF v_affected > 0 THEN
    PERFORM log_audit_event(
      p_user_id,
      'session_revoke',
      'success',
      'session',
      p_session_id::TEXT,
      NULL,
      NULL,
      jsonb_build_object('reason', p_reason),
      'medium'
    );
  END IF;

  RETURN v_affected > 0;
END;
$$;


--
-- Name: set_invoice_user_id(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_invoice_user_id() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF NEW.user_id IS NULL AND NEW.stripe_subscription_id IS NOT NULL THEN
    SELECT us.user_id INTO NEW.user_id
    FROM public.user_subscriptions us
    WHERE us.stripe_subscription_id = NEW.stripe_subscription_id
    LIMIT 1;
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: set_lead_first_responded_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_lead_first_responded_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF NEW.first_responded_at IS NULL
     AND OLD.status = 'new'
     AND NEW.status IS DISTINCT FROM 'new' THEN
    NEW.first_responded_at := now();
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: set_published_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_published_at() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF NEW.published = true AND OLD.published = false THEN
    NEW.published_at = now();
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: start_workflow_execution(uuid, text, jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.start_workflow_execution(p_workflow_id uuid, p_trigger_type text, p_trigger_data jsonb DEFAULT '{}'::jsonb) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'extensions', 'pg_temp'
    AS $$
DECLARE
  v_workflow workflows%ROWTYPE;
  v_execution_id UUID;
BEGIN
  -- Get workflow
  SELECT * INTO v_workflow FROM workflows WHERE id = p_workflow_id AND is_active = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Workflow not found or not active';
  END IF;

  -- Create execution
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

  -- Update workflow stats
  UPDATE workflows
  SET
    execution_count = execution_count + 1,
    last_executed_at = now(),
    updated_at = now()
  WHERE id = p_workflow_id;

  RETURN v_execution_id;
END;
$$;


--
-- Name: top_slow_queries(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.top_slow_queries(p_limit integer DEFAULT 10) RETURNS TABLE(query_hash text, endpoint text, max_ms integer, avg_ms numeric, calls bigint)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT query_hash,
         endpoint,
         MAX(duration_ms) AS max_ms,
         ROUND(AVG(duration_ms), 0) AS avg_ms,
         COUNT(*) AS calls
  FROM public.query_metrics
  WHERE created_at >= now() - INTERVAL '24 hours'
  GROUP BY query_hash, endpoint
  ORDER BY max_ms DESC
  LIMIT p_limit;
$$;


--
-- Name: update_autofix_rule_stats(uuid, boolean); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_autofix_rule_stats(p_rule_id uuid, p_success boolean) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  UPDATE seo_autofix_rules
  SET
    applied_count = applied_count + 1,
    success_count = CASE WHEN p_success THEN success_count + 1 ELSE success_count END,
    failure_count = CASE WHEN NOT p_success THEN failure_count + 1 ELSE failure_count END,
    updated_at = now()
  WHERE id = p_rule_id;
END;
$$;


--
-- Name: update_encrypted_pii_config_timestamp(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_encrypted_pii_config_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


--
-- Name: update_keyword_usage(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_keyword_usage() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF NEW.keyword_id IS NOT NULL THEN
    UPDATE public.keywords
    SET
      usage_count = usage_count + 1,
      last_used_at = now(),
      updated_at = now()
    WHERE id = NEW.keyword_id;
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: update_profile_lead_count(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_profile_lead_count() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  PERFORM public.increment_profile_leads(NEW.user_id);
  RETURN NEW;
END;
$$;


--
-- Name: update_pseo_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_pseo_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  IF NEW.is_published = true AND (OLD.is_published = false OR OLD.is_published IS NULL) THEN
    NEW.published_at = NOW();
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


--
-- Name: update_usage_count(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_usage_count() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.usage_tracking (user_id, resource_type, count)
  VALUES (NEW.user_id, TG_ARGV[0], 1)
  ON CONFLICT (user_id, resource_type)
  DO UPDATE SET 
    count = public.usage_tracking.count + 1,
    updated_at = now();
  RETURN NEW;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: ab_test_results; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ab_test_results (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    test_id text NOT NULL,
    analysis jsonb DEFAULT '{}'::jsonb NOT NULL,
    ml_conversion_rate numeric(5,4),
    rules_conversion_rate numeric(5,4),
    winner text,
    confidence numeric(5,4),
    duration_days numeric(10,2),
    ml_count integer DEFAULT 0,
    rules_count integer DEFAULT 0,
    ml_conversions integer DEFAULT 0,
    rules_conversions integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    started_at timestamp with time zone,
    ended_at timestamp with time zone,
    CONSTRAINT ab_test_results_winner_check CHECK ((winner = ANY (ARRAY['ml'::text, 'rules'::text, 'inconclusive'::text])))
);


--
-- Name: account_deletion_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.account_deletion_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    gdpr_request_id uuid,
    scheduled_for timestamp with time zone,
    requested_at timestamp with time zone,
    deleted_at timestamp with time zone DEFAULT now() NOT NULL,
    status text DEFAULT 'completed'::text NOT NULL,
    error_detail text,
    CONSTRAINT account_deletion_log_status_check CHECK ((status = ANY (ARRAY['completed'::text, 'failed'::text])))
);


--
-- Name: account_deletion_scheduled; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.account_deletion_scheduled (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    gdpr_request_id uuid,
    reason text,
    scheduled_for timestamp with time zone NOT NULL,
    cancelled boolean DEFAULT false,
    cancelled_at timestamp with time zone,
    cancelled_reason text,
    executed boolean DEFAULT false,
    executed_at timestamp with time zone,
    anonymization_completed boolean DEFAULT false,
    data_backup_url text,
    ip_address inet,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: admin_audit_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admin_audit_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    admin_id uuid,
    action text NOT NULL,
    target_type text,
    target_id uuid,
    details jsonb DEFAULT '{}'::jsonb,
    ip_address text,
    user_agent text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: ai_configuration; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ai_configuration (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    setting_key text NOT NULL,
    setting_value jsonb NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    updated_by uuid
);


--
-- Name: ai_models; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ai_models (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    model_id text NOT NULL,
    model_name text NOT NULL,
    provider text NOT NULL,
    description text,
    context_window integer DEFAULT 200000,
    max_output_tokens integer DEFAULT 8192,
    supports_vision boolean DEFAULT true,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    auth_type text DEFAULT 'bearer'::text,
    secret_name text,
    api_endpoint text,
    CONSTRAINT ai_models_auth_type_check CHECK ((auth_type = ANY (ARRAY['bearer'::text, 'x-api-key'::text])))
);


--
-- Name: analytics_views; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.analytics_views (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    visitor_id text,
    viewed_at timestamp with time zone DEFAULT now(),
    source text,
    device text,
    location text
);


--
-- Name: api_keys; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.api_keys (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    key_hash text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    last_used_at timestamp with time zone,
    expires_at timestamp with time zone,
    description text,
    scopes text[],
    key_prefix text,
    permissions jsonb DEFAULT '{"read": true, "write": false}'::jsonb NOT NULL,
    revoked_at timestamp with time zone,
    CONSTRAINT api_keys_key_hash_not_empty CHECK ((char_length(key_hash) > 0)),
    CONSTRAINT api_keys_name_not_empty CHECK ((char_length(name) > 0))
);


--
-- Name: article_comments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.article_comments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    article_id uuid NOT NULL,
    user_id uuid,
    content text NOT NULL,
    parent_comment_id uuid,
    is_approved boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: article_webhooks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.article_webhooks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    webhook_url text NOT NULL,
    is_active boolean DEFAULT true,
    event_type text DEFAULT 'publish'::text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    user_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid NOT NULL,
    name text DEFAULT 'Default Webhook'::text NOT NULL,
    CONSTRAINT article_webhooks_event_type_check CHECK ((event_type = ANY (ARRAY['publish'::text, 'update'::text, 'delete'::text])))
);


--
-- Name: articles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.articles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    slug text NOT NULL,
    content text NOT NULL,
    excerpt text,
    featured_image_url text,
    author_id uuid,
    status text DEFAULT 'draft'::text,
    category text DEFAULT 'General'::text,
    tags text[] DEFAULT '{}'::text[],
    seo_title text,
    seo_description text,
    seo_keywords text[],
    view_count integer DEFAULT 0,
    published_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    generated_from_suggestion_id uuid,
    keyword_id uuid,
    CONSTRAINT articles_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'published'::text, 'scheduled'::text, 'archived'::text])))
);


--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    actor_id uuid,
    action text NOT NULL,
    resource_type text,
    resource_id text,
    status text NOT NULL,
    ip_address inet,
    user_agent text,
    details jsonb,
    risk_level text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT audit_logs_risk_level_check CHECK ((risk_level = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'critical'::text]))),
    CONSTRAINT audit_logs_status_check CHECK ((status = ANY (ARRAY['success'::text, 'failure'::text, 'blocked'::text])))
);


--
-- Name: bing_webmaster_oauth_credentials; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bing_webmaster_oauth_credentials (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    access_token text NOT NULL,
    refresh_token text NOT NULL,
    token_type text DEFAULT 'Bearer'::text,
    expires_at timestamp with time zone NOT NULL,
    scope text NOT NULL,
    is_active boolean DEFAULT true,
    last_refreshed_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: bing_webmaster_search_data; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bing_webmaster_search_data (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    site_id uuid NOT NULL,
    date date NOT NULL,
    query text,
    page_url text,
    country text,
    device text,
    clicks integer DEFAULT 0,
    impressions integer DEFAULT 0,
    ctr numeric(10,6),
    average_position numeric(10,2),
    clicks_change integer,
    impressions_change integer,
    ctr_change numeric(10,6),
    position_change numeric(10,2),
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT bing_webmaster_search_data_device_check CHECK ((device = ANY (ARRAY['Desktop'::text, 'Mobile'::text, 'Tablet'::text])))
);


--
-- Name: bing_webmaster_sites; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bing_webmaster_sites (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    credential_id uuid,
    site_url text NOT NULL,
    site_name text,
    is_verified boolean DEFAULT false,
    is_primary boolean DEFAULT false,
    last_synced_at timestamp with time zone,
    sync_status text DEFAULT 'pending'::text,
    sync_error text,
    sync_frequency text DEFAULT 'daily'::text,
    auto_sync_enabled boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT bing_webmaster_sites_sync_frequency_check CHECK ((sync_frequency = ANY (ARRAY['hourly'::text, 'daily'::text, 'weekly'::text, 'manual'::text]))),
    CONSTRAINT bing_webmaster_sites_sync_status_check CHECK ((sync_status = ANY (ARRAY['pending'::text, 'syncing'::text, 'completed'::text, 'failed'::text])))
);


--
-- Name: instagram_bio_analyses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.instagram_bio_analyses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    input_data jsonb NOT NULL,
    result_data jsonb NOT NULL,
    overall_score integer NOT NULL,
    market text,
    session_id text,
    user_agent text,
    ip_address inet
);


--
-- Name: instagram_bio_email_captures; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.instagram_bio_email_captures (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    analysis_id uuid,
    email text NOT NULL,
    first_name text NOT NULL,
    market text NOT NULL,
    brokerage text,
    email_sequence_started boolean DEFAULT false,
    email_sequence_completed boolean DEFAULT false,
    last_email_sent_at timestamp with time zone,
    converted_to_trial boolean DEFAULT false,
    converted_to_paid boolean DEFAULT false,
    converted_at timestamp with time zone,
    referral_code text,
    referrals_count integer DEFAULT 0
);


--
-- Name: bio_analyzer_funnel; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.bio_analyzer_funnel AS
 SELECT count(DISTINCT ia.id) AS total_analyses,
    count(DISTINCT iec.id) AS email_captures,
    count(DISTINCT iec.id) FILTER (WHERE (iec.email_sequence_started = true)) AS sequences_started,
    count(DISTINCT iec.id) FILTER (WHERE (iec.email_sequence_completed = true)) AS sequences_completed,
    count(DISTINCT iec.id) FILTER (WHERE (iec.converted_to_trial = true)) AS trial_signups,
    count(DISTINCT iec.id) FILTER (WHERE (iec.converted_to_paid = true)) AS paid_conversions,
    round((((count(DISTINCT iec.id))::numeric / (NULLIF(count(DISTINCT ia.id), 0))::numeric) * (100)::numeric), 2) AS capture_rate,
    round((((count(DISTINCT iec.id) FILTER (WHERE (iec.converted_to_trial = true)))::numeric / (NULLIF(count(DISTINCT iec.id), 0))::numeric) * (100)::numeric), 2) AS trial_conversion_rate,
    round((((count(DISTINCT iec.id) FILTER (WHERE (iec.converted_to_paid = true)))::numeric / (NULLIF(count(DISTINCT iec.id), 0))::numeric) * (100)::numeric), 2) AS paid_conversion_rate
   FROM (public.instagram_bio_analyses ia
     LEFT JOIN public.instagram_bio_email_captures iec ON ((ia.id = iec.analysis_id)))
  WHERE (ia.created_at >= (CURRENT_DATE - '30 days'::interval));


--
-- Name: instagram_bio_email_sequences; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.instagram_bio_email_sequences (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    email_capture_id uuid,
    sequence_number integer NOT NULL,
    email_subject text NOT NULL,
    sent_at timestamp with time zone,
    opened_at timestamp with time zone,
    clicked_at timestamp with time zone,
    opened boolean DEFAULT false,
    clicked boolean DEFAULT false,
    converted boolean DEFAULT false
);


--
-- Name: bio_email_performance; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.bio_email_performance AS
 SELECT es.sequence_number,
    es.email_subject,
    count(*) AS total_sent,
    count(*) FILTER (WHERE (es.opened = true)) AS total_opened,
    count(*) FILTER (WHERE (es.clicked = true)) AS total_clicked,
    round((avg(
        CASE
            WHEN (es.opened = true) THEN 1
            ELSE 0
        END) * (100)::numeric), 2) AS open_rate,
    round((avg(
        CASE
            WHEN (es.clicked = true) THEN 1
            ELSE 0
        END) * (100)::numeric), 2) AS click_rate,
    count(DISTINCT ec.id) FILTER (WHERE (ec.converted_to_trial = true)) AS conversions_to_trial,
    count(DISTINCT ec.id) FILTER (WHERE (ec.converted_to_paid = true)) AS conversions_to_paid
   FROM (public.instagram_bio_email_sequences es
     JOIN public.instagram_bio_email_captures ec ON ((ec.id = es.email_capture_id)))
  WHERE (es.sent_at IS NOT NULL)
  GROUP BY es.sequence_number, es.email_subject
  ORDER BY es.sequence_number;


--
-- Name: content_suggestions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.content_suggestions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    topic text NOT NULL,
    category text,
    priority integer DEFAULT 1,
    suggested_by uuid,
    status text DEFAULT 'pending'::text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    keywords text[] DEFAULT '{}'::text[],
    generated_article_id uuid,
    CONSTRAINT content_suggestions_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'queued'::text, 'in_progress'::text, 'completed'::text, 'rejected'::text])))
);


--
-- Name: custom_pages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.custom_pages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    slug text NOT NULL,
    title text NOT NULL,
    description text,
    blocks jsonb DEFAULT '[]'::jsonb NOT NULL,
    theme jsonb DEFAULT '{"font": "inter", "colors": {"text": "#1f2937", "accent": "#10b981", "primary": "#3b82f6", "secondary": "#8b5cf6", "background": "#ffffff"}, "preset": "default", "spacing": "normal", "borderRadius": "medium"}'::jsonb NOT NULL,
    seo jsonb DEFAULT '{"title": "", "ogImage": "", "keywords": [], "description": "", "twitterCard": "summary_large_image", "structuredData": null}'::jsonb NOT NULL,
    published boolean DEFAULT false NOT NULL,
    is_active boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    published_at timestamp with time zone
);


--
-- Name: encrypted_pii_config; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.encrypted_pii_config (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    table_name text NOT NULL,
    field_name text NOT NULL,
    encryption_type text DEFAULT 'aes-256-gcm'::text NOT NULL,
    is_encrypted boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: encryption_key_metadata; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.encryption_key_metadata (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    key_id text NOT NULL,
    key_version integer DEFAULT 1 NOT NULL,
    algorithm text DEFAULT 'aes-256-gcm'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    rotated_at timestamp with time zone,
    expires_at timestamp with time zone,
    status text DEFAULT 'active'::text NOT NULL,
    created_by uuid,
    CONSTRAINT encryption_key_metadata_status_check CHECK ((status = ANY (ARRAY['active'::text, 'rotating'::text, 'deprecated'::text, 'revoked'::text])))
);


--
-- Name: enterprise_sso_config; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.enterprise_sso_config (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    organization_id uuid,
    organization_name text NOT NULL,
    organization_domain text NOT NULL,
    sso_provider text NOT NULL,
    saml_entity_id text,
    saml_sso_url text,
    saml_slo_url text,
    saml_certificate text,
    saml_metadata_url text,
    saml_name_id_format text DEFAULT 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress'::text,
    oidc_client_id text,
    oidc_client_secret text,
    oidc_issuer text,
    oidc_authorization_endpoint text,
    oidc_token_endpoint text,
    oidc_userinfo_endpoint text,
    oidc_jwks_uri text,
    oidc_scopes text[] DEFAULT ARRAY['openid'::text, 'email'::text, 'profile'::text],
    attribute_mappings jsonb DEFAULT '{"email": "email", "groups": "groups", "lastName": "family_name", "firstName": "given_name", "displayName": "name"}'::jsonb,
    allowed_groups text[],
    default_role text DEFAULT 'user'::text,
    auto_provision_users boolean DEFAULT true,
    active boolean DEFAULT false,
    verified_at timestamp with time zone,
    last_used_at timestamp with time zone,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT enterprise_sso_config_default_role_check CHECK ((default_role = ANY (ARRAY['user'::text, 'admin'::text]))),
    CONSTRAINT enterprise_sso_config_sso_provider_check CHECK ((sso_provider = ANY (ARRAY['saml'::text, 'oidc'::text, 'azure_ad'::text, 'okta'::text, 'google_workspace'::text])))
);


--
-- Name: error_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.error_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    error_type text NOT NULL,
    error_message text,
    stack_trace text,
    user_context jsonb DEFAULT '{}'::jsonb,
    severity text NOT NULL,
    resolved boolean DEFAULT false,
    resolved_by uuid,
    resolved_at timestamp with time zone,
    resolution_notes text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT error_logs_severity_check CHECK ((severity = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'critical'::text])))
);


--
-- Name: feature_catalog; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.feature_catalog (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    feature_key text NOT NULL,
    name text NOT NULL,
    description text,
    pricing_type text DEFAULT 'included'::text NOT NULL,
    unit_price numeric(10,4),
    unit_name text DEFAULT 'use'::text,
    free_limit integer DEFAULT 0,
    starter_limit integer DEFAULT 0,
    professional_limit integer DEFAULT 0,
    team_limit integer DEFAULT 0,
    enterprise_limit integer,
    is_active boolean DEFAULT true,
    requires_subscription boolean DEFAULT false,
    category text,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: feature_flags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.feature_flags (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    enabled boolean DEFAULT false NOT NULL,
    rollout_percentage integer DEFAULT 0 NOT NULL,
    user_ids uuid[] DEFAULT '{}'::uuid[] NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT feature_flags_rollout_percentage_check CHECK (((rollout_percentage >= 0) AND (rollout_percentage <= 100)))
);


--
-- Name: feature_usage; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.feature_usage (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    feature_key text NOT NULL,
    usage_count integer DEFAULT 0 NOT NULL,
    usage_period_start timestamp with time zone DEFAULT date_trunc('month'::text, now()) NOT NULL,
    usage_period_end timestamp with time zone DEFAULT (date_trunc('month'::text, now()) + '1 mon'::interval) NOT NULL,
    billed_count integer DEFAULT 0,
    pending_count integer GENERATED ALWAYS AS ((usage_count - billed_count)) STORED,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: ga4_oauth_credentials; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ga4_oauth_credentials (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    access_token text NOT NULL,
    refresh_token text NOT NULL,
    token_type text DEFAULT 'Bearer'::text,
    expires_at timestamp with time zone NOT NULL,
    scope text NOT NULL,
    is_active boolean DEFAULT true,
    last_refreshed_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: ga4_properties; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ga4_properties (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    credential_id uuid,
    property_id text NOT NULL,
    property_name text NOT NULL,
    display_name text,
    property_type text DEFAULT 'PROPERTY_TYPE_ORDINARY'::text,
    currency_code text DEFAULT 'USD'::text,
    time_zone text DEFAULT 'America/Los_Angeles'::text,
    is_primary boolean DEFAULT false,
    last_synced_at timestamp with time zone,
    sync_status text DEFAULT 'pending'::text,
    sync_error text,
    sync_frequency text DEFAULT 'daily'::text,
    auto_sync_enabled boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT ga4_properties_sync_frequency_check CHECK ((sync_frequency = ANY (ARRAY['hourly'::text, 'daily'::text, 'weekly'::text, 'manual'::text]))),
    CONSTRAINT ga4_properties_sync_status_check CHECK ((sync_status = ANY (ARRAY['pending'::text, 'syncing'::text, 'completed'::text, 'failed'::text])))
);


--
-- Name: ga4_traffic_data; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ga4_traffic_data (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    property_id uuid NOT NULL,
    date date NOT NULL,
    page_path text,
    page_title text,
    landing_page text,
    source text,
    medium text,
    campaign text,
    device_category text,
    country text,
    city text,
    sessions integer DEFAULT 0,
    users integer DEFAULT 0,
    new_users integer DEFAULT 0,
    pageviews integer DEFAULT 0,
    engaged_sessions integer DEFAULT 0,
    average_session_duration numeric(10,2),
    bounce_rate numeric(10,6),
    engagement_rate numeric(10,6),
    events_per_session numeric(10,2),
    conversions integer DEFAULT 0,
    conversion_rate numeric(10,6),
    total_revenue numeric(12,2),
    sessions_change integer,
    users_change integer,
    pageviews_change integer,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT ga4_traffic_data_device_category_check CHECK ((device_category = ANY (ARRAY['desktop'::text, 'mobile'::text, 'tablet'::text])))
);


--
-- Name: gdpr_data_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.gdpr_data_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    request_type text NOT NULL,
    status text NOT NULL,
    email_verified boolean DEFAULT false,
    verification_token_hash text,
    verification_expires_at timestamp with time zone,
    file_url text,
    file_expires_at timestamp with time zone,
    scheduled_deletion_at timestamp with time zone,
    processed_at timestamp with time zone,
    completed_at timestamp with time zone,
    failed_reason text,
    ip_address inet,
    user_agent text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT gdpr_data_requests_request_type_check CHECK ((request_type = ANY (ARRAY['export'::text, 'deletion'::text, 'access'::text]))),
    CONSTRAINT gdpr_data_requests_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'processing'::text, 'completed'::text, 'failed'::text, 'cancelled'::text])))
);


--
-- Name: gsc_keyword_performance; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.gsc_keyword_performance (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    property_id uuid NOT NULL,
    query text NOT NULL,
    url text,
    country text,
    device text,
    search_type text DEFAULT 'web'::text,
    clicks integer DEFAULT 0,
    impressions integer DEFAULT 0,
    ctr numeric(10,6),
    "position" numeric(10,2),
    date date NOT NULL,
    clicks_change integer,
    impressions_change integer,
    ctr_change numeric(10,6),
    position_change numeric(10,2),
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT gsc_keyword_performance_device_check CHECK ((device = ANY (ARRAY['DESKTOP'::text, 'MOBILE'::text, 'TABLET'::text]))),
    CONSTRAINT gsc_keyword_performance_search_type_check CHECK ((search_type = ANY (ARRAY['web'::text, 'image'::text, 'video'::text, 'news'::text])))
);


--
-- Name: gsc_oauth_credentials; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.gsc_oauth_credentials (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    access_token text NOT NULL,
    refresh_token text NOT NULL,
    token_type text DEFAULT 'Bearer'::text,
    expires_at timestamp with time zone NOT NULL,
    scope text NOT NULL,
    is_active boolean DEFAULT true,
    last_refreshed_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: gsc_page_performance; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.gsc_page_performance (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    property_id uuid NOT NULL,
    url text NOT NULL,
    country text,
    device text,
    search_type text DEFAULT 'web'::text,
    clicks integer DEFAULT 0,
    impressions integer DEFAULT 0,
    ctr numeric(10,6),
    "position" numeric(10,2),
    top_queries jsonb DEFAULT '[]'::jsonb,
    date date NOT NULL,
    page_title text,
    page_description text,
    clicks_change integer,
    impressions_change integer,
    ctr_change numeric(10,6),
    position_change numeric(10,2),
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT gsc_page_performance_device_check CHECK ((device = ANY (ARRAY['DESKTOP'::text, 'MOBILE'::text, 'TABLET'::text]))),
    CONSTRAINT gsc_page_performance_search_type_check CHECK ((search_type = ANY (ARRAY['web'::text, 'image'::text, 'video'::text, 'news'::text])))
);


--
-- Name: gsc_properties; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.gsc_properties (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    credential_id uuid,
    property_url text NOT NULL,
    property_name text,
    property_type text,
    permission_level text,
    is_verified boolean DEFAULT false,
    is_primary boolean DEFAULT false,
    last_synced_at timestamp with time zone,
    sync_status text DEFAULT 'pending'::text,
    sync_error text,
    sync_frequency text DEFAULT 'daily'::text,
    auto_sync_enabled boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT gsc_properties_permission_level_check CHECK ((permission_level = ANY (ARRAY['siteOwner'::text, 'siteFullUser'::text, 'siteRestrictedUser'::text, 'siteUnverifiedUser'::text]))),
    CONSTRAINT gsc_properties_property_type_check CHECK ((property_type = ANY (ARRAY['url_prefix'::text, 'domain'::text, 'sc_domain'::text]))),
    CONSTRAINT gsc_properties_sync_frequency_check CHECK ((sync_frequency = ANY (ARRAY['hourly'::text, 'daily'::text, 'weekly'::text, 'manual'::text]))),
    CONSTRAINT gsc_properties_sync_status_check CHECK ((sync_status = ANY (ARRAY['pending'::text, 'syncing'::text, 'completed'::text, 'failed'::text])))
);


--
-- Name: instagram_bio_analytics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.instagram_bio_analytics (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    event_type text NOT NULL,
    event_data jsonb,
    session_id text NOT NULL,
    user_id uuid,
    user_agent text,
    ip_address inet,
    referrer text
);


--
-- Name: instagram_bio_stats; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.instagram_bio_stats AS
 SELECT count(DISTINCT ia.id) AS total_analyses,
    (avg(ia.overall_score))::numeric(10,2) AS avg_score,
    count(DISTINCT iec.id) AS total_email_captures,
    ((((count(DISTINCT iec.id))::double precision / (NULLIF(count(DISTINCT ia.id), 0))::double precision) * (100)::double precision))::numeric(10,2) AS capture_rate,
    count(DISTINCT
        CASE
            WHEN iec.converted_to_trial THEN iec.id
            ELSE NULL::uuid
        END) AS trial_conversions,
    count(DISTINCT
        CASE
            WHEN iec.converted_to_paid THEN iec.id
            ELSE NULL::uuid
        END) AS paid_conversions,
    count(DISTINCT ia.market) AS unique_markets
   FROM (public.instagram_bio_analyses ia
     LEFT JOIN public.instagram_bio_email_captures iec ON ((ia.id = iec.analysis_id)));


--
-- Name: invoices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.invoices (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    stripe_invoice_id text NOT NULL,
    stripe_subscription_id text,
    amount numeric(12,2) NOT NULL,
    currency text DEFAULT 'usd'::text,
    status text NOT NULL,
    paid_at timestamp with time zone,
    invoice_pdf text,
    hosted_invoice_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: keywords; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.keywords (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    keyword text NOT NULL,
    category text DEFAULT 'General'::text,
    usage_count integer DEFAULT 0,
    last_used_at timestamp with time zone,
    is_active boolean DEFAULT true,
    difficulty text DEFAULT 'medium'::text,
    search_volume integer,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT keywords_difficulty_check CHECK ((difficulty = ANY (ARRAY['easy'::text, 'medium'::text, 'hard'::text])))
);


--
-- Name: lead_activities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lead_activities (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    lead_id uuid NOT NULL,
    user_id uuid NOT NULL,
    activity_type text NOT NULL,
    title text,
    content text,
    previous_status text,
    new_status text,
    email_subject text,
    email_recipient text,
    call_duration_seconds integer,
    call_outcome text,
    meeting_type text,
    meeting_location text,
    meeting_scheduled_at timestamp with time zone,
    task_due_date timestamp with time zone,
    task_completed_at timestamp with time zone,
    task_priority text,
    metadata jsonb DEFAULT '{}'::jsonb,
    is_internal boolean DEFAULT true,
    activity_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: lead_activity_summary; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.lead_activity_summary AS
 SELECT lead_id,
    count(*) AS total_activities,
    count(*) FILTER (WHERE (activity_type = 'note'::text)) AS notes_count,
    count(*) FILTER (WHERE (activity_type = 'email'::text)) AS emails_count,
    count(*) FILTER (WHERE (activity_type = 'call'::text)) AS calls_count,
    count(*) FILTER (WHERE (activity_type = 'meeting'::text)) AS meetings_count,
    count(*) FILTER (WHERE (activity_type = 'status_change'::text)) AS status_changes_count,
    max(activity_at) AS last_activity_at,
    max(activity_at) FILTER (WHERE (activity_type = 'email'::text)) AS last_email_at,
    max(activity_at) FILTER (WHERE (activity_type = 'call'::text)) AS last_call_at,
    min(activity_at) AS first_activity_at
   FROM public.lead_activities la
  GROUP BY lead_id;


--
-- Name: lead_notes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lead_notes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    lead_id uuid NOT NULL,
    note text NOT NULL,
    is_system boolean DEFAULT false NOT NULL,
    created_by uuid DEFAULT auth.uid(),
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: lead_routing_rules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lead_routing_rules (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    team_id uuid NOT NULL,
    name text NOT NULL,
    criteria jsonb DEFAULT '{}'::jsonb NOT NULL,
    assigned_to uuid,
    is_active boolean DEFAULT true NOT NULL,
    priority integer DEFAULT 100 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: lead_scores; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lead_scores (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    lead_id uuid NOT NULL,
    score integer NOT NULL,
    priority text NOT NULL,
    variant text NOT NULL,
    confidence numeric(5,4),
    probability numeric(5,4),
    model_version text,
    feature_importance jsonb,
    converted boolean,
    conversion_recorded_at timestamp with time zone,
    scored_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT lead_scores_priority_check CHECK ((priority = ANY (ARRAY['hot'::text, 'warm'::text, 'cold'::text]))),
    CONSTRAINT lead_scores_score_check CHECK (((score >= 0) AND (score <= 100))),
    CONSTRAINT lead_scores_variant_check CHECK ((variant = ANY (ARRAY['ml'::text, 'rules'::text])))
);


--
-- Name: leads; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.leads (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    lead_type text NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    phone text,
    message text,
    status text DEFAULT 'new'::text,
    source text DEFAULT 'profile_page'::text,
    form_data jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    encrypted_phone text,
    encrypted_email text,
    first_responded_at timestamp with time zone,
    assigned_to uuid,
    contacted_at timestamp with time zone,
    closed_at timestamp with time zone,
    listing_id uuid,
    price_range text,
    timeline text,
    property_address text,
    preapproved boolean,
    notes text,
    referrer_url text,
    utm_source text,
    utm_medium text,
    utm_campaign text,
    device text
);


--
-- Name: links; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.links (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    title text NOT NULL,
    url text NOT NULL,
    icon text,
    "position" integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true,
    click_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: listing_descriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.listing_descriptions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    property_details jsonb NOT NULL,
    descriptions jsonb NOT NULL,
    session_id text,
    user_agent text,
    ip_address inet,
    user_id uuid
);


--
-- Name: listing_email_captures; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.listing_email_captures (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    listing_id uuid,
    email text NOT NULL,
    first_name text NOT NULL,
    brokerage_name text,
    phone_number text,
    email_sequence_started boolean DEFAULT false,
    email_sequence_completed boolean DEFAULT false,
    last_email_sent_at timestamp with time zone,
    converted_to_trial boolean DEFAULT false,
    converted_to_paid boolean DEFAULT false,
    converted_at timestamp with time zone,
    referral_code text,
    referrals_count integer DEFAULT 0
);


--
-- Name: listing_email_sequences; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.listing_email_sequences (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    email_capture_id uuid,
    sequence_number integer NOT NULL,
    email_subject text NOT NULL,
    sent_at timestamp with time zone,
    opened_at timestamp with time zone,
    clicked_at timestamp with time zone,
    opened boolean DEFAULT false,
    clicked boolean DEFAULT false,
    converted boolean DEFAULT false
);


--
-- Name: listing_email_performance; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.listing_email_performance AS
 SELECT sequence_number,
    email_subject,
    count(*) AS total_sent,
    count(*) FILTER (WHERE (opened = true)) AS opens,
    count(*) FILTER (WHERE (clicked = true)) AS clicks,
    count(*) FILTER (WHERE (converted = true)) AS conversions,
    round((((count(*) FILTER (WHERE (opened = true)))::numeric / (NULLIF(count(*), 0))::numeric) * (100)::numeric), 2) AS open_rate,
    round((((count(*) FILTER (WHERE (clicked = true)))::numeric / (NULLIF(count(*), 0))::numeric) * (100)::numeric), 2) AS click_rate,
    round((((count(*) FILTER (WHERE (converted = true)))::numeric / (NULLIF(count(*), 0))::numeric) * (100)::numeric), 2) AS conversion_rate
   FROM public.listing_email_sequences les
  WHERE (sent_at IS NOT NULL)
  GROUP BY sequence_number, email_subject
  ORDER BY sequence_number;


--
-- Name: listing_generator_analytics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.listing_generator_analytics (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    event_type text NOT NULL,
    event_data jsonb,
    session_id text NOT NULL,
    user_id uuid,
    user_agent text,
    ip_address inet,
    referrer text
);


--
-- Name: listing_generator_funnel; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.listing_generator_funnel AS
 SELECT count(DISTINCT ld.id) AS total_generations,
    count(DISTINCT lec.id) AS email_captures,
    count(DISTINCT lec.id) FILTER (WHERE (lec.email_sequence_started = true)) AS sequences_started,
    count(DISTINCT lec.id) FILTER (WHERE (lec.email_sequence_completed = true)) AS sequences_completed,
    count(DISTINCT lec.id) FILTER (WHERE (lec.converted_to_trial = true)) AS trial_signups,
    count(DISTINCT lec.id) FILTER (WHERE (lec.converted_to_paid = true)) AS paid_conversions,
    round((((count(DISTINCT lec.id))::numeric / (NULLIF(count(DISTINCT ld.id), 0))::numeric) * (100)::numeric), 2) AS capture_rate,
    round((((count(DISTINCT lec.id) FILTER (WHERE (lec.converted_to_trial = true)))::numeric / (NULLIF(count(DISTINCT lec.id), 0))::numeric) * (100)::numeric), 2) AS trial_conversion_rate,
    round((((count(DISTINCT lec.id) FILTER (WHERE (lec.converted_to_paid = true)))::numeric / (NULLIF(count(DISTINCT lec.id), 0))::numeric) * (100)::numeric), 2) AS paid_conversion_rate
   FROM (public.listing_descriptions ld
     LEFT JOIN public.listing_email_captures lec ON ((ld.id = lec.listing_id)))
  WHERE (ld.created_at >= (CURRENT_DATE - '30 days'::interval));


--
-- Name: listing_generator_stats; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.listing_generator_stats AS
 SELECT count(DISTINCT ld.id) AS total_generations,
    count(DISTINCT lec.id) AS total_email_captures,
    ((((count(DISTINCT lec.id))::double precision / (NULLIF(count(DISTINCT ld.id), 0))::double precision) * (100)::double precision))::numeric(10,2) AS capture_rate,
    count(DISTINCT
        CASE
            WHEN lec.converted_to_trial THEN lec.id
            ELSE NULL::uuid
        END) AS trial_conversions,
    count(DISTINCT
        CASE
            WHEN lec.converted_to_paid THEN lec.id
            ELSE NULL::uuid
        END) AS paid_conversions,
    count(DISTINCT (ld.property_details ->> 'city'::text)) AS unique_markets
   FROM (public.listing_descriptions ld
     LEFT JOIN public.listing_email_captures lec ON ((ld.id = lec.listing_id)))
  WHERE (ld.created_at >= (CURRENT_DATE - '30 days'::interval));


--
-- Name: listing_popular_features; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.listing_popular_features AS
 SELECT feature.value AS feature,
    count(*) AS count
   FROM public.listing_descriptions,
    LATERAL jsonb_array_elements_text((listing_descriptions.property_details -> 'selectedFeatures'::text)) feature(value)
  WHERE (listing_descriptions.created_at >= (CURRENT_DATE - '30 days'::interval))
  GROUP BY feature.value
  ORDER BY (count(*)) DESC
 LIMIT 20;


--
-- Name: listing_property_types; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.listing_property_types AS
 SELECT (property_details ->> 'propertyType'::text) AS property_type,
    count(*) AS count,
    round((((count(*))::numeric / sum(count(*)) OVER ()) * (100)::numeric), 2) AS percentage
   FROM public.listing_descriptions
  WHERE (created_at >= (CURRENT_DATE - '30 days'::interval))
  GROUP BY (property_details ->> 'propertyType'::text)
  ORDER BY (count(*)) DESC;


--
-- Name: listings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.listings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    image text,
    address text NOT NULL,
    city text NOT NULL,
    price text NOT NULL,
    beds integer NOT NULL,
    baths integer NOT NULL,
    sqft integer,
    status text DEFAULT 'active'::text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    bedrooms numeric(3,1),
    bathrooms numeric(3,1),
    square_feet integer,
    lot_size_acres numeric(10,2),
    property_type text,
    description text,
    mls_number text,
    listed_date date,
    sold_date date,
    days_on_market integer,
    photos jsonb DEFAULT '[]'::jsonb,
    virtual_tour_url text,
    is_featured boolean DEFAULT false,
    sort_order integer DEFAULT 0
);


--
-- Name: login_attempts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.login_attempts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email text NOT NULL,
    ip_address inet NOT NULL,
    user_id uuid,
    success boolean DEFAULT false NOT NULL,
    failure_reason text,
    user_agent text,
    device_fingerprint text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: mfa_temp_codes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mfa_temp_codes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    code_hash text NOT NULL,
    code_type text NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    used boolean DEFAULT false,
    used_at timestamp with time zone,
    attempts integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT mfa_temp_codes_code_type_check CHECK ((code_type = ANY (ARRAY['email'::text, 'sms'::text, 'setup_verification'::text])))
);


--
-- Name: mfa_trusted_devices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mfa_trusted_devices (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    device_fingerprint text NOT NULL,
    device_name text,
    browser text,
    os text,
    ip_address inet,
    last_used_at timestamp with time zone DEFAULT now(),
    trusted_until timestamp with time zone NOT NULL,
    revoked boolean DEFAULT false,
    revoked_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: mfa_verification_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mfa_verification_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    method text NOT NULL,
    status text NOT NULL,
    ip_address inet,
    user_agent text,
    device_fingerprint text,
    failure_reason text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT mfa_verification_logs_method_check CHECK ((method = ANY (ARRAY['totp'::text, 'email'::text, 'sms'::text, 'backup_code'::text]))),
    CONSTRAINT mfa_verification_logs_status_check CHECK ((status = ANY (ARRAY['success'::text, 'failed'::text, 'expired'::text, 'blocked'::text])))
);


--
-- Name: ml_model_weights; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ml_model_weights (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    weights jsonb DEFAULT '{}'::jsonb NOT NULL,
    version text,
    training_examples integer DEFAULT 0,
    accuracy numeric(5,4),
    auc numeric(5,4),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: ml_training_examples; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ml_training_examples (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    lead_id uuid NOT NULL,
    features jsonb NOT NULL,
    converted boolean NOT NULL,
    source text,
    lead_type text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    lead_created_at timestamp with time zone,
    conversion_recorded_at timestamp with time zone
);


--
-- Name: monthly_usage_summary; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.monthly_usage_summary (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    period_year integer NOT NULL,
    period_month integer NOT NULL,
    total_usage_amount numeric(10,2) DEFAULT 0,
    features_used jsonb DEFAULT '{}'::jsonb,
    billing_status text DEFAULT 'pending'::text,
    stripe_invoice_id text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: mortgage_calculations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mortgage_calculations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    listing_id uuid,
    home_price numeric(14,2) NOT NULL,
    down_payment numeric(14,2),
    down_payment_percent numeric(6,3),
    interest_rate numeric(6,3),
    loan_term_years integer,
    property_tax_annual numeric(14,2),
    home_insurance_annual numeric(14,2),
    hoa_monthly numeric(14,2),
    pmi_monthly numeric(14,2),
    loan_amount numeric(14,2),
    monthly_payment numeric(14,2),
    monthly_payment_breakdown jsonb DEFAULT '{}'::jsonb NOT NULL,
    total_interest numeric(14,2),
    total_cost numeric(14,2),
    visitor_name text,
    visitor_email text,
    visitor_phone text,
    lead_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    type text NOT NULL,
    title text NOT NULL,
    message text,
    data jsonb,
    read_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: pii_encryption_audit; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pii_encryption_audit (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    operation text NOT NULL,
    table_name text NOT NULL,
    record_id text,
    fields_affected text[],
    success boolean DEFAULT true NOT NULL,
    error_message text,
    ip_address inet,
    user_agent text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT pii_encryption_audit_operation_check CHECK ((operation = ANY (ARRAY['encrypt'::text, 'decrypt'::text, 'key_rotation'::text, 'config_change'::text])))
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    username text NOT NULL,
    full_name text,
    bio text,
    avatar_url text,
    theme text DEFAULT 'default'::text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    title text,
    license_number text,
    license_state text,
    brokerage_name text,
    brokerage_logo text,
    years_experience integer,
    specialties jsonb DEFAULT '[]'::jsonb,
    certifications jsonb DEFAULT '[]'::jsonb,
    service_cities jsonb DEFAULT '[]'::jsonb,
    service_zip_codes jsonb DEFAULT '[]'::jsonb,
    phone text,
    sms_enabled boolean DEFAULT false,
    email_display text,
    instagram_url text,
    facebook_url text,
    linkedin_url text,
    tiktok_url text,
    youtube_url text,
    zillow_url text,
    realtor_com_url text,
    website_url text,
    seo_title text,
    seo_description text,
    og_image text,
    is_published boolean DEFAULT true,
    custom_css text,
    custom_domain text,
    view_count integer DEFAULT 0,
    lead_count integer DEFAULT 0,
    link_click_count integer DEFAULT 0,
    zapier_webhook_url text,
    calendly_url text,
    notification_preferences jsonb DEFAULT '{"leads": "instant"}'::jsonb NOT NULL,
    onboarding_completed_at timestamp with time zone
);


--
-- Name: pseo_combination_queue; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pseo_combination_queue (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    page_type text NOT NULL,
    combination jsonb NOT NULL,
    priority integer DEFAULT 5 NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    queued_at timestamp with time zone DEFAULT now(),
    processed_at timestamp with time zone,
    error_message text,
    attempt_count integer DEFAULT 0,
    CONSTRAINT pseo_combination_queue_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'processing'::text, 'complete'::text, 'failed'::text, 'insufficient_data'::text])))
);


--
-- Name: pseo_generation_errors; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pseo_generation_errors (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    page_type text NOT NULL,
    combination jsonb NOT NULL,
    error_type text NOT NULL,
    error_detail text,
    quality_check_failures jsonb,
    raw_response text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT pseo_generation_errors_error_type_check CHECK ((error_type = ANY (ARRAY['api_error'::text, 'validation_failed'::text, 'quality_check_failed'::text, 'timeout'::text, 'parse_error'::text])))
);


--
-- Name: pseo_pages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pseo_pages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    page_type text NOT NULL,
    url_path text NOT NULL,
    combination jsonb NOT NULL,
    content jsonb NOT NULL,
    is_published boolean DEFAULT false,
    quality_score integer DEFAULT 0,
    agent_count integer DEFAULT 0 NOT NULL,
    content_hash text,
    generated_at timestamp with time zone DEFAULT now(),
    published_at timestamp with time zone,
    updated_at timestamp with time zone DEFAULT now(),
    next_refresh_at timestamp with time zone,
    generation_model text DEFAULT 'claude-sonnet-4-20250514'::text,
    error_count integer DEFAULT 0,
    CONSTRAINT pseo_pages_page_type_check CHECK ((page_type = ANY (ARRAY['city-directory'::text, 'city-specialty'::text, 'city-buyers-agent'::text, 'city-listing-agent'::text, 'state-directory'::text, 'neighborhood-directory'::text, 'city-situation'::text]))),
    CONSTRAINT valid_url_path CHECK ((url_path ~ '^/[a-z0-9-/]+$'::text))
);


--
-- Name: pseo_prompts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pseo_prompts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    page_type text NOT NULL,
    system_prompt text NOT NULL,
    user_prompt_template text NOT NULL,
    version integer DEFAULT 1,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: pseo_taxonomy; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pseo_taxonomy (
    id text NOT NULL,
    taxonomy_type text NOT NULL,
    display_name text NOT NULL,
    parent_id text,
    context jsonb NOT NULL,
    is_active boolean DEFAULT true,
    tier integer DEFAULT 3,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT pseo_taxonomy_taxonomy_type_check CHECK ((taxonomy_type = ANY (ARRAY['city'::text, 'state'::text, 'neighborhood'::text, 'specialty'::text, 'situation'::text, 'property_type'::text])))
);


--
-- Name: query_metrics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.query_metrics (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    query_hash text NOT NULL,
    duration_ms integer NOT NULL,
    endpoint text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: rate_limit_entries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rate_limit_entries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    identifier text NOT NULL,
    limit_type text NOT NULL,
    request_count integer DEFAULT 1,
    window_start timestamp with time zone DEFAULT now(),
    window_end timestamp with time zone NOT NULL,
    blocked_until timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: rate_limits; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rate_limits (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ip_address text NOT NULL,
    endpoint text NOT NULL,
    request_count integer DEFAULT 1 NOT NULL,
    window_start timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: search_dashboard_config; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.search_dashboard_config (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    default_date_range text DEFAULT '30days'::text,
    default_comparison_period text DEFAULT 'previous_period'::text,
    default_grouping text DEFAULT 'daily'::text,
    enabled_platforms jsonb DEFAULT '["google_search_console", "google_analytics"]'::jsonb,
    primary_platform text DEFAULT 'google_search_console'::text,
    dashboard_layout jsonb DEFAULT '[]'::jsonb,
    visible_metrics jsonb DEFAULT '["clicks", "impressions", "ctr", "position", "sessions", "users"]'::jsonb,
    enable_alerts boolean DEFAULT true,
    alert_thresholds jsonb DEFAULT '{}'::jsonb,
    export_format text DEFAULT 'csv'::text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT search_dashboard_config_default_comparison_period_check CHECK ((default_comparison_period = ANY (ARRAY['previous_period'::text, 'previous_year'::text, 'none'::text]))),
    CONSTRAINT search_dashboard_config_default_date_range_check CHECK ((default_date_range = ANY (ARRAY['7days'::text, '30days'::text, '90days'::text, '6months'::text, '1year'::text, 'custom'::text]))),
    CONSTRAINT search_dashboard_config_default_grouping_check CHECK ((default_grouping = ANY (ARRAY['hourly'::text, 'daily'::text, 'weekly'::text, 'monthly'::text]))),
    CONSTRAINT search_dashboard_config_export_format_check CHECK ((export_format = ANY (ARRAY['csv'::text, 'xlsx'::text, 'json'::text, 'pdf'::text])))
);


--
-- Name: seo_alert_rules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.seo_alert_rules (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    rule_type text NOT NULL,
    severity text DEFAULT 'medium'::text,
    conditions jsonb DEFAULT '{}'::jsonb NOT NULL,
    is_active boolean DEFAULT true,
    last_triggered_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT seo_alert_rules_rule_type_check CHECK ((rule_type = ANY (ARRAY['ranking_drop'::text, 'ranking_increase'::text, 'traffic_drop'::text, 'broken_links'::text, 'security_issue'::text, 'mobile_usability'::text, 'crawl_error'::text, 'duplicate_content'::text, 'missing_meta_tags'::text, 'custom'::text]))),
    CONSTRAINT seo_alert_rules_severity_check CHECK ((severity = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'critical'::text])))
);


--
-- Name: seo_alerts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.seo_alerts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    alert_rule_id uuid,
    alert_type text NOT NULL,
    severity text NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    affected_url text,
    status text DEFAULT 'open'::text,
    user_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT seo_alerts_severity_check CHECK ((severity = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'critical'::text]))),
    CONSTRAINT seo_alerts_status_check CHECK ((status = ANY (ARRAY['open'::text, 'acknowledged'::text, 'resolved'::text, 'ignored'::text])))
);


--
-- Name: seo_audit_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.seo_audit_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    url text NOT NULL,
    audit_type text DEFAULT 'full'::text,
    overall_score integer,
    performance_score integer,
    seo_score integer,
    accessibility_score integer,
    best_practices_score integer,
    has_title boolean DEFAULT false,
    title_length integer,
    has_description boolean DEFAULT false,
    description_length integer,
    has_keywords boolean DEFAULT false,
    has_canonical boolean DEFAULT false,
    has_og_tags boolean DEFAULT false,
    has_twitter_cards boolean DEFAULT false,
    has_robots_txt boolean DEFAULT false,
    has_sitemap boolean DEFAULT false,
    has_ssl boolean DEFAULT false,
    has_favicon boolean DEFAULT false,
    mobile_friendly boolean DEFAULT false,
    page_load_time numeric(10,2),
    word_count integer,
    heading_structure jsonb DEFAULT '{}'::jsonb,
    internal_links_count integer DEFAULT 0,
    external_links_count integer DEFAULT 0,
    broken_links_count integer DEFAULT 0,
    images_count integer DEFAULT 0,
    images_with_alt_count integer DEFAULT 0,
    critical_issues jsonb DEFAULT '[]'::jsonb,
    warnings jsonb DEFAULT '[]'::jsonb,
    recommendations jsonb DEFAULT '[]'::jsonb,
    raw_audit_data jsonb DEFAULT '{}'::jsonb,
    audit_duration_ms integer,
    performed_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT seo_audit_history_accessibility_score_check CHECK (((accessibility_score >= 0) AND (accessibility_score <= 100))),
    CONSTRAINT seo_audit_history_audit_type_check CHECK ((audit_type = ANY (ARRAY['full'::text, 'quick'::text, 'technical'::text, 'content'::text, 'performance'::text]))),
    CONSTRAINT seo_audit_history_best_practices_score_check CHECK (((best_practices_score >= 0) AND (best_practices_score <= 100))),
    CONSTRAINT seo_audit_history_overall_score_check CHECK (((overall_score >= 0) AND (overall_score <= 100))),
    CONSTRAINT seo_audit_history_performance_score_check CHECK (((performance_score >= 0) AND (performance_score <= 100))),
    CONSTRAINT seo_audit_history_seo_score_check CHECK (((seo_score >= 0) AND (seo_score <= 100)))
);


--
-- Name: seo_audit_schedules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.seo_audit_schedules (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    schedule_type text NOT NULL,
    cron_expression text,
    audit_config jsonb DEFAULT '{}'::jsonb,
    notification_channels text[] DEFAULT ARRAY[]::text[],
    notification_recipients text[] DEFAULT ARRAY[]::text[],
    active boolean DEFAULT true,
    last_run_at timestamp with time zone,
    next_run_at timestamp with time zone,
    last_run_status text,
    last_run_results jsonb,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT seo_audit_schedules_last_run_status_check CHECK ((last_run_status = ANY (ARRAY['success'::text, 'failed'::text, 'running'::text]))),
    CONSTRAINT seo_audit_schedules_schedule_type_check CHECK ((schedule_type = ANY (ARRAY['daily'::text, 'weekly'::text, 'monthly'::text, 'cron'::text])))
);


--
-- Name: seo_autofix_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.seo_autofix_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    rule_id uuid,
    issue_id uuid,
    issue_type text NOT NULL,
    fix_applied jsonb NOT NULL,
    result text NOT NULL,
    error_message text,
    approved_by uuid,
    applied_by uuid,
    applied_at timestamp with time zone DEFAULT now(),
    rolled_back_at timestamp with time zone,
    rollback_reason text,
    CONSTRAINT seo_autofix_history_result_check CHECK ((result = ANY (ARRAY['success'::text, 'failed'::text, 'rolled_back'::text, 'pending_approval'::text])))
);


--
-- Name: seo_autofix_rules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.seo_autofix_rules (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    issue_type text NOT NULL,
    conditions jsonb DEFAULT '{}'::jsonb,
    fix_action jsonb NOT NULL,
    requires_approval boolean DEFAULT true,
    auto_apply boolean DEFAULT false,
    priority integer DEFAULT 50,
    applied_count integer DEFAULT 0,
    success_count integer DEFAULT 0,
    failure_count integer DEFAULT 0,
    active boolean DEFAULT true,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: seo_automation_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.seo_automation_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    automation_type text NOT NULL,
    automation_id uuid,
    status text NOT NULL,
    message text,
    details jsonb DEFAULT '{}'::jsonb,
    duration_ms integer,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT seo_automation_logs_automation_type_check CHECK ((automation_type = ANY (ARRAY['audit'::text, 'autofix'::text, 'competitor_check'::text, 'report_generation'::text]))),
    CONSTRAINT seo_automation_logs_status_check CHECK ((status = ANY (ARRAY['started'::text, 'running'::text, 'completed'::text, 'failed'::text])))
);


--
-- Name: seo_competitor_analysis; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.seo_competitor_analysis (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    competitor_domain text NOT NULL,
    competitor_name text,
    our_domain text NOT NULL,
    shared_keywords integer DEFAULT 0,
    keywords_we_rank_better integer DEFAULT 0,
    keywords_they_rank_better integer DEFAULT 0,
    keyword_gap_count integer DEFAULT 0,
    estimated_monthly_traffic integer,
    estimated_monthly_traffic_value numeric(10,2),
    domain_authority integer,
    page_authority integer,
    trust_flow integer,
    citation_flow integer,
    backlinks_count integer DEFAULT 0,
    referring_domains integer DEFAULT 0,
    total_pages integer,
    indexed_pages integer,
    blog_post_count integer,
    content_update_frequency text,
    mobile_friendly boolean,
    page_speed_score integer,
    has_ssl boolean,
    has_sitemap boolean,
    top_performing_keywords jsonb DEFAULT '[]'::jsonb,
    keyword_gap_list jsonb DEFAULT '[]'::jsonb,
    top_pages jsonb DEFAULT '[]'::jsonb,
    content_gaps jsonb DEFAULT '[]'::jsonb,
    backlink_profile jsonb DEFAULT '{}'::jsonb,
    analysis_date timestamp with time zone DEFAULT now(),
    data_source text,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    analyzed_by uuid,
    CONSTRAINT seo_competitor_analysis_data_source_check CHECK ((data_source = ANY (ARRAY['manual'::text, 'ahrefs'::text, 'semrush'::text, 'moz'::text, 'serpapi'::text, 'gsc'::text]))),
    CONSTRAINT seo_competitor_analysis_domain_authority_check CHECK (((domain_authority >= 0) AND (domain_authority <= 100))),
    CONSTRAINT seo_competitor_analysis_page_authority_check CHECK (((page_authority >= 0) AND (page_authority <= 100))),
    CONSTRAINT seo_competitor_analysis_page_speed_score_check CHECK (((page_speed_score >= 0) AND (page_speed_score <= 100)))
);


--
-- Name: seo_competitor_tracking; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.seo_competitor_tracking (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    competitor_domain text NOT NULL,
    competitor_name text,
    keywords text[] DEFAULT ARRAY[]::text[],
    check_frequency text DEFAULT 'weekly'::text,
    last_checked_at timestamp with time zone,
    next_check_at timestamp with time zone,
    alert_on_rank_change boolean DEFAULT true,
    alert_on_new_backlinks boolean DEFAULT true,
    alert_on_content_updates boolean DEFAULT false,
    rank_change_threshold integer DEFAULT 5,
    notification_channels text[] DEFAULT ARRAY['in_app'::text],
    notification_recipients text[] DEFAULT ARRAY[]::text[],
    active boolean DEFAULT true,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT seo_competitor_tracking_check_frequency_check CHECK ((check_frequency = ANY (ARRAY['daily'::text, 'weekly'::text, 'biweekly'::text, 'monthly'::text])))
);


--
-- Name: seo_content_optimization; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.seo_content_optimization (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    url text NOT NULL,
    page_title text,
    target_keyword text,
    word_count integer,
    paragraph_count integer,
    sentence_count integer,
    average_sentence_length numeric(5,2),
    flesch_reading_ease numeric(5,2),
    flesch_kincaid_grade numeric(5,2),
    readability_level text,
    readability_score integer,
    keyword_density numeric(5,2),
    keyword_count integer,
    keyword_in_title boolean DEFAULT false,
    keyword_in_h1 boolean DEFAULT false,
    keyword_in_first_paragraph boolean DEFAULT false,
    keyword_in_url boolean DEFAULT false,
    keyword_prominence_score integer,
    h1_count integer DEFAULT 0,
    h2_count integer DEFAULT 0,
    h3_count integer DEFAULT 0,
    h4_count integer DEFAULT 0,
    h5_count integer DEFAULT 0,
    h6_count integer DEFAULT 0,
    heading_structure_score integer,
    content_quality_score integer,
    uniqueness_score integer,
    engagement_score integer,
    lsi_keywords text[] DEFAULT '{}'::text[],
    lsi_keywords_found integer DEFAULT 0,
    lsi_keywords_recommended text[] DEFAULT '{}'::text[],
    lsi_coverage_score integer,
    topic_coverage_score integer,
    missing_topics text[] DEFAULT '{}'::text[],
    covered_topics text[] DEFAULT '{}'::text[],
    ai_summary text,
    ai_suggestions jsonb DEFAULT '[]'::jsonb,
    title_suggestions text[] DEFAULT '{}'::text[],
    meta_description_suggestions text[] DEFAULT '{}'::text[],
    heading_suggestions jsonb DEFAULT '[]'::jsonb,
    content_additions text[] DEFAULT '{}'::text[],
    image_suggestions text[] DEFAULT '{}'::text[],
    video_suggestions text[] DEFAULT '{}'::text[],
    infographic_topics text[] DEFAULT '{}'::text[],
    recommended_internal_links jsonb DEFAULT '[]'::jsonb,
    optimization_score integer,
    optimization_level text,
    status text DEFAULT 'analyzed'::text,
    optimized_at timestamp with time zone,
    competitor_avg_word_count integer,
    competitor_avg_readability numeric(5,2),
    competitive_gap text,
    analyzed_at timestamp with time zone DEFAULT now(),
    analyzed_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT seo_content_optimization_content_quality_score_check CHECK (((content_quality_score >= 0) AND (content_quality_score <= 100))),
    CONSTRAINT seo_content_optimization_engagement_score_check CHECK (((engagement_score >= 0) AND (engagement_score <= 100))),
    CONSTRAINT seo_content_optimization_heading_structure_score_check CHECK (((heading_structure_score >= 0) AND (heading_structure_score <= 100))),
    CONSTRAINT seo_content_optimization_keyword_prominence_score_check CHECK (((keyword_prominence_score >= 0) AND (keyword_prominence_score <= 100))),
    CONSTRAINT seo_content_optimization_lsi_coverage_score_check CHECK (((lsi_coverage_score >= 0) AND (lsi_coverage_score <= 100))),
    CONSTRAINT seo_content_optimization_optimization_level_check CHECK ((optimization_level = ANY (ARRAY['poor'::text, 'fair'::text, 'good'::text, 'excellent'::text]))),
    CONSTRAINT seo_content_optimization_optimization_score_check CHECK (((optimization_score >= 0) AND (optimization_score <= 100))),
    CONSTRAINT seo_content_optimization_readability_score_check CHECK (((readability_score >= 0) AND (readability_score <= 100))),
    CONSTRAINT seo_content_optimization_status_check CHECK ((status = ANY (ARRAY['analyzed'::text, 'optimizing'::text, 'optimized'::text, 'published'::text]))),
    CONSTRAINT seo_content_optimization_topic_coverage_score_check CHECK (((topic_coverage_score >= 0) AND (topic_coverage_score <= 100))),
    CONSTRAINT seo_content_optimization_uniqueness_score_check CHECK (((uniqueness_score >= 0) AND (uniqueness_score <= 100)))
);


--
-- Name: seo_content_optimization_summary; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.seo_content_optimization_summary AS
 SELECT count(*) AS total_pages,
    count(*) FILTER (WHERE (optimization_score >= 90)) AS excellent_pages,
    count(*) FILTER (WHERE ((optimization_score >= 70) AND (optimization_score < 90))) AS good_pages,
    count(*) FILTER (WHERE ((optimization_score >= 50) AND (optimization_score < 70))) AS fair_pages,
    count(*) FILTER (WHERE (optimization_score < 50)) AS poor_pages,
    (avg(optimization_score))::numeric(5,2) AS avg_optimization_score,
    (avg(readability_score))::numeric(5,2) AS avg_readability_score,
    (avg(word_count))::integer AS avg_word_count
   FROM public.seo_content_optimization;


--
-- Name: seo_core_web_vitals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.seo_core_web_vitals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    url text NOT NULL,
    device text NOT NULL,
    lcp numeric(10,2),
    fid numeric(10,2),
    cls numeric(5,3),
    fcp numeric(10,2),
    ttfb numeric(10,2),
    tti numeric(10,2),
    tbt numeric(10,2),
    si numeric(10,2),
    performance_score integer,
    overall_category text,
    lcp_pass boolean,
    fid_pass boolean,
    cls_pass boolean,
    lab_data jsonb DEFAULT '{}'::jsonb,
    field_data jsonb DEFAULT '{}'::jsonb,
    opportunities jsonb DEFAULT '[]'::jsonb,
    diagnostics jsonb DEFAULT '[]'::jsonb,
    data_source text DEFAULT 'pagespeed'::text,
    fetch_time_ms integer,
    measured_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT seo_core_web_vitals_data_source_check CHECK ((data_source = ANY (ARRAY['pagespeed'::text, 'crux'::text, 'lighthouse'::text, 'manual'::text]))),
    CONSTRAINT seo_core_web_vitals_device_check CHECK ((device = ANY (ARRAY['mobile'::text, 'desktop'::text]))),
    CONSTRAINT seo_core_web_vitals_overall_category_check CHECK ((overall_category = ANY (ARRAY['FAST'::text, 'AVERAGE'::text, 'SLOW'::text]))),
    CONSTRAINT seo_core_web_vitals_performance_score_check CHECK (((performance_score >= 0) AND (performance_score <= 100)))
);


--
-- Name: seo_crawl_results; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.seo_crawl_results (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    crawl_session_id uuid NOT NULL,
    url text NOT NULL,
    parent_url text,
    status_code integer,
    response_time_ms integer,
    redirect_url text,
    redirect_chain jsonb DEFAULT '[]'::jsonb,
    title text,
    title_length integer,
    description text,
    description_length integer,
    canonical_url text,
    h1 text,
    h1_count integer DEFAULT 0,
    word_count integer,
    content_hash text,
    language text,
    internal_links integer DEFAULT 0,
    external_links integer DEFAULT 0,
    broken_links integer DEFAULT 0,
    links_found jsonb DEFAULT '[]'::jsonb,
    images_count integer DEFAULT 0,
    images_without_alt integer DEFAULT 0,
    images_data jsonb DEFAULT '[]'::jsonb,
    has_robots_meta boolean DEFAULT false,
    robots_content text,
    has_canonical boolean DEFAULT false,
    has_viewport boolean DEFAULT false,
    has_schema boolean DEFAULT false,
    schema_types text[] DEFAULT '{}'::text[],
    page_size_kb integer,
    load_time_ms integer,
    resources_count integer,
    issues jsonb DEFAULT '[]'::jsonb,
    warnings jsonb DEFAULT '[]'::jsonb,
    crawl_depth integer DEFAULT 0,
    is_indexable boolean DEFAULT true,
    is_crawlable boolean DEFAULT true,
    crawled_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: seo_duplicate_content; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.seo_duplicate_content (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    content_hash text NOT NULL,
    content_snippet text,
    urls jsonb DEFAULT '[]'::jsonb NOT NULL,
    url_count integer DEFAULT 0,
    primary_url text,
    similarity_score numeric(5,2),
    duplicate_type text,
    word_count integer,
    title_duplicate boolean DEFAULT false,
    description_duplicate boolean DEFAULT false,
    h1_duplicate boolean DEFAULT false,
    impact_level text,
    affects_rankings boolean DEFAULT false,
    status text DEFAULT 'detected'::text,
    resolution_method text,
    resolution_notes text,
    resolved_at timestamp with time zone,
    resolved_by uuid,
    first_detected_at timestamp with time zone DEFAULT now(),
    last_checked_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT seo_duplicate_content_duplicate_type_check CHECK ((duplicate_type = ANY (ARRAY['exact'::text, 'near_duplicate'::text, 'partial'::text, 'thin_content'::text, 'scraped'::text]))),
    CONSTRAINT seo_duplicate_content_impact_level_check CHECK ((impact_level = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'critical'::text]))),
    CONSTRAINT seo_duplicate_content_resolution_method_check CHECK ((resolution_method = ANY (ARRAY['canonical_tag'::text, 'noindex'::text, 'redirect'::text, 'content_consolidation'::text, 'content_rewrite'::text, 'other'::text]))),
    CONSTRAINT seo_duplicate_content_status_check CHECK ((status = ANY (ARRAY['detected'::text, 'reviewed'::text, 'resolved'::text, 'ignored'::text])))
);


--
-- Name: seo_fixes_applied; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.seo_fixes_applied (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    audit_id uuid,
    url text NOT NULL,
    fix_type text NOT NULL,
    fix_category text DEFAULT 'technical'::text,
    issue_description text NOT NULL,
    fix_description text NOT NULL,
    fix_impact text,
    before_value text,
    after_value text,
    status text DEFAULT 'pending'::text,
    applied_at timestamp with time zone,
    reverted_at timestamp with time zone,
    applied_by uuid,
    verification_status text DEFAULT 'unverified'::text,
    verification_notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT seo_fixes_applied_fix_category_check CHECK ((fix_category = ANY (ARRAY['technical'::text, 'content'::text, 'performance'::text, 'accessibility'::text, 'security'::text]))),
    CONSTRAINT seo_fixes_applied_fix_impact_check CHECK ((fix_impact = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'critical'::text]))),
    CONSTRAINT seo_fixes_applied_fix_type_check CHECK ((fix_type = ANY (ARRAY['meta_tags'::text, 'title_optimization'::text, 'description_optimization'::text, 'keyword_optimization'::text, 'image_alt_text'::text, 'heading_structure'::text, 'internal_linking'::text, 'canonical_url'::text, 'robots_txt'::text, 'sitemap'::text, 'schema_markup'::text, 'mobile_optimization'::text, 'performance'::text, 'security'::text, 'content_optimization'::text, 'broken_link_fix'::text, 'redirect_fix'::text, 'other'::text]))),
    CONSTRAINT seo_fixes_applied_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'applied'::text, 'reverted'::text, 'failed'::text]))),
    CONSTRAINT seo_fixes_applied_verification_status_check CHECK ((verification_status = ANY (ARRAY['unverified'::text, 'verified'::text, 'failed'::text])))
);


--
-- Name: seo_image_analysis; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.seo_image_analysis (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    url text NOT NULL,
    page_url text NOT NULL,
    image_src text NOT NULL,
    file_name text,
    file_size_kb integer,
    file_format text,
    width integer,
    height integer,
    aspect_ratio text,
    alt_text text,
    alt_text_length integer,
    title_attribute text,
    has_alt boolean DEFAULT false,
    has_title boolean DEFAULT false,
    has_caption boolean DEFAULT false,
    is_optimized boolean DEFAULT false,
    optimization_score integer,
    compression_ratio numeric(5,2),
    potential_savings_kb integer,
    recommended_format text,
    supports_lazy_loading boolean DEFAULT false,
    is_lazy_loaded boolean DEFAULT false,
    has_srcset boolean DEFAULT false,
    is_responsive boolean DEFAULT false,
    issues jsonb DEFAULT '[]'::jsonb,
    analyzed_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT seo_image_analysis_optimization_score_check CHECK (((optimization_score >= 0) AND (optimization_score <= 100)))
);


--
-- Name: seo_keyword_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.seo_keyword_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    keyword_id uuid NOT NULL,
    keyword text NOT NULL,
    "position" integer,
    search_volume integer,
    impressions integer DEFAULT 0,
    clicks integer DEFAULT 0,
    ctr numeric(5,2),
    visibility_score integer,
    url text,
    device text DEFAULT 'desktop'::text,
    location text DEFAULT 'global'::text,
    search_engine text DEFAULT 'google'::text,
    data_source text DEFAULT 'manual'::text,
    checked_at timestamp with time zone DEFAULT now(),
    recorded_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT seo_keyword_history_data_source_check CHECK ((data_source = ANY (ARRAY['manual'::text, 'gsc'::text, 'serpapi'::text, 'ahrefs'::text, 'moz'::text, 'semrush'::text]))),
    CONSTRAINT seo_keyword_history_device_check CHECK ((device = ANY (ARRAY['desktop'::text, 'mobile'::text, 'tablet'::text]))),
    CONSTRAINT seo_keyword_history_search_engine_check CHECK ((search_engine = ANY (ARRAY['google'::text, 'bing'::text, 'yahoo'::text, 'duckduckgo'::text])))
);


--
-- Name: seo_keywords; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.seo_keywords (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    keyword text NOT NULL,
    target_url text,
    search_volume integer,
    competition text,
    difficulty_score integer,
    current_position integer,
    target_position integer,
    best_position integer,
    previous_position integer,
    position_change integer,
    category text DEFAULT 'General'::text,
    keyword_type text DEFAULT 'primary'::text,
    intent text,
    priority integer DEFAULT 1,
    monthly_searches integer,
    ctr numeric(5,2),
    impressions integer DEFAULT 0,
    clicks integer DEFAULT 0,
    avg_position numeric(5,2),
    visibility_score integer,
    is_active boolean DEFAULT true,
    is_ranking boolean DEFAULT false,
    first_ranked_at timestamp with time zone,
    last_checked_at timestamp with time zone,
    last_position_change_at timestamp with time zone,
    notes text,
    tags text[] DEFAULT '{}'::text[],
    user_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    CONSTRAINT seo_keywords_competition_check CHECK ((competition = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text]))),
    CONSTRAINT seo_keywords_difficulty_score_check CHECK (((difficulty_score >= 0) AND (difficulty_score <= 100))),
    CONSTRAINT seo_keywords_intent_check CHECK ((intent = ANY (ARRAY['informational'::text, 'navigational'::text, 'transactional'::text, 'commercial'::text]))),
    CONSTRAINT seo_keywords_keyword_type_check CHECK ((keyword_type = ANY (ARRAY['primary'::text, 'secondary'::text, 'long_tail'::text, 'local'::text, 'branded'::text]))),
    CONSTRAINT seo_keywords_priority_check CHECK (((priority >= 1) AND (priority <= 5)))
);


--
-- Name: seo_link_analysis; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.seo_link_analysis (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    page_url text NOT NULL,
    total_links integer DEFAULT 0,
    internal_links integer DEFAULT 0,
    external_links integer DEFAULT 0,
    broken_links integer DEFAULT 0,
    redirect_links integer DEFAULT 0,
    nofollow_links integer DEFAULT 0,
    external_nofollow_count integer DEFAULT 0,
    external_dofollow_count integer DEFAULT 0,
    toxic_links integer DEFAULT 0,
    quality_score integer,
    anchor_texts jsonb DEFAULT '[]'::jsonb,
    over_optimized_anchors integer DEFAULT 0,
    orphan_page boolean DEFAULT false,
    dead_end_page boolean DEFAULT false,
    deep_level integer,
    link_list jsonb DEFAULT '[]'::jsonb,
    issues jsonb DEFAULT '[]'::jsonb,
    recommendations jsonb DEFAULT '[]'::jsonb,
    analyzed_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT seo_link_analysis_quality_score_check CHECK (((quality_score >= 0) AND (quality_score <= 100)))
);


--
-- Name: seo_mobile_analysis; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.seo_mobile_analysis (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    url text NOT NULL,
    mobile_friendly boolean DEFAULT false,
    mobile_score integer,
    has_viewport_meta boolean DEFAULT false,
    viewport_content text,
    viewport_width text,
    touch_targets_sized_appropriately boolean DEFAULT false,
    tap_target_issues integer DEFAULT 0,
    minimum_tap_target_size integer,
    content_fits_viewport boolean DEFAULT false,
    horizontal_scroll_required boolean DEFAULT false,
    font_size_legible boolean DEFAULT false,
    issues jsonb DEFAULT '[]'::jsonb,
    mobile_page_speed integer,
    mobile_lcp numeric(10,2),
    mobile_fid numeric(10,2),
    mobile_cls numeric(5,3),
    resource_count integer,
    total_resource_size_kb integer,
    uses_responsive_images boolean DEFAULT false,
    usability_score integer,
    passed_mobile_friendly_test boolean DEFAULT false,
    google_mobile_friendly_result jsonb,
    tested_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT seo_mobile_analysis_mobile_page_speed_check CHECK (((mobile_page_speed >= 0) AND (mobile_page_speed <= 100))),
    CONSTRAINT seo_mobile_analysis_mobile_score_check CHECK (((mobile_score >= 0) AND (mobile_score <= 100))),
    CONSTRAINT seo_mobile_analysis_usability_score_check CHECK (((usability_score >= 0) AND (usability_score <= 100)))
);


--
-- Name: seo_monitoring_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.seo_monitoring_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    schedule_id uuid,
    status text NOT NULL,
    results_summary jsonb DEFAULT '{}'::jsonb,
    started_at timestamp with time zone DEFAULT now(),
    completed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT seo_monitoring_log_status_check CHECK ((status = ANY (ARRAY['started'::text, 'completed'::text, 'failed'::text])))
);


--
-- Name: seo_monitoring_schedules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.seo_monitoring_schedules (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    schedule_type text NOT NULL,
    target_url text NOT NULL,
    frequency text NOT NULL,
    is_active boolean DEFAULT true,
    next_run_at timestamp with time zone,
    last_run_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    last_run_status text,
    last_run_duration_ms integer,
    description text,
    additional_urls text[] DEFAULT '{}'::text[],
    cron_expression text,
    time_of_day time without time zone,
    day_of_week integer,
    day_of_month integer,
    timezone text DEFAULT 'UTC'::text,
    config jsonb DEFAULT '{}'::jsonb,
    run_count integer DEFAULT 0,
    success_count integer DEFAULT 0,
    failure_count integer DEFAULT 0,
    created_by uuid,
    CONSTRAINT seo_monitoring_schedules_frequency_check CHECK ((frequency = ANY (ARRAY['hourly'::text, 'daily'::text, 'weekly'::text, 'monthly'::text, 'custom'::text]))),
    CONSTRAINT seo_monitoring_schedules_last_run_status_check CHECK (((last_run_status IS NULL) OR (last_run_status = ANY (ARRAY['success'::text, 'failed'::text, 'partial'::text])))),
    CONSTRAINT seo_monitoring_schedules_schedule_type_check CHECK ((schedule_type = ANY (ARRAY['full_audit'::text, 'quick_scan'::text, 'keyword_check'::text, 'broken_links'::text, 'core_web_vitals'::text, 'security_scan'::text, 'competitor_check'::text, 'custom'::text, 'content_optimization'::text, 'security_headers'::text, 'image_optimization'::text])))
);


--
-- Name: seo_notification_preferences; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.seo_notification_preferences (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    email_enabled boolean DEFAULT true,
    email_address text,
    slack_enabled boolean DEFAULT false,
    slack_webhook_url text,
    in_app_enabled boolean DEFAULT true,
    critical_alerts boolean DEFAULT true,
    ranking_changes boolean DEFAULT true,
    performance_alerts boolean DEFAULT true,
    security_alerts boolean DEFAULT true,
    broken_links boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: seo_notification_queue; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.seo_notification_queue (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    notification_type text NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    severity text NOT NULL,
    channels text[] NOT NULL,
    recipients text[] NOT NULL,
    data jsonb DEFAULT '{}'::jsonb,
    status text DEFAULT 'pending'::text,
    sent_at timestamp with time zone,
    error_message text,
    retry_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT seo_notification_queue_notification_type_check CHECK ((notification_type = ANY (ARRAY['critical_issue'::text, 'warning'::text, 'opportunity'::text, 'competitor_alert'::text, 'report_ready'::text]))),
    CONSTRAINT seo_notification_queue_severity_check CHECK ((severity = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'critical'::text]))),
    CONSTRAINT seo_notification_queue_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'sent'::text, 'failed'::text])))
);


--
-- Name: seo_page_scores; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.seo_page_scores (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    url text NOT NULL,
    page_title text,
    page_type text,
    overall_score integer,
    seo_score integer,
    content_score integer,
    technical_score integer,
    ux_score integer,
    title_score integer,
    description_score integer,
    keywords_score integer,
    headings_score integer,
    word_count integer,
    readability_score numeric(5,2),
    keyword_density numeric(5,2),
    content_uniqueness numeric(5,2),
    internal_links integer DEFAULT 0,
    external_links integer DEFAULT 0,
    load_time_ms integer,
    mobile_score integer,
    has_canonical boolean DEFAULT false,
    has_structured_data boolean DEFAULT false,
    has_alt_tags boolean DEFAULT false,
    images_optimized boolean DEFAULT false,
    first_contentful_paint integer,
    largest_contentful_paint integer,
    cumulative_layout_shift numeric(5,3),
    time_to_interactive integer,
    critical_issues integer DEFAULT 0,
    warnings integer DEFAULT 0,
    recommendations jsonb DEFAULT '[]'::jsonb,
    last_scored_at timestamp with time zone DEFAULT now(),
    score_change integer,
    previous_score integer,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT seo_page_scores_content_score_check CHECK (((content_score >= 0) AND (content_score <= 100))),
    CONSTRAINT seo_page_scores_description_score_check CHECK (((description_score >= 0) AND (description_score <= 10))),
    CONSTRAINT seo_page_scores_headings_score_check CHECK (((headings_score >= 0) AND (headings_score <= 10))),
    CONSTRAINT seo_page_scores_keywords_score_check CHECK (((keywords_score >= 0) AND (keywords_score <= 10))),
    CONSTRAINT seo_page_scores_mobile_score_check CHECK (((mobile_score >= 0) AND (mobile_score <= 100))),
    CONSTRAINT seo_page_scores_overall_score_check CHECK (((overall_score >= 0) AND (overall_score <= 100))),
    CONSTRAINT seo_page_scores_page_type_check CHECK ((page_type = ANY (ARRAY['homepage'::text, 'product'::text, 'category'::text, 'blog'::text, 'article'::text, 'landing_page'::text, 'other'::text]))),
    CONSTRAINT seo_page_scores_seo_score_check CHECK (((seo_score >= 0) AND (seo_score <= 100))),
    CONSTRAINT seo_page_scores_technical_score_check CHECK (((technical_score >= 0) AND (technical_score <= 100))),
    CONSTRAINT seo_page_scores_title_score_check CHECK (((title_score >= 0) AND (title_score <= 10))),
    CONSTRAINT seo_page_scores_ux_score_check CHECK (((ux_score >= 0) AND (ux_score <= 100)))
);


--
-- Name: seo_performance_budget; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.seo_performance_budget (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    url_pattern text NOT NULL,
    max_page_size_kb integer,
    max_image_size_kb integer,
    max_js_size_kb integer,
    max_css_size_kb integer,
    max_font_size_kb integer,
    max_requests integer,
    max_load_time_ms integer,
    max_lcp_ms integer,
    max_fid_ms integer,
    max_cls numeric(5,3),
    current_page_size_kb integer,
    current_image_size_kb integer,
    current_js_size_kb integer,
    current_css_size_kb integer,
    current_font_size_kb integer,
    current_requests integer,
    current_load_time_ms integer,
    current_lcp_ms integer,
    current_fid_ms integer,
    current_cls numeric(5,3),
    is_within_budget boolean DEFAULT true,
    violations jsonb DEFAULT '[]'::jsonb,
    violation_count integer DEFAULT 0,
    alert_on_violation boolean DEFAULT true,
    alert_threshold_percentage integer DEFAULT 90,
    is_active boolean DEFAULT true,
    last_checked_at timestamp with time zone,
    last_violation_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid
);


--
-- Name: seo_redirect_analysis; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.seo_redirect_analysis (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    source_url text NOT NULL,
    final_url text NOT NULL,
    redirect_chain jsonb DEFAULT '[]'::jsonb NOT NULL,
    chain_length integer DEFAULT 0,
    redirect_type integer,
    is_permanent boolean,
    is_chain boolean DEFAULT false,
    total_time_ms integer,
    time_per_hop_ms integer,
    has_issues boolean DEFAULT false,
    issues jsonb DEFAULT '[]'::jsonb,
    recommended_action text,
    priority text,
    status text DEFAULT 'active'::text,
    fixed_at timestamp with time zone,
    last_checked_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT seo_redirect_analysis_priority_check CHECK ((priority = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'critical'::text]))),
    CONSTRAINT seo_redirect_analysis_status_check CHECK ((status = ANY (ARRAY['active'::text, 'fixed'::text, 'ignored'::text])))
);


--
-- Name: seo_report_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.seo_report_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    schedule_id uuid,
    report_type text NOT NULL,
    report_data jsonb NOT NULL,
    file_url text,
    generated_at timestamp with time zone DEFAULT now(),
    sent_to text[],
    generation_time_ms integer
);


--
-- Name: seo_scheduled_reports; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.seo_scheduled_reports (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    report_type text NOT NULL,
    schedule_type text NOT NULL,
    cron_expression text,
    report_config jsonb DEFAULT '{}'::jsonb,
    format text DEFAULT 'pdf'::text,
    recipients text[] NOT NULL,
    delivery_channels text[] DEFAULT ARRAY['email'::text],
    active boolean DEFAULT true,
    last_generated_at timestamp with time zone,
    next_generation_at timestamp with time zone,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT seo_scheduled_reports_format_check CHECK ((format = ANY (ARRAY['pdf'::text, 'html'::text, 'json'::text]))),
    CONSTRAINT seo_scheduled_reports_report_type_check CHECK ((report_type = ANY (ARRAY['comprehensive'::text, 'executive_summary'::text, 'keyword_performance'::text, 'competitor_analysis'::text, 'technical_seo'::text]))),
    CONSTRAINT seo_scheduled_reports_schedule_type_check CHECK ((schedule_type = ANY (ARRAY['daily'::text, 'weekly'::text, 'monthly'::text, 'cron'::text])))
);


--
-- Name: seo_security_analysis; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.seo_security_analysis (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    url text NOT NULL,
    has_ssl boolean DEFAULT false,
    ssl_valid boolean DEFAULT false,
    ssl_expiry_date timestamp with time zone,
    ssl_issuer text,
    mixed_content_issues integer DEFAULT 0,
    has_hsts boolean DEFAULT false,
    hsts_max_age integer,
    has_csp boolean DEFAULT false,
    csp_policy text,
    has_x_frame_options boolean DEFAULT false,
    x_frame_options text,
    has_x_content_type_options boolean DEFAULT false,
    has_referrer_policy boolean DEFAULT false,
    referrer_policy text,
    has_permissions_policy boolean DEFAULT false,
    security_score integer,
    security_grade text,
    vulnerabilities jsonb DEFAULT '[]'::jsonb,
    secure_cookies boolean DEFAULT false,
    httponly_cookies boolean DEFAULT false,
    samesite_cookies text,
    critical_issues integer DEFAULT 0,
    warnings integer DEFAULT 0,
    passed_checks integer DEFAULT 0,
    total_checks integer DEFAULT 0,
    scanned_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT seo_security_analysis_security_grade_check CHECK ((security_grade = ANY (ARRAY['A+'::text, 'A'::text, 'B'::text, 'C'::text, 'D'::text, 'F'::text]))),
    CONSTRAINT seo_security_analysis_security_score_check CHECK (((security_score >= 0) AND (security_score <= 100)))
);


--
-- Name: seo_semantic_analysis; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.seo_semantic_analysis (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    url text NOT NULL,
    primary_topic text NOT NULL,
    topic_cluster_id text,
    cluster_name text,
    is_pillar_content boolean DEFAULT false,
    related_content_urls text[] DEFAULT '{}'::text[],
    main_entities jsonb DEFAULT '[]'::jsonb,
    semantic_keywords jsonb DEFAULT '[]'::jsonb,
    tf_idf_keywords jsonb DEFAULT '[]'::jsonb,
    keyword_co_occurrence jsonb DEFAULT '{}'::jsonb,
    topics_detected text[] DEFAULT '{}'::text[],
    topic_weights jsonb DEFAULT '{}'::jsonb,
    overall_sentiment text,
    sentiment_score numeric(5,2),
    emotional_tone text[] DEFAULT '{}'::text[],
    content_intent text,
    search_intent_match_score integer,
    vocabulary_size integer,
    lexical_diversity numeric(5,2),
    semantic_density numeric(5,2),
    questions_addressed text[] DEFAULT '{}'::text[],
    missing_questions text[] DEFAULT '{}'::text[],
    faq_potential_score integer,
    expertise_signals jsonb DEFAULT '[]'::jsonb,
    authority_signals jsonb DEFAULT '[]'::jsonb,
    trust_signals jsonb DEFAULT '[]'::jsonb,
    eat_score integer,
    semantic_gaps text[] DEFAULT '{}'::text[],
    recommended_entities text[] DEFAULT '{}'::text[],
    recommended_topics text[] DEFAULT '{}'::text[],
    content_depth_recommendation text,
    nlp_model_used text,
    nlp_confidence_score numeric(5,2),
    semantic_relevance_score integer,
    topical_authority_score integer,
    analyzed_at timestamp with time zone DEFAULT now(),
    analyzed_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT seo_semantic_analysis_content_intent_check CHECK ((content_intent = ANY (ARRAY['informational'::text, 'navigational'::text, 'transactional'::text, 'commercial'::text]))),
    CONSTRAINT seo_semantic_analysis_eat_score_check CHECK (((eat_score >= 0) AND (eat_score <= 100))),
    CONSTRAINT seo_semantic_analysis_faq_potential_score_check CHECK (((faq_potential_score >= 0) AND (faq_potential_score <= 100))),
    CONSTRAINT seo_semantic_analysis_overall_sentiment_check CHECK ((overall_sentiment = ANY (ARRAY['positive'::text, 'neutral'::text, 'negative'::text, 'mixed'::text]))),
    CONSTRAINT seo_semantic_analysis_search_intent_match_score_check CHECK (((search_intent_match_score >= 0) AND (search_intent_match_score <= 100))),
    CONSTRAINT seo_semantic_analysis_semantic_relevance_score_check CHECK (((semantic_relevance_score >= 0) AND (semantic_relevance_score <= 100))),
    CONSTRAINT seo_semantic_analysis_topical_authority_score_check CHECK (((topical_authority_score >= 0) AND (topical_authority_score <= 100)))
);


--
-- Name: seo_semantic_analysis_summary; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.seo_semantic_analysis_summary AS
 SELECT count(*) AS total_pages_analyzed,
    count(DISTINCT primary_topic) AS unique_topics,
    count(DISTINCT topic_cluster_id) AS topic_clusters,
    count(*) FILTER (WHERE (is_pillar_content = true)) AS pillar_content_count,
    (avg(semantic_relevance_score))::numeric(5,2) AS avg_semantic_score,
    (avg(topical_authority_score))::numeric(5,2) AS avg_authority_score,
    (avg(eat_score))::numeric(5,2) AS avg_eat_score
   FROM public.seo_semantic_analysis;


--
-- Name: seo_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.seo_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    site_url text NOT NULL,
    site_name text,
    default_title text,
    default_description text,
    default_keywords text[],
    default_author text,
    default_og_image text,
    robots_txt text,
    llms_txt text,
    sitemap_enabled boolean DEFAULT true,
    sitemap_frequency text DEFAULT 'weekly'::text,
    sitemap_priority numeric(2,1) DEFAULT 0.5,
    google_site_verification text,
    bing_site_verification text,
    google_analytics_id text,
    google_tag_manager_id text,
    favicon_url text,
    apple_touch_icon_url text,
    manifest_url text,
    canonical_url_override text,
    language text DEFAULT 'en'::text,
    region text,
    additional_meta_tags jsonb DEFAULT '{}'::jsonb,
    schema_org_data jsonb DEFAULT '{}'::jsonb,
    social_profiles jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    updated_by uuid,
    CONSTRAINT seo_settings_sitemap_frequency_check CHECK ((sitemap_frequency = ANY (ARRAY['always'::text, 'hourly'::text, 'daily'::text, 'weekly'::text, 'monthly'::text, 'yearly'::text, 'never'::text]))),
    CONSTRAINT seo_settings_sitemap_priority_check CHECK (((sitemap_priority >= (0)::numeric) AND (sitemap_priority <= (1)::numeric)))
);


--
-- Name: seo_structured_data; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.seo_structured_data (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    url text NOT NULL,
    schema_types text[] DEFAULT '{}'::text[],
    has_structured_data boolean DEFAULT false,
    is_valid boolean DEFAULT false,
    validation_errors jsonb DEFAULT '[]'::jsonb,
    validation_warnings jsonb DEFAULT '[]'::jsonb,
    schemas jsonb DEFAULT '[]'::jsonb,
    schema_coverage_score integer,
    recommended_schemas text[] DEFAULT '{}'::text[],
    eligible_for_rich_results boolean DEFAULT false,
    rich_result_types text[] DEFAULT '{}'::text[],
    critical_errors integer DEFAULT 0,
    warnings integer DEFAULT 0,
    google_test_result jsonb,
    schema_markup_validator_result jsonb,
    validated_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT seo_structured_data_schema_coverage_score_check CHECK (((schema_coverage_score >= 0) AND (schema_coverage_score <= 100)))
);


--
-- Name: social_media_posts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.social_media_posts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    content_type text NOT NULL,
    subject_type text NOT NULL,
    platform_type text NOT NULL,
    post_content jsonb NOT NULL,
    post_title text,
    listing_id uuid,
    property_address text,
    webhook_urls text[],
    ai_prompt_used text,
    status text DEFAULT 'draft'::text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    posted_at timestamp with time zone,
    scheduled_for timestamp with time zone,
    created_by uuid,
    CONSTRAINT social_media_posts_content_type_check CHECK ((content_type = ANY (ARRAY['property_highlight'::text, 'market_update'::text, 'agent_tip'::text, 'community_spotlight'::text, 'success_story'::text, 'general'::text, 'marketing'::text]))),
    CONSTRAINT social_media_posts_platform_type_check CHECK ((platform_type = ANY (ARRAY['twitter_threads'::text, 'facebook_linkedin'::text, 'instagram'::text, 'combined'::text, 'multi_platform'::text]))),
    CONSTRAINT social_media_posts_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'posted'::text, 'scheduled'::text, 'archived'::text]))),
    CONSTRAINT social_media_posts_subject_type_check CHECK ((subject_type = ANY (ARRAY['listing_of_the_day'::text, 'market_analysis'::text, 'buyer_seller_tip'::text, 'neighborhood_feature'::text, 'testimonial_highlight'::text, 'special_announcement'::text, 'agent_signup'::text])))
);


--
-- Name: social_media_webhooks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.social_media_webhooks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    platform text NOT NULL,
    webhook_url text NOT NULL,
    is_active boolean DEFAULT true,
    headers jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: sso_audit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sso_audit_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    config_id uuid,
    user_id uuid,
    event_type text NOT NULL,
    event_details jsonb DEFAULT '{}'::jsonb,
    ip_address inet,
    user_agent text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT sso_audit_logs_event_type_check CHECK ((event_type = ANY (ARRAY['login_initiated'::text, 'login_success'::text, 'login_failed'::text, 'logout'::text, 'config_created'::text, 'config_updated'::text, 'config_deleted'::text, 'config_verified'::text, 'user_provisioned'::text, 'user_deprovisioned'::text, 'group_sync'::text])))
);


--
-- Name: sso_login_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sso_login_sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    config_id uuid NOT NULL,
    request_id text NOT NULL,
    user_email text,
    status text DEFAULT 'pending'::text NOT NULL,
    saml_request text,
    saml_response text,
    saml_assertion_id text,
    oidc_nonce text,
    oidc_code_verifier text,
    user_id uuid,
    error_code text,
    error_message text,
    ip_address inet,
    user_agent text,
    redirect_uri text,
    created_at timestamp with time zone DEFAULT now(),
    expires_at timestamp with time zone DEFAULT (now() + '00:10:00'::interval) NOT NULL,
    completed_at timestamp with time zone,
    CONSTRAINT sso_login_sessions_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'completed'::text, 'failed'::text, 'expired'::text])))
);


--
-- Name: sso_user_mappings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sso_user_mappings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    config_id uuid NOT NULL,
    sso_subject_id text NOT NULL,
    sso_email text NOT NULL,
    sso_groups text[],
    sso_attributes jsonb DEFAULT '{}'::jsonb,
    last_login_at timestamp with time zone DEFAULT now(),
    login_count integer DEFAULT 1,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: stripe_customers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.stripe_customers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    stripe_customer_id text NOT NULL,
    email text,
    name text,
    default_payment_method text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: stripe_usage_records; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.stripe_usage_records (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    feature_key text NOT NULL,
    stripe_subscription_item_id text,
    stripe_usage_record_id text,
    quantity integer NOT NULL,
    "timestamp" timestamp with time zone DEFAULT now() NOT NULL,
    action text DEFAULT 'increment'::text,
    synced_at timestamp with time zone,
    sync_status text DEFAULT 'pending'::text,
    sync_error text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: subscription_plans; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.subscription_plans (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    stripe_price_id text,
    price_monthly numeric(10,2) NOT NULL,
    price_yearly numeric(10,2),
    features jsonb DEFAULT '{}'::jsonb NOT NULL,
    limits jsonb DEFAULT '{}'::jsonb NOT NULL,
    is_active boolean DEFAULT true,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    stripe_price_id_yearly text,
    stripe_price_id_monthly text,
    payment_link_monthly text,
    payment_link_yearly text
);


--
-- Name: subscriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.subscriptions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    plan_name text DEFAULT 'free'::text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    stripe_customer_id text,
    stripe_subscription_id text,
    stripe_price_id text,
    current_period_start timestamp with time zone,
    current_period_end timestamp with time zone,
    trial_end timestamp with time zone,
    cancel_at timestamp with time zone,
    canceled_at timestamp with time zone,
    amount numeric(10,2),
    currency text DEFAULT 'usd'::text,
    "interval" text DEFAULT 'month'::text,
    max_listings integer DEFAULT 3,
    max_links integer DEFAULT 5,
    max_testimonials integer DEFAULT 3,
    analytics_history_days integer DEFAULT 7,
    custom_domain_enabled boolean DEFAULT false,
    remove_branding boolean DEFAULT false,
    priority_support boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: system_metrics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.system_metrics (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    metric_type text NOT NULL,
    metric_name text NOT NULL,
    value numeric NOT NULL,
    unit text,
    metadata jsonb DEFAULT '{}'::jsonb,
    recorded_at timestamp with time zone DEFAULT now()
);


--
-- Name: team_members; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.team_members (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    team_id uuid NOT NULL,
    user_id uuid,
    email text,
    role text DEFAULT 'member'::text NOT NULL,
    invited_at timestamp with time zone DEFAULT now() NOT NULL,
    accepted_at timestamp with time zone,
    CONSTRAINT team_members_role_check CHECK ((role = ANY (ARRAY['owner'::text, 'admin'::text, 'member'::text])))
);


--
-- Name: team_round_robin; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.team_round_robin (
    team_id uuid NOT NULL,
    last_index integer DEFAULT '-1'::integer NOT NULL
);


--
-- Name: teams; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.teams (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    owner_id uuid NOT NULL,
    plan_id text,
    stripe_subscription_id text,
    max_seats integer DEFAULT 5 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: testimonials; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.testimonials (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    client_name text NOT NULL,
    rating integer NOT NULL,
    review text NOT NULL,
    property_type text,
    date date DEFAULT CURRENT_DATE,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    client_photo text,
    client_title text,
    transaction_type text,
    listing_id uuid,
    is_featured boolean DEFAULT false,
    is_published boolean DEFAULT true,
    sort_order integer DEFAULT 0,
    CONSTRAINT testimonials_rating_check CHECK (((rating >= 1) AND (rating <= 5))),
    CONSTRAINT testimonials_transaction_type_check CHECK (((transaction_type IS NULL) OR (transaction_type = ANY (ARRAY['purchase'::text, 'sale'::text, 'buyer'::text, 'seller'::text]))))
);


--
-- Name: unified_search_analytics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.unified_search_analytics (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    source_platform text NOT NULL,
    source_property_id uuid,
    date date NOT NULL,
    page_url text,
    page_title text,
    query text,
    country text,
    device text,
    clicks integer DEFAULT 0,
    impressions integer DEFAULT 0,
    sessions integer DEFAULT 0,
    users integer DEFAULT 0,
    pageviews integer DEFAULT 0,
    ctr numeric(10,6),
    average_position numeric(10,2),
    bounce_rate numeric(10,6),
    engagement_rate numeric(10,6),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT unified_search_analytics_source_platform_check CHECK ((source_platform = ANY (ARRAY['google_search_console'::text, 'google_analytics'::text, 'bing_webmaster'::text, 'yandex_webmaster'::text])))
);


--
-- Name: usage_tracking; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.usage_tracking (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    resource_type text NOT NULL,
    count integer DEFAULT 0,
    last_reset_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: user_activity_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_activity_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    activity_type text NOT NULL,
    activity_data jsonb DEFAULT '{}'::jsonb,
    page_url text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: user_mfa_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_mfa_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    mfa_enabled boolean DEFAULT false,
    mfa_method text,
    totp_secret text,
    backup_codes text[],
    backup_codes_generated_at timestamp with time zone,
    phone_number text,
    email_verified_for_mfa boolean DEFAULT false,
    verified_at timestamp with time zone,
    last_used_at timestamp with time zone,
    failed_attempts integer DEFAULT 0,
    locked_until timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT user_mfa_settings_mfa_method_check CHECK ((mfa_method = ANY (ARRAY['totp'::text, 'email'::text, 'sms'::text])))
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role public.app_role NOT NULL
);


--
-- Name: user_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    session_token_hash text NOT NULL,
    ip_address inet,
    user_agent text,
    device_type text,
    browser text,
    os text,
    location_city text,
    location_country text,
    is_current boolean DEFAULT false,
    last_activity_at timestamp with time zone DEFAULT now(),
    expires_at timestamp with time zone NOT NULL,
    revoked boolean DEFAULT false,
    revoked_at timestamp with time zone,
    revoked_reason text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT user_sessions_device_type_check CHECK ((device_type = ANY (ARRAY['desktop'::text, 'mobile'::text, 'tablet'::text, 'unknown'::text])))
);


--
-- Name: user_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    email_leads boolean DEFAULT true,
    sms_leads boolean DEFAULT false,
    weekly_report boolean DEFAULT true,
    marketing_emails boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    show_listings boolean DEFAULT true,
    show_sold_properties boolean DEFAULT true,
    show_testimonials boolean DEFAULT true,
    show_social_proof boolean DEFAULT true,
    show_contact_buttons boolean DEFAULT true
);


--
-- Name: user_subscription_details; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.user_subscription_details AS
 SELECT id,
    user_id,
    plan_name,
    status,
    stripe_customer_id,
    stripe_subscription_id,
    current_period_start,
    current_period_end,
    trial_end,
    cancel_at,
    canceled_at,
    max_listings,
    max_links,
    max_testimonials,
    analytics_history_days,
    custom_domain_enabled,
    remove_branding,
    priority_support,
    ( SELECT count(*) AS count
           FROM public.listings
          WHERE (listings.user_id = s.user_id)) AS current_listings,
    ( SELECT count(*) AS count
           FROM public.links
          WHERE (links.user_id = s.user_id)) AS current_links,
    ( SELECT count(*) AS count
           FROM public.testimonials
          WHERE (testimonials.user_id = s.user_id)) AS current_testimonials,
        CASE
            WHEN ((status = 'active'::text) AND ((cancel_at IS NULL) OR (cancel_at > now()))) THEN true
            WHEN ((status = 'trialing'::text) AND ((trial_end IS NULL) OR (trial_end > now()))) THEN true
            ELSE false
        END AS is_subscription_active,
    created_at,
    updated_at
   FROM public.subscriptions s;


--
-- Name: user_subscriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_subscriptions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    plan_id uuid,
    stripe_customer_id text,
    stripe_subscription_id text,
    status public.subscription_status DEFAULT 'active'::public.subscription_status,
    current_period_start timestamp with time zone,
    current_period_end timestamp with time zone,
    cancel_at_period_end boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: workflow_execution_queue; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.workflow_execution_queue (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    execution_id uuid NOT NULL,
    node_id text NOT NULL,
    priority integer DEFAULT 50,
    scheduled_for timestamp with time zone DEFAULT now() NOT NULL,
    locked_at timestamp with time zone,
    locked_by text,
    attempts integer DEFAULT 0,
    max_attempts integer DEFAULT 5,
    last_error text,
    next_retry_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: workflow_execution_steps; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.workflow_execution_steps (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    execution_id uuid NOT NULL,
    node_id text NOT NULL,
    node_type text NOT NULL,
    node_name text,
    status text DEFAULT 'pending'::text NOT NULL,
    input_data jsonb DEFAULT '{}'::jsonb,
    output_data jsonb DEFAULT '{}'::jsonb,
    started_at timestamp with time zone,
    completed_at timestamp with time zone,
    duration_ms integer,
    error_message text,
    error_details jsonb,
    retry_count integer DEFAULT 0,
    max_retries integer DEFAULT 3,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT workflow_execution_steps_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'running'::text, 'completed'::text, 'failed'::text, 'skipped'::text, 'waiting'::text])))
);


--
-- Name: workflow_executions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.workflow_executions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    workflow_id uuid NOT NULL,
    user_id uuid NOT NULL,
    workflow_version integer NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    trigger_type text NOT NULL,
    trigger_data jsonb DEFAULT '{}'::jsonb,
    context jsonb DEFAULT '{}'::jsonb,
    variables jsonb DEFAULT '{}'::jsonb,
    current_node_id text,
    completed_nodes text[] DEFAULT ARRAY[]::text[],
    started_at timestamp with time zone,
    completed_at timestamp with time zone,
    timeout_at timestamp with time zone,
    result jsonb,
    error_message text,
    error_node_id text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT workflow_executions_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'running'::text, 'paused'::text, 'completed'::text, 'failed'::text, 'cancelled'::text, 'timeout'::text])))
);


--
-- Name: workflow_node_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.workflow_node_templates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    type text NOT NULL,
    subtype text NOT NULL,
    name text NOT NULL,
    description text,
    icon text,
    category text NOT NULL,
    config_schema jsonb DEFAULT '{}'::jsonb NOT NULL,
    default_config jsonb DEFAULT '{}'::jsonb,
    color text DEFAULT '#4F46E5'::text,
    documentation_url text,
    is_premium boolean DEFAULT false,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT workflow_node_templates_type_check CHECK ((type = ANY (ARRAY['trigger'::text, 'action'::text, 'condition'::text, 'delay'::text, 'loop'::text, 'transform'::text])))
);


--
-- Name: workflow_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.workflow_templates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    category text NOT NULL,
    nodes jsonb NOT NULL,
    edges jsonb NOT NULL,
    trigger_config jsonb,
    icon text,
    preview_image_url text,
    use_count integer DEFAULT 0,
    rating numeric(3,2) DEFAULT 0,
    rating_count integer DEFAULT 0,
    is_public boolean DEFAULT true,
    is_premium boolean DEFAULT false,
    created_by uuid,
    tags text[] DEFAULT ARRAY[]::text[],
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: workflow_triggers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.workflow_triggers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    workflow_id uuid NOT NULL,
    trigger_type text NOT NULL,
    config jsonb DEFAULT '{}'::jsonb,
    cron_expression text,
    next_run_at timestamp with time zone,
    last_run_at timestamp with time zone,
    webhook_secret text,
    webhook_url text GENERATED ALWAYS AS (
CASE
    WHEN (trigger_type = 'webhook'::text) THEN ('https://api.agentbio.net/webhooks/workflow/'::text || (id)::text)
    ELSE NULL::text
END) STORED,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT workflow_triggers_trigger_type_check CHECK ((trigger_type = ANY (ARRAY['manual'::text, 'schedule'::text, 'webhook'::text, 'lead_created'::text, 'lead_updated'::text, 'lead_status_changed'::text, 'listing_created'::text, 'listing_updated'::text, 'listing_sold'::text, 'form_submitted'::text, 'page_viewed'::text, 'link_clicked'::text, 'email_opened'::text, 'email_clicked'::text])))
);


--
-- Name: workflow_versions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.workflow_versions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    workflow_id uuid NOT NULL,
    version integer NOT NULL,
    nodes jsonb NOT NULL,
    edges jsonb NOT NULL,
    trigger_config jsonb,
    change_summary text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: workflows; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.workflows (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    description text,
    category text DEFAULT 'general'::text,
    nodes jsonb DEFAULT '[]'::jsonb NOT NULL,
    edges jsonb DEFAULT '[]'::jsonb NOT NULL,
    viewport jsonb DEFAULT '{"x": 0, "y": 0, "zoom": 1}'::jsonb,
    is_published boolean DEFAULT false,
    is_active boolean DEFAULT false,
    trigger_config jsonb DEFAULT '{}'::jsonb,
    version integer DEFAULT 1,
    published_version integer,
    last_published_at timestamp with time zone,
    execution_count integer DEFAULT 0,
    success_count integer DEFAULT 0,
    failure_count integer DEFAULT 0,
    last_executed_at timestamp with time zone,
    tags text[] DEFAULT ARRAY[]::text[],
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT workflows_category_check CHECK ((category = ANY (ARRAY['lead_management'::text, 'listing_automation'::text, 'marketing'::text, 'notifications'::text, 'integrations'::text, 'general'::text])))
);


--
-- Name: yandex_webmaster_oauth_credentials; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.yandex_webmaster_oauth_credentials (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    access_token text NOT NULL,
    refresh_token text,
    token_type text DEFAULT 'Bearer'::text,
    expires_at timestamp with time zone NOT NULL,
    is_active boolean DEFAULT true,
    last_refreshed_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: yandex_webmaster_search_data; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.yandex_webmaster_search_data (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    site_id uuid NOT NULL,
    date date NOT NULL,
    query text,
    page_url text,
    device text,
    clicks integer DEFAULT 0,
    shows integer DEFAULT 0,
    ctr numeric(10,6),
    "position" numeric(10,2),
    clicks_change integer,
    shows_change integer,
    ctr_change numeric(10,6),
    position_change numeric(10,2),
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT yandex_webmaster_search_data_device_check CHECK ((device = ANY (ARRAY['DESKTOP'::text, 'MOBILE_AND_TABLET'::text, 'ALL'::text])))
);


--
-- Name: yandex_webmaster_sites; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.yandex_webmaster_sites (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    credential_id uuid,
    host_id text NOT NULL,
    host_url text NOT NULL,
    host_display_name text,
    verification_state text,
    is_primary boolean DEFAULT false,
    last_synced_at timestamp with time zone,
    sync_status text DEFAULT 'pending'::text,
    sync_error text,
    sync_frequency text DEFAULT 'daily'::text,
    auto_sync_enabled boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT yandex_webmaster_sites_sync_frequency_check CHECK ((sync_frequency = ANY (ARRAY['hourly'::text, 'daily'::text, 'weekly'::text, 'manual'::text]))),
    CONSTRAINT yandex_webmaster_sites_sync_status_check CHECK ((sync_status = ANY (ARRAY['pending'::text, 'syncing'::text, 'completed'::text, 'failed'::text])))
);


--
-- Name: ab_test_results ab_test_results_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ab_test_results
    ADD CONSTRAINT ab_test_results_pkey PRIMARY KEY (id);


--
-- Name: account_deletion_log account_deletion_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.account_deletion_log
    ADD CONSTRAINT account_deletion_log_pkey PRIMARY KEY (id);


--
-- Name: account_deletion_scheduled account_deletion_scheduled_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.account_deletion_scheduled
    ADD CONSTRAINT account_deletion_scheduled_pkey PRIMARY KEY (id);


--
-- Name: account_deletion_scheduled account_deletion_scheduled_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.account_deletion_scheduled
    ADD CONSTRAINT account_deletion_scheduled_user_id_key UNIQUE (user_id);


--
-- Name: admin_audit_log admin_audit_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_audit_log
    ADD CONSTRAINT admin_audit_log_pkey PRIMARY KEY (id);


--
-- Name: ai_configuration ai_configuration_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_configuration
    ADD CONSTRAINT ai_configuration_pkey PRIMARY KEY (id);


--
-- Name: ai_configuration ai_configuration_setting_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_configuration
    ADD CONSTRAINT ai_configuration_setting_key_key UNIQUE (setting_key);


--
-- Name: ai_models ai_models_model_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_models
    ADD CONSTRAINT ai_models_model_id_key UNIQUE (model_id);


--
-- Name: ai_models ai_models_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_models
    ADD CONSTRAINT ai_models_pkey PRIMARY KEY (id);


--
-- Name: analytics_views analytics_views_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analytics_views
    ADD CONSTRAINT analytics_views_pkey PRIMARY KEY (id);


--
-- Name: api_keys api_keys_key_hash_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.api_keys
    ADD CONSTRAINT api_keys_key_hash_key UNIQUE (key_hash);


--
-- Name: api_keys api_keys_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.api_keys
    ADD CONSTRAINT api_keys_pkey PRIMARY KEY (id);


--
-- Name: article_comments article_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.article_comments
    ADD CONSTRAINT article_comments_pkey PRIMARY KEY (id);


--
-- Name: article_webhooks article_webhooks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.article_webhooks
    ADD CONSTRAINT article_webhooks_pkey PRIMARY KEY (id);


--
-- Name: articles articles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.articles
    ADD CONSTRAINT articles_pkey PRIMARY KEY (id);


--
-- Name: articles articles_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.articles
    ADD CONSTRAINT articles_slug_key UNIQUE (slug);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: bing_webmaster_oauth_credentials bing_webmaster_oauth_credentials_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bing_webmaster_oauth_credentials
    ADD CONSTRAINT bing_webmaster_oauth_credentials_pkey PRIMARY KEY (id);


--
-- Name: bing_webmaster_search_data bing_webmaster_search_data_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bing_webmaster_search_data
    ADD CONSTRAINT bing_webmaster_search_data_pkey PRIMARY KEY (id);


--
-- Name: bing_webmaster_sites bing_webmaster_sites_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bing_webmaster_sites
    ADD CONSTRAINT bing_webmaster_sites_pkey PRIMARY KEY (id);


--
-- Name: content_suggestions content_suggestions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_suggestions
    ADD CONSTRAINT content_suggestions_pkey PRIMARY KEY (id);


--
-- Name: custom_pages custom_pages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.custom_pages
    ADD CONSTRAINT custom_pages_pkey PRIMARY KEY (id);


--
-- Name: custom_pages custom_pages_user_id_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.custom_pages
    ADD CONSTRAINT custom_pages_user_id_slug_key UNIQUE (user_id, slug);


--
-- Name: encrypted_pii_config encrypted_pii_config_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.encrypted_pii_config
    ADD CONSTRAINT encrypted_pii_config_pkey PRIMARY KEY (id);


--
-- Name: encrypted_pii_config encrypted_pii_config_table_name_field_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.encrypted_pii_config
    ADD CONSTRAINT encrypted_pii_config_table_name_field_name_key UNIQUE (table_name, field_name);


--
-- Name: encryption_key_metadata encryption_key_metadata_key_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.encryption_key_metadata
    ADD CONSTRAINT encryption_key_metadata_key_id_key UNIQUE (key_id);


--
-- Name: encryption_key_metadata encryption_key_metadata_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.encryption_key_metadata
    ADD CONSTRAINT encryption_key_metadata_pkey PRIMARY KEY (id);


--
-- Name: enterprise_sso_config enterprise_sso_config_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.enterprise_sso_config
    ADD CONSTRAINT enterprise_sso_config_pkey PRIMARY KEY (id);


--
-- Name: enterprise_sso_config enterprise_sso_config_saml_entity_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.enterprise_sso_config
    ADD CONSTRAINT enterprise_sso_config_saml_entity_id_key UNIQUE (saml_entity_id);


--
-- Name: error_logs error_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.error_logs
    ADD CONSTRAINT error_logs_pkey PRIMARY KEY (id);


--
-- Name: feature_catalog feature_catalog_feature_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feature_catalog
    ADD CONSTRAINT feature_catalog_feature_key_key UNIQUE (feature_key);


--
-- Name: feature_catalog feature_catalog_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feature_catalog
    ADD CONSTRAINT feature_catalog_pkey PRIMARY KEY (id);


--
-- Name: feature_flags feature_flags_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feature_flags
    ADD CONSTRAINT feature_flags_name_key UNIQUE (name);


--
-- Name: feature_flags feature_flags_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feature_flags
    ADD CONSTRAINT feature_flags_pkey PRIMARY KEY (id);


--
-- Name: feature_usage feature_usage_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feature_usage
    ADD CONSTRAINT feature_usage_pkey PRIMARY KEY (id);


--
-- Name: feature_usage feature_usage_user_id_feature_key_usage_period_start_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feature_usage
    ADD CONSTRAINT feature_usage_user_id_feature_key_usage_period_start_key UNIQUE (user_id, feature_key, usage_period_start);


--
-- Name: ga4_oauth_credentials ga4_oauth_credentials_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ga4_oauth_credentials
    ADD CONSTRAINT ga4_oauth_credentials_pkey PRIMARY KEY (id);


--
-- Name: ga4_properties ga4_properties_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ga4_properties
    ADD CONSTRAINT ga4_properties_pkey PRIMARY KEY (id);


--
-- Name: ga4_traffic_data ga4_traffic_data_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ga4_traffic_data
    ADD CONSTRAINT ga4_traffic_data_pkey PRIMARY KEY (id);


--
-- Name: gdpr_data_requests gdpr_data_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gdpr_data_requests
    ADD CONSTRAINT gdpr_data_requests_pkey PRIMARY KEY (id);


--
-- Name: gsc_keyword_performance gsc_keyword_performance_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gsc_keyword_performance
    ADD CONSTRAINT gsc_keyword_performance_pkey PRIMARY KEY (id);


--
-- Name: gsc_oauth_credentials gsc_oauth_credentials_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gsc_oauth_credentials
    ADD CONSTRAINT gsc_oauth_credentials_pkey PRIMARY KEY (id);


--
-- Name: gsc_page_performance gsc_page_performance_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gsc_page_performance
    ADD CONSTRAINT gsc_page_performance_pkey PRIMARY KEY (id);


--
-- Name: gsc_properties gsc_properties_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gsc_properties
    ADD CONSTRAINT gsc_properties_pkey PRIMARY KEY (id);


--
-- Name: instagram_bio_analyses instagram_bio_analyses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.instagram_bio_analyses
    ADD CONSTRAINT instagram_bio_analyses_pkey PRIMARY KEY (id);


--
-- Name: instagram_bio_analytics instagram_bio_analytics_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.instagram_bio_analytics
    ADD CONSTRAINT instagram_bio_analytics_pkey PRIMARY KEY (id);


--
-- Name: instagram_bio_email_captures instagram_bio_email_captures_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.instagram_bio_email_captures
    ADD CONSTRAINT instagram_bio_email_captures_pkey PRIMARY KEY (id);


--
-- Name: instagram_bio_email_sequences instagram_bio_email_sequences_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.instagram_bio_email_sequences
    ADD CONSTRAINT instagram_bio_email_sequences_pkey PRIMARY KEY (id);


--
-- Name: invoices invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_pkey PRIMARY KEY (id);


--
-- Name: invoices invoices_stripe_invoice_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_stripe_invoice_id_key UNIQUE (stripe_invoice_id);


--
-- Name: keywords keywords_keyword_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.keywords
    ADD CONSTRAINT keywords_keyword_key UNIQUE (keyword);


--
-- Name: keywords keywords_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.keywords
    ADD CONSTRAINT keywords_pkey PRIMARY KEY (id);


--
-- Name: lead_activities lead_activities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lead_activities
    ADD CONSTRAINT lead_activities_pkey PRIMARY KEY (id);


--
-- Name: lead_notes lead_notes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lead_notes
    ADD CONSTRAINT lead_notes_pkey PRIMARY KEY (id);


--
-- Name: lead_routing_rules lead_routing_rules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lead_routing_rules
    ADD CONSTRAINT lead_routing_rules_pkey PRIMARY KEY (id);


--
-- Name: lead_scores lead_scores_lead_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lead_scores
    ADD CONSTRAINT lead_scores_lead_unique UNIQUE (lead_id);


--
-- Name: lead_scores lead_scores_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lead_scores
    ADD CONSTRAINT lead_scores_pkey PRIMARY KEY (id);


--
-- Name: leads leads_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_pkey PRIMARY KEY (id);


--
-- Name: links links_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.links
    ADD CONSTRAINT links_pkey PRIMARY KEY (id);


--
-- Name: listing_descriptions listing_descriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.listing_descriptions
    ADD CONSTRAINT listing_descriptions_pkey PRIMARY KEY (id);


--
-- Name: listing_email_captures listing_email_captures_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.listing_email_captures
    ADD CONSTRAINT listing_email_captures_pkey PRIMARY KEY (id);


--
-- Name: listing_email_sequences listing_email_sequences_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.listing_email_sequences
    ADD CONSTRAINT listing_email_sequences_pkey PRIMARY KEY (id);


--
-- Name: listing_generator_analytics listing_generator_analytics_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.listing_generator_analytics
    ADD CONSTRAINT listing_generator_analytics_pkey PRIMARY KEY (id);


--
-- Name: listings listings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.listings
    ADD CONSTRAINT listings_pkey PRIMARY KEY (id);


--
-- Name: login_attempts login_attempts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.login_attempts
    ADD CONSTRAINT login_attempts_pkey PRIMARY KEY (id);


--
-- Name: mfa_temp_codes mfa_temp_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mfa_temp_codes
    ADD CONSTRAINT mfa_temp_codes_pkey PRIMARY KEY (id);


--
-- Name: mfa_trusted_devices mfa_trusted_devices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mfa_trusted_devices
    ADD CONSTRAINT mfa_trusted_devices_pkey PRIMARY KEY (id);


--
-- Name: mfa_trusted_devices mfa_trusted_devices_user_id_device_fingerprint_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mfa_trusted_devices
    ADD CONSTRAINT mfa_trusted_devices_user_id_device_fingerprint_key UNIQUE (user_id, device_fingerprint);


--
-- Name: mfa_verification_logs mfa_verification_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mfa_verification_logs
    ADD CONSTRAINT mfa_verification_logs_pkey PRIMARY KEY (id);


--
-- Name: ml_model_weights ml_model_weights_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ml_model_weights
    ADD CONSTRAINT ml_model_weights_pkey PRIMARY KEY (id);


--
-- Name: ml_model_weights ml_model_weights_user_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ml_model_weights
    ADD CONSTRAINT ml_model_weights_user_unique UNIQUE (user_id);


--
-- Name: ml_training_examples ml_training_examples_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ml_training_examples
    ADD CONSTRAINT ml_training_examples_pkey PRIMARY KEY (id);


--
-- Name: monthly_usage_summary monthly_usage_summary_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.monthly_usage_summary
    ADD CONSTRAINT monthly_usage_summary_pkey PRIMARY KEY (id);


--
-- Name: monthly_usage_summary monthly_usage_summary_user_id_period_year_period_month_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.monthly_usage_summary
    ADD CONSTRAINT monthly_usage_summary_user_id_period_year_period_month_key UNIQUE (user_id, period_year, period_month);


--
-- Name: mortgage_calculations mortgage_calculations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mortgage_calculations
    ADD CONSTRAINT mortgage_calculations_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: bing_webmaster_oauth_credentials one_active_bing_credential_per_user; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bing_webmaster_oauth_credentials
    ADD CONSTRAINT one_active_bing_credential_per_user UNIQUE (user_id, is_active);


--
-- Name: gsc_oauth_credentials one_active_credential_per_user; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gsc_oauth_credentials
    ADD CONSTRAINT one_active_credential_per_user UNIQUE (user_id, is_active);


--
-- Name: ga4_oauth_credentials one_active_ga4_credential_per_user; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ga4_oauth_credentials
    ADD CONSTRAINT one_active_ga4_credential_per_user UNIQUE (user_id, is_active);


--
-- Name: yandex_webmaster_oauth_credentials one_active_yandex_credential_per_user; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.yandex_webmaster_oauth_credentials
    ADD CONSTRAINT one_active_yandex_credential_per_user UNIQUE (user_id, is_active);


--
-- Name: search_dashboard_config one_config_per_user; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.search_dashboard_config
    ADD CONSTRAINT one_config_per_user UNIQUE (user_id);


--
-- Name: seo_notification_preferences one_preference_per_user; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seo_notification_preferences
    ADD CONSTRAINT one_preference_per_user UNIQUE (user_id);


--
-- Name: pii_encryption_audit pii_encryption_audit_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pii_encryption_audit
    ADD CONSTRAINT pii_encryption_audit_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_custom_domain_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_custom_domain_key UNIQUE (custom_domain);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_username_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_username_key UNIQUE (username);


--
-- Name: pseo_combination_queue pseo_combination_queue_page_type_combination_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pseo_combination_queue
    ADD CONSTRAINT pseo_combination_queue_page_type_combination_key UNIQUE (page_type, combination);


--
-- Name: pseo_combination_queue pseo_combination_queue_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pseo_combination_queue
    ADD CONSTRAINT pseo_combination_queue_pkey PRIMARY KEY (id);


--
-- Name: pseo_generation_errors pseo_generation_errors_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pseo_generation_errors
    ADD CONSTRAINT pseo_generation_errors_pkey PRIMARY KEY (id);


--
-- Name: pseo_pages pseo_pages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pseo_pages
    ADD CONSTRAINT pseo_pages_pkey PRIMARY KEY (id);


--
-- Name: pseo_pages pseo_pages_url_path_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pseo_pages
    ADD CONSTRAINT pseo_pages_url_path_key UNIQUE (url_path);


--
-- Name: pseo_prompts pseo_prompts_page_type_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pseo_prompts
    ADD CONSTRAINT pseo_prompts_page_type_key UNIQUE (page_type);


--
-- Name: pseo_prompts pseo_prompts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pseo_prompts
    ADD CONSTRAINT pseo_prompts_pkey PRIMARY KEY (id);


--
-- Name: pseo_taxonomy pseo_taxonomy_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pseo_taxonomy
    ADD CONSTRAINT pseo_taxonomy_pkey PRIMARY KEY (id);


--
-- Name: query_metrics query_metrics_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.query_metrics
    ADD CONSTRAINT query_metrics_pkey PRIMARY KEY (id);


--
-- Name: rate_limit_entries rate_limit_entries_identifier_limit_type_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rate_limit_entries
    ADD CONSTRAINT rate_limit_entries_identifier_limit_type_key UNIQUE (identifier, limit_type);


--
-- Name: rate_limit_entries rate_limit_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rate_limit_entries
    ADD CONSTRAINT rate_limit_entries_pkey PRIMARY KEY (id);


--
-- Name: rate_limits rate_limits_ip_address_endpoint_window_start_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rate_limits
    ADD CONSTRAINT rate_limits_ip_address_endpoint_window_start_key UNIQUE (ip_address, endpoint, window_start);


--
-- Name: rate_limits rate_limits_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rate_limits
    ADD CONSTRAINT rate_limits_pkey PRIMARY KEY (id);


--
-- Name: search_dashboard_config search_dashboard_config_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.search_dashboard_config
    ADD CONSTRAINT search_dashboard_config_pkey PRIMARY KEY (id);


--
-- Name: seo_alert_rules seo_alert_rules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seo_alert_rules
    ADD CONSTRAINT seo_alert_rules_pkey PRIMARY KEY (id);


--
-- Name: seo_alerts seo_alerts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seo_alerts
    ADD CONSTRAINT seo_alerts_pkey PRIMARY KEY (id);


--
-- Name: seo_audit_history seo_audit_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seo_audit_history
    ADD CONSTRAINT seo_audit_history_pkey PRIMARY KEY (id);


--
-- Name: seo_audit_schedules seo_audit_schedules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seo_audit_schedules
    ADD CONSTRAINT seo_audit_schedules_pkey PRIMARY KEY (id);


--
-- Name: seo_autofix_history seo_autofix_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seo_autofix_history
    ADD CONSTRAINT seo_autofix_history_pkey PRIMARY KEY (id);


--
-- Name: seo_autofix_rules seo_autofix_rules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seo_autofix_rules
    ADD CONSTRAINT seo_autofix_rules_pkey PRIMARY KEY (id);


--
-- Name: seo_automation_logs seo_automation_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seo_automation_logs
    ADD CONSTRAINT seo_automation_logs_pkey PRIMARY KEY (id);


--
-- Name: seo_competitor_analysis seo_competitor_analysis_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seo_competitor_analysis
    ADD CONSTRAINT seo_competitor_analysis_pkey PRIMARY KEY (id);


--
-- Name: seo_competitor_tracking seo_competitor_tracking_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seo_competitor_tracking
    ADD CONSTRAINT seo_competitor_tracking_pkey PRIMARY KEY (id);


--
-- Name: seo_content_optimization seo_content_optimization_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seo_content_optimization
    ADD CONSTRAINT seo_content_optimization_pkey PRIMARY KEY (id);


--
-- Name: seo_core_web_vitals seo_core_web_vitals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seo_core_web_vitals
    ADD CONSTRAINT seo_core_web_vitals_pkey PRIMARY KEY (id);


--
-- Name: seo_crawl_results seo_crawl_results_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seo_crawl_results
    ADD CONSTRAINT seo_crawl_results_pkey PRIMARY KEY (id);


--
-- Name: seo_duplicate_content seo_duplicate_content_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seo_duplicate_content
    ADD CONSTRAINT seo_duplicate_content_pkey PRIMARY KEY (id);


--
-- Name: seo_fixes_applied seo_fixes_applied_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seo_fixes_applied
    ADD CONSTRAINT seo_fixes_applied_pkey PRIMARY KEY (id);


--
-- Name: seo_image_analysis seo_image_analysis_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seo_image_analysis
    ADD CONSTRAINT seo_image_analysis_pkey PRIMARY KEY (id);


--
-- Name: seo_keyword_history seo_keyword_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seo_keyword_history
    ADD CONSTRAINT seo_keyword_history_pkey PRIMARY KEY (id);


--
-- Name: seo_keywords seo_keywords_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seo_keywords
    ADD CONSTRAINT seo_keywords_pkey PRIMARY KEY (id);


--
-- Name: seo_link_analysis seo_link_analysis_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seo_link_analysis
    ADD CONSTRAINT seo_link_analysis_pkey PRIMARY KEY (id);


--
-- Name: seo_mobile_analysis seo_mobile_analysis_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seo_mobile_analysis
    ADD CONSTRAINT seo_mobile_analysis_pkey PRIMARY KEY (id);


--
-- Name: seo_monitoring_log seo_monitoring_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seo_monitoring_log
    ADD CONSTRAINT seo_monitoring_log_pkey PRIMARY KEY (id);


--
-- Name: seo_monitoring_schedules seo_monitoring_schedules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seo_monitoring_schedules
    ADD CONSTRAINT seo_monitoring_schedules_pkey PRIMARY KEY (id);


--
-- Name: seo_notification_preferences seo_notification_preferences_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seo_notification_preferences
    ADD CONSTRAINT seo_notification_preferences_pkey PRIMARY KEY (id);


--
-- Name: seo_notification_queue seo_notification_queue_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seo_notification_queue
    ADD CONSTRAINT seo_notification_queue_pkey PRIMARY KEY (id);


--
-- Name: seo_page_scores seo_page_scores_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seo_page_scores
    ADD CONSTRAINT seo_page_scores_pkey PRIMARY KEY (id);


--
-- Name: seo_performance_budget seo_performance_budget_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seo_performance_budget
    ADD CONSTRAINT seo_performance_budget_pkey PRIMARY KEY (id);


--
-- Name: seo_redirect_analysis seo_redirect_analysis_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seo_redirect_analysis
    ADD CONSTRAINT seo_redirect_analysis_pkey PRIMARY KEY (id);


--
-- Name: seo_report_history seo_report_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seo_report_history
    ADD CONSTRAINT seo_report_history_pkey PRIMARY KEY (id);


--
-- Name: seo_scheduled_reports seo_scheduled_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seo_scheduled_reports
    ADD CONSTRAINT seo_scheduled_reports_pkey PRIMARY KEY (id);


--
-- Name: seo_security_analysis seo_security_analysis_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seo_security_analysis
    ADD CONSTRAINT seo_security_analysis_pkey PRIMARY KEY (id);


--
-- Name: seo_semantic_analysis seo_semantic_analysis_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seo_semantic_analysis
    ADD CONSTRAINT seo_semantic_analysis_pkey PRIMARY KEY (id);


--
-- Name: seo_settings seo_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seo_settings
    ADD CONSTRAINT seo_settings_pkey PRIMARY KEY (id);


--
-- Name: seo_structured_data seo_structured_data_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seo_structured_data
    ADD CONSTRAINT seo_structured_data_pkey PRIMARY KEY (id);


--
-- Name: social_media_posts social_media_posts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.social_media_posts
    ADD CONSTRAINT social_media_posts_pkey PRIMARY KEY (id);


--
-- Name: social_media_webhooks social_media_webhooks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.social_media_webhooks
    ADD CONSTRAINT social_media_webhooks_pkey PRIMARY KEY (id);


--
-- Name: sso_audit_logs sso_audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sso_audit_logs
    ADD CONSTRAINT sso_audit_logs_pkey PRIMARY KEY (id);


--
-- Name: sso_login_sessions sso_login_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sso_login_sessions
    ADD CONSTRAINT sso_login_sessions_pkey PRIMARY KEY (id);


--
-- Name: sso_login_sessions sso_login_sessions_request_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sso_login_sessions
    ADD CONSTRAINT sso_login_sessions_request_id_key UNIQUE (request_id);


--
-- Name: sso_user_mappings sso_user_mappings_config_id_sso_subject_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sso_user_mappings
    ADD CONSTRAINT sso_user_mappings_config_id_sso_subject_id_key UNIQUE (config_id, sso_subject_id);


--
-- Name: sso_user_mappings sso_user_mappings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sso_user_mappings
    ADD CONSTRAINT sso_user_mappings_pkey PRIMARY KEY (id);


--
-- Name: stripe_customers stripe_customers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stripe_customers
    ADD CONSTRAINT stripe_customers_pkey PRIMARY KEY (id);


--
-- Name: stripe_customers stripe_customers_stripe_customer_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stripe_customers
    ADD CONSTRAINT stripe_customers_stripe_customer_id_key UNIQUE (stripe_customer_id);


--
-- Name: stripe_customers stripe_customers_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stripe_customers
    ADD CONSTRAINT stripe_customers_user_id_key UNIQUE (user_id);


--
-- Name: stripe_usage_records stripe_usage_records_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stripe_usage_records
    ADD CONSTRAINT stripe_usage_records_pkey PRIMARY KEY (id);


--
-- Name: subscription_plans subscription_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscription_plans
    ADD CONSTRAINT subscription_plans_pkey PRIMARY KEY (id);


--
-- Name: subscription_plans subscription_plans_stripe_price_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscription_plans
    ADD CONSTRAINT subscription_plans_stripe_price_id_key UNIQUE (stripe_price_id);


--
-- Name: subscriptions subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_pkey PRIMARY KEY (id);


--
-- Name: subscriptions subscriptions_stripe_customer_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_stripe_customer_id_key UNIQUE (stripe_customer_id);


--
-- Name: subscriptions subscriptions_stripe_subscription_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_stripe_subscription_id_key UNIQUE (stripe_subscription_id);


--
-- Name: subscriptions subscriptions_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_user_id_key UNIQUE (user_id);


--
-- Name: system_metrics system_metrics_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_metrics
    ADD CONSTRAINT system_metrics_pkey PRIMARY KEY (id);


--
-- Name: team_members team_members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_members
    ADD CONSTRAINT team_members_pkey PRIMARY KEY (id);


--
-- Name: team_members team_members_team_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_members
    ADD CONSTRAINT team_members_team_id_user_id_key UNIQUE (team_id, user_id);


--
-- Name: team_round_robin team_round_robin_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_round_robin
    ADD CONSTRAINT team_round_robin_pkey PRIMARY KEY (team_id);


--
-- Name: teams teams_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teams
    ADD CONSTRAINT teams_pkey PRIMARY KEY (id);


--
-- Name: testimonials testimonials_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.testimonials
    ADD CONSTRAINT testimonials_pkey PRIMARY KEY (id);


--
-- Name: unified_search_analytics unified_search_analytics_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.unified_search_analytics
    ADD CONSTRAINT unified_search_analytics_pkey PRIMARY KEY (id);


--
-- Name: bing_webmaster_search_data unique_bing_search_date; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bing_webmaster_search_data
    ADD CONSTRAINT unique_bing_search_date UNIQUE (site_id, date, query, page_url, device, country);


--
-- Name: bing_webmaster_sites unique_bing_site_per_user; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bing_webmaster_sites
    ADD CONSTRAINT unique_bing_site_per_user UNIQUE (user_id, site_url);


--
-- Name: ga4_properties unique_ga4_property_per_user; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ga4_properties
    ADD CONSTRAINT unique_ga4_property_per_user UNIQUE (user_id, property_id);


--
-- Name: ga4_traffic_data unique_ga4_traffic_date; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ga4_traffic_data
    ADD CONSTRAINT unique_ga4_traffic_date UNIQUE (property_id, date, page_path, source, medium, device_category, country);


--
-- Name: gsc_keyword_performance unique_gsc_keyword_date; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gsc_keyword_performance
    ADD CONSTRAINT unique_gsc_keyword_date UNIQUE (property_id, query, url, date, device, country);


--
-- Name: gsc_page_performance unique_gsc_page_date; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gsc_page_performance
    ADD CONSTRAINT unique_gsc_page_date UNIQUE (property_id, url, date, device, country);


--
-- Name: gsc_properties unique_property_per_user; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gsc_properties
    ADD CONSTRAINT unique_property_per_user UNIQUE (user_id, property_url);


--
-- Name: unified_search_analytics unique_unified_analytics; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.unified_search_analytics
    ADD CONSTRAINT unique_unified_analytics UNIQUE (user_id, source_platform, date, page_url, query, device, country);


--
-- Name: yandex_webmaster_search_data unique_yandex_search_date; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.yandex_webmaster_search_data
    ADD CONSTRAINT unique_yandex_search_date UNIQUE (site_id, date, query, page_url, device);


--
-- Name: yandex_webmaster_sites unique_yandex_site_per_user; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.yandex_webmaster_sites
    ADD CONSTRAINT unique_yandex_site_per_user UNIQUE (user_id, host_id);


--
-- Name: usage_tracking usage_tracking_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usage_tracking
    ADD CONSTRAINT usage_tracking_pkey PRIMARY KEY (id);


--
-- Name: usage_tracking usage_tracking_user_id_resource_type_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usage_tracking
    ADD CONSTRAINT usage_tracking_user_id_resource_type_key UNIQUE (user_id, resource_type);


--
-- Name: user_activity_log user_activity_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_activity_log
    ADD CONSTRAINT user_activity_log_pkey PRIMARY KEY (id);


--
-- Name: user_mfa_settings user_mfa_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_mfa_settings
    ADD CONSTRAINT user_mfa_settings_pkey PRIMARY KEY (id);


--
-- Name: user_mfa_settings user_mfa_settings_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_mfa_settings
    ADD CONSTRAINT user_mfa_settings_user_id_key UNIQUE (user_id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);


--
-- Name: user_sessions user_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_pkey PRIMARY KEY (id);


--
-- Name: user_settings user_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_settings
    ADD CONSTRAINT user_settings_pkey PRIMARY KEY (id);


--
-- Name: user_settings user_settings_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_settings
    ADD CONSTRAINT user_settings_user_id_key UNIQUE (user_id);


--
-- Name: user_subscriptions user_subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_subscriptions
    ADD CONSTRAINT user_subscriptions_pkey PRIMARY KEY (id);


--
-- Name: user_subscriptions user_subscriptions_stripe_subscription_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_subscriptions
    ADD CONSTRAINT user_subscriptions_stripe_subscription_id_key UNIQUE (stripe_subscription_id);


--
-- Name: user_subscriptions user_subscriptions_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_subscriptions
    ADD CONSTRAINT user_subscriptions_user_id_key UNIQUE (user_id);


--
-- Name: workflow_execution_queue workflow_execution_queue_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workflow_execution_queue
    ADD CONSTRAINT workflow_execution_queue_pkey PRIMARY KEY (id);


--
-- Name: workflow_execution_steps workflow_execution_steps_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workflow_execution_steps
    ADD CONSTRAINT workflow_execution_steps_pkey PRIMARY KEY (id);


--
-- Name: workflow_executions workflow_executions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workflow_executions
    ADD CONSTRAINT workflow_executions_pkey PRIMARY KEY (id);


--
-- Name: workflow_node_templates workflow_node_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workflow_node_templates
    ADD CONSTRAINT workflow_node_templates_pkey PRIMARY KEY (id);


--
-- Name: workflow_node_templates workflow_node_templates_type_subtype_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workflow_node_templates
    ADD CONSTRAINT workflow_node_templates_type_subtype_key UNIQUE (type, subtype);


--
-- Name: workflow_templates workflow_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workflow_templates
    ADD CONSTRAINT workflow_templates_pkey PRIMARY KEY (id);


--
-- Name: workflow_triggers workflow_triggers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workflow_triggers
    ADD CONSTRAINT workflow_triggers_pkey PRIMARY KEY (id);


--
-- Name: workflow_versions workflow_versions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workflow_versions
    ADD CONSTRAINT workflow_versions_pkey PRIMARY KEY (id);


--
-- Name: workflow_versions workflow_versions_workflow_id_version_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workflow_versions
    ADD CONSTRAINT workflow_versions_workflow_id_version_key UNIQUE (workflow_id, version);


--
-- Name: workflows workflows_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workflows
    ADD CONSTRAINT workflows_pkey PRIMARY KEY (id);


--
-- Name: yandex_webmaster_oauth_credentials yandex_webmaster_oauth_credentials_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.yandex_webmaster_oauth_credentials
    ADD CONSTRAINT yandex_webmaster_oauth_credentials_pkey PRIMARY KEY (id);


--
-- Name: yandex_webmaster_search_data yandex_webmaster_search_data_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.yandex_webmaster_search_data
    ADD CONSTRAINT yandex_webmaster_search_data_pkey PRIMARY KEY (id);


--
-- Name: yandex_webmaster_sites yandex_webmaster_sites_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.yandex_webmaster_sites
    ADD CONSTRAINT yandex_webmaster_sites_pkey PRIMARY KEY (id);


--
-- Name: idx_ab_test_results_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ab_test_results_created_at ON public.ab_test_results USING btree (created_at DESC);


--
-- Name: idx_ab_test_results_test_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ab_test_results_test_id ON public.ab_test_results USING btree (test_id);


--
-- Name: idx_ab_test_results_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ab_test_results_user_id ON public.ab_test_results USING btree (user_id);


--
-- Name: idx_ab_test_results_winner; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ab_test_results_winner ON public.ab_test_results USING btree (winner);


--
-- Name: idx_account_deletion_cancelled; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_account_deletion_cancelled ON public.account_deletion_scheduled USING btree (cancelled);


--
-- Name: idx_account_deletion_executed; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_account_deletion_executed ON public.account_deletion_scheduled USING btree (executed);


--
-- Name: idx_account_deletion_scheduled_for; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_account_deletion_scheduled_for ON public.account_deletion_scheduled USING btree (scheduled_for);


--
-- Name: idx_account_deletion_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_account_deletion_user ON public.account_deletion_scheduled USING btree (user_id);


--
-- Name: idx_admin_audit_log_action; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_admin_audit_log_action ON public.admin_audit_log USING btree (action);


--
-- Name: idx_admin_audit_log_admin_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_admin_audit_log_admin_id ON public.admin_audit_log USING btree (admin_id);


--
-- Name: idx_admin_audit_log_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_admin_audit_log_created_at ON public.admin_audit_log USING btree (created_at DESC);


--
-- Name: idx_admin_audit_log_target; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_admin_audit_log_target ON public.admin_audit_log USING btree (target_type, target_id);


--
-- Name: idx_analytics_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_analytics_created_at ON public.instagram_bio_analytics USING btree (created_at DESC);


--
-- Name: idx_analytics_event_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_analytics_event_type ON public.instagram_bio_analytics USING btree (event_type);


--
-- Name: idx_analytics_session; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_analytics_session ON public.instagram_bio_analytics USING btree (session_id);


--
-- Name: idx_analytics_views_user_viewed; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_analytics_views_user_viewed ON public.analytics_views USING btree (user_id, viewed_at DESC);


--
-- Name: idx_api_keys_expires_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_api_keys_expires_at ON public.api_keys USING btree (expires_at) WHERE (is_active = true);


--
-- Name: idx_api_keys_key_hash; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_api_keys_key_hash ON public.api_keys USING btree (key_hash) WHERE (is_active = true);


--
-- Name: idx_api_keys_prefix; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_api_keys_prefix ON public.api_keys USING btree (key_prefix);


--
-- Name: idx_api_keys_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_api_keys_user_id ON public.api_keys USING btree (user_id);


--
-- Name: idx_article_comments_approved; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_article_comments_approved ON public.article_comments USING btree (is_approved);


--
-- Name: idx_article_comments_article; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_article_comments_article ON public.article_comments USING btree (article_id);


--
-- Name: idx_article_webhooks_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_article_webhooks_user_id ON public.article_webhooks USING btree (user_id);


--
-- Name: idx_articles_author; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_articles_author ON public.articles USING btree (author_id);


--
-- Name: idx_articles_keyword; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_articles_keyword ON public.articles USING btree (keyword_id);


--
-- Name: idx_articles_published_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_articles_published_at ON public.articles USING btree (published_at DESC);


--
-- Name: idx_articles_slug; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_articles_slug ON public.articles USING btree (slug);


--
-- Name: idx_articles_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_articles_status ON public.articles USING btree (status);


--
-- Name: idx_audit_logs_action; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_logs_action ON public.audit_logs USING btree (action);


--
-- Name: idx_audit_logs_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_logs_created_at ON public.audit_logs USING btree (created_at DESC);


--
-- Name: idx_audit_logs_ip; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_logs_ip ON public.audit_logs USING btree (ip_address);


--
-- Name: idx_audit_logs_resource; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_logs_resource ON public.audit_logs USING btree (resource_type, resource_id);


--
-- Name: idx_audit_logs_risk; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_logs_risk ON public.audit_logs USING btree (risk_level);


--
-- Name: idx_audit_logs_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_logs_status ON public.audit_logs USING btree (status);


--
-- Name: idx_audit_logs_user_activity; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_logs_user_activity ON public.audit_logs USING btree (user_id, created_at DESC);


--
-- Name: idx_audit_logs_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_logs_user_id ON public.audit_logs USING btree (user_id);


--
-- Name: idx_bing_oauth_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bing_oauth_active ON public.bing_webmaster_oauth_credentials USING btree (is_active) WHERE (is_active = true);


--
-- Name: idx_bing_oauth_expires_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bing_oauth_expires_at ON public.bing_webmaster_oauth_credentials USING btree (expires_at);


--
-- Name: idx_bing_oauth_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bing_oauth_user_id ON public.bing_webmaster_oauth_credentials USING btree (user_id);


--
-- Name: idx_bing_search_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bing_search_date ON public.bing_webmaster_search_data USING btree (date DESC);


--
-- Name: idx_bing_search_page; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bing_search_page ON public.bing_webmaster_search_data USING btree (page_url);


--
-- Name: idx_bing_search_query; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bing_search_query ON public.bing_webmaster_search_data USING btree (query);


--
-- Name: idx_bing_search_site_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bing_search_site_id ON public.bing_webmaster_search_data USING btree (site_id);


--
-- Name: idx_bing_sites_sync_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bing_sites_sync_status ON public.bing_webmaster_sites USING btree (sync_status);


--
-- Name: idx_bing_sites_url; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bing_sites_url ON public.bing_webmaster_sites USING btree (site_url);


--
-- Name: idx_bing_sites_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bing_sites_user_id ON public.bing_webmaster_sites USING btree (user_id);


--
-- Name: idx_bio_analyses_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bio_analyses_created_at ON public.instagram_bio_analyses USING btree (created_at DESC);


--
-- Name: idx_bio_analyses_market; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bio_analyses_market ON public.instagram_bio_analyses USING btree (market);


--
-- Name: idx_bio_analyses_score; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bio_analyses_score ON public.instagram_bio_analyses USING btree (overall_score DESC);


--
-- Name: idx_bio_analyses_session; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bio_analyses_session ON public.instagram_bio_analyses USING btree (session_id);


--
-- Name: idx_content_suggestions_priority; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_content_suggestions_priority ON public.content_suggestions USING btree (priority DESC);


--
-- Name: idx_content_suggestions_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_content_suggestions_status ON public.content_suggestions USING btree (status);


--
-- Name: idx_custom_pages_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_custom_pages_active ON public.custom_pages USING btree (user_id, is_active) WHERE (is_active = true);


--
-- Name: idx_custom_pages_slug; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_custom_pages_slug ON public.custom_pages USING btree (slug);


--
-- Name: idx_custom_pages_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_custom_pages_user_id ON public.custom_pages USING btree (user_id);


--
-- Name: idx_dashboard_config_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dashboard_config_user_id ON public.search_dashboard_config USING btree (user_id);


--
-- Name: idx_email_captures_active_sequences; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_captures_active_sequences ON public.instagram_bio_email_captures USING btree (created_at) WHERE ((email_sequence_started = true) AND (email_sequence_completed = false));


--
-- Name: idx_email_captures_analysis; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_captures_analysis ON public.instagram_bio_email_captures USING btree (analysis_id);


--
-- Name: idx_email_captures_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_captures_created_at ON public.instagram_bio_email_captures USING btree (created_at DESC);


--
-- Name: idx_email_captures_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_captures_email ON public.instagram_bio_email_captures USING btree (email);


--
-- Name: idx_email_captures_market; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_captures_market ON public.instagram_bio_email_captures USING btree (market);


--
-- Name: idx_email_sequences_capture; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_sequences_capture ON public.instagram_bio_email_sequences USING btree (email_capture_id);


--
-- Name: idx_email_sequences_pending; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_sequences_pending ON public.instagram_bio_email_sequences USING btree (email_capture_id, sequence_number) WHERE (sent_at IS NULL);


--
-- Name: idx_email_sequences_sent; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_sequences_sent ON public.instagram_bio_email_sequences USING btree (sent_at);


--
-- Name: idx_encrypted_pii_config_table; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_encrypted_pii_config_table ON public.encrypted_pii_config USING btree (table_name);


--
-- Name: idx_enterprise_sso_config_domain; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_enterprise_sso_config_domain ON public.enterprise_sso_config USING btree (organization_domain) WHERE (active = true);


--
-- Name: idx_enterprise_sso_config_entity_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_enterprise_sso_config_entity_id ON public.enterprise_sso_config USING btree (saml_entity_id);


--
-- Name: idx_enterprise_sso_config_provider; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_enterprise_sso_config_provider ON public.enterprise_sso_config USING btree (sso_provider);


--
-- Name: idx_error_logs_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_error_logs_created_at ON public.error_logs USING btree (created_at DESC);


--
-- Name: idx_error_logs_resolved; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_error_logs_resolved ON public.error_logs USING btree (resolved);


--
-- Name: idx_error_logs_severity; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_error_logs_severity ON public.error_logs USING btree (severity) WHERE (NOT resolved);


--
-- Name: idx_error_logs_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_error_logs_user_id ON public.error_logs USING btree (user_id);


--
-- Name: idx_errors_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_errors_created_at ON public.pseo_generation_errors USING btree (created_at DESC);


--
-- Name: idx_errors_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_errors_type ON public.pseo_generation_errors USING btree (error_type);


--
-- Name: idx_feature_usage_feature_key; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_feature_usage_feature_key ON public.feature_usage USING btree (feature_key);


--
-- Name: idx_feature_usage_period; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_feature_usage_period ON public.feature_usage USING btree (usage_period_start, usage_period_end);


--
-- Name: idx_feature_usage_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_feature_usage_user_id ON public.feature_usage USING btree (user_id);


--
-- Name: idx_ga4_oauth_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ga4_oauth_active ON public.ga4_oauth_credentials USING btree (is_active) WHERE (is_active = true);


--
-- Name: idx_ga4_oauth_expires_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ga4_oauth_expires_at ON public.ga4_oauth_credentials USING btree (expires_at);


--
-- Name: idx_ga4_oauth_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ga4_oauth_user_id ON public.ga4_oauth_credentials USING btree (user_id);


--
-- Name: idx_ga4_properties_property_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ga4_properties_property_id ON public.ga4_properties USING btree (property_id);


--
-- Name: idx_ga4_properties_sync_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ga4_properties_sync_status ON public.ga4_properties USING btree (sync_status);


--
-- Name: idx_ga4_properties_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ga4_properties_user_id ON public.ga4_properties USING btree (user_id);


--
-- Name: idx_ga4_traffic_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ga4_traffic_date ON public.ga4_traffic_data USING btree (date DESC);


--
-- Name: idx_ga4_traffic_device; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ga4_traffic_device ON public.ga4_traffic_data USING btree (device_category);


--
-- Name: idx_ga4_traffic_page_path; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ga4_traffic_page_path ON public.ga4_traffic_data USING btree (page_path);


--
-- Name: idx_ga4_traffic_property_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ga4_traffic_property_id ON public.ga4_traffic_data USING btree (property_id);


--
-- Name: idx_ga4_traffic_source; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ga4_traffic_source ON public.ga4_traffic_data USING btree (source);


--
-- Name: idx_gdpr_requests_scheduled_deletion; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_gdpr_requests_scheduled_deletion ON public.gdpr_data_requests USING btree (scheduled_deletion_at);


--
-- Name: idx_gdpr_requests_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_gdpr_requests_status ON public.gdpr_data_requests USING btree (status);


--
-- Name: idx_gdpr_requests_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_gdpr_requests_type ON public.gdpr_data_requests USING btree (request_type);


--
-- Name: idx_gdpr_requests_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_gdpr_requests_user_id ON public.gdpr_data_requests USING btree (user_id);


--
-- Name: idx_gsc_keyword_clicks; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_gsc_keyword_clicks ON public.gsc_keyword_performance USING btree (clicks DESC);


--
-- Name: idx_gsc_keyword_country; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_gsc_keyword_country ON public.gsc_keyword_performance USING btree (country);


--
-- Name: idx_gsc_keyword_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_gsc_keyword_date ON public.gsc_keyword_performance USING btree (date DESC);


--
-- Name: idx_gsc_keyword_device; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_gsc_keyword_device ON public.gsc_keyword_performance USING btree (device);


--
-- Name: idx_gsc_keyword_impressions; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_gsc_keyword_impressions ON public.gsc_keyword_performance USING btree (impressions DESC);


--
-- Name: idx_gsc_keyword_position; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_gsc_keyword_position ON public.gsc_keyword_performance USING btree ("position");


--
-- Name: idx_gsc_keyword_property_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_gsc_keyword_property_id ON public.gsc_keyword_performance USING btree (property_id);


--
-- Name: idx_gsc_keyword_query; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_gsc_keyword_query ON public.gsc_keyword_performance USING btree (query);


--
-- Name: idx_gsc_keyword_url; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_gsc_keyword_url ON public.gsc_keyword_performance USING btree (url);


--
-- Name: idx_gsc_oauth_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_gsc_oauth_active ON public.gsc_oauth_credentials USING btree (is_active) WHERE (is_active = true);


--
-- Name: idx_gsc_oauth_expires_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_gsc_oauth_expires_at ON public.gsc_oauth_credentials USING btree (expires_at);


--
-- Name: idx_gsc_oauth_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_gsc_oauth_user_id ON public.gsc_oauth_credentials USING btree (user_id);


--
-- Name: idx_gsc_page_clicks; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_gsc_page_clicks ON public.gsc_page_performance USING btree (clicks DESC);


--
-- Name: idx_gsc_page_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_gsc_page_date ON public.gsc_page_performance USING btree (date DESC);


--
-- Name: idx_gsc_page_device; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_gsc_page_device ON public.gsc_page_performance USING btree (device);


--
-- Name: idx_gsc_page_impressions; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_gsc_page_impressions ON public.gsc_page_performance USING btree (impressions DESC);


--
-- Name: idx_gsc_page_position; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_gsc_page_position ON public.gsc_page_performance USING btree ("position");


--
-- Name: idx_gsc_page_property_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_gsc_page_property_id ON public.gsc_page_performance USING btree (property_id);


--
-- Name: idx_gsc_page_url; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_gsc_page_url ON public.gsc_page_performance USING btree (url);


--
-- Name: idx_gsc_properties_last_synced; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_gsc_properties_last_synced ON public.gsc_properties USING btree (last_synced_at DESC);


--
-- Name: idx_gsc_properties_primary; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_gsc_properties_primary ON public.gsc_properties USING btree (is_primary) WHERE (is_primary = true);


--
-- Name: idx_gsc_properties_sync_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_gsc_properties_sync_status ON public.gsc_properties USING btree (sync_status);


--
-- Name: idx_gsc_properties_url; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_gsc_properties_url ON public.gsc_properties USING btree (property_url);


--
-- Name: idx_gsc_properties_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_gsc_properties_user_id ON public.gsc_properties USING btree (user_id);


--
-- Name: idx_invoices_user_id_paid_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_invoices_user_id_paid_at ON public.invoices USING btree (user_id, paid_at DESC);


--
-- Name: idx_keywords_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_keywords_active ON public.keywords USING btree (is_active);


--
-- Name: idx_keywords_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_keywords_category ON public.keywords USING btree (category);


--
-- Name: idx_keywords_usage; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_keywords_usage ON public.keywords USING btree (usage_count, last_used_at) WHERE (is_active = true);


--
-- Name: idx_lead_activities_activity_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lead_activities_activity_at ON public.lead_activities USING btree (activity_at DESC);


--
-- Name: idx_lead_activities_lead_activity_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lead_activities_lead_activity_at ON public.lead_activities USING btree (lead_id, activity_at DESC);


--
-- Name: idx_lead_activities_lead_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lead_activities_lead_id ON public.lead_activities USING btree (lead_id);


--
-- Name: idx_lead_activities_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lead_activities_type ON public.lead_activities USING btree (activity_type);


--
-- Name: idx_lead_activities_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lead_activities_user_id ON public.lead_activities USING btree (user_id);


--
-- Name: idx_lead_notes_lead_id_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lead_notes_lead_id_created_at ON public.lead_notes USING btree (lead_id, created_at DESC);


--
-- Name: idx_lead_scores_converted; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lead_scores_converted ON public.lead_scores USING btree (converted) WHERE (converted IS NOT NULL);


--
-- Name: idx_lead_scores_lead_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lead_scores_lead_id ON public.lead_scores USING btree (lead_id);


--
-- Name: idx_lead_scores_priority; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lead_scores_priority ON public.lead_scores USING btree (priority);


--
-- Name: idx_lead_scores_scored_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lead_scores_scored_at ON public.lead_scores USING btree (scored_at DESC);


--
-- Name: idx_lead_scores_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lead_scores_user_id ON public.lead_scores USING btree (user_id);


--
-- Name: idx_lead_scores_variant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lead_scores_variant ON public.lead_scores USING btree (variant);


--
-- Name: idx_leads_assigned_to; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_leads_assigned_to ON public.leads USING btree (assigned_to);


--
-- Name: idx_leads_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_leads_created_at ON public.leads USING btree (created_at DESC);


--
-- Name: idx_leads_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_leads_email ON public.leads USING btree (email);


--
-- Name: idx_leads_lead_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_leads_lead_type ON public.leads USING btree (lead_type);


--
-- Name: idx_leads_new_by_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_leads_new_by_user ON public.leads USING btree (user_id, created_at DESC) WHERE (status = 'new'::text);


--
-- Name: idx_leads_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_leads_status ON public.leads USING btree (status);


--
-- Name: idx_leads_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_leads_user_id ON public.leads USING btree (user_id);


--
-- Name: idx_leads_user_responded; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_leads_user_responded ON public.leads USING btree (user_id, first_responded_at);


--
-- Name: idx_leads_user_status_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_leads_user_status_created ON public.leads USING btree (user_id, status, created_at DESC);


--
-- Name: idx_links_user_active_position; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_links_user_active_position ON public.links USING btree (user_id, is_active, "position");


--
-- Name: idx_listing_analytics_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_listing_analytics_created_at ON public.listing_generator_analytics USING btree (created_at DESC);


--
-- Name: idx_listing_analytics_event_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_listing_analytics_event_type ON public.listing_generator_analytics USING btree (event_type);


--
-- Name: idx_listing_analytics_session; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_listing_analytics_session ON public.listing_generator_analytics USING btree (session_id);


--
-- Name: idx_listing_descriptions_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_listing_descriptions_created_at ON public.listing_descriptions USING btree (created_at DESC);


--
-- Name: idx_listing_descriptions_session; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_listing_descriptions_session ON public.listing_descriptions USING btree (session_id);


--
-- Name: idx_listing_descriptions_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_listing_descriptions_user ON public.listing_descriptions USING btree (user_id);


--
-- Name: idx_listing_email_captures_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_listing_email_captures_created_at ON public.listing_email_captures USING btree (created_at DESC);


--
-- Name: idx_listing_email_captures_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_listing_email_captures_email ON public.listing_email_captures USING btree (email);


--
-- Name: idx_listing_email_captures_listing; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_listing_email_captures_listing ON public.listing_email_captures USING btree (listing_id);


--
-- Name: idx_listing_email_sequences_capture; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_listing_email_sequences_capture ON public.listing_email_sequences USING btree (email_capture_id);


--
-- Name: idx_listing_email_sequences_sent; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_listing_email_sequences_sent ON public.listing_email_sequences USING btree (sent_at);


--
-- Name: idx_listings_active_by_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_listings_active_by_user ON public.listings USING btree (user_id, created_at DESC) WHERE (status = 'active'::text);


--
-- Name: idx_listings_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_listings_created_at ON public.listings USING btree (created_at DESC);


--
-- Name: idx_listings_featured; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_listings_featured ON public.listings USING btree (is_featured) WHERE (is_featured = true);


--
-- Name: idx_listings_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_listings_status ON public.listings USING btree (status);


--
-- Name: idx_listings_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_listings_user_id ON public.listings USING btree (user_id);


--
-- Name: idx_listings_user_status_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_listings_user_status_created ON public.listings USING btree (user_id, status, created_at DESC);


--
-- Name: idx_login_attempts_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_login_attempts_created_at ON public.login_attempts USING btree (created_at DESC);


--
-- Name: idx_login_attempts_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_login_attempts_email ON public.login_attempts USING btree (email);


--
-- Name: idx_login_attempts_email_ip_recent; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_login_attempts_email_ip_recent ON public.login_attempts USING btree (email, ip_address, created_at DESC);


--
-- Name: idx_login_attempts_failed; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_login_attempts_failed ON public.login_attempts USING btree (email, created_at DESC);


--
-- Name: idx_login_attempts_ip; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_login_attempts_ip ON public.login_attempts USING btree (ip_address);


--
-- Name: idx_login_attempts_success; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_login_attempts_success ON public.login_attempts USING btree (success);


--
-- Name: idx_mfa_temp_codes_expires_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mfa_temp_codes_expires_at ON public.mfa_temp_codes USING btree (expires_at);


--
-- Name: idx_mfa_temp_codes_used; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mfa_temp_codes_used ON public.mfa_temp_codes USING btree (used);


--
-- Name: idx_mfa_temp_codes_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mfa_temp_codes_user_id ON public.mfa_temp_codes USING btree (user_id);


--
-- Name: idx_mfa_trusted_devices_fingerprint; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mfa_trusted_devices_fingerprint ON public.mfa_trusted_devices USING btree (device_fingerprint);


--
-- Name: idx_mfa_trusted_devices_trusted_until; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mfa_trusted_devices_trusted_until ON public.mfa_trusted_devices USING btree (trusted_until) WHERE (revoked = false);


--
-- Name: idx_mfa_trusted_devices_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mfa_trusted_devices_user_id ON public.mfa_trusted_devices USING btree (user_id);


--
-- Name: idx_mfa_verification_logs_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mfa_verification_logs_created_at ON public.mfa_verification_logs USING btree (created_at DESC);


--
-- Name: idx_mfa_verification_logs_ip; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mfa_verification_logs_ip ON public.mfa_verification_logs USING btree (ip_address);


--
-- Name: idx_mfa_verification_logs_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mfa_verification_logs_status ON public.mfa_verification_logs USING btree (status);


--
-- Name: idx_mfa_verification_logs_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mfa_verification_logs_user_id ON public.mfa_verification_logs USING btree (user_id);


--
-- Name: idx_ml_model_weights_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ml_model_weights_user_id ON public.ml_model_weights USING btree (user_id);


--
-- Name: idx_ml_training_examples_converted; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ml_training_examples_converted ON public.ml_training_examples USING btree (converted);


--
-- Name: idx_ml_training_examples_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ml_training_examples_created_at ON public.ml_training_examples USING btree (created_at DESC);


--
-- Name: idx_ml_training_examples_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ml_training_examples_user_id ON public.ml_training_examples USING btree (user_id);


--
-- Name: idx_mortgage_calculations_lead_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mortgage_calculations_lead_id ON public.mortgage_calculations USING btree (lead_id) WHERE (lead_id IS NOT NULL);


--
-- Name: idx_mortgage_calculations_user_id_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mortgage_calculations_user_id_created_at ON public.mortgage_calculations USING btree (user_id, created_at DESC);


--
-- Name: idx_notifications_user_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_user_created ON public.notifications USING btree (user_id, created_at DESC);


--
-- Name: idx_notifications_user_unread; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_user_unread ON public.notifications USING btree (user_id, created_at DESC) WHERE (read_at IS NULL);


--
-- Name: idx_pii_encryption_audit_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pii_encryption_audit_created ON public.pii_encryption_audit USING btree (created_at DESC);


--
-- Name: idx_pii_encryption_audit_operation; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pii_encryption_audit_operation ON public.pii_encryption_audit USING btree (operation);


--
-- Name: idx_pii_encryption_audit_table; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pii_encryption_audit_table ON public.pii_encryption_audit USING btree (table_name);


--
-- Name: idx_pii_encryption_audit_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pii_encryption_audit_user ON public.pii_encryption_audit USING btree (user_id);


--
-- Name: idx_profiles_bio_search; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_bio_search ON public.profiles USING gin (to_tsvector('english'::regconfig, COALESCE(bio, ''::text)));


--
-- Name: idx_profiles_brokerage_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_brokerage_name ON public.profiles USING btree (brokerage_name);


--
-- Name: idx_profiles_custom_domain; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_custom_domain ON public.profiles USING btree (custom_domain) WHERE (custom_domain IS NOT NULL);


--
-- Name: idx_profiles_full_name_search; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_full_name_search ON public.profiles USING gin (to_tsvector('english'::regconfig, COALESCE(full_name, ''::text)));


--
-- Name: idx_profiles_is_published; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_is_published ON public.profiles USING btree (is_published) WHERE (is_published = true);


--
-- Name: idx_profiles_license_state; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_license_state ON public.profiles USING btree (license_state);


--
-- Name: idx_profiles_username_lower; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_username_lower ON public.profiles USING btree (lower(username));


--
-- Name: idx_profiles_zapier_webhook; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_zapier_webhook ON public.profiles USING btree (id) WHERE (zapier_webhook_url IS NOT NULL);


--
-- Name: idx_pseo_pages_combination_city; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pseo_pages_combination_city ON public.pseo_pages USING gin (combination);


--
-- Name: idx_pseo_pages_page_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pseo_pages_page_type ON public.pseo_pages USING btree (page_type);


--
-- Name: idx_pseo_pages_published; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pseo_pages_published ON public.pseo_pages USING btree (is_published) WHERE (is_published = true);


--
-- Name: idx_pseo_pages_refresh; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pseo_pages_refresh ON public.pseo_pages USING btree (next_refresh_at) WHERE (is_published = true);


--
-- Name: idx_pseo_pages_url_path; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pseo_pages_url_path ON public.pseo_pages USING btree (url_path);


--
-- Name: idx_query_metrics_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_query_metrics_created_at ON public.query_metrics USING btree (created_at DESC);


--
-- Name: idx_query_metrics_duration; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_query_metrics_duration ON public.query_metrics USING btree (duration_ms DESC);


--
-- Name: idx_queue_status_priority; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_queue_status_priority ON public.pseo_combination_queue USING btree (status, priority, queued_at);


--
-- Name: idx_rate_limit_blocked; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rate_limit_blocked ON public.rate_limit_entries USING btree (blocked_until);


--
-- Name: idx_rate_limit_identifier; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rate_limit_identifier ON public.rate_limit_entries USING btree (identifier);


--
-- Name: idx_rate_limit_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rate_limit_type ON public.rate_limit_entries USING btree (limit_type);


--
-- Name: idx_rate_limit_window; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rate_limit_window ON public.rate_limit_entries USING btree (window_end);


--
-- Name: idx_rate_limits_lookup; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rate_limits_lookup ON public.rate_limits USING btree (ip_address, endpoint, window_start);


--
-- Name: idx_rate_limits_window_start; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rate_limits_window_start ON public.rate_limits USING btree (window_start);


--
-- Name: idx_routing_team_priority; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_routing_team_priority ON public.lead_routing_rules USING btree (team_id, priority) WHERE (is_active = true);


--
-- Name: idx_seo_alert_rules_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_seo_alert_rules_active ON public.seo_alert_rules USING btree (is_active) WHERE (is_active = true);


--
-- Name: idx_seo_alert_rules_severity; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_seo_alert_rules_severity ON public.seo_alert_rules USING btree (severity);


--
-- Name: idx_seo_alert_rules_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_seo_alert_rules_type ON public.seo_alert_rules USING btree (rule_type);


--
-- Name: idx_seo_alerts_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_seo_alerts_created_at ON public.seo_alerts USING btree (created_at DESC);


--
-- Name: idx_seo_alerts_open; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_seo_alerts_open ON public.seo_alerts USING btree (status) WHERE (status = 'open'::text);


--
-- Name: idx_seo_alerts_rule_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_seo_alerts_rule_id ON public.seo_alerts USING btree (alert_rule_id);


--
-- Name: idx_seo_alerts_severity; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_seo_alerts_severity ON public.seo_alerts USING btree (severity);


--
-- Name: idx_seo_alerts_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_seo_alerts_status ON public.seo_alerts USING btree (status);


--
-- Name: idx_seo_alerts_url; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_seo_alerts_url ON public.seo_alerts USING btree (affected_url);


--
-- Name: idx_seo_alerts_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_seo_alerts_user_id ON public.seo_alerts USING btree (user_id);


--
-- Name: idx_seo_audit_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_seo_audit_created_at ON public.seo_audit_history USING btree (created_at DESC);


--
-- Name: idx_seo_audit_schedules_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_seo_audit_schedules_created_by ON public.seo_audit_schedules USING btree (created_by);


--
-- Name: idx_seo_audit_schedules_next_run; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_seo_audit_schedules_next_run ON public.seo_audit_schedules USING btree (next_run_at) WHERE (active = true);


--
-- Name: idx_seo_audit_score; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_seo_audit_score ON public.seo_audit_history USING btree (overall_score DESC);


--
-- Name: idx_seo_audit_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_seo_audit_type ON public.seo_audit_history USING btree (audit_type);


--
-- Name: idx_seo_audit_url; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_seo_audit_url ON public.seo_audit_history USING btree (url);


--
-- Name: idx_seo_autofix_history_applied_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_seo_autofix_history_applied_at ON public.seo_autofix_history USING btree (applied_at DESC);


--
-- Name: idx_seo_autofix_history_result; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_seo_autofix_history_result ON public.seo_autofix_history USING btree (result);


--
-- Name: idx_seo_autofix_history_rule_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_seo_autofix_history_rule_id ON public.seo_autofix_history USING btree (rule_id);


--
-- Name: idx_seo_autofix_rules_issue_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_seo_autofix_rules_issue_type ON public.seo_autofix_rules USING btree (issue_type) WHERE (active = true);


--
-- Name: idx_seo_autofix_rules_priority; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_seo_autofix_rules_priority ON public.seo_autofix_rules USING btree (priority DESC) WHERE (active = true);


--
-- Name: idx_seo_automation_logs_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_seo_automation_logs_created_at ON public.seo_automation_logs USING btree (created_at DESC);


--
-- Name: idx_seo_automation_logs_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_seo_automation_logs_status ON public.seo_automation_logs USING btree (status);


--
-- Name: idx_seo_automation_logs_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_seo_automation_logs_type ON public.seo_automation_logs USING btree (automation_type);


--
-- Name: idx_seo_budget_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_seo_budget_active ON public.seo_performance_budget USING btree (is_active) WHERE (is_active = true);


--
-- Name: idx_seo_budget_url_pattern; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_seo_budget_url_pattern ON public.seo_performance_budget USING btree (url_pattern);


--
-- Name: idx_seo_budget_within; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_seo_budget_within ON public.seo_performance_budget USING btree (is_within_budget);


--
-- Name: idx_seo_competitor_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_seo_competitor_date ON public.seo_competitor_analysis USING btree (analysis_date DESC);


--
-- Name: idx_seo_competitor_domain; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_seo_competitor_domain ON public.seo_competitor_analysis USING btree (competitor_domain);


--
-- Name: idx_seo_competitor_our_domain; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_seo_competitor_our_domain ON public.seo_competitor_analysis USING btree (our_domain);


--
-- Name: idx_seo_competitor_tracking_domain; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_seo_competitor_tracking_domain ON public.seo_competitor_tracking USING btree (competitor_domain);


--
-- Name: idx_seo_competitor_tracking_next_check; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_seo_competitor_tracking_next_check ON public.seo_competitor_tracking USING btree (next_check_at) WHERE (active = true);


--
-- Name: idx_seo_content_analyzed_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_seo_content_analyzed_at ON public.seo_content_optimization USING btree (analyzed_at DESC);


--
-- Name: idx_seo_content_keyword; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_seo_content_keyword ON public.seo_content_optimization USING btree (target_keyword);


--
-- Name: idx_seo_content_score; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_seo_content_score ON public.seo_content_optimization USING btree (optimization_score DESC);


--
-- Name: idx_seo_content_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_seo_content_status ON public.seo_content_optimization USING btree (status);


--
-- Name: idx_seo_content_url; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_seo_content_url ON public.seo_content_optimization USING btree (url);


--
-- Name: idx_seo_crawl_broken_links; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_seo_crawl_broken_links ON public.seo_crawl_results USING btree (broken_links) WHERE (broken_links > 0);


--
-- Name: idx_seo_crawl_content_hash; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_seo_crawl_content_hash ON public.seo_crawl_results USING btree (content_hash);


--
-- Name: idx_seo_crawl_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_seo_crawl_date ON public.seo_crawl_results USING btree (crawled_at DESC);


--
-- Name: idx_seo_crawl_parent_url; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_seo_crawl_parent_url ON public.seo_crawl_results USING btree (parent_url);


--
-- Name: idx_seo_crawl_session_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_seo_crawl_session_id ON public.seo_crawl_results USING btree (crawl_session_id);


--
-- Name: idx_seo_crawl_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_seo_crawl_status ON public.seo_crawl_results USING btree (status_code);


--
-- Name: idx_seo_crawl_url; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_seo_crawl_url ON public.seo_crawl_results USING btree (url);


--
-- Name: idx_seo_cwv_device; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_seo_cwv_device ON public.seo_core_web_vitals USING btree (device);


--
-- Name: idx_seo_cwv_lcp_pass; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_seo_cwv_lcp_pass ON public.seo_core_web_vitals USING btree (lcp_pass);


--
-- Name: idx_seo_cwv_measured_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_seo_cwv_measured_at ON public.seo_core_web_vitals USING btree (measured_at DESC);


--
-- Name: idx_seo_cwv_performance_score; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_seo_cwv_performance_score ON public.seo_core_web_vitals USING btree (performance_score DESC);


--
-- Name: idx_seo_cwv_url; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_seo_cwv_url ON public.seo_core_web_vitals USING btree (url);


--
-- Name: idx_seo_duplicate_hash; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_seo_duplicate_hash ON public.seo_duplicate_content USING btree (content_hash);


--
-- Name: idx_seo_duplicate_impact; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_seo_duplicate_impact ON public.seo_duplicate_content USING btree (impact_level);


--
-- Name: idx_seo_duplicate_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_seo_duplicate_status ON public.seo_duplicate_content USING btree (status);


--
-- Name: idx_seo_fixes_audit_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_seo_fixes_audit_id ON public.seo_fixes_applied USING btree (audit_id);


--
-- Name: idx_seo_fixes_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_seo_fixes_created_at ON public.seo_fixes_applied USING btree (created_at DESC);


--
-- Name: idx_seo_fixes_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_seo_fixes_status ON public.seo_fixes_applied USING btree (status);


--
-- Name: idx_seo_fixes_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_seo_fixes_type ON public.seo_fixes_applied USING btree (fix_type);


--
-- Name: idx_seo_fixes_url; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_seo_fixes_url ON public.seo_fixes_applied USING btree (url);


--
-- Name: idx_seo_image_analyzed_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_seo_image_analyzed_at ON public.seo_image_analysis USING btree (analyzed_at DESC);


--
-- Name: idx_seo_image_optimized; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_seo_image_optimized ON public.seo_image_analysis USING btree (is_optimized);


--
-- Name: idx_seo_image_page_url; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_seo_image_page_url ON public.seo_image_analysis USING btree (page_url);


--
-- Name: idx_seo_keyword_history_keyword_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_seo_keyword_history_keyword_id ON public.seo_keyword_history USING btree (keyword_id);


--
-- Name: idx_seo_keyword_history_recorded_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_seo_keyword_history_recorded_at ON public.seo_keyword_history USING btree (recorded_at DESC);


--
-- Name: idx_seo_keyword_history_search_engine; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_seo_keyword_history_search_engine ON public.seo_keyword_history USING btree (search_engine);


--
-- Name: idx_seo_keywords_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_seo_keywords_active ON public.seo_keywords USING btree (is_active) WHERE (is_active = true);


--
-- Name: idx_seo_keywords_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_seo_keywords_category ON public.seo_keywords USING btree (category);


--
-- Name: idx_seo_keywords_keyword; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_seo_keywords_keyword ON public.seo_keywords USING btree (keyword);


--
-- Name: idx_seo_keywords_position; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_seo_keywords_position ON public.seo_keywords USING btree (current_position);


--
-- Name: idx_seo_keywords_priority; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_seo_keywords_priority ON public.seo_keywords USING btree (priority DESC);


--
-- Name: idx_seo_keywords_ranking; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_seo_keywords_ranking ON public.seo_keywords USING btree (is_ranking) WHERE (is_ranking = true);


--
-- Name: idx_seo_keywords_url; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_seo_keywords_url ON public.seo_keywords USING btree (target_url);


--
-- Name: idx_seo_link_broken; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_seo_link_broken ON public.seo_link_analysis USING btree (broken_links) WHERE (broken_links > 0);


--
-- Name: idx_seo_link_orphan; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_seo_link_orphan ON public.seo_link_analysis USING btree (orphan_page) WHERE (orphan_page = true);


--
-- Name: idx_seo_link_page_url; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_seo_link_page_url ON public.seo_link_analysis USING btree (page_url);


--
-- Name: idx_seo_mobile_friendly; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_seo_mobile_friendly ON public.seo_mobile_analysis USING btree (mobile_friendly);


--
-- Name: idx_seo_mobile_score; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_seo_mobile_score ON public.seo_mobile_analysis USING btree (mobile_score);


--
-- Name: idx_seo_mobile_url; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_seo_mobile_url ON public.seo_mobile_analysis USING btree (url);


--
-- Name: idx_seo_monitoring_log_schedule_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_seo_monitoring_log_schedule_id ON public.seo_monitoring_log USING btree (schedule_id);


--
-- Name: idx_seo_monitoring_log_started_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_seo_monitoring_log_started_at ON public.seo_monitoring_log USING btree (started_at DESC);


--
-- Name: idx_seo_monitoring_log_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_seo_monitoring_log_status ON public.seo_monitoring_log USING btree (status);


--
-- Name: idx_seo_notif_pref_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_seo_notif_pref_user_id ON public.seo_notification_preferences USING btree (user_id);


--
-- Name: idx_seo_notification_queue_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_seo_notification_queue_created_at ON public.seo_notification_queue USING btree (created_at DESC);


--
-- Name: idx_seo_notification_queue_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_seo_notification_queue_status ON public.seo_notification_queue USING btree (status) WHERE (status = 'pending'::text);


--
-- Name: idx_seo_page_scores_overall; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_seo_page_scores_overall ON public.seo_page_scores USING btree (overall_score DESC);


--
-- Name: idx_seo_page_scores_scored_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_seo_page_scores_scored_at ON public.seo_page_scores USING btree (last_scored_at DESC);


--
-- Name: idx_seo_page_scores_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_seo_page_scores_type ON public.seo_page_scores USING btree (page_type);


--
-- Name: idx_seo_page_scores_url; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_seo_page_scores_url ON public.seo_page_scores USING btree (url);


--
-- Name: idx_seo_redirect_chain; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_seo_redirect_chain ON public.seo_redirect_analysis USING btree (is_chain) WHERE (is_chain = true);


--
-- Name: idx_seo_redirect_final; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_seo_redirect_final ON public.seo_redirect_analysis USING btree (final_url);


--
-- Name: idx_seo_redirect_source; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_seo_redirect_source ON public.seo_redirect_analysis USING btree (source_url);


--
-- Name: idx_seo_redirect_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_seo_redirect_status ON public.seo_redirect_analysis USING btree (status);


--
-- Name: idx_seo_report_history_generated_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_seo_report_history_generated_at ON public.seo_report_history USING btree (generated_at DESC);


--
-- Name: idx_seo_report_history_schedule_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_seo_report_history_schedule_id ON public.seo_report_history USING btree (schedule_id);


--
-- Name: idx_seo_scheduled_reports_next_gen; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_seo_scheduled_reports_next_gen ON public.seo_scheduled_reports USING btree (next_generation_at) WHERE (active = true);


--
-- Name: idx_seo_schedules_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_seo_schedules_active ON public.seo_monitoring_schedules USING btree (is_active) WHERE (is_active = true);


--
-- Name: idx_seo_schedules_next_run; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_seo_schedules_next_run ON public.seo_monitoring_schedules USING btree (next_run_at);


--
-- Name: idx_seo_schedules_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_seo_schedules_type ON public.seo_monitoring_schedules USING btree (schedule_type);


--
-- Name: idx_seo_schedules_url; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_seo_schedules_url ON public.seo_monitoring_schedules USING btree (target_url);


--
-- Name: idx_seo_schema_eligible; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_seo_schema_eligible ON public.seo_structured_data USING btree (eligible_for_rich_results);


--
-- Name: idx_seo_schema_url; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_seo_schema_url ON public.seo_structured_data USING btree (url);


--
-- Name: idx_seo_schema_valid; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_seo_schema_valid ON public.seo_structured_data USING btree (is_valid);


--
-- Name: idx_seo_security_grade; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_seo_security_grade ON public.seo_security_analysis USING btree (security_grade);


--
-- Name: idx_seo_security_score; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_seo_security_score ON public.seo_security_analysis USING btree (security_score);


--
-- Name: idx_seo_security_url; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_seo_security_url ON public.seo_security_analysis USING btree (url);


--
-- Name: idx_seo_semantic_analyzed_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_seo_semantic_analyzed_at ON public.seo_semantic_analysis USING btree (analyzed_at DESC);


--
-- Name: idx_seo_semantic_cluster; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_seo_semantic_cluster ON public.seo_semantic_analysis USING btree (topic_cluster_id);


--
-- Name: idx_seo_semantic_pillar; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_seo_semantic_pillar ON public.seo_semantic_analysis USING btree (is_pillar_content) WHERE (is_pillar_content = true);


--
-- Name: idx_seo_semantic_relevance; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_seo_semantic_relevance ON public.seo_semantic_analysis USING btree (semantic_relevance_score DESC);


--
-- Name: idx_seo_semantic_topic; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_seo_semantic_topic ON public.seo_semantic_analysis USING btree (primary_topic);


--
-- Name: idx_seo_semantic_url; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_seo_semantic_url ON public.seo_semantic_analysis USING btree (url);


--
-- Name: idx_seo_settings_site_url; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_seo_settings_site_url ON public.seo_settings USING btree (site_url);


--
-- Name: idx_social_posts_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_social_posts_created_at ON public.social_media_posts USING btree (created_at DESC);


--
-- Name: idx_social_posts_scheduled; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_social_posts_scheduled ON public.social_media_posts USING btree (scheduled_for) WHERE (status = 'scheduled'::text);


--
-- Name: idx_social_posts_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_social_posts_status ON public.social_media_posts USING btree (status);


--
-- Name: idx_sso_audit_logs_config_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sso_audit_logs_config_id ON public.sso_audit_logs USING btree (config_id);


--
-- Name: idx_sso_audit_logs_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sso_audit_logs_created_at ON public.sso_audit_logs USING btree (created_at DESC);


--
-- Name: idx_sso_audit_logs_event_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sso_audit_logs_event_type ON public.sso_audit_logs USING btree (event_type);


--
-- Name: idx_sso_audit_logs_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sso_audit_logs_user_id ON public.sso_audit_logs USING btree (user_id);


--
-- Name: idx_sso_login_sessions_config_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sso_login_sessions_config_id ON public.sso_login_sessions USING btree (config_id);


--
-- Name: idx_sso_login_sessions_expires_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sso_login_sessions_expires_at ON public.sso_login_sessions USING btree (expires_at);


--
-- Name: idx_sso_login_sessions_request_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sso_login_sessions_request_id ON public.sso_login_sessions USING btree (request_id);


--
-- Name: idx_sso_login_sessions_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sso_login_sessions_status ON public.sso_login_sessions USING btree (status);


--
-- Name: idx_sso_user_mappings_config_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sso_user_mappings_config_id ON public.sso_user_mappings USING btree (config_id);


--
-- Name: idx_sso_user_mappings_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sso_user_mappings_email ON public.sso_user_mappings USING btree (sso_email);


--
-- Name: idx_sso_user_mappings_subject; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sso_user_mappings_subject ON public.sso_user_mappings USING btree (sso_subject_id);


--
-- Name: idx_sso_user_mappings_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sso_user_mappings_user_id ON public.sso_user_mappings USING btree (user_id);


--
-- Name: idx_stripe_customers_stripe_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_stripe_customers_stripe_id ON public.stripe_customers USING btree (stripe_customer_id);


--
-- Name: idx_stripe_customers_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_stripe_customers_user_id ON public.stripe_customers USING btree (user_id);


--
-- Name: idx_subscriptions_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_subscriptions_status ON public.subscriptions USING btree (status);


--
-- Name: idx_subscriptions_stripe_customer_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_subscriptions_stripe_customer_id ON public.subscriptions USING btree (stripe_customer_id);


--
-- Name: idx_subscriptions_stripe_subscription_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_subscriptions_stripe_subscription_id ON public.subscriptions USING btree (stripe_subscription_id);


--
-- Name: idx_subscriptions_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_subscriptions_user_id ON public.subscriptions USING btree (user_id);


--
-- Name: idx_system_metrics_recorded_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_system_metrics_recorded_at ON public.system_metrics USING btree (recorded_at DESC);


--
-- Name: idx_system_metrics_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_system_metrics_type ON public.system_metrics USING btree (metric_type);


--
-- Name: idx_system_metrics_type_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_system_metrics_type_name ON public.system_metrics USING btree (metric_type, metric_name);


--
-- Name: idx_taxonomy_parent; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_taxonomy_parent ON public.pseo_taxonomy USING btree (parent_id);


--
-- Name: idx_taxonomy_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_taxonomy_type ON public.pseo_taxonomy USING btree (taxonomy_type);


--
-- Name: idx_team_members_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_team_members_email ON public.team_members USING btree (lower(email));


--
-- Name: idx_team_members_team; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_team_members_team ON public.team_members USING btree (team_id);


--
-- Name: idx_team_members_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_team_members_user ON public.team_members USING btree (user_id);


--
-- Name: idx_testimonials_featured; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_testimonials_featured ON public.testimonials USING btree (is_featured) WHERE (is_featured = true);


--
-- Name: idx_testimonials_published; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_testimonials_published ON public.testimonials USING btree (is_published) WHERE (is_published = true);


--
-- Name: idx_testimonials_rating; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_testimonials_rating ON public.testimonials USING btree (rating);


--
-- Name: idx_testimonials_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_testimonials_user_id ON public.testimonials USING btree (user_id);


--
-- Name: idx_unified_composite; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_unified_composite ON public.unified_search_analytics USING btree (user_id, date DESC, source_platform);


--
-- Name: idx_unified_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_unified_date ON public.unified_search_analytics USING btree (date DESC);


--
-- Name: idx_unified_page; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_unified_page ON public.unified_search_analytics USING btree (page_url);


--
-- Name: idx_unified_platform; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_unified_platform ON public.unified_search_analytics USING btree (source_platform);


--
-- Name: idx_unified_query; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_unified_query ON public.unified_search_analytics USING btree (query);


--
-- Name: idx_unified_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_unified_user_id ON public.unified_search_analytics USING btree (user_id);


--
-- Name: idx_user_activity_log_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_activity_log_created_at ON public.user_activity_log USING btree (created_at DESC);


--
-- Name: idx_user_activity_log_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_activity_log_type ON public.user_activity_log USING btree (activity_type);


--
-- Name: idx_user_activity_log_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_activity_log_user_id ON public.user_activity_log USING btree (user_id);


--
-- Name: idx_user_mfa_settings_enabled; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_mfa_settings_enabled ON public.user_mfa_settings USING btree (mfa_enabled) WHERE (mfa_enabled = true);


--
-- Name: idx_user_mfa_settings_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_mfa_settings_user_id ON public.user_mfa_settings USING btree (user_id);


--
-- Name: idx_user_sessions_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_sessions_active ON public.user_sessions USING btree (user_id, revoked, expires_at);


--
-- Name: idx_user_sessions_expires_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_sessions_expires_at ON public.user_sessions USING btree (expires_at);


--
-- Name: idx_user_sessions_ip; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_sessions_ip ON public.user_sessions USING btree (ip_address);


--
-- Name: idx_user_sessions_revoked; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_sessions_revoked ON public.user_sessions USING btree (revoked);


--
-- Name: idx_user_sessions_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_sessions_user_id ON public.user_sessions USING btree (user_id);


--
-- Name: idx_workflow_execution_queue_execution_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_workflow_execution_queue_execution_id ON public.workflow_execution_queue USING btree (execution_id);


--
-- Name: idx_workflow_execution_queue_locked; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_workflow_execution_queue_locked ON public.workflow_execution_queue USING btree (locked_at) WHERE (locked_at IS NOT NULL);


--
-- Name: idx_workflow_execution_queue_scheduled; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_workflow_execution_queue_scheduled ON public.workflow_execution_queue USING btree (scheduled_for, priority DESC) WHERE (locked_at IS NULL);


--
-- Name: idx_workflow_execution_steps_execution_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_workflow_execution_steps_execution_id ON public.workflow_execution_steps USING btree (execution_id);


--
-- Name: idx_workflow_execution_steps_node_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_workflow_execution_steps_node_id ON public.workflow_execution_steps USING btree (node_id);


--
-- Name: idx_workflow_execution_steps_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_workflow_execution_steps_status ON public.workflow_execution_steps USING btree (status);


--
-- Name: idx_workflow_executions_running; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_workflow_executions_running ON public.workflow_executions USING btree (status) WHERE (status = 'running'::text);


--
-- Name: idx_workflow_executions_started_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_workflow_executions_started_at ON public.workflow_executions USING btree (started_at DESC);


--
-- Name: idx_workflow_executions_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_workflow_executions_status ON public.workflow_executions USING btree (status);


--
-- Name: idx_workflow_executions_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_workflow_executions_user_id ON public.workflow_executions USING btree (user_id);


--
-- Name: idx_workflow_executions_workflow_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_workflow_executions_workflow_id ON public.workflow_executions USING btree (workflow_id);


--
-- Name: idx_workflow_node_templates_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_workflow_node_templates_category ON public.workflow_node_templates USING btree (category);


--
-- Name: idx_workflow_node_templates_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_workflow_node_templates_type ON public.workflow_node_templates USING btree (type);


--
-- Name: idx_workflow_templates_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_workflow_templates_category ON public.workflow_templates USING btree (category) WHERE (is_public = true);


--
-- Name: idx_workflow_templates_rating; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_workflow_templates_rating ON public.workflow_templates USING btree (rating DESC) WHERE (is_public = true);


--
-- Name: idx_workflow_triggers_schedule; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_workflow_triggers_schedule ON public.workflow_triggers USING btree (next_run_at) WHERE ((trigger_type = 'schedule'::text) AND (is_active = true));


--
-- Name: idx_workflow_triggers_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_workflow_triggers_type ON public.workflow_triggers USING btree (trigger_type) WHERE (is_active = true);


--
-- Name: idx_workflow_triggers_workflow_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_workflow_triggers_workflow_id ON public.workflow_triggers USING btree (workflow_id);


--
-- Name: idx_workflow_versions_workflow_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_workflow_versions_workflow_id ON public.workflow_versions USING btree (workflow_id);


--
-- Name: idx_workflows_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_workflows_active ON public.workflows USING btree (is_active) WHERE (is_active = true);


--
-- Name: idx_workflows_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_workflows_category ON public.workflows USING btree (category);


--
-- Name: idx_workflows_published; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_workflows_published ON public.workflows USING btree (is_published) WHERE (is_published = true);


--
-- Name: idx_workflows_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_workflows_user_id ON public.workflows USING btree (user_id);


--
-- Name: idx_yandex_oauth_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_yandex_oauth_active ON public.yandex_webmaster_oauth_credentials USING btree (is_active) WHERE (is_active = true);


--
-- Name: idx_yandex_oauth_expires_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_yandex_oauth_expires_at ON public.yandex_webmaster_oauth_credentials USING btree (expires_at);


--
-- Name: idx_yandex_oauth_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_yandex_oauth_user_id ON public.yandex_webmaster_oauth_credentials USING btree (user_id);


--
-- Name: idx_yandex_search_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_yandex_search_date ON public.yandex_webmaster_search_data USING btree (date DESC);


--
-- Name: idx_yandex_search_page; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_yandex_search_page ON public.yandex_webmaster_search_data USING btree (page_url);


--
-- Name: idx_yandex_search_query; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_yandex_search_query ON public.yandex_webmaster_search_data USING btree (query);


--
-- Name: idx_yandex_search_site_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_yandex_search_site_id ON public.yandex_webmaster_search_data USING btree (site_id);


--
-- Name: idx_yandex_sites_host_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_yandex_sites_host_id ON public.yandex_webmaster_sites USING btree (host_id);


--
-- Name: idx_yandex_sites_sync_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_yandex_sites_sync_status ON public.yandex_webmaster_sites USING btree (sync_status);


--
-- Name: idx_yandex_sites_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_yandex_sites_user_id ON public.yandex_webmaster_sites USING btree (user_id);


--
-- Name: leads audit_leads_changes; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_leads_changes AFTER INSERT OR DELETE OR UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.audit_table_change();


--
-- Name: listings audit_listings_changes; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_listings_changes AFTER INSERT OR DELETE OR UPDATE ON public.listings FOR EACH ROW EXECUTE FUNCTION public.audit_table_change();


--
-- Name: profiles audit_profiles_changes; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_profiles_changes AFTER INSERT OR DELETE OR UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.audit_table_change();


--
-- Name: instagram_bio_email_sequences check_bio_sequence_complete; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER check_bio_sequence_complete AFTER UPDATE OF sent_at ON public.instagram_bio_email_sequences FOR EACH ROW WHEN (((new.sent_at IS NOT NULL) AND (old.sent_at IS NULL))) EXECUTE FUNCTION public.check_bio_email_sequence_complete();


--
-- Name: custom_pages ensure_single_active_page_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER ensure_single_active_page_trigger BEFORE INSERT OR UPDATE ON public.custom_pages FOR EACH ROW EXECUTE FUNCTION public.ensure_single_active_page();


--
-- Name: ab_test_results extract_ab_test_metrics_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER extract_ab_test_metrics_trigger BEFORE INSERT OR UPDATE ON public.ab_test_results FOR EACH ROW EXECUTE FUNCTION public.extract_ab_test_metrics();


--
-- Name: instagram_bio_email_captures init_bio_email_sequence; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER init_bio_email_sequence AFTER INSERT ON public.instagram_bio_email_captures FOR EACH ROW WHEN ((new.email_sequence_started = true)) EXECUTE FUNCTION public.initialize_bio_email_sequence();


--
-- Name: leads on_lead_created; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER on_lead_created AFTER INSERT ON public.leads FOR EACH ROW EXECUTE FUNCTION public.auto_log_lead_creation();


--
-- Name: leads on_lead_increment_profile_count; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER on_lead_increment_profile_count AFTER INSERT ON public.leads FOR EACH ROW EXECUTE FUNCTION public.update_profile_lead_count();


--
-- Name: leads on_lead_status_change; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER on_lead_status_change AFTER UPDATE OF status ON public.leads FOR EACH ROW EXECUTE FUNCTION public.auto_log_lead_status_change();


--
-- Name: profiles on_user_subscription_created; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER on_user_subscription_created AFTER INSERT ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.create_default_subscription();


--
-- Name: pseo_pages pseo_pages_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER pseo_pages_updated_at BEFORE UPDATE ON public.pseo_pages FOR EACH ROW EXECUTE FUNCTION public.update_pseo_updated_at();


--
-- Name: custom_pages set_custom_page_published_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_custom_page_published_at BEFORE UPDATE ON public.custom_pages FOR EACH ROW EXECUTE FUNCTION public.set_published_at();


--
-- Name: links track_links_usage; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER track_links_usage AFTER INSERT ON public.links FOR EACH ROW EXECUTE FUNCTION public.update_usage_count('links');


--
-- Name: listings track_listings_usage; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER track_listings_usage AFTER INSERT ON public.listings FOR EACH ROW EXECUTE FUNCTION public.update_usage_count('listings');


--
-- Name: testimonials track_testimonials_usage; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER track_testimonials_usage AFTER INSERT ON public.testimonials FOR EACH ROW EXECUTE FUNCTION public.update_usage_count('testimonials');


--
-- Name: leads trg_auto_assign_lead; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_auto_assign_lead BEFORE INSERT ON public.leads FOR EACH ROW EXECUTE FUNCTION public.auto_assign_lead();


--
-- Name: leads trg_lead_first_responded_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_lead_first_responded_at BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.set_lead_first_responded_at();


--
-- Name: leads trg_notify_lead_on_insert; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_notify_lead_on_insert AFTER INSERT ON public.leads FOR EACH ROW EXECUTE FUNCTION public.notify_lead_on_insert();


--
-- Name: leads trg_notify_new_lead; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_notify_new_lead AFTER INSERT ON public.leads FOR EACH ROW EXECUTE FUNCTION public.notify_new_lead();


--
-- Name: invoices trg_set_invoice_user_id; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_set_invoice_user_id BEFORE INSERT OR UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.set_invoice_user_id();


--
-- Name: listing_email_sequences trigger_check_listing_sequence_complete; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_check_listing_sequence_complete AFTER UPDATE OF sent_at ON public.listing_email_sequences FOR EACH ROW WHEN (((new.sent_at IS NOT NULL) AND (old.sent_at IS NULL))) EXECUTE FUNCTION public.check_listing_sequence_complete();


--
-- Name: listing_email_captures trigger_init_listing_email_sequence; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_init_listing_email_sequence AFTER INSERT ON public.listing_email_captures FOR EACH ROW EXECUTE FUNCTION public.init_listing_email_sequence();


--
-- Name: encrypted_pii_config trigger_update_encrypted_pii_config_timestamp; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_encrypted_pii_config_timestamp BEFORE UPDATE ON public.encrypted_pii_config FOR EACH ROW EXECUTE FUNCTION public.update_encrypted_pii_config_timestamp();


--
-- Name: articles trigger_update_keyword_usage; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_keyword_usage AFTER INSERT OR UPDATE OF status ON public.articles FOR EACH ROW WHEN ((new.status = 'published'::text)) EXECUTE FUNCTION public.update_keyword_usage();


--
-- Name: ai_configuration update_ai_configuration_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_ai_configuration_updated_at BEFORE UPDATE ON public.ai_configuration FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: ai_models update_ai_models_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_ai_models_updated_at BEFORE UPDATE ON public.ai_models FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: article_comments update_article_comments_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_article_comments_updated_at BEFORE UPDATE ON public.article_comments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: article_webhooks update_article_webhooks_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_article_webhooks_updated_at BEFORE UPDATE ON public.article_webhooks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: articles update_articles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_articles_updated_at BEFORE UPDATE ON public.articles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: bing_webmaster_oauth_credentials update_bing_oauth_credentials_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_bing_oauth_credentials_updated_at BEFORE UPDATE ON public.bing_webmaster_oauth_credentials FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: bing_webmaster_sites update_bing_sites_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_bing_sites_updated_at BEFORE UPDATE ON public.bing_webmaster_sites FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: instagram_bio_analyses update_bio_analyses_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_bio_analyses_updated_at BEFORE UPDATE ON public.instagram_bio_analyses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: content_suggestions update_content_suggestions_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_content_suggestions_updated_at BEFORE UPDATE ON public.content_suggestions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: custom_pages update_custom_pages_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_custom_pages_updated_at BEFORE UPDATE ON public.custom_pages FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: search_dashboard_config update_dashboard_config_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_dashboard_config_updated_at BEFORE UPDATE ON public.search_dashboard_config FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: enterprise_sso_config update_enterprise_sso_config_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_enterprise_sso_config_updated_at BEFORE UPDATE ON public.enterprise_sso_config FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: feature_flags update_feature_flags_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_feature_flags_updated_at BEFORE UPDATE ON public.feature_flags FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: feature_usage update_feature_usage_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_feature_usage_updated_at BEFORE UPDATE ON public.feature_usage FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: ga4_oauth_credentials update_ga4_oauth_credentials_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_ga4_oauth_credentials_updated_at BEFORE UPDATE ON public.ga4_oauth_credentials FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: ga4_properties update_ga4_properties_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_ga4_properties_updated_at BEFORE UPDATE ON public.ga4_properties FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: gdpr_data_requests update_gdpr_data_requests_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_gdpr_data_requests_updated_at BEFORE UPDATE ON public.gdpr_data_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: gsc_oauth_credentials update_gsc_oauth_credentials_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_gsc_oauth_credentials_updated_at BEFORE UPDATE ON public.gsc_oauth_credentials FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: gsc_properties update_gsc_properties_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_gsc_properties_updated_at BEFORE UPDATE ON public.gsc_properties FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: lead_activities update_lead_activities_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_lead_activities_updated_at BEFORE UPDATE ON public.lead_activities FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: leads update_leads_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: links update_links_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_links_updated_at BEFORE UPDATE ON public.links FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: listing_descriptions update_listing_descriptions_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_listing_descriptions_updated_at BEFORE UPDATE ON public.listing_descriptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: listings update_listings_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_listings_updated_at BEFORE UPDATE ON public.listings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: ml_model_weights update_ml_model_weights_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_ml_model_weights_updated_at BEFORE UPDATE ON public.ml_model_weights FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: seo_alert_rules update_seo_alert_rules_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_seo_alert_rules_updated_at BEFORE UPDATE ON public.seo_alert_rules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: seo_alerts update_seo_alerts_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_seo_alerts_updated_at BEFORE UPDATE ON public.seo_alerts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: seo_audit_schedules update_seo_audit_schedules_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_seo_audit_schedules_updated_at BEFORE UPDATE ON public.seo_audit_schedules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: seo_autofix_rules update_seo_autofix_rules_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_seo_autofix_rules_updated_at BEFORE UPDATE ON public.seo_autofix_rules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: seo_performance_budget update_seo_budget_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_seo_budget_updated_at BEFORE UPDATE ON public.seo_performance_budget FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: seo_competitor_tracking update_seo_competitor_tracking_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_seo_competitor_tracking_updated_at BEFORE UPDATE ON public.seo_competitor_tracking FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: seo_competitor_analysis update_seo_competitor_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_seo_competitor_updated_at BEFORE UPDATE ON public.seo_competitor_analysis FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: seo_content_optimization update_seo_content_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_seo_content_updated_at BEFORE UPDATE ON public.seo_content_optimization FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: seo_duplicate_content update_seo_duplicate_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_seo_duplicate_updated_at BEFORE UPDATE ON public.seo_duplicate_content FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: seo_fixes_applied update_seo_fixes_applied_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_seo_fixes_applied_updated_at BEFORE UPDATE ON public.seo_fixes_applied FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: seo_keywords update_seo_keywords_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_seo_keywords_updated_at BEFORE UPDATE ON public.seo_keywords FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: seo_notification_preferences update_seo_notif_pref_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_seo_notif_pref_updated_at BEFORE UPDATE ON public.seo_notification_preferences FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: seo_page_scores update_seo_page_scores_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_seo_page_scores_updated_at BEFORE UPDATE ON public.seo_page_scores FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: seo_redirect_analysis update_seo_redirect_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_seo_redirect_updated_at BEFORE UPDATE ON public.seo_redirect_analysis FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: seo_scheduled_reports update_seo_scheduled_reports_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_seo_scheduled_reports_updated_at BEFORE UPDATE ON public.seo_scheduled_reports FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: seo_monitoring_schedules update_seo_schedules_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_seo_schedules_updated_at BEFORE UPDATE ON public.seo_monitoring_schedules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: seo_semantic_analysis update_seo_semantic_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_seo_semantic_updated_at BEFORE UPDATE ON public.seo_semantic_analysis FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: seo_settings update_seo_settings_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_seo_settings_updated_at BEFORE UPDATE ON public.seo_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: social_media_webhooks update_social_webhooks_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_social_webhooks_updated_at BEFORE UPDATE ON public.social_media_webhooks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: sso_user_mappings update_sso_user_mappings_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_sso_user_mappings_updated_at BEFORE UPDATE ON public.sso_user_mappings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: subscriptions update_subscriptions_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: testimonials update_testimonials_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_testimonials_updated_at BEFORE UPDATE ON public.testimonials FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: unified_search_analytics update_unified_analytics_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_unified_analytics_updated_at BEFORE UPDATE ON public.unified_search_analytics FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: user_mfa_settings update_user_mfa_settings_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_user_mfa_settings_updated_at BEFORE UPDATE ON public.user_mfa_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: user_settings update_user_settings_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON public.user_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: workflow_triggers update_workflow_triggers_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_workflow_triggers_updated_at BEFORE UPDATE ON public.workflow_triggers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: workflows update_workflows_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_workflows_updated_at BEFORE UPDATE ON public.workflows FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: yandex_webmaster_oauth_credentials update_yandex_oauth_credentials_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_yandex_oauth_credentials_updated_at BEFORE UPDATE ON public.yandex_webmaster_oauth_credentials FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: yandex_webmaster_sites update_yandex_sites_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_yandex_sites_updated_at BEFORE UPDATE ON public.yandex_webmaster_sites FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: ab_test_results ab_test_results_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ab_test_results
    ADD CONSTRAINT ab_test_results_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: account_deletion_scheduled account_deletion_scheduled_gdpr_request_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.account_deletion_scheduled
    ADD CONSTRAINT account_deletion_scheduled_gdpr_request_id_fkey FOREIGN KEY (gdpr_request_id) REFERENCES public.gdpr_data_requests(id);


--
-- Name: account_deletion_scheduled account_deletion_scheduled_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.account_deletion_scheduled
    ADD CONSTRAINT account_deletion_scheduled_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: admin_audit_log admin_audit_log_admin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_audit_log
    ADD CONSTRAINT admin_audit_log_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES auth.users(id);


--
-- Name: ai_configuration ai_configuration_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_configuration
    ADD CONSTRAINT ai_configuration_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id);


--
-- Name: api_keys api_keys_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.api_keys
    ADD CONSTRAINT api_keys_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: article_comments article_comments_article_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.article_comments
    ADD CONSTRAINT article_comments_article_id_fkey FOREIGN KEY (article_id) REFERENCES public.articles(id) ON DELETE CASCADE;


--
-- Name: article_comments article_comments_parent_comment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.article_comments
    ADD CONSTRAINT article_comments_parent_comment_id_fkey FOREIGN KEY (parent_comment_id) REFERENCES public.article_comments(id);


--
-- Name: article_comments article_comments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.article_comments
    ADD CONSTRAINT article_comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: articles articles_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.articles
    ADD CONSTRAINT articles_author_id_fkey FOREIGN KEY (author_id) REFERENCES auth.users(id);


--
-- Name: articles articles_generated_from_suggestion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.articles
    ADD CONSTRAINT articles_generated_from_suggestion_id_fkey FOREIGN KEY (generated_from_suggestion_id) REFERENCES public.content_suggestions(id);


--
-- Name: articles articles_keyword_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.articles
    ADD CONSTRAINT articles_keyword_id_fkey FOREIGN KEY (keyword_id) REFERENCES public.keywords(id) ON DELETE SET NULL;


--
-- Name: audit_logs audit_logs_actor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: audit_logs audit_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: bing_webmaster_oauth_credentials bing_webmaster_oauth_credentials_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bing_webmaster_oauth_credentials
    ADD CONSTRAINT bing_webmaster_oauth_credentials_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: bing_webmaster_search_data bing_webmaster_search_data_site_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bing_webmaster_search_data
    ADD CONSTRAINT bing_webmaster_search_data_site_id_fkey FOREIGN KEY (site_id) REFERENCES public.bing_webmaster_sites(id) ON DELETE CASCADE;


--
-- Name: bing_webmaster_sites bing_webmaster_sites_credential_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bing_webmaster_sites
    ADD CONSTRAINT bing_webmaster_sites_credential_id_fkey FOREIGN KEY (credential_id) REFERENCES public.bing_webmaster_oauth_credentials(id) ON DELETE CASCADE;


--
-- Name: bing_webmaster_sites bing_webmaster_sites_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bing_webmaster_sites
    ADD CONSTRAINT bing_webmaster_sites_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: content_suggestions content_suggestions_generated_article_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_suggestions
    ADD CONSTRAINT content_suggestions_generated_article_id_fkey FOREIGN KEY (generated_article_id) REFERENCES public.articles(id) ON DELETE SET NULL;


--
-- Name: content_suggestions content_suggestions_suggested_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_suggestions
    ADD CONSTRAINT content_suggestions_suggested_by_fkey FOREIGN KEY (suggested_by) REFERENCES auth.users(id);


--
-- Name: custom_pages custom_pages_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.custom_pages
    ADD CONSTRAINT custom_pages_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: encryption_key_metadata encryption_key_metadata_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.encryption_key_metadata
    ADD CONSTRAINT encryption_key_metadata_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: enterprise_sso_config enterprise_sso_config_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.enterprise_sso_config
    ADD CONSTRAINT enterprise_sso_config_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: error_logs error_logs_resolved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.error_logs
    ADD CONSTRAINT error_logs_resolved_by_fkey FOREIGN KEY (resolved_by) REFERENCES auth.users(id);


--
-- Name: error_logs error_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.error_logs
    ADD CONSTRAINT error_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: feature_usage feature_usage_feature_key_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feature_usage
    ADD CONSTRAINT feature_usage_feature_key_fkey FOREIGN KEY (feature_key) REFERENCES public.feature_catalog(feature_key);


--
-- Name: feature_usage feature_usage_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feature_usage
    ADD CONSTRAINT feature_usage_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: ga4_oauth_credentials ga4_oauth_credentials_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ga4_oauth_credentials
    ADD CONSTRAINT ga4_oauth_credentials_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: ga4_properties ga4_properties_credential_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ga4_properties
    ADD CONSTRAINT ga4_properties_credential_id_fkey FOREIGN KEY (credential_id) REFERENCES public.ga4_oauth_credentials(id) ON DELETE CASCADE;


--
-- Name: ga4_properties ga4_properties_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ga4_properties
    ADD CONSTRAINT ga4_properties_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: ga4_traffic_data ga4_traffic_data_property_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ga4_traffic_data
    ADD CONSTRAINT ga4_traffic_data_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.ga4_properties(id) ON DELETE CASCADE;


--
-- Name: gdpr_data_requests gdpr_data_requests_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gdpr_data_requests
    ADD CONSTRAINT gdpr_data_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: gsc_keyword_performance gsc_keyword_performance_property_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gsc_keyword_performance
    ADD CONSTRAINT gsc_keyword_performance_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.gsc_properties(id) ON DELETE CASCADE;


--
-- Name: gsc_oauth_credentials gsc_oauth_credentials_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gsc_oauth_credentials
    ADD CONSTRAINT gsc_oauth_credentials_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: gsc_page_performance gsc_page_performance_property_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gsc_page_performance
    ADD CONSTRAINT gsc_page_performance_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.gsc_properties(id) ON DELETE CASCADE;


--
-- Name: gsc_properties gsc_properties_credential_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gsc_properties
    ADD CONSTRAINT gsc_properties_credential_id_fkey FOREIGN KEY (credential_id) REFERENCES public.gsc_oauth_credentials(id) ON DELETE CASCADE;


--
-- Name: gsc_properties gsc_properties_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gsc_properties
    ADD CONSTRAINT gsc_properties_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: instagram_bio_analytics instagram_bio_analytics_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.instagram_bio_analytics
    ADD CONSTRAINT instagram_bio_analytics_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: instagram_bio_email_captures instagram_bio_email_captures_analysis_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.instagram_bio_email_captures
    ADD CONSTRAINT instagram_bio_email_captures_analysis_id_fkey FOREIGN KEY (analysis_id) REFERENCES public.instagram_bio_analyses(id) ON DELETE SET NULL;


--
-- Name: instagram_bio_email_sequences instagram_bio_email_sequences_email_capture_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.instagram_bio_email_sequences
    ADD CONSTRAINT instagram_bio_email_sequences_email_capture_id_fkey FOREIGN KEY (email_capture_id) REFERENCES public.instagram_bio_email_captures(id) ON DELETE CASCADE;


--
-- Name: invoices invoices_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: lead_activities lead_activities_lead_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lead_activities
    ADD CONSTRAINT lead_activities_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE CASCADE;


--
-- Name: lead_activities lead_activities_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lead_activities
    ADD CONSTRAINT lead_activities_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: lead_notes lead_notes_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lead_notes
    ADD CONSTRAINT lead_notes_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: lead_notes lead_notes_lead_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lead_notes
    ADD CONSTRAINT lead_notes_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE CASCADE;


--
-- Name: lead_routing_rules lead_routing_rules_assigned_to_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lead_routing_rules
    ADD CONSTRAINT lead_routing_rules_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: lead_routing_rules lead_routing_rules_team_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lead_routing_rules
    ADD CONSTRAINT lead_routing_rules_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE CASCADE;


--
-- Name: lead_scores lead_scores_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lead_scores
    ADD CONSTRAINT lead_scores_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: leads leads_assigned_to_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: leads leads_listing_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_listing_id_fkey FOREIGN KEY (listing_id) REFERENCES public.listings(id) ON DELETE SET NULL;


--
-- Name: links links_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.links
    ADD CONSTRAINT links_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: listing_descriptions listing_descriptions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.listing_descriptions
    ADD CONSTRAINT listing_descriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: listing_email_captures listing_email_captures_listing_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.listing_email_captures
    ADD CONSTRAINT listing_email_captures_listing_id_fkey FOREIGN KEY (listing_id) REFERENCES public.listing_descriptions(id) ON DELETE SET NULL;


--
-- Name: listing_email_sequences listing_email_sequences_email_capture_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.listing_email_sequences
    ADD CONSTRAINT listing_email_sequences_email_capture_id_fkey FOREIGN KEY (email_capture_id) REFERENCES public.listing_email_captures(id) ON DELETE CASCADE;


--
-- Name: listing_generator_analytics listing_generator_analytics_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.listing_generator_analytics
    ADD CONSTRAINT listing_generator_analytics_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: login_attempts login_attempts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.login_attempts
    ADD CONSTRAINT login_attempts_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: mfa_temp_codes mfa_temp_codes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mfa_temp_codes
    ADD CONSTRAINT mfa_temp_codes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: mfa_trusted_devices mfa_trusted_devices_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mfa_trusted_devices
    ADD CONSTRAINT mfa_trusted_devices_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: mfa_verification_logs mfa_verification_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mfa_verification_logs
    ADD CONSTRAINT mfa_verification_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: ml_model_weights ml_model_weights_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ml_model_weights
    ADD CONSTRAINT ml_model_weights_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: ml_training_examples ml_training_examples_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ml_training_examples
    ADD CONSTRAINT ml_training_examples_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: monthly_usage_summary monthly_usage_summary_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.monthly_usage_summary
    ADD CONSTRAINT monthly_usage_summary_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: mortgage_calculations mortgage_calculations_lead_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mortgage_calculations
    ADD CONSTRAINT mortgage_calculations_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE SET NULL;


--
-- Name: mortgage_calculations mortgage_calculations_listing_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mortgage_calculations
    ADD CONSTRAINT mortgage_calculations_listing_id_fkey FOREIGN KEY (listing_id) REFERENCES public.listings(id) ON DELETE SET NULL;


--
-- Name: mortgage_calculations mortgage_calculations_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mortgage_calculations
    ADD CONSTRAINT mortgage_calculations_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: pii_encryption_audit pii_encryption_audit_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pii_encryption_audit
    ADD CONSTRAINT pii_encryption_audit_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: pseo_taxonomy pseo_taxonomy_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pseo_taxonomy
    ADD CONSTRAINT pseo_taxonomy_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.pseo_taxonomy(id);


--
-- Name: search_dashboard_config search_dashboard_config_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.search_dashboard_config
    ADD CONSTRAINT search_dashboard_config_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: seo_alerts seo_alerts_alert_rule_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seo_alerts
    ADD CONSTRAINT seo_alerts_alert_rule_id_fkey FOREIGN KEY (alert_rule_id) REFERENCES public.seo_alert_rules(id) ON DELETE SET NULL;


--
-- Name: seo_alerts seo_alerts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seo_alerts
    ADD CONSTRAINT seo_alerts_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: seo_audit_history seo_audit_history_performed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seo_audit_history
    ADD CONSTRAINT seo_audit_history_performed_by_fkey FOREIGN KEY (performed_by) REFERENCES auth.users(id);


--
-- Name: seo_audit_schedules seo_audit_schedules_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seo_audit_schedules
    ADD CONSTRAINT seo_audit_schedules_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: seo_autofix_history seo_autofix_history_applied_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seo_autofix_history
    ADD CONSTRAINT seo_autofix_history_applied_by_fkey FOREIGN KEY (applied_by) REFERENCES auth.users(id);


--
-- Name: seo_autofix_history seo_autofix_history_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seo_autofix_history
    ADD CONSTRAINT seo_autofix_history_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES auth.users(id);


--
-- Name: seo_autofix_history seo_autofix_history_rule_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seo_autofix_history
    ADD CONSTRAINT seo_autofix_history_rule_id_fkey FOREIGN KEY (rule_id) REFERENCES public.seo_autofix_rules(id) ON DELETE SET NULL;


--
-- Name: seo_autofix_rules seo_autofix_rules_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seo_autofix_rules
    ADD CONSTRAINT seo_autofix_rules_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: seo_competitor_analysis seo_competitor_analysis_analyzed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seo_competitor_analysis
    ADD CONSTRAINT seo_competitor_analysis_analyzed_by_fkey FOREIGN KEY (analyzed_by) REFERENCES auth.users(id);


--
-- Name: seo_competitor_tracking seo_competitor_tracking_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seo_competitor_tracking
    ADD CONSTRAINT seo_competitor_tracking_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: seo_content_optimization seo_content_optimization_analyzed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seo_content_optimization
    ADD CONSTRAINT seo_content_optimization_analyzed_by_fkey FOREIGN KEY (analyzed_by) REFERENCES auth.users(id);


--
-- Name: seo_duplicate_content seo_duplicate_content_resolved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seo_duplicate_content
    ADD CONSTRAINT seo_duplicate_content_resolved_by_fkey FOREIGN KEY (resolved_by) REFERENCES auth.users(id);


--
-- Name: seo_fixes_applied seo_fixes_applied_applied_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seo_fixes_applied
    ADD CONSTRAINT seo_fixes_applied_applied_by_fkey FOREIGN KEY (applied_by) REFERENCES auth.users(id);


--
-- Name: seo_fixes_applied seo_fixes_applied_audit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seo_fixes_applied
    ADD CONSTRAINT seo_fixes_applied_audit_id_fkey FOREIGN KEY (audit_id) REFERENCES public.seo_audit_history(id) ON DELETE CASCADE;


--
-- Name: seo_keyword_history seo_keyword_history_keyword_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seo_keyword_history
    ADD CONSTRAINT seo_keyword_history_keyword_id_fkey FOREIGN KEY (keyword_id) REFERENCES public.seo_keywords(id) ON DELETE CASCADE;


--
-- Name: seo_keywords seo_keywords_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seo_keywords
    ADD CONSTRAINT seo_keywords_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: seo_keywords seo_keywords_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seo_keywords
    ADD CONSTRAINT seo_keywords_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: seo_monitoring_log seo_monitoring_log_schedule_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seo_monitoring_log
    ADD CONSTRAINT seo_monitoring_log_schedule_id_fkey FOREIGN KEY (schedule_id) REFERENCES public.seo_monitoring_schedules(id) ON DELETE CASCADE;


--
-- Name: seo_monitoring_schedules seo_monitoring_schedules_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seo_monitoring_schedules
    ADD CONSTRAINT seo_monitoring_schedules_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: seo_notification_preferences seo_notification_preferences_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seo_notification_preferences
    ADD CONSTRAINT seo_notification_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: seo_performance_budget seo_performance_budget_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seo_performance_budget
    ADD CONSTRAINT seo_performance_budget_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: seo_report_history seo_report_history_schedule_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seo_report_history
    ADD CONSTRAINT seo_report_history_schedule_id_fkey FOREIGN KEY (schedule_id) REFERENCES public.seo_scheduled_reports(id) ON DELETE SET NULL;


--
-- Name: seo_scheduled_reports seo_scheduled_reports_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seo_scheduled_reports
    ADD CONSTRAINT seo_scheduled_reports_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: seo_semantic_analysis seo_semantic_analysis_analyzed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seo_semantic_analysis
    ADD CONSTRAINT seo_semantic_analysis_analyzed_by_fkey FOREIGN KEY (analyzed_by) REFERENCES auth.users(id);


--
-- Name: seo_settings seo_settings_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seo_settings
    ADD CONSTRAINT seo_settings_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id);


--
-- Name: social_media_posts social_media_posts_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.social_media_posts
    ADD CONSTRAINT social_media_posts_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: social_media_posts social_media_posts_listing_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.social_media_posts
    ADD CONSTRAINT social_media_posts_listing_id_fkey FOREIGN KEY (listing_id) REFERENCES public.listings(id);


--
-- Name: sso_audit_logs sso_audit_logs_config_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sso_audit_logs
    ADD CONSTRAINT sso_audit_logs_config_id_fkey FOREIGN KEY (config_id) REFERENCES public.enterprise_sso_config(id) ON DELETE SET NULL;


--
-- Name: sso_audit_logs sso_audit_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sso_audit_logs
    ADD CONSTRAINT sso_audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: sso_login_sessions sso_login_sessions_config_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sso_login_sessions
    ADD CONSTRAINT sso_login_sessions_config_id_fkey FOREIGN KEY (config_id) REFERENCES public.enterprise_sso_config(id) ON DELETE CASCADE;


--
-- Name: sso_login_sessions sso_login_sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sso_login_sessions
    ADD CONSTRAINT sso_login_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: sso_user_mappings sso_user_mappings_config_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sso_user_mappings
    ADD CONSTRAINT sso_user_mappings_config_id_fkey FOREIGN KEY (config_id) REFERENCES public.enterprise_sso_config(id) ON DELETE CASCADE;


--
-- Name: sso_user_mappings sso_user_mappings_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sso_user_mappings
    ADD CONSTRAINT sso_user_mappings_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: stripe_customers stripe_customers_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stripe_customers
    ADD CONSTRAINT stripe_customers_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: stripe_usage_records stripe_usage_records_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stripe_usage_records
    ADD CONSTRAINT stripe_usage_records_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: subscriptions subscriptions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: team_members team_members_team_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_members
    ADD CONSTRAINT team_members_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE CASCADE;


--
-- Name: team_members team_members_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_members
    ADD CONSTRAINT team_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: team_round_robin team_round_robin_team_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_round_robin
    ADD CONSTRAINT team_round_robin_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE CASCADE;


--
-- Name: teams teams_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teams
    ADD CONSTRAINT teams_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: testimonials testimonials_listing_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.testimonials
    ADD CONSTRAINT testimonials_listing_id_fkey FOREIGN KEY (listing_id) REFERENCES public.listings(id) ON DELETE SET NULL;


--
-- Name: unified_search_analytics unified_search_analytics_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.unified_search_analytics
    ADD CONSTRAINT unified_search_analytics_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: usage_tracking usage_tracking_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usage_tracking
    ADD CONSTRAINT usage_tracking_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_activity_log user_activity_log_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_activity_log
    ADD CONSTRAINT user_activity_log_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: user_mfa_settings user_mfa_settings_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_mfa_settings
    ADD CONSTRAINT user_mfa_settings_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_sessions user_sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_subscriptions user_subscriptions_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_subscriptions
    ADD CONSTRAINT user_subscriptions_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.subscription_plans(id);


--
-- Name: user_subscriptions user_subscriptions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_subscriptions
    ADD CONSTRAINT user_subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: workflow_execution_queue workflow_execution_queue_execution_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workflow_execution_queue
    ADD CONSTRAINT workflow_execution_queue_execution_id_fkey FOREIGN KEY (execution_id) REFERENCES public.workflow_executions(id) ON DELETE CASCADE;


--
-- Name: workflow_execution_steps workflow_execution_steps_execution_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workflow_execution_steps
    ADD CONSTRAINT workflow_execution_steps_execution_id_fkey FOREIGN KEY (execution_id) REFERENCES public.workflow_executions(id) ON DELETE CASCADE;


--
-- Name: workflow_executions workflow_executions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workflow_executions
    ADD CONSTRAINT workflow_executions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: workflow_executions workflow_executions_workflow_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workflow_executions
    ADD CONSTRAINT workflow_executions_workflow_id_fkey FOREIGN KEY (workflow_id) REFERENCES public.workflows(id) ON DELETE CASCADE;


--
-- Name: workflow_templates workflow_templates_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workflow_templates
    ADD CONSTRAINT workflow_templates_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: workflow_triggers workflow_triggers_workflow_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workflow_triggers
    ADD CONSTRAINT workflow_triggers_workflow_id_fkey FOREIGN KEY (workflow_id) REFERENCES public.workflows(id) ON DELETE CASCADE;


--
-- Name: workflow_versions workflow_versions_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workflow_versions
    ADD CONSTRAINT workflow_versions_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: workflow_versions workflow_versions_workflow_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workflow_versions
    ADD CONSTRAINT workflow_versions_workflow_id_fkey FOREIGN KEY (workflow_id) REFERENCES public.workflows(id) ON DELETE CASCADE;


--
-- Name: workflows workflows_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workflows
    ADD CONSTRAINT workflows_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: yandex_webmaster_oauth_credentials yandex_webmaster_oauth_credentials_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.yandex_webmaster_oauth_credentials
    ADD CONSTRAINT yandex_webmaster_oauth_credentials_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: yandex_webmaster_search_data yandex_webmaster_search_data_site_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.yandex_webmaster_search_data
    ADD CONSTRAINT yandex_webmaster_search_data_site_id_fkey FOREIGN KEY (site_id) REFERENCES public.yandex_webmaster_sites(id) ON DELETE CASCADE;


--
-- Name: yandex_webmaster_sites yandex_webmaster_sites_credential_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.yandex_webmaster_sites
    ADD CONSTRAINT yandex_webmaster_sites_credential_id_fkey FOREIGN KEY (credential_id) REFERENCES public.yandex_webmaster_oauth_credentials(id) ON DELETE CASCADE;


--
-- Name: yandex_webmaster_sites yandex_webmaster_sites_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.yandex_webmaster_sites
    ADD CONSTRAINT yandex_webmaster_sites_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: pseo_prompts Admin access prompts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin access prompts" ON public.pseo_prompts USING ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'admin'::public.app_role)))));


--
-- Name: pseo_pages Admin full access pseo pages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin full access pseo pages" ON public.pseo_pages USING ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'admin'::public.app_role)))));


--
-- Name: pseo_combination_queue Admin full access pseo queue; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin full access pseo queue" ON public.pseo_combination_queue USING ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'admin'::public.app_role)))));


--
-- Name: pseo_taxonomy Admin full access taxonomy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin full access taxonomy" ON public.pseo_taxonomy USING ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'admin'::public.app_role)))));


--
-- Name: admin_audit_log Admin full access to admin_audit_log; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin full access to admin_audit_log" ON public.admin_audit_log USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: error_logs Admin full access to error_logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin full access to error_logs" ON public.error_logs USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: seo_audit_schedules Admin full access to seo_audit_schedules; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin full access to seo_audit_schedules" ON public.seo_audit_schedules USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: seo_autofix_history Admin full access to seo_autofix_history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin full access to seo_autofix_history" ON public.seo_autofix_history USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: seo_autofix_rules Admin full access to seo_autofix_rules; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin full access to seo_autofix_rules" ON public.seo_autofix_rules USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: seo_automation_logs Admin full access to seo_automation_logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin full access to seo_automation_logs" ON public.seo_automation_logs USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: seo_competitor_tracking Admin full access to seo_competitor_tracking; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin full access to seo_competitor_tracking" ON public.seo_competitor_tracking USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: seo_notification_queue Admin full access to seo_notification_queue; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin full access to seo_notification_queue" ON public.seo_notification_queue USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: seo_report_history Admin full access to seo_report_history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin full access to seo_report_history" ON public.seo_report_history USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: seo_scheduled_reports Admin full access to seo_scheduled_reports; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin full access to seo_scheduled_reports" ON public.seo_scheduled_reports USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: system_metrics Admin full access to system_metrics; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin full access to system_metrics" ON public.system_metrics USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_activity_log Admin insert user activity; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin insert user activity" ON public.user_activity_log FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_activity_log Admin or own user activity; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin or own user activity" ON public.user_activity_log FOR SELECT USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR (user_id = auth.uid())));


--
-- Name: pseo_generation_errors Admin read errors; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin read errors" ON public.pseo_generation_errors USING ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'admin'::public.app_role)))));


--
-- Name: ai_configuration Admins can manage AI configuration; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage AI configuration" ON public.ai_configuration USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: ai_models Admins can manage AI models; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage AI models" ON public.ai_models USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: seo_fixes_applied Admins can manage SEO fixes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage SEO fixes" ON public.seo_fixes_applied USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: seo_keywords Admins can manage SEO keywords; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage SEO keywords" ON public.seo_keywords USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: seo_settings Admins can manage SEO settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage SEO settings" ON public.seo_settings USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: enterprise_sso_config Admins can manage SSO configs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage SSO configs" ON public.enterprise_sso_config USING ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'admin'::public.app_role)))));


--
-- Name: sso_user_mappings Admins can manage SSO user mappings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage SSO user mappings" ON public.sso_user_mappings USING ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'admin'::public.app_role)))));


--
-- Name: seo_alert_rules Admins can manage alert rules; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage alert rules" ON public.seo_alert_rules USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: bing_webmaster_oauth_credentials Admins can manage all Bing credentials; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all Bing credentials" ON public.bing_webmaster_oauth_credentials USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: bing_webmaster_search_data Admins can manage all Bing search data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all Bing search data" ON public.bing_webmaster_search_data USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: bing_webmaster_sites Admins can manage all Bing sites; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all Bing sites" ON public.bing_webmaster_sites USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: ga4_oauth_credentials Admins can manage all GA4 credentials; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all GA4 credentials" ON public.ga4_oauth_credentials USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: ga4_properties Admins can manage all GA4 properties; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all GA4 properties" ON public.ga4_properties USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: ga4_traffic_data Admins can manage all GA4 traffic data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all GA4 traffic data" ON public.ga4_traffic_data USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: gsc_oauth_credentials Admins can manage all GSC credentials; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all GSC credentials" ON public.gsc_oauth_credentials USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: gsc_keyword_performance Admins can manage all GSC keyword data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all GSC keyword data" ON public.gsc_keyword_performance USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: gsc_page_performance Admins can manage all GSC page data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all GSC page data" ON public.gsc_page_performance USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: gsc_properties Admins can manage all GSC properties; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all GSC properties" ON public.gsc_properties USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: yandex_webmaster_oauth_credentials Admins can manage all Yandex credentials; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all Yandex credentials" ON public.yandex_webmaster_oauth_credentials USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: yandex_webmaster_search_data Admins can manage all Yandex search data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all Yandex search data" ON public.yandex_webmaster_search_data USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: yandex_webmaster_sites Admins can manage all Yandex sites; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all Yandex sites" ON public.yandex_webmaster_sites USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: seo_alerts Admins can manage all alerts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all alerts" ON public.seo_alerts USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: articles Admins can manage all articles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all articles" ON public.articles USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: article_comments Admins can manage all comments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all comments" ON public.article_comments USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: search_dashboard_config Admins can manage all dashboard configs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all dashboard configs" ON public.search_dashboard_config USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: seo_notification_preferences Admins can manage all notification preferences; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all notification preferences" ON public.seo_notification_preferences USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_roles Admins can manage all roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all roles" ON public.user_roles USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: content_suggestions Admins can manage all suggestions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all suggestions" ON public.content_suggestions TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: unified_search_analytics Admins can manage all unified analytics; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all unified analytics" ON public.unified_search_analytics USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: article_webhooks Admins can manage article webhooks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage article webhooks" ON public.article_webhooks USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: seo_audit_history Admins can manage audit history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage audit history" ON public.seo_audit_history USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: seo_competitor_analysis Admins can manage competitor analysis; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage competitor analysis" ON public.seo_competitor_analysis USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: seo_content_optimization Admins can manage content optimization; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage content optimization" ON public.seo_content_optimization USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: content_suggestions Admins can manage content suggestions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage content suggestions" ON public.content_suggestions USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: seo_core_web_vitals Admins can manage core web vitals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage core web vitals" ON public.seo_core_web_vitals USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: seo_crawl_results Admins can manage crawl results; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage crawl results" ON public.seo_crawl_results USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: seo_duplicate_content Admins can manage duplicate content; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage duplicate content" ON public.seo_duplicate_content USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: encrypted_pii_config Admins can manage encryption config; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage encryption config" ON public.encrypted_pii_config USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: encryption_key_metadata Admins can manage encryption keys; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage encryption keys" ON public.encryption_key_metadata USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: seo_image_analysis Admins can manage image analysis; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage image analysis" ON public.seo_image_analysis USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: seo_keyword_history Admins can manage keyword history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage keyword history" ON public.seo_keyword_history USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: seo_link_analysis Admins can manage link analysis; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage link analysis" ON public.seo_link_analysis USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: seo_mobile_analysis Admins can manage mobile analysis; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage mobile analysis" ON public.seo_mobile_analysis USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: seo_monitoring_log Admins can manage monitoring logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage monitoring logs" ON public.seo_monitoring_log USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: seo_monitoring_schedules Admins can manage monitoring schedules; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage monitoring schedules" ON public.seo_monitoring_schedules USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: workflow_node_templates Admins can manage node templates; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage node templates" ON public.workflow_node_templates USING ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'admin'::public.app_role)))));


--
-- Name: seo_page_scores Admins can manage page scores; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage page scores" ON public.seo_page_scores USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: seo_performance_budget Admins can manage performance budgets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage performance budgets" ON public.seo_performance_budget USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: subscription_plans Admins can manage plans; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage plans" ON public.subscription_plans USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: seo_redirect_analysis Admins can manage redirect analysis; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage redirect analysis" ON public.seo_redirect_analysis USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: seo_security_analysis Admins can manage security analysis; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage security analysis" ON public.seo_security_analysis USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: seo_semantic_analysis Admins can manage semantic analysis; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage semantic analysis" ON public.seo_semantic_analysis USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: social_media_posts Admins can manage social media posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage social media posts" ON public.social_media_posts USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: seo_structured_data Admins can manage structured data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage structured data" ON public.seo_structured_data USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: workflow_templates Admins can manage templates; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage templates" ON public.workflow_templates USING ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'admin'::public.app_role)))));


--
-- Name: social_media_webhooks Admins can manage webhooks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage webhooks" ON public.social_media_webhooks USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: feature_catalog Admins can modify feature catalog; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can modify feature catalog" ON public.feature_catalog USING ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'admin'::public.app_role)))));


--
-- Name: audit_logs Admins can read all audit logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can read all audit logs" ON public.audit_logs FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: instagram_bio_analyses Admins can read instagram_bio_analyses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can read instagram_bio_analyses" ON public.instagram_bio_analyses FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: instagram_bio_analytics Admins can read instagram_bio_analytics; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can read instagram_bio_analytics" ON public.instagram_bio_analytics FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: instagram_bio_email_captures Admins can read instagram_bio_email_captures; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can read instagram_bio_email_captures" ON public.instagram_bio_email_captures FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: instagram_bio_email_sequences Admins can read instagram_bio_email_sequences; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can read instagram_bio_email_sequences" ON public.instagram_bio_email_sequences FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: listing_descriptions Admins can read listing_descriptions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can read listing_descriptions" ON public.listing_descriptions FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: listing_email_captures Admins can read listing_email_captures; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can read listing_email_captures" ON public.listing_email_captures FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: listing_email_sequences Admins can read listing_email_sequences; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can read listing_email_sequences" ON public.listing_email_sequences FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: listing_generator_analytics Admins can read listing_generator_analytics; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can read listing_generator_analytics" ON public.listing_generator_analytics FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: sso_audit_logs Admins can view SSO audit logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view SSO audit logs" ON public.sso_audit_logs FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'admin'::public.app_role)))));


--
-- Name: seo_alert_rules Admins can view alert rules; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view alert rules" ON public.seo_alert_rules FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_subscriptions Admins can view all subscriptions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all subscriptions" ON public.user_subscriptions FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: pii_encryption_audit Admins can view encryption audit; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view encryption audit" ON public.pii_encryption_audit FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: seo_monitoring_log Admins can view monitoring logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view monitoring logs" ON public.seo_monitoring_log FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: feature_flags Admins manage feature flags; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins manage feature flags" ON public.feature_flags USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: team_members Admins manage roster; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins manage roster" ON public.team_members USING (public.is_team_admin(team_id, auth.uid())) WITH CHECK (public.is_team_admin(team_id, auth.uid()));


--
-- Name: lead_routing_rules Admins manage routing rules; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins manage routing rules" ON public.lead_routing_rules USING (public.is_team_admin(team_id, auth.uid())) WITH CHECK (public.is_team_admin(team_id, auth.uid()));


--
-- Name: query_metrics Admins read query metrics; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins read query metrics" ON public.query_metrics FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: mortgage_calculations Agents can read their own mortgage calculations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Agents can read their own mortgage calculations" ON public.mortgage_calculations FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: mortgage_calculations Agents can update their own mortgage calculations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Agents can update their own mortgage calculations" ON public.mortgage_calculations FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: seo_alerts All authenticated users can view alerts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "All authenticated users can view alerts" ON public.seo_alerts FOR SELECT USING ((auth.uid() IS NOT NULL));


--
-- Name: instagram_bio_analyses Allow public insert on analyses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public insert on analyses" ON public.instagram_bio_analyses FOR INSERT TO anon WITH CHECK (true);


--
-- Name: instagram_bio_analytics Allow public insert on analytics; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public insert on analytics" ON public.instagram_bio_analytics FOR INSERT TO anon WITH CHECK (true);


--
-- Name: instagram_bio_email_captures Allow public insert on email captures; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public insert on email captures" ON public.instagram_bio_email_captures FOR INSERT TO anon WITH CHECK (true);


--
-- Name: listing_generator_analytics Allow public insert on listing analytics; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public insert on listing analytics" ON public.listing_generator_analytics FOR INSERT TO anon WITH CHECK (true);


--
-- Name: listing_descriptions Allow public insert on listing descriptions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public insert on listing descriptions" ON public.listing_descriptions FOR INSERT TO anon WITH CHECK (true);


--
-- Name: listing_email_captures Allow public insert on listing email captures; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public insert on listing email captures" ON public.listing_email_captures FOR INSERT TO anon WITH CHECK (true);


--
-- Name: analytics_views Anyone can insert analytics views; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can insert analytics views" ON public.analytics_views FOR INSERT WITH CHECK (true);


--
-- Name: feature_catalog Anyone can read feature catalog; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can read feature catalog" ON public.feature_catalog FOR SELECT USING (true);


--
-- Name: mortgage_calculations Anyone can record a mortgage calculation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can record a mortgage calculation" ON public.mortgage_calculations FOR INSERT WITH CHECK (true);


--
-- Name: leads Anyone can submit leads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can submit leads" ON public.leads FOR INSERT WITH CHECK (true);


--
-- Name: keywords Anyone can view active keywords; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view active keywords" ON public.keywords FOR SELECT USING ((is_active = true));


--
-- Name: links Anyone can view active links; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view active links" ON public.links FOR SELECT USING ((is_active = true));


--
-- Name: subscription_plans Anyone can view active plans; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view active plans" ON public.subscription_plans FOR SELECT USING ((is_active = true));


--
-- Name: article_comments Anyone can view approved comments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view approved comments" ON public.article_comments FOR SELECT USING ((is_approved = true));


--
-- Name: custom_pages Anyone can view published pages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view published pages" ON public.custom_pages FOR SELECT USING ((published = true));


--
-- Name: testimonials Anyone can view published testimonials; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view published testimonials" ON public.testimonials FOR SELECT USING ((is_published = true));


--
-- Name: feature_flags Authenticated can read feature flags; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated can read feature flags" ON public.feature_flags FOR SELECT USING ((auth.role() = 'authenticated'::text));


--
-- Name: seo_competitor_analysis Authenticated users can view competitor analysis; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view competitor analysis" ON public.seo_competitor_analysis FOR SELECT USING ((auth.uid() IS NOT NULL));


--
-- Name: seo_crawl_results Authenticated users can view crawl results; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view crawl results" ON public.seo_crawl_results FOR SELECT USING ((auth.uid() IS NOT NULL));


--
-- Name: seo_mobile_analysis Authenticated users can view mobile analysis; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view mobile analysis" ON public.seo_mobile_analysis FOR SELECT USING ((auth.uid() IS NOT NULL));


--
-- Name: seo_page_scores Authenticated users can view page scores; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view page scores" ON public.seo_page_scores FOR SELECT USING ((auth.uid() IS NOT NULL));


--
-- Name: seo_security_analysis Authenticated users can view security analysis; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view security analysis" ON public.seo_security_analysis FOR SELECT USING ((auth.uid() IS NOT NULL));


--
-- Name: articles Authors can manage their own articles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authors can manage their own articles" ON public.articles USING ((auth.uid() = author_id));


--
-- Name: workflow_node_templates Everyone can read node templates; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Everyone can read node templates" ON public.workflow_node_templates FOR SELECT USING ((is_active = true));


--
-- Name: team_members Members read roster; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Members read roster" ON public.team_members FOR SELECT USING (((user_id = auth.uid()) OR public.is_team_member(team_id, auth.uid()) OR public.is_team_admin(team_id, auth.uid())));


--
-- Name: keywords Only admins can delete keywords; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Only admins can delete keywords" ON public.keywords FOR DELETE USING ((EXISTS ( SELECT 1
   FROM auth.users
  WHERE ((users.id = auth.uid()) AND ((users.raw_user_meta_data ->> 'role'::text) = 'admin'::text)))));


--
-- Name: keywords Only admins can insert keywords; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Only admins can insert keywords" ON public.keywords FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM auth.users
  WHERE ((users.id = auth.uid()) AND ((users.raw_user_meta_data ->> 'role'::text) = 'admin'::text)))));


--
-- Name: keywords Only admins can update keywords; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Only admins can update keywords" ON public.keywords FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM auth.users
  WHERE ((users.id = auth.uid()) AND ((users.raw_user_meta_data ->> 'role'::text) = 'admin'::text)))));


--
-- Name: teams Owner modifies team; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Owner modifies team" ON public.teams USING ((owner_id = auth.uid())) WITH CHECK ((owner_id = auth.uid()));


--
-- Name: workflow_templates Public can read templates; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can read templates" ON public.workflow_templates FOR SELECT USING ((is_public = true));


--
-- Name: seo_settings Public can view SEO settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can view SEO settings" ON public.seo_settings FOR SELECT USING (true);


--
-- Name: seo_keywords Public can view active keywords; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can view active keywords" ON public.seo_keywords FOR SELECT USING ((is_active = true));


--
-- Name: listings Public can view active listings without user tracking; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can view active listings without user tracking" ON public.listings FOR SELECT USING ((status = ANY (ARRAY['active'::text, 'pending'::text, 'under_contract'::text, 'sold'::text])));


--
-- Name: seo_core_web_vitals Public can view core web vitals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can view core web vitals" ON public.seo_core_web_vitals FOR SELECT USING (true);


--
-- Name: seo_keyword_history Public can view keyword history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can view keyword history" ON public.seo_keyword_history FOR SELECT USING (true);


--
-- Name: profiles Public can view limited profile info; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can view limited profile info" ON public.profiles FOR SELECT USING ((is_published = true));


--
-- Name: articles Public can view published articles without author tracking; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can view published articles without author tracking" ON public.articles FOR SELECT USING ((status = 'published'::text));


--
-- Name: pseo_taxonomy Public read active taxonomy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read active taxonomy" ON public.pseo_taxonomy FOR SELECT USING ((is_active = true));


--
-- Name: pseo_pages Public read published pseo pages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read published pseo pages" ON public.pseo_pages FOR SELECT USING ((is_published = true));


--
-- Name: subscriptions Service role can insert subscriptions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role can insert subscriptions" ON public.subscriptions FOR INSERT WITH CHECK (((auth.jwt() ->> 'role'::text) = 'service_role'::text));


--
-- Name: mfa_verification_logs Service role can insert verification logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role can insert verification logs" ON public.mfa_verification_logs FOR INSERT TO service_role WITH CHECK (true);


--
-- Name: gdpr_data_requests Service role can manage GDPR requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role can manage GDPR requests" ON public.gdpr_data_requests TO service_role USING (true) WITH CHECK (true);


--
-- Name: audit_logs Service role can manage audit logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role can manage audit logs" ON public.audit_logs TO service_role USING (true) WITH CHECK (true);


--
-- Name: account_deletion_scheduled Service role can manage deletion schedule; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role can manage deletion schedule" ON public.account_deletion_scheduled TO service_role USING (true) WITH CHECK (true);


--
-- Name: login_attempts Service role can manage login attempts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role can manage login attempts" ON public.login_attempts TO service_role USING (true) WITH CHECK (true);


--
-- Name: user_sessions Service role can manage sessions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role can manage sessions" ON public.user_sessions TO service_role USING (true) WITH CHECK (true);


--
-- Name: stripe_customers Service role can manage stripe customers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role can manage stripe customers" ON public.stripe_customers USING (((auth.jwt() ->> 'role'::text) = 'service_role'::text));


--
-- Name: stripe_usage_records Service role can manage stripe records; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role can manage stripe records" ON public.stripe_usage_records USING (((auth.jwt() ->> 'role'::text) = 'service_role'::text));


--
-- Name: user_subscriptions Service role can manage subscriptions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role can manage subscriptions" ON public.user_subscriptions TO service_role USING (true) WITH CHECK (true);


--
-- Name: feature_usage Service role can manage usage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role can manage usage" ON public.feature_usage USING (((auth.jwt() ->> 'role'::text) = 'service_role'::text));


--
-- Name: usage_tracking Service role can manage usage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role can manage usage" ON public.usage_tracking TO service_role USING (true) WITH CHECK (true);


--
-- Name: monthly_usage_summary Service role can manage usage summaries; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role can manage usage summaries" ON public.monthly_usage_summary USING (((auth.jwt() ->> 'role'::text) = 'service_role'::text));


--
-- Name: subscriptions Service role can update subscriptions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role can update subscriptions" ON public.subscriptions FOR UPDATE USING (((auth.jwt() ->> 'role'::text) = 'service_role'::text));


--
-- Name: notifications Service role inserts notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role inserts notifications" ON public.notifications FOR INSERT TO service_role WITH CHECK (true);


--
-- Name: sso_login_sessions Service role manages SSO sessions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role manages SSO sessions" ON public.sso_login_sessions TO service_role USING (true) WITH CHECK (true);


--
-- Name: workflow_executions Service role manages executions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role manages executions" ON public.workflow_executions TO service_role USING (true) WITH CHECK (true);


--
-- Name: instagram_bio_analyses Service role manages instagram_bio_analyses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role manages instagram_bio_analyses" ON public.instagram_bio_analyses TO service_role USING (true) WITH CHECK (true);


--
-- Name: instagram_bio_analytics Service role manages instagram_bio_analytics; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role manages instagram_bio_analytics" ON public.instagram_bio_analytics TO service_role USING (true) WITH CHECK (true);


--
-- Name: instagram_bio_email_captures Service role manages instagram_bio_email_captures; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role manages instagram_bio_email_captures" ON public.instagram_bio_email_captures TO service_role USING (true) WITH CHECK (true);


--
-- Name: instagram_bio_email_sequences Service role manages instagram_bio_email_sequences; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role manages instagram_bio_email_sequences" ON public.instagram_bio_email_sequences TO service_role USING (true) WITH CHECK (true);


--
-- Name: listing_descriptions Service role manages listing_descriptions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role manages listing_descriptions" ON public.listing_descriptions TO service_role USING (true) WITH CHECK (true);


--
-- Name: listing_email_captures Service role manages listing_email_captures; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role manages listing_email_captures" ON public.listing_email_captures TO service_role USING (true) WITH CHECK (true);


--
-- Name: listing_email_sequences Service role manages listing_email_sequences; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role manages listing_email_sequences" ON public.listing_email_sequences TO service_role USING (true) WITH CHECK (true);


--
-- Name: listing_generator_analytics Service role manages listing_generator_analytics; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role manages listing_generator_analytics" ON public.listing_generator_analytics TO service_role USING (true) WITH CHECK (true);


--
-- Name: workflow_execution_queue Service role manages queue; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role manages queue" ON public.workflow_execution_queue TO service_role USING (true) WITH CHECK (true);


--
-- Name: rate_limit_entries Service role manages rate limits; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role manages rate limits" ON public.rate_limit_entries TO service_role USING (true) WITH CHECK (true);


--
-- Name: mfa_temp_codes Service role manages temp codes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role manages temp codes" ON public.mfa_temp_codes TO service_role USING (true) WITH CHECK (true);


--
-- Name: query_metrics Service role writes query metrics; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role writes query metrics" ON public.query_metrics FOR INSERT TO service_role WITH CHECK (true);


--
-- Name: pii_encryption_audit System can insert encryption audit; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "System can insert encryption audit" ON public.pii_encryption_audit FOR INSERT TO service_role WITH CHECK (true);


--
-- Name: teams Team members read team; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Team members read team" ON public.teams FOR SELECT USING (((owner_id = auth.uid()) OR public.is_team_member(id, auth.uid())));


--
-- Name: lead_routing_rules Team reads routing rules; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Team reads routing rules" ON public.lead_routing_rules FOR SELECT USING ((public.is_team_member(team_id, auth.uid()) OR public.is_team_admin(team_id, auth.uid())));


--
-- Name: lead_notes Users can add notes to their own leads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can add notes to their own leads" ON public.lead_notes FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.leads l
  WHERE ((l.id = lead_notes.lead_id) AND (l.user_id = auth.uid())))));


--
-- Name: account_deletion_scheduled Users can cancel own deletion; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can cancel own deletion" ON public.account_deletion_scheduled FOR UPDATE USING (((auth.uid() = user_id) AND (cancelled = false) AND (executed = false)));


--
-- Name: gdpr_data_requests Users can cancel own pending GDPR requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can cancel own pending GDPR requests" ON public.gdpr_data_requests FOR UPDATE USING (((auth.uid() = user_id) AND (status = 'pending'::text)));


--
-- Name: lead_activities Users can create activities for own leads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create activities for own leads" ON public.lead_activities FOR INSERT WITH CHECK (((auth.uid() = user_id) AND (EXISTS ( SELECT 1
   FROM public.leads
  WHERE ((leads.id = lead_activities.lead_id) AND (leads.user_id = auth.uid()))))));


--
-- Name: gdpr_data_requests Users can create own GDPR requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create own GDPR requests" ON public.gdpr_data_requests FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: api_keys Users can create own api_keys; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create own api_keys" ON public.api_keys FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: custom_pages Users can create their own pages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own pages" ON public.custom_pages FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: lead_notes Users can delete notes on their own leads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete notes on their own leads" ON public.lead_notes FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.leads l
  WHERE ((l.id = lead_notes.lead_id) AND (l.user_id = auth.uid())))));


--
-- Name: ab_test_results Users can delete own A/B test results; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own A/B test results" ON public.ab_test_results FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: lead_activities Users can delete own activities; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own activities" ON public.lead_activities FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: api_keys Users can delete own api_keys; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own api_keys" ON public.api_keys FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: lead_scores Users can delete own lead scores; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own lead scores" ON public.lead_scores FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: ml_model_weights Users can delete own model weights; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own model weights" ON public.ml_model_weights FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: ml_training_examples Users can delete own training examples; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own training examples" ON public.ml_training_examples FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: leads Users can delete their own leads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own leads" ON public.leads FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: listings Users can delete their own listings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own listings" ON public.listings FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: custom_pages Users can delete their own pages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own pages" ON public.custom_pages FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: testimonials Users can delete their own testimonials; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own testimonials" ON public.testimonials FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: ab_test_results Users can insert own A/B test results; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own A/B test results" ON public.ab_test_results FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: user_mfa_settings Users can insert own MFA settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own MFA settings" ON public.user_mfa_settings FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: lead_scores Users can insert own lead scores; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own lead scores" ON public.lead_scores FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: ml_model_weights Users can insert own model weights; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own model weights" ON public.ml_model_weights FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: ml_training_examples Users can insert own training examples; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own training examples" ON public.ml_training_examples FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: leads Users can insert their own leads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own leads" ON public.leads FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: listings Users can insert their own listings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own listings" ON public.listings FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: profiles Users can insert their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK ((auth.uid() = id));


--
-- Name: user_settings Users can insert their own settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own settings" ON public.user_settings FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: testimonials Users can insert their own testimonials; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own testimonials" ON public.testimonials FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: workflow_triggers Users can manage own triggers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage own triggers" ON public.workflow_triggers USING ((EXISTS ( SELECT 1
   FROM public.workflows
  WHERE ((workflows.id = workflow_triggers.workflow_id) AND (workflows.user_id = auth.uid())))));


--
-- Name: mfa_trusted_devices Users can manage own trusted devices; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage own trusted devices" ON public.mfa_trusted_devices USING ((auth.uid() = user_id));


--
-- Name: workflow_versions Users can manage own workflow versions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage own workflow versions" ON public.workflow_versions USING ((EXISTS ( SELECT 1
   FROM public.workflows
  WHERE ((workflows.id = workflow_versions.workflow_id) AND (workflows.user_id = auth.uid())))));


--
-- Name: workflows Users can manage own workflows; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage own workflows" ON public.workflows USING ((auth.uid() = user_id));


--
-- Name: bing_webmaster_oauth_credentials Users can manage their own Bing credentials; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage their own Bing credentials" ON public.bing_webmaster_oauth_credentials USING ((auth.uid() = user_id));


--
-- Name: bing_webmaster_sites Users can manage their own Bing sites; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage their own Bing sites" ON public.bing_webmaster_sites USING ((auth.uid() = user_id));


--
-- Name: ga4_oauth_credentials Users can manage their own GA4 credentials; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage their own GA4 credentials" ON public.ga4_oauth_credentials USING ((auth.uid() = user_id));


--
-- Name: ga4_properties Users can manage their own GA4 properties; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage their own GA4 properties" ON public.ga4_properties USING ((auth.uid() = user_id));


--
-- Name: gsc_oauth_credentials Users can manage their own GSC credentials; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage their own GSC credentials" ON public.gsc_oauth_credentials USING ((auth.uid() = user_id));


--
-- Name: gsc_properties Users can manage their own GSC properties; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage their own GSC properties" ON public.gsc_properties USING ((auth.uid() = user_id));


--
-- Name: yandex_webmaster_oauth_credentials Users can manage their own Yandex credentials; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage their own Yandex credentials" ON public.yandex_webmaster_oauth_credentials USING ((auth.uid() = user_id));


--
-- Name: yandex_webmaster_sites Users can manage their own Yandex sites; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage their own Yandex sites" ON public.yandex_webmaster_sites USING ((auth.uid() = user_id));


--
-- Name: search_dashboard_config Users can manage their own dashboard config; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage their own dashboard config" ON public.search_dashboard_config USING ((auth.uid() = user_id));


--
-- Name: links Users can manage their own links; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage their own links" ON public.links USING ((auth.uid() = user_id));


--
-- Name: seo_notification_preferences Users can manage their own notification preferences; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage their own notification preferences" ON public.seo_notification_preferences USING ((auth.uid() = user_id));


--
-- Name: article_webhooks Users can manage their own webhooks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage their own webhooks" ON public.article_webhooks USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: lead_notes Users can read notes on their own leads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can read notes on their own leads" ON public.lead_notes FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.leads l
  WHERE ((l.id = lead_notes.lead_id) AND (l.user_id = auth.uid())))));


--
-- Name: invoices Users can read their own invoices; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can read their own invoices" ON public.invoices FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: user_sessions Users can revoke own sessions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can revoke own sessions" ON public.user_sessions FOR UPDATE USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: lead_notes Users can update notes on their own leads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update notes on their own leads" ON public.lead_notes FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.leads l
  WHERE ((l.id = lead_notes.lead_id) AND (l.user_id = auth.uid())))));


--
-- Name: ab_test_results Users can update own A/B test results; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own A/B test results" ON public.ab_test_results FOR UPDATE USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: user_mfa_settings Users can update own MFA settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own MFA settings" ON public.user_mfa_settings FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: lead_activities Users can update own activities; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own activities" ON public.lead_activities FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: api_keys Users can update own api_keys; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own api_keys" ON public.api_keys FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: lead_scores Users can update own lead scores; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own lead scores" ON public.lead_scores FOR UPDATE USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: ml_model_weights Users can update own model weights; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own model weights" ON public.ml_model_weights FOR UPDATE USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: leads Users can update their own leads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own leads" ON public.leads FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: listings Users can update their own listings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own listings" ON public.listings FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: custom_pages Users can update their own pages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own pages" ON public.custom_pages FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: profiles Users can update their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = id));


--
-- Name: user_settings Users can update their own settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own settings" ON public.user_settings FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: testimonials Users can update their own testimonials; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own testimonials" ON public.testimonials FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: enterprise_sso_config Users can view active SSO configs for their domain; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view active SSO configs for their domain" ON public.enterprise_sso_config FOR SELECT USING ((active = true));


--
-- Name: lead_activities Users can view activities for own leads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view activities for own leads" ON public.lead_activities FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.leads
  WHERE ((leads.id = lead_activities.lead_id) AND (leads.user_id = auth.uid())))));


--
-- Name: seo_monitoring_log Users can view monitoring logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view monitoring logs" ON public.seo_monitoring_log FOR SELECT USING ((auth.uid() IS NOT NULL));


--
-- Name: seo_monitoring_schedules Users can view monitoring schedules; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view monitoring schedules" ON public.seo_monitoring_schedules FOR SELECT USING ((auth.uid() IS NOT NULL));


--
-- Name: ab_test_results Users can view own A/B test results; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own A/B test results" ON public.ab_test_results FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: gdpr_data_requests Users can view own GDPR requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own GDPR requests" ON public.gdpr_data_requests FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: user_mfa_settings Users can view own MFA settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own MFA settings" ON public.user_mfa_settings FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: mfa_verification_logs Users can view own MFA verification logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own MFA verification logs" ON public.mfa_verification_logs FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: sso_audit_logs Users can view own SSO audit logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own SSO audit logs" ON public.sso_audit_logs FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: sso_user_mappings Users can view own SSO mappings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own SSO mappings" ON public.sso_user_mappings FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: api_keys Users can view own api_keys; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own api_keys" ON public.api_keys FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: audit_logs Users can view own audit logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own audit logs" ON public.audit_logs FOR SELECT USING ((user_id = auth.uid()));


--
-- Name: account_deletion_scheduled Users can view own deletion schedule; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own deletion schedule" ON public.account_deletion_scheduled FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: workflow_execution_steps Users can view own execution steps; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own execution steps" ON public.workflow_execution_steps FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.workflow_executions
  WHERE ((workflow_executions.id = workflow_execution_steps.execution_id) AND (workflow_executions.user_id = auth.uid())))));


--
-- Name: profiles Users can view own full profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own full profile" ON public.profiles FOR SELECT TO authenticated USING ((auth.uid() = id));


--
-- Name: lead_scores Users can view own lead scores; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own lead scores" ON public.lead_scores FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: login_attempts Users can view own login attempts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own login attempts" ON public.login_attempts FOR SELECT USING ((user_id = auth.uid()));


--
-- Name: ml_model_weights Users can view own model weights; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own model weights" ON public.ml_model_weights FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: user_sessions Users can view own sessions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own sessions" ON public.user_sessions FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: stripe_customers Users can view own stripe customer; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own stripe customer" ON public.stripe_customers FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: stripe_usage_records Users can view own stripe records; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own stripe records" ON public.stripe_usage_records FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: ml_training_examples Users can view own training examples; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own training examples" ON public.ml_training_examples FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: mfa_trusted_devices Users can view own trusted devices; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own trusted devices" ON public.mfa_trusted_devices FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: feature_usage Users can view own usage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own usage" ON public.feature_usage FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: monthly_usage_summary Users can view own usage summary; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own usage summary" ON public.monthly_usage_summary FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: workflow_executions Users can view own workflow executions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own workflow executions" ON public.workflow_executions FOR SELECT USING ((user_id = auth.uid()));


--
-- Name: bing_webmaster_search_data Users can view their own Bing search data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own Bing search data" ON public.bing_webmaster_search_data FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.bing_webmaster_sites
  WHERE ((bing_webmaster_sites.id = bing_webmaster_search_data.site_id) AND (bing_webmaster_sites.user_id = auth.uid())))));


--
-- Name: ga4_traffic_data Users can view their own GA4 traffic data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own GA4 traffic data" ON public.ga4_traffic_data FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.ga4_properties
  WHERE ((ga4_properties.id = ga4_traffic_data.property_id) AND (ga4_properties.user_id = auth.uid())))));


--
-- Name: gsc_keyword_performance Users can view their own GSC keyword data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own GSC keyword data" ON public.gsc_keyword_performance FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.gsc_properties
  WHERE ((gsc_properties.id = gsc_keyword_performance.property_id) AND (gsc_properties.user_id = auth.uid())))));


--
-- Name: gsc_page_performance Users can view their own GSC page data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own GSC page data" ON public.gsc_page_performance FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.gsc_properties
  WHERE ((gsc_properties.id = gsc_page_performance.property_id) AND (gsc_properties.user_id = auth.uid())))));


--
-- Name: yandex_webmaster_search_data Users can view their own Yandex search data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own Yandex search data" ON public.yandex_webmaster_search_data FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.yandex_webmaster_sites
  WHERE ((yandex_webmaster_sites.id = yandex_webmaster_search_data.site_id) AND (yandex_webmaster_sites.user_id = auth.uid())))));


--
-- Name: seo_alerts Users can view their own alerts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own alerts" ON public.seo_alerts FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: analytics_views Users can view their own analytics; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own analytics" ON public.analytics_views FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: seo_audit_history Users can view their own audits; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own audits" ON public.seo_audit_history FOR SELECT USING (((auth.uid() = performed_by) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: seo_content_optimization Users can view their own content optimization; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own content optimization" ON public.seo_content_optimization FOR SELECT USING (((auth.uid() = analyzed_by) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: seo_fixes_applied Users can view their own fixes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own fixes" ON public.seo_fixes_applied FOR SELECT USING (((auth.uid() = applied_by) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: leads Users can view their own leads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own leads" ON public.leads FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: listings Users can view their own listings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own listings" ON public.listings FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: custom_pages Users can view their own pages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own pages" ON public.custom_pages FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: user_roles Users can view their own roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: seo_semantic_analysis Users can view their own semantic analysis; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own semantic analysis" ON public.seo_semantic_analysis FOR SELECT USING (((auth.uid() = analyzed_by) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: user_settings Users can view their own settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own settings" ON public.user_settings FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: subscriptions Users can view their own subscription; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own subscription" ON public.subscriptions FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: user_subscriptions Users can view their own subscription; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own subscription" ON public.user_subscriptions FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: testimonials Users can view their own testimonials; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own testimonials" ON public.testimonials FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: unified_search_analytics Users can view their own unified analytics; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own unified analytics" ON public.unified_search_analytics USING ((auth.uid() = user_id));


--
-- Name: usage_tracking Users can view their own usage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own usage" ON public.usage_tracking FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: notifications Users read own notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users read own notifications" ON public.notifications FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: content_suggestions Users read own suggestions, admins read all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users read own suggestions, admins read all" ON public.content_suggestions FOR SELECT TO authenticated USING (((suggested_by = auth.uid()) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: notifications Users update own notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users update own notifications" ON public.notifications FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: ab_test_results; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ab_test_results ENABLE ROW LEVEL SECURITY;

--
-- Name: account_deletion_log; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.account_deletion_log ENABLE ROW LEVEL SECURITY;

--
-- Name: account_deletion_scheduled; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.account_deletion_scheduled ENABLE ROW LEVEL SECURITY;

--
-- Name: admin_audit_log; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

--
-- Name: ai_configuration; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ai_configuration ENABLE ROW LEVEL SECURITY;

--
-- Name: ai_models; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ai_models ENABLE ROW LEVEL SECURITY;

--
-- Name: analytics_views; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.analytics_views ENABLE ROW LEVEL SECURITY;

--
-- Name: api_keys; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

--
-- Name: article_comments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.article_comments ENABLE ROW LEVEL SECURITY;

--
-- Name: article_webhooks; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.article_webhooks ENABLE ROW LEVEL SECURITY;

--
-- Name: articles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

--
-- Name: audit_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: bing_webmaster_oauth_credentials; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.bing_webmaster_oauth_credentials ENABLE ROW LEVEL SECURITY;

--
-- Name: bing_webmaster_search_data; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.bing_webmaster_search_data ENABLE ROW LEVEL SECURITY;

--
-- Name: bing_webmaster_sites; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.bing_webmaster_sites ENABLE ROW LEVEL SECURITY;

--
-- Name: content_suggestions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.content_suggestions ENABLE ROW LEVEL SECURITY;

--
-- Name: custom_pages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.custom_pages ENABLE ROW LEVEL SECURITY;

--
-- Name: encrypted_pii_config; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.encrypted_pii_config ENABLE ROW LEVEL SECURITY;

--
-- Name: encryption_key_metadata; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.encryption_key_metadata ENABLE ROW LEVEL SECURITY;

--
-- Name: enterprise_sso_config; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.enterprise_sso_config ENABLE ROW LEVEL SECURITY;

--
-- Name: error_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: feature_catalog; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.feature_catalog ENABLE ROW LEVEL SECURITY;

--
-- Name: feature_flags; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

--
-- Name: feature_usage; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.feature_usage ENABLE ROW LEVEL SECURITY;

--
-- Name: ga4_oauth_credentials; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ga4_oauth_credentials ENABLE ROW LEVEL SECURITY;

--
-- Name: ga4_properties; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ga4_properties ENABLE ROW LEVEL SECURITY;

--
-- Name: ga4_traffic_data; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ga4_traffic_data ENABLE ROW LEVEL SECURITY;

--
-- Name: gdpr_data_requests; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.gdpr_data_requests ENABLE ROW LEVEL SECURITY;

--
-- Name: gsc_keyword_performance; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.gsc_keyword_performance ENABLE ROW LEVEL SECURITY;

--
-- Name: gsc_oauth_credentials; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.gsc_oauth_credentials ENABLE ROW LEVEL SECURITY;

--
-- Name: gsc_page_performance; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.gsc_page_performance ENABLE ROW LEVEL SECURITY;

--
-- Name: gsc_properties; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.gsc_properties ENABLE ROW LEVEL SECURITY;

--
-- Name: instagram_bio_analyses; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.instagram_bio_analyses ENABLE ROW LEVEL SECURITY;

--
-- Name: instagram_bio_analytics; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.instagram_bio_analytics ENABLE ROW LEVEL SECURITY;

--
-- Name: instagram_bio_email_captures; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.instagram_bio_email_captures ENABLE ROW LEVEL SECURITY;

--
-- Name: instagram_bio_email_sequences; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.instagram_bio_email_sequences ENABLE ROW LEVEL SECURITY;

--
-- Name: invoices; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

--
-- Name: keywords; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.keywords ENABLE ROW LEVEL SECURITY;

--
-- Name: lead_activities; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.lead_activities ENABLE ROW LEVEL SECURITY;

--
-- Name: lead_notes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.lead_notes ENABLE ROW LEVEL SECURITY;

--
-- Name: lead_routing_rules; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.lead_routing_rules ENABLE ROW LEVEL SECURITY;

--
-- Name: lead_scores; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.lead_scores ENABLE ROW LEVEL SECURITY;

--
-- Name: leads; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

--
-- Name: links; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.links ENABLE ROW LEVEL SECURITY;

--
-- Name: listing_descriptions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.listing_descriptions ENABLE ROW LEVEL SECURITY;

--
-- Name: listing_email_captures; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.listing_email_captures ENABLE ROW LEVEL SECURITY;

--
-- Name: listing_email_sequences; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.listing_email_sequences ENABLE ROW LEVEL SECURITY;

--
-- Name: listing_generator_analytics; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.listing_generator_analytics ENABLE ROW LEVEL SECURITY;

--
-- Name: listings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

--
-- Name: login_attempts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_temp_codes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.mfa_temp_codes ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_trusted_devices; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.mfa_trusted_devices ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_verification_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.mfa_verification_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: ml_model_weights; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ml_model_weights ENABLE ROW LEVEL SECURITY;

--
-- Name: ml_training_examples; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ml_training_examples ENABLE ROW LEVEL SECURITY;

--
-- Name: monthly_usage_summary; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.monthly_usage_summary ENABLE ROW LEVEL SECURITY;

--
-- Name: mortgage_calculations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.mortgage_calculations ENABLE ROW LEVEL SECURITY;

--
-- Name: notifications; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

--
-- Name: pii_encryption_audit; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.pii_encryption_audit ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: pseo_combination_queue; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.pseo_combination_queue ENABLE ROW LEVEL SECURITY;

--
-- Name: pseo_generation_errors; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.pseo_generation_errors ENABLE ROW LEVEL SECURITY;

--
-- Name: pseo_pages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.pseo_pages ENABLE ROW LEVEL SECURITY;

--
-- Name: pseo_prompts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.pseo_prompts ENABLE ROW LEVEL SECURITY;

--
-- Name: pseo_taxonomy; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.pseo_taxonomy ENABLE ROW LEVEL SECURITY;

--
-- Name: query_metrics; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.query_metrics ENABLE ROW LEVEL SECURITY;

--
-- Name: rate_limit_entries; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.rate_limit_entries ENABLE ROW LEVEL SECURITY;

--
-- Name: rate_limits; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

--
-- Name: search_dashboard_config; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.search_dashboard_config ENABLE ROW LEVEL SECURITY;

--
-- Name: seo_alert_rules; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.seo_alert_rules ENABLE ROW LEVEL SECURITY;

--
-- Name: seo_alerts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.seo_alerts ENABLE ROW LEVEL SECURITY;

--
-- Name: seo_audit_history; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.seo_audit_history ENABLE ROW LEVEL SECURITY;

--
-- Name: seo_audit_schedules; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.seo_audit_schedules ENABLE ROW LEVEL SECURITY;

--
-- Name: seo_autofix_history; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.seo_autofix_history ENABLE ROW LEVEL SECURITY;

--
-- Name: seo_autofix_rules; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.seo_autofix_rules ENABLE ROW LEVEL SECURITY;

--
-- Name: seo_automation_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.seo_automation_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: seo_competitor_analysis; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.seo_competitor_analysis ENABLE ROW LEVEL SECURITY;

--
-- Name: seo_competitor_tracking; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.seo_competitor_tracking ENABLE ROW LEVEL SECURITY;

--
-- Name: seo_content_optimization; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.seo_content_optimization ENABLE ROW LEVEL SECURITY;

--
-- Name: seo_core_web_vitals; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.seo_core_web_vitals ENABLE ROW LEVEL SECURITY;

--
-- Name: seo_crawl_results; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.seo_crawl_results ENABLE ROW LEVEL SECURITY;

--
-- Name: seo_duplicate_content; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.seo_duplicate_content ENABLE ROW LEVEL SECURITY;

--
-- Name: seo_fixes_applied; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.seo_fixes_applied ENABLE ROW LEVEL SECURITY;

--
-- Name: seo_image_analysis; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.seo_image_analysis ENABLE ROW LEVEL SECURITY;

--
-- Name: seo_keyword_history; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.seo_keyword_history ENABLE ROW LEVEL SECURITY;

--
-- Name: seo_keywords; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.seo_keywords ENABLE ROW LEVEL SECURITY;

--
-- Name: seo_link_analysis; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.seo_link_analysis ENABLE ROW LEVEL SECURITY;

--
-- Name: seo_mobile_analysis; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.seo_mobile_analysis ENABLE ROW LEVEL SECURITY;

--
-- Name: seo_monitoring_log; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.seo_monitoring_log ENABLE ROW LEVEL SECURITY;

--
-- Name: seo_monitoring_schedules; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.seo_monitoring_schedules ENABLE ROW LEVEL SECURITY;

--
-- Name: seo_notification_preferences; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.seo_notification_preferences ENABLE ROW LEVEL SECURITY;

--
-- Name: seo_notification_queue; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.seo_notification_queue ENABLE ROW LEVEL SECURITY;

--
-- Name: seo_page_scores; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.seo_page_scores ENABLE ROW LEVEL SECURITY;

--
-- Name: seo_performance_budget; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.seo_performance_budget ENABLE ROW LEVEL SECURITY;

--
-- Name: seo_redirect_analysis; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.seo_redirect_analysis ENABLE ROW LEVEL SECURITY;

--
-- Name: seo_report_history; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.seo_report_history ENABLE ROW LEVEL SECURITY;

--
-- Name: seo_scheduled_reports; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.seo_scheduled_reports ENABLE ROW LEVEL SECURITY;

--
-- Name: seo_security_analysis; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.seo_security_analysis ENABLE ROW LEVEL SECURITY;

--
-- Name: seo_semantic_analysis; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.seo_semantic_analysis ENABLE ROW LEVEL SECURITY;

--
-- Name: seo_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.seo_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: seo_structured_data; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.seo_structured_data ENABLE ROW LEVEL SECURITY;

--
-- Name: social_media_posts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.social_media_posts ENABLE ROW LEVEL SECURITY;

--
-- Name: social_media_webhooks; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.social_media_webhooks ENABLE ROW LEVEL SECURITY;

--
-- Name: sso_audit_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.sso_audit_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: sso_login_sessions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.sso_login_sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: sso_user_mappings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.sso_user_mappings ENABLE ROW LEVEL SECURITY;

--
-- Name: stripe_customers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.stripe_customers ENABLE ROW LEVEL SECURITY;

--
-- Name: stripe_usage_records; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.stripe_usage_records ENABLE ROW LEVEL SECURITY;

--
-- Name: subscription_plans; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

--
-- Name: subscriptions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

--
-- Name: system_metrics; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.system_metrics ENABLE ROW LEVEL SECURITY;

--
-- Name: team_members; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

--
-- Name: team_round_robin; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.team_round_robin ENABLE ROW LEVEL SECURITY;

--
-- Name: teams; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

--
-- Name: testimonials; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

--
-- Name: unified_search_analytics; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.unified_search_analytics ENABLE ROW LEVEL SECURITY;

--
-- Name: usage_tracking; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;

--
-- Name: user_activity_log; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_activity_log ENABLE ROW LEVEL SECURITY;

--
-- Name: user_mfa_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_mfa_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- Name: user_sessions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: user_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: user_subscriptions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

--
-- Name: workflow_execution_queue; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.workflow_execution_queue ENABLE ROW LEVEL SECURITY;

--
-- Name: workflow_execution_steps; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.workflow_execution_steps ENABLE ROW LEVEL SECURITY;

--
-- Name: workflow_executions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.workflow_executions ENABLE ROW LEVEL SECURITY;

--
-- Name: workflow_node_templates; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.workflow_node_templates ENABLE ROW LEVEL SECURITY;

--
-- Name: workflow_templates; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.workflow_templates ENABLE ROW LEVEL SECURITY;

--
-- Name: workflow_triggers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.workflow_triggers ENABLE ROW LEVEL SECURITY;

--
-- Name: workflow_versions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.workflow_versions ENABLE ROW LEVEL SECURITY;

--
-- Name: workflows; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.workflows ENABLE ROW LEVEL SECURITY;

--
-- Name: yandex_webmaster_oauth_credentials; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.yandex_webmaster_oauth_credentials ENABLE ROW LEVEL SECURITY;

--
-- Name: yandex_webmaster_search_data; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.yandex_webmaster_search_data ENABLE ROW LEVEL SECURITY;

--
-- Name: yandex_webmaster_sites; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.yandex_webmaster_sites ENABLE ROW LEVEL SECURITY;




