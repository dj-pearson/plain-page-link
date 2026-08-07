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
CREATE POLICY "Allow public insert on analyses" ON instagram_bio_analyses
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow public select on analyses" ON instagram_bio_analyses
  FOR SELECT TO anon USING (true);

CREATE POLICY "Allow public insert on email captures" ON instagram_bio_email_captures
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow public insert on analytics" ON instagram_bio_analytics
  FOR INSERT TO anon WITH CHECK (true);

-- Admin policies
CREATE POLICY "Allow authenticated users full access to analyses" ON instagram_bio_analyses
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users full access to email captures" ON instagram_bio_email_captures
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users full access to analytics" ON instagram_bio_analytics
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

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
