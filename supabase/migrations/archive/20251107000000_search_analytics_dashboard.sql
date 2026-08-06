-- ============================================
-- SEARCH ANALYTICS DASHBOARD - MULTI-PLATFORM INTEGRATION
-- ============================================
-- Migration: Comprehensive search traffic analytics dashboard
-- Platforms: Google Analytics 4, Bing Webmaster Tools, Yandex Webmaster
-- Purpose: Unified analytics view for all search traffic sources

-- ============================================
-- GOOGLE ANALYTICS 4 OAUTH CREDENTIALS TABLE
-- ============================================
-- Stores encrypted OAuth credentials for Google Analytics 4 API access

CREATE TABLE public.ga4_oauth_credentials (
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

  CONSTRAINT one_active_ga4_credential_per_user UNIQUE (user_id, is_active)
);

-- ============================================
-- GOOGLE ANALYTICS 4 PROPERTIES TABLE
-- ============================================
-- Stores GA4 properties connected to the account

CREATE TABLE public.ga4_properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  credential_id UUID REFERENCES ga4_oauth_credentials(id) ON DELETE CASCADE,
  property_id TEXT NOT NULL, -- GA4 property ID (e.g., "123456789")
  property_name TEXT NOT NULL,
  display_name TEXT,
  property_type TEXT DEFAULT 'PROPERTY_TYPE_ORDINARY',
  currency_code TEXT DEFAULT 'USD',
  time_zone TEXT DEFAULT 'America/Los_Angeles',
  is_primary BOOLEAN DEFAULT false,
  last_synced_at TIMESTAMP WITH TIME ZONE,
  sync_status TEXT DEFAULT 'pending' CHECK (sync_status IN ('pending', 'syncing', 'completed', 'failed')),
  sync_error TEXT,
  sync_frequency TEXT DEFAULT 'daily' CHECK (sync_frequency IN ('hourly', 'daily', 'weekly', 'manual')),
  auto_sync_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),

  CONSTRAINT unique_ga4_property_per_user UNIQUE (user_id, property_id)
);

-- ============================================
-- GOOGLE ANALYTICS 4 TRAFFIC DATA TABLE
-- ============================================
-- Stores traffic metrics from Google Analytics 4

CREATE TABLE public.ga4_traffic_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES ga4_properties(id) ON DELETE CASCADE,

  -- Dimensions
  date DATE NOT NULL,
  page_path TEXT,
  page_title TEXT,
  landing_page TEXT,
  source TEXT,
  medium TEXT,
  campaign TEXT,
  device_category TEXT CHECK (device_category IN ('desktop', 'mobile', 'tablet')),
  country TEXT,
  city TEXT,

  -- Traffic metrics
  sessions INTEGER DEFAULT 0,
  users INTEGER DEFAULT 0,
  new_users INTEGER DEFAULT 0,
  pageviews INTEGER DEFAULT 0,
  engaged_sessions INTEGER DEFAULT 0,

  -- Engagement metrics
  average_session_duration NUMERIC(10,2), -- in seconds
  bounce_rate NUMERIC(10,6), -- stored as decimal
  engagement_rate NUMERIC(10,6),
  events_per_session NUMERIC(10,2),

  -- Conversion metrics
  conversions INTEGER DEFAULT 0,
  conversion_rate NUMERIC(10,6),
  total_revenue NUMERIC(12,2),

  -- Change tracking
  sessions_change INTEGER,
  users_change INTEGER,
  pageviews_change INTEGER,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),

  CONSTRAINT unique_ga4_traffic_date UNIQUE (property_id, date, page_path, source, medium, device_category, country)
);

-- ============================================
-- BING WEBMASTER TOOLS OAUTH CREDENTIALS TABLE
-- ============================================
-- Stores OAuth credentials for Bing Webmaster Tools API

CREATE TABLE public.bing_webmaster_oauth_credentials (
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

  CONSTRAINT one_active_bing_credential_per_user UNIQUE (user_id, is_active)
);

-- ============================================
-- BING WEBMASTER SITES TABLE
-- ============================================
-- Stores Bing Webmaster Tools sites connected to the account

CREATE TABLE public.bing_webmaster_sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  credential_id UUID REFERENCES bing_webmaster_oauth_credentials(id) ON DELETE CASCADE,
  site_url TEXT NOT NULL,
  site_name TEXT,
  is_verified BOOLEAN DEFAULT false,
  is_primary BOOLEAN DEFAULT false,
  last_synced_at TIMESTAMP WITH TIME ZONE,
  sync_status TEXT DEFAULT 'pending' CHECK (sync_status IN ('pending', 'syncing', 'completed', 'failed')),
  sync_error TEXT,
  sync_frequency TEXT DEFAULT 'daily' CHECK (sync_frequency IN ('hourly', 'daily', 'weekly', 'manual')),
  auto_sync_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),

  CONSTRAINT unique_bing_site_per_user UNIQUE (user_id, site_url)
);

-- ============================================
-- BING WEBMASTER SEARCH DATA TABLE
-- ============================================
-- Stores search performance data from Bing Webmaster Tools

CREATE TABLE public.bing_webmaster_search_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES bing_webmaster_sites(id) ON DELETE CASCADE,

  -- Dimensions
  date DATE NOT NULL,
  query TEXT,
  page_url TEXT,
  country TEXT,
  device TEXT CHECK (device IN ('Desktop', 'Mobile', 'Tablet')),

  -- Performance metrics
  clicks INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  ctr NUMERIC(10,6), -- Click-through rate
  average_position NUMERIC(10,2),

  -- Change tracking
  clicks_change INTEGER,
  impressions_change INTEGER,
  ctr_change NUMERIC(10,6),
  position_change NUMERIC(10,2),

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),

  CONSTRAINT unique_bing_search_date UNIQUE (site_id, date, query, page_url, device, country)
);

-- ============================================
-- YANDEX WEBMASTER OAUTH CREDENTIALS TABLE
-- ============================================
-- Stores OAuth credentials for Yandex Webmaster API

CREATE TABLE public.yandex_webmaster_oauth_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_type TEXT DEFAULT 'Bearer',
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_refreshed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),

  CONSTRAINT one_active_yandex_credential_per_user UNIQUE (user_id, is_active)
);

-- ============================================
-- YANDEX WEBMASTER SITES TABLE
-- ============================================
-- Stores Yandex Webmaster sites connected to the account

CREATE TABLE public.yandex_webmaster_sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  credential_id UUID REFERENCES yandex_webmaster_oauth_credentials(id) ON DELETE CASCADE,
  host_id TEXT NOT NULL, -- Yandex host ID
  host_url TEXT NOT NULL,
  host_display_name TEXT,
  verification_state TEXT,
  is_primary BOOLEAN DEFAULT false,
  last_synced_at TIMESTAMP WITH TIME ZONE,
  sync_status TEXT DEFAULT 'pending' CHECK (sync_status IN ('pending', 'syncing', 'completed', 'failed')),
  sync_error TEXT,
  sync_frequency TEXT DEFAULT 'daily' CHECK (sync_frequency IN ('hourly', 'daily', 'weekly', 'manual')),
  auto_sync_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),

  CONSTRAINT unique_yandex_site_per_user UNIQUE (user_id, host_id)
);

-- ============================================
-- YANDEX WEBMASTER SEARCH DATA TABLE
-- ============================================
-- Stores search performance data from Yandex Webmaster

CREATE TABLE public.yandex_webmaster_search_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES yandex_webmaster_sites(id) ON DELETE CASCADE,

  -- Dimensions
  date DATE NOT NULL,
  query TEXT,
  page_url TEXT,
  device TEXT CHECK (device IN ('DESKTOP', 'MOBILE_AND_TABLET', 'ALL')),

  -- Performance metrics
  clicks INTEGER DEFAULT 0,
  shows INTEGER DEFAULT 0, -- Yandex uses "shows" instead of "impressions"
  ctr NUMERIC(10,6),
  position NUMERIC(10,2),

  -- Change tracking
  clicks_change INTEGER,
  shows_change INTEGER,
  ctr_change NUMERIC(10,6),
  position_change NUMERIC(10,2),

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),

  CONSTRAINT unique_yandex_search_date UNIQUE (site_id, date, query, page_url, device)
);

-- ============================================
-- UNIFIED SEARCH ANALYTICS VIEW
-- ============================================
-- Aggregated view combining all search platforms

CREATE TABLE public.unified_search_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Source identification
  source_platform TEXT NOT NULL CHECK (source_platform IN ('google_search_console', 'google_analytics', 'bing_webmaster', 'yandex_webmaster')),
  source_property_id UUID, -- Reference to the source property/site

  -- Dimensions
  date DATE NOT NULL,
  page_url TEXT,
  page_title TEXT,
  query TEXT,
  country TEXT,
  device TEXT,

  -- Normalized metrics (standardized across platforms)
  clicks INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0, -- shows for Yandex
  sessions INTEGER DEFAULT 0, -- GA4 only
  users INTEGER DEFAULT 0, -- GA4 only
  pageviews INTEGER DEFAULT 0, -- GA4 only
  ctr NUMERIC(10,6),
  average_position NUMERIC(10,2),
  bounce_rate NUMERIC(10,6), -- GA4 only
  engagement_rate NUMERIC(10,6), -- GA4 only

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),

  CONSTRAINT unique_unified_analytics UNIQUE (user_id, source_platform, date, page_url, query, device, country)
);

-- ============================================
-- DASHBOARD CONFIGURATION TABLE
-- ============================================
-- Stores user preferences for dashboard display

CREATE TABLE public.search_dashboard_config (
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
CREATE INDEX idx_ga4_oauth_user_id ON public.ga4_oauth_credentials(user_id);
CREATE INDEX idx_ga4_oauth_active ON public.ga4_oauth_credentials(is_active) WHERE is_active = true;
CREATE INDEX idx_ga4_oauth_expires_at ON public.ga4_oauth_credentials(expires_at);

-- GA4 Properties indexes
CREATE INDEX idx_ga4_properties_user_id ON public.ga4_properties(user_id);
CREATE INDEX idx_ga4_properties_property_id ON public.ga4_properties(property_id);
CREATE INDEX idx_ga4_properties_sync_status ON public.ga4_properties(sync_status);

-- GA4 Traffic Data indexes
CREATE INDEX idx_ga4_traffic_property_id ON public.ga4_traffic_data(property_id);
CREATE INDEX idx_ga4_traffic_date ON public.ga4_traffic_data(date DESC);
CREATE INDEX idx_ga4_traffic_page_path ON public.ga4_traffic_data(page_path);
CREATE INDEX idx_ga4_traffic_source ON public.ga4_traffic_data(source);
CREATE INDEX idx_ga4_traffic_device ON public.ga4_traffic_data(device_category);

-- Bing OAuth Credentials indexes
CREATE INDEX idx_bing_oauth_user_id ON public.bing_webmaster_oauth_credentials(user_id);
CREATE INDEX idx_bing_oauth_active ON public.bing_webmaster_oauth_credentials(is_active) WHERE is_active = true;
CREATE INDEX idx_bing_oauth_expires_at ON public.bing_webmaster_oauth_credentials(expires_at);

-- Bing Sites indexes
CREATE INDEX idx_bing_sites_user_id ON public.bing_webmaster_sites(user_id);
CREATE INDEX idx_bing_sites_url ON public.bing_webmaster_sites(site_url);
CREATE INDEX idx_bing_sites_sync_status ON public.bing_webmaster_sites(sync_status);

-- Bing Search Data indexes
CREATE INDEX idx_bing_search_site_id ON public.bing_webmaster_search_data(site_id);
CREATE INDEX idx_bing_search_date ON public.bing_webmaster_search_data(date DESC);
CREATE INDEX idx_bing_search_query ON public.bing_webmaster_search_data(query);
CREATE INDEX idx_bing_search_page ON public.bing_webmaster_search_data(page_url);

-- Yandex OAuth Credentials indexes
CREATE INDEX idx_yandex_oauth_user_id ON public.yandex_webmaster_oauth_credentials(user_id);
CREATE INDEX idx_yandex_oauth_active ON public.yandex_webmaster_oauth_credentials(is_active) WHERE is_active = true;
CREATE INDEX idx_yandex_oauth_expires_at ON public.yandex_webmaster_oauth_credentials(expires_at);

-- Yandex Sites indexes
CREATE INDEX idx_yandex_sites_user_id ON public.yandex_webmaster_sites(user_id);
CREATE INDEX idx_yandex_sites_host_id ON public.yandex_webmaster_sites(host_id);
CREATE INDEX idx_yandex_sites_sync_status ON public.yandex_webmaster_sites(sync_status);

-- Yandex Search Data indexes
CREATE INDEX idx_yandex_search_site_id ON public.yandex_webmaster_search_data(site_id);
CREATE INDEX idx_yandex_search_date ON public.yandex_webmaster_search_data(date DESC);
CREATE INDEX idx_yandex_search_query ON public.yandex_webmaster_search_data(query);
CREATE INDEX idx_yandex_search_page ON public.yandex_webmaster_search_data(page_url);

-- Unified Analytics indexes
CREATE INDEX idx_unified_user_id ON public.unified_search_analytics(user_id);
CREATE INDEX idx_unified_platform ON public.unified_search_analytics(source_platform);
CREATE INDEX idx_unified_date ON public.unified_search_analytics(date DESC);
CREATE INDEX idx_unified_page ON public.unified_search_analytics(page_url);
CREATE INDEX idx_unified_query ON public.unified_search_analytics(query);
CREATE INDEX idx_unified_composite ON public.unified_search_analytics(user_id, date DESC, source_platform);

-- Dashboard Config indexes
CREATE INDEX idx_dashboard_config_user_id ON public.search_dashboard_config(user_id);

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
CREATE POLICY "Users can manage their own GA4 credentials"
ON public.ga4_oauth_credentials FOR ALL
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all GA4 credentials"
ON public.ga4_oauth_credentials FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- GA4 Properties policies
CREATE POLICY "Users can manage their own GA4 properties"
ON public.ga4_properties FOR ALL
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all GA4 properties"
ON public.ga4_properties FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- GA4 Traffic Data policies
CREATE POLICY "Users can view their own GA4 traffic data"
ON public.ga4_traffic_data FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.ga4_properties
    WHERE ga4_properties.id = ga4_traffic_data.property_id
    AND ga4_properties.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all GA4 traffic data"
ON public.ga4_traffic_data FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Bing OAuth Credentials policies
CREATE POLICY "Users can manage their own Bing credentials"
ON public.bing_webmaster_oauth_credentials FOR ALL
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all Bing credentials"
ON public.bing_webmaster_oauth_credentials FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Bing Sites policies
CREATE POLICY "Users can manage their own Bing sites"
ON public.bing_webmaster_sites FOR ALL
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all Bing sites"
ON public.bing_webmaster_sites FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Bing Search Data policies
CREATE POLICY "Users can view their own Bing search data"
ON public.bing_webmaster_search_data FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.bing_webmaster_sites
    WHERE bing_webmaster_sites.id = bing_webmaster_search_data.site_id
    AND bing_webmaster_sites.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all Bing search data"
ON public.bing_webmaster_search_data FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Yandex OAuth Credentials policies
CREATE POLICY "Users can manage their own Yandex credentials"
ON public.yandex_webmaster_oauth_credentials FOR ALL
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all Yandex credentials"
ON public.yandex_webmaster_oauth_credentials FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Yandex Sites policies
CREATE POLICY "Users can manage their own Yandex sites"
ON public.yandex_webmaster_sites FOR ALL
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all Yandex sites"
ON public.yandex_webmaster_sites FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Yandex Search Data policies
CREATE POLICY "Users can view their own Yandex search data"
ON public.yandex_webmaster_search_data FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.yandex_webmaster_sites
    WHERE yandex_webmaster_sites.id = yandex_webmaster_search_data.site_id
    AND yandex_webmaster_sites.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all Yandex search data"
ON public.yandex_webmaster_search_data FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Unified Analytics policies
CREATE POLICY "Users can view their own unified analytics"
ON public.unified_search_analytics FOR ALL
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all unified analytics"
ON public.unified_search_analytics FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Dashboard Config policies
CREATE POLICY "Users can manage their own dashboard config"
ON public.search_dashboard_config FOR ALL
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all dashboard configs"
ON public.search_dashboard_config FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================

CREATE TRIGGER update_ga4_oauth_credentials_updated_at
BEFORE UPDATE ON public.ga4_oauth_credentials
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ga4_properties_updated_at
BEFORE UPDATE ON public.ga4_properties
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bing_oauth_credentials_updated_at
BEFORE UPDATE ON public.bing_webmaster_oauth_credentials
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bing_sites_updated_at
BEFORE UPDATE ON public.bing_webmaster_sites
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_yandex_oauth_credentials_updated_at
BEFORE UPDATE ON public.yandex_webmaster_oauth_credentials
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_yandex_sites_updated_at
BEFORE UPDATE ON public.yandex_webmaster_sites
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_unified_analytics_updated_at
BEFORE UPDATE ON public.unified_search_analytics
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

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
