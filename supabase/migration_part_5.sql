
-- ============================================
-- DASHBOARD CONFIGURATION TABLE
-- ============================================
-- Stores user preferences for dashboard display

CREATE TABLE IF NOT EXISTS public.search_dashboard_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Display preferences
  default_date_range TEXT DEFAULT '30days' CHECK (default_date_range IN ('7days', '30days', '90days', '6months', '1year', 'custom')),
  default_comparison_period TEXT DEFAULT 'previous_period' CHECK (default_comparison_period IN ('previous_period', 'previous_year', 'none')),
  default_grouping TEXT DEFAULT 'daily' CHECK (default_grouping IN ('hourly', 'daily', 'weekly', 'monthly')),

  -- Platform preferences
  enabled_platforms JSONB DEFAULT '["google_search_console", "google_analytics"]',
  primary_platform TEXT DEFAULT 'google_search_console',

  -- Widget configuration
  dashboard_layout JSONB DEFAULT '[]', -- Store widget positions and sizes
  visible_metrics JSONB DEFAULT '["clicks", "impressions", "ctr", "position", "sessions", "users"]',

  -- Notification preferences
  enable_alerts BOOLEAN DEFAULT true,
  alert_thresholds JSONB DEFAULT '{}', -- Custom threshold values

  -- Export preferences
  export_format TEXT DEFAULT 'csv' CHECK (export_format IN ('csv', 'xlsx', 'json', 'pdf')),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),

  CONSTRAINT one_config_per_user UNIQUE (user_id)
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- GA4 OAuth Credentials indexes
CREATE INDEX IF NOT EXISTS idx_ga4_oauth_user_id ON public.ga4_oauth_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_ga4_oauth_active ON public.ga4_oauth_credentials(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_ga4_oauth_expires_at ON public.ga4_oauth_credentials(expires_at);

-- GA4 Properties indexes
CREATE INDEX IF NOT EXISTS idx_ga4_properties_user_id ON public.ga4_properties(user_id);
CREATE INDEX IF NOT EXISTS idx_ga4_properties_property_id ON public.ga4_properties(property_id);
CREATE INDEX IF NOT EXISTS idx_ga4_properties_sync_status ON public.ga4_properties(sync_status);

-- GA4 Traffic Data indexes
CREATE INDEX IF NOT EXISTS idx_ga4_traffic_property_id ON public.ga4_traffic_data(property_id);
CREATE INDEX IF NOT EXISTS idx_ga4_traffic_date ON public.ga4_traffic_data(date DESC);
CREATE INDEX IF NOT EXISTS idx_ga4_traffic_page_path ON public.ga4_traffic_data(page_path);
CREATE INDEX IF NOT EXISTS idx_ga4_traffic_source ON public.ga4_traffic_data(source);
CREATE INDEX IF NOT EXISTS idx_ga4_traffic_device ON public.ga4_traffic_data(device_category);

-- Bing OAuth Credentials indexes
CREATE INDEX IF NOT EXISTS idx_bing_oauth_user_id ON public.bing_webmaster_oauth_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_bing_oauth_active ON public.bing_webmaster_oauth_credentials(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_bing_oauth_expires_at ON public.bing_webmaster_oauth_credentials(expires_at);

-- Bing Sites indexes
CREATE INDEX IF NOT EXISTS idx_bing_sites_user_id ON public.bing_webmaster_sites(user_id);
CREATE INDEX IF NOT EXISTS idx_bing_sites_url ON public.bing_webmaster_sites(site_url);
CREATE INDEX IF NOT EXISTS idx_bing_sites_sync_status ON public.bing_webmaster_sites(sync_status);

-- Bing Search Data indexes
CREATE INDEX IF NOT EXISTS idx_bing_search_site_id ON public.bing_webmaster_search_data(site_id);
CREATE INDEX IF NOT EXISTS idx_bing_search_date ON public.bing_webmaster_search_data(date DESC);
CREATE INDEX IF NOT EXISTS idx_bing_search_query ON public.bing_webmaster_search_data(query);
CREATE INDEX IF NOT EXISTS idx_bing_search_page ON public.bing_webmaster_search_data(page_url);

-- Yandex OAuth Credentials indexes
CREATE INDEX IF NOT EXISTS idx_yandex_oauth_user_id ON public.yandex_webmaster_oauth_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_yandex_oauth_active ON public.yandex_webmaster_oauth_credentials(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_yandex_oauth_expires_at ON public.yandex_webmaster_oauth_credentials(expires_at);

-- Yandex Sites indexes
CREATE INDEX IF NOT EXISTS idx_yandex_sites_user_id ON public.yandex_webmaster_sites(user_id);
CREATE INDEX IF NOT EXISTS idx_yandex_sites_host_id ON public.yandex_webmaster_sites(host_id);
CREATE INDEX IF NOT EXISTS idx_yandex_sites_sync_status ON public.yandex_webmaster_sites(sync_status);

-- Yandex Search Data indexes
CREATE INDEX IF NOT EXISTS idx_yandex_search_site_id ON public.yandex_webmaster_search_data(site_id);
CREATE INDEX IF NOT EXISTS idx_yandex_search_date ON public.yandex_webmaster_search_data(date DESC);
CREATE INDEX IF NOT EXISTS idx_yandex_search_query ON public.yandex_webmaster_search_data(query);
CREATE INDEX IF NOT EXISTS idx_yandex_search_page ON public.yandex_webmaster_search_data(page_url);

-- Unified Analytics indexes
CREATE INDEX IF NOT EXISTS idx_unified_user_id ON public.unified_search_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_unified_platform ON public.unified_search_analytics(source_platform);
CREATE INDEX IF NOT EXISTS idx_unified_date ON public.unified_search_analytics(date DESC);
CREATE INDEX IF NOT EXISTS idx_unified_page ON public.unified_search_analytics(page_url);
CREATE INDEX IF NOT EXISTS idx_unified_query ON public.unified_search_analytics(query);
CREATE INDEX IF NOT EXISTS idx_unified_composite ON public.unified_search_analytics(user_id, date DESC, source_platform);

-- Dashboard Config indexes
CREATE INDEX IF NOT EXISTS idx_dashboard_config_user_id ON public.search_dashboard_config(user_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.ga4_oauth_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ga4_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ga4_traffic_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bing_webmaster_oauth_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bing_webmaster_sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bing_webmaster_search_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.yandex_webmaster_oauth_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.yandex_webmaster_sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.yandex_webmaster_search_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unified_search_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_dashboard_config ENABLE ROW LEVEL SECURITY;

-- GA4 OAuth Credentials policies
DROP POLICY IF EXISTS "Users can manage their own GA4 credentials" ON public.ga4_oauth_credentials;
CREATE POLICY "Users can manage their own GA4 credentials"
ON public.ga4_oauth_credentials FOR ALL
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage all GA4 credentials" ON public.ga4_oauth_credentials;
CREATE POLICY "Admins can manage all GA4 credentials"
ON public.ga4_oauth_credentials FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- GA4 Properties policies
DROP POLICY IF EXISTS "Users can manage their own GA4 properties" ON public.ga4_properties;
CREATE POLICY "Users can manage their own GA4 properties"
ON public.ga4_properties FOR ALL
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage all GA4 properties" ON public.ga4_properties;
CREATE POLICY "Admins can manage all GA4 properties"
ON public.ga4_properties FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- GA4 Traffic Data policies
DROP POLICY IF EXISTS "Users can view their own GA4 traffic data" ON public.ga4_traffic_data;
CREATE POLICY "Users can view their own GA4 traffic data"
ON public.ga4_traffic_data FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.ga4_properties
    WHERE ga4_properties.id = ga4_traffic_data.property_id
    AND ga4_properties.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Admins can manage all GA4 traffic data" ON public.ga4_traffic_data;
CREATE POLICY "Admins can manage all GA4 traffic data"
ON public.ga4_traffic_data FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Bing OAuth Credentials policies
DROP POLICY IF EXISTS "Users can manage their own Bing credentials" ON public.bing_webmaster_oauth_credentials;
CREATE POLICY "Users can manage their own Bing credentials"
ON public.bing_webmaster_oauth_credentials FOR ALL
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage all Bing credentials" ON public.bing_webmaster_oauth_credentials;
CREATE POLICY "Admins can manage all Bing credentials"
ON public.bing_webmaster_oauth_credentials FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Bing Sites policies
DROP POLICY IF EXISTS "Users can manage their own Bing sites" ON public.bing_webmaster_sites;
CREATE POLICY "Users can manage their own Bing sites"
ON public.bing_webmaster_sites FOR ALL
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage all Bing sites" ON public.bing_webmaster_sites;
CREATE POLICY "Admins can manage all Bing sites"
ON public.bing_webmaster_sites FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Bing Search Data policies
DROP POLICY IF EXISTS "Users can view their own Bing search data" ON public.bing_webmaster_search_data;
CREATE POLICY "Users can view their own Bing search data"
ON public.bing_webmaster_search_data FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.bing_webmaster_sites
    WHERE bing_webmaster_sites.id = bing_webmaster_search_data.site_id
    AND bing_webmaster_sites.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Admins can manage all Bing search data" ON public.bing_webmaster_search_data;
CREATE POLICY "Admins can manage all Bing search data"
ON public.bing_webmaster_search_data FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Yandex OAuth Credentials policies
DROP POLICY IF EXISTS "Users can manage their own Yandex credentials" ON public.yandex_webmaster_oauth_credentials;
CREATE POLICY "Users can manage their own Yandex credentials"
ON public.yandex_webmaster_oauth_credentials FOR ALL
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage all Yandex credentials" ON public.yandex_webmaster_oauth_credentials;
CREATE POLICY "Admins can manage all Yandex credentials"
ON public.yandex_webmaster_oauth_credentials FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Yandex Sites policies
DROP POLICY IF EXISTS "Users can manage their own Yandex sites" ON public.yandex_webmaster_sites;
CREATE POLICY "Users can manage their own Yandex sites"
ON public.yandex_webmaster_sites FOR ALL
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage all Yandex sites" ON public.yandex_webmaster_sites;
CREATE POLICY "Admins can manage all Yandex sites"
ON public.yandex_webmaster_sites FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Yandex Search Data policies
DROP POLICY IF EXISTS "Users can view their own Yandex search data" ON public.yandex_webmaster_search_data;
CREATE POLICY "Users can view their own Yandex search data"
ON public.yandex_webmaster_search_data FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.yandex_webmaster_sites
    WHERE yandex_webmaster_sites.id = yandex_webmaster_search_data.site_id
    AND yandex_webmaster_sites.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Admins can manage all Yandex search data" ON public.yandex_webmaster_search_data;
CREATE POLICY "Admins can manage all Yandex search data"
ON public.yandex_webmaster_search_data FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Unified Analytics policies
DROP POLICY IF EXISTS "Users can view their own unified analytics" ON public.unified_search_analytics;
CREATE POLICY "Users can view their own unified analytics"
ON public.unified_search_analytics FOR ALL
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage all unified analytics" ON public.unified_search_analytics;
CREATE POLICY "Admins can manage all unified analytics"
ON public.unified_search_analytics FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Dashboard Config policies
DROP POLICY IF EXISTS "Users can manage their own dashboard config" ON public.search_dashboard_config;
CREATE POLICY "Users can manage their own dashboard config"
ON public.search_dashboard_config FOR ALL
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage all dashboard configs" ON public.search_dashboard_config;
CREATE POLICY "Admins can manage all dashboard configs"
ON public.search_dashboard_config FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================

DROP TRIGGER IF EXISTS update_ga4_oauth_credentials_updated_at ON public.ga4_oauth_credentials;
CREATE TRIGGER update_ga4_oauth_credentials_updated_at
BEFORE UPDATE ON public.ga4_oauth_credentials
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_ga4_properties_updated_at ON public.ga4_properties;
CREATE TRIGGER update_ga4_properties_updated_at
BEFORE UPDATE ON public.ga4_properties
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_bing_oauth_credentials_updated_at ON public.bing_webmaster_oauth_credentials;
CREATE TRIGGER update_bing_oauth_credentials_updated_at
BEFORE UPDATE ON public.bing_webmaster_oauth_credentials
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_bing_sites_updated_at ON public.bing_webmaster_sites;
CREATE TRIGGER update_bing_sites_updated_at
BEFORE UPDATE ON public.bing_webmaster_sites
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_yandex_oauth_credentials_updated_at ON public.yandex_webmaster_oauth_credentials;
CREATE TRIGGER update_yandex_oauth_credentials_updated_at
BEFORE UPDATE ON public.yandex_webmaster_oauth_credentials
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_yandex_sites_updated_at ON public.yandex_webmaster_sites;
CREATE TRIGGER update_yandex_sites_updated_at
BEFORE UPDATE ON public.yandex_webmaster_sites
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_unified_analytics_updated_at ON public.unified_search_analytics;
CREATE TRIGGER update_unified_analytics_updated_at
BEFORE UPDATE ON public.unified_search_analytics
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_dashboard_config_updated_at ON public.search_dashboard_config;
CREATE TRIGGER update_dashboard_config_updated_at
BEFORE UPDATE ON public.search_dashboard_config
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to get all connected platforms for a user
CREATE OR REPLACE FUNCTION public.get_connected_search_platforms(p_user_id UUID)
RETURNS TABLE (
  platform TEXT,
  is_connected BOOLEAN,
  last_sync TIMESTAMP WITH TIME ZONE,
  credential_status TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT 'google_analytics' as platform,
         EXISTS(SELECT 1 FROM public.ga4_oauth_credentials WHERE user_id = p_user_id AND is_active = true) as is_connected,
         (SELECT MAX(last_synced_at) FROM public.ga4_properties WHERE user_id = p_user_id) as last_sync,
         CASE
           WHEN EXISTS(SELECT 1 FROM public.ga4_oauth_credentials WHERE user_id = p_user_id AND is_active = true AND expires_at > now()) THEN 'active'
           WHEN EXISTS(SELECT 1 FROM public.ga4_oauth_credentials WHERE user_id = p_user_id AND is_active = true) THEN 'expired'
           ELSE 'not_connected'
         END as credential_status

  UNION ALL

  SELECT 'google_search_console' as platform,
         EXISTS(SELECT 1 FROM public.gsc_oauth_credentials WHERE user_id = p_user_id AND is_active = true) as is_connected,
         (SELECT MAX(last_synced_at) FROM public.gsc_properties WHERE user_id = p_user_id) as last_sync,
         CASE
           WHEN EXISTS(SELECT 1 FROM public.gsc_oauth_credentials WHERE user_id = p_user_id AND is_active = true AND expires_at > now()) THEN 'active'
           WHEN EXISTS(SELECT 1 FROM public.gsc_oauth_credentials WHERE user_id = p_user_id AND is_active = true) THEN 'expired'
           ELSE 'not_connected'
         END as credential_status

  UNION ALL

  SELECT 'bing_webmaster' as platform,
         EXISTS(SELECT 1 FROM public.bing_webmaster_oauth_credentials WHERE user_id = p_user_id AND is_active = true) as is_connected,
         (SELECT MAX(last_synced_at) FROM public.bing_webmaster_sites WHERE user_id = p_user_id) as last_sync,
         CASE
           WHEN EXISTS(SELECT 1 FROM public.bing_webmaster_oauth_credentials WHERE user_id = p_user_id AND is_active = true AND expires_at > now()) THEN 'active'
           WHEN EXISTS(SELECT 1 FROM public.bing_webmaster_oauth_credentials WHERE user_id = p_user_id AND is_active = true) THEN 'expired'
           ELSE 'not_connected'
         END as credential_status

  UNION ALL

  SELECT 'yandex_webmaster' as platform,
         EXISTS(SELECT 1 FROM public.yandex_webmaster_oauth_credentials WHERE user_id = p_user_id AND is_active = true) as is_connected,
         (SELECT MAX(last_synced_at) FROM public.yandex_webmaster_sites WHERE user_id = p_user_id) as last_sync,
         CASE
           WHEN EXISTS(SELECT 1 FROM public.yandex_webmaster_oauth_credentials WHERE user_id = p_user_id AND is_active = true AND expires_at > now()) THEN 'active'
           WHEN EXISTS(SELECT 1 FROM public.yandex_webmaster_oauth_credentials WHERE user_id = p_user_id AND is_active = true) THEN 'expired'
           ELSE 'not_connected'
         END as credential_status;
$$;

-- Function to aggregate unified analytics data
CREATE OR REPLACE FUNCTION public.refresh_unified_analytics(
  p_user_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  inserted_count INTEGER := 0;
  row_count_temp INTEGER;
BEGIN
  -- Insert/Update GSC data
  INSERT INTO public.unified_search_analytics (
    user_id, source_platform, source_property_id, date, page_url, query,
    country, device, clicks, impressions, ctr, average_position
  )
  SELECT
    gp.user_id,
    'google_search_console'::TEXT,
    gpp.property_id,
    gpp.date,
    gpp.url,
    NULL, -- GSC page data doesn't include query
    gpp.country,
    gpp.device,
    gpp.clicks,
    gpp.impressions,
    gpp.ctr,
    gpp.position
  FROM public.gsc_page_performance gpp
  JOIN public.gsc_properties gp ON gpp.property_id = gp.id
  WHERE gp.user_id = p_user_id
    AND gpp.date BETWEEN p_start_date AND p_end_date
  ON CONFLICT (user_id, source_platform, date, page_url, query, device, country)
  DO UPDATE SET
    clicks = EXCLUDED.clicks,
    impressions = EXCLUDED.impressions,
    ctr = EXCLUDED.ctr,
    average_position = EXCLUDED.average_position,
    updated_at = now();

  GET DIAGNOSTICS row_count_temp = ROW_COUNT;
  inserted_count := inserted_count + row_count_temp;

  -- Insert/Update GA4 data
  INSERT INTO public.unified_search_analytics (
    user_id, source_platform, source_property_id, date, page_url, page_title,
    country, device, sessions, users, pageviews, bounce_rate, engagement_rate
  )
  SELECT
    gp.user_id,
    'google_analytics'::TEXT,
    gtd.property_id,
    gtd.date,
    gtd.page_path,
    gtd.page_title,
    gtd.country,
    gtd.device_category,
    gtd.sessions,
    gtd.users,
    gtd.pageviews,
    gtd.bounce_rate,
    gtd.engagement_rate
  FROM public.ga4_traffic_data gtd
  JOIN public.ga4_properties gp ON gtd.property_id = gp.id
  WHERE gp.user_id = p_user_id
    AND gtd.date BETWEEN p_start_date AND p_end_date
  ON CONFLICT (user_id, source_platform, date, page_url, query, device, country)
  DO UPDATE SET
    sessions = EXCLUDED.sessions,
    users = EXCLUDED.users,
    pageviews = EXCLUDED.pageviews,
    bounce_rate = EXCLUDED.bounce_rate,
    engagement_rate = EXCLUDED.engagement_rate,
    updated_at = now();

  GET DIAGNOSTICS row_count_temp = ROW_COUNT;
  inserted_count := inserted_count + row_count_temp;

  -- Insert/Update Bing data
  INSERT INTO public.unified_search_analytics (
    user_id, source_platform, source_property_id, date, page_url, query,
    country, device, clicks, impressions, ctr, average_position
  )
  SELECT
    bs.user_id,
    'bing_webmaster'::TEXT,
    bsd.site_id,
    bsd.date,
    bsd.page_url,
    bsd.query,
    bsd.country,
    bsd.device,
    bsd.clicks,
    bsd.impressions,
    bsd.ctr,
    bsd.average_position
  FROM public.bing_webmaster_search_data bsd
  JOIN public.bing_webmaster_sites bs ON bsd.site_id = bs.id
  WHERE bs.user_id = p_user_id
    AND bsd.date BETWEEN p_start_date AND p_end_date
  ON CONFLICT (user_id, source_platform, date, page_url, query, device, country)
  DO UPDATE SET
    clicks = EXCLUDED.clicks,
    impressions = EXCLUDED.impressions,
    ctr = EXCLUDED.ctr,
    average_position = EXCLUDED.average_position,
    updated_at = now();

  GET DIAGNOSTICS row_count_temp = ROW_COUNT;
  inserted_count := inserted_count + row_count_temp;

  -- Insert/Update Yandex data
  INSERT INTO public.unified_search_analytics (
    user_id, source_platform, source_property_id, date, page_url, query,
    device, clicks, impressions, ctr, average_position
  )
  SELECT
    ys.user_id,
    'yandex_webmaster'::TEXT,
    ysd.site_id,
    ysd.date,
    ysd.page_url,
    ysd.query,
    ysd.device,
    ysd.clicks,
    ysd.shows, -- Yandex uses "shows" as impressions
    ysd.ctr,
    ysd.position
  FROM public.yandex_webmaster_search_data ysd
  JOIN public.yandex_webmaster_sites ys ON ysd.site_id = ys.id
  WHERE ys.user_id = p_user_id
    AND ysd.date BETWEEN p_start_date AND p_end_date
  ON CONFLICT (user_id, source_platform, date, page_url, query, device, country)
  DO UPDATE SET
    clicks = EXCLUDED.clicks,
    impressions = EXCLUDED.impressions,
    ctr = EXCLUDED.ctr,
    average_position = EXCLUDED.average_position,
    updated_at = now();

  GET DIAGNOSTICS row_count_temp = ROW_COUNT;
  inserted_count := inserted_count + row_count_temp;

  RETURN inserted_count;
END;
$$;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE public.ga4_oauth_credentials IS 'OAuth2 credentials for Google Analytics 4 API access';
COMMENT ON TABLE public.ga4_properties IS 'Google Analytics 4 properties connected to the account';
COMMENT ON TABLE public.ga4_traffic_data IS 'Traffic and engagement metrics from Google Analytics 4';
COMMENT ON TABLE public.bing_webmaster_oauth_credentials IS 'OAuth2 credentials for Bing Webmaster Tools API';
COMMENT ON TABLE public.bing_webmaster_sites IS 'Bing Webmaster Tools sites connected to the account';
COMMENT ON TABLE public.bing_webmaster_search_data IS 'Search performance metrics from Bing Webmaster Tools';
COMMENT ON TABLE public.yandex_webmaster_oauth_credentials IS 'OAuth2 credentials for Yandex Webmaster API';
COMMENT ON TABLE public.yandex_webmaster_sites IS 'Yandex Webmaster sites connected to the account';
COMMENT ON TABLE public.yandex_webmaster_search_data IS 'Search performance metrics from Yandex Webmaster';
COMMENT ON TABLE public.unified_search_analytics IS 'Aggregated analytics data from all search platforms';
COMMENT ON TABLE public.search_dashboard_config IS 'User preferences and configuration for the search analytics dashboard';

COMMENT ON FUNCTION public.get_connected_search_platforms IS 'Get connection status for all search platforms for a user';
COMMENT ON FUNCTION public.refresh_unified_analytics IS 'Aggregate and refresh unified analytics data from all platforms';
-- Add Zapier webhook integration to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS zapier_webhook_url TEXT;

-- Add index for profiles with webhook configured
CREATE INDEX IF NOT EXISTS idx_profiles_zapier_webhook
  ON public.profiles(id)
  WHERE zapier_webhook_url IS NOT NULL;

-- Comment for documentation
COMMENT ON COLUMN public.profiles.zapier_webhook_url IS 'Zapier webhook URL for automatic lead forwarding to CRM systems';
-- SEO Automation System
-- Automated audit scheduling, auto-fix rules, competitor tracking, and performance monitoring

-- =============================================
-- SEO AUDIT SCHEDULES
-- =============================================

CREATE TABLE IF NOT EXISTS seo_audit_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  schedule_type TEXT NOT NULL CHECK (schedule_type IN ('daily', 'weekly', 'monthly', 'cron')),
  cron_expression TEXT,
  audit_config JSONB DEFAULT '{}'::jsonb, -- Which checks to run (all, performance, accessibility, seo, etc.)
  notification_channels TEXT[] DEFAULT ARRAY[]::TEXT[], -- ['email', 'slack', 'in_app']
  notification_recipients TEXT[] DEFAULT ARRAY[]::TEXT[],
  active BOOLEAN DEFAULT true,
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  last_run_status TEXT CHECK (last_run_status IN ('success', 'failed', 'running')),
  last_run_results JSONB,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_seo_audit_schedules_next_run ON seo_audit_schedules(next_run_at) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_seo_audit_schedules_created_by ON seo_audit_schedules(created_by);

-- Updated_at trigger
DROP TRIGGER IF EXISTS update_seo_audit_schedules_updated_at ON seo_audit_schedules;
CREATE TRIGGER update_seo_audit_schedules_updated_at
  BEFORE UPDATE ON seo_audit_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE seo_audit_schedules IS 'Scheduled automated SEO audits';

-- =============================================
-- SEO AUTO-FIX RULES
-- =============================================

CREATE TABLE IF NOT EXISTS seo_autofix_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  issue_type TEXT NOT NULL, -- 'missing_meta_description', 'broken_link', 'missing_alt_text', etc.
  conditions JSONB DEFAULT '{}'::jsonb, -- Conditions for when to apply the fix
  fix_action JSONB NOT NULL, -- What action to take
  requires_approval BOOLEAN DEFAULT true,
  auto_apply BOOLEAN DEFAULT false, -- If true, apply without approval
  priority INTEGER DEFAULT 50, -- Higher priority rules run first
  applied_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_seo_autofix_rules_issue_type ON seo_autofix_rules(issue_type) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_seo_autofix_rules_priority ON seo_autofix_rules(priority DESC) WHERE active = true;

-- Updated_at trigger
DROP TRIGGER IF EXISTS update_seo_autofix_rules_updated_at ON seo_autofix_rules;
CREATE TRIGGER update_seo_autofix_rules_updated_at
  BEFORE UPDATE ON seo_autofix_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE seo_autofix_rules IS 'Rules for automatically fixing SEO issues';

-- =============================================
-- SEO AUTO-FIX HISTORY
-- =============================================

CREATE TABLE IF NOT EXISTS seo_autofix_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID REFERENCES seo_autofix_rules(id) ON DELETE SET NULL,
  issue_id UUID, -- Reference to specific issue (could be from various tables)
  issue_type TEXT NOT NULL,
  fix_applied JSONB NOT NULL, -- Details of what was changed
  result TEXT NOT NULL CHECK (result IN ('success', 'failed', 'rolled_back', 'pending_approval')),
  error_message TEXT,
  approved_by UUID REFERENCES auth.users(id),
  applied_by UUID REFERENCES auth.users(id),
  applied_at TIMESTAMPTZ DEFAULT now(),
  rolled_back_at TIMESTAMPTZ,
  rollback_reason TEXT
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_seo_autofix_history_rule_id ON seo_autofix_history(rule_id);
CREATE INDEX IF NOT EXISTS idx_seo_autofix_history_applied_at ON seo_autofix_history(applied_at DESC);
CREATE INDEX IF NOT EXISTS idx_seo_autofix_history_result ON seo_autofix_history(result);

COMMENT ON TABLE seo_autofix_history IS 'History of all auto-applied SEO fixes';

-- =============================================
-- SEO COMPETITOR TRACKING
-- =============================================

CREATE TABLE IF NOT EXISTS seo_competitor_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competitor_domain TEXT NOT NULL,
  competitor_name TEXT,
  keywords TEXT[] DEFAULT ARRAY[]::TEXT[], -- Keywords to track for this competitor
  check_frequency TEXT DEFAULT 'weekly' CHECK (check_frequency IN ('daily', 'weekly', 'biweekly', 'monthly')),
  last_checked_at TIMESTAMPTZ,
  next_check_at TIMESTAMPTZ,
  alert_on_rank_change BOOLEAN DEFAULT true,
  alert_on_new_backlinks BOOLEAN DEFAULT true,
  alert_on_content_updates BOOLEAN DEFAULT false,
  rank_change_threshold INTEGER DEFAULT 5, -- Alert if rank changes by more than N positions
  notification_channels TEXT[] DEFAULT ARRAY['in_app']::TEXT[],
  notification_recipients TEXT[] DEFAULT ARRAY[]::TEXT[],
  active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb, -- Additional tracking metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_seo_competitor_tracking_next_check ON seo_competitor_tracking(next_check_at) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_seo_competitor_tracking_domain ON seo_competitor_tracking(competitor_domain);

-- Updated_at trigger
DROP TRIGGER IF EXISTS update_seo_competitor_tracking_updated_at ON seo_competitor_tracking;
CREATE TRIGGER update_seo_competitor_tracking_updated_at
  BEFORE UPDATE ON seo_competitor_tracking
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE seo_competitor_tracking IS 'Automated competitor monitoring and tracking';

-- =============================================
-- SEO AUTOMATION LOGS
-- =============================================

CREATE TABLE IF NOT EXISTS seo_automation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_type TEXT NOT NULL CHECK (automation_type IN ('audit', 'autofix', 'competitor_check', 'report_generation')),
  automation_id UUID, -- ID of the schedule/rule/tracker
  status TEXT NOT NULL CHECK (status IN ('started', 'running', 'completed', 'failed')),
  message TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  duration_ms INTEGER, -- Execution time in milliseconds
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_seo_automation_logs_type ON seo_automation_logs(automation_type);
CREATE INDEX IF NOT EXISTS idx_seo_automation_logs_created_at ON seo_automation_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_seo_automation_logs_status ON seo_automation_logs(status);

COMMENT ON TABLE seo_automation_logs IS 'Logs of all SEO automation executions';

-- =============================================
-- SEO NOTIFICATION QUEUE
-- =============================================

CREATE TABLE IF NOT EXISTS seo_notification_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_type TEXT NOT NULL CHECK (notification_type IN ('critical_issue', 'warning', 'opportunity', 'competitor_alert', 'report_ready')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  channels TEXT[] NOT NULL, -- ['email', 'slack', 'in_app']
  recipients TEXT[] NOT NULL,
  data JSONB DEFAULT '{}'::jsonb, -- Additional notification data
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_seo_notification_queue_status ON seo_notification_queue(status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_seo_notification_queue_created_at ON seo_notification_queue(created_at DESC);

COMMENT ON TABLE seo_notification_queue IS 'Queue for SEO-related notifications';

-- =============================================
-- SEO SCHEDULED REPORTS
-- =============================================

CREATE TABLE IF NOT EXISTS seo_scheduled_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  report_type TEXT NOT NULL CHECK (report_type IN ('comprehensive', 'executive_summary', 'keyword_performance', 'competitor_analysis', 'technical_seo')),
  schedule_type TEXT NOT NULL CHECK (schedule_type IN ('daily', 'weekly', 'monthly', 'cron')),
  cron_expression TEXT,
  report_config JSONB DEFAULT '{}'::jsonb, -- What to include in the report
  format TEXT DEFAULT 'pdf' CHECK (format IN ('pdf', 'html', 'json')),
  recipients TEXT[] NOT NULL,
  delivery_channels TEXT[] DEFAULT ARRAY['email']::TEXT[],
  active BOOLEAN DEFAULT true,
  last_generated_at TIMESTAMPTZ,
  next_generation_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_seo_scheduled_reports_next_gen ON seo_scheduled_reports(next_generation_at) WHERE active = true;

-- Updated_at trigger
DROP TRIGGER IF EXISTS update_seo_scheduled_reports_updated_at ON seo_scheduled_reports;
CREATE TRIGGER update_seo_scheduled_reports_updated_at
  BEFORE UPDATE ON seo_scheduled_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE seo_scheduled_reports IS 'Scheduled automated SEO reports';

-- =============================================
-- SEO REPORT HISTORY
-- =============================================

CREATE TABLE IF NOT EXISTS seo_report_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID REFERENCES seo_scheduled_reports(id) ON DELETE SET NULL,
  report_type TEXT NOT NULL,
  report_data JSONB NOT NULL, -- Full report data
  file_url TEXT, -- If stored as file
  generated_at TIMESTAMPTZ DEFAULT now(),
  sent_to TEXT[], -- Who received it
  generation_time_ms INTEGER
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_seo_report_history_schedule_id ON seo_report_history(schedule_id);
CREATE INDEX IF NOT EXISTS idx_seo_report_history_generated_at ON seo_report_history(generated_at DESC);

COMMENT ON TABLE seo_report_history IS 'History of generated SEO reports';

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on all tables
ALTER TABLE seo_audit_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_autofix_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_autofix_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_competitor_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_automation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_notification_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_scheduled_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_report_history ENABLE ROW LEVEL SECURITY;

-- Admin-only access policies for all tables
DROP POLICY IF EXISTS "Admin full access to seo_audit_schedules" ON seo_audit_schedules;
CREATE POLICY "Admin full access to seo_audit_schedules" ON seo_audit_schedules
  FOR ALL USING (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admin full access to seo_autofix_rules" ON seo_autofix_rules;
CREATE POLICY "Admin full access to seo_autofix_rules" ON seo_autofix_rules
  FOR ALL USING (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admin full access to seo_autofix_history" ON seo_autofix_history;
CREATE POLICY "Admin full access to seo_autofix_history" ON seo_autofix_history
  FOR ALL USING (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admin full access to seo_competitor_tracking" ON seo_competitor_tracking;
CREATE POLICY "Admin full access to seo_competitor_tracking" ON seo_competitor_tracking
  FOR ALL USING (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admin full access to seo_automation_logs" ON seo_automation_logs;
CREATE POLICY "Admin full access to seo_automation_logs" ON seo_automation_logs
  FOR ALL USING (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admin full access to seo_notification_queue" ON seo_notification_queue;
CREATE POLICY "Admin full access to seo_notification_queue" ON seo_notification_queue
  FOR ALL USING (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admin full access to seo_scheduled_reports" ON seo_scheduled_reports;
CREATE POLICY "Admin full access to seo_scheduled_reports" ON seo_scheduled_reports
  FOR ALL USING (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admin full access to seo_report_history" ON seo_report_history;
CREATE POLICY "Admin full access to seo_report_history" ON seo_report_history
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- =============================================
-- HELPER FUNCTIONS
-- =============================================

-- Function to calculate next run time based on schedule type
CREATE OR REPLACE FUNCTION calculate_next_run_time(
  p_schedule_type TEXT,
  p_cron_expression TEXT DEFAULT NULL,
  p_current_time TIMESTAMPTZ DEFAULT now()
)
RETURNS TIMESTAMPTZ AS $$
BEGIN
  CASE p_schedule_type
    WHEN 'daily' THEN
      RETURN p_current_time + INTERVAL '1 day';
    WHEN 'weekly' THEN
      RETURN p_current_time + INTERVAL '7 days';
    WHEN 'monthly' THEN
      RETURN p_current_time + INTERVAL '1 month';
    WHEN 'cron' THEN
      -- For cron, we'll calculate in the edge function
      -- This is a placeholder - actual cron parsing would be more complex
      RETURN p_current_time + INTERVAL '1 hour';
    ELSE
      RETURN p_current_time + INTERVAL '1 day';
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- Function to log automation execution
CREATE OR REPLACE FUNCTION log_automation_execution(
  p_automation_type TEXT,
  p_automation_id UUID,
  p_status TEXT,
  p_message TEXT DEFAULT NULL,
  p_details JSONB DEFAULT '{}'::jsonb,
  p_duration_ms INTEGER DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO seo_automation_logs (
    automation_type,
    automation_id,
    status,
    message,
    details,
    duration_ms
  ) VALUES (
    p_automation_type,
    p_automation_id,
    p_status,
    p_message,
    p_details,
    p_duration_ms
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql;

-- Function to queue SEO notification
CREATE OR REPLACE FUNCTION queue_seo_notification(
  p_notification_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_severity TEXT,
  p_channels TEXT[],
  p_recipients TEXT[],
  p_data JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO seo_notification_queue (
    notification_type,
    title,
    message,
    severity,
    channels,
    recipients,
    data
  ) VALUES (
    p_notification_type,
    p_title,
    p_message,
    p_severity,
    p_channels,
    p_recipients,
    p_data
  )
  RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update rule statistics
CREATE OR REPLACE FUNCTION update_autofix_rule_stats(
  p_rule_id UUID,
  p_success BOOLEAN
)
RETURNS VOID AS $$
BEGIN
  UPDATE seo_autofix_rules
  SET
    applied_count = applied_count + 1,
    success_count = CASE WHEN p_success THEN success_count + 1 ELSE success_count END,
    failure_count = CASE WHEN NOT p_success THEN failure_count + 1 ELSE failure_count END,
    updated_at = now()
  WHERE id = p_rule_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- DEFAULT DATA / EXAMPLES
-- =============================================

-- Insert example audit schedule (daily comprehensive audit)
INSERT INTO seo_audit_schedules (name, description, schedule_type, audit_config, notification_channels, active)
VALUES (
  'Daily Comprehensive SEO Audit',
  'Runs a full SEO audit every day at 6:00 AM',
  'daily',
  '{"checks": ["all"], "include_performance": true, "include_accessibility": true}'::jsonb,
  ARRAY['in_app', 'email']::TEXT[],
  false -- Disabled by default, admin can enable
)
ON CONFLICT DO NOTHING;

-- Insert example auto-fix rules
INSERT INTO seo_autofix_rules (name, description, issue_type, conditions, fix_action, requires_approval, auto_apply, priority)
VALUES
  (
    'Auto-add missing alt text to images',
    'Automatically generates descriptive alt text for images missing alt attributes',
    'missing_alt_text',
    '{"image_type": "content", "exclude_decorative": true}'::jsonb,
    '{"action": "generate_alt_text", "use_ai": true}'::jsonb,
    true,
    false,
    80
  ),
  (
    'Fix broken internal links',
    'Automatically updates broken internal links to correct URLs',
    'broken_link',
    '{"link_type": "internal", "status_code": 404}'::jsonb,
    '{"action": "update_link", "find_similar": true}'::jsonb,
    true,
    false,
    90
  ),
  (
    'Add missing meta descriptions',
    'Generates meta descriptions for pages missing them',
    'missing_meta_description',
    '{"page_type": "article", "min_content_length": 200}'::jsonb,
    '{"action": "generate_meta_description", "use_ai": true, "max_length": 160}'::jsonb,
    true,
    false,
    70
  )
ON CONFLICT DO NOTHING;

-- Insert example scheduled report
INSERT INTO seo_scheduled_reports (name, description, report_type, schedule_type, format, recipients, active)
VALUES (
  'Weekly SEO Executive Summary',
  'High-level overview of SEO performance sent every Monday',
  'executive_summary',
  'weekly',
  'pdf',
  ARRAY['admin@example.com']::TEXT[],
  false -- Disabled by default
)
ON CONFLICT DO NOTHING;
-- Admin Operations Hub Database Schema
-- Centralized error logging, system monitoring, and admin audit trail

-- =============================================
-- ERROR LOGS (Centralized)
-- =============================================

CREATE TABLE IF NOT EXISTS error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  error_type TEXT NOT NULL,
  error_message TEXT,
  stack_trace TEXT,
  user_context JSONB DEFAULT '{}'::jsonb, -- Browser, route, user data, etc.
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  resolved BOOLEAN DEFAULT false,
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'error_logs' AND column_name = 'severity') THEN
    CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON error_logs(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_error_logs_user_id ON error_logs(user_id);
    CREATE INDEX IF NOT EXISTS idx_error_logs_severity ON error_logs(severity) WHERE NOT resolved;
    CREATE INDEX IF NOT EXISTS idx_error_logs_resolved ON error_logs(resolved);
  END IF;
END $$;

COMMENT ON TABLE error_logs IS 'Centralized error logging for the entire application';

-- =============================================
-- SYSTEM METRICS (Real-time monitoring)
-- =============================================

CREATE TABLE IF NOT EXISTS system_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_type TEXT NOT NULL, -- 'edge_function', 'database', 'webhook', 'api'
  metric_name TEXT NOT NULL, -- Specific function/table/endpoint name
  value NUMERIC NOT NULL,
  unit TEXT, -- 'ms', 'count', 'percentage', 'bytes'
  metadata JSONB DEFAULT '{}'::jsonb,
  recorded_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'system_metrics' AND column_name = 'metric_type') THEN
    CREATE INDEX IF NOT EXISTS idx_system_metrics_recorded_at ON system_metrics(recorded_at DESC);
    CREATE INDEX IF NOT EXISTS idx_system_metrics_type_name ON system_metrics(metric_type, metric_name);
    CREATE INDEX IF NOT EXISTS idx_system_metrics_type ON system_metrics(metric_type);
  END IF;
END $$;

-- Partitioning hint: Consider partitioning by recorded_at for large datasets
COMMENT ON TABLE system_metrics IS 'Real-time system health and performance metrics';

-- =============================================
-- ADMIN AUDIT LOG (Track all admin actions)
-- =============================================

CREATE TABLE IF NOT EXISTS admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL, -- 'role_change', 'user_delete', 'seo_audit', 'impersonate', etc.
  target_type TEXT, -- 'user', 'article', 'seo_rule', etc.
  target_id UUID,
  details JSONB DEFAULT '{}'::jsonb, -- Full context of the action
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_audit_log' AND column_name = 'admin_id') THEN
    CREATE INDEX IF NOT EXISTS idx_admin_audit_log_admin_id ON admin_audit_log(admin_id);
    CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created_at ON admin_audit_log(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_admin_audit_log_action ON admin_audit_log(action);
    CREATE INDEX IF NOT EXISTS idx_admin_audit_log_target ON admin_audit_log(target_type, target_id);
  END IF;
END $$;

COMMENT ON TABLE admin_audit_log IS 'Complete audit trail of all admin operations';

-- =============================================
-- USER ACTIVITY LOG (Track user actions for support)
-- =============================================

CREATE TABLE IF NOT EXISTS user_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  activity_type TEXT NOT NULL, -- 'login', 'article_view', 'profile_update', etc.
  activity_data JSONB DEFAULT '{}'::jsonb,
  page_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_activity_log' AND column_name = 'user_id') THEN
    CREATE INDEX IF NOT EXISTS idx_user_activity_log_user_id ON user_activity_log(user_id);
    CREATE INDEX IF NOT EXISTS idx_user_activity_log_created_at ON user_activity_log(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_user_activity_log_type ON user_activity_log(activity_type);
  END IF;
END $$;

COMMENT ON TABLE user_activity_log IS 'User activity tracking for debugging and support';

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_log ENABLE ROW LEVEL SECURITY;

-- Admin-only access for error logs
DROP POLICY IF EXISTS "Admin full access to error_logs" ON error_logs;
CREATE POLICY "Admin full access to error_logs" ON error_logs
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Admin-only access for system metrics
DROP POLICY IF EXISTS "Admin full access to system_metrics" ON system_metrics;
CREATE POLICY "Admin full access to system_metrics" ON system_metrics
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Admin-only access for admin audit log
DROP POLICY IF EXISTS "Admin full access to admin_audit_log" ON admin_audit_log;
CREATE POLICY "Admin full access to admin_audit_log" ON admin_audit_log
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Admin can see all user activity, users can see their own
DROP POLICY IF EXISTS "Admin or own user activity" ON user_activity_log;
CREATE POLICY "Admin or own user activity" ON user_activity_log
  FOR SELECT USING (
    has_role(auth.uid(), 'admin') OR user_id = auth.uid()
  );

DROP POLICY IF EXISTS "Admin insert user activity" ON user_activity_log;
CREATE POLICY "Admin insert user activity" ON user_activity_log
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));

-- =============================================
-- HELPER FUNCTIONS
-- =============================================

-- Function to log admin actions
CREATE OR REPLACE FUNCTION log_admin_action(
  p_admin_id UUID,
  p_action TEXT,
  p_target_type TEXT DEFAULT NULL,
  p_target_id UUID DEFAULT NULL,
  p_details JSONB DEFAULT '{}'::jsonb,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO admin_audit_log (
    admin_id,
    action,
    target_type,
    target_id,
    details,
    ip_address,
    user_agent
  ) VALUES (
    p_admin_id,
    p_action,
    p_target_type,
    p_target_id,
    p_details,
    p_ip_address,
    p_user_agent
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log errors
CREATE OR REPLACE FUNCTION log_error(
  p_user_id UUID,
  p_error_type TEXT,
  p_error_message TEXT,
  p_stack_trace TEXT DEFAULT NULL,
  p_user_context JSONB DEFAULT '{}'::jsonb,
  p_severity TEXT DEFAULT 'medium'
)
RETURNS UUID AS $$
DECLARE
  v_error_id UUID;
BEGIN
  INSERT INTO error_logs (
    user_id,
    error_type,
    error_message,
    stack_trace,
    user_context,
    severity
  ) VALUES (
    p_user_id,
    p_error_type,
    p_error_message,
    p_stack_trace,
    p_user_context,
    p_severity
  )
  RETURNING id INTO v_error_id;

  RETURN v_error_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log user activity
CREATE OR REPLACE FUNCTION log_user_activity(
  p_user_id UUID,
  p_activity_type TEXT,
  p_activity_data JSONB DEFAULT '{}'::jsonb,
  p_page_url TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_activity_id UUID;
BEGIN
  INSERT INTO user_activity_log (
    user_id,
    activity_type,
    activity_data,
    page_url
  ) VALUES (
    p_user_id,
    p_activity_type,
    p_activity_data,
    p_page_url
  )
  RETURNING id INTO v_activity_id;

  RETURN v_activity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record system metric
CREATE OR REPLACE FUNCTION record_system_metric(
  p_metric_type TEXT,
  p_metric_name TEXT,
  p_value NUMERIC,
  p_unit TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  v_metric_id UUID;
BEGIN
  INSERT INTO system_metrics (
    metric_type,
    metric_name,
    value,
    unit,
    metadata
  ) VALUES (
    p_metric_type,
    p_metric_name,
    p_value,
    p_unit,
    p_metadata
  )
  RETURNING id INTO v_metric_id;

  RETURN v_metric_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get system health summary
CREATE OR REPLACE FUNCTION get_system_health_summary()
RETURNS TABLE (
  metric_type TEXT,
  avg_value NUMERIC,
  min_value NUMERIC,
  max_value NUMERIC,
  count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    sm.metric_type,
    AVG(sm.value)::NUMERIC,
    MIN(sm.value)::NUMERIC,
    MAX(sm.value)::NUMERIC,
    COUNT(*)::BIGINT
  FROM system_metrics sm
  WHERE sm.recorded_at > NOW() - INTERVAL '1 hour'
  GROUP BY sm.metric_type;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user statistics
CREATE OR REPLACE FUNCTION get_user_statistics()
RETURNS TABLE (
  total_users BIGINT,
  active_users_24h BIGINT,
  active_users_7d BIGINT,
  admin_count BIGINT,
  users_with_subscriptions BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM auth.users)::BIGINT,
    (SELECT COUNT(DISTINCT user_id) FROM user_activity_log WHERE created_at > NOW() - INTERVAL '24 hours')::BIGINT,
    (SELECT COUNT(DISTINCT user_id) FROM user_activity_log WHERE created_at > NOW() - INTERVAL '7 days')::BIGINT,
    (SELECT COUNT(DISTINCT user_id) FROM user_roles WHERE role = 'admin')::BIGINT,
    (SELECT COUNT(DISTINCT user_id) FROM subscriptions WHERE status = 'active')::BIGINT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- DATA RETENTION POLICIES (Optional - commented out)
-- =============================================

-- Uncomment to enable automatic cleanup of old data

-- DELETE old error logs (keep 90 days)
-- CREATE OR REPLACE FUNCTION cleanup_old_error_logs()
-- RETURNS void AS $$
-- BEGIN
--   DELETE FROM error_logs
--   WHERE created_at < NOW() - INTERVAL '90 days'
--   AND resolved = true;
-- END;
-- $$ LANGUAGE plpgsql;

-- DELETE old system metrics (keep 30 days)
-- CREATE OR REPLACE FUNCTION cleanup_old_metrics()
-- RETURNS void AS $$
-- BEGIN
--   DELETE FROM system_metrics
--   WHERE recorded_at < NOW() - INTERVAL '30 days';
-- END;
-- $$ LANGUAGE plpgsql;

-- DELETE old user activity logs (keep 180 days)
-- CREATE OR REPLACE FUNCTION cleanup_old_activity()
-- RETURNS void AS $$
-- BEGIN
--   DELETE FROM user_activity_log
--   WHERE created_at < NOW() - INTERVAL '180 days';
-- END;
-- $$ LANGUAGE plpgsql;
-- Migration: Add Calendly Integration
-- Description: Adds calendly_url field to profiles table for calendar booking integration
-- Created: 2025-11-10

-- Add calendly_url to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS calendly_url TEXT;

-- Add comment
COMMENT ON COLUMN profiles.calendly_url IS 'Calendly booking URL for showing appointments';

-- Example: https://calendly.com/johndoe/30min or https://calendly.com/johndoe/property-showing
-- Security fixes for RLS policies and database functions
-- This migration addresses critical security issues identified in security scan

-- ============================================
-- 1. FIX RLS POLICIES - RESTRICT SENSITIVE DATA ACCESS
-- ============================================

-- Drop overly permissive profile policy
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;

-- Create restricted profile view policy - only show public-safe fields
DROP POLICY IF EXISTS "Public can view limited profile info" ON public.profiles;
CREATE POLICY "Public can view limited profile info"
ON public.profiles
FOR SELECT
TO public
USING (
  is_published = true
);