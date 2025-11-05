-- ============================================
-- SEO MANAGEMENT SYSTEM - GOOGLE SEARCH CONSOLE
-- ============================================
-- Migration 2 of 6: Google Search Console Integration
-- Tables: gsc_oauth_credentials, gsc_properties, gsc_keyword_performance, gsc_page_performance

-- ============================================
-- GSC OAUTH CREDENTIALS TABLE
-- ============================================
-- Stores encrypted OAuth credentials for Google Search Console API access

CREATE TABLE public.gsc_oauth_credentials (
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

CREATE TABLE public.gsc_properties (
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

CREATE TABLE public.gsc_keyword_performance (
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

CREATE TABLE public.gsc_page_performance (
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
CREATE INDEX idx_gsc_oauth_user_id ON public.gsc_oauth_credentials(user_id);
CREATE INDEX idx_gsc_oauth_active ON public.gsc_oauth_credentials(is_active) WHERE is_active = true;
CREATE INDEX idx_gsc_oauth_expires_at ON public.gsc_oauth_credentials(expires_at);

-- Properties indexes
CREATE INDEX idx_gsc_properties_user_id ON public.gsc_properties(user_id);
CREATE INDEX idx_gsc_properties_url ON public.gsc_properties(property_url);
CREATE INDEX idx_gsc_properties_primary ON public.gsc_properties(is_primary) WHERE is_primary = true;
CREATE INDEX idx_gsc_properties_sync_status ON public.gsc_properties(sync_status);
CREATE INDEX idx_gsc_properties_last_synced ON public.gsc_properties(last_synced_at DESC);

-- Keyword Performance indexes
CREATE INDEX idx_gsc_keyword_property_id ON public.gsc_keyword_performance(property_id);
CREATE INDEX idx_gsc_keyword_query ON public.gsc_keyword_performance(query);
CREATE INDEX idx_gsc_keyword_url ON public.gsc_keyword_performance(url);
CREATE INDEX idx_gsc_keyword_date ON public.gsc_keyword_performance(date DESC);
CREATE INDEX idx_gsc_keyword_clicks ON public.gsc_keyword_performance(clicks DESC);
CREATE INDEX idx_gsc_keyword_impressions ON public.gsc_keyword_performance(impressions DESC);
CREATE INDEX idx_gsc_keyword_position ON public.gsc_keyword_performance(position);
CREATE INDEX idx_gsc_keyword_device ON public.gsc_keyword_performance(device);
CREATE INDEX idx_gsc_keyword_country ON public.gsc_keyword_performance(country);

-- Page Performance indexes
CREATE INDEX idx_gsc_page_property_id ON public.gsc_page_performance(property_id);
CREATE INDEX idx_gsc_page_url ON public.gsc_page_performance(url);
CREATE INDEX idx_gsc_page_date ON public.gsc_page_performance(date DESC);
CREATE INDEX idx_gsc_page_clicks ON public.gsc_page_performance(clicks DESC);
CREATE INDEX idx_gsc_page_impressions ON public.gsc_page_performance(impressions DESC);
CREATE INDEX idx_gsc_page_position ON public.gsc_page_performance(position);
CREATE INDEX idx_gsc_page_device ON public.gsc_page_performance(device);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.gsc_oauth_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gsc_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gsc_keyword_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gsc_page_performance ENABLE ROW LEVEL SECURITY;

-- OAuth Credentials policies (User-specific + Admin)
CREATE POLICY "Users can manage their own GSC credentials"
ON public.gsc_oauth_credentials FOR ALL
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all GSC credentials"
ON public.gsc_oauth_credentials FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Properties policies
CREATE POLICY "Users can manage their own GSC properties"
ON public.gsc_properties FOR ALL
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all GSC properties"
ON public.gsc_properties FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Keyword Performance policies
CREATE POLICY "Users can view their own GSC keyword data"
ON public.gsc_keyword_performance FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.gsc_properties
    WHERE gsc_properties.id = gsc_keyword_performance.property_id
    AND gsc_properties.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all GSC keyword data"
ON public.gsc_keyword_performance FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Page Performance policies
CREATE POLICY "Users can view their own GSC page data"
ON public.gsc_page_performance FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.gsc_properties
    WHERE gsc_properties.id = gsc_page_performance.property_id
    AND gsc_properties.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all GSC page data"
ON public.gsc_page_performance FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================

CREATE TRIGGER update_gsc_oauth_credentials_updated_at
BEFORE UPDATE ON public.gsc_oauth_credentials
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

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
