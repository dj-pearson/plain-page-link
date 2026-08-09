-- US-093: account deletion fails outright, and would orphan tenant data if it
-- did not.
--
-- process_scheduled_account_deletions() performs DELETE FROM auth.users, which
-- raises:
--   insert or update on table "audit_logs" violates foreign key constraint
--   "audit_logs_actor_id_fkey"
--
-- The chain: deleting auth.users cascades to profiles (FK ON DELETE CASCADE)
-- -> the audit_profiles_changes trigger fires -> audit_table_change() finds
-- auth.uid() NULL under the cron/service-role caller and falls back to the
-- row's own id -> log_audit_event() inserts that as user_id/actor_id -> both
-- reference an auth.users row already removed in the same statement -> FK
-- violation -> the whole DELETE aborts.
--
-- ON DELETE SET NULL on audit_logs does not help: the row is being INSERTED
-- with a dangling reference, not updated to one.
--
-- So a GDPR right-to-erasure request is accepted, scheduled, the 30-day grace
-- period elapses, and the job then errors forever — while process-account-deletions
-- reports success: true, processed: 0.
--
-- Two separate defects, both fixed here.

-- ===========================================================================
-- 1. The audit write must not reference a user that no longer exists
-- ===========================================================================
-- The erasure record itself must survive — losing the audit trail of a deletion
-- is worse than losing the actor on it — so the ids are nulled rather than the
-- insert skipped. audit_logs.user_id and actor_id are both nullable.
CREATE OR REPLACE FUNCTION public.log_audit_event(
  p_user_id uuid,
  p_action text,
  p_status text,
  p_resource_type text DEFAULT NULL::text,
  p_resource_id text DEFAULT NULL::text,
  p_ip_address inet DEFAULT NULL::inet,
  p_user_agent text DEFAULT NULL::text,
  p_details jsonb DEFAULT NULL::jsonb,
  p_risk_level text DEFAULT 'low'::text,
  p_actor_id uuid DEFAULT NULL::uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $function$
DECLARE
  v_log_id  UUID;
  v_user    UUID := p_user_id;
  v_actor   UUID := COALESCE(p_actor_id, p_user_id);
BEGIN
  -- US-093: during an account deletion the subject's auth.users row is already
  -- gone within the same statement, so a reference to it fails the FK and takes
  -- the whole DELETE down with it. Keep the record, drop the dangling ids.
  IF v_user IS NOT NULL AND NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = v_user) THEN
    v_user := NULL;
  END IF;

  IF v_actor IS NOT NULL AND NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = v_actor) THEN
    v_actor := NULL;
  END IF;

  INSERT INTO audit_logs (
    user_id, actor_id, action, resource_type, resource_id,
    status, ip_address, user_agent, details, risk_level
  )
  VALUES (
    v_user, v_actor, p_action, p_resource_type, p_resource_id,
    p_status, p_ip_address, p_user_agent, p_details, p_risk_level
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$function$;

-- ===========================================================================
-- 2. Erasure must actually erase
-- ===========================================================================
-- leads, listings, testimonials, user_settings, article_webhooks and
-- analytics_views carry a user_id with NO foreign key at all, so nothing
-- cascades to them. Those rows hold lead names, email addresses and phone
-- numbers — exactly what a right-to-erasure request is about.
--
-- Added NOT VALID: production may hold orphaned rows from before this, and a
-- validating ADD CONSTRAINT would fail on them. NOT VALID still enforces the
-- constraint on new rows and still performs ON DELETE CASCADE, which is what
-- this story needs. Sweep the orphans and run
--   ALTER TABLE <t> VALIDATE CONSTRAINT <name>;
-- as a follow-up.
DO $$
DECLARE
  t record;
BEGIN
  FOR t IN
    SELECT * FROM (VALUES
      ('leads'),
      ('listings'),
      ('testimonials'),
      ('user_settings'),
      ('article_webhooks'),
      ('analytics_views')
    ) AS v(table_name)
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint c
      WHERE c.conrelid = ('public.' || quote_ident(t.table_name))::regclass
        AND c.contype = 'f'
        AND c.conname = t.table_name || '_user_id_fkey'
    ) THEN
      EXECUTE format(
        'ALTER TABLE public.%I ADD CONSTRAINT %I
           FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE NOT VALID',
        t.table_name, t.table_name || '_user_id_fkey'
      );
    END IF;
  END LOOP;
END $$;

-- account_deletion_log records the erasure and must OUTLIVE the user, so it
-- deliberately gets no cascading foreign key.

COMMENT ON FUNCTION public.log_audit_event(uuid, text, text, text, text, inet, text, jsonb, text, uuid) IS
  'US-093: nulls user_id/actor_id when the referenced auth.users row is gone, so an account deletion cannot be aborted by its own audit trail.';
