-- US-250: a deleted account kept being billed.
--
-- gdpr-deletion scheduled the erasure and never told Stripe. When the grace
-- period ended, process_scheduled_account_deletions() deleted auth.users,
-- which cascades to user_subscriptions — the only record of the Stripe
-- subscription id. The subscription itself lived on at Stripe, charging the
-- card of an account that no longer existed, and nothing here could find it
-- again to stop it.
--
-- Two changes:
--
-- 1. account_deletion_scheduled remembers the subscription and the
--    cancel_at_period_end flag it had before the request set it, so cancelling
--    the request can put it back exactly as it was (a subscriber who had
--    already chosen to cancel stays cancelling).
--
-- 2. process_scheduled_account_deletions() refuses to erase an account whose
--    user_subscriptions row still shows a live Stripe subscription. The
--    scheduled-maintenance task cancels the subscription at Stripe first and
--    marks the row canceled; if Stripe fails, the row stays live and the
--    erasure waits for the next run instead of destroying the only pointer to
--    a subscription that is still charging. This holds for every caller of the
--    function, not just the one that knows about Stripe.

ALTER TABLE public.account_deletion_scheduled
  ADD COLUMN IF NOT EXISTS stripe_subscription_id text,
  ADD COLUMN IF NOT EXISTS prior_cancel_at_period_end boolean;

COMMENT ON COLUMN public.account_deletion_scheduled.stripe_subscription_id IS
  'US-250: the Stripe subscription gdpr-deletion set to cancel at period end when the deletion was requested.';
COMMENT ON COLUMN public.account_deletion_scheduled.prior_cancel_at_period_end IS
  'US-250: that subscription''s cancel_at_period_end before the request, restored if the request is cancelled. NULL when nothing was changed.';

CREATE OR REPLACE FUNCTION public.process_scheduled_account_deletions()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
DECLARE
  v_row   public.account_deletion_scheduled%ROWTYPE;
  v_live  text;
  v_count INTEGER := 0;
BEGIN
  FOR v_row IN
    SELECT *
    FROM public.account_deletion_scheduled
    WHERE cancelled = false
      AND executed = false
      AND scheduled_for <= now()
    ORDER BY scheduled_for ASC
  LOOP
    -- US-250: never erase the only record of a subscription that is still
    -- charging. The caller cancels it at Stripe and marks the row canceled
    -- first; until then the deletion waits and is retried on the next run.
    SELECT us.stripe_subscription_id INTO v_live
    FROM public.user_subscriptions us
    WHERE us.user_id = v_row.user_id
      AND us.stripe_subscription_id IS NOT NULL
      AND us.status IS DISTINCT FROM 'canceled'::public.subscription_status
    LIMIT 1;

    IF v_live IS NOT NULL THEN
      INSERT INTO public.account_deletion_log
        (user_id, gdpr_request_id, scheduled_for, requested_at, status, error_detail)
      VALUES
        (v_row.user_id, v_row.gdpr_request_id, v_row.scheduled_for, v_row.created_at,
         'failed', 'Stripe subscription ' || v_live || ' is still live; cancel it before erasure');
      CONTINUE;
    END IF;

    BEGIN
      -- Mark the GDPR/data request completed before the row cascades away.
      UPDATE public.gdpr_data_requests
        SET status       = 'completed',
            processed_at = now(),
            completed_at = now(),
            updated_at   = now()
        WHERE id = v_row.gdpr_request_id;

      -- Write the durable record first; it survives the cascade delete below.
      INSERT INTO public.account_deletion_log (user_id, gdpr_request_id, scheduled_for, requested_at)
      VALUES (v_row.user_id, v_row.gdpr_request_id, v_row.scheduled_for, v_row.created_at);

      -- Erase the user. FK ON DELETE CASCADE removes the profile and every
      -- dependent row, including this account_deletion_scheduled record itself.
      DELETE FROM auth.users WHERE id = v_row.user_id;

      v_count := v_count + 1;

    EXCEPTION WHEN OTHERS THEN
      -- The failed subtransaction (including its log insert) is rolled back.
      -- Record the failure durably and move on; the schedule row stays intact
      -- (executed = false) so it is retried on the next run.
      INSERT INTO public.account_deletion_log
        (user_id, gdpr_request_id, scheduled_for, requested_at, status, error_detail)
      VALUES
        (v_row.user_id, v_row.gdpr_request_id, v_row.scheduled_for, v_row.created_at,
         'failed', SQLERRM);
    END;
  END LOOP;

  RETURN v_count;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.process_scheduled_account_deletions() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.process_scheduled_account_deletions() TO service_role;

COMMENT ON FUNCTION public.process_scheduled_account_deletions() IS
  'US-250: erases due accounts, skipping (and logging) any whose user_subscriptions row still shows a live Stripe subscription. Service role only.';
