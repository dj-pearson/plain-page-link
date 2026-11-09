-- US-615 (prd US-605): past-due grace runs from when payment stopped, not
-- from the end of the unpaid period.
--
-- 20260902000015 gave a past_due subscription its plan until
-- current_period_end + 7 days, and said that was "seven days from the end of
-- the paid period". It is not. When a renewal fails, Stripe has already moved
-- the subscription into the new period, so current_period_end is the end of
-- the period that has not been paid for. The grace ran a whole billing period
-- plus seven days, and for a Stripe account that leaves subscriptions past_due
-- after its retries rather than cancelling them, it never ran out: every new
-- period pushed current_period_end forward again.
--
-- No Stripe period field answers "when did payment stop". current_period_start
-- is the end of the paid period only after the FIRST failed renewal: a
-- subscription left past_due keeps rolling into new periods (each one fires
-- customer.subscription.updated, which stores the new start), so after the
-- second unpaid renewal current_period_start is the end of an unpaid period
-- and a start-anchored grace reopens for another seven days every period.
-- Stripe's 'unpaid' is stored as past_due too (toStoredStatus) and rolls the
-- same way.
--
-- So the row records the moment itself. user_subscriptions.past_due_since is
-- set by trigger when status changes INTO past_due, kept while the row stays
-- past_due however often the period rolls, and cleared when status leaves
-- past_due. The webhook never writes it. resolve_user_plan anchors the grace on
-- COALESCE(past_due_since, current_period_start, current_period_end); the
-- fallbacks only matter for a row the trigger has not seen enter past_due.
-- Existing past_due rows are backfilled from current_period_start, the best
-- evidence available for them (exact unless their period has rolled more than
-- once since the failure).

ALTER TABLE public.user_subscriptions
  ADD COLUMN IF NOT EXISTS past_due_since timestamptz;

COMMENT ON COLUMN public.user_subscriptions.past_due_since IS
  'US-605: when status last changed into past_due. Maintained by trigger (set on entering past_due, kept while it stays past_due, cleared on leaving); never written by the webhook. Anchors the past_due grace in resolve_user_plan.';

CREATE OR REPLACE FUNCTION public.user_subscriptions_track_past_due()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, extensions, pg_temp
AS $function$
BEGIN
  IF NEW.status IS DISTINCT FROM 'past_due' THEN
    NEW.past_due_since := NULL;
  ELSIF TG_OP = 'INSERT' THEN
    NEW.past_due_since := COALESCE(NEW.past_due_since, now());
  ELSIF OLD.status IS DISTINCT FROM 'past_due' THEN
    -- Entering past_due: the clock starts now, whatever the writer sent.
    NEW.past_due_since := now();
  ELSE
    -- Staying past_due (a period roll, a retried invoice): keep the moment it
    -- entered. A writer may move it explicitly but not clear it.
    NEW.past_due_since := COALESCE(NEW.past_due_since, OLD.past_due_since, now());
  END IF;
  RETURN NEW;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.user_subscriptions_track_past_due() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS user_subscriptions_track_past_due ON public.user_subscriptions;
CREATE TRIGGER user_subscriptions_track_past_due
  BEFORE INSERT OR UPDATE ON public.user_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.user_subscriptions_track_past_due();

-- Backfill rows already past_due. The UPDATE stays past_due, so the trigger
-- keeps the value written here.
UPDATE public.user_subscriptions
   SET past_due_since = COALESCE(current_period_start, current_period_end, now())
 WHERE status = 'past_due' AND past_due_since IS NULL;

-- Body otherwise unchanged from 20260902000015. 20261028000003 renamed it to
-- resolve_user_plan behind the caller-checked get_user_plan wrapper; grants
-- are restated so the file stands on its own.

CREATE OR REPLACE FUNCTION public.resolve_user_plan(_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $function$
DECLARE
  plan_data JSONB;
BEGIN
  SELECT jsonb_build_object(
    'plan_name', sp.name,
    'limits', sp.limits,
    'features', sp.features,
    'status', us.status,
    'cancel_at_period_end', COALESCE(us.cancel_at_period_end, false),
    'current_period_end', us.current_period_end,
    'stripe_price_id', COALESCE(sp.stripe_price_id_monthly, sp.stripe_price_id),
    'stripe_price_id_yearly', sp.stripe_price_id_yearly,
    'price_monthly', sp.price_monthly,
    'price_yearly', sp.price_yearly
  ) INTO plan_data
  FROM user_subscriptions us
  JOIN subscription_plans sp ON us.plan_id = sp.id
  WHERE us.user_id = _user_id
    AND (
      -- Paying, or in a Stripe trial.
      us.status IN ('active', 'trialing')

      -- Cancelled but paid through the end of the period. ('canceled' has one
      -- 'l': subscription_status is an enum and 'cancelled' raises at run time.)
      OR (
        us.status = 'canceled'
        AND us.current_period_end IS NOT NULL
        AND us.current_period_end > now()
      )

      -- A failed renewal is a dunning problem, not an immediate downgrade:
      -- seven days from when the row went past_due. Not from a Stripe period
      -- field: those keep rolling while the subscription stays past_due.
      OR (
        us.status = 'past_due'
        AND COALESCE(us.past_due_since, us.current_period_start, us.current_period_end) IS NOT NULL
        AND COALESCE(us.past_due_since, us.current_period_start, us.current_period_end) > now() - interval '7 days'
      )
    )
  -- With more than one qualifying row, the one that runs longest wins rather
  -- than whichever the planner happened to return.
  ORDER BY us.current_period_end DESC NULLS LAST
  LIMIT 1;

  IF plan_data IS NULL THEN
    SELECT jsonb_build_object(
      'plan_name', 'free',
      'limits', limits,
      'features', features,
      'status', 'free',
      'cancel_at_period_end', false,
      'stripe_price_id', stripe_price_id_monthly,
      'stripe_price_id_yearly', stripe_price_id_yearly,
      'price_monthly', price_monthly,
      'price_yearly', price_yearly
    ) INTO plan_data
    FROM subscription_plans
    WHERE name = 'free' AND is_active = true;

    -- An entitlement function that returns NULL is worse than one that
    -- returns the most restrictive answer.
    IF plan_data IS NULL THEN
      plan_data := jsonb_build_object(
        'plan_name', 'free',
        'limits', jsonb_build_object(
          'listings', 3,
          'links', 5,
          'testimonials', 3,
          'sold_properties', 3,
          'analytics_days', 30
        ),
        'features', jsonb_build_object(),
        'status', 'free',
        'cancel_at_period_end', false,
        'price_monthly', 0,
        'price_yearly', 0
      );
    END IF;
  END IF;

  RETURN plan_data;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.resolve_user_plan(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_user_plan(uuid) TO service_role;

COMMENT ON FUNCTION public.resolve_user_plan(uuid) IS
  'US-235/US-605: the plan an agent''s subscription entitles them to, for any id. A cancelled subscription keeps its plan until current_period_end; past_due keeps it for 7 days after the row went past_due (past_due_since, set by trigger). Not executable by the browser; get_user_plan is the checked entry point.';
