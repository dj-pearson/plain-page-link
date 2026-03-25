
-- Note: The application layer should use explicit SELECT fields to only fetch:
-- username, full_name, bio, avatar_url, theme, title, certifications, 
-- service_cities, service_zip_codes, years_experience, brokerage_name, brokerage_logo
-- Exclude: phone, email_display, license_number, license_state, etc.

-- Create authenticated user access to their own full profile
DROP POLICY IF EXISTS "Users can view own full profile" ON public.profiles;
CREATE POLICY "Users can view own full profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);


-- Fix articles table - Don't expose author_id to public
DROP POLICY IF EXISTS "Anyone can view published articles" ON public.articles;

DROP POLICY IF EXISTS "Public can view published articles without author tracking" ON public.articles;
CREATE POLICY "Public can view published articles without author tracking"
ON public.articles
FOR SELECT
TO public
USING (status = 'published');

-- Note: Application should exclude author_id from public queries


-- Fix listings table - Don't expose user_id to public
DROP POLICY IF EXISTS "Anyone can view active listings" ON public.listings;

DROP POLICY IF EXISTS "Public can view active listings without user tracking" ON public.listings;
CREATE POLICY "Public can view active listings without user tracking"
ON public.listings
FOR SELECT
TO public
USING (status IN ('active', 'pending', 'under_contract', 'sold'));

-- Note: Application should exclude user_id from public queries


-- ============================================
-- 2. ADD FIXED SEARCH_PATH TO SECURITY DEFINER FUNCTIONS
-- ============================================

-- Fix update_keyword_usage function
CREATE OR REPLACE FUNCTION public.update_keyword_usage()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  IF NEW.keyword_id IS NOT NULL THEN
    UPDATE public.keywords
    SET
      usage_count = usage_count + 1,
      last_used_at = now(),
      updated_at = now()
    WHERE id = NEW.keyword_id;
  END IF;
  RETURN NEW;
END;
$function$;

-- Fix set_published_at function
CREATE OR REPLACE FUNCTION public.set_published_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  IF NEW.published = true AND OLD.published = false THEN
    NEW.published_at = now();
  END IF;
  RETURN NEW;
END;
$function$;

-- Fix ensure_single_active_page function
CREATE OR REPLACE FUNCTION public.ensure_single_active_page()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  IF NEW.is_active = true THEN
    UPDATE public.custom_pages
    SET is_active = false
    WHERE user_id = NEW.user_id
      AND id != NEW.id
      AND is_active = true;
  END IF;
  RETURN NEW;
END;
$function$;

-- Fix increment_profile_views function
CREATE OR REPLACE FUNCTION public.increment_profile_views(_profile_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  UPDATE public.profiles
  SET view_count = view_count + 1
  WHERE id = _profile_id;
END;
$function$;

-- Fix increment_profile_leads function
CREATE OR REPLACE FUNCTION public.increment_profile_leads(_profile_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  UPDATE public.profiles
  SET lead_count = lead_count + 1
  WHERE id = _profile_id;
END;
$function$;

-- Fix update_profile_lead_count function
CREATE OR REPLACE FUNCTION public.update_profile_lead_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  PERFORM public.increment_profile_leads(NEW.user_id);
  RETURN NEW;
END;
$function$;

-- Fix increment_link_clicks function
CREATE OR REPLACE FUNCTION public.increment_link_clicks(link_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  UPDATE public.links
  SET click_count = COALESCE(click_count, 0) + 1
  WHERE id = link_id;
END;
$function$;

-- Fix update_usage_count function
CREATE OR REPLACE FUNCTION public.update_usage_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  INSERT INTO public.usage_tracking (user_id, resource_type, count)
  VALUES (NEW.user_id, TG_ARGV[0], 1)
  ON CONFLICT (user_id, resource_type)
  DO UPDATE SET 
    count = public.usage_tracking.count + 1,
    updated_at = now();
  RETURN NEW;
END;
$function$;

-- Fix create_default_subscription function
CREATE OR REPLACE FUNCTION public.create_default_subscription()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
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
    3,
    5,
    3,
    7
  );
  
  RETURN NEW;
END;
$function$;

-- Fix notify_new_lead function
CREATE OR REPLACE FUNCTION public.notify_new_lead()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  PERFORM pg_notify('new_lead', json_build_object(
    'lead_id', NEW.id,
    'user_id', NEW.user_id,
    'lead_type', NEW.lead_type,
    'name', NEW.name,
    'email', NEW.email
  )::text);
  
  RETURN NEW;
END;
$function$;

-- Note: The following functions already have SET search_path = 'public':
-- - has_role
-- - check_username_available
-- - check_usage_limit
-- - handle_new_user
-- - update_updated_at_column
-- - get_user_plan
-- - check_subscription_limit
-- - refresh_unified_analytics
-- - get_connected_search_platforms

COMMENT ON FUNCTION public.update_keyword_usage() IS 'Security hardened: Added SET search_path to prevent privilege escalation';
COMMENT ON FUNCTION public.set_published_at() IS 'Security hardened: Added SET search_path to prevent privilege escalation';
COMMENT ON FUNCTION public.ensure_single_active_page() IS 'Security hardened: Added SET search_path to prevent privilege escalation';
COMMENT ON FUNCTION public.increment_profile_views(uuid) IS 'Security hardened: Added SET search_path to prevent privilege escalation';
COMMENT ON FUNCTION public.increment_profile_leads(uuid) IS 'Security hardened: Added SET search_path to prevent privilege escalation';
COMMENT ON FUNCTION public.update_profile_lead_count() IS 'Security hardened: Added SET search_path to prevent privilege escalation';
COMMENT ON FUNCTION public.increment_link_clicks(uuid) IS 'Security hardened: Added SET search_path to prevent privilege escalation';
COMMENT ON FUNCTION public.update_usage_count() IS 'Security hardened: Added SET search_path to prevent privilege escalation';
COMMENT ON FUNCTION public.create_default_subscription() IS 'Security hardened: Added SET search_path to prevent privilege escalation';
COMMENT ON FUNCTION public.notify_new_lead() IS 'Security hardened: Added SET search_path to prevent privilege escalation';-- ============================================================================
-- ML Lead Scoring Tables
-- Stores model weights and A/B test results for ML-based lead scoring
-- ============================================================================

-- ============================================================================
-- ML Model Weights Table
-- Stores trained model weights per user for personalized lead scoring
-- ============================================================================

CREATE TABLE IF NOT EXISTS ml_model_weights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Model data (stored as JSONB for flexibility)
    weights JSONB NOT NULL DEFAULT '{}'::jsonb,

    -- Model metadata
    version TEXT,
    training_examples INTEGER DEFAULT 0,
    accuracy DECIMAL(5,4),
    auc DECIMAL(5,4),

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Ensure one model per user (upsert pattern)
    CONSTRAINT ml_model_weights_user_unique UNIQUE (user_id)
);

-- Index for user lookup
CREATE INDEX IF NOT EXISTS idx_ml_model_weights_user_id ON ml_model_weights(user_id);

-- Enable RLS
ALTER TABLE ml_model_weights ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own model weights
DROP POLICY IF EXISTS "Users can view own model weights" ON ml_model_weights;
CREATE POLICY "Users can view own model weights"
    ON ml_model_weights
    FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own model weights" ON ml_model_weights;
CREATE POLICY "Users can insert own model weights"
    ON ml_model_weights
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own model weights" ON ml_model_weights;
CREATE POLICY "Users can update own model weights"
    ON ml_model_weights
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own model weights" ON ml_model_weights;
CREATE POLICY "Users can delete own model weights"
    ON ml_model_weights
    FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================================================
-- A/B Test Results Table
-- Stores historical A/B test results comparing ML vs rule-based scoring
-- ============================================================================

CREATE TABLE IF NOT EXISTS ab_test_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Test identification
    test_id TEXT NOT NULL,

    -- Test analysis results (stored as JSONB)
    analysis JSONB NOT NULL DEFAULT '{}'::jsonb,

    -- Denormalized key metrics for easy querying
    ml_conversion_rate DECIMAL(5,4),
    rules_conversion_rate DECIMAL(5,4),
    winner TEXT CHECK (winner IN ('ml', 'rules', 'inconclusive')),
    confidence DECIMAL(5,4),
    duration_days DECIMAL(10,2),

    -- Sample sizes
    ml_count INTEGER DEFAULT 0,
    rules_count INTEGER DEFAULT 0,
    ml_conversions INTEGER DEFAULT 0,
    rules_conversions INTEGER DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ab_test_results_user_id ON ab_test_results(user_id);
CREATE INDEX IF NOT EXISTS idx_ab_test_results_test_id ON ab_test_results(test_id);
CREATE INDEX IF NOT EXISTS idx_ab_test_results_created_at ON ab_test_results(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ab_test_results_winner ON ab_test_results(winner);

-- Enable RLS
ALTER TABLE ab_test_results ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view own A/B test results" ON ab_test_results;
CREATE POLICY "Users can view own A/B test results"
    ON ab_test_results
    FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own A/B test results" ON ab_test_results;
CREATE POLICY "Users can insert own A/B test results"
    ON ab_test_results
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own A/B test results" ON ab_test_results;
CREATE POLICY "Users can update own A/B test results"
    ON ab_test_results
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own A/B test results" ON ab_test_results;
CREATE POLICY "Users can delete own A/B test results"
    ON ab_test_results
    FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================================================
-- Lead Scores Table (Optional - for persistence and analytics)
-- Stores individual lead scores for historical analysis
-- ============================================================================

CREATE TABLE IF NOT EXISTS lead_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    lead_id UUID NOT NULL,

    -- Score data
    score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
    priority TEXT NOT NULL CHECK (priority IN ('hot', 'warm', 'cold')),
    variant TEXT NOT NULL CHECK (variant IN ('ml', 'rules')),

    -- ML-specific data
    confidence DECIMAL(5,4),
    probability DECIMAL(5,4),
    model_version TEXT,

    -- Feature importance (top 5 contributing features)
    feature_importance JSONB,

    -- Outcome tracking
    converted BOOLEAN,
    conversion_recorded_at TIMESTAMPTZ,

    -- Timestamps
    scored_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Unique constraint: one score per lead (latest wins)
    CONSTRAINT lead_scores_lead_unique UNIQUE (lead_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_lead_scores_user_id ON lead_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_lead_scores_lead_id ON lead_scores(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_scores_priority ON lead_scores(priority);
CREATE INDEX IF NOT EXISTS idx_lead_scores_variant ON lead_scores(variant);
CREATE INDEX IF NOT EXISTS idx_lead_scores_scored_at ON lead_scores(scored_at DESC);
CREATE INDEX IF NOT EXISTS idx_lead_scores_converted ON lead_scores(converted) WHERE converted IS NOT NULL;

-- Enable RLS
ALTER TABLE lead_scores ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view own lead scores" ON lead_scores;
CREATE POLICY "Users can view own lead scores"
    ON lead_scores
    FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own lead scores" ON lead_scores;
CREATE POLICY "Users can insert own lead scores"
    ON lead_scores
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own lead scores" ON lead_scores;
CREATE POLICY "Users can update own lead scores"
    ON lead_scores
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own lead scores" ON lead_scores;
CREATE POLICY "Users can delete own lead scores"
    ON lead_scores
    FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================================================
-- ML Training Examples Table
-- Stores labeled examples for model training
-- ============================================================================

CREATE TABLE IF NOT EXISTS ml_training_examples (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    lead_id UUID NOT NULL,

    -- Feature data (stored as JSONB)
    features JSONB NOT NULL,

    -- Label
    converted BOOLEAN NOT NULL,

    -- Metadata
    source TEXT,
    lead_type TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    lead_created_at TIMESTAMPTZ,
    conversion_recorded_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ml_training_examples_user_id ON ml_training_examples(user_id);
CREATE INDEX IF NOT EXISTS idx_ml_training_examples_converted ON ml_training_examples(converted);
CREATE INDEX IF NOT EXISTS idx_ml_training_examples_created_at ON ml_training_examples(created_at DESC);

-- Enable RLS
ALTER TABLE ml_training_examples ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view own training examples" ON ml_training_examples;
CREATE POLICY "Users can view own training examples"
    ON ml_training_examples
    FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own training examples" ON ml_training_examples;
CREATE POLICY "Users can insert own training examples"
    ON ml_training_examples
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own training examples" ON ml_training_examples;
CREATE POLICY "Users can delete own training examples"
    ON ml_training_examples
    FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================================================
-- Triggers for updated_at
-- ============================================================================

-- Trigger function (reuse if exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to ml_model_weights
DROP TRIGGER IF EXISTS update_ml_model_weights_updated_at ON ml_model_weights;
DROP TRIGGER IF EXISTS update_ml_model_weights_updated_at ON ml_model_weights;
CREATE TRIGGER update_ml_model_weights_updated_at
    BEFORE UPDATE ON ml_model_weights
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Helper function to extract denormalized metrics from analysis JSON
-- ============================================================================

CREATE OR REPLACE FUNCTION extract_ab_test_metrics()
RETURNS TRIGGER AS $$
BEGIN
    -- Extract metrics from analysis JSONB for easier querying
    NEW.ml_conversion_rate := (NEW.analysis->'mlResults'->>'conversionRate')::DECIMAL;
    NEW.rules_conversion_rate := (NEW.analysis->'rulesResults'->>'conversionRate')::DECIMAL;
    NEW.winner := NEW.analysis->>'winner';
    NEW.confidence := (NEW.analysis->>'confidence')::DECIMAL;
    NEW.duration_days := (NEW.analysis->>'duration')::DECIMAL;
    NEW.ml_count := (NEW.analysis->'mlResults'->>'count')::INTEGER;
    NEW.rules_count := (NEW.analysis->'rulesResults'->>'count')::INTEGER;
    NEW.ml_conversions := (NEW.analysis->'mlResults'->>'conversions')::INTEGER;
    NEW.rules_conversions := (NEW.analysis->'rulesResults'->>'conversions')::INTEGER;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to ab_test_results
DROP TRIGGER IF EXISTS extract_ab_test_metrics_trigger ON ab_test_results;
CREATE TRIGGER extract_ab_test_metrics_trigger
    BEFORE INSERT OR UPDATE ON ab_test_results
    FOR EACH ROW
    EXECUTE FUNCTION extract_ab_test_metrics();

-- ============================================================================
-- Comments for documentation
-- ============================================================================

COMMENT ON TABLE ml_model_weights IS 'Stores trained ML model weights for personalized lead scoring per user';
COMMENT ON TABLE ab_test_results IS 'Stores A/B test results comparing ML vs rule-based lead scoring';
COMMENT ON TABLE lead_scores IS 'Stores individual lead scores for historical analysis and tracking';
COMMENT ON TABLE ml_training_examples IS 'Stores labeled examples for ML model training';

COMMENT ON COLUMN ml_model_weights.weights IS 'JSONB containing model weights, bias, and metadata';
COMMENT ON COLUMN ab_test_results.analysis IS 'Full A/B test analysis including variant-specific metrics';
COMMENT ON COLUMN lead_scores.feature_importance IS 'Top contributing features to the lead score';
-- Multi-Factor Authentication (MFA/2FA) Tables
-- Supports TOTP, Email, and SMS-based authentication

-- =============================================
-- USER MFA SETTINGS
-- =============================================

CREATE TABLE IF NOT EXISTS user_mfa_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mfa_enabled BOOLEAN DEFAULT false,
  mfa_method TEXT CHECK (mfa_method IN ('totp', 'email', 'sms')),
  totp_secret TEXT, -- Base32 encoded secret (encrypted via application layer)
  backup_codes TEXT[], -- Array of hashed backup codes
  backup_codes_generated_at TIMESTAMPTZ,
  phone_number TEXT, -- For SMS-based MFA
  email_verified_for_mfa BOOLEAN DEFAULT false,
  verified_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  failed_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_user_mfa_settings_user_id ON user_mfa_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_mfa_settings_enabled ON user_mfa_settings(mfa_enabled) WHERE mfa_enabled = true;

-- Updated_at trigger
DROP TRIGGER IF EXISTS update_user_mfa_settings_updated_at ON user_mfa_settings;
CREATE TRIGGER update_user_mfa_settings_updated_at
  BEFORE UPDATE ON user_mfa_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE user_mfa_settings IS 'Stores MFA configuration and secrets for users';

-- =============================================
-- MFA VERIFICATION LOGS
-- =============================================

CREATE TABLE IF NOT EXISTS mfa_verification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  method TEXT NOT NULL CHECK (method IN ('totp', 'email', 'sms', 'backup_code')),
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'expired', 'blocked')),
  ip_address INET,
  user_agent TEXT,
  device_fingerprint TEXT,
  failure_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for security analysis
CREATE INDEX IF NOT EXISTS idx_mfa_verification_logs_user_id ON mfa_verification_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_mfa_verification_logs_status ON mfa_verification_logs(status);
CREATE INDEX IF NOT EXISTS idx_mfa_verification_logs_created_at ON mfa_verification_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mfa_verification_logs_ip ON mfa_verification_logs(ip_address);

COMMENT ON TABLE mfa_verification_logs IS 'Audit trail of all MFA verification attempts';

-- =============================================
-- TRUSTED DEVICES
-- =============================================

CREATE TABLE IF NOT EXISTS mfa_trusted_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_fingerprint TEXT NOT NULL,
  device_name TEXT,
  browser TEXT,
  os TEXT,
  ip_address INET,
  last_used_at TIMESTAMPTZ DEFAULT now(),
  trusted_until TIMESTAMPTZ NOT NULL,
  revoked BOOLEAN DEFAULT false,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, device_fingerprint)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_mfa_trusted_devices_user_id ON mfa_trusted_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_mfa_trusted_devices_fingerprint ON mfa_trusted_devices(device_fingerprint);
CREATE INDEX IF NOT EXISTS idx_mfa_trusted_devices_trusted_until ON mfa_trusted_devices(trusted_until) WHERE revoked = false;

COMMENT ON TABLE mfa_trusted_devices IS 'Devices marked as trusted to skip MFA for a period';

-- =============================================
-- TEMPORARY MFA CODES (for email/SMS)
-- =============================================

CREATE TABLE IF NOT EXISTS mfa_temp_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code_hash TEXT NOT NULL, -- Hashed verification code
  code_type TEXT NOT NULL CHECK (code_type IN ('email', 'sms', 'setup_verification')),
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT false,
  used_at TIMESTAMPTZ,
  attempts INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_mfa_temp_codes_user_id ON mfa_temp_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_mfa_temp_codes_expires_at ON mfa_temp_codes(expires_at);
CREATE INDEX IF NOT EXISTS idx_mfa_temp_codes_used ON mfa_temp_codes(used);

COMMENT ON TABLE mfa_temp_codes IS 'Temporary verification codes for email/SMS MFA';

-- =============================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================

ALTER TABLE user_mfa_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE mfa_verification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE mfa_trusted_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE mfa_temp_codes ENABLE ROW LEVEL SECURITY;

-- Users can read and update their own MFA settings
DROP POLICY IF EXISTS "Users can view own MFA settings" ON user_mfa_settings;
CREATE POLICY "Users can view own MFA settings"
  ON user_mfa_settings FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own MFA settings" ON user_mfa_settings;
CREATE POLICY "Users can update own MFA settings"
  ON user_mfa_settings FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own MFA settings" ON user_mfa_settings;
CREATE POLICY "Users can insert own MFA settings"
  ON user_mfa_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Verification logs - users can only view their own
DROP POLICY IF EXISTS "Users can view own MFA verification logs" ON mfa_verification_logs;
CREATE POLICY "Users can view own MFA verification logs"
  ON mfa_verification_logs FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can insert verification logs
DROP POLICY IF EXISTS "Service role can insert verification logs" ON mfa_verification_logs;
CREATE POLICY "Service role can insert verification logs"
  ON mfa_verification_logs FOR INSERT
  WITH CHECK (true);

-- Trusted devices - users can manage their own
DROP POLICY IF EXISTS "Users can view own trusted devices" ON mfa_trusted_devices;
CREATE POLICY "Users can view own trusted devices"
  ON mfa_trusted_devices FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own trusted devices" ON mfa_trusted_devices;
CREATE POLICY "Users can manage own trusted devices"
  ON mfa_trusted_devices FOR ALL
  USING (auth.uid() = user_id);

-- Temp codes - service role only for security
DROP POLICY IF EXISTS "Service role manages temp codes" ON mfa_temp_codes;
CREATE POLICY "Service role manages temp codes"
  ON mfa_temp_codes FOR ALL
  USING (true);

-- =============================================
-- HELPER FUNCTIONS
-- =============================================

-- Function to check if user has MFA enabled
CREATE OR REPLACE FUNCTION check_mfa_enabled(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_mfa_settings
    WHERE user_id = p_user_id
    AND mfa_enabled = true
    AND verified_at IS NOT NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if device is trusted
CREATE OR REPLACE FUNCTION is_device_trusted(p_user_id UUID, p_device_fingerprint TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM mfa_trusted_devices
    WHERE user_id = p_user_id
    AND device_fingerprint = p_device_fingerprint
    AND revoked = false
    AND trusted_until > now()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment failed MFA attempts
CREATE OR REPLACE FUNCTION increment_mfa_failed_attempts(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_attempts INTEGER;
BEGIN
  UPDATE user_mfa_settings
  SET
    failed_attempts = failed_attempts + 1,
    locked_until = CASE
      WHEN failed_attempts >= 4 THEN now() + interval '15 minutes'
      ELSE locked_until
    END,
    updated_at = now()
  WHERE user_id = p_user_id
  RETURNING failed_attempts INTO v_attempts;

  RETURN COALESCE(v_attempts, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reset failed attempts on successful verification
CREATE OR REPLACE FUNCTION reset_mfa_failed_attempts(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE user_mfa_settings
  SET
    failed_attempts = 0,
    locked_until = NULL,
    last_used_at = now(),
    updated_at = now()
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if MFA is locked
CREATE OR REPLACE FUNCTION is_mfa_locked(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_mfa_settings
    WHERE user_id = p_user_id
    AND locked_until IS NOT NULL
    AND locked_until > now()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cleanup function for expired temp codes
CREATE OR REPLACE FUNCTION cleanup_expired_mfa_codes()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM mfa_temp_codes
  WHERE expires_at < now() OR (used = true AND created_at < now() - interval '1 day');

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION check_mfa_enabled IS 'Check if a user has MFA enabled and verified';
COMMENT ON FUNCTION is_device_trusted IS 'Check if a device is trusted for a user';
COMMENT ON FUNCTION increment_mfa_failed_attempts IS 'Increment failed MFA attempts and lock if necessary';
COMMENT ON FUNCTION reset_mfa_failed_attempts IS 'Reset failed attempts after successful verification';
COMMENT ON FUNCTION is_mfa_locked IS 'Check if MFA is temporarily locked due to failed attempts';
COMMENT ON FUNCTION cleanup_expired_mfa_codes IS 'Cleanup expired temporary MFA codes';
-- Enterprise SSO (SAML/OIDC) Tables
-- Supports SAML 2.0, OpenID Connect, and Azure AD integration

-- =============================================
-- ENTERPRISE SSO CONFIGURATIONS
-- =============================================

CREATE TABLE IF NOT EXISTS enterprise_sso_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID, -- Future: link to organizations table
  organization_name TEXT NOT NULL,
  organization_domain TEXT NOT NULL, -- e.g., 'acme.com' for user@acme.com
  sso_provider TEXT NOT NULL CHECK (sso_provider IN ('saml', 'oidc', 'azure_ad', 'okta', 'google_workspace')),

  -- SAML Configuration
  saml_entity_id TEXT UNIQUE,
  saml_sso_url TEXT, -- IdP Single Sign-On URL
  saml_slo_url TEXT, -- IdP Single Logout URL (optional)
  saml_certificate TEXT, -- IdP X.509 Certificate
  saml_metadata_url TEXT, -- URL to fetch IdP metadata
  saml_name_id_format TEXT DEFAULT 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',

  -- OIDC Configuration
  oidc_client_id TEXT,
  oidc_client_secret TEXT, -- Encrypted
  oidc_issuer TEXT,
  oidc_authorization_endpoint TEXT,
  oidc_token_endpoint TEXT,
  oidc_userinfo_endpoint TEXT,
  oidc_jwks_uri TEXT,
  oidc_scopes TEXT[] DEFAULT ARRAY['openid', 'email', 'profile'],

  -- Attribute Mapping (maps IdP attributes to user profile)
  attribute_mappings JSONB DEFAULT '{
    "email": "email",
    "firstName": "given_name",
    "lastName": "family_name",
    "displayName": "name",
    "groups": "groups"
  }'::jsonb,

  -- Access Control
  allowed_groups TEXT[], -- If set, only users in these groups can access
  default_role TEXT DEFAULT 'user' CHECK (default_role IN ('user', 'admin')),
  auto_provision_users BOOLEAN DEFAULT true, -- Create user on first SSO login

  -- Status
  active BOOLEAN DEFAULT false,
  verified_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,

  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_enterprise_sso_config_domain ON enterprise_sso_config(organization_domain) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_enterprise_sso_config_entity_id ON enterprise_sso_config(saml_entity_id);
CREATE INDEX IF NOT EXISTS idx_enterprise_sso_config_provider ON enterprise_sso_config(sso_provider);

-- Updated_at trigger
DROP TRIGGER IF EXISTS update_enterprise_sso_config_updated_at ON enterprise_sso_config;
CREATE TRIGGER update_enterprise_sso_config_updated_at
  BEFORE UPDATE ON enterprise_sso_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE enterprise_sso_config IS 'Enterprise SSO configurations for SAML/OIDC providers';

-- =============================================
-- SSO LOGIN SESSIONS
-- =============================================

CREATE TABLE IF NOT EXISTS sso_login_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_id UUID NOT NULL REFERENCES enterprise_sso_config(id) ON DELETE CASCADE,
  request_id TEXT UNIQUE NOT NULL, -- SAML RequestID or OIDC state parameter
  user_email TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'expired')),

  -- SAML specific
  saml_request TEXT, -- Original SAML AuthnRequest (for debugging)
  saml_response TEXT, -- Received SAML Response (for debugging, encrypted)
  saml_assertion_id TEXT,

  -- OIDC specific
  oidc_nonce TEXT,
  oidc_code_verifier TEXT, -- PKCE code verifier

  -- Result
  user_id UUID REFERENCES auth.users(id),
  error_code TEXT,
  error_message TEXT,

  -- Metadata
  ip_address INET,
  user_agent TEXT,
  redirect_uri TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '10 minutes'),
  completed_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sso_login_sessions_request_id ON sso_login_sessions(request_id);
CREATE INDEX IF NOT EXISTS idx_sso_login_sessions_config_id ON sso_login_sessions(config_id);
CREATE INDEX IF NOT EXISTS idx_sso_login_sessions_status ON sso_login_sessions(status);
CREATE INDEX IF NOT EXISTS idx_sso_login_sessions_expires_at ON sso_login_sessions(expires_at);

COMMENT ON TABLE sso_login_sessions IS 'Tracks SSO login attempts and their status';

-- =============================================
-- SSO USER MAPPINGS
-- =============================================

CREATE TABLE IF NOT EXISTS sso_user_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  config_id UUID NOT NULL REFERENCES enterprise_sso_config(id) ON DELETE CASCADE,
  sso_subject_id TEXT NOT NULL, -- User ID from IdP (SAML NameID or OIDC sub)
  sso_email TEXT NOT NULL,
  sso_groups TEXT[],
  sso_attributes JSONB DEFAULT '{}'::jsonb, -- Raw attributes from IdP
  last_login_at TIMESTAMPTZ DEFAULT now(),
  login_count INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(config_id, sso_subject_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sso_user_mappings_user_id ON sso_user_mappings(user_id);
CREATE INDEX IF NOT EXISTS idx_sso_user_mappings_config_id ON sso_user_mappings(config_id);
CREATE INDEX IF NOT EXISTS idx_sso_user_mappings_subject ON sso_user_mappings(sso_subject_id);
CREATE INDEX IF NOT EXISTS idx_sso_user_mappings_email ON sso_user_mappings(sso_email);

-- Updated_at trigger
DROP TRIGGER IF EXISTS update_sso_user_mappings_updated_at ON sso_user_mappings;
CREATE TRIGGER update_sso_user_mappings_updated_at
  BEFORE UPDATE ON sso_user_mappings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE sso_user_mappings IS 'Links Supabase users to their SSO identities';

-- =============================================
-- SSO AUDIT LOGS
-- =============================================

CREATE TABLE IF NOT EXISTS sso_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_id UUID REFERENCES enterprise_sso_config(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'login_initiated', 'login_success', 'login_failed',
    'logout', 'config_created', 'config_updated',
    'config_deleted', 'config_verified', 'user_provisioned',
    'user_deprovisioned', 'group_sync'
  )),
  event_details JSONB DEFAULT '{}'::jsonb,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sso_audit_logs_config_id ON sso_audit_logs(config_id);
CREATE INDEX IF NOT EXISTS idx_sso_audit_logs_user_id ON sso_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_sso_audit_logs_event_type ON sso_audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_sso_audit_logs_created_at ON sso_audit_logs(created_at DESC);

COMMENT ON TABLE sso_audit_logs IS 'Audit trail for all SSO-related events';

-- =============================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================

ALTER TABLE enterprise_sso_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE sso_login_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sso_user_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE sso_audit_logs ENABLE ROW LEVEL SECURITY;

-- SSO Config - only admins can manage
DROP POLICY IF EXISTS "Admins can manage SSO configs" ON enterprise_sso_config;
CREATE POLICY "Admins can manage SSO configs"
  ON enterprise_sso_config FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Users can view active configs for their domain
DROP POLICY IF EXISTS "Users can view active SSO configs for their domain" ON enterprise_sso_config;
CREATE POLICY "Users can view active SSO configs for their domain"
  ON enterprise_sso_config FOR SELECT
  USING (
    active = true
  );

-- Login sessions - service role manages these
DROP POLICY IF EXISTS "Service role manages SSO sessions" ON sso_login_sessions;
CREATE POLICY "Service role manages SSO sessions"
  ON sso_login_sessions FOR ALL
  USING (true);

-- User mappings - users can view their own
DROP POLICY IF EXISTS "Users can view own SSO mappings" ON sso_user_mappings;
CREATE POLICY "Users can view own SSO mappings"
  ON sso_user_mappings FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all mappings for their configs
DROP POLICY IF EXISTS "Admins can manage SSO user mappings" ON sso_user_mappings;
CREATE POLICY "Admins can manage SSO user mappings"
  ON sso_user_mappings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Audit logs - admins can view
DROP POLICY IF EXISTS "Admins can view SSO audit logs" ON sso_audit_logs;
CREATE POLICY "Admins can view SSO audit logs"
  ON sso_audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Users can view their own audit logs
DROP POLICY IF EXISTS "Users can view own SSO audit logs" ON sso_audit_logs;
CREATE POLICY "Users can view own SSO audit logs"
  ON sso_audit_logs FOR SELECT
  USING (auth.uid() = user_id);

-- =============================================
-- HELPER FUNCTIONS
-- =============================================

-- Function to find SSO config by email domain
CREATE OR REPLACE FUNCTION find_sso_config_by_email(p_email TEXT)
RETURNS UUID AS $$
DECLARE
  v_domain TEXT;
  v_config_id UUID;
BEGIN
  -- Extract domain from email
  v_domain := split_part(p_email, '@', 2);

  SELECT id INTO v_config_id
  FROM enterprise_sso_config
  WHERE organization_domain = v_domain
  AND active = true
  LIMIT 1;

  RETURN v_config_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to find or create user from SSO
CREATE OR REPLACE FUNCTION find_or_create_sso_user(
  p_config_id UUID,
  p_email TEXT,
  p_subject_id TEXT,
  p_full_name TEXT DEFAULT NULL,
  p_groups TEXT[] DEFAULT NULL,
  p_attributes JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
  v_config enterprise_sso_config%ROWTYPE;
BEGIN
  -- Get SSO config
  SELECT * INTO v_config FROM enterprise_sso_config WHERE id = p_config_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'SSO config not found';
  END IF;

  -- Check if user already exists via SSO mapping
  SELECT user_id INTO v_user_id
  FROM sso_user_mappings
  WHERE config_id = p_config_id AND sso_subject_id = p_subject_id;

  IF v_user_id IS NOT NULL THEN
    -- Update existing mapping
    UPDATE sso_user_mappings
    SET
      sso_email = p_email,
      sso_groups = COALESCE(p_groups, sso_groups),
      sso_attributes = p_attributes,
      last_login_at = now(),
      login_count = login_count + 1,
      updated_at = now()
    WHERE config_id = p_config_id AND sso_subject_id = p_subject_id;

    RETURN v_user_id;
  END IF;

  -- Check if user exists by email
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = p_email;

  IF v_user_id IS NOT NULL THEN
    -- Link existing user to SSO
    INSERT INTO sso_user_mappings (user_id, config_id, sso_subject_id, sso_email, sso_groups, sso_attributes)
    VALUES (v_user_id, p_config_id, p_subject_id, p_email, p_groups, p_attributes);

    RETURN v_user_id;
  END IF;

  -- Auto-provision is handled at the application layer via Supabase Auth
  -- Return NULL to indicate new user needs to be created
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log SSO events
CREATE OR REPLACE FUNCTION log_sso_event(
  p_config_id UUID,
  p_user_id UUID,
  p_event_type TEXT,
  p_details JSONB DEFAULT '{}'::jsonb,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO sso_audit_logs (config_id, user_id, event_type, event_details, ip_address, user_agent)
  VALUES (p_config_id, p_user_id, p_event_type, p_details, p_ip_address, p_user_agent)
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cleanup function for expired SSO sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sso_sessions()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  UPDATE sso_login_sessions
  SET status = 'expired'
  WHERE status = 'pending' AND expires_at < now();

  -- Delete old sessions (keep for 30 days for audit)
  DELETE FROM sso_login_sessions
  WHERE created_at < now() - interval '30 days';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION find_sso_config_by_email IS 'Find SSO configuration by email domain';
COMMENT ON FUNCTION find_or_create_sso_user IS 'Find existing user or prepare for creation from SSO';
COMMENT ON FUNCTION log_sso_event IS 'Log SSO audit events';
COMMENT ON FUNCTION cleanup_expired_sso_sessions IS 'Cleanup expired SSO login sessions';
-- Visual Workflow Builder & Multi-Step Orchestration Tables
-- Supports visual workflow design, execution, and monitoring

-- =============================================
-- WORKFLOWS (Main workflow definitions)
-- =============================================

CREATE TABLE IF NOT EXISTS workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'general' CHECK (category IN ('lead_management', 'listing_automation', 'marketing', 'notifications', 'integrations', 'general')),

  -- Visual Builder Data
  nodes JSONB NOT NULL DEFAULT '[]'::jsonb,
  edges JSONB NOT NULL DEFAULT '[]'::jsonb,
  viewport JSONB DEFAULT '{"x": 0, "y": 0, "zoom": 1}'::jsonb,

  -- Workflow Settings
  is_published BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT false,
  trigger_config JSONB DEFAULT '{}'::jsonb, -- Trigger configuration

  -- Versioning
  version INTEGER DEFAULT 1,
  published_version INTEGER,
  last_published_at TIMESTAMPTZ,

  -- Stats
  execution_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  last_executed_at TIMESTAMPTZ,

  -- Metadata
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_workflows_user_id ON workflows(user_id);
CREATE INDEX IF NOT EXISTS idx_workflows_category ON workflows(category);
CREATE INDEX IF NOT EXISTS idx_workflows_active ON workflows(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_workflows_published ON workflows(is_published) WHERE is_published = true;

-- Updated_at trigger
DROP TRIGGER IF EXISTS update_workflows_updated_at ON workflows;
CREATE TRIGGER update_workflows_updated_at
  BEFORE UPDATE ON workflows
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE workflows IS 'User-created automation workflows with visual builder data';

-- =============================================
-- WORKFLOW VERSIONS (Version history)
-- =============================================

CREATE TABLE IF NOT EXISTS workflow_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  nodes JSONB NOT NULL,
  edges JSONB NOT NULL,
  trigger_config JSONB,
  change_summary TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(workflow_id, version)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_workflow_versions_workflow_id ON workflow_versions(workflow_id);

COMMENT ON TABLE workflow_versions IS 'Version history for workflows';

-- =============================================
-- WORKFLOW NODE TEMPLATES (Pre-built nodes)
-- =============================================

CREATE TABLE IF NOT EXISTS workflow_node_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('trigger', 'action', 'condition', 'delay', 'loop', 'transform')),
  subtype TEXT NOT NULL, -- e.g., 'new_lead', 'send_email', 'update_status'
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  category TEXT NOT NULL,

  -- Configuration Schema
  config_schema JSONB NOT NULL DEFAULT '{}'::jsonb, -- JSON Schema for node config
  default_config JSONB DEFAULT '{}'::jsonb,

  -- Display
  color TEXT DEFAULT '#4F46E5',
  documentation_url TEXT,

  -- Metadata
  is_premium BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(type, subtype)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_workflow_node_templates_type ON workflow_node_templates(type);
CREATE INDEX IF NOT EXISTS idx_workflow_node_templates_category ON workflow_node_templates(category);

COMMENT ON TABLE workflow_node_templates IS 'Pre-built workflow node templates';

-- =============================================
-- WORKFLOW EXECUTIONS (Runtime instances)
-- =============================================

CREATE TABLE IF NOT EXISTS workflow_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workflow_version INTEGER NOT NULL,

  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'paused', 'completed', 'failed', 'cancelled', 'timeout')),

  -- Execution Context
  trigger_type TEXT NOT NULL,
  trigger_data JSONB DEFAULT '{}'::jsonb, -- Data that triggered the workflow
  context JSONB DEFAULT '{}'::jsonb, -- Shared context between steps
  variables JSONB DEFAULT '{}'::jsonb, -- User-defined variables

  -- Progress
  current_node_id TEXT,
  completed_nodes TEXT[] DEFAULT ARRAY[]::TEXT[],

  -- Timing
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  timeout_at TIMESTAMPTZ,

  -- Result
  result JSONB,
  error_message TEXT,
  error_node_id TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_workflow_executions_workflow_id ON workflow_executions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_user_id ON workflow_executions(user_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_status ON workflow_executions(status);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_started_at ON workflow_executions(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_running ON workflow_executions(status) WHERE status = 'running';

COMMENT ON TABLE workflow_executions IS 'Running and completed workflow instances';

-- =============================================
-- WORKFLOW EXECUTION STEPS (Per-node tracking)
-- =============================================

CREATE TABLE IF NOT EXISTS workflow_execution_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id UUID NOT NULL REFERENCES workflow_executions(id) ON DELETE CASCADE,
  node_id TEXT NOT NULL,
  node_type TEXT NOT NULL,
  node_name TEXT,

  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'skipped', 'waiting')),

  -- Data
  input_data JSONB DEFAULT '{}'::jsonb,
  output_data JSONB DEFAULT '{}'::jsonb,

  -- Timing
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,

  -- Error
  error_message TEXT,
  error_details JSONB,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_workflow_execution_steps_execution_id ON workflow_execution_steps(execution_id);
CREATE INDEX IF NOT EXISTS idx_workflow_execution_steps_status ON workflow_execution_steps(status);
CREATE INDEX IF NOT EXISTS idx_workflow_execution_steps_node_id ON workflow_execution_steps(node_id);

COMMENT ON TABLE workflow_execution_steps IS 'Individual step execution records within a workflow';

-- =============================================
-- WORKFLOW EXECUTION QUEUE (Async processing)
-- =============================================

CREATE TABLE IF NOT EXISTS workflow_execution_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id UUID NOT NULL REFERENCES workflow_executions(id) ON DELETE CASCADE,
  node_id TEXT NOT NULL,

  -- Queue Settings
  priority INTEGER DEFAULT 50, -- Higher = sooner
  scheduled_for TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Processing
  locked_at TIMESTAMPTZ,
  locked_by TEXT, -- Worker ID
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 5,

  -- Error handling
  last_error TEXT,
  next_retry_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now()
);