-- =============================================
-- Billing Schema Consolidation Migration
-- =============================================
-- This migration consolidates the billing infrastructure by:
-- 1. Creating missing tables referenced in code (feature_usage, feature_catalog, etc.)
-- 2. Adding usage-based billing support
-- 3. Creating unified views for subscription data
-- 4. Adding helper functions for billing operations
-- =============================================

-- =============================================
-- 1. Feature Catalog - defines all billable features
-- =============================================
CREATE TABLE IF NOT EXISTS public.feature_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_key TEXT NOT NULL UNIQUE, -- e.g., 'ai_listing_description', 'market_report'
  name TEXT NOT NULL,
  description TEXT,

  -- Pricing configuration
  pricing_type TEXT NOT NULL DEFAULT 'included', -- 'included', 'metered', 'tiered'
  unit_price DECIMAL(10,4), -- Price per unit (for metered features)
  unit_name TEXT DEFAULT 'use', -- e.g., 'use', 'photo', 'report'

  -- Limits for included features
  free_limit INTEGER DEFAULT 0, -- Number included in free plan
  starter_limit INTEGER DEFAULT 0,
  professional_limit INTEGER DEFAULT 0,
  team_limit INTEGER DEFAULT 0,
  enterprise_limit INTEGER, -- NULL means unlimited

  -- Feature flags
  is_active BOOLEAN DEFAULT TRUE,
  requires_subscription BOOLEAN DEFAULT FALSE,

  -- Metadata
  category TEXT, -- 'ai', 'reports', 'integrations', 'storage'
  sort_order INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.feature_catalog ENABLE ROW LEVEL SECURITY;

-- Everyone can read the feature catalog
CREATE POLICY "Anyone can read feature catalog"
  ON public.feature_catalog FOR SELECT
  USING (true);

-- Only admins can modify
CREATE POLICY "Admins can modify feature catalog"
  ON public.feature_catalog FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Seed default features
INSERT INTO public.feature_catalog (feature_key, name, description, pricing_type, unit_price, unit_name, free_limit, starter_limit, professional_limit, team_limit, category)
VALUES
  ('listings', 'Property Listings', 'Active property listings', 'included', NULL, 'listing', 3, 10, 25, 100, 'core'),
  ('links', 'Bio Links', 'Custom links on profile', 'included', NULL, 'link', 5, 15, 50, 200, 'core'),
  ('testimonials', 'Testimonials', 'Client testimonials', 'included', NULL, 'testimonial', 3, 10, 25, 100, 'core'),
  ('analytics_days', 'Analytics History', 'Days of analytics data retention', 'included', NULL, 'day', 7, 30, 90, 365, 'analytics'),
  ('ai_listing_description', 'AI Listing Description', 'AI-generated property descriptions', 'metered', 2.00, 'use', 0, 3, 10, 50, 'ai'),
  ('market_report', 'Market Report', 'Local market analysis report', 'metered', 10.00, 'report', 0, 0, 2, 10, 'reports'),
  ('virtual_staging', 'Virtual Staging', 'AI virtual staging for photos', 'metered', 5.00, 'photo', 0, 0, 5, 25, 'ai'),
  ('video_tour', 'Video Tour', 'Automated video tour creation', 'metered', 15.00, 'tour', 0, 0, 2, 10, 'media'),
  ('cma_report', 'CMA Report', 'Comparative market analysis', 'metered', 19.99, 'report', 0, 0, 1, 5, 'reports'),
  ('custom_domain', 'Custom Domain', 'Use your own domain', 'included', NULL, 'domain', 0, 0, 1, 5, 'branding'),
  ('remove_branding', 'Remove Branding', 'Remove AgentBio branding', 'included', NULL, 'feature', 0, 0, 1, 1, 'branding'),
  ('priority_support', 'Priority Support', 'Priority customer support', 'included', NULL, 'feature', 0, 0, 1, 1, 'support'),
  ('team_members', 'Team Members', 'Additional team member seats', 'included', NULL, 'seat', 0, 0, 1, 10, 'team')
ON CONFLICT (feature_key) DO NOTHING;

-- =============================================
-- 2. Feature Usage Tracking
-- =============================================
CREATE TABLE IF NOT EXISTS public.feature_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature_key TEXT NOT NULL REFERENCES public.feature_catalog(feature_key),

  -- Usage tracking
  usage_count INTEGER NOT NULL DEFAULT 0,
  usage_period_start TIMESTAMPTZ NOT NULL DEFAULT date_trunc('month', NOW()),
  usage_period_end TIMESTAMPTZ NOT NULL DEFAULT (date_trunc('month', NOW()) + INTERVAL '1 month'),

  -- Billing status
  billed_count INTEGER DEFAULT 0, -- Count already billed to Stripe
  pending_count INTEGER GENERATED ALWAYS AS (usage_count - billed_count) STORED,

  -- Metadata
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- One record per user per feature per billing period
  UNIQUE(user_id, feature_key, usage_period_start)
);

-- Enable RLS
ALTER TABLE public.feature_usage ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX idx_feature_usage_user_id ON public.feature_usage(user_id);
CREATE INDEX idx_feature_usage_feature_key ON public.feature_usage(feature_key);
CREATE INDEX idx_feature_usage_period ON public.feature_usage(usage_period_start, usage_period_end);

-- Users can view their own usage
CREATE POLICY "Users can view own usage"
  ON public.feature_usage FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can manage all usage
CREATE POLICY "Service role can manage usage"
  ON public.feature_usage FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Trigger for updated_at
CREATE TRIGGER update_feature_usage_updated_at
  BEFORE UPDATE ON public.feature_usage
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- 3. Stripe Customer Mapping
-- =============================================
CREATE TABLE IF NOT EXISTS public.stripe_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  stripe_customer_id TEXT NOT NULL UNIQUE,

  -- Customer metadata
  email TEXT,
  name TEXT,
  default_payment_method TEXT,

  -- Status
  is_active BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.stripe_customers ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX idx_stripe_customers_user_id ON public.stripe_customers(user_id);
CREATE INDEX idx_stripe_customers_stripe_id ON public.stripe_customers(stripe_customer_id);

-- Users can view their own customer record
CREATE POLICY "Users can view own stripe customer"
  ON public.stripe_customers FOR SELECT
  USING (auth.uid() = user_id);

-- Service role manages customer records
CREATE POLICY "Service role can manage stripe customers"
  ON public.stripe_customers FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- =============================================
-- 4. Monthly Usage Summary (for billing)
-- =============================================
CREATE TABLE IF NOT EXISTS public.monthly_usage_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Period
  period_year INTEGER NOT NULL,
  period_month INTEGER NOT NULL,

  -- Summary data
  total_usage_amount DECIMAL(10,2) DEFAULT 0,
  features_used JSONB DEFAULT '{}', -- { feature_key: { count, amount } }

  -- Billing status
  billing_status TEXT DEFAULT 'pending', -- 'pending', 'invoiced', 'paid', 'failed'
  stripe_invoice_id TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, period_year, period_month)
);

-- Enable RLS
ALTER TABLE public.monthly_usage_summary ENABLE ROW LEVEL SECURITY;

-- Users can view their own summaries
CREATE POLICY "Users can view own usage summary"
  ON public.monthly_usage_summary FOR SELECT
  USING (auth.uid() = user_id);

-- Service role manages summaries
CREATE POLICY "Service role can manage usage summaries"
  ON public.monthly_usage_summary FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- =============================================
-- 5. Stripe Usage Records (sync tracking)
-- =============================================
CREATE TABLE IF NOT EXISTS public.stripe_usage_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature_key TEXT NOT NULL,

  -- Stripe data
  stripe_subscription_item_id TEXT,
  stripe_usage_record_id TEXT,

  -- Usage data sent to Stripe
  quantity INTEGER NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  action TEXT DEFAULT 'increment', -- 'increment' or 'set'

  -- Sync status
  synced_at TIMESTAMPTZ,
  sync_status TEXT DEFAULT 'pending', -- 'pending', 'synced', 'failed'
  sync_error TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.stripe_usage_records ENABLE ROW LEVEL SECURITY;

-- Users can view their own records
CREATE POLICY "Users can view own stripe records"
  ON public.stripe_usage_records FOR SELECT
  USING (auth.uid() = user_id);

-- Service role manages records
CREATE POLICY "Service role can manage stripe records"
  ON public.stripe_usage_records FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- =============================================
-- 6. Unified Subscription View
-- =============================================
CREATE OR REPLACE VIEW public.user_subscription_details AS
SELECT
  s.id,
  s.user_id,
  s.plan_name,
  s.status,
  s.stripe_customer_id,
  s.stripe_subscription_id,
  s.current_period_start,
  s.current_period_end,
  s.trial_end,
  s.cancel_at,
  s.canceled_at,

  -- Feature limits from subscription
  s.max_listings,
  s.max_links,
  s.max_testimonials,
  s.analytics_history_days,
  s.custom_domain_enabled,
  s.remove_branding,
  s.priority_support,

  -- Current usage counts
  (SELECT COUNT(*) FROM public.listings WHERE user_id = s.user_id) AS current_listings,
  (SELECT COUNT(*) FROM public.links WHERE user_id = s.user_id) AS current_links,
  (SELECT COUNT(*) FROM public.testimonials WHERE user_id = s.user_id) AS current_testimonials,

  -- Calculated fields
  CASE
    WHEN s.status = 'active' AND (s.cancel_at IS NULL OR s.cancel_at > NOW()) THEN TRUE
    WHEN s.status = 'trialing' AND (s.trial_end IS NULL OR s.trial_end > NOW()) THEN TRUE
    ELSE FALSE
  END AS is_subscription_active,

  s.created_at,
  s.updated_at
FROM public.subscriptions s;

-- =============================================
-- 7. Helper Functions
-- =============================================

-- Function to record feature usage
CREATE OR REPLACE FUNCTION public.record_feature_usage(
  _user_id UUID,
  _feature_key TEXT,
  _count INTEGER DEFAULT 1,
  _metadata JSONB DEFAULT '{}'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_period_start TIMESTAMPTZ := date_trunc('month', NOW());
  current_period_end TIMESTAMPTZ := date_trunc('month', NOW()) + INTERVAL '1 month';
BEGIN
  -- Insert or update usage record
  INSERT INTO public.feature_usage (
    user_id,
    feature_key,
    usage_count,
    usage_period_start,
    usage_period_end,
    metadata
  )
  VALUES (
    _user_id,
    _feature_key,
    _count,
    current_period_start,
    current_period_end,
    _metadata
  )
  ON CONFLICT (user_id, feature_key, usage_period_start)
  DO UPDATE SET
    usage_count = public.feature_usage.usage_count + _count,
    metadata = public.feature_usage.metadata || _metadata,
    updated_at = NOW();

  RETURN TRUE;
EXCEPTION WHEN OTHERS THEN
  RETURN FALSE;
END;
$$;

-- Function to check feature limit
CREATE OR REPLACE FUNCTION public.check_feature_limit(
  _user_id UUID,
  _feature_key TEXT
)
RETURNS TABLE (
  allowed BOOLEAN,
  current_usage INTEGER,
  limit_amount INTEGER,
  remaining INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_plan TEXT;
  feature_limit INTEGER;
  current_usage_count INTEGER;
BEGIN
  -- Get user's plan
  SELECT plan_name INTO user_plan
  FROM public.subscriptions
  WHERE user_id = _user_id;

  -- Default to free if no subscription
  user_plan := COALESCE(user_plan, 'free');

  -- Get feature limit for user's plan
  SELECT
    CASE user_plan
      WHEN 'free' THEN fc.free_limit
      WHEN 'starter' THEN fc.starter_limit
      WHEN 'professional' THEN fc.professional_limit
      WHEN 'team' THEN fc.team_limit
      WHEN 'enterprise' THEN fc.enterprise_limit
      ELSE fc.free_limit
    END INTO feature_limit
  FROM public.feature_catalog fc
  WHERE fc.feature_key = _feature_key;

  -- Default to 0 if feature not found
  feature_limit := COALESCE(feature_limit, 0);

  -- Get current usage for this period
  SELECT COALESCE(SUM(fu.usage_count), 0) INTO current_usage_count
  FROM public.feature_usage fu
  WHERE fu.user_id = _user_id
    AND fu.feature_key = _feature_key
    AND fu.usage_period_start = date_trunc('month', NOW());

  -- Return results
  RETURN QUERY SELECT
    (current_usage_count < feature_limit OR feature_limit IS NULL) AS allowed,
    current_usage_count AS current_usage,
    feature_limit AS limit_amount,
    GREATEST(0, feature_limit - current_usage_count) AS remaining;
END;
$$;

-- Function to get user's complete subscription with usage
CREATE OR REPLACE FUNCTION public.get_user_subscription_with_usage(_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
  sub_record RECORD;
  usage_data JSONB;
BEGIN
  -- Get subscription details
  SELECT * INTO sub_record
  FROM public.user_subscription_details
  WHERE user_id = _user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'subscription', NULL,
      'usage', '{}'::JSONB,
      'has_subscription', FALSE
    );
  END IF;

  -- Get current period usage
  SELECT COALESCE(
    jsonb_object_agg(feature_key, jsonb_build_object('count', usage_count, 'billed', billed_count)),
    '{}'::JSONB
  ) INTO usage_data
  FROM public.feature_usage
  WHERE user_id = _user_id
    AND usage_period_start = date_trunc('month', NOW());

  -- Build result
  result := jsonb_build_object(
    'subscription', row_to_json(sub_record)::JSONB,
    'usage', usage_data,
    'has_subscription', TRUE
  );

  RETURN result;
END;
$$;

-- =============================================
-- 8. Comments for documentation
-- =============================================
COMMENT ON TABLE public.feature_catalog IS 'Master list of all billable features with pricing and limits';
COMMENT ON TABLE public.feature_usage IS 'Tracks usage of metered features per user per billing period';
COMMENT ON TABLE public.stripe_customers IS 'Maps users to Stripe customer IDs';
COMMENT ON TABLE public.monthly_usage_summary IS 'Aggregated monthly usage data for billing';
COMMENT ON TABLE public.stripe_usage_records IS 'Records of usage data synced to Stripe';
COMMENT ON VIEW public.user_subscription_details IS 'Unified view of subscription data with current usage';
COMMENT ON FUNCTION public.record_feature_usage IS 'Record usage of a metered feature';
COMMENT ON FUNCTION public.check_feature_limit IS 'Check if user can use a feature based on their plan limits';
COMMENT ON FUNCTION public.get_user_subscription_with_usage IS 'Get complete subscription info with current usage data';
