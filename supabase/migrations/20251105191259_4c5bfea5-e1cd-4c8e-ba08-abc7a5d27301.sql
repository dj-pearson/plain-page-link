-- ============================================
-- SEO MANAGEMENT SYSTEM - CORE TABLES
-- ============================================
-- Migration 1 of 6: Core SEO Management Tables
-- Tables: seo_settings, seo_audit_history, seo_fixes_applied, seo_keywords, seo_keyword_history

-- ============================================
-- SEO SETTINGS TABLE
-- ============================================
-- Stores global SEO configuration and meta tags

CREATE TABLE public.seo_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_url TEXT NOT NULL,
  site_name TEXT,
  default_title TEXT,
  default_description TEXT,
  default_keywords TEXT[],
  default_author TEXT,
  default_og_image TEXT,
  robots_txt TEXT,
  llms_txt TEXT,
  sitemap_enabled BOOLEAN DEFAULT true,
  sitemap_frequency TEXT DEFAULT 'weekly' CHECK (sitemap_frequency IN ('always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never')),
  sitemap_priority NUMERIC(2,1) DEFAULT 0.5 CHECK (sitemap_priority >= 0 AND sitemap_priority <= 1),
  google_site_verification TEXT,
  bing_site_verification TEXT,
  google_analytics_id TEXT,
  google_tag_manager_id TEXT,
  favicon_url TEXT,
  apple_touch_icon_url TEXT,
  manifest_url TEXT,
  canonical_url_override TEXT,
  language TEXT DEFAULT 'en',
  region TEXT,
  additional_meta_tags JSONB DEFAULT '{}',
  schema_org_data JSONB DEFAULT '{}',
  social_profiles JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- ============================================
-- SEO AUDIT HISTORY TABLE
-- ============================================
-- Stores comprehensive SEO audit results

CREATE TABLE public.seo_audit_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  audit_type TEXT DEFAULT 'full' CHECK (audit_type IN ('full', 'quick', 'technical', 'content', 'performance')),
  overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
  performance_score INTEGER CHECK (performance_score >= 0 AND performance_score <= 100),
  seo_score INTEGER CHECK (seo_score >= 0 AND seo_score <= 100),
  accessibility_score INTEGER CHECK (accessibility_score >= 0 AND accessibility_score <= 100),
  best_practices_score INTEGER CHECK (best_practices_score >= 0 AND best_practices_score <= 100),

  -- Meta tags analysis
  has_title BOOLEAN DEFAULT false,
  title_length INTEGER,
  has_description BOOLEAN DEFAULT false,
  description_length INTEGER,
  has_keywords BOOLEAN DEFAULT false,
  has_canonical BOOLEAN DEFAULT false,
  has_og_tags BOOLEAN DEFAULT false,
  has_twitter_cards BOOLEAN DEFAULT false,

  -- Technical SEO
  has_robots_txt BOOLEAN DEFAULT false,
  has_sitemap BOOLEAN DEFAULT false,
  has_ssl BOOLEAN DEFAULT false,
  has_favicon BOOLEAN DEFAULT false,
  mobile_friendly BOOLEAN DEFAULT false,
  page_load_time NUMERIC(10,2),

  -- Content analysis
  word_count INTEGER,
  heading_structure JSONB DEFAULT '{}',
  internal_links_count INTEGER DEFAULT 0,
  external_links_count INTEGER DEFAULT 0,
  broken_links_count INTEGER DEFAULT 0,
  images_count INTEGER DEFAULT 0,
  images_with_alt_count INTEGER DEFAULT 0,

  -- Issues found
  critical_issues JSONB DEFAULT '[]',
  warnings JSONB DEFAULT '[]',
  recommendations JSONB DEFAULT '[]',

  -- Full audit data
  raw_audit_data JSONB DEFAULT '{}',

  -- Metadata
  audit_duration_ms INTEGER,
  performed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================
-- SEO FIXES APPLIED TABLE
-- ============================================
-- Tracks SEO improvements and fixes applied

CREATE TABLE public.seo_fixes_applied (
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

CREATE TABLE public.seo_keywords (
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
  ctr NUMERIC(5,2),
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  avg_position NUMERIC(5,2),
  visibility_score INTEGER,

  -- Status and tracking
  is_active BOOLEAN DEFAULT true,
  is_ranking BOOLEAN DEFAULT false,
  first_ranked_at TIMESTAMP WITH TIME ZONE,
  last_checked_at TIMESTAMP WITH TIME ZONE,
  last_position_change_at TIMESTAMP WITH TIME ZONE,

  -- Metadata
  notes TEXT,
  tags TEXT[] DEFAULT '{}',
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- ============================================
-- SEO KEYWORD HISTORY TABLE
-- ============================================
-- Tracks keyword position changes over time

CREATE TABLE public.seo_keyword_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword_id UUID NOT NULL REFERENCES seo_keywords(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  position INTEGER,
  search_volume INTEGER,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  ctr NUMERIC(5,2),
  visibility_score INTEGER,
  url TEXT,
  device TEXT DEFAULT 'desktop' CHECK (device IN ('desktop', 'mobile', 'tablet')),
  location TEXT DEFAULT 'global',
  search_engine TEXT DEFAULT 'google' CHECK (search_engine IN ('google', 'bing', 'yahoo', 'duckduckgo')),
  data_source TEXT DEFAULT 'manual' CHECK (data_source IN ('manual', 'gsc', 'serpapi', 'ahrefs', 'moz', 'semrush')),
  checked_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- SEO Settings indexes
CREATE INDEX idx_seo_settings_site_url ON public.seo_settings(site_url);

-- Audit History indexes
CREATE INDEX idx_seo_audit_url ON public.seo_audit_history(url);
CREATE INDEX idx_seo_audit_created_at ON public.seo_audit_history(created_at DESC);
CREATE INDEX idx_seo_audit_type ON public.seo_audit_history(audit_type);
CREATE INDEX idx_seo_audit_score ON public.seo_audit_history(overall_score DESC);

-- Fixes Applied indexes
CREATE INDEX idx_seo_fixes_audit_id ON public.seo_fixes_applied(audit_id);
CREATE INDEX idx_seo_fixes_url ON public.seo_fixes_applied(url);
CREATE INDEX idx_seo_fixes_status ON public.seo_fixes_applied(status);
CREATE INDEX idx_seo_fixes_type ON public.seo_fixes_applied(fix_type);
CREATE INDEX idx_seo_fixes_created_at ON public.seo_fixes_applied(created_at DESC);

-- Keywords indexes
CREATE INDEX idx_seo_keywords_keyword ON public.seo_keywords(keyword);
CREATE INDEX idx_seo_keywords_url ON public.seo_keywords(target_url);
CREATE INDEX idx_seo_keywords_active ON public.seo_keywords(is_active) WHERE is_active = true;
CREATE INDEX idx_seo_keywords_ranking ON public.seo_keywords(is_ranking) WHERE is_ranking = true;
CREATE INDEX idx_seo_keywords_position ON public.seo_keywords(current_position);
CREATE INDEX idx_seo_keywords_category ON public.seo_keywords(category);
CREATE INDEX idx_seo_keywords_priority ON public.seo_keywords(priority DESC);

-- Keyword History indexes
CREATE INDEX idx_seo_keyword_history_keyword_id ON public.seo_keyword_history(keyword_id);
CREATE INDEX idx_seo_keyword_history_recorded_at ON public.seo_keyword_history(recorded_at DESC);
CREATE INDEX idx_seo_keyword_history_search_engine ON public.seo_keyword_history(search_engine);

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
CREATE POLICY "Admins can manage SEO settings"
ON public.seo_settings FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Public can view SEO settings"
ON public.seo_settings FOR SELECT
USING (true);

-- Audit History policies
CREATE POLICY "Admins can manage audit history"
ON public.seo_audit_history FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own audits"
ON public.seo_audit_history FOR SELECT
USING (auth.uid() = performed_by OR public.has_role(auth.uid(), 'admin'::app_role));

-- Fixes Applied policies
CREATE POLICY "Admins can manage SEO fixes"
ON public.seo_fixes_applied FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own fixes"
ON public.seo_fixes_applied FOR SELECT
USING (auth.uid() = applied_by OR public.has_role(auth.uid(), 'admin'::app_role));

-- Keywords policies
CREATE POLICY "Admins can manage SEO keywords"
ON public.seo_keywords FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Public can view active keywords"
ON public.seo_keywords FOR SELECT
USING (is_active = true);

-- Keyword History policies
CREATE POLICY "Admins can manage keyword history"
ON public.seo_keyword_history FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Public can view keyword history"
ON public.seo_keyword_history FOR SELECT
USING (true);

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================

CREATE TRIGGER update_seo_settings_updated_at
BEFORE UPDATE ON public.seo_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_seo_fixes_applied_updated_at
BEFORE UPDATE ON public.seo_fixes_applied
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

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