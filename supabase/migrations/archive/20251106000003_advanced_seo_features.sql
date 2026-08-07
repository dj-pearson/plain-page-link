-- ============================================
-- SEO MANAGEMENT SYSTEM - ADVANCED SEO FEATURES
-- ============================================
-- Migration 4 of 6: Advanced SEO Features
-- Tables: seo_competitor_analysis, seo_page_scores, seo_core_web_vitals, seo_crawl_results

-- ============================================
-- SEO COMPETITOR ANALYSIS TABLE
-- ============================================
-- Stores competitor SEO analysis data

CREATE TABLE public.seo_competitor_analysis (
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

CREATE TABLE public.seo_page_scores (
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

CREATE TABLE public.seo_core_web_vitals (
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

CREATE TABLE public.seo_crawl_results (
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
CREATE INDEX idx_seo_competitor_domain ON public.seo_competitor_analysis(competitor_domain);
CREATE INDEX idx_seo_competitor_our_domain ON public.seo_competitor_analysis(our_domain);
CREATE INDEX idx_seo_competitor_date ON public.seo_competitor_analysis(analysis_date DESC);

-- Page Scores indexes
CREATE INDEX idx_seo_page_scores_url ON public.seo_page_scores(url);
CREATE INDEX idx_seo_page_scores_overall ON public.seo_page_scores(overall_score DESC);
CREATE INDEX idx_seo_page_scores_type ON public.seo_page_scores(page_type);
CREATE INDEX idx_seo_page_scores_scored_at ON public.seo_page_scores(last_scored_at DESC);

-- Core Web Vitals indexes
CREATE INDEX idx_seo_cwv_url ON public.seo_core_web_vitals(url);
CREATE INDEX idx_seo_cwv_device ON public.seo_core_web_vitals(device);
CREATE INDEX idx_seo_cwv_measured_at ON public.seo_core_web_vitals(measured_at DESC);
CREATE INDEX idx_seo_cwv_performance_score ON public.seo_core_web_vitals(performance_score DESC);
CREATE INDEX idx_seo_cwv_lcp_pass ON public.seo_core_web_vitals(lcp_pass);

-- Crawl Results indexes
CREATE INDEX idx_seo_crawl_session_id ON public.seo_crawl_results(crawl_session_id);
CREATE INDEX idx_seo_crawl_url ON public.seo_crawl_results(url);
CREATE INDEX idx_seo_crawl_status ON public.seo_crawl_results(status_code);
CREATE INDEX idx_seo_crawl_parent_url ON public.seo_crawl_results(parent_url);
CREATE INDEX idx_seo_crawl_date ON public.seo_crawl_results(crawled_at DESC);
CREATE INDEX idx_seo_crawl_content_hash ON public.seo_crawl_results(content_hash);
CREATE INDEX idx_seo_crawl_broken_links ON public.seo_crawl_results(broken_links) WHERE broken_links > 0;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.seo_competitor_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_page_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_core_web_vitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_crawl_results ENABLE ROW LEVEL SECURITY;

-- Competitor Analysis policies
CREATE POLICY "Admins can manage competitor analysis"
ON public.seo_competitor_analysis FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can view competitor analysis"
ON public.seo_competitor_analysis FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Page Scores policies
CREATE POLICY "Admins can manage page scores"
ON public.seo_page_scores FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can view page scores"
ON public.seo_page_scores FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Core Web Vitals policies
CREATE POLICY "Admins can manage core web vitals"
ON public.seo_core_web_vitals FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Public can view core web vitals"
ON public.seo_core_web_vitals FOR SELECT
USING (true);

-- Crawl Results policies
CREATE POLICY "Admins can manage crawl results"
ON public.seo_crawl_results FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can view crawl results"
ON public.seo_crawl_results FOR SELECT
USING (auth.uid() IS NOT NULL);

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================

CREATE TRIGGER update_seo_competitor_updated_at
BEFORE UPDATE ON public.seo_competitor_analysis
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

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

-- Function to find duplicate content
CREATE OR REPLACE FUNCTION public.find_duplicate_content()
RETURNS TABLE (
  content_hash TEXT,
  url_count BIGINT,
  urls TEXT[]
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    content_hash,
    COUNT(*)::BIGINT as url_count,
    ARRAY_AGG(url) as urls
  FROM public.seo_crawl_results
  WHERE content_hash IS NOT NULL
  GROUP BY content_hash
  HAVING COUNT(*) > 1
  ORDER BY url_count DESC;
$$;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE public.seo_competitor_analysis IS 'Competitor SEO analysis and comparison data';
COMMENT ON TABLE public.seo_page_scores IS 'Individual page SEO scores and metrics';
COMMENT ON TABLE public.seo_core_web_vitals IS 'Core Web Vitals metrics for pages';
COMMENT ON TABLE public.seo_crawl_results IS 'Results from automated site crawls';

COMMENT ON FUNCTION public.get_average_page_score IS 'Get average page score for the last 30 days';
COMMENT ON FUNCTION public.get_failing_cwv_pages IS 'Get pages failing Core Web Vitals checks';
COMMENT ON FUNCTION public.find_duplicate_content IS 'Find pages with duplicate content based on content hash';
