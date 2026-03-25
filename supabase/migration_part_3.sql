
-- ============================================
-- SEO FIXES APPLIED TABLE
-- ============================================
-- Tracks SEO improvements and fixes applied

CREATE TABLE IF NOT EXISTS public.seo_fixes_applied (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID REFERENCES seo_audit_history(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  fix_type TEXT NOT NULL CHECK (fix_type IN (
    'meta_tags', 'title_optimization', 'description_optimization',
    'keyword_optimization', 'image_alt_text', 'heading_structure',
    'internal_linking', 'canonical_url', 'robots_txt', 'sitemap',
    'schema_markup', 'mobile_optimization', 'performance', 'security',
    'content_optimization', 'broken_link_fix', 'redirect_fix', 'other'
  )),
  fix_category TEXT DEFAULT 'technical' CHECK (fix_category IN ('technical', 'content', 'performance', 'accessibility', 'security')),
  issue_description TEXT NOT NULL,
  fix_description TEXT NOT NULL,
  fix_impact TEXT CHECK (fix_impact IN ('low', 'medium', 'high', 'critical')),
  before_value TEXT,
  after_value TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'applied', 'reverted', 'failed')),
  applied_at TIMESTAMP WITH TIME ZONE,
  reverted_at TIMESTAMP WITH TIME ZONE,
  applied_by UUID REFERENCES auth.users(id),
  verification_status TEXT DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'verified', 'failed')),
  verification_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================
-- SEO KEYWORDS TABLE
-- ============================================
-- Manages target keywords and their tracking

CREATE TABLE IF NOT EXISTS public.seo_keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword TEXT NOT NULL,
  target_url TEXT,
  search_volume INTEGER,
  competition TEXT CHECK (competition IN ('low', 'medium', 'high')),
  difficulty_score INTEGER CHECK (difficulty_score >= 0 AND difficulty_score <= 100),
  current_position INTEGER,
  target_position INTEGER,
  best_position INTEGER,
  previous_position INTEGER,
  position_change INTEGER,

  -- Categorization
  category TEXT DEFAULT 'General',
  keyword_type TEXT DEFAULT 'primary' CHECK (keyword_type IN ('primary', 'secondary', 'long_tail', 'local', 'branded')),
  intent TEXT CHECK (intent IN ('informational', 'navigational', 'transactional', 'commercial')),
  priority INTEGER DEFAULT 1 CHECK (priority >= 1 AND priority <= 5),

  -- Performance metrics
  monthly_searches INTEGER,
  ctr NUMERIC(5,2), -- Click-through rate
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  avg_position NUMERIC(5,2),

  -- Status and tracking
  is_active BOOLEAN DEFAULT true,
  is_ranking BOOLEAN DEFAULT false,
  first_ranked_at TIMESTAMP WITH TIME ZONE,
  last_checked_at TIMESTAMP WITH TIME ZONE,
  last_position_change_at TIMESTAMP WITH TIME ZONE,

  -- Metadata
  notes TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- ============================================
-- SEO KEYWORD HISTORY TABLE
-- ============================================
-- Tracks keyword position changes over time

CREATE TABLE IF NOT EXISTS public.seo_keyword_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword_id UUID NOT NULL REFERENCES seo_keywords(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  position INTEGER,
  search_volume INTEGER,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  ctr NUMERIC(5,2),
  url TEXT,
  device TEXT DEFAULT 'desktop' CHECK (device IN ('desktop', 'mobile', 'tablet')),
  location TEXT DEFAULT 'global',
  search_engine TEXT DEFAULT 'google' CHECK (search_engine IN ('google', 'bing', 'yahoo', 'duckduckgo')),
  data_source TEXT DEFAULT 'manual' CHECK (data_source IN ('manual', 'gsc', 'serpapi', 'ahrefs', 'moz', 'semrush')),
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- SEO Settings indexes
CREATE INDEX IF NOT EXISTS idx_seo_settings_site_url ON public.seo_settings(site_url);

-- Audit History indexes
CREATE INDEX IF NOT EXISTS idx_seo_audit_url ON public.seo_audit_history(url);
CREATE INDEX IF NOT EXISTS idx_seo_audit_created_at ON public.seo_audit_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_seo_audit_type ON public.seo_audit_history(audit_type);
CREATE INDEX IF NOT EXISTS idx_seo_audit_score ON public.seo_audit_history(overall_score DESC);

-- Fixes Applied indexes
CREATE INDEX IF NOT EXISTS idx_seo_fixes_audit_id ON public.seo_fixes_applied(audit_id);
CREATE INDEX IF NOT EXISTS idx_seo_fixes_url ON public.seo_fixes_applied(url);
CREATE INDEX IF NOT EXISTS idx_seo_fixes_status ON public.seo_fixes_applied(status);
CREATE INDEX IF NOT EXISTS idx_seo_fixes_type ON public.seo_fixes_applied(fix_type);
CREATE INDEX IF NOT EXISTS idx_seo_fixes_created_at ON public.seo_fixes_applied(created_at DESC);

-- Keywords indexes
CREATE INDEX IF NOT EXISTS idx_seo_keywords_keyword ON public.seo_keywords(keyword);
CREATE INDEX IF NOT EXISTS idx_seo_keywords_url ON public.seo_keywords(target_url);
CREATE INDEX IF NOT EXISTS idx_seo_keywords_active ON public.seo_keywords(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_seo_keywords_ranking ON public.seo_keywords(is_ranking) WHERE is_ranking = true;
CREATE INDEX IF NOT EXISTS idx_seo_keywords_position ON public.seo_keywords(current_position);
CREATE INDEX IF NOT EXISTS idx_seo_keywords_category ON public.seo_keywords(category);
CREATE INDEX IF NOT EXISTS idx_seo_keywords_priority ON public.seo_keywords(priority DESC);

-- Keyword History indexes
CREATE INDEX IF NOT EXISTS idx_seo_keyword_history_keyword_id ON public.seo_keyword_history(keyword_id);
CREATE INDEX IF NOT EXISTS idx_seo_keyword_history_recorded_at ON public.seo_keyword_history(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_seo_keyword_history_search_engine ON public.seo_keyword_history(search_engine);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.seo_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_audit_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_fixes_applied ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_keyword_history ENABLE ROW LEVEL SECURITY;

-- SEO Settings policies (Admin-only)
DROP POLICY IF EXISTS "Admins can manage SEO settings" ON public.seo_settings;
CREATE POLICY "Admins can manage SEO settings"
ON public.seo_settings FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Public can view SEO settings" ON public.seo_settings;
CREATE POLICY "Public can view SEO settings"
ON public.seo_settings FOR SELECT
USING (true);

-- Audit History policies
DROP POLICY IF EXISTS "Admins can manage audit history" ON public.seo_audit_history;
CREATE POLICY "Admins can manage audit history"
ON public.seo_audit_history FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Users can view their own audits" ON public.seo_audit_history;
CREATE POLICY "Users can view their own audits"
ON public.seo_audit_history FOR SELECT
USING (auth.uid() = performed_by OR public.has_role(auth.uid(), 'admin'::app_role));

-- Fixes Applied policies
DROP POLICY IF EXISTS "Admins can manage SEO fixes" ON public.seo_fixes_applied;
CREATE POLICY "Admins can manage SEO fixes"
ON public.seo_fixes_applied FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Users can view their own fixes" ON public.seo_fixes_applied;
CREATE POLICY "Users can view their own fixes"
ON public.seo_fixes_applied FOR SELECT
USING (auth.uid() = applied_by OR public.has_role(auth.uid(), 'admin'::app_role));

-- Keywords policies
DROP POLICY IF EXISTS "Admins can manage SEO keywords" ON public.seo_keywords;
CREATE POLICY "Admins can manage SEO keywords"
ON public.seo_keywords FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Public can view active keywords" ON public.seo_keywords;
CREATE POLICY "Public can view active keywords"
ON public.seo_keywords FOR SELECT
USING (is_active = true);

-- Keyword History policies
DROP POLICY IF EXISTS "Admins can manage keyword history" ON public.seo_keyword_history;
CREATE POLICY "Admins can manage keyword history"
ON public.seo_keyword_history FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Public can view keyword history" ON public.seo_keyword_history;
CREATE POLICY "Public can view keyword history"
ON public.seo_keyword_history FOR SELECT
USING (true);

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================

DROP TRIGGER IF EXISTS update_seo_settings_updated_at ON public.seo_settings;
CREATE TRIGGER update_seo_settings_updated_at
BEFORE UPDATE ON public.seo_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_seo_fixes_applied_updated_at ON public.seo_fixes_applied;
CREATE TRIGGER update_seo_fixes_applied_updated_at
BEFORE UPDATE ON public.seo_fixes_applied
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_seo_keywords_updated_at ON public.seo_keywords;
CREATE TRIGGER update_seo_keywords_updated_at
BEFORE UPDATE ON public.seo_keywords
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- DEFAULT DATA
-- ============================================

-- Insert default SEO settings (placeholder - update with your site info)
INSERT INTO public.seo_settings (
  site_url,
  site_name,
  default_title,
  default_description,
  robots_txt,
  llms_txt
) VALUES (
  'https://example.com',
  'My Website',
  'Welcome to My Website',
  'Your trusted source for quality content and services',
  E'User-agent: *\nAllow: /\n\nSitemap: https://example.com/sitemap.xml',
  E'# llms.txt - AI Crawling Instructions\n\n> Disclaimer: This is a proposed standard and is not guaranteed to work with all LLMs.\n\n## Allowed\nUser-agent: *\nAllow: /\n\n## Disallowed\nDisallow: /admin\nDisallow: /api'
) ON CONFLICT DO NOTHING;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE public.seo_settings IS 'Global SEO configuration and meta tag defaults';
COMMENT ON TABLE public.seo_audit_history IS 'Historical record of all SEO audits performed';
COMMENT ON TABLE public.seo_fixes_applied IS 'Tracks SEO improvements and fixes applied to the site';
COMMENT ON TABLE public.seo_keywords IS 'Target keywords and their current tracking data';
COMMENT ON TABLE public.seo_keyword_history IS 'Historical tracking of keyword positions over time';
-- ============================================
-- SEO MANAGEMENT SYSTEM - GOOGLE SEARCH CONSOLE
-- ============================================
-- Migration 2 of 6: Google Search Console Integration
-- Tables: gsc_oauth_credentials, gsc_properties, gsc_keyword_performance, gsc_page_performance

-- ============================================
-- GSC OAUTH CREDENTIALS TABLE
-- ============================================
-- Stores encrypted OAuth credentials for Google Search Console API access

CREATE TABLE IF NOT EXISTS public.gsc_oauth_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_type TEXT DEFAULT 'Bearer',
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  scope TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_refreshed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),

  CONSTRAINT one_active_credential_per_user UNIQUE (user_id, is_active)
);

-- ============================================
-- GSC PROPERTIES TABLE
-- ============================================
-- Stores Google Search Console properties (websites) connected to the account

CREATE TABLE IF NOT EXISTS public.gsc_properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  credential_id UUID REFERENCES gsc_oauth_credentials(id) ON DELETE CASCADE,
  property_url TEXT NOT NULL,
  property_name TEXT,
  property_type TEXT CHECK (property_type IN ('url_prefix', 'domain', 'sc_domain')),
  permission_level TEXT CHECK (permission_level IN ('siteOwner', 'siteFullUser', 'siteRestrictedUser', 'siteUnverifiedUser')),
  is_verified BOOLEAN DEFAULT false,
  is_primary BOOLEAN DEFAULT false,
  last_synced_at TIMESTAMP WITH TIME ZONE,
  sync_status TEXT DEFAULT 'pending' CHECK (sync_status IN ('pending', 'syncing', 'completed', 'failed')),
  sync_error TEXT,
  sync_frequency TEXT DEFAULT 'daily' CHECK (sync_frequency IN ('hourly', 'daily', 'weekly', 'manual')),
  auto_sync_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),

  CONSTRAINT unique_property_per_user UNIQUE (user_id, property_url)
);

-- ============================================
-- GSC KEYWORD PERFORMANCE TABLE
-- ============================================
-- Stores keyword performance data from Google Search Console

CREATE TABLE IF NOT EXISTS public.gsc_keyword_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES gsc_properties(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  url TEXT,
  country TEXT,
  device TEXT CHECK (device IN ('DESKTOP', 'MOBILE', 'TABLET')),
  search_type TEXT DEFAULT 'web' CHECK (search_type IN ('web', 'image', 'video', 'news')),

  -- Performance metrics
  clicks INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  ctr NUMERIC(10,6), -- Click-through rate (stored as decimal, e.g., 0.05 = 5%)
  position NUMERIC(10,2), -- Average position

  -- Date range
  date DATE NOT NULL,

  -- Change tracking
  clicks_change INTEGER,
  impressions_change INTEGER,
  ctr_change NUMERIC(10,6),
  position_change NUMERIC(10,2),

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),

  CONSTRAINT unique_gsc_keyword_date UNIQUE (property_id, query, url, date, device, country)
);

-- ============================================
-- GSC PAGE PERFORMANCE TABLE
-- ============================================
-- Stores page-level performance data from Google Search Console

CREATE TABLE IF NOT EXISTS public.gsc_page_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES gsc_properties(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  country TEXT,
  device TEXT CHECK (device IN ('DESKTOP', 'MOBILE', 'TABLET')),
  search_type TEXT DEFAULT 'web' CHECK (search_type IN ('web', 'image', 'video', 'news')),

  -- Performance metrics
  clicks INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  ctr NUMERIC(10,6), -- Click-through rate
  position NUMERIC(10,2), -- Average position

  -- Top queries for this page
  top_queries JSONB DEFAULT '[]',

  -- Date range
  date DATE NOT NULL,

  -- Page metadata
  page_title TEXT,
  page_description TEXT,

  -- Change tracking
  clicks_change INTEGER,
  impressions_change INTEGER,
  ctr_change NUMERIC(10,6),
  position_change NUMERIC(10,2),

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),

  CONSTRAINT unique_gsc_page_date UNIQUE (property_id, url, date, device, country)
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- OAuth Credentials indexes
CREATE INDEX IF NOT EXISTS idx_gsc_oauth_user_id ON public.gsc_oauth_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_gsc_oauth_active ON public.gsc_oauth_credentials(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_gsc_oauth_expires_at ON public.gsc_oauth_credentials(expires_at);

-- Properties indexes
CREATE INDEX IF NOT EXISTS idx_gsc_properties_user_id ON public.gsc_properties(user_id);
CREATE INDEX IF NOT EXISTS idx_gsc_properties_url ON public.gsc_properties(property_url);
CREATE INDEX IF NOT EXISTS idx_gsc_properties_primary ON public.gsc_properties(is_primary) WHERE is_primary = true;
CREATE INDEX IF NOT EXISTS idx_gsc_properties_sync_status ON public.gsc_properties(sync_status);
CREATE INDEX IF NOT EXISTS idx_gsc_properties_last_synced ON public.gsc_properties(last_synced_at DESC);

-- Keyword Performance indexes
CREATE INDEX IF NOT EXISTS idx_gsc_keyword_property_id ON public.gsc_keyword_performance(property_id);
CREATE INDEX IF NOT EXISTS idx_gsc_keyword_query ON public.gsc_keyword_performance(query);
CREATE INDEX IF NOT EXISTS idx_gsc_keyword_url ON public.gsc_keyword_performance(url);
CREATE INDEX IF NOT EXISTS idx_gsc_keyword_date ON public.gsc_keyword_performance(date DESC);
CREATE INDEX IF NOT EXISTS idx_gsc_keyword_clicks ON public.gsc_keyword_performance(clicks DESC);
CREATE INDEX IF NOT EXISTS idx_gsc_keyword_impressions ON public.gsc_keyword_performance(impressions DESC);
CREATE INDEX IF NOT EXISTS idx_gsc_keyword_position ON public.gsc_keyword_performance(position);
CREATE INDEX IF NOT EXISTS idx_gsc_keyword_device ON public.gsc_keyword_performance(device);
CREATE INDEX IF NOT EXISTS idx_gsc_keyword_country ON public.gsc_keyword_performance(country);

-- Page Performance indexes
CREATE INDEX IF NOT EXISTS idx_gsc_page_property_id ON public.gsc_page_performance(property_id);
CREATE INDEX IF NOT EXISTS idx_gsc_page_url ON public.gsc_page_performance(url);
CREATE INDEX IF NOT EXISTS idx_gsc_page_date ON public.gsc_page_performance(date DESC);
CREATE INDEX IF NOT EXISTS idx_gsc_page_clicks ON public.gsc_page_performance(clicks DESC);
CREATE INDEX IF NOT EXISTS idx_gsc_page_impressions ON public.gsc_page_performance(impressions DESC);
CREATE INDEX IF NOT EXISTS idx_gsc_page_position ON public.gsc_page_performance(position);
CREATE INDEX IF NOT EXISTS idx_gsc_page_device ON public.gsc_page_performance(device);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.gsc_oauth_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gsc_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gsc_keyword_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gsc_page_performance ENABLE ROW LEVEL SECURITY;

-- OAuth Credentials policies (User-specific + Admin)
DROP POLICY IF EXISTS "Users can manage their own GSC credentials" ON public.gsc_oauth_credentials;
CREATE POLICY "Users can manage their own GSC credentials"
ON public.gsc_oauth_credentials FOR ALL
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage all GSC credentials" ON public.gsc_oauth_credentials;
CREATE POLICY "Admins can manage all GSC credentials"
ON public.gsc_oauth_credentials FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Properties policies
DROP POLICY IF EXISTS "Users can manage their own GSC properties" ON public.gsc_properties;
CREATE POLICY "Users can manage their own GSC properties"
ON public.gsc_properties FOR ALL
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage all GSC properties" ON public.gsc_properties;
CREATE POLICY "Admins can manage all GSC properties"
ON public.gsc_properties FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Keyword Performance policies
DROP POLICY IF EXISTS "Users can view their own GSC keyword data" ON public.gsc_keyword_performance;
CREATE POLICY "Users can view their own GSC keyword data"
ON public.gsc_keyword_performance FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.gsc_properties
    WHERE gsc_properties.id = gsc_keyword_performance.property_id
    AND gsc_properties.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Admins can manage all GSC keyword data" ON public.gsc_keyword_performance;
CREATE POLICY "Admins can manage all GSC keyword data"
ON public.gsc_keyword_performance FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Page Performance policies
DROP POLICY IF EXISTS "Users can view their own GSC page data" ON public.gsc_page_performance;
CREATE POLICY "Users can view their own GSC page data"
ON public.gsc_page_performance FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.gsc_properties
    WHERE gsc_properties.id = gsc_page_performance.property_id
    AND gsc_properties.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Admins can manage all GSC page data" ON public.gsc_page_performance;
CREATE POLICY "Admins can manage all GSC page data"
ON public.gsc_page_performance FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================

DROP TRIGGER IF EXISTS update_gsc_oauth_credentials_updated_at ON public.gsc_oauth_credentials;
CREATE TRIGGER update_gsc_oauth_credentials_updated_at
BEFORE UPDATE ON public.gsc_oauth_credentials
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_gsc_properties_updated_at ON public.gsc_properties;
CREATE TRIGGER update_gsc_properties_updated_at
BEFORE UPDATE ON public.gsc_properties
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to check if OAuth token is expired
CREATE OR REPLACE FUNCTION public.is_gsc_token_expired(credential_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT expires_at < now()
  FROM public.gsc_oauth_credentials
  WHERE id = credential_id
  AND is_active = true;
$$;

-- Function to get active GSC credential for user
CREATE OR REPLACE FUNCTION public.get_active_gsc_credential(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  access_token TEXT,
  refresh_token TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_expired BOOLEAN
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    id,
    access_token,
    refresh_token,
    expires_at,
    expires_at < now() as is_expired
  FROM public.gsc_oauth_credentials
  WHERE user_id = p_user_id
  AND is_active = true
  ORDER BY created_at DESC
  LIMIT 1;
$$;

-- Function to clean up old performance data (for maintenance)
CREATE OR REPLACE FUNCTION public.cleanup_old_gsc_data(days_to_keep INTEGER DEFAULT 90)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete keyword performance data older than specified days
  DELETE FROM public.gsc_keyword_performance
  WHERE date < CURRENT_DATE - days_to_keep;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  -- Delete page performance data older than specified days
  DELETE FROM public.gsc_page_performance
  WHERE date < CURRENT_DATE - days_to_keep;

  GET DIAGNOSTICS deleted_count = deleted_count + ROW_COUNT;

  RETURN deleted_count;
END;
$$;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE public.gsc_oauth_credentials IS 'OAuth2 credentials for Google Search Console API access';
COMMENT ON TABLE public.gsc_properties IS 'Google Search Console properties (websites) connected to the account';
COMMENT ON TABLE public.gsc_keyword_performance IS 'Keyword performance metrics from Google Search Console';
COMMENT ON TABLE public.gsc_page_performance IS 'Page-level performance metrics from Google Search Console';

COMMENT ON FUNCTION public.is_gsc_token_expired IS 'Check if a GSC OAuth token has expired';
COMMENT ON FUNCTION public.get_active_gsc_credential IS 'Get active GSC OAuth credential for a user';
COMMENT ON FUNCTION public.cleanup_old_gsc_data IS 'Clean up old GSC performance data (maintenance function)';
-- ============================================
-- SEO MANAGEMENT SYSTEM - AUTOMATED MONITORING
-- ============================================
-- Migration 3 of 6: SEO Automated Monitoring
-- Tables: seo_notification_preferences, seo_alert_rules, seo_alerts, seo_monitoring_schedules, seo_monitoring_log

-- ============================================
-- SEO NOTIFICATION PREFERENCES TABLE
-- ============================================
-- Manages user notification preferences for SEO alerts

CREATE TABLE IF NOT EXISTS public.seo_notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Email notifications
  email_enabled BOOLEAN DEFAULT true,
  email_address TEXT,
  email_frequency TEXT DEFAULT 'immediate' CHECK (email_frequency IN ('immediate', 'hourly', 'daily', 'weekly')),

  -- Slack notifications
  slack_enabled BOOLEAN DEFAULT false,
  slack_webhook_url TEXT,
  slack_channel TEXT,

  -- In-app notifications
  in_app_enabled BOOLEAN DEFAULT true,

  -- SMS notifications (optional)
  sms_enabled BOOLEAN DEFAULT false,
  sms_phone_number TEXT,

  -- Notification types preferences
  critical_alerts BOOLEAN DEFAULT true,
  ranking_changes BOOLEAN DEFAULT true,
  performance_alerts BOOLEAN DEFAULT true,
  security_alerts BOOLEAN DEFAULT true,
  broken_links BOOLEAN DEFAULT true,
  content_issues BOOLEAN DEFAULT false,
  technical_issues BOOLEAN DEFAULT true,

  -- Quiet hours
  quiet_hours_enabled BOOLEAN DEFAULT false,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  quiet_hours_timezone TEXT DEFAULT 'UTC',

  -- Aggregation settings
  digest_enabled BOOLEAN DEFAULT false,
  digest_frequency TEXT DEFAULT 'daily' CHECK (digest_frequency IN ('daily', 'weekly', 'monthly')),
  digest_time TIME DEFAULT '09:00:00',

  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),

  CONSTRAINT one_preference_per_user UNIQUE (user_id)
);

-- ============================================
-- SEO ALERT RULES TABLE
-- ============================================
-- Defines rules for triggering SEO alerts

CREATE TABLE IF NOT EXISTS public.seo_alert_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  rule_type TEXT NOT NULL CHECK (rule_type IN (
    'ranking_drop', 'ranking_increase', 'traffic_drop', 'traffic_increase',
    'page_speed_degradation', 'core_web_vitals_fail', 'broken_links',
    'security_issue', 'mobile_usability', 'crawl_error', 'duplicate_content',
    'missing_meta_tags', 'redirect_chain', 'content_freshness', 'custom'
  )),
  severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),

  -- Rule conditions (JSONB for flexibility)
  conditions JSONB NOT NULL DEFAULT '{}',
  /*
  Example conditions structure:
  {
    "metric": "ranking_position",
    "operator": "greater_than",
    "threshold": 10,
    "comparison_period": "7_days",
    "min_change": 3
  }
  */

  -- Scope
  applies_to TEXT DEFAULT 'all' CHECK (applies_to IN ('all', 'specific_urls', 'specific_keywords', 'specific_pages')),
  target_urls TEXT[] DEFAULT '{}',
  target_keywords TEXT[] DEFAULT '{}',

  -- Actions
  actions JSONB DEFAULT '[]',
  /*
  Example actions:
  [
    {"type": "email", "recipients": ["admin@example.com"]},
    {"type": "slack", "channel": "#seo-alerts"},
    {"type": "webhook", "url": "https://example.com/webhook"}
  ]
  */

  -- Status
  is_active BOOLEAN DEFAULT true,
  last_triggered_at TIMESTAMP WITH TIME ZONE,
  trigger_count INTEGER DEFAULT 0,

  -- Cooldown to prevent alert spam
  cooldown_minutes INTEGER DEFAULT 60,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- ============================================
-- SEO ALERTS TABLE
-- ============================================
-- Stores triggered SEO alerts

CREATE TABLE IF NOT EXISTS public.seo_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_rule_id UUID REFERENCES seo_alert_rules(id) ON DELETE SET NULL,

  -- Alert details
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  details JSONB DEFAULT '{}',

  -- Affected resources
  affected_url TEXT,
  affected_keyword TEXT,
  affected_page TEXT,

  -- Metrics
  metric_name TEXT,
  previous_value TEXT,
  current_value TEXT,
  change_percentage NUMERIC(10,2),

  -- Status
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'acknowledged', 'resolved', 'ignored')),
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  acknowledged_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES auth.users(id),
  resolution_notes TEXT,

  -- Notifications sent
  notifications_sent JSONB DEFAULT '[]',
  /*
  Example:
  [
    {"type": "email", "sent_at": "2025-11-05T10:30:00Z", "status": "delivered"},
    {"type": "slack", "sent_at": "2025-11-05T10:30:01Z", "status": "delivered"}
  ]
  */

  -- Auto-resolution
  auto_resolved BOOLEAN DEFAULT false,
  auto_resolution_reason TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================
-- SEO MONITORING SCHEDULES TABLE
-- ============================================
-- Manages automated SEO monitoring schedules

CREATE TABLE IF NOT EXISTS public.seo_monitoring_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,

  -- Schedule type
  schedule_type TEXT NOT NULL CHECK (schedule_type IN (
    'full_audit', 'quick_scan', 'keyword_check', 'broken_links',
    'core_web_vitals', 'security_scan', 'competitor_check', 'custom'
  )),

  -- Target
  target_url TEXT NOT NULL,
  additional_urls TEXT[] DEFAULT '{}',

  -- Frequency
  frequency TEXT NOT NULL CHECK (frequency IN ('hourly', 'daily', 'weekly', 'monthly', 'custom')),
  cron_expression TEXT, -- For custom schedules
  time_of_day TIME,
  day_of_week INTEGER, -- 0-6 (Sunday = 0)
  day_of_month INTEGER, -- 1-31
  timezone TEXT DEFAULT 'UTC',

  -- Next run
  next_run_at TIMESTAMP WITH TIME ZONE,
  last_run_at TIMESTAMP WITH TIME ZONE,
  last_run_status TEXT CHECK (last_run_status IN ('success', 'failed', 'partial')),
  last_run_duration_ms INTEGER,

  -- Configuration
  config JSONB DEFAULT '{}',
  /*
  Example config:
  {
    "max_pages_to_crawl": 100,
    "check_images": true,
    "check_links": true,
    "alert_on_issues": true
  }
  */

  -- Status
  is_active BOOLEAN DEFAULT true,
  run_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- ============================================
-- SEO MONITORING LOG TABLE
-- ============================================
-- Logs all automated monitoring activities

CREATE TABLE IF NOT EXISTS public.seo_monitoring_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID REFERENCES seo_monitoring_schedules(id) ON DELETE CASCADE,

  -- Execution details
  execution_type TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('started', 'running', 'completed', 'failed', 'cancelled')),

  -- Results
  results_summary JSONB DEFAULT '{}',
  /*
  Example:
  {
    "pages_checked": 50,
    "issues_found": 12,
    "critical_issues": 2,
    "warnings": 10,
    "score": 85
  }
  */

  -- Performance
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  duration_ms INTEGER,

  -- Error handling
  error_message TEXT,
  error_details JSONB,

  -- References
  audit_id UUID REFERENCES seo_audit_history(id),
  alerts_generated INTEGER DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Notification Preferences indexes
CREATE INDEX IF NOT EXISTS idx_seo_notif_pref_user_id ON public.seo_notification_preferences(user_id);

-- Alert Rules indexes
CREATE INDEX IF NOT EXISTS idx_seo_alert_rules_type ON public.seo_alert_rules(rule_type);
CREATE INDEX IF NOT EXISTS idx_seo_alert_rules_active ON public.seo_alert_rules(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_seo_alert_rules_severity ON public.seo_alert_rules(severity);

-- Alerts indexes
CREATE INDEX IF NOT EXISTS idx_seo_alerts_rule_id ON public.seo_alerts(alert_rule_id);
CREATE INDEX IF NOT EXISTS idx_seo_alerts_status ON public.seo_alerts(status);
CREATE INDEX IF NOT EXISTS idx_seo_alerts_severity ON public.seo_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_seo_alerts_created_at ON public.seo_alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_seo_alerts_url ON public.seo_alerts(affected_url);
CREATE INDEX IF NOT EXISTS idx_seo_alerts_keyword ON public.seo_alerts(affected_keyword);
CREATE INDEX IF NOT EXISTS idx_seo_alerts_open ON public.seo_alerts(status) WHERE status = 'open';

-- Monitoring Schedules indexes
CREATE INDEX IF NOT EXISTS idx_seo_schedules_active ON public.seo_monitoring_schedules(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_seo_schedules_next_run ON public.seo_monitoring_schedules(next_run_at);
CREATE INDEX IF NOT EXISTS idx_seo_schedules_type ON public.seo_monitoring_schedules(schedule_type);
CREATE INDEX IF NOT EXISTS idx_seo_schedules_url ON public.seo_monitoring_schedules(target_url);

-- Monitoring Log indexes
CREATE INDEX IF NOT EXISTS idx_seo_monitoring_log_schedule_id ON public.seo_monitoring_log(schedule_id);
CREATE INDEX IF NOT EXISTS idx_seo_monitoring_log_status ON public.seo_monitoring_log(status);
CREATE INDEX IF NOT EXISTS idx_seo_monitoring_log_started_at ON public.seo_monitoring_log(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_seo_monitoring_log_audit_id ON public.seo_monitoring_log(audit_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.seo_notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_alert_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_monitoring_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_monitoring_log ENABLE ROW LEVEL SECURITY;

-- Notification Preferences policies
DROP POLICY IF EXISTS "Users can manage their own notification preferences" ON public.seo_notification_preferences;
CREATE POLICY "Users can manage their own notification preferences"
ON public.seo_notification_preferences FOR ALL
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage all notification preferences" ON public.seo_notification_preferences;
CREATE POLICY "Admins can manage all notification preferences"
ON public.seo_notification_preferences FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Alert Rules policies
DROP POLICY IF EXISTS "Admins can manage alert rules" ON public.seo_alert_rules;
CREATE POLICY "Admins can manage alert rules"
ON public.seo_alert_rules FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Users can view alert rules" ON public.seo_alert_rules;
CREATE POLICY "Users can view alert rules"
ON public.seo_alert_rules FOR SELECT
USING (true);

-- Alerts policies
DROP POLICY IF EXISTS "Admins can manage all alerts" ON public.seo_alerts;
CREATE POLICY "Admins can manage all alerts"
ON public.seo_alerts FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "All authenticated users can view alerts" ON public.seo_alerts;
CREATE POLICY "All authenticated users can view alerts"
ON public.seo_alerts FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Monitoring Schedules policies
DROP POLICY IF EXISTS "Admins can manage monitoring schedules" ON public.seo_monitoring_schedules;
CREATE POLICY "Admins can manage monitoring schedules"
ON public.seo_monitoring_schedules FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Users can view monitoring schedules" ON public.seo_monitoring_schedules;
CREATE POLICY "Users can view monitoring schedules"
ON public.seo_monitoring_schedules FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Monitoring Log policies
DROP POLICY IF EXISTS "Admins can manage monitoring logs" ON public.seo_monitoring_log;
CREATE POLICY "Admins can manage monitoring logs"
ON public.seo_monitoring_log FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Users can view monitoring logs" ON public.seo_monitoring_log;
CREATE POLICY "Users can view monitoring logs"
ON public.seo_monitoring_log FOR SELECT
USING (auth.uid() IS NOT NULL);

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================

DROP TRIGGER IF EXISTS update_seo_notif_pref_updated_at ON public.seo_notification_preferences;
CREATE TRIGGER update_seo_notif_pref_updated_at
BEFORE UPDATE ON public.seo_notification_preferences
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_seo_alert_rules_updated_at ON public.seo_alert_rules;
CREATE TRIGGER update_seo_alert_rules_updated_at
BEFORE UPDATE ON public.seo_alert_rules
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_seo_alerts_updated_at ON public.seo_alerts;
CREATE TRIGGER update_seo_alerts_updated_at
BEFORE UPDATE ON public.seo_alerts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_seo_schedules_updated_at ON public.seo_monitoring_schedules;
CREATE TRIGGER update_seo_schedules_updated_at
BEFORE UPDATE ON public.seo_monitoring_schedules
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to get open alerts count
CREATE OR REPLACE FUNCTION public.get_open_alerts_count()
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.seo_alerts
  WHERE status = 'open';
$$;

-- Function to get critical alerts count
CREATE OR REPLACE FUNCTION public.get_critical_alerts_count()
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.seo_alerts
  WHERE status = 'open'
  AND severity = 'critical';
$$;

-- Function to calculate next run time for a schedule
CREATE OR REPLACE FUNCTION public.calculate_next_run_time(
  p_schedule_id UUID
)
RETURNS TIMESTAMP WITH TIME ZONE
LANGUAGE plpgsql
AS $$
DECLARE
  v_frequency TEXT;
  v_time_of_day TIME;
  v_day_of_week INTEGER;
  v_day_of_month INTEGER;
  v_next_run TIMESTAMP WITH TIME ZONE;
BEGIN
  SELECT frequency, time_of_day, day_of_week, day_of_month
  INTO v_frequency, v_time_of_day, v_day_of_week, v_day_of_month
  FROM public.seo_monitoring_schedules
  WHERE id = p_schedule_id;

  CASE v_frequency
    WHEN 'hourly' THEN
      v_next_run := now() + INTERVAL '1 hour';
    WHEN 'daily' THEN
      v_next_run := (CURRENT_DATE + 1)::TIMESTAMP + COALESCE(v_time_of_day, '00:00:00'::TIME);
    WHEN 'weekly' THEN
      v_next_run := (CURRENT_DATE + ((7 + COALESCE(v_day_of_week, 0) - EXTRACT(DOW FROM CURRENT_DATE)::INTEGER) % 7))::TIMESTAMP + COALESCE(v_time_of_day, '00:00:00'::TIME);
    WHEN 'monthly' THEN
      v_next_run := (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' + (COALESCE(v_day_of_month, 1) - 1)::TEXT || ' days')::TIMESTAMP + COALESCE(v_time_of_day, '00:00:00'::TIME);
    ELSE
      v_next_run := now() + INTERVAL '1 day';
  END CASE;

  RETURN v_next_run;
END;
$$;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE public.seo_notification_preferences IS 'User notification preferences for SEO alerts';
COMMENT ON TABLE public.seo_alert_rules IS 'Rules for triggering automated SEO alerts';
COMMENT ON TABLE public.seo_alerts IS 'Triggered SEO alerts and their status';
COMMENT ON TABLE public.seo_monitoring_schedules IS 'Automated SEO monitoring schedules';
COMMENT ON TABLE public.seo_monitoring_log IS 'Log of all automated monitoring executions';

COMMENT ON FUNCTION public.get_open_alerts_count IS 'Get count of open SEO alerts';
COMMENT ON FUNCTION public.get_critical_alerts_count IS 'Get count of critical open SEO alerts';
COMMENT ON FUNCTION public.calculate_next_run_time IS 'Calculate next run time for a monitoring schedule';
-- ============================================
-- SEO MANAGEMENT SYSTEM - ADVANCED SEO FEATURES
-- ============================================
-- Migration 4 of 6: Advanced SEO Features
-- Tables: seo_competitor_analysis, seo_page_scores, seo_core_web_vitals, seo_crawl_results

-- ============================================
-- SEO COMPETITOR ANALYSIS TABLE
-- ============================================
-- Stores competitor SEO analysis data

CREATE TABLE IF NOT EXISTS public.seo_competitor_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competitor_domain TEXT NOT NULL,
  competitor_name TEXT,
  our_domain TEXT NOT NULL,

  -- Rankings comparison
  shared_keywords INTEGER DEFAULT 0,
  keywords_we_rank_better INTEGER DEFAULT 0,
  keywords_they_rank_better INTEGER DEFAULT 0,
  keyword_gap_count INTEGER DEFAULT 0, -- Keywords they rank for but we don't

  -- Traffic estimates
  estimated_monthly_traffic INTEGER,
  estimated_monthly_traffic_value NUMERIC(10,2),

  -- Domain metrics
  domain_authority INTEGER CHECK (domain_authority >= 0 AND domain_authority <= 100),
  page_authority INTEGER CHECK (page_authority >= 0 AND page_authority <= 100),
  trust_flow INTEGER,
  citation_flow INTEGER,
  backlinks_count INTEGER DEFAULT 0,
  referring_domains INTEGER DEFAULT 0,

  -- Content analysis
  total_pages INTEGER,
  indexed_pages INTEGER,
  blog_post_count INTEGER,
  content_update_frequency TEXT,

  -- Technical SEO
  mobile_friendly BOOLEAN,
  page_speed_score INTEGER CHECK (page_speed_score >= 0 AND page_speed_score <= 100),
  has_ssl BOOLEAN,
  has_sitemap BOOLEAN,

  -- Detailed data
  top_performing_keywords JSONB DEFAULT '[]',
  keyword_gap_list JSONB DEFAULT '[]',
  top_pages JSONB DEFAULT '[]',
  content_gaps JSONB DEFAULT '[]',
  backlink_profile JSONB DEFAULT '{}',

  -- Metadata
  analysis_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  data_source TEXT CHECK (data_source IN ('manual', 'ahrefs', 'semrush', 'moz', 'serpapi', 'gsc')),
  notes TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  analyzed_by UUID REFERENCES auth.users(id)
);

-- ============================================
-- SEO PAGE SCORES TABLE
-- ============================================
-- Stores individual page SEO scores and metrics

CREATE TABLE IF NOT EXISTS public.seo_page_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  page_title TEXT,
  page_type TEXT CHECK (page_type IN ('homepage', 'product', 'category', 'blog', 'article', 'landing_page', 'other')),

  -- Overall scores
  overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
  seo_score INTEGER CHECK (seo_score >= 0 AND seo_score <= 100),
  content_score INTEGER CHECK (content_score >= 0 AND content_score <= 100),
  technical_score INTEGER CHECK (technical_score >= 0 AND technical_score <= 100),
  ux_score INTEGER CHECK (ux_score >= 0 AND ux_score <= 100),

  -- Meta tags scoring
  title_score INTEGER CHECK (title_score >= 0 AND title_score <= 10),
  description_score INTEGER CHECK (description_score >= 0 AND description_score <= 10),
  keywords_score INTEGER CHECK (keywords_score >= 0 AND keywords_score <= 10),
  headings_score INTEGER CHECK (headings_score >= 0 AND headings_score <= 10),

  -- Content quality
  word_count INTEGER,
  readability_score NUMERIC(5,2),
  keyword_density NUMERIC(5,2),
  content_uniqueness NUMERIC(5,2), -- Percentage
  internal_links INTEGER DEFAULT 0,
  external_links INTEGER DEFAULT 0,

  -- Technical SEO
  load_time_ms INTEGER,
  mobile_score INTEGER CHECK (mobile_score >= 0 AND mobile_score <= 100),
  has_canonical BOOLEAN DEFAULT false,
  has_structured_data BOOLEAN DEFAULT false,
  has_alt_tags BOOLEAN DEFAULT false,
  images_optimized BOOLEAN DEFAULT false,

  -- Performance
  first_contentful_paint INTEGER, -- milliseconds
  largest_contentful_paint INTEGER,
  cumulative_layout_shift NUMERIC(5,3),
  time_to_interactive INTEGER,

  -- Issues
  critical_issues INTEGER DEFAULT 0,
  warnings INTEGER DEFAULT 0,
  recommendations JSONB DEFAULT '[]',

  -- Tracking
  last_scored_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  score_change INTEGER, -- Change from previous score
  previous_score INTEGER,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================
-- SEO CORE WEB VITALS TABLE
-- ============================================
-- Stores Core Web Vitals metrics

CREATE TABLE IF NOT EXISTS public.seo_core_web_vitals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  device TEXT NOT NULL CHECK (device IN ('mobile', 'desktop')),

  -- Core Web Vitals
  lcp NUMERIC(10,2), -- Largest Contentful Paint (seconds)
  fid NUMERIC(10,2), -- First Input Delay (milliseconds)
  cls NUMERIC(5,3), -- Cumulative Layout Shift (score)

  -- Additional metrics
  fcp NUMERIC(10,2), -- First Contentful Paint (seconds)
  ttfb NUMERIC(10,2), -- Time to First Byte (seconds)
  tti NUMERIC(10,2), -- Time to Interactive (seconds)
  tbt NUMERIC(10,2), -- Total Blocking Time (milliseconds)
  si NUMERIC(10,2), -- Speed Index

  -- Scores
  performance_score INTEGER CHECK (performance_score >= 0 AND performance_score <= 100),
  overall_category TEXT CHECK (overall_category IN ('FAST', 'AVERAGE', 'SLOW')),

  -- Pass/Fail status
  lcp_pass BOOLEAN,
  fid_pass BOOLEAN,
  cls_pass BOOLEAN,

  -- Detailed data
  lab_data JSONB DEFAULT '{}', -- Lab data from PageSpeed Insights
  field_data JSONB DEFAULT '{}', -- Field data from CrUX
  opportunities JSONB DEFAULT '[]', -- Performance opportunities
  diagnostics JSONB DEFAULT '[]', -- Diagnostics

  -- Metadata
  data_source TEXT DEFAULT 'pagespeed' CHECK (data_source IN ('pagespeed', 'crux', 'lighthouse', 'manual')),
  fetch_time_ms INTEGER,
  measured_at TIMESTAMP WITH TIME ZONE DEFAULT now(),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================
-- SEO CRAWL RESULTS TABLE
-- ============================================
-- Stores results from site crawls

CREATE TABLE IF NOT EXISTS public.seo_crawl_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  crawl_session_id UUID NOT NULL,
  url TEXT NOT NULL,
  parent_url TEXT, -- URL that linked to this page

  -- HTTP response
  status_code INTEGER,
  response_time_ms INTEGER,
  redirect_url TEXT,
  redirect_chain JSONB DEFAULT '[]',

  -- Page metadata
  title TEXT,
  title_length INTEGER,
  description TEXT,
  description_length INTEGER,
  canonical_url TEXT,
  h1 TEXT,
  h1_count INTEGER DEFAULT 0,

  -- Content
  word_count INTEGER,
  content_hash TEXT, -- For duplicate content detection
  language TEXT,

  -- Links
  internal_links INTEGER DEFAULT 0,
  external_links INTEGER DEFAULT 0,
  broken_links INTEGER DEFAULT 0,
  links_found JSONB DEFAULT '[]',

  -- Images
  images_count INTEGER DEFAULT 0,
  images_without_alt INTEGER DEFAULT 0,
  images_data JSONB DEFAULT '[]',

  -- Technical
  has_robots_meta BOOLEAN DEFAULT false,
  robots_content TEXT,
  has_canonical BOOLEAN DEFAULT false,
  has_viewport BOOLEAN DEFAULT false,
  has_schema BOOLEAN DEFAULT false,
  schema_types TEXT[] DEFAULT '{}',

  -- Performance
  page_size_kb INTEGER,
  load_time_ms INTEGER,
  resources_count INTEGER,

  -- Issues found
  issues JSONB DEFAULT '[]',
  warnings JSONB DEFAULT '[]',

  -- Crawl metadata
  crawl_depth INTEGER DEFAULT 0, -- How many clicks from start URL
  is_indexable BOOLEAN DEFAULT true,
  is_crawlable BOOLEAN DEFAULT true,

  crawled_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Competitor Analysis indexes
CREATE INDEX IF NOT EXISTS idx_seo_competitor_domain ON public.seo_competitor_analysis(competitor_domain);
CREATE INDEX IF NOT EXISTS idx_seo_competitor_our_domain ON public.seo_competitor_analysis(our_domain);
CREATE INDEX IF NOT EXISTS idx_seo_competitor_date ON public.seo_competitor_analysis(analysis_date DESC);

-- Page Scores indexes
CREATE INDEX IF NOT EXISTS idx_seo_page_scores_url ON public.seo_page_scores(url);
CREATE INDEX IF NOT EXISTS idx_seo_page_scores_overall ON public.seo_page_scores(overall_score DESC);
CREATE INDEX IF NOT EXISTS idx_seo_page_scores_type ON public.seo_page_scores(page_type);
CREATE INDEX IF NOT EXISTS idx_seo_page_scores_scored_at ON public.seo_page_scores(last_scored_at DESC);

-- Core Web Vitals indexes
CREATE INDEX IF NOT EXISTS idx_seo_cwv_url ON public.seo_core_web_vitals(url);
CREATE INDEX IF NOT EXISTS idx_seo_cwv_device ON public.seo_core_web_vitals(device);
CREATE INDEX IF NOT EXISTS idx_seo_cwv_measured_at ON public.seo_core_web_vitals(measured_at DESC);
CREATE INDEX IF NOT EXISTS idx_seo_cwv_performance_score ON public.seo_core_web_vitals(performance_score DESC);
CREATE INDEX IF NOT EXISTS idx_seo_cwv_lcp_pass ON public.seo_core_web_vitals(lcp_pass);

-- Crawl Results indexes
CREATE INDEX IF NOT EXISTS idx_seo_crawl_session_id ON public.seo_crawl_results(crawl_session_id);
CREATE INDEX IF NOT EXISTS idx_seo_crawl_url ON public.seo_crawl_results(url);
CREATE INDEX IF NOT EXISTS idx_seo_crawl_status ON public.seo_crawl_results(status_code);
CREATE INDEX IF NOT EXISTS idx_seo_crawl_parent_url ON public.seo_crawl_results(parent_url);
CREATE INDEX IF NOT EXISTS idx_seo_crawl_date ON public.seo_crawl_results(crawled_at DESC);
CREATE INDEX IF NOT EXISTS idx_seo_crawl_content_hash ON public.seo_crawl_results(content_hash);
CREATE INDEX IF NOT EXISTS idx_seo_crawl_broken_links ON public.seo_crawl_results(broken_links) WHERE broken_links > 0;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.seo_competitor_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_page_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_core_web_vitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_crawl_results ENABLE ROW LEVEL SECURITY;

-- Competitor Analysis policies
DROP POLICY IF EXISTS "Admins can manage competitor analysis" ON public.seo_competitor_analysis;
CREATE POLICY "Admins can manage competitor analysis"
ON public.seo_competitor_analysis FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Authenticated users can view competitor analysis" ON public.seo_competitor_analysis;
CREATE POLICY "Authenticated users can view competitor analysis"
ON public.seo_competitor_analysis FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Page Scores policies
DROP POLICY IF EXISTS "Admins can manage page scores" ON public.seo_page_scores;
CREATE POLICY "Admins can manage page scores"
ON public.seo_page_scores FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Authenticated users can view page scores" ON public.seo_page_scores;
CREATE POLICY "Authenticated users can view page scores"
ON public.seo_page_scores FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Core Web Vitals policies
DROP POLICY IF EXISTS "Admins can manage core web vitals" ON public.seo_core_web_vitals;
CREATE POLICY "Admins can manage core web vitals"
ON public.seo_core_web_vitals FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Public can view core web vitals" ON public.seo_core_web_vitals;
CREATE POLICY "Public can view core web vitals"
ON public.seo_core_web_vitals FOR SELECT
USING (true);

-- Crawl Results policies
DROP POLICY IF EXISTS "Admins can manage crawl results" ON public.seo_crawl_results;
CREATE POLICY "Admins can manage crawl results"
ON public.seo_crawl_results FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Authenticated users can view crawl results" ON public.seo_crawl_results;
CREATE POLICY "Authenticated users can view crawl results"
ON public.seo_crawl_results FOR SELECT
USING (auth.uid() IS NOT NULL);

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================

DROP TRIGGER IF EXISTS update_seo_competitor_updated_at ON public.seo_competitor_analysis;
CREATE TRIGGER update_seo_competitor_updated_at
BEFORE UPDATE ON public.seo_competitor_analysis
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_seo_page_scores_updated_at ON public.seo_page_scores;
CREATE TRIGGER update_seo_page_scores_updated_at
BEFORE UPDATE ON public.seo_page_scores
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to get average page score
CREATE OR REPLACE FUNCTION public.get_average_page_score()
RETURNS INTEGER
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(AVG(overall_score)::INTEGER, 0)
  FROM public.seo_page_scores
  WHERE last_scored_at > now() - INTERVAL '30 days';
$$;

-- Function to get pages failing Core Web Vitals
CREATE OR REPLACE FUNCTION public.get_failing_cwv_pages()
RETURNS TABLE (
  url TEXT,
  device TEXT,
  lcp NUMERIC(10,2),
  fid NUMERIC(10,2),
  cls NUMERIC(5,3),
  measured_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    url,
    device,
    lcp,
    fid,
    cls,
    measured_at
  FROM public.seo_core_web_vitals
  WHERE lcp_pass = false
     OR fid_pass = false
     OR cls_pass = false
  ORDER BY measured_at DESC;
$$;