-- ===========================================================================
-- Account deletion processor (Right to Delete — CCPA / US state privacy laws)
-- ===========================================================================
-- Before this migration, request_account_deletion() only SCHEDULED a deletion
-- (a row in account_deletion_scheduled); nothing ever executed it, so accounts
-- were never actually erased after the 30-day grace period.
--
-- This migration adds the missing processor. Applying it is NON-DESTRUCTIVE:
-- it only creates a log table and a function. No account is deleted until you
-- explicitly schedule process_scheduled_account_deletions() (see the pg_cron
-- block at the bottom) or invoke the `process-account-deletions` edge function.
-- ===========================================================================

-- Durable erasure record. Intentionally has NO foreign key to auth.users, so it
-- survives the ON DELETE CASCADE that fires when the user is deleted. Stores no
-- personal data beyond the user id — just enough to prove the erasure happened.
CREATE TABLE IF NOT EXISTS account_deletion_log (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL,               -- plain uuid, deliberately not an FK
  gdpr_request_id UUID,
  scheduled_for  TIMESTAMPTZ,
  requested_at   TIMESTAMPTZ,
  deleted_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  status         TEXT NOT NULL DEFAULT 'completed'
                   CHECK (status IN ('completed', 'failed')),
  error_detail   TEXT
);

COMMENT ON TABLE account_deletion_log IS
  'Permanent audit trail of executed account erasures. No FK to auth.users so records survive the cascade delete. Contains no personal data beyond the user id.';

-- Only the service role (which bypasses RLS) should read this table.
ALTER TABLE account_deletion_log ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- Executes every scheduled deletion whose 30-day grace period has elapsed.
-- Returns the number of accounts erased. Each account is processed in its own
-- subtransaction so one failure does not abort the batch.
--
-- SECURITY DEFINER so it can delete from auth.users; EXECUTE is granted only to
-- service_role (see below), never to anon/authenticated.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION process_scheduled_account_deletions()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
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

REVOKE ALL ON FUNCTION process_scheduled_account_deletions() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION process_scheduled_account_deletions() TO service_role;

-- ---------------------------------------------------------------------------
-- OPTIONAL — schedule it. Left commented so applying this migration does NOT
-- begin deleting accounts. Enable ONE of the following once you are ready:
--
-- (a) pg_cron, daily at 03:00 UTC:
--       create extension if not exists pg_cron;
--       select cron.schedule(
--         'process-account-deletions',
--         '0 3 * * *',
--         $cron$ select public.process_scheduled_account_deletions(); $cron$
--       );
--
-- (b) call the `process-account-deletions` edge function from your existing
--     scheduler, authenticated with the service-role key.
-- ---------------------------------------------------------------------------
