-- US-353: the account-deletion schedule and GDPR request rows are written by
-- the system only.
--
-- Same shape as US-322 (notifications). Two baseline policies were written
-- FOR UPDATE USING (owner ...) with no TO clause and no WITH CHECK, on tables
-- where Supabase leaves INSERT/UPDATE/DELETE granted to anon and
-- authenticated. Postgres checks the row, not which columns change, so the
-- owner could rewrite every column of a row the system wrote:
--
-- account_deletion_scheduled — "Users can cancel own deletion"
--   USING (auth.uid() = user_id AND cancelled = false AND executed = false).
--   The omitted WITH CHECK defaults to USING, so it could never actually be
--   used to cancel (cancelled = true fails the check). What it did allow, on a
--   pending deletion:
--   * stripe_subscription_id / prior_cancel_at_period_end (US-250). On cancel,
--     gdpr-deletion reads these and calls Stripe with the platform key to
--     switch renewal back on. An agent who requested deletion, pointed the row
--     at another customer's subscription id with prior = false, and then
--     cancelled, made AgentBio un-cancel that customer's subscription — they
--     keep being charged after choosing to leave. (restoreBillingAfterCancel
--     now also refuses a subscription not on the caller's own row.)
--   * gdpr_request_id. process_scheduled_account_deletions() marks that
--     request completed when it erases the account, so it could close another
--     user's GDPR request.
--   * scheduled_for, reason, data_backup_url, ip_address — the record of what
--     the subject asked for and when.
--
-- gdpr_data_requests — "Users can cancel own pending GDPR requests"
--   USING (auth.uid() = user_id AND status = 'pending'), plus
--   "Users can create own GDPR requests" WITH CHECK (auth.uid() = user_id).
--   An owner could insert a request already 'completed' with any file_url, or
--   rewrite request_type / file_url / verification fields on a pending one.
--   These rows are the compliance record of a subject access or erasure
--   request; the export processor (US-291) will hand file_url to the subject.
--
-- Nothing in the browser writes either table. Every write goes through
-- SECURITY DEFINER functions owned by postgres (request_account_deletion,
-- cancel_account_deletion, request_gdpr_data_export,
-- process_scheduled_account_deletions) or the service role (gdpr-deletion's
-- rememberSubscription, gdpr-export closing its request). Cancelling a
-- deletion is cancel_account_deletion via gdpr-deletion, not a table UPDATE.
--
-- So: revoke the browser roles' write grants (TRUNCATE included — it is not
-- subject to RLS) and drop the owner write policies. SELECT is unchanged:
-- gdpr-deletion's status read uses the caller's JWT, and the owner keeps
-- reading their own rows. The service_role "manage" policies are unchanged.

REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.account_deletion_scheduled FROM PUBLIC, anon, authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.gdpr_data_requests FROM PUBLIC, anon, authenticated;

DROP POLICY IF EXISTS "Users can cancel own deletion" ON public.account_deletion_scheduled;
DROP POLICY IF EXISTS "Users can cancel own pending GDPR requests" ON public.gdpr_data_requests;
DROP POLICY IF EXISTS "Users can create own GDPR requests" ON public.gdpr_data_requests;

COMMENT ON TABLE public.account_deletion_scheduled IS
  'Pending account erasures. System-written only (US-353): request_account_deletion / cancel_account_deletion / process_scheduled_account_deletions and the service role. The owner may SELECT their row; stripe_subscription_id and gdpr_request_id are pointers the system acts on and must not be caller-writable.';
COMMENT ON TABLE public.gdpr_data_requests IS
  'GDPR subject access / export / erasure requests — the compliance record. System-written only (US-353): request_gdpr_data_export / request_account_deletion and the service role. The owner may SELECT their rows.';
