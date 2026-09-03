-- US-118: subscription_plans is empty, and three other places each hold their
-- own copy of what a plan is.
--
-- Nothing has ever seeded this table. Pricing.tsx reads it, so a fresh
-- environment renders an empty pricing grid; get_user_plan joins it, so every
-- agent falls through to its hard-coded free-plan fallback; and the numbers
-- that ARE shown come from two other places that disagree with each other and
-- with the webhook:
--
--   src/config/pricing-plans.ts   free/29/49/99/299, analytics 30 days on free
--   stripe-webhook getPlanLimits  its own table, analytics 7 days on free
--   Pricing.tsx copy and JSON-LD  Starter $19, Professional $39, Team $29/agent
--
-- This makes the table the source of truth. The frontend config keeps the
-- feature-matrix copy it is good at; the numbers that decide what an agent can
-- do come from here, and the webhook reads them from here rather than
-- restating them.
--
-- The Stripe price ids are deliberately NULL. They are environment-specific
-- (test vs live) and belong to the Stripe account, not to a migration.
-- src/config/pricing-plans.ts carried literals — 'price_starter_monthly' and
-- friends — which passed create-checkout-session's /^price_/ check and were
-- then rejected by Stripe with "No such price", surfacing to the agent as
-- "Could not start checkout". A NULL is honest: the UI says the plan is not
-- purchasable yet rather than failing at the till. Fill them in with
-- scripts/setup-stripe-products.sh, or by hand.

-- `name` is the key everything actually uses — get_user_plan looks up
-- WHERE name = 'free', the webhook maps a Stripe price to a plan name — but
-- the table had no unique constraint on it. Two rows with the same name make
-- get_user_plan's SELECT ... INTO raise, so this is required before the seed
-- can be idempotent at all. Older environments carry duplicate legacy rows,
-- so consolidate each name before creating the constraint. The oldest row is
-- retained, existing Stripe configuration is merged into it, and every
-- user_subscriptions reference is repointed before redundant rows are removed.
DO $$
DECLARE
  duplicate_name text;
  canonical_plan_id uuid;
BEGIN
  FOR duplicate_name IN
    SELECT name
    FROM public.subscription_plans
    GROUP BY name
    HAVING count(*) > 1
  LOOP
    SELECT id INTO canonical_plan_id
    FROM public.subscription_plans
    WHERE name = duplicate_name
    ORDER BY created_at ASC NULLS LAST, id ASC
    LIMIT 1;

    UPDATE public.subscription_plans canonical
    SET
      stripe_price_id = COALESCE(canonical.stripe_price_id, (
        SELECT duplicate.stripe_price_id
        FROM public.subscription_plans duplicate
        WHERE duplicate.name = duplicate_name
          AND duplicate.id <> canonical_plan_id
          AND duplicate.stripe_price_id IS NOT NULL
        ORDER BY duplicate.created_at ASC NULLS LAST, duplicate.id ASC
        LIMIT 1
      )),
      stripe_price_id_monthly = COALESCE(canonical.stripe_price_id_monthly, (
        SELECT duplicate.stripe_price_id_monthly
        FROM public.subscription_plans duplicate
        WHERE duplicate.name = duplicate_name
          AND duplicate.id <> canonical_plan_id
          AND duplicate.stripe_price_id_monthly IS NOT NULL
        ORDER BY duplicate.created_at ASC NULLS LAST, duplicate.id ASC
        LIMIT 1
      )),
      stripe_price_id_yearly = COALESCE(canonical.stripe_price_id_yearly, (
        SELECT duplicate.stripe_price_id_yearly
        FROM public.subscription_plans duplicate
        WHERE duplicate.name = duplicate_name
          AND duplicate.id <> canonical_plan_id
          AND duplicate.stripe_price_id_yearly IS NOT NULL
        ORDER BY duplicate.created_at ASC NULLS LAST, duplicate.id ASC
        LIMIT 1
      )),
      payment_link_monthly = COALESCE(canonical.payment_link_monthly, (
        SELECT duplicate.payment_link_monthly
        FROM public.subscription_plans duplicate
        WHERE duplicate.name = duplicate_name
          AND duplicate.id <> canonical_plan_id
          AND duplicate.payment_link_monthly IS NOT NULL
        ORDER BY duplicate.created_at ASC NULLS LAST, duplicate.id ASC
        LIMIT 1
      )),
      payment_link_yearly = COALESCE(canonical.payment_link_yearly, (
        SELECT duplicate.payment_link_yearly
        FROM public.subscription_plans duplicate
        WHERE duplicate.name = duplicate_name
          AND duplicate.id <> canonical_plan_id
          AND duplicate.payment_link_yearly IS NOT NULL
        ORDER BY duplicate.created_at ASC NULLS LAST, duplicate.id ASC
        LIMIT 1
      ))
    WHERE canonical.id = canonical_plan_id;

    UPDATE public.user_subscriptions
    SET plan_id = canonical_plan_id
    WHERE plan_id IN (
      SELECT id
      FROM public.subscription_plans
      WHERE name = duplicate_name AND id <> canonical_plan_id
    );

    DELETE FROM public.subscription_plans
    WHERE name = duplicate_name AND id <> canonical_plan_id;
  END LOOP;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.subscription_plans'::regclass
      AND conname = 'subscription_plans_name_key'
  ) THEN
    ALTER TABLE public.subscription_plans
      ADD CONSTRAINT subscription_plans_name_key UNIQUE (name);
  END IF;
END $$;

INSERT INTO public.subscription_plans (name, price_monthly, price_yearly, sort_order, is_active, features, limits)
VALUES
  (
    'free', 0, 0, 0, true,
    jsonb_build_object(
      'analytics', true,
      'customThemes', false,
      'customDomain', false,
      'removeBranding', false,
      'prioritySupport', false,
      'leadScoring', false,
      'aiListingDescriptions', false
    ),
    jsonb_build_object(
      'listings', 3,
      'links', 5,
      'testimonials', 3,
      'sold_properties', 3,
      'leads_per_month', 10,
      'analytics_days', 30,
      'themes', 3
    )
  ),
  (
    'starter', 29, 290, 1, true,
    jsonb_build_object(
      'analytics', true,
      'customThemes', true,
      'customDomain', false,
      'removeBranding', false,
      'prioritySupport', false,
      'leadScoring', true,
      'aiListingDescriptions', true
    ),
    jsonb_build_object(
      'listings', 10,
      'links', 15,
      'testimonials', 10,
      'sold_properties', 10,
      'leads_per_month', 100,
      'analytics_days', 90,
      'themes', -1
    )
  ),
  (
    'professional', 49, 490, 2, true,
    jsonb_build_object(
      'analytics', true,
      'customThemes', true,
      'customDomain', true,
      'removeBranding', true,
      'prioritySupport', false,
      'leadScoring', true,
      'aiListingDescriptions', true
    ),
    jsonb_build_object(
      'listings', 25,
      'links', -1,
      'testimonials', 25,
      'sold_properties', 25,
      'leads_per_month', -1,
      'analytics_days', 365,
      'themes', -1
    )
  ),
  (
    'team', 99, 990, 3, true,
    jsonb_build_object(
      'analytics', true,
      'customThemes', true,
      'customDomain', true,
      'removeBranding', true,
      'prioritySupport', true,
      'leadScoring', true,
      'aiListingDescriptions', true
    ),
    jsonb_build_object(
      'listings', -1,
      'links', -1,
      'testimonials', -1,
      'sold_properties', -1,
      'leads_per_month', -1,
      'analytics_days', 730,
      'themes', -1
    )
  ),
  (
    'enterprise', 299, 2990, 4, true,
    jsonb_build_object(
      'analytics', true,
      'customThemes', true,
      'customDomain', true,
      'removeBranding', true,
      'prioritySupport', true,
      'leadScoring', true,
      'aiListingDescriptions', true
    ),
    jsonb_build_object(
      'listings', -1,
      'links', -1,
      'testimonials', -1,
      'sold_properties', -1,
      'leads_per_month', -1,
      'analytics_days', -1,
      'themes', -1
    )
  )
ON CONFLICT (name) DO UPDATE
SET
  price_monthly = EXCLUDED.price_monthly,
  price_yearly  = EXCLUDED.price_yearly,
  sort_order    = EXCLUDED.sort_order,
  is_active     = EXCLUDED.is_active,
  features      = EXCLUDED.features,
  -- Prices, features and limits are this migration's to own. The Stripe price
  -- ids and payment links are NOT re-set here: an operator fills those in per
  -- environment, and re-running this must not wipe them.
  limits        = EXCLUDED.limits,
  updated_at    = now();

COMMENT ON TABLE public.subscription_plans IS
  'US-118: the source of truth for plan prices, features and limits. Seeded by 20260902000014; Stripe price ids are set per environment, not by a migration.';
