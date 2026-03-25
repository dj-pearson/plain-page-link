
CREATE INDEX IF NOT EXISTS idx_pseo_pages_url_path ON pseo_pages(url_path);
CREATE INDEX IF NOT EXISTS idx_pseo_pages_page_type ON pseo_pages(page_type);
CREATE INDEX IF NOT EXISTS idx_pseo_pages_published ON pseo_pages(is_published) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_pseo_pages_combination_city ON pseo_pages USING gin(combination);
CREATE INDEX IF NOT EXISTS idx_pseo_pages_refresh ON pseo_pages(next_refresh_at) WHERE is_published = true;

-- Auto-update updated_at and set published_at
CREATE OR REPLACE FUNCTION update_pseo_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  IF NEW.is_published = true AND (OLD.is_published = false OR OLD.is_published IS NULL) THEN
    NEW.published_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS pseo_pages_updated_at ON pseo_pages;
CREATE TRIGGER pseo_pages_updated_at
  BEFORE UPDATE ON pseo_pages
  FOR EACH ROW EXECUTE FUNCTION update_pseo_updated_at();

-- RLS
ALTER TABLE pseo_pages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read published pseo pages" ON pseo_pages;
CREATE POLICY "Public read published pseo pages"
  ON pseo_pages FOR SELECT
  USING (is_published = true);

DROP POLICY IF EXISTS "Admin full access pseo pages" ON pseo_pages;
CREATE POLICY "Admin full access pseo pages"
  ON pseo_pages FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Generation queue table
CREATE TABLE IF NOT EXISTS pseo_combination_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_type TEXT NOT NULL,
  combination JSONB NOT NULL,
  priority INTEGER NOT NULL DEFAULT 5,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'complete', 'failed', 'insufficient_data')),
  queued_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  error_message TEXT,
  attempt_count INTEGER DEFAULT 0,
  UNIQUE (page_type, combination)
);

CREATE INDEX IF NOT EXISTS idx_queue_status_priority ON pseo_combination_queue(status, priority, queued_at);

ALTER TABLE pseo_combination_queue ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin full access pseo queue" ON pseo_combination_queue;
CREATE POLICY "Admin full access pseo queue"
  ON pseo_combination_queue FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Taxonomy table (city/state/specialty/situation context objects)
CREATE TABLE IF NOT EXISTS pseo_taxonomy (
  id TEXT PRIMARY KEY,
  taxonomy_type TEXT NOT NULL
    CHECK (taxonomy_type IN ('city', 'state', 'neighborhood', 'specialty', 'situation', 'property_type')),
  display_name TEXT NOT NULL,
  parent_id TEXT REFERENCES pseo_taxonomy(id),
  context JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  tier INTEGER DEFAULT 3,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_taxonomy_type ON pseo_taxonomy(taxonomy_type);
CREATE INDEX IF NOT EXISTS idx_taxonomy_parent ON pseo_taxonomy(parent_id);

ALTER TABLE pseo_taxonomy ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read active taxonomy" ON pseo_taxonomy;
CREATE POLICY "Public read active taxonomy"
  ON pseo_taxonomy FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Admin full access taxonomy" ON pseo_taxonomy;
CREATE POLICY "Admin full access taxonomy"
  ON pseo_taxonomy FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Generation errors log
CREATE TABLE IF NOT EXISTS pseo_generation_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_type TEXT NOT NULL,
  combination JSONB NOT NULL,
  error_type TEXT NOT NULL
    CHECK (error_type IN ('api_error', 'validation_failed', 'quality_check_failed', 'timeout', 'parse_error')),
  error_detail TEXT,
  quality_check_failures JSONB,
  raw_response TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_errors_created_at ON pseo_generation_errors(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_errors_type ON pseo_generation_errors(error_type);

ALTER TABLE pseo_generation_errors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin read errors" ON pseo_generation_errors;
CREATE POLICY "Admin read errors"
  ON pseo_generation_errors FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Prompt templates table
CREATE TABLE IF NOT EXISTS pseo_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_type TEXT NOT NULL UNIQUE,
  system_prompt TEXT NOT NULL,
  user_prompt_template TEXT NOT NULL,
  version INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE pseo_prompts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin access prompts" ON pseo_prompts;
CREATE POLICY "Admin access prompts"
  ON pseo_prompts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );
-- Instagram Bio Analyzer Tables
-- Tables for storing bio analyses, email captures, and analytics

-- Table for storing bio analyses
CREATE TABLE IF NOT EXISTS instagram_bio_analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

  -- Input data (JSONB for flexibility)
  input_data JSONB NOT NULL,

  -- Result data (JSONB for flexibility)
  result_data JSONB NOT NULL,

  -- Key metrics for querying
  overall_score INTEGER NOT NULL,
  market TEXT,

  -- Tracking
  session_id TEXT,
  user_agent TEXT,
  ip_address INET
);

-- Table for email captures
CREATE TABLE IF NOT EXISTS instagram_bio_email_captures (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

  -- Related analysis
  analysis_id UUID REFERENCES instagram_bio_analyses(id) ON DELETE SET NULL,

  -- Contact info
  email TEXT NOT NULL,
  first_name TEXT NOT NULL,
  market TEXT NOT NULL,
  brokerage TEXT,

  -- Email sequence tracking
  email_sequence_started BOOLEAN DEFAULT false,
  email_sequence_completed BOOLEAN DEFAULT false,
  last_email_sent_at TIMESTAMP WITH TIME ZONE,

  -- Conversion tracking
  converted_to_trial BOOLEAN DEFAULT false,
  converted_to_paid BOOLEAN DEFAULT false,
  converted_at TIMESTAMP WITH TIME ZONE,

  -- Referral tracking
  referral_code TEXT,
  referrals_count INTEGER DEFAULT 0
);

-- Table for analytics events
CREATE TABLE IF NOT EXISTS instagram_bio_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

  -- Event details
  event_type TEXT NOT NULL, -- 'analyzer_started', 'analyzer_completed', 'email_captured', 'shared', etc.
  event_data JSONB,

  -- Session tracking
  session_id TEXT NOT NULL,

  -- User tracking (if available)
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Meta
  user_agent TEXT,
  ip_address INET,
  referrer TEXT
);

-- Table for email nurture sequences
CREATE TABLE IF NOT EXISTS instagram_bio_email_sequences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

  -- Related capture
  email_capture_id UUID REFERENCES instagram_bio_email_captures(id) ON DELETE CASCADE,

  -- Email details
  sequence_number INTEGER NOT NULL, -- 1-7
  email_subject TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,

  -- Engagement
  opened BOOLEAN DEFAULT false,
  clicked BOOLEAN DEFAULT false,
  converted BOOLEAN DEFAULT false
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_bio_analyses_created_at ON instagram_bio_analyses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bio_analyses_market ON instagram_bio_analyses(market);
CREATE INDEX IF NOT EXISTS idx_bio_analyses_score ON instagram_bio_analyses(overall_score DESC);
CREATE INDEX IF NOT EXISTS idx_bio_analyses_session ON instagram_bio_analyses(session_id);

CREATE INDEX IF NOT EXISTS idx_email_captures_created_at ON instagram_bio_email_captures(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_captures_email ON instagram_bio_email_captures(email);
CREATE INDEX IF NOT EXISTS idx_email_captures_market ON instagram_bio_email_captures(market);
CREATE INDEX IF NOT EXISTS idx_email_captures_analysis ON instagram_bio_email_captures(analysis_id);

CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON instagram_bio_analytics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON instagram_bio_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_session ON instagram_bio_analytics(session_id);

CREATE INDEX IF NOT EXISTS idx_email_sequences_capture ON instagram_bio_email_sequences(email_capture_id);
CREATE INDEX IF NOT EXISTS idx_email_sequences_sent ON instagram_bio_email_sequences(sent_at);

-- Enable Row Level Security
ALTER TABLE instagram_bio_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE instagram_bio_email_captures ENABLE ROW LEVEL SECURITY;
ALTER TABLE instagram_bio_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE instagram_bio_email_sequences ENABLE ROW LEVEL SECURITY;

-- Policies (Allow public insert for lead capture)
DROP POLICY IF EXISTS "Allow public insert on analyses" ON instagram_bio_analyses;
CREATE POLICY "Allow public insert on analyses" ON instagram_bio_analyses
  FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public select on analyses" ON instagram_bio_analyses;
CREATE POLICY "Allow public select on analyses" ON instagram_bio_analyses
  FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Allow public insert on email captures" ON instagram_bio_email_captures;
CREATE POLICY "Allow public insert on email captures" ON instagram_bio_email_captures
  FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public insert on analytics" ON instagram_bio_analytics;
CREATE POLICY "Allow public insert on analytics" ON instagram_bio_analytics
  FOR INSERT TO anon WITH CHECK (true);

-- Admin policies
DROP POLICY IF EXISTS "Allow authenticated users full access to analyses" ON instagram_bio_analyses;
CREATE POLICY "Allow authenticated users full access to analyses" ON instagram_bio_analyses
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated users full access to email captures" ON instagram_bio_email_captures;
CREATE POLICY "Allow authenticated users full access to email captures" ON instagram_bio_email_captures
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated users full access to analytics" ON instagram_bio_analytics;
CREATE POLICY "Allow authenticated users full access to analytics" ON instagram_bio_analytics
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated users full access to email sequences" ON instagram_bio_email_sequences;
CREATE POLICY "Allow authenticated users full access to email sequences" ON instagram_bio_email_sequences
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for updated_at
CREATE TRIGGER update_bio_analyses_updated_at BEFORE UPDATE ON instagram_bio_analyses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- View for analytics dashboard
CREATE OR REPLACE VIEW instagram_bio_stats AS
SELECT
  COUNT(DISTINCT ia.id) as total_analyses,
  AVG(ia.overall_score)::numeric(10,2) as avg_score,
  COUNT(DISTINCT iec.id) as total_email_captures,
  (COUNT(DISTINCT iec.id)::float / NULLIF(COUNT(DISTINCT ia.id), 0) * 100)::numeric(10,2) as capture_rate,
  COUNT(DISTINCT CASE WHEN iec.converted_to_trial THEN iec.id END) as trial_conversions,
  COUNT(DISTINCT CASE WHEN iec.converted_to_paid THEN iec.id END) as paid_conversions,
  COUNT(DISTINCT ia.market) as unique_markets
FROM instagram_bio_analyses ia
LEFT JOIN instagram_bio_email_captures iec ON ia.id = iec.analysis_id;

COMMENT ON TABLE instagram_bio_analyses IS 'Stores Instagram bio analysis results';
COMMENT ON TABLE instagram_bio_email_captures IS 'Stores email captures from the bio analyzer tool';
COMMENT ON TABLE instagram_bio_analytics IS 'Tracks user events and analytics for the bio analyzer';
COMMENT ON TABLE instagram_bio_email_sequences IS 'Tracks email nurture sequence sends and engagement';
-- Triggers and functions for Instagram Bio Analyzer email automation

-- Function to initialize email sequence on capture
CREATE OR REPLACE FUNCTION initialize_bio_email_sequence()
RETURNS TRIGGER AS $$
BEGIN
  -- Create placeholder entries for all 7 emails in the sequence
  INSERT INTO instagram_bio_email_sequences (email_capture_id, sequence_number, email_subject, sent_at)
  VALUES
    (NEW.id, 1, 'Your 3 Optimized Instagram Bios + Action Plan Inside', NULL),
    (NEW.id, 2, 'The Instagram bio mistake 73% of agents make', NULL),
    (NEW.id, 3, 'Your Instagram profile as a 24/7 showing scheduler', NULL),
    (NEW.id, 4, NEW.first_name || ', here''s your 30-day Instagram content calendar', NULL),
    (NEW.id, 5, 'Real data: What converts Instagram followers to clients', NULL),
    (NEW.id, 6, 'Linktree vs AgentBio for real estate (honest comparison)', NULL),
    (NEW.id, 7, NEW.first_name || ', final call: 20% off + free setup (expires tonight)', NULL);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to initialize sequence on email capture
DROP TRIGGER IF EXISTS init_bio_email_sequence ON instagram_bio_email_captures;
DROP TRIGGER IF EXISTS init_bio_email_sequence ON instagram_bio_email_captures;
CREATE TRIGGER init_bio_email_sequence
  AFTER INSERT ON instagram_bio_email_captures
  FOR EACH ROW
  WHEN (NEW.email_sequence_started = true)
  EXECUTE FUNCTION initialize_bio_email_sequence();

-- Function to mark sequence complete when all emails sent
CREATE OR REPLACE FUNCTION check_bio_email_sequence_complete()
RETURNS TRIGGER AS $$
DECLARE
  total_emails INTEGER;
  sent_emails INTEGER;
BEGIN
  -- Count total and sent emails for this capture
  SELECT COUNT(*), COUNT(*) FILTER (WHERE sent_at IS NOT NULL)
  INTO total_emails, sent_emails
  FROM instagram_bio_email_sequences
  WHERE email_capture_id = NEW.email_capture_id;

  -- If all emails sent, mark sequence as complete
  IF sent_emails >= total_emails THEN
    UPDATE instagram_bio_email_captures
    SET email_sequence_completed = true
    WHERE id = NEW.email_capture_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to check sequence completion on email sent
DROP TRIGGER IF EXISTS check_bio_sequence_complete ON instagram_bio_email_sequences;
CREATE TRIGGER check_bio_sequence_complete
  AFTER UPDATE OF sent_at ON instagram_bio_email_sequences
  FOR EACH ROW
  WHEN (NEW.sent_at IS NOT NULL AND OLD.sent_at IS NULL)
  EXECUTE FUNCTION check_bio_email_sequence_complete();

-- View for email performance dashboard
CREATE OR REPLACE VIEW bio_email_performance AS
SELECT
  es.sequence_number,
  es.email_subject,
  COUNT(*) as total_sent,
  COUNT(*) FILTER (WHERE es.opened = true) as total_opened,
  COUNT(*) FILTER (WHERE es.clicked = true) as total_clicked,
  ROUND(AVG(CASE WHEN es.opened = true THEN 1 ELSE 0 END) * 100, 2) as open_rate,
  ROUND(AVG(CASE WHEN es.clicked = true THEN 1 ELSE 0 END) * 100, 2) as click_rate,
  COUNT(DISTINCT ec.id) FILTER (WHERE ec.converted_to_trial = true) as conversions_to_trial,
  COUNT(DISTINCT ec.id) FILTER (WHERE ec.converted_to_paid = true) as conversions_to_paid
FROM instagram_bio_email_sequences es
JOIN instagram_bio_email_captures ec ON ec.id = es.email_capture_id
WHERE es.sent_at IS NOT NULL
GROUP BY es.sequence_number, es.email_subject
ORDER BY es.sequence_number;

COMMENT ON VIEW bio_email_performance IS 'Performance metrics for bio analyzer email sequence';

-- View for conversion funnel analysis
CREATE OR REPLACE VIEW bio_analyzer_funnel AS
SELECT
  COUNT(DISTINCT ia.id) as total_analyses,
  COUNT(DISTINCT iec.id) as email_captures,
  COUNT(DISTINCT iec.id) FILTER (WHERE iec.email_sequence_started = true) as sequences_started,
  COUNT(DISTINCT iec.id) FILTER (WHERE iec.email_sequence_completed = true) as sequences_completed,
  COUNT(DISTINCT iec.id) FILTER (WHERE iec.converted_to_trial = true) as trial_signups,
  COUNT(DISTINCT iec.id) FILTER (WHERE iec.converted_to_paid = true) as paid_conversions,
  ROUND(COUNT(DISTINCT iec.id)::numeric / NULLIF(COUNT(DISTINCT ia.id), 0) * 100, 2) as capture_rate,
  ROUND(COUNT(DISTINCT iec.id) FILTER (WHERE iec.converted_to_trial = true)::numeric / NULLIF(COUNT(DISTINCT iec.id), 0) * 100, 2) as trial_conversion_rate,
  ROUND(COUNT(DISTINCT iec.id) FILTER (WHERE iec.converted_to_paid = true)::numeric / NULLIF(COUNT(DISTINCT iec.id), 0) * 100, 2) as paid_conversion_rate
FROM instagram_bio_analyses ia
LEFT JOIN instagram_bio_email_captures iec ON ia.id = iec.analysis_id
WHERE ia.created_at >= CURRENT_DATE - INTERVAL '30 days';

COMMENT ON VIEW bio_analyzer_funnel IS 'Conversion funnel metrics for the last 30 days';

-- Indexes for email delivery queries
CREATE INDEX IF NOT EXISTS idx_email_sequences_pending
  ON instagram_bio_email_sequences(email_capture_id, sequence_number)
  WHERE sent_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_email_captures_active_sequences
  ON instagram_bio_email_captures(created_at)
  WHERE email_sequence_started = true AND email_sequence_completed = false;

-- Grant permissions to service role
GRANT SELECT ON bio_email_performance TO service_role;
GRANT SELECT ON bio_analyzer_funnel TO service_role;

-- Function to get next emails to send (used by cron job)
CREATE OR REPLACE FUNCTION get_pending_bio_emails()
RETURNS TABLE (
  capture_id UUID,
  email TEXT,
  first_name TEXT,
  market TEXT,
  sequence_number INTEGER,
  days_since_capture INTEGER,
  overall_score INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ec.id as capture_id,
    ec.email,
    ec.first_name,
    ec.market,
    es.sequence_number,
    EXTRACT(DAY FROM NOW() - ec.created_at)::INTEGER as days_since_capture,
    ia.overall_score
  FROM instagram_bio_email_captures ec
  JOIN instagram_bio_email_sequences es ON es.email_capture_id = ec.id
  LEFT JOIN instagram_bio_analyses ia ON ia.id = ec.analysis_id
  WHERE
    ec.email_sequence_started = true
    AND ec.email_sequence_completed = false
    AND es.sent_at IS NULL
    AND ec.created_at >= CURRENT_DATE - INTERVAL '14 days'
  ORDER BY ec.created_at ASC, es.sequence_number ASC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_pending_bio_emails IS 'Returns emails that need to be sent based on schedule';
-- Listing Description Generator Tables
-- Tables for storing property descriptions, email captures, and analytics

-- Table for storing generated listing descriptions
CREATE TABLE IF NOT EXISTS listing_descriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

  -- Property details (JSONB for flexibility)
  property_details JSONB NOT NULL,

  -- Generated descriptions (JSONB array of 3 styles)
  descriptions JSONB NOT NULL,

  -- Tracking
  session_id TEXT,
  user_agent TEXT,
  ip_address INET,

  -- User association (if logged in)
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Table for email captures
CREATE TABLE IF NOT EXISTS listing_email_captures (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

  -- Related listing description
  listing_id UUID REFERENCES listing_descriptions(id) ON DELETE SET NULL,

  -- Contact info
  email TEXT NOT NULL,
  first_name TEXT NOT NULL,
  brokerage_name TEXT,
  phone_number TEXT,

  -- Email sequence tracking
  email_sequence_started BOOLEAN DEFAULT false,
  email_sequence_completed BOOLEAN DEFAULT false,
  last_email_sent_at TIMESTAMP WITH TIME ZONE,

  -- Conversion tracking
  converted_to_trial BOOLEAN DEFAULT false,
  converted_to_paid BOOLEAN DEFAULT false,
  converted_at TIMESTAMP WITH TIME ZONE,

  -- Referral tracking
  referral_code TEXT,
  referrals_count INTEGER DEFAULT 0
);

-- Table for analytics events
CREATE TABLE IF NOT EXISTS listing_generator_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

  -- Event details
  event_type TEXT NOT NULL, -- 'generator_started', 'generator_completed', 'email_captured', 'description_copied', etc.
  event_data JSONB,

  -- Session tracking
  session_id TEXT NOT NULL,

  -- User tracking (if available)
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Meta
  user_agent TEXT,
  ip_address INET,
  referrer TEXT
);

-- Table for email nurture sequences
CREATE TABLE IF NOT EXISTS listing_email_sequences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

  -- Related capture
  email_capture_id UUID REFERENCES listing_email_captures(id) ON DELETE CASCADE,

  -- Email details
  sequence_number INTEGER NOT NULL, -- 1-7
  email_subject TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,

  -- Engagement
  opened BOOLEAN DEFAULT false,
  clicked BOOLEAN DEFAULT false,
  converted BOOLEAN DEFAULT false
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_listing_descriptions_created_at ON listing_descriptions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_listing_descriptions_session ON listing_descriptions(session_id);
CREATE INDEX IF NOT EXISTS idx_listing_descriptions_user ON listing_descriptions(user_id);

CREATE INDEX IF NOT EXISTS idx_listing_email_captures_created_at ON listing_email_captures(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_listing_email_captures_email ON listing_email_captures(email);
CREATE INDEX IF NOT EXISTS idx_listing_email_captures_listing ON listing_email_captures(listing_id);

CREATE INDEX IF NOT EXISTS idx_listing_analytics_created_at ON listing_generator_analytics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_listing_analytics_event_type ON listing_generator_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_listing_analytics_session ON listing_generator_analytics(session_id);

CREATE INDEX IF NOT EXISTS idx_listing_email_sequences_capture ON listing_email_sequences(email_capture_id);
CREATE INDEX IF NOT EXISTS idx_listing_email_sequences_sent ON listing_email_sequences(sent_at);

-- Enable Row Level Security
ALTER TABLE listing_descriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_email_captures ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_generator_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_email_sequences ENABLE ROW LEVEL SECURITY;

-- Policies (Allow public insert for lead capture)
DROP POLICY IF EXISTS "Allow public insert on listing descriptions" ON listing_descriptions;
CREATE POLICY "Allow public insert on listing descriptions" ON listing_descriptions
  FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public select on listing descriptions" ON listing_descriptions;
CREATE POLICY "Allow public select on listing descriptions" ON listing_descriptions
  FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Allow public insert on listing email captures" ON listing_email_captures;
CREATE POLICY "Allow public insert on listing email captures" ON listing_email_captures
  FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public insert on listing analytics" ON listing_generator_analytics;
CREATE POLICY "Allow public insert on listing analytics" ON listing_generator_analytics
  FOR INSERT TO anon WITH CHECK (true);

-- Admin policies
DROP POLICY IF EXISTS "Allow authenticated users full access to listing descriptions" ON listing_descriptions;
CREATE POLICY "Allow authenticated users full access to listing descriptions" ON listing_descriptions
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated users full access to listing email captures" ON listing_email_captures;
CREATE POLICY "Allow authenticated users full access to listing email captures" ON listing_email_captures
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated users full access to listing analytics" ON listing_generator_analytics;
CREATE POLICY "Allow authenticated users full access to listing analytics" ON listing_generator_analytics
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated users full access to listing email sequences" ON listing_email_sequences;
CREATE POLICY "Allow authenticated users full access to listing email sequences" ON listing_email_sequences
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Function to update updated_at timestamp
CREATE TRIGGER update_listing_descriptions_updated_at BEFORE UPDATE ON listing_descriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- View for analytics dashboard
CREATE OR REPLACE VIEW listing_generator_stats AS
SELECT
  COUNT(DISTINCT ld.id) as total_generations,
  COUNT(DISTINCT lec.id) as total_email_captures,
  (COUNT(DISTINCT lec.id)::float / NULLIF(COUNT(DISTINCT ld.id), 0) * 100)::numeric(10,2) as capture_rate,
  COUNT(DISTINCT CASE WHEN lec.converted_to_trial THEN lec.id END) as trial_conversions,
  COUNT(DISTINCT CASE WHEN lec.converted_to_paid THEN lec.id END) as paid_conversions,
  COUNT(DISTINCT (property_details->>'city')) as unique_markets
FROM listing_descriptions ld
LEFT JOIN listing_email_captures lec ON ld.id = lec.listing_id
WHERE ld.created_at >= CURRENT_DATE - INTERVAL '30 days';

-- View for property type distribution
CREATE OR REPLACE VIEW listing_property_types AS
SELECT
  property_details->>'propertyType' as property_type,
  COUNT(*) as count,
  ROUND(COUNT(*)::numeric / SUM(COUNT(*)) OVER () * 100, 2) as percentage
FROM listing_descriptions
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY property_details->>'propertyType'
ORDER BY count DESC;

-- View for popular features
CREATE OR REPLACE VIEW listing_popular_features AS
SELECT
  feature,
  COUNT(*) as count
FROM listing_descriptions,
LATERAL jsonb_array_elements_text(property_details->'selectedFeatures') as feature
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY feature
ORDER BY count DESC
LIMIT 20;

-- View for conversion funnel
CREATE OR REPLACE VIEW listing_generator_funnel AS
SELECT
  COUNT(DISTINCT ld.id) as total_generations,
  COUNT(DISTINCT lec.id) as email_captures,
  COUNT(DISTINCT lec.id) FILTER (WHERE lec.email_sequence_started = true) as sequences_started,
  COUNT(DISTINCT lec.id) FILTER (WHERE lec.email_sequence_completed = true) as sequences_completed,
  COUNT(DISTINCT lec.id) FILTER (WHERE lec.converted_to_trial = true) as trial_signups,
  COUNT(DISTINCT lec.id) FILTER (WHERE lec.converted_to_paid = true) as paid_conversions,
  ROUND(COUNT(DISTINCT lec.id)::numeric / NULLIF(COUNT(DISTINCT ld.id), 0) * 100, 2) as capture_rate,
  ROUND(COUNT(DISTINCT lec.id) FILTER (WHERE lec.converted_to_trial = true)::numeric / NULLIF(COUNT(DISTINCT lec.id), 0) * 100, 2) as trial_conversion_rate,
  ROUND(COUNT(DISTINCT lec.id) FILTER (WHERE lec.converted_to_paid = true)::numeric / NULLIF(COUNT(DISTINCT lec.id), 0) * 100, 2) as paid_conversion_rate
FROM listing_descriptions ld
LEFT JOIN listing_email_captures lec ON ld.id = lec.listing_id
WHERE ld.created_at >= CURRENT_DATE - INTERVAL '30 days';

COMMENT ON TABLE listing_descriptions IS 'Stores AI-generated listing descriptions';
COMMENT ON TABLE listing_email_captures IS 'Stores email captures from the listing generator tool';
COMMENT ON TABLE listing_generator_analytics IS 'Tracks user events and analytics for the listing generator';
COMMENT ON TABLE listing_email_sequences IS 'Tracks email nurture sequence sends and engagement';
COMMENT ON VIEW listing_generator_stats IS 'Summary statistics for the listing generator';
COMMENT ON VIEW listing_property_types IS 'Distribution of property types generated';
COMMENT ON VIEW listing_popular_features IS 'Most commonly selected property features';
COMMENT ON VIEW listing_generator_funnel IS 'Conversion funnel metrics';
-- Listing Description Generator Email Automation Triggers
-- Auto-creates email sequence entries and manages completion status

-- Function to initialize email sequence when email is captured
CREATE OR REPLACE FUNCTION init_listing_email_sequence()
RETURNS TRIGGER AS $$
BEGIN
  -- Create 7 email sequence entries
  INSERT INTO listing_email_sequences (email_capture_id, sequence_number, email_subject)
  VALUES
    (NEW.id, 1, 'The listing description mistake that costs agents thousands'),
    (NEW.id, 2, 'Power words that make buyers take action'),
    (NEW.id, 3, 'How to choose the right description style for your listing'),
    (NEW.id, 5, 'Real data: What sells homes faster in 2025'),
    (NEW.id, 6, 'Your listing checklist: Beyond the description'),
    (NEW.id, 7, '20% off AgentBio (expires tonight) + Free listing templates');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-create sequence on email capture
DROP TRIGGER IF EXISTS trigger_init_listing_email_sequence ON listing_email_captures;
DROP TRIGGER IF EXISTS trigger_init_listing_email_sequence ON listing_email_captures;
CREATE TRIGGER trigger_init_listing_email_sequence
  AFTER INSERT ON listing_email_captures
  FOR EACH ROW
  EXECUTE FUNCTION init_listing_email_sequence();

-- Function to check if email sequence is complete
CREATE OR REPLACE FUNCTION check_listing_sequence_complete()
RETURNS TRIGGER AS $$
DECLARE
  total_emails INTEGER;
  sent_emails INTEGER;
BEGIN
  -- Count total and sent emails for this capture
  SELECT COUNT(*), COUNT(*) FILTER (WHERE sent_at IS NOT NULL)
  INTO total_emails, sent_emails
  FROM listing_email_sequences
  WHERE email_capture_id = NEW.email_capture_id;

  -- If all emails sent, mark sequence complete
  IF total_emails = sent_emails THEN
    UPDATE listing_email_captures
    SET email_sequence_completed = true
    WHERE id = NEW.email_capture_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to check completion after each email sent
DROP TRIGGER IF EXISTS trigger_check_listing_sequence_complete ON listing_email_sequences;
CREATE TRIGGER trigger_check_listing_sequence_complete
  AFTER UPDATE OF sent_at ON listing_email_sequences
  FOR EACH ROW
  WHEN (NEW.sent_at IS NOT NULL AND OLD.sent_at IS NULL)
  EXECUTE FUNCTION check_listing_sequence_complete();

-- Function to get pending emails (for cron job)
CREATE OR REPLACE FUNCTION get_pending_listing_emails()
RETURNS TABLE (
  id UUID,
  email TEXT,
  first_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  days_since_capture INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    lec.id,
    lec.email,
    lec.first_name,
    lec.created_at,
    EXTRACT(DAY FROM (NOW() - lec.created_at))::INTEGER as days_since_capture
  FROM listing_email_captures lec
  WHERE
    -- Sequence started but not completed
    lec.email_sequence_started = true
    AND lec.email_sequence_completed = false
    -- At least 1 day since capture
    AND lec.created_at < NOW() - INTERVAL '1 day'
    -- Check if there's a pending email for today
    AND EXISTS (
      SELECT 1
      FROM listing_email_sequences les
      WHERE les.email_capture_id = lec.id
      AND les.sent_at IS NULL
      -- Check schedule: email 1 = day 2, email 2 = day 3, etc.
      AND (
        (les.sequence_number = 1 AND EXTRACT(DAY FROM (NOW() - lec.created_at))::INTEGER >= 1) OR
        (les.sequence_number = 2 AND EXTRACT(DAY FROM (NOW() - lec.created_at))::INTEGER >= 2) OR
        (les.sequence_number = 3 AND EXTRACT(DAY FROM (NOW() - lec.created_at))::INTEGER >= 3) OR
        (les.sequence_number = 5 AND EXTRACT(DAY FROM (NOW() - lec.created_at))::INTEGER >= 5) OR
        (les.sequence_number = 6 AND EXTRACT(DAY FROM (NOW() - lec.created_at))::INTEGER >= 6) OR
        (les.sequence_number = 7 AND EXTRACT(DAY FROM (NOW() - lec.created_at))::INTEGER >= 7)
      )
    )
  ORDER BY lec.created_at ASC;
END;
$$ LANGUAGE plpgsql;

-- View for email performance metrics
CREATE OR REPLACE VIEW listing_email_performance AS
SELECT
  les.sequence_number,
  les.email_subject,
  COUNT(*) as total_sent,
  COUNT(*) FILTER (WHERE les.opened = true) as opens,
  COUNT(*) FILTER (WHERE les.clicked = true) as clicks,
  COUNT(*) FILTER (WHERE les.converted = true) as conversions,
  ROUND(COUNT(*) FILTER (WHERE les.opened = true)::numeric / NULLIF(COUNT(*), 0) * 100, 2) as open_rate,
  ROUND(COUNT(*) FILTER (WHERE les.clicked = true)::numeric / NULLIF(COUNT(*), 0) * 100, 2) as click_rate,
  ROUND(COUNT(*) FILTER (WHERE les.converted = true)::numeric / NULLIF(COUNT(*), 0) * 100, 2) as conversion_rate
FROM listing_email_sequences les
WHERE les.sent_at IS NOT NULL
GROUP BY les.sequence_number, les.email_subject
ORDER BY les.sequence_number;

-- View for listing generator funnel (already in main migration, but adding here for completeness)
CREATE OR REPLACE VIEW listing_generator_funnel AS
SELECT
  COUNT(DISTINCT ld.id) as total_generations,
  COUNT(DISTINCT lec.id) as email_captures,
  COUNT(DISTINCT lec.id) FILTER (WHERE lec.email_sequence_started = true) as sequences_started,
  COUNT(DISTINCT lec.id) FILTER (WHERE lec.email_sequence_completed = true) as sequences_completed,
  COUNT(DISTINCT lec.id) FILTER (WHERE lec.converted_to_trial = true) as trial_signups,
  COUNT(DISTINCT lec.id) FILTER (WHERE lec.converted_to_paid = true) as paid_conversions,
  ROUND(COUNT(DISTINCT lec.id)::numeric / NULLIF(COUNT(DISTINCT ld.id), 0) * 100, 2) as capture_rate,
  ROUND(COUNT(DISTINCT lec.id) FILTER (WHERE lec.converted_to_trial = true)::numeric / NULLIF(COUNT(DISTINCT lec.id), 0) * 100, 2) as trial_conversion_rate,
  ROUND(COUNT(DISTINCT lec.id) FILTER (WHERE lec.converted_to_paid = true)::numeric / NULLIF(COUNT(DISTINCT lec.id), 0) * 100, 2) as paid_conversion_rate
FROM listing_descriptions ld
LEFT JOIN listing_email_captures lec ON ld.id = lec.listing_id
WHERE ld.created_at >= CURRENT_DATE - INTERVAL '30 days';

COMMENT ON FUNCTION init_listing_email_sequence() IS 'Auto-creates 7 email sequence entries when email is captured';
COMMENT ON FUNCTION check_listing_sequence_complete() IS 'Marks sequence complete when all emails are sent';
COMMENT ON FUNCTION get_pending_listing_emails() IS 'Returns emails that need to be sent today (used by cron job)';
COMMENT ON VIEW listing_email_performance IS 'Email engagement metrics by sequence number';
