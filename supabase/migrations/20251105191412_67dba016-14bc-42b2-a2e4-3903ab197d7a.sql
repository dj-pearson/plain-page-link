-- Migration 2: Google Search Console Integration
-- Tables: gsc_oauth_credentials, gsc_properties, gsc_keyword_performance, gsc_page_performance

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

CREATE TABLE public.gsc_keyword_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES gsc_properties(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  url TEXT,
  country TEXT,
  device TEXT CHECK (device IN ('DESKTOP', 'MOBILE', 'TABLET')),
  search_type TEXT DEFAULT 'web' CHECK (search_type IN ('web', 'image', 'video', 'news')),
  clicks INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  ctr NUMERIC(10,6),
  position NUMERIC(10,2),
  date DATE NOT NULL,
  clicks_change INTEGER,
  impressions_change INTEGER,
  ctr_change NUMERIC(10,6),
  position_change NUMERIC(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT unique_gsc_keyword_date UNIQUE (property_id, query, url, date, device, country)
);

CREATE TABLE public.gsc_page_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES gsc_properties(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  country TEXT,
  device TEXT CHECK (device IN ('DESKTOP', 'MOBILE', 'TABLET')),
  search_type TEXT DEFAULT 'web' CHECK (search_type IN ('web', 'image', 'video', 'news')),
  clicks INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  ctr NUMERIC(10,6),
  position NUMERIC(10,2),
  top_queries JSONB DEFAULT '[]',
  date DATE NOT NULL,
  page_title TEXT,
  page_description TEXT,
  clicks_change INTEGER,
  impressions_change INTEGER,
  ctr_change NUMERIC(10,6),
  position_change NUMERIC(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT unique_gsc_page_date UNIQUE (property_id, url, date, device, country)
);

-- Indexes
CREATE INDEX idx_gsc_oauth_user_id ON public.gsc_oauth_credentials(user_id);
CREATE INDEX idx_gsc_oauth_active ON public.gsc_oauth_credentials(is_active) WHERE is_active = true;
CREATE INDEX idx_gsc_properties_user_id ON public.gsc_properties(user_id);
CREATE INDEX idx_gsc_keyword_property_id ON public.gsc_keyword_performance(property_id);
CREATE INDEX idx_gsc_keyword_query ON public.gsc_keyword_performance(query);
CREATE INDEX idx_gsc_keyword_date ON public.gsc_keyword_performance(date DESC);
CREATE INDEX idx_gsc_page_property_id ON public.gsc_page_performance(property_id);
CREATE INDEX idx_gsc_page_url ON public.gsc_page_performance(url);
CREATE INDEX idx_gsc_page_date ON public.gsc_page_performance(date DESC);

-- RLS
ALTER TABLE public.gsc_oauth_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gsc_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gsc_keyword_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gsc_page_performance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own GSC credentials"
ON public.gsc_oauth_credentials FOR ALL
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own GSC properties"
ON public.gsc_properties FOR ALL
USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own GSC keyword data"
ON public.gsc_keyword_performance FOR SELECT
USING (EXISTS (SELECT 1 FROM public.gsc_properties WHERE gsc_properties.id = gsc_keyword_performance.property_id AND gsc_properties.user_id = auth.uid()));

CREATE POLICY "Users can view their own GSC page data"
ON public.gsc_page_performance FOR SELECT
USING (EXISTS (SELECT 1 FROM public.gsc_properties WHERE gsc_properties.id = gsc_page_performance.property_id AND gsc_properties.user_id = auth.uid()));

CREATE TRIGGER update_gsc_oauth_credentials_updated_at
BEFORE UPDATE ON public.gsc_oauth_credentials
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_gsc_properties_updated_at
BEFORE UPDATE ON public.gsc_properties
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();