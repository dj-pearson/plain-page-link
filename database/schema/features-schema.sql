-- ============================================
-- AgentBio.net Advanced Features Schema
-- ============================================
-- This schema supports 10 advanced features with usage-based pricing
-- and comprehensive tracking for Stripe billing

-- ============================================
-- PRICING & SUBSCRIPTION SYSTEM
-- ============================================

-- Feature catalog with usage limits
CREATE TABLE IF NOT EXISTS feature_catalog (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  feature_key VARCHAR(100) UNIQUE NOT NULL,
  feature_name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50), -- 'ai_generation', 'analytics', 'automation', 'tools'

  -- Pricing options
  pricing_model VARCHAR(50) NOT NULL, -- 'per_use', 'monthly_limit', 'unlimited', 'tiered'
  price_per_use DECIMAL(10, 2), -- Cost per single use (e.g., $2 per AI generation)
  cost_to_provide DECIMAL(10, 2), -- Our cost (e.g., $0.30 for API calls)

  -- Technical details
  requires_api_keys BOOLEAN DEFAULT FALSE,
  api_provider VARCHAR(100), -- 'openai', 'twilio', 'sendgrid', etc.

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscription plan features with limits
CREATE TABLE IF NOT EXISTS subscription_plan_features (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_id UUID REFERENCES subscription_plans(id) ON DELETE CASCADE,
  feature_key VARCHAR(100) REFERENCES feature_catalog(feature_key),

  -- Usage limits
  monthly_limit INTEGER, -- NULL = unlimited, 0 = disabled
  overage_allowed BOOLEAN DEFAULT FALSE,
  overage_price DECIMAL(10, 2), -- Price per unit over limit

  -- Feature configuration
  enabled BOOLEAN DEFAULT TRUE,
  config JSONB, -- Feature-specific settings

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(plan_id, feature_key)
);

-- Usage tracking for billing
CREATE TABLE IF NOT EXISTS feature_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  feature_key VARCHAR(100) REFERENCES feature_catalog(feature_key),

  -- Usage details
  usage_count INTEGER DEFAULT 1,
  usage_metadata JSONB, -- Store feature-specific data

  -- Billing
  included_in_plan BOOLEAN DEFAULT TRUE,
  charged_amount DECIMAL(10, 2) DEFAULT 0,
  billing_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'billed', 'failed'
  stripe_invoice_id VARCHAR(255),

  -- Timestamps
  used_at TIMESTAMPTZ DEFAULT NOW(),
  billed_at TIMESTAMPTZ,

  -- Indexes
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_feature_usage_user_feature ON feature_usage(user_id, feature_key);
CREATE INDEX idx_feature_usage_billing ON feature_usage(billing_status, billed_at);
CREATE INDEX idx_feature_usage_date ON feature_usage(used_at);

-- Monthly usage summary for quick lookups
CREATE TABLE IF NOT EXISTS monthly_usage_summary (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  feature_key VARCHAR(100) REFERENCES feature_catalog(feature_key),

  -- Period
  year INTEGER NOT NULL,
  month INTEGER NOT NULL, -- 1-12

  -- Totals
  total_usage INTEGER DEFAULT 0,
  included_usage INTEGER DEFAULT 0,
  overage_usage INTEGER DEFAULT 0,
  total_charged DECIMAL(10, 2) DEFAULT 0,

  -- Status
  finalized BOOLEAN DEFAULT FALSE,
  stripe_invoice_id VARCHAR(255),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, feature_key, year, month)
);

CREATE INDEX idx_monthly_usage_period ON monthly_usage_summary(year, month);

-- ============================================
-- FEATURE 1: AI LISTING DESCRIPTION GENERATOR
-- ============================================

CREATE TABLE IF NOT EXISTS ai_listing_descriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,

  -- Input parameters
  property_type VARCHAR(100),
  key_features TEXT[],
  neighborhood VARCHAR(255),
  price_point DECIMAL(12, 2),
  target_buyer VARCHAR(100),
  tone VARCHAR(50), -- 'professional', 'luxury', 'warm', 'investment-focused'

  -- Generated content
  headline TEXT,
  short_description TEXT, -- 150 chars for social
  full_description TEXT, -- 500 words
  social_media_caption TEXT,
  email_subject_line TEXT,
  seo_keywords TEXT[],
  fair_housing_compliant BOOLEAN DEFAULT TRUE,
  fair_housing_notes TEXT,

  -- AI metadata
  model_used VARCHAR(100),
  tokens_used INTEGER,
  generation_time_ms INTEGER,
  cost_incurred DECIMAL(10, 4),

  -- Status
  status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'approved', 'published'

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ai_descriptions_user ON ai_listing_descriptions(user_id);
CREATE INDEX idx_ai_descriptions_listing ON ai_listing_descriptions(listing_id);

-- ============================================
-- FEATURE 2: SMART LEAD SCORING
-- ============================================

CREATE TABLE IF NOT EXISTS lead_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,

  -- Score components
  overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
  priority VARCHAR(20), -- 'hot', 'warm', 'cold'

  -- Intent signals
  profile_visits INTEGER DEFAULT 0,
  listings_viewed INTEGER DEFAULT 0,
  time_on_site INTEGER DEFAULT 0, -- seconds
  return_visitor BOOLEAN DEFAULT FALSE,

  -- Engagement signals
  clicked_phone BOOLEAN DEFAULT FALSE,
  clicked_email BOOLEAN DEFAULT FALSE,
  clicked_calendar BOOLEAN DEFAULT FALSE,
  downloaded_document BOOLEAN DEFAULT FALSE,

  -- Form data signals
  timeframe VARCHAR(50),
  pre_approval_status VARCHAR(20),
  has_agent BOOLEAN DEFAULT FALSE,
  first_time_buyer BOOLEAN,

  -- Recommendations
  next_action TEXT,
  talking_points TEXT[],
  estimated_conversion_probability INTEGER,

  -- ML predictions (future)
  ml_prediction_score DECIMAL(5, 2),
  ml_model_version VARCHAR(50),

  -- Timestamps
  scored_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(lead_id)
);

CREATE INDEX idx_lead_scores_user ON lead_scores(user_id);
CREATE INDEX idx_lead_scores_priority ON lead_scores(priority, scored_at);
CREATE INDEX idx_lead_scores_score ON lead_scores(overall_score DESC);

-- Lead scoring history for ML training
CREATE TABLE IF NOT EXISTS lead_score_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  score_snapshot JSONB, -- Full score data at time
  scored_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lead conversion tracking for ML
CREATE TABLE IF NOT EXISTS lead_conversions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,

  -- Conversion details
  converted BOOLEAN DEFAULT FALSE,
  conversion_type VARCHAR(50), -- 'listing_signed', 'buyer_representation', 'closed_deal'
  conversion_value DECIMAL(12, 2),
  days_to_convert INTEGER,

  -- Notes
  conversion_notes TEXT,

  converted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- FEATURE 3: AUTOMATED FOLLOW-UP SEQUENCES
-- ============================================

CREATE TABLE IF NOT EXISTS follow_up_sequences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,

  -- Sequence details
  name VARCHAR(255) NOT NULL,
  description TEXT,
  trigger_type VARCHAR(100) NOT NULL, -- 'form_submission', 'calendar_no_show', 'listing_view', 'cold_lead'

  -- Settings
  send_from_agent BOOLEAN DEFAULT TRUE,
  pause_if_replies BOOLEAN DEFAULT TRUE,
  business_hours_only BOOLEAN DEFAULT TRUE,
  skip_weekends BOOLEAN DEFAULT FALSE,

  -- Status
  active BOOLEAN DEFAULT TRUE,
  is_template BOOLEAN DEFAULT FALSE, -- Pre-built templates

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sequences_user ON follow_up_sequences(user_id);

CREATE TABLE IF NOT EXISTS follow_up_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sequence_id UUID REFERENCES follow_up_sequences(id) ON DELETE CASCADE,

  -- Message details
  step_number INTEGER NOT NULL,
  delay_minutes INTEGER NOT NULL, -- Convert "15 minutes" → 15, "1 day" → 1440
  channel VARCHAR(20) NOT NULL, -- 'email', 'sms', 'both'

  -- Content
  subject TEXT, -- For email
  body TEXT NOT NULL,

  -- Attachments
  attachment_urls TEXT[],

  -- CTA
  call_to_action VARCHAR(100), -- 'schedule_call', 'view_listings', 'reply'
  cta_url TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(sequence_id, step_number)
);

-- Active sequence instances per lead
CREATE TABLE IF NOT EXISTS active_sequences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  sequence_id UUID REFERENCES follow_up_sequences(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,

  -- Progress
  current_step INTEGER DEFAULT 0,
  next_message_at TIMESTAMPTZ,

  -- Status
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'paused', 'completed', 'stopped'
  pause_reason VARCHAR(255),

  -- Tracking
  messages_sent INTEGER DEFAULT 0,
  lead_responded BOOLEAN DEFAULT FALSE,
  response_step INTEGER,

  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(lead_id, sequence_id)
);

CREATE INDEX idx_active_sequences_next_message ON active_sequences(next_message_at) WHERE status = 'active';
CREATE INDEX idx_active_sequences_user ON active_sequences(user_id);

-- Message delivery log
CREATE TABLE IF NOT EXISTS sequence_message_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  active_sequence_id UUID REFERENCES active_sequences(id) ON DELETE CASCADE,
  message_id UUID REFERENCES follow_up_messages(id) ON DELETE SET NULL,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,

  -- Delivery details
  channel VARCHAR(20),
  recipient_email VARCHAR(255),
  recipient_phone VARCHAR(50),

  -- Content sent
  subject TEXT,
  body TEXT,

  -- Status
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'sent', 'delivered', 'failed', 'bounced'
  provider_message_id VARCHAR(255),
  error_message TEXT,

  -- Timestamps
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sequence_log_status ON sequence_message_log(status, scheduled_at);

-- ============================================
-- FEATURE 4: INTERACTIVE MARKET REPORTS
-- ============================================

CREATE TABLE IF NOT EXISTS market_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,

  -- Location
  zip_code VARCHAR(20),
  city VARCHAR(255),
  neighborhood VARCHAR(255),
  county VARCHAR(255),
  state VARCHAR(2),

  -- Filters
  property_type VARCHAR(50), -- 'all', 'single_family', 'condo', 'townhouse'
  price_min DECIMAL(12, 2),
  price_max DECIMAL(12, 2),

  -- Generated data (stored as JSONB for flexibility)
  price_trends JSONB,
  inventory_metrics JSONB,
  neighborhood_scores JSONB,
  demographics JSONB,
  recent_sales JSONB,

  -- Report outputs
  report_url VARCHAR(500), -- Interactive web version
  pdf_url VARCHAR(500),
  social_graphics_urls TEXT[],

  -- Analytics
  views INTEGER DEFAULT 0,
  leads_captured INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,

  -- Status
  status VARCHAR(50) DEFAULT 'generating', -- 'generating', 'published', 'archived'
  generation_error TEXT,

  -- Branding
  agent_message TEXT,
  custom_branding JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_market_reports_user ON market_reports(user_id);
CREATE INDEX idx_market_reports_location ON market_reports(zip_code, city);
CREATE INDEX idx_market_reports_status ON market_reports(status, published_at);

-- Market report lead captures
CREATE TABLE IF NOT EXISTS market_report_leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  market_report_id UUID REFERENCES market_reports(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,

  -- Lead info
  name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  property_address TEXT,

  -- Context
  form_type VARCHAR(50), -- 'home_valuation', 'contact_agent', 'subscribe'
  referrer_url TEXT,

  -- Linked to main leads table
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- FEATURE 5: VIRTUAL STAGING & AI PHOTO ENHANCEMENT
-- ============================================

CREATE TABLE IF NOT EXISTS photo_enhancements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,

  -- Original photo
  original_url VARCHAR(500) NOT NULL,
  original_filename VARCHAR(255),
  original_size_bytes BIGINT,

  -- Enhancement type
  enhancement_type VARCHAR(50) NOT NULL, -- 'virtual_staging', 'enhancement', 'declutter', 'sky_replacement'
  style VARCHAR(100), -- 'modern', 'traditional', 'luxury', etc.
  room_type VARCHAR(100), -- 'living_room', 'bedroom', 'kitchen', etc.

  -- Enhanced photo
  enhanced_url VARCHAR(500),
  enhanced_filename VARCHAR(255),

  -- Processing
  ai_provider VARCHAR(100), -- 'openai_dalle', 'midjourney', 'stable_diffusion'
  processing_time_ms INTEGER,
  cost_incurred DECIMAL(10, 4),

  -- Status
  status VARCHAR(50) DEFAULT 'processing', -- 'processing', 'completed', 'failed'
  error_message TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_photo_enhancements_user ON photo_enhancements(user_id);
CREATE INDEX idx_photo_enhancements_listing ON photo_enhancements(listing_id);

-- ============================================
-- FEATURE 6: PREDICTIVE ANALYTICS
-- ============================================

CREATE TABLE IF NOT EXISTS predictive_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,

  -- Prediction type
  prediction_type VARCHAR(100) NOT NULL, -- 'lead_conversion', 'listing_sale_time', 'optimal_price'
  entity_type VARCHAR(50), -- 'lead', 'listing'
  entity_id UUID,

  -- Prediction
  prediction_value JSONB, -- Flexible storage for different prediction types
  confidence_score DECIMAL(5, 2), -- 0-100

  -- Model info
  model_version VARCHAR(50),
  features_used TEXT[],

  -- Outcome tracking
  actual_outcome JSONB,
  prediction_accuracy DECIMAL(5, 2),

  predicted_at TIMESTAMPTZ DEFAULT NOW(),
  outcome_recorded_at TIMESTAMPTZ
);

CREATE INDEX idx_predictions_user ON predictive_analytics(user_id);
CREATE INDEX idx_predictions_type ON predictive_analytics(prediction_type, predicted_at);

-- ============================================
-- FEATURE 7: VIDEO TOUR & REEL GENERATOR
-- ============================================

CREATE TABLE IF NOT EXISTS video_tours (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,

  -- Input
  photo_urls TEXT[] NOT NULL,
  music_track VARCHAR(255),
  video_style VARCHAR(50), -- 'luxury', 'modern', 'cinematic'
  duration_seconds INTEGER,

  -- Customization
  include_agent_intro BOOLEAN DEFAULT TRUE,
  include_call_to_action BOOLEAN DEFAULT TRUE,
  custom_text_overlay TEXT[],

  -- Output
  video_url VARCHAR(500),
  thumbnail_url VARCHAR(500),

  -- Formats
  instagram_reel_url VARCHAR(500),
  youtube_short_url VARCHAR(500),
  tiktok_url VARCHAR(500),

  -- Processing
  ai_provider VARCHAR(100),
  processing_time_ms INTEGER,
  cost_incurred DECIMAL(10, 4),

  -- Status
  status VARCHAR(50) DEFAULT 'queued', -- 'queued', 'processing', 'completed', 'failed'
  error_message TEXT,

  -- Analytics
  views INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  leads_generated INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_video_tours_user ON video_tours(user_id);
CREATE INDEX idx_video_tours_listing ON video_tours(listing_id);

-- ============================================
-- FEATURE 8: OPEN HOUSE MANAGEMENT
-- ============================================

CREATE TABLE IF NOT EXISTS open_houses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,

  -- Event details
  title VARCHAR(255) NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,

  -- Location (usually same as listing)
  address TEXT,
  city VARCHAR(255),
  state VARCHAR(2),
  zip_code VARCHAR(20),

  -- Settings
  require_registration BOOLEAN DEFAULT TRUE,
  send_reminders BOOLEAN DEFAULT TRUE,
  collect_feedback BOOLEAN DEFAULT TRUE,

  -- Registration page
  registration_url VARCHAR(500),
  custom_questions JSONB, -- Additional questions to ask

  -- Status
  status VARCHAR(50) DEFAULT 'scheduled', -- 'scheduled', 'active', 'completed', 'cancelled'

  -- Stats
  registered_count INTEGER DEFAULT 0,
  attended_count INTEGER DEFAULT 0,
  leads_captured INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_open_houses_user ON open_houses(user_id);
CREATE INDEX idx_open_houses_time ON open_houses(start_time);
CREATE INDEX idx_open_houses_listing ON open_houses(listing_id);

-- Open house registrations
CREATE TABLE IF NOT EXISTS open_house_registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  open_house_id UUID REFERENCES open_houses(id) ON DELETE CASCADE,

  -- Visitor info
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),

  -- Qualification
  buyer_status VARCHAR(50), -- 'pre_approved', 'looking', 'just_browsing'
  timeframe VARCHAR(50),
  custom_responses JSONB,

  -- Attendance
  attended BOOLEAN DEFAULT FALSE,
  check_in_time TIMESTAMPTZ,
  check_out_time TIMESTAMPTZ,
  time_spent_minutes INTEGER,

  -- Follow-up
  feedback_submitted BOOLEAN DEFAULT FALSE,
  feedback_rating INTEGER CHECK (feedback_rating >= 1 AND feedback_rating <= 5),
  feedback_comments TEXT,

  -- Lead connection
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_oh_registrations_event ON open_house_registrations(open_house_id);
CREATE INDEX idx_oh_registrations_attended ON open_house_registrations(attended);

-- ============================================
-- FEATURE 9: MORTGAGE CALCULATOR
-- ============================================

CREATE TABLE IF NOT EXISTS mortgage_calculations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,

  -- Input parameters
  home_price DECIMAL(12, 2) NOT NULL,
  down_payment DECIMAL(12, 2),
  down_payment_percent DECIMAL(5, 2),
  interest_rate DECIMAL(5, 3),
  loan_term_years INTEGER DEFAULT 30,

  -- Additional costs
  property_tax_annual DECIMAL(10, 2),
  home_insurance_annual DECIMAL(10, 2),
  hoa_monthly DECIMAL(10, 2),
  pmi_monthly DECIMAL(10, 2),

  -- Calculated results
  loan_amount DECIMAL(12, 2),
  monthly_payment DECIMAL(10, 2),
  monthly_payment_breakdown JSONB, -- principal, interest, tax, insurance, hoa, pmi
  total_interest DECIMAL(12, 2),
  total_cost DECIMAL(12, 2),

  -- Lead capture (if visitor provides info)
  visitor_name VARCHAR(255),
  visitor_email VARCHAR(255),
  visitor_phone VARCHAR(50),
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,

  -- Context
  session_id VARCHAR(255),
  referrer_url TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_mortgage_calcs_user ON mortgage_calculations(user_id);
CREATE INDEX idx_mortgage_calcs_listing ON mortgage_calculations(listing_id);
CREATE INDEX idx_mortgage_calcs_lead ON mortgage_calculations(lead_id);

-- ============================================
-- FEATURE 10: AI-POWERED CMA GENERATOR
-- ============================================

CREATE TABLE IF NOT EXISTS cma_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,

  -- Subject property
  subject_address TEXT NOT NULL,
  subject_city VARCHAR(255),
  subject_state VARCHAR(2),
  subject_zip VARCHAR(20),

  -- Property details
  beds INTEGER,
  baths DECIMAL(3, 1),
  sqft INTEGER,
  lot_size INTEGER,
  year_built INTEGER,
  property_condition VARCHAR(50),
  upgrades TEXT[],

  -- Seller goals
  timeline VARCHAR(50),
  price_goal VARCHAR(50), -- 'maximize', 'sell_fast', 'balanced'

  -- Analysis (stored as JSONB)
  comparables JSONB, -- Array of comp properties with adjustments
  active_listings JSONB,
  market_analysis JSONB,
  valuation JSONB, -- Conservative, recommended, optimistic prices
  pricing_strategy JSONB,
  marketing_plan JSONB,
  net_proceeds JSONB,

  -- Report outputs
  report_url VARCHAR(500), -- Interactive web version
  pdf_url VARCHAR(500),

  -- Lead info (requester)
  requester_name VARCHAR(255),
  requester_email VARCHAR(255),
  requester_phone VARCHAR(50),
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,

  -- Status
  status VARCHAR(50) DEFAULT 'generating', -- 'generating', 'completed', 'failed'
  generation_error TEXT,

  -- Analytics
  views INTEGER DEFAULT 0,
  time_spent_seconds INTEGER DEFAULT 0,
  lead_converted BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cma_reports_user ON cma_reports(user_id);
CREATE INDEX idx_cma_reports_location ON cma_reports(subject_zip, subject_city);
CREATE INDEX idx_cma_reports_lead ON cma_reports(lead_id);

-- ============================================
-- STRIPE BILLING INTEGRATION
-- ============================================

-- Stripe customer mapping
CREATE TABLE IF NOT EXISTS stripe_customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  stripe_customer_id VARCHAR(255) UNIQUE NOT NULL,

  -- Customer details
  email VARCHAR(255),
  name VARCHAR(255),

  -- Default payment method
  default_payment_method_id VARCHAR(255),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Usage-based billing items
CREATE TABLE IF NOT EXISTS stripe_usage_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  stripe_subscription_item_id VARCHAR(255) NOT NULL,

  -- Usage details
  feature_key VARCHAR(100),
  quantity INTEGER NOT NULL,

  -- Stripe response
  stripe_usage_record_id VARCHAR(255),
  timestamp TIMESTAMPTZ NOT NULL,

  -- Sync status
  synced_to_stripe BOOLEAN DEFAULT FALSE,
  sync_error TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  synced_at TIMESTAMPTZ
);

CREATE INDEX idx_stripe_usage_sync ON stripe_usage_records(synced_to_stripe, created_at);

-- Invoice tracking
CREATE TABLE IF NOT EXISTS stripe_invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  stripe_invoice_id VARCHAR(255) UNIQUE NOT NULL,
  stripe_subscription_id VARCHAR(255),

  -- Invoice details
  amount_due DECIMAL(10, 2),
  amount_paid DECIMAL(10, 2),
  currency VARCHAR(3) DEFAULT 'usd',

  -- Period
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,

  -- Status
  status VARCHAR(50), -- 'draft', 'open', 'paid', 'void', 'uncollectible'
  paid BOOLEAN DEFAULT FALSE,

  -- URLs
  hosted_invoice_url VARCHAR(500),
  invoice_pdf_url VARCHAR(500),

  -- Timestamps
  created_at_stripe TIMESTAMPTZ,
  due_date TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_stripe_invoices_user ON stripe_invoices(user_id);
CREATE INDEX idx_stripe_invoices_status ON stripe_invoices(status, due_date);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to check feature usage limit
CREATE OR REPLACE FUNCTION check_feature_limit(
  p_user_id UUID,
  p_feature_key VARCHAR
) RETURNS TABLE (
  allowed BOOLEAN,
  remaining INTEGER,
  limit_reached BOOLEAN,
  overage_allowed BOOLEAN
) AS $$
DECLARE
  v_plan_id UUID;
  v_monthly_limit INTEGER;
  v_current_usage INTEGER;
  v_overage_allowed BOOLEAN;
BEGIN
  -- Get user's plan
  SELECT up.subscription_plan_id INTO v_plan_id
  FROM user_subscriptions up
  WHERE up.user_id = p_user_id
    AND up.status = 'active'
  ORDER BY up.created_at DESC
  LIMIT 1;

  -- Get feature limits for this plan
  SELECT spf.monthly_limit, spf.overage_allowed
  INTO v_monthly_limit, v_overage_allowed
  FROM subscription_plan_features spf
  WHERE spf.plan_id = v_plan_id
    AND spf.feature_key = p_feature_key
    AND spf.enabled = TRUE;

  -- If no limit found, feature not available
  IF v_monthly_limit IS NULL THEN
    RETURN QUERY SELECT FALSE, 0, TRUE, FALSE;
    RETURN;
  END IF;

  -- Unlimited access
  IF v_monthly_limit = -1 THEN
    RETURN QUERY SELECT TRUE, -1, FALSE, FALSE;
    RETURN;
  END IF;

  -- Get current month usage
  SELECT COALESCE(SUM(usage_count), 0) INTO v_current_usage
  FROM feature_usage
  WHERE user_id = p_user_id
    AND feature_key = p_feature_key
    AND EXTRACT(YEAR FROM used_at) = EXTRACT(YEAR FROM NOW())
    AND EXTRACT(MONTH FROM used_at) = EXTRACT(MONTH FROM NOW());

  -- Check if under limit
  IF v_current_usage < v_monthly_limit THEN
    RETURN QUERY SELECT TRUE, v_monthly_limit - v_current_usage, FALSE, v_overage_allowed;
  ELSE
    -- Limit reached - check overage
    RETURN QUERY SELECT v_overage_allowed, 0, TRUE, v_overage_allowed;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to record feature usage
CREATE OR REPLACE FUNCTION record_feature_usage(
  p_user_id UUID,
  p_feature_key VARCHAR,
  p_usage_count INTEGER DEFAULT 1,
  p_metadata JSONB DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_usage_id UUID;
  v_check RECORD;
  v_included BOOLEAN;
  v_charge DECIMAL(10, 2);
  v_overage_price DECIMAL(10, 2);
BEGIN
  -- Check limits
  SELECT * INTO v_check FROM check_feature_limit(p_user_id, p_feature_key);

  -- Determine if this is overage
  v_included := NOT v_check.limit_reached;
  v_charge := 0;

  IF NOT v_included THEN
    -- Get overage price
    SELECT spf.overage_price INTO v_overage_price
    FROM user_subscriptions us
    JOIN subscription_plan_features spf ON spf.plan_id = us.subscription_plan_id
    WHERE us.user_id = p_user_id
      AND us.status = 'active'
      AND spf.feature_key = p_feature_key
    ORDER BY us.created_at DESC
    LIMIT 1;

    v_charge := v_overage_price * p_usage_count;
  END IF;

  -- Record usage
  INSERT INTO feature_usage (
    user_id,
    feature_key,
    usage_count,
    usage_metadata,
    included_in_plan,
    charged_amount
  ) VALUES (
    p_user_id,
    p_feature_key,
    p_usage_count,
    p_metadata,
    v_included,
    v_charge
  ) RETURNING id INTO v_usage_id;

  RETURN v_usage_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- SEED DATA: Feature Catalog
-- ============================================

INSERT INTO feature_catalog (feature_key, feature_name, description, category, pricing_model, price_per_use, cost_to_provide, api_provider) VALUES
('ai_listing_description', 'AI Listing Description Generator', 'Generate professional listing descriptions with AI', 'ai_generation', 'per_use', 2.00, 0.30, 'openai'),
('lead_scoring', 'Smart Lead Scoring', 'AI-powered lead prioritization and intent signals', 'analytics', 'monthly_limit', 0, 0, NULL),
('follow_up_sequences', 'Automated Follow-Up Sequences', 'Email and SMS drip campaigns', 'automation', 'monthly_limit', 0, 0.01, 'sendgrid'),
('market_reports', 'Interactive Market Reports', 'Generate comprehensive market analysis reports', 'tools', 'per_use', 10.00, 2.00, 'multiple'),
('virtual_staging', 'Virtual Staging', 'AI-powered photo staging and enhancement', 'ai_generation', 'per_use', 5.00, 3.00, 'openai'),
('predictive_analytics', 'Predictive Analytics', 'AI predictions for lead conversion and pricing', 'analytics', 'monthly_limit', 0, 0, NULL),
('video_tours', 'Video Tour Generator', 'Automated video tours from photos', 'ai_generation', 'per_use', 15.00, 8.00, 'multiple'),
('open_house_management', 'Open House Management', 'Complete open house registration and tracking', 'tools', 'monthly_limit', 0, 0, NULL),
('mortgage_calculator', 'Mortgage Calculator Widget', 'Interactive mortgage and affordability calculators', 'tools', 'unlimited', 0, 0, NULL),
('cma_generator', 'AI CMA Generator', 'Instant comparative market analysis reports', 'ai_generation', 'per_use', 19.99, 3.00, 'multiple')
ON CONFLICT (feature_key) DO NOTHING;

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Feature usage aggregation
CREATE INDEX IF NOT EXISTS idx_feature_usage_monthly ON feature_usage(user_id, feature_key, EXTRACT(YEAR FROM used_at), EXTRACT(MONTH FROM used_at));

-- Active sequences next job
CREATE INDEX IF NOT EXISTS idx_active_seq_jobs ON active_sequences(next_message_at, status) WHERE status = 'active';

-- Analytics queries
CREATE INDEX IF NOT EXISTS idx_market_reports_views ON market_reports(user_id, views);
CREATE INDEX IF NOT EXISTS idx_cma_reports_converted ON cma_reports(user_id, lead_converted);
