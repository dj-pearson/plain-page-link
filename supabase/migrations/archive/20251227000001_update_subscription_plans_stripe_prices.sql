-- =============================================
-- Update Subscription Plans with Stripe Price IDs
-- =============================================
-- This migration adds support for separate monthly and yearly Stripe price IDs
-- and updates the existing plans with the correct pricing structure.
--
-- After running the setup-stripe-products script, update the price IDs below
-- with the actual values from Stripe.
-- =============================================

-- 1. Add stripe_price_id_yearly column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscription_plans'
    AND column_name = 'stripe_price_id_yearly'
  ) THEN
    ALTER TABLE subscription_plans
    ADD COLUMN stripe_price_id_yearly TEXT;
  END IF;
END $$;

-- 2. Rename existing stripe_price_id to stripe_price_id_monthly for clarity
-- (keeping stripe_price_id as an alias for backwards compatibility)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscription_plans'
    AND column_name = 'stripe_price_id_monthly'
  ) THEN
    ALTER TABLE subscription_plans
    ADD COLUMN stripe_price_id_monthly TEXT;

    -- Copy existing values
    UPDATE subscription_plans
    SET stripe_price_id_monthly = stripe_price_id;
  END IF;
END $$;

-- 3. Add payment_link columns for direct checkout links
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscription_plans'
    AND column_name = 'payment_link_monthly'
  ) THEN
    ALTER TABLE subscription_plans
    ADD COLUMN payment_link_monthly TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscription_plans'
    AND column_name = 'payment_link_yearly'
  ) THEN
    ALTER TABLE subscription_plans
    ADD COLUMN payment_link_yearly TEXT;
  END IF;
END $$;

-- 4. Update existing plans with correct pricing
-- Note: stripe_price_id values are placeholders - update after running setup script
UPDATE subscription_plans SET
  price_monthly = 0,
  price_yearly = 0,
  stripe_price_id_monthly = NULL,
  stripe_price_id_yearly = NULL,
  limits = '{"listings": 3, "links": 5, "testimonials": 3, "analytics_days": 7, "themes": 1}'::jsonb,
  features = '{"lead_capture": true, "support": "community"}'::jsonb
WHERE name = 'free';

UPDATE subscription_plans SET
  price_monthly = 19,
  price_yearly = 189,
  -- UPDATE THESE AFTER RUNNING setup-stripe-products script:
  -- stripe_price_id_monthly = 'price_xxx',
  -- stripe_price_id_yearly = 'price_xxx',
  limits = '{"listings": 10, "sold_properties": 10, "links": 15, "testimonials": 10, "analytics_days": 90, "themes": 3}'::jsonb,
  features = '{"lead_capture": true, "calendar_integration": true, "email_support": true, "support": "email_72hr"}'::jsonb
WHERE name = 'starter';

UPDATE subscription_plans SET
  price_monthly = 39,
  price_yearly = 389,
  -- UPDATE THESE AFTER RUNNING setup-stripe-products script:
  -- stripe_price_id_monthly = 'price_xxx',
  -- stripe_price_id_yearly = 'price_xxx',
  limits = '{"listings": 25, "sold_properties": -1, "links": -1, "testimonials": 25, "analytics_days": 365, "themes": 10}'::jsonb,
  features = '{"lead_capture": true, "calendar_integration": true, "home_valuation": true, "custom_colors": true, "qr_codes": true, "lead_export": true, "remove_branding": true, "custom_domain": true, "advanced_analytics": true, "support": "email_48hr"}'::jsonb
WHERE name = 'professional';

UPDATE subscription_plans SET
  price_monthly = 29,
  price_yearly = 289,
  -- UPDATE THESE AFTER RUNNING setup-stripe-products script:
  -- stripe_price_id_monthly = 'price_xxx',
  -- stripe_price_id_yearly = 'price_xxx',
  limits = '{"listings": -1, "sold_properties": -1, "links": -1, "testimonials": -1, "analytics_days": 730, "themes": -1}'::jsonb,
  features = '{"team_dashboard": true, "shared_assets": true, "team_branding": true, "team_directory": true, "multi_user": true, "priority_support": true, "onboarding_call": true, "custom_domain": true, "remove_branding": true, "support": "priority"}'::jsonb
WHERE name = 'team';

UPDATE subscription_plans SET
  price_monthly = 99,
  price_yearly = 989,
  -- UPDATE THESE AFTER RUNNING setup-stripe-products script:
  -- stripe_price_id_monthly = 'price_xxx',
  -- stripe_price_id_yearly = 'price_xxx',
  limits = '{"listings": -1, "sold_properties": -1, "links": -1, "testimonials": -1, "analytics_days": -1, "themes": -1}'::jsonb,
  features = '{"white_label": true, "custom_domain": true, "custom_css": true, "sso": true, "dedicated_manager": true, "phone_support": true, "lead_routing": true, "api_access": true, "support": "dedicated"}'::jsonb
WHERE name = 'enterprise';

-- 5. Create helper function to get price ID based on interval
CREATE OR REPLACE FUNCTION get_stripe_price_id(
  _plan_name TEXT,
  _interval TEXT DEFAULT 'month'
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- 6. Create helper function to get payment link
CREATE OR REPLACE FUNCTION get_payment_link(
  _plan_name TEXT,
  _interval TEXT DEFAULT 'month'
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- 7. Update get_user_plan function to include stripe_price_id
CREATE OR REPLACE FUNCTION get_user_plan(_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- 8. Add comments
COMMENT ON COLUMN subscription_plans.stripe_price_id_monthly IS 'Stripe price ID for monthly billing';
COMMENT ON COLUMN subscription_plans.stripe_price_id_yearly IS 'Stripe price ID for yearly billing';
COMMENT ON COLUMN subscription_plans.payment_link_monthly IS 'Stripe payment link for monthly checkout';
COMMENT ON COLUMN subscription_plans.payment_link_yearly IS 'Stripe payment link for yearly checkout';
COMMENT ON FUNCTION get_stripe_price_id IS 'Get the Stripe price ID for a plan based on billing interval';
COMMENT ON FUNCTION get_payment_link IS 'Get the payment link URL for a plan based on billing interval';

-- =============================================
-- INSTRUCTIONS FOR UPDATING STRIPE PRICE IDs
-- =============================================
-- After running the setup-stripe-products script:
--
-- 1. Get the price IDs from the script output
-- 2. Run these UPDATE statements with the actual values:
--
-- UPDATE subscription_plans SET
--   stripe_price_id_monthly = 'price_xxx',
--   stripe_price_id_yearly = 'price_xxx',
--   payment_link_monthly = 'https://buy.stripe.com/xxx',
--   payment_link_yearly = 'https://buy.stripe.com/xxx'
-- WHERE name = 'starter';
--
-- UPDATE subscription_plans SET
--   stripe_price_id_monthly = 'price_xxx',
--   stripe_price_id_yearly = 'price_xxx',
--   payment_link_monthly = 'https://buy.stripe.com/xxx',
--   payment_link_yearly = 'https://buy.stripe.com/xxx'
-- WHERE name = 'professional';
--
-- UPDATE subscription_plans SET
--   stripe_price_id_monthly = 'price_xxx',
--   stripe_price_id_yearly = 'price_xxx',
--   payment_link_monthly = 'https://buy.stripe.com/xxx',
--   payment_link_yearly = 'https://buy.stripe.com/xxx'
-- WHERE name = 'team';
--
-- UPDATE subscription_plans SET
--   stripe_price_id_monthly = 'price_xxx',
--   stripe_price_id_yearly = 'price_xxx',
--   payment_link_monthly = 'https://buy.stripe.com/xxx',
--   payment_link_yearly = 'https://buy.stripe.com/xxx'
-- WHERE name = 'enterprise';
-- =============================================
