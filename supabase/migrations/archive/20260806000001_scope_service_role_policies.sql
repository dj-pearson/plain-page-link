-- US-063: Scope the service-role RLS policies so `anon` cannot read or write them.
--
-- Sixteen policies were written as
--
--   CREATE POLICY "Service role can manage X" ON t FOR ALL USING (true);
--
-- with no TO clause. Postgres defaults an omitted TO clause to TO PUBLIC, and
-- hosted Supabase grants ALL on every table in `public` to `anon` and
-- `authenticated` (see scripts/supabase-prelude.sql). The anon key ships in the
-- frontend bundle, so each of these policies granted every anonymous visitor
-- unrestricted access to the table.
--
-- Reproduced against a rebuilt schema before this migration:
--   SET ROLE anon; DELETE FROM audit_logs;                        -> DELETE 5
--   SET ROLE anon; UPDATE user_subscriptions SET status='active'; -> UPDATE 1
--
-- This is the same defect fixed for `team_round_robin` in 20260730000004,
-- applied to the rest of the schema.
--
-- Safety of narrowing these to service_role, verified table by table:
--   * Every edge function that writes these tables constructs its client with
--     SUPABASE_SERVICE_ROLE_KEY. The one exception, _shared/db-monitor.ts
--     (query_metrics), has no callers.
--   * Every in-database writer (log_audit_event, notify_new_lead,
--     record_login_attempt, check_rate_limit, update_usage_count,
--     log_encryption_operation, start_workflow_execution) is SECURITY DEFINER
--     and so runs as the table owner, which bypasses RLS.
--   * Every user-facing read path already has its own owner-scoped or
--     admin-scoped policy, which this migration leaves untouched. The one gap
--     that narrowing opened -- the admin health dashboard's cross-user read of
--     user_subscriptions -- is closed at the bottom of this file.
--
-- service_role is BYPASSRLS on hosted Supabase, so these policies are belt and
-- braces rather than load-bearing. They are recreated rather than dropped so
-- the original intent stays legible in the schema.

-- ---------------------------------------------------------------------------
-- FOR ALL policies (twelve tables)
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "Service role can manage deletion schedule" ON public.account_deletion_scheduled;
CREATE POLICY "Service role can manage deletion schedule"
  ON public.account_deletion_scheduled FOR ALL TO service_role
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can manage audit logs" ON public.audit_logs;
CREATE POLICY "Service role can manage audit logs"
  ON public.audit_logs FOR ALL TO service_role
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can manage GDPR requests" ON public.gdpr_data_requests;
CREATE POLICY "Service role can manage GDPR requests"
  ON public.gdpr_data_requests FOR ALL TO service_role
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can manage login attempts" ON public.login_attempts;
CREATE POLICY "Service role can manage login attempts"
  ON public.login_attempts FOR ALL TO service_role
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role manages temp codes" ON public.mfa_temp_codes;
CREATE POLICY "Service role manages temp codes"
  ON public.mfa_temp_codes FOR ALL TO service_role
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role manages rate limits" ON public.rate_limit_entries;
CREATE POLICY "Service role manages rate limits"
  ON public.rate_limit_entries FOR ALL TO service_role
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role manages SSO sessions" ON public.sso_login_sessions;
CREATE POLICY "Service role manages SSO sessions"
  ON public.sso_login_sessions FOR ALL TO service_role
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can manage usage" ON public.usage_tracking;
CREATE POLICY "Service role can manage usage"
  ON public.usage_tracking FOR ALL TO service_role
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can manage sessions" ON public.user_sessions;
CREATE POLICY "Service role can manage sessions"
  ON public.user_sessions FOR ALL TO service_role
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can manage subscriptions" ON public.user_subscriptions;
CREATE POLICY "Service role can manage subscriptions"
  ON public.user_subscriptions FOR ALL TO service_role
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role manages queue" ON public.workflow_execution_queue;
CREATE POLICY "Service role manages queue"
  ON public.workflow_execution_queue FOR ALL TO service_role
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role manages executions" ON public.workflow_executions;
CREATE POLICY "Service role manages executions"
  ON public.workflow_executions FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- FOR INSERT policies (four tables)
--
-- Same defect, narrower blast radius: anon could forge rows rather than read or
-- destroy them. `notifications` is the one that matters -- an INSERT policy open
-- to PUBLIC let any visitor put arbitrary title/message/data into any user's
-- notification bell, which is a phishing surface inside the authenticated UI.
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "Service role can insert verification logs" ON public.mfa_verification_logs;
CREATE POLICY "Service role can insert verification logs"
  ON public.mfa_verification_logs FOR INSERT TO service_role
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role inserts notifications" ON public.notifications;
CREATE POLICY "Service role inserts notifications"
  ON public.notifications FOR INSERT TO service_role
  WITH CHECK (true);

DROP POLICY IF EXISTS "System can insert encryption audit" ON public.pii_encryption_audit;
CREATE POLICY "System can insert encryption audit"
  ON public.pii_encryption_audit FOR INSERT TO service_role
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role writes query metrics" ON public.query_metrics;
CREATE POLICY "Service role writes query metrics"
  ON public.query_metrics FOR INSERT TO service_role
  WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- Restore the one read path the narrowing above would otherwise have broken.
--
-- src/pages/admin/HealthDashboard.tsx (US-050) reads plan_name/status across
-- every user's subscription. That worked only because the blanket policy above
-- was open to PUBLIC; the table's only other policy is "Users can view their own
-- subscription". Give admins an explicit cross-user read, matching the
-- has_role() pattern audit_logs, query_metrics and pii_encryption_audit
-- already use.
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "Admins can view all subscriptions" ON public.user_subscriptions;
CREATE POLICY "Admins can view all subscriptions"
  ON public.user_subscriptions FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));
