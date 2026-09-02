-- US-118: a paid-up agent lost their plan the moment they clicked "cancel".
--
-- Two halves of the same defect:
--
--   1. stripe-webhook, on customer.subscription.updated, did
--        if (subscription.cancel_at_period_end) status = 'canceled'
--      and wrote that to user_subscriptions. Stripe's own status at that
--      moment is still 'active' — the subscription is paid through the end of
--      the period and cancel_at_period_end is a separate boolean, which the
--      webhook was already storing correctly in its own column. Overwriting
--      the status threw away the distinction.
--
--   2. get_user_plan joins `WHERE us.status = 'active'`, so the moment that
--      row said 'canceled' the agent fell through to the free plan — losing
--      the features they had already paid for, weeks early. invoice.payment_failed
--      wrote 'past_due' with the same effect and no grace at all, so a card that
--      expired on a Tuesday cut off access on the Tuesday.
--
-- The webhook stops corrupting the status (see the function change in the same
-- story). This makes get_user_plan robust regardless: entitlement follows what
-- the agent has paid for, not the label.

CREATE OR REPLACE FUNCTION public.get_user_plan(_user_id uuid)
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

      -- Cancelled but paid through the end of the period. This is the case
      -- that cost agents weeks of the plan they had bought.
      OR (
        -- One 'l'. subscription_status is an enum whose label is 'canceled';
        -- 'cancelled' is not a member and comparing against it raises
        -- "invalid input value for enum subscription_status" at run time, not
        -- at CREATE FUNCTION time.
        us.status = 'canceled'
        AND us.current_period_end IS NOT NULL
        AND us.current_period_end > now()
      )

      -- A failed payment is a dunning problem, not an immediate downgrade.
      -- Stripe retries for days; cutting access off on the first failure means
      -- an expired card takes the agent's public page features away before
      -- anyone has told them. Seven days from the end of the paid period, which
      -- is inside Stripe's own default retry schedule.
      OR (
        us.status = 'past_due'
        AND us.current_period_end IS NOT NULL
        AND us.current_period_end > now() - interval '7 days'
      )
    )
  -- With more than one qualifying row, the one that runs longest wins rather
  -- than whichever the planner happened to return: SELECT ... INTO takes the
  -- first row silently.
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

    -- The table is seeded by 20260902000014, so this should be unreachable.
    -- Kept because an entitlement function that returns NULL is worse than one
    -- that returns the most restrictive answer.
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

COMMENT ON FUNCTION public.get_user_plan(uuid) IS
  'US-118: entitlement follows what the agent has paid for. A cancelled subscription keeps its plan until current_period_end; past_due keeps it for 7 days past that.';
