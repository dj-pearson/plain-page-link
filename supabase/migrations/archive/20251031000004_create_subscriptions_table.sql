-- Create subscriptions table for payment tracking
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  
  -- Subscription Plan
  plan_name TEXT NOT NULL DEFAULT 'free', -- free, professional, team, enterprise
  status TEXT NOT NULL DEFAULT 'active', -- active, cancelled, past_due, trialing, paused
  
  -- Stripe Integration
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_price_id TEXT,
  
  -- Billing Periods
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  cancel_at TIMESTAMPTZ, -- If cancelled, when will it end
  canceled_at TIMESTAMPTZ, -- When cancellation was requested
  
  -- Pricing
  amount DECIMAL(10,2), -- Monthly price in USD
  currency TEXT DEFAULT 'usd',
  interval TEXT DEFAULT 'month', -- month, year
  
  -- Feature Limits (based on plan)
  max_listings INTEGER DEFAULT 3,
  max_links INTEGER DEFAULT 5,
  max_testimonials INTEGER DEFAULT 3,
  analytics_history_days INTEGER DEFAULT 7,
  custom_domain_enabled BOOLEAN DEFAULT FALSE,
  remove_branding BOOLEAN DEFAULT FALSE,
  priority_support BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Indexes for performance
CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_customer_id ON public.subscriptions(stripe_customer_id);
CREATE INDEX idx_subscriptions_stripe_subscription_id ON public.subscriptions(stripe_subscription_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);

-- RLS Policies
-- Users can only view their own subscription
CREATE POLICY "Users can view their own subscription"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Only system (service role) can insert subscriptions
-- This is typically done via Stripe webhook
CREATE POLICY "Service role can insert subscriptions"
  ON public.subscriptions FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Users cannot directly update subscriptions (done via Stripe)
CREATE POLICY "Service role can update subscriptions"
  ON public.subscriptions FOR UPDATE
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to create default free subscription for new users
CREATE OR REPLACE FUNCTION public.create_default_subscription()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.subscriptions (
    user_id,
    plan_name,
    status,
    max_listings,
    max_links,
    max_testimonials,
    analytics_history_days
  ) VALUES (
    NEW.id,
    'free',
    'active',
    3,  -- Free plan: 3 listings
    5,  -- Free plan: 5 links
    3,  -- Free plan: 3 testimonials
    7   -- Free plan: 7 days analytics
  );
  
  RETURN NEW;
END;
$$;

-- Trigger to create subscription on user signup
-- Note: This runs after handle_new_user() function
CREATE TRIGGER on_user_subscription_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.create_default_subscription();

-- Function to check if user has reached plan limits
CREATE OR REPLACE FUNCTION public.check_subscription_limit(
  _user_id UUID,
  _limit_type TEXT -- 'listings', 'links', 'testimonials'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_count INTEGER;
  max_allowed INTEGER;
BEGIN
  -- Get max allowed for this user's plan
  SELECT 
    CASE 
      WHEN _limit_type = 'listings' THEN max_listings
      WHEN _limit_type = 'links' THEN max_links
      WHEN _limit_type = 'testimonials' THEN max_testimonials
      ELSE 0
    END INTO max_allowed
  FROM public.subscriptions
  WHERE user_id = _user_id;
  
  -- Count current usage
  current_count := CASE 
    WHEN _limit_type = 'listings' THEN (SELECT COUNT(*) FROM public.listings WHERE user_id = _user_id)
    WHEN _limit_type = 'links' THEN (SELECT COUNT(*) FROM public.links WHERE user_id = _user_id)
    WHEN _limit_type = 'testimonials' THEN (SELECT COUNT(*) FROM public.testimonials WHERE user_id = _user_id)
    ELSE 0
  END;
  
  -- Return true if under limit
  RETURN current_count < max_allowed;
END;
$$;

-- Comments for documentation
COMMENT ON TABLE public.subscriptions IS 'User subscription plans and billing information';
COMMENT ON COLUMN public.subscriptions.plan_name IS 'free, professional ($39/mo), team ($29/agent), enterprise (custom)';
COMMENT ON COLUMN public.subscriptions.status IS 'active = paying, cancelled = ending at period_end, past_due = payment failed, trialing = in trial period';
COMMENT ON FUNCTION public.check_subscription_limit IS 'Check if user can add more items based on their plan limits';

