-- Create subscription status enum
CREATE TYPE subscription_status AS ENUM ('active', 'canceled', 'past_due', 'incomplete', 'trialing');

-- Create subscription plans table
CREATE TABLE subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  stripe_price_id TEXT UNIQUE,
  price_monthly DECIMAL(10,2) NOT NULL,
  price_yearly DECIMAL(10,2),
  features JSONB NOT NULL DEFAULT '{}',
  limits JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create user subscriptions table
CREATE TABLE user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES subscription_plans(id),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT UNIQUE,
  status subscription_status DEFAULT 'active',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Create usage tracking table
CREATE TABLE usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  resource_type TEXT NOT NULL,
  count INTEGER DEFAULT 0,
  last_reset_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, resource_type)
);

-- Enable RLS
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subscription_plans
CREATE POLICY "Anyone can view active plans"
  ON subscription_plans FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage plans"
  ON subscription_plans FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for user_subscriptions
CREATE POLICY "Users can view their own subscription"
  ON user_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage subscriptions"
  ON user_subscriptions FOR ALL
  USING (true);

-- RLS Policies for usage_tracking
CREATE POLICY "Users can view their own usage"
  ON usage_tracking FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage usage"
  ON usage_tracking FOR ALL
  USING (true);

-- Function to check subscription limits
CREATE OR REPLACE FUNCTION check_usage_limit(
  _user_id UUID,
  _resource_type TEXT,
  _limit INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_count INTEGER;
BEGIN
  SELECT COALESCE(count, 0) INTO current_count
  FROM usage_tracking
  WHERE user_id = _user_id AND resource_type = _resource_type;
  
  RETURN current_count < _limit;
END;
$$;

-- Function to get user's subscription plan
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
    'current_period_end', us.current_period_end
  ) INTO plan_data
  FROM user_subscriptions us
  JOIN subscription_plans sp ON us.plan_id = sp.id
  WHERE us.user_id = _user_id AND us.status = 'active';
  
  IF plan_data IS NULL THEN
    -- Return free plan limits
    plan_data := jsonb_build_object(
      'plan_name', 'free',
      'limits', jsonb_build_object(
        'listings', 3,
        'links', 5,
        'testimonials', 0,
        'analytics_days', 7
      ),
      'features', jsonb_build_object(),
      'status', 'free'
    );
  END IF;
  
  RETURN plan_data;
END;
$$;

-- Insert default plans
INSERT INTO subscription_plans (name, stripe_price_id, price_monthly, price_yearly, limits, features, sort_order) VALUES
('free', NULL, 0, 0, 
  '{"listings": 3, "links": 5, "testimonials": 0, "analytics_days": 7, "themes": 1}'::jsonb,
  '{"branding": true, "support": "community"}'::jsonb, 0),
('starter', 'price_starter_monthly', 19, 190,
  '{"listings": 10, "sold_properties": 10, "links": -1, "testimonials": 3, "analytics_days": 30, "themes": 3}'::jsonb,
  '{"lead_capture": true, "calendar_integration": true, "remove_branding": true, "support": "email_72hr"}'::jsonb, 1),
('professional', 'price_professional_monthly', 39, 390,
  '{"listings": -1, "sold_properties": -1, "links": -1, "testimonials": -1, "analytics_days": 365, "themes": 10}'::jsonb,
  '{"lead_capture": true, "calendar_integration": true, "home_valuation": true, "custom_colors": true, "qr_codes": true, "lead_export": true, "remove_branding": true, "support": "email_48hr"}'::jsonb, 2),
('team', 'price_team_monthly', 29, 290,
  '{"listings": -1, "sold_properties": -1, "links": -1, "testimonials": -1, "analytics_days": 365, "themes": -1}'::jsonb,
  '{"team_dashboard": true, "shared_assets": true, "team_branding": true, "team_directory": true, "multi_user": true, "priority_support": true, "onboarding_call": true}'::jsonb, 3),
('enterprise', NULL, 0, 0,
  '{"listings": -1, "sold_properties": -1, "links": -1, "testimonials": -1, "analytics_days": -1, "themes": -1}'::jsonb,
  '{"white_label": true, "custom_domain": true, "custom_css": true, "sso": true, "dedicated_manager": true, "phone_support": true, "lead_routing": true, "api_access": true}'::jsonb, 4);

-- Trigger to update usage tracking
CREATE OR REPLACE FUNCTION update_usage_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO usage_tracking (user_id, resource_type, count)
  VALUES (NEW.user_id, TG_ARGV[0], 1)
  ON CONFLICT (user_id, resource_type)
  DO UPDATE SET 
    count = usage_tracking.count + 1,
    updated_at = now();
  RETURN NEW;
END;
$$;

-- Add triggers for usage tracking
CREATE TRIGGER track_listings_usage
  AFTER INSERT ON listings
  FOR EACH ROW
  EXECUTE FUNCTION update_usage_count('listings');

CREATE TRIGGER track_links_usage
  AFTER INSERT ON links
  FOR EACH ROW
  EXECUTE FUNCTION update_usage_count('links');

CREATE TRIGGER track_testimonials_usage
  AFTER INSERT ON testimonials
  FOR EACH ROW
  EXECUTE FUNCTION update_usage_count('testimonials');