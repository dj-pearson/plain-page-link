-- US-615 (prd US-605): past-due grace runs from the end of the paid period.
--
-- 20260902000015 gave a past_due subscription its plan until
-- current_period_end + 7 days, and said that was "seven days from the end of
-- the paid period". It is not. When a renewal fails, Stripe has already moved
-- the subscription into the new period: current_period_start is the moment
-- the paid period ended and current_period_end is the end of the period that
-- has not been paid for. stripe-webhook stores both as Stripe reports them, so
-- the grace ran a whole billing period plus seven days -- about 37 days of paid
-- features without payment on a monthly plan, about a year on an annual one, if
-- the Stripe account leaves subscriptions past_due after its retries instead
-- of cancelling them.
--
-- A past_due subscription is one whose renewal failed: create-checkout-session
-- changes plans with proration_behavior 'create_prorations', so a plan change
-- is billed on the next renewal invoice rather than mid-period, and a first
-- payment that fails leaves the subscription 'incomplete', not past_due. The
-- end of the last paid period is therefore current_period_start. A row with no
-- current_period_start recorded (older rows written before the webhook stored
-- it) falls back to current_period_end, the previous behaviour, rather than
-- losing the plan on a missing column.
--
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
      -- seven days from the end of the last PAID period, which Stripe reports
      -- as current_period_start once it has rolled into the unpaid one.
      OR (
        us.status = 'past_due'
        AND COALESCE(us.current_period_start, us.current_period_end) IS NOT NULL
        AND COALESCE(us.current_period_start, us.current_period_end) > now() - interval '7 days'
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
  'US-235/US-605: the plan an agent''s subscription entitles them to, for any id. A cancelled subscription keeps its plan until current_period_end; past_due keeps it for 7 days after the paid period ended (current_period_start). Not executable by the browser; get_user_plan is the checked entry point.';
