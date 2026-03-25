
-- Service role manages summaries
DROP POLICY IF EXISTS "Service role can manage usage summaries" ON public.monthly_usage_summary;
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
DROP POLICY IF EXISTS "Users can view own stripe records" ON public.stripe_usage_records;
CREATE POLICY "Users can view own stripe records"
  ON public.stripe_usage_records FOR SELECT
  USING (auth.uid() = user_id);

-- Service role manages records
DROP POLICY IF EXISTS "Service role can manage stripe records" ON public.stripe_usage_records;
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
-- =============================================
-- Lead Activities / Timeline Persistence
-- =============================================
-- This migration creates the infrastructure for:
-- 1. Persistent lead activity timeline
-- 2. Activity logging for CRM interactions
-- 3. Functions for recording and querying activities
-- =============================================

-- =============================================
-- 1. Lead Activities Table
-- =============================================
CREATE TABLE IF NOT EXISTS public.lead_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Activity type and content
  activity_type TEXT NOT NULL, -- 'note', 'email', 'call', 'meeting', 'status_change', 'task', 'sms', 'form_submission'
  title TEXT,
  content TEXT,

  -- For status change activities
  previous_status TEXT,
  new_status TEXT,

  -- For email activities
  email_subject TEXT,
  email_recipient TEXT,

  -- For call activities
  call_duration_seconds INTEGER,
  call_outcome TEXT, -- 'answered', 'voicemail', 'no_answer', 'busy'

  -- For meeting activities
  meeting_type TEXT, -- 'in_person', 'video', 'phone'
  meeting_location TEXT,
  meeting_scheduled_at TIMESTAMPTZ,

  -- For task activities
  task_due_date TIMESTAMPTZ,
  task_completed_at TIMESTAMPTZ,
  task_priority TEXT, -- 'low', 'medium', 'high'

  -- Metadata
  metadata JSONB DEFAULT '{}',
  is_internal BOOLEAN DEFAULT TRUE, -- Internal note vs. external communication

  -- Timestamps
  activity_at TIMESTAMPTZ DEFAULT NOW(), -- When the activity occurred
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.lead_activities ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_lead_activities_lead_id ON public.lead_activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_activities_user_id ON public.lead_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_lead_activities_type ON public.lead_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_lead_activities_activity_at ON public.lead_activities(activity_at DESC);
CREATE INDEX IF NOT EXISTS idx_lead_activities_lead_activity_at ON public.lead_activities(lead_id, activity_at DESC);

-- RLS Policies
-- Users can view activities for their own leads
DROP POLICY IF EXISTS "Users can view activities for own leads" ON public.lead_activities;
CREATE POLICY "Users can view activities for own leads"
  ON public.lead_activities FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.leads
      WHERE leads.id = lead_activities.lead_id
        AND leads.user_id = auth.uid()
    )
  );

-- Users can create activities for their own leads
DROP POLICY IF EXISTS "Users can create activities for own leads" ON public.lead_activities;
CREATE POLICY "Users can create activities for own leads"
  ON public.lead_activities FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.leads
      WHERE leads.id = lead_activities.lead_id
        AND leads.user_id = auth.uid()
    )
  );

-- Users can update their own activities
DROP POLICY IF EXISTS "Users can update own activities" ON public.lead_activities;
CREATE POLICY "Users can update own activities"
  ON public.lead_activities FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own activities
DROP POLICY IF EXISTS "Users can delete own activities" ON public.lead_activities;
CREATE POLICY "Users can delete own activities"
  ON public.lead_activities FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_lead_activities_updated_at ON public.lead_activities;
CREATE TRIGGER update_lead_activities_updated_at
  BEFORE UPDATE ON public.lead_activities
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- 2. Activity Summary View
-- =============================================
CREATE OR REPLACE VIEW public.lead_activity_summary AS
SELECT
  la.lead_id,
  COUNT(*) AS total_activities,
  COUNT(*) FILTER (WHERE la.activity_type = 'note') AS notes_count,
  COUNT(*) FILTER (WHERE la.activity_type = 'email') AS emails_count,
  COUNT(*) FILTER (WHERE la.activity_type = 'call') AS calls_count,
  COUNT(*) FILTER (WHERE la.activity_type = 'meeting') AS meetings_count,
  COUNT(*) FILTER (WHERE la.activity_type = 'status_change') AS status_changes_count,
  MAX(la.activity_at) AS last_activity_at,
  MAX(la.activity_at) FILTER (WHERE la.activity_type = 'email') AS last_email_at,
  MAX(la.activity_at) FILTER (WHERE la.activity_type = 'call') AS last_call_at,
  MIN(la.activity_at) AS first_activity_at
FROM public.lead_activities la
GROUP BY la.lead_id;

-- =============================================
-- 3. Helper Functions
-- =============================================

-- Function to log a lead activity
CREATE OR REPLACE FUNCTION public.log_lead_activity(
  _lead_id UUID,
  _activity_type TEXT,
  _content TEXT DEFAULT NULL,
  _title TEXT DEFAULT NULL,
  _metadata JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_activity_id UUID;
  current_user_id UUID := auth.uid();
BEGIN
  -- Verify user owns the lead
  IF NOT EXISTS (
    SELECT 1 FROM public.leads
    WHERE id = _lead_id AND user_id = current_user_id
  ) THEN
    RAISE EXCEPTION 'Lead not found or access denied';
  END IF;

  -- Insert the activity
  INSERT INTO public.lead_activities (
    lead_id,
    user_id,
    activity_type,
    title,
    content,
    metadata
  )
  VALUES (
    _lead_id,
    current_user_id,
    _activity_type,
    _title,
    _content,
    _metadata
  )
  RETURNING id INTO new_activity_id;

  -- Update lead's last_contacted_at for communication activities
  IF _activity_type IN ('email', 'call', 'meeting', 'sms') THEN
    UPDATE public.leads
    SET last_contacted_at = NOW(), updated_at = NOW()
    WHERE id = _lead_id;
  END IF;

  RETURN new_activity_id;
END;
$$;

-- Function to log status change
CREATE OR REPLACE FUNCTION public.log_lead_status_change(
  _lead_id UUID,
  _previous_status TEXT,
  _new_status TEXT,
  _note TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_activity_id UUID;
  current_user_id UUID := auth.uid();
BEGIN
  -- Verify user owns the lead
  IF NOT EXISTS (
    SELECT 1 FROM public.leads
    WHERE id = _lead_id AND user_id = current_user_id
  ) THEN
    RAISE EXCEPTION 'Lead not found or access denied';
  END IF;

  -- Insert the status change activity
  INSERT INTO public.lead_activities (
    lead_id,
    user_id,
    activity_type,
    title,
    content,
    previous_status,
    new_status,
    metadata
  )
  VALUES (
    _lead_id,
    current_user_id,
    'status_change',
    'Status changed to ' || _new_status,
    _note,
    _previous_status,
    _new_status,
    jsonb_build_object('previous_status', _previous_status, 'new_status', _new_status)
  )
  RETURNING id INTO new_activity_id;

  RETURN new_activity_id;
END;
$$;

-- Function to log email activity
CREATE OR REPLACE FUNCTION public.log_lead_email(
  _lead_id UUID,
  _subject TEXT,
  _recipient TEXT,
  _body TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_activity_id UUID;
  current_user_id UUID := auth.uid();
BEGIN
  -- Verify user owns the lead
  IF NOT EXISTS (
    SELECT 1 FROM public.leads
    WHERE id = _lead_id AND user_id = current_user_id
  ) THEN
    RAISE EXCEPTION 'Lead not found or access denied';
  END IF;

  -- Insert the email activity
  INSERT INTO public.lead_activities (
    lead_id,
    user_id,
    activity_type,
    title,
    content,
    email_subject,
    email_recipient,
    is_internal,
    metadata
  )
  VALUES (
    _lead_id,
    current_user_id,
    'email',
    'Email: ' || _subject,
    _body,
    _subject,
    _recipient,
    FALSE,
    jsonb_build_object('subject', _subject, 'recipient', _recipient)
  )
  RETURNING id INTO new_activity_id;

  -- Update last contacted
  UPDATE public.leads
  SET last_contacted_at = NOW(), updated_at = NOW()
  WHERE id = _lead_id;

  RETURN new_activity_id;
END;
$$;

-- Function to log call activity
CREATE OR REPLACE FUNCTION public.log_lead_call(
  _lead_id UUID,
  _outcome TEXT,
  _duration_seconds INTEGER DEFAULT NULL,
  _notes TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_activity_id UUID;
  current_user_id UUID := auth.uid();
BEGIN
  -- Verify user owns the lead
  IF NOT EXISTS (
    SELECT 1 FROM public.leads
    WHERE id = _lead_id AND user_id = current_user_id
  ) THEN
    RAISE EXCEPTION 'Lead not found or access denied';
  END IF;

  -- Insert the call activity
  INSERT INTO public.lead_activities (
    lead_id,
    user_id,
    activity_type,
    title,
    content,
    call_duration_seconds,
    call_outcome,
    is_internal,
    metadata
  )
  VALUES (
    _lead_id,
    current_user_id,
    'call',
    'Phone call - ' || _outcome,
    _notes,
    _duration_seconds,
    _outcome,
    FALSE,
    jsonb_build_object('outcome', _outcome, 'duration', _duration_seconds)
  )
  RETURNING id INTO new_activity_id;

  -- Update last contacted
  UPDATE public.leads
  SET last_contacted_at = NOW(), updated_at = NOW()
  WHERE id = _lead_id;

  RETURN new_activity_id;
END;
$$;

-- Function to get lead timeline
CREATE OR REPLACE FUNCTION public.get_lead_timeline(
  _lead_id UUID,
  _limit INTEGER DEFAULT 50,
  _offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  activity_type TEXT,
  title TEXT,
  content TEXT,
  metadata JSONB,
  activity_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verify user owns the lead
  IF NOT EXISTS (
    SELECT 1 FROM public.leads
    WHERE leads.id = _lead_id AND leads.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Lead not found or access denied';
  END IF;

  RETURN QUERY
  SELECT
    la.id,
    la.activity_type,
    la.title,
    la.content,
    la.metadata,
    la.activity_at,
    la.created_at
  FROM public.lead_activities la
  WHERE la.lead_id = _lead_id
  ORDER BY la.activity_at DESC
  LIMIT _limit
  OFFSET _offset;
END;
$$;

-- =============================================
-- 4. Trigger to auto-log status changes on leads table
-- =============================================
CREATE OR REPLACE FUNCTION public.auto_log_lead_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only log if status actually changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.lead_activities (
      lead_id,
      user_id,
      activity_type,
      title,
      previous_status,
      new_status,
      metadata
    )
    VALUES (
      NEW.id,
      NEW.user_id,
      'status_change',
      'Status changed from ' || COALESCE(OLD.status, 'none') || ' to ' || NEW.status,
      OLD.status,
      NEW.status,
      jsonb_build_object('previous_status', OLD.status, 'new_status', NEW.status, 'auto_logged', true)
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Create the trigger on leads table
DROP TRIGGER IF EXISTS on_lead_status_change ON public.leads;
CREATE TRIGGER on_lead_status_change
  AFTER UPDATE OF status ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_log_lead_status_change();

-- =============================================
-- 5. Auto-log lead creation
-- =============================================
CREATE OR REPLACE FUNCTION public.auto_log_lead_creation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.lead_activities (
    lead_id,
    user_id,
    activity_type,
    title,
    content,
    metadata
  )
  VALUES (
    NEW.id,
    NEW.user_id,
    'form_submission',
    'Lead created',
    'New lead captured from ' || COALESCE(NEW.source, 'direct'),
    jsonb_build_object(
      'source', NEW.source,
      'type', NEW.type,
      'auto_logged', true
    )
  );

  RETURN NEW;
END;
$$;

-- Create the trigger on leads table
DROP TRIGGER IF EXISTS on_lead_created ON public.leads;
DROP TRIGGER IF EXISTS on_lead_created ON public.leads;
CREATE TRIGGER on_lead_created
  AFTER INSERT ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_log_lead_creation();

-- =============================================
-- 6. Comments for documentation
-- =============================================
COMMENT ON TABLE public.lead_activities IS 'Persistent timeline of all lead activities and interactions';
COMMENT ON VIEW public.lead_activity_summary IS 'Aggregated activity metrics per lead';
COMMENT ON FUNCTION public.log_lead_activity IS 'Log a generic activity for a lead';
COMMENT ON FUNCTION public.log_lead_status_change IS 'Log a status change for a lead';
COMMENT ON FUNCTION public.log_lead_email IS 'Log an email sent to a lead';
COMMENT ON FUNCTION public.log_lead_call IS 'Log a phone call with a lead';
COMMENT ON FUNCTION public.get_lead_timeline IS 'Get paginated timeline for a lead';
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
-- =============================================================================
-- PII Encryption Support Migration
-- =============================================================================
-- This migration sets up infrastructure for PII encryption at rest:
-- 1. Creates encrypted_pii_config table to track encrypted fields
-- 2. Adds helper functions for encryption status management
-- 3. Creates audit logging for encryption operations
--
-- IMPORTANT: The actual encryption is performed by the Edge Function
-- using AES-256-GCM with a master key stored in environment secrets.
-- =============================================================================

-- Enable pgcrypto extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =============================================================================
-- 1. Encrypted PII Configuration Table
-- =============================================================================
-- Tracks which fields in which tables are encrypted
CREATE TABLE IF NOT EXISTS encrypted_pii_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name TEXT NOT NULL,
    field_name TEXT NOT NULL,
    encryption_type TEXT NOT NULL DEFAULT 'aes-256-gcm',
    is_encrypted BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(table_name, field_name)
);

-- Add index for quick lookups
CREATE INDEX IF NOT EXISTS idx_encrypted_pii_config_table
ON encrypted_pii_config(table_name);

-- Enable RLS
ALTER TABLE encrypted_pii_config ENABLE ROW LEVEL SECURITY;

-- Only admins can view/modify encryption config
DROP POLICY IF EXISTS "Admins can manage encryption config" ON encrypted_pii_config;
CREATE POLICY "Admins can manage encryption config"
ON encrypted_pii_config
FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- =============================================================================
-- 2. PII Encryption Audit Log
-- =============================================================================
-- Tracks all encryption/decryption operations for compliance
CREATE TABLE IF NOT EXISTS pii_encryption_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    operation TEXT NOT NULL CHECK (operation IN ('encrypt', 'decrypt', 'key_rotation', 'config_change')),
    table_name TEXT NOT NULL,
    record_id TEXT,
    fields_affected TEXT[],
    success BOOLEAN NOT NULL DEFAULT true,
    error_message TEXT,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes for audit queries
CREATE INDEX IF NOT EXISTS idx_pii_encryption_audit_user
ON pii_encryption_audit(user_id);

CREATE INDEX IF NOT EXISTS idx_pii_encryption_audit_table
ON pii_encryption_audit(table_name);

CREATE INDEX IF NOT EXISTS idx_pii_encryption_audit_operation
ON pii_encryption_audit(operation);

CREATE INDEX IF NOT EXISTS idx_pii_encryption_audit_created
ON pii_encryption_audit(created_at DESC);

-- Enable RLS
ALTER TABLE pii_encryption_audit ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
DROP POLICY IF EXISTS "Admins can view encryption audit" ON pii_encryption_audit;
CREATE POLICY "Admins can view encryption audit"
ON pii_encryption_audit
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- System can insert audit logs
DROP POLICY IF EXISTS "System can insert encryption audit" ON pii_encryption_audit;
CREATE POLICY "System can insert encryption audit"
ON pii_encryption_audit
FOR INSERT
WITH CHECK (true);

-- =============================================================================
-- 3. Encryption Key Metadata Table
-- =============================================================================
-- Stores metadata about encryption keys (NOT the keys themselves)
-- Used for key rotation tracking
CREATE TABLE IF NOT EXISTS encryption_key_metadata (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key_id TEXT NOT NULL UNIQUE,
    key_version INTEGER NOT NULL DEFAULT 1,
    algorithm TEXT NOT NULL DEFAULT 'aes-256-gcm',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    rotated_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'rotating', 'deprecated', 'revoked')),
    created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE encryption_key_metadata ENABLE ROW LEVEL SECURITY;

-- Only admins can manage key metadata
DROP POLICY IF EXISTS "Admins can manage encryption keys" ON encryption_key_metadata;
CREATE POLICY "Admins can manage encryption keys"
ON encryption_key_metadata
FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- =============================================================================
-- 4. Insert Default PII Field Configurations
-- =============================================================================
-- These are the fields that should be encrypted based on the analysis

-- Profiles table PII fields
INSERT INTO encrypted_pii_config (table_name, field_name, encryption_type)
VALUES
    ('profiles', 'phone', 'aes-256-gcm'),
    ('profiles', 'license_number', 'aes-256-gcm'),
    ('profiles', 'email_display', 'aes-256-gcm')
ON CONFLICT (table_name, field_name) DO NOTHING;

-- Leads table PII fields
INSERT INTO encrypted_pii_config (table_name, field_name, encryption_type)
VALUES
    ('leads', 'name', 'aes-256-gcm'),
    ('leads', 'email', 'aes-256-gcm'),
    ('leads', 'phone', 'aes-256-gcm'),
    ('leads', 'property_address', 'aes-256-gcm')
ON CONFLICT (table_name, field_name) DO NOTHING;

-- Testimonials table PII fields
INSERT INTO encrypted_pii_config (table_name, field_name, encryption_type)
VALUES
    ('testimonials', 'client_name', 'aes-256-gcm')
ON CONFLICT (table_name, field_name) DO NOTHING;

-- Listings table PII fields
INSERT INTO encrypted_pii_config (table_name, field_name, encryption_type)
VALUES
    ('listings', 'address', 'aes-256-gcm')
ON CONFLICT (table_name, field_name) DO NOTHING;

-- OAuth credentials (highly sensitive)
INSERT INTO encrypted_pii_config (table_name, field_name, encryption_type)
VALUES
    ('bing_webmaster_oauth_credentials', 'access_token', 'aes-256-gcm'),
    ('bing_webmaster_oauth_credentials', 'refresh_token', 'aes-256-gcm'),
    ('ga4_oauth_credentials', 'access_token', 'aes-256-gcm'),
    ('ga4_oauth_credentials', 'refresh_token', 'aes-256-gcm'),
    ('gsc_oauth_credentials', 'access_token', 'aes-256-gcm'),
    ('gsc_oauth_credentials', 'refresh_token', 'aes-256-gcm'),
    ('yandex_webmaster_oauth_credentials', 'access_token', 'aes-256-gcm'),
    ('yandex_webmaster_oauth_credentials', 'refresh_token', 'aes-256-gcm')
ON CONFLICT (table_name, field_name) DO NOTHING;

-- MFA secrets (critical)
INSERT INTO encrypted_pii_config (table_name, field_name, encryption_type)
VALUES
    ('user_mfa_settings', 'totp_secret', 'aes-256-gcm')
ON CONFLICT (table_name, field_name) DO NOTHING;

-- Session and login data
INSERT INTO encrypted_pii_config (table_name, field_name, encryption_type)
VALUES
    ('user_sessions', 'ip_address', 'aes-256-gcm'),
    ('login_attempts', 'ip_address', 'aes-256-gcm')
ON CONFLICT (table_name, field_name) DO NOTHING;

-- =============================================================================
-- 5. Helper Functions
-- =============================================================================

-- Function to check if a field is encrypted
CREATE OR REPLACE FUNCTION is_field_encrypted(
    p_table_name TEXT,
    p_field_name TEXT
) RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM encrypted_pii_config
        WHERE table_name = p_table_name
        AND field_name = p_field_name
        AND is_encrypted = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get all encrypted fields for a table
CREATE OR REPLACE FUNCTION get_encrypted_fields(
    p_table_name TEXT
) RETURNS TEXT[] AS $$
DECLARE
    result TEXT[];
BEGIN
    SELECT array_agg(field_name)
    INTO result
    FROM encrypted_pii_config
    WHERE table_name = p_table_name
    AND is_encrypted = true;

    RETURN COALESCE(result, ARRAY[]::TEXT[]);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log encryption operation
CREATE OR REPLACE FUNCTION log_encryption_operation(
    p_user_id UUID,
    p_operation TEXT,
    p_table_name TEXT,
    p_record_id TEXT DEFAULT NULL,
    p_fields TEXT[] DEFAULT NULL,
    p_success BOOLEAN DEFAULT true,
    p_error TEXT DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    audit_id UUID;
BEGIN
    INSERT INTO pii_encryption_audit (
        user_id,
        operation,
        table_name,
        record_id,
        fields_affected,
        success,
        error_message,
        ip_address,
        user_agent
    ) VALUES (
        p_user_id,
        p_operation,
        p_table_name,
        p_record_id,
        p_fields,
        p_success,
        p_error,
        p_ip_address,
        p_user_agent
    )
    RETURNING id INTO audit_id;

    RETURN audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate a secure encryption key (for key rotation)
-- Note: This generates the key but does NOT store it in the database
-- The key should be securely transferred to environment secrets
CREATE OR REPLACE FUNCTION generate_encryption_key()
RETURNS TEXT AS $$
BEGIN
    -- Generate 32 random bytes (256 bits) and encode as base64
    RETURN encode(gen_random_bytes(32), 'base64');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION is_field_encrypted(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_encrypted_fields(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION log_encryption_operation(UUID, TEXT, TEXT, TEXT, TEXT[], BOOLEAN, TEXT, INET, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION generate_encryption_key() TO service_role;

-- =============================================================================
-- 6. Update timestamp trigger
-- =============================================================================
CREATE OR REPLACE FUNCTION update_encrypted_pii_config_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_encrypted_pii_config_timestamp ON encrypted_pii_config;
CREATE TRIGGER trigger_update_encrypted_pii_config_timestamp
    BEFORE UPDATE ON encrypted_pii_config
    FOR EACH ROW
    EXECUTE FUNCTION update_encrypted_pii_config_timestamp();

-- =============================================================================
-- Comments for documentation
-- =============================================================================
COMMENT ON TABLE encrypted_pii_config IS 'Tracks which database fields contain encrypted PII data';
COMMENT ON TABLE pii_encryption_audit IS 'Audit log for all PII encryption/decryption operations';
COMMENT ON TABLE encryption_key_metadata IS 'Metadata for encryption keys (keys stored in environment secrets)';
COMMENT ON FUNCTION is_field_encrypted IS 'Check if a specific field is configured for encryption';
COMMENT ON FUNCTION get_encrypted_fields IS 'Get all encrypted fields for a given table';
COMMENT ON FUNCTION log_encryption_operation IS 'Log an encryption operation to the audit table';
COMMENT ON FUNCTION generate_encryption_key IS 'Generate a new 256-bit encryption key (admin use only)';
-- Create API Keys table for webhook authentication
CREATE TABLE IF NOT EXISTS public.api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL, -- Friendly name like "Make.com Webhook"
  key_hash text NOT NULL UNIQUE, -- Store the actual key (or hash in production)
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz,
  expires_at timestamptz,
  
  -- Metadata
  description text,
  scopes text[], -- Future: limit API key to specific functions
  
  CONSTRAINT api_keys_name_not_empty CHECK (char_length(name) > 0),
  CONSTRAINT api_keys_key_hash_not_empty CHECK (char_length(key_hash) > 0)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON public.api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON public.api_keys(key_hash) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_api_keys_expires_at ON public.api_keys(expires_at) WHERE is_active = true;

-- Add comments
COMMENT ON TABLE public.api_keys IS 'API keys for webhook and external service authentication';
COMMENT ON COLUMN public.api_keys.key_hash IS 'The API key value (should be hashed with bcrypt in production)';
COMMENT ON COLUMN public.api_keys.scopes IS 'Optional: limit API key to specific edge functions';

-- Enable RLS
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own API keys
DROP POLICY IF EXISTS "Users can view own api_keys" ON public.api_keys;
CREATE POLICY "Users can view own api_keys"
  ON public.api_keys
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can create their own API keys
DROP POLICY IF EXISTS "Users can create own api_keys" ON public.api_keys;
CREATE POLICY "Users can create own api_keys"
  ON public.api_keys
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own API keys
DROP POLICY IF EXISTS "Users can update own api_keys" ON public.api_keys;
CREATE POLICY "Users can update own api_keys"
  ON public.api_keys
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own API keys
DROP POLICY IF EXISTS "Users can delete own api_keys" ON public.api_keys;
CREATE POLICY "Users can delete own api_keys"
  ON public.api_keys
  FOR DELETE
  USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON public.api_keys TO authenticated;
GRANT SELECT ON public.api_keys TO service_role;
-- pSEO (Programmatic SEO) Tables
-- Supports automated generation of ~9,550 agent discovery pages

-- Core pSEO pages table
CREATE TABLE IF NOT EXISTS pseo_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_type TEXT NOT NULL CHECK (page_type IN (
    'city-directory',
    'city-specialty',
    'city-buyers-agent',
    'city-listing-agent',
    'state-directory',
    'neighborhood-directory',
    'city-situation'
  )),
  url_path TEXT NOT NULL UNIQUE,
  combination JSONB NOT NULL,
  content JSONB NOT NULL,
  is_published BOOLEAN DEFAULT false,
  quality_score INTEGER DEFAULT 0,
  agent_count INTEGER NOT NULL DEFAULT 0,
  content_hash TEXT,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  next_refresh_at TIMESTAMPTZ,
  generation_model TEXT DEFAULT 'claude-sonnet-4-20250514',
  error_count INTEGER DEFAULT 0,
  CONSTRAINT valid_url_path CHECK (url_path ~ '^/[a-z0-9-/]+$')
);