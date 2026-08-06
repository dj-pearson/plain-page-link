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
CREATE POLICY "Allow public insert on listing descriptions" ON listing_descriptions
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow public select on listing descriptions" ON listing_descriptions
  FOR SELECT TO anon USING (true);

CREATE POLICY "Allow public insert on listing email captures" ON listing_email_captures
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow public insert on listing analytics" ON listing_generator_analytics
  FOR INSERT TO anon WITH CHECK (true);

-- Admin policies
CREATE POLICY "Allow authenticated users full access to listing descriptions" ON listing_descriptions
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users full access to listing email captures" ON listing_email_captures
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users full access to listing analytics" ON listing_generator_analytics
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

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
