
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
-- ============================================
-- SEO MANAGEMENT SYSTEM - ENTERPRISE SEO FEATURES
-- ============================================
-- Migration 5 of 6: Enterprise SEO Features
-- Tables: seo_image_analysis, seo_redirect_analysis, seo_duplicate_content,
--         seo_security_analysis, seo_link_analysis, seo_structured_data,
--         seo_mobile_analysis, seo_performance_budget

-- ============================================
-- SEO IMAGE ANALYSIS TABLE
-- ============================================
-- Analyzes images for SEO optimization

CREATE TABLE IF NOT EXISTS public.seo_image_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  page_url TEXT NOT NULL,
  image_src TEXT NOT NULL,

  -- Image properties
  file_name TEXT,
  file_size_kb INTEGER,
  file_format TEXT,
  width INTEGER,
  height INTEGER,
  aspect_ratio TEXT,

  -- SEO attributes
  alt_text TEXT,
  alt_text_length INTEGER,
  title_attribute TEXT,
  has_alt BOOLEAN DEFAULT false,
  has_title BOOLEAN DEFAULT false,
  has_caption BOOLEAN DEFAULT false,

  -- Optimization
  is_optimized BOOLEAN DEFAULT false,
  optimization_score INTEGER CHECK (optimization_score >= 0 AND optimization_score <= 100),
  compression_ratio NUMERIC(5,2),
  potential_savings_kb INTEGER,

  -- Format recommendations
  recommended_format TEXT,
  supports_lazy_loading BOOLEAN DEFAULT false,
  is_lazy_loaded BOOLEAN DEFAULT false,
  has_srcset BOOLEAN DEFAULT false,
  is_responsive BOOLEAN DEFAULT false,

  -- Issues
  issues JSONB DEFAULT '[]',
  /*
  Example:
  [
    {"type": "missing_alt", "severity": "high"},
    {"type": "oversized", "severity": "medium", "details": "Image is 500KB, recommend < 100KB"},
    {"type": "wrong_format", "severity": "low", "recommendation": "Use WebP"}
  ]
  */

  -- Metadata
  analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================
-- SEO REDIRECT ANALYSIS TABLE
-- ============================================
-- Tracks and analyzes redirects

CREATE TABLE IF NOT EXISTS public.seo_redirect_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_url TEXT NOT NULL,
  final_url TEXT NOT NULL,

  -- Redirect chain
  redirect_chain JSONB NOT NULL DEFAULT '[]',
  /*
  Example:
  [
    {"url": "http://example.com", "status": 301, "location": "https://example.com"},
    {"url": "https://example.com", "status": 301, "location": "https://www.example.com"},
    {"url": "https://www.example.com", "status": 200}
  ]
  */
  chain_length INTEGER DEFAULT 0,

  -- Redirect details
  redirect_type INTEGER, -- 301, 302, 307, 308
  is_permanent BOOLEAN,
  is_chain BOOLEAN DEFAULT false, -- More than one redirect

  -- Performance impact
  total_time_ms INTEGER,
  time_per_hop_ms INTEGER,

  -- Issues
  has_issues BOOLEAN DEFAULT false,
  issues JSONB DEFAULT '[]',
  /*
  Example issues:
  [
    {"type": "redirect_chain", "severity": "medium", "details": "3 redirects in chain"},
    {"type": "mixed_redirects", "severity": "high", "details": "Mix of 301 and 302"},
    {"type": "redirect_loop", "severity": "critical"}
  ]
  */

  -- Recommendations
  recommended_action TEXT,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'critical')),

  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'fixed', 'ignored')),
  fixed_at TIMESTAMP WITH TIME ZONE,

  -- Metadata
  last_checked_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================
-- SEO DUPLICATE CONTENT TABLE
-- ============================================
-- Detects and tracks duplicate content

CREATE TABLE IF NOT EXISTS public.seo_duplicate_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_hash TEXT NOT NULL,
  content_snippet TEXT,

  -- Affected URLs
  urls JSONB NOT NULL DEFAULT '[]',
  url_count INTEGER DEFAULT 0,
  primary_url TEXT, -- Canonical/preferred URL

  -- Similarity analysis
  similarity_score NUMERIC(5,2), -- Percentage similarity
  duplicate_type TEXT CHECK (duplicate_type IN (
    'exact', 'near_duplicate', 'partial', 'thin_content', 'scraped'
  )),

  -- Content details
  word_count INTEGER,
  title_duplicate BOOLEAN DEFAULT false,
  description_duplicate BOOLEAN DEFAULT false,
  h1_duplicate BOOLEAN DEFAULT false,

  -- Impact
  impact_level TEXT CHECK (impact_level IN ('low', 'medium', 'high', 'critical')),
  affects_rankings BOOLEAN DEFAULT false,

  -- Resolution
  status TEXT DEFAULT 'detected' CHECK (status IN ('detected', 'reviewed', 'resolved', 'ignored')),
  resolution_method TEXT CHECK (resolution_method IN (
    'canonical_tag', 'noindex', 'redirect', 'content_consolidation', 'content_rewrite', 'other'
  )),
  resolution_notes TEXT,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES auth.users(id),

  -- Metadata
  first_detected_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_checked_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================
-- SEO SECURITY ANALYSIS TABLE
-- ============================================
-- Analyzes security headers and configurations

CREATE TABLE IF NOT EXISTS public.seo_security_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,

  -- HTTPS/SSL
  has_ssl BOOLEAN DEFAULT false,
  ssl_valid BOOLEAN DEFAULT false,
  ssl_expiry_date TIMESTAMP WITH TIME ZONE,
  ssl_issuer TEXT,
  mixed_content_issues INTEGER DEFAULT 0,

  -- Security headers
  has_hsts BOOLEAN DEFAULT false,
  hsts_max_age INTEGER,
  has_csp BOOLEAN DEFAULT false,
  csp_policy TEXT,
  has_x_frame_options BOOLEAN DEFAULT false,
  x_frame_options TEXT,
  has_x_content_type_options BOOLEAN DEFAULT false,
  has_referrer_policy BOOLEAN DEFAULT false,
  referrer_policy TEXT,
  has_permissions_policy BOOLEAN DEFAULT false,

  -- Security score
  security_score INTEGER CHECK (security_score >= 0 AND security_score <= 100),
  security_grade TEXT CHECK (security_grade IN ('A+', 'A', 'B', 'C', 'D', 'F')),

  -- Vulnerabilities
  vulnerabilities JSONB DEFAULT '[]',
  /*
  Example:
  [
    {"type": "missing_hsts", "severity": "high", "recommendation": "Add Strict-Transport-Security header"},
    {"type": "weak_csp", "severity": "medium"},
    {"type": "clickjacking_risk", "severity": "high", "recommendation": "Add X-Frame-Options: DENY"}
  ]
  */

  -- Cookie security
  secure_cookies BOOLEAN DEFAULT false,
  httponly_cookies BOOLEAN DEFAULT false,
  samesite_cookies TEXT,

  -- Status
  critical_issues INTEGER DEFAULT 0,
  warnings INTEGER DEFAULT 0,
  passed_checks INTEGER DEFAULT 0,
  total_checks INTEGER DEFAULT 0,

  -- Metadata
  scanned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================
-- SEO LINK ANALYSIS TABLE
-- ============================================
-- Analyzes internal and external link structure

CREATE TABLE IF NOT EXISTS public.seo_link_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_url TEXT NOT NULL,

  -- Link counts
  total_links INTEGER DEFAULT 0,
  internal_links INTEGER DEFAULT 0,
  external_links INTEGER DEFAULT 0,
  broken_links INTEGER DEFAULT 0,
  redirect_links INTEGER DEFAULT 0,
  nofollow_links INTEGER DEFAULT 0,

  -- Link quality
  external_nofollow_count INTEGER DEFAULT 0,
  external_dofollow_count INTEGER DEFAULT 0,
  toxic_links INTEGER DEFAULT 0,
  quality_score INTEGER CHECK (quality_score >= 0 AND quality_score <= 100),

  -- Anchor text analysis
  anchor_texts JSONB DEFAULT '[]',
  /*
  Example:
  [
    {"text": "click here", "count": 5, "type": "generic"},
    {"text": "best seo tools", "count": 3, "type": "keyword_rich"},
    {"text": "example.com", "count": 2, "type": "url"}
  ]
  */
  over_optimized_anchors INTEGER DEFAULT 0,

  -- Internal linking
  orphan_page BOOLEAN DEFAULT false, -- No internal links pointing to this page
  dead_end_page BOOLEAN DEFAULT false, -- No outgoing links
  deep_level INTEGER, -- How many clicks from homepage

  -- Link details
  link_list JSONB DEFAULT '[]',
  /*
  Example:
  [
    {
      "url": "https://example.com/page",
      "anchor": "Example Page",
      "type": "internal",
      "rel": "dofollow",
      "status": 200
    }
  ]
  */

  -- Issues
  issues JSONB DEFAULT '[]',
  recommendations JSONB DEFAULT '[]',

  -- Metadata
  analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================
-- SEO STRUCTURED DATA TABLE
-- ============================================
-- Validates and tracks structured data (Schema.org)

CREATE TABLE IF NOT EXISTS public.seo_structured_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,

  -- Schema types found
  schema_types TEXT[] DEFAULT '{}',
  /*
  Example: ['Article', 'BreadcrumbList', 'Organization', 'WebPage']
  */

  -- Validation
  has_structured_data BOOLEAN DEFAULT false,
  is_valid BOOLEAN DEFAULT false,
  validation_errors JSONB DEFAULT '[]',
  validation_warnings JSONB DEFAULT '[]',

  -- Schema details
  schemas JSONB DEFAULT '[]',
  /*
  Example:
  [
    {
      "type": "Article",
      "valid": true,
      "required_fields": ["headline", "image", "datePublished"],
      "missing_fields": [],
      "data": {...}
    }
  ]
  */

  -- Coverage
  schema_coverage_score INTEGER CHECK (schema_coverage_score >= 0 AND schema_coverage_score <= 100),
  recommended_schemas TEXT[] DEFAULT '{}',

  -- Rich results eligibility
  eligible_for_rich_results BOOLEAN DEFAULT false,
  rich_result_types TEXT[] DEFAULT '{}',
  /*
  Example: ['Article', 'Recipe', 'FAQ', 'HowTo', 'Product']
  */

  -- Issues
  critical_errors INTEGER DEFAULT 0,
  warnings INTEGER DEFAULT 0,

  -- Testing tools results
  google_test_result JSONB,
  schema_markup_validator_result JSONB,

  -- Metadata
  validated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================
-- SEO MOBILE ANALYSIS TABLE
-- ============================================
-- Analyzes mobile-friendliness and usability

CREATE TABLE IF NOT EXISTS public.seo_mobile_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,

  -- Mobile-friendliness
  mobile_friendly BOOLEAN DEFAULT false,
  mobile_score INTEGER CHECK (mobile_score >= 0 AND mobile_score <= 100),

  -- Viewport
  has_viewport_meta BOOLEAN DEFAULT false,
  viewport_content TEXT,
  viewport_width TEXT,

  -- Touch elements
  touch_targets_sized_appropriately BOOLEAN DEFAULT false,
  tap_target_issues INTEGER DEFAULT 0,
  minimum_tap_target_size INTEGER, -- pixels

  -- Content sizing
  content_fits_viewport BOOLEAN DEFAULT false,
  horizontal_scroll_required BOOLEAN DEFAULT false,
  font_size_legible BOOLEAN DEFAULT false,

  -- Mobile-specific issues
  issues JSONB DEFAULT '[]',
  /*
  Example:
  [
    {"type": "text_too_small", "severity": "high", "details": "Font size is 10px, minimum recommended is 16px"},
    {"type": "tap_targets_too_close", "severity": "medium"},
    {"type": "viewport_not_set", "severity": "critical"}
  ]
  */

  -- Performance on mobile
  mobile_page_speed INTEGER CHECK (mobile_page_speed >= 0 AND mobile_page_speed <= 100),
  mobile_lcp NUMERIC(10,2),
  mobile_fid NUMERIC(10,2),
  mobile_cls NUMERIC(5,3),

  -- Resources
  resource_count INTEGER,
  total_resource_size_kb INTEGER,
  uses_responsive_images BOOLEAN DEFAULT false,

  -- Mobile usability score
  usability_score INTEGER CHECK (usability_score >= 0 AND usability_score <= 100),

  -- Status
  passed_mobile_friendly_test BOOLEAN DEFAULT false,
  google_mobile_friendly_result JSONB,

  -- Metadata
  tested_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================
-- SEO PERFORMANCE BUDGET TABLE
-- ============================================
-- Tracks performance budgets and violations

CREATE TABLE IF NOT EXISTS public.seo_performance_budget (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  url_pattern TEXT NOT NULL, -- Regex or glob pattern

  -- Budget limits
  max_page_size_kb INTEGER,
  max_image_size_kb INTEGER,
  max_js_size_kb INTEGER,
  max_css_size_kb INTEGER,
  max_font_size_kb INTEGER,
  max_requests INTEGER,
  max_load_time_ms INTEGER,
  max_lcp_ms INTEGER,
  max_fid_ms INTEGER,
  max_cls NUMERIC(5,3),

  -- Current values
  current_page_size_kb INTEGER,
  current_image_size_kb INTEGER,
  current_js_size_kb INTEGER,
  current_css_size_kb INTEGER,
  current_font_size_kb INTEGER,
  current_requests INTEGER,
  current_load_time_ms INTEGER,
  current_lcp_ms INTEGER,
  current_fid_ms INTEGER,
  current_cls NUMERIC(5,3),

  -- Budget status
  is_within_budget BOOLEAN DEFAULT true,
  violations JSONB DEFAULT '[]',
  /*
  Example:
  [
    {
      "metric": "page_size",
      "budget": 500,
      "actual": 750,
      "overage": 250,
      "percentage": 150
    }
  ]
  */
  violation_count INTEGER DEFAULT 0,

  -- Alerts
  alert_on_violation BOOLEAN DEFAULT true,
  alert_threshold_percentage INTEGER DEFAULT 90, -- Alert when approaching budget

  -- Status
  is_active BOOLEAN DEFAULT true,
  last_checked_at TIMESTAMP WITH TIME ZONE,
  last_violation_at TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Image Analysis indexes
CREATE INDEX IF NOT EXISTS idx_seo_image_page_url ON public.seo_image_analysis(page_url);
CREATE INDEX IF NOT EXISTS idx_seo_image_optimized ON public.seo_image_analysis(is_optimized);
CREATE INDEX IF NOT EXISTS idx_seo_image_analyzed_at ON public.seo_image_analysis(analyzed_at DESC);

-- Redirect Analysis indexes
CREATE INDEX IF NOT EXISTS idx_seo_redirect_source ON public.seo_redirect_analysis(source_url);
CREATE INDEX IF NOT EXISTS idx_seo_redirect_final ON public.seo_redirect_analysis(final_url);
CREATE INDEX IF NOT EXISTS idx_seo_redirect_status ON public.seo_redirect_analysis(status);
CREATE INDEX IF NOT EXISTS idx_seo_redirect_chain ON public.seo_redirect_analysis(is_chain) WHERE is_chain = true;

-- Duplicate Content indexes
CREATE INDEX IF NOT EXISTS idx_seo_duplicate_hash ON public.seo_duplicate_content(content_hash);
CREATE INDEX IF NOT EXISTS idx_seo_duplicate_status ON public.seo_duplicate_content(status);
CREATE INDEX IF NOT EXISTS idx_seo_duplicate_impact ON public.seo_duplicate_content(impact_level);

-- Security Analysis indexes
CREATE INDEX IF NOT EXISTS idx_seo_security_url ON public.seo_security_analysis(url);
CREATE INDEX IF NOT EXISTS idx_seo_security_score ON public.seo_security_analysis(security_score);
CREATE INDEX IF NOT EXISTS idx_seo_security_grade ON public.seo_security_analysis(security_grade);

-- Link Analysis indexes
CREATE INDEX IF NOT EXISTS idx_seo_link_page_url ON public.seo_link_analysis(page_url);
CREATE INDEX IF NOT EXISTS idx_seo_link_broken ON public.seo_link_analysis(broken_links) WHERE broken_links > 0;
CREATE INDEX IF NOT EXISTS idx_seo_link_orphan ON public.seo_link_analysis(orphan_page) WHERE orphan_page = true;

-- Structured Data indexes
CREATE INDEX IF NOT EXISTS idx_seo_schema_url ON public.seo_structured_data(url);
CREATE INDEX IF NOT EXISTS idx_seo_schema_valid ON public.seo_structured_data(is_valid);
CREATE INDEX IF NOT EXISTS idx_seo_schema_eligible ON public.seo_structured_data(eligible_for_rich_results);

-- Mobile Analysis indexes
CREATE INDEX IF NOT EXISTS idx_seo_mobile_url ON public.seo_mobile_analysis(url);
CREATE INDEX IF NOT EXISTS idx_seo_mobile_friendly ON public.seo_mobile_analysis(mobile_friendly);
CREATE INDEX IF NOT EXISTS idx_seo_mobile_score ON public.seo_mobile_analysis(mobile_score);

-- Performance Budget indexes
CREATE INDEX IF NOT EXISTS idx_seo_budget_active ON public.seo_performance_budget(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_seo_budget_within ON public.seo_performance_budget(is_within_budget);
CREATE INDEX IF NOT EXISTS idx_seo_budget_url_pattern ON public.seo_performance_budget(url_pattern);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.seo_image_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_redirect_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_duplicate_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_security_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_link_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_structured_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_mobile_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_performance_budget ENABLE ROW LEVEL SECURITY;

-- Admin-only policies for all enterprise tables
DROP POLICY IF EXISTS "Admins can manage image analysis" ON public.seo_image_analysis;
CREATE POLICY "Admins can manage image analysis"
ON public.seo_image_analysis FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can manage redirect analysis" ON public.seo_redirect_analysis;
CREATE POLICY "Admins can manage redirect analysis"
ON public.seo_redirect_analysis FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can manage duplicate content" ON public.seo_duplicate_content;
CREATE POLICY "Admins can manage duplicate content"
ON public.seo_duplicate_content FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can manage security analysis" ON public.seo_security_analysis;
CREATE POLICY "Admins can manage security analysis"
ON public.seo_security_analysis FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can manage link analysis" ON public.seo_link_analysis;
CREATE POLICY "Admins can manage link analysis"
ON public.seo_link_analysis FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can manage structured data" ON public.seo_structured_data;
CREATE POLICY "Admins can manage structured data"
ON public.seo_structured_data FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can manage mobile analysis" ON public.seo_mobile_analysis;
CREATE POLICY "Admins can manage mobile analysis"
ON public.seo_mobile_analysis FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can manage performance budgets" ON public.seo_performance_budget;
CREATE POLICY "Admins can manage performance budgets"
ON public.seo_performance_budget FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Public read policies for some tables
DROP POLICY IF EXISTS "Authenticated users can view security analysis" ON public.seo_security_analysis;
CREATE POLICY "Authenticated users can view security analysis"
ON public.seo_security_analysis FOR SELECT
USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can view mobile analysis" ON public.seo_mobile_analysis;
CREATE POLICY "Authenticated users can view mobile analysis"
ON public.seo_mobile_analysis FOR SELECT
USING (auth.uid() IS NOT NULL);

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================

DROP TRIGGER IF EXISTS update_seo_redirect_updated_at ON public.seo_redirect_analysis;
CREATE TRIGGER update_seo_redirect_updated_at
BEFORE UPDATE ON public.seo_redirect_analysis
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_seo_duplicate_updated_at ON public.seo_duplicate_content;
CREATE TRIGGER update_seo_duplicate_updated_at
BEFORE UPDATE ON public.seo_duplicate_content
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_seo_budget_updated_at ON public.seo_performance_budget;
CREATE TRIGGER update_seo_budget_updated_at
BEFORE UPDATE ON public.seo_performance_budget
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE public.seo_image_analysis IS 'Image SEO analysis and optimization recommendations';
COMMENT ON TABLE public.seo_redirect_analysis IS 'Redirect chain detection and analysis';
COMMENT ON TABLE public.seo_duplicate_content IS 'Duplicate content detection and tracking';
COMMENT ON TABLE public.seo_security_analysis IS 'Security headers and HTTPS analysis';
COMMENT ON TABLE public.seo_link_analysis IS 'Internal and external link structure analysis';
COMMENT ON TABLE public.seo_structured_data IS 'Structured data (Schema.org) validation';
COMMENT ON TABLE public.seo_mobile_analysis IS 'Mobile-friendliness and usability analysis';
COMMENT ON TABLE public.seo_performance_budget IS 'Performance budget tracking and violations';
-- ============================================
-- SEO MANAGEMENT SYSTEM - CONTENT OPTIMIZATION
-- ============================================
-- Migration 6 of 6: Content Optimization Features
-- Tables: seo_content_optimization, seo_semantic_analysis

-- ============================================
-- SEO CONTENT OPTIMIZATION TABLE
-- ============================================
-- Stores content analysis and AI-powered optimization suggestions

CREATE TABLE IF NOT EXISTS public.seo_content_optimization (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  page_title TEXT,
  target_keyword TEXT,

  -- Content metrics
  word_count INTEGER,
  paragraph_count INTEGER,
  sentence_count INTEGER,
  average_sentence_length NUMERIC(5,2),

  -- Readability scores
  flesch_reading_ease NUMERIC(5,2),
  flesch_kincaid_grade NUMERIC(5,2),
  readability_level TEXT, -- 'very_easy', 'easy', 'moderate', 'difficult', 'very_difficult'
  readability_score INTEGER CHECK (readability_score >= 0 AND readability_score <= 100),

  -- Keyword analysis
  keyword_density NUMERIC(5,2), -- Percentage
  keyword_count INTEGER,
  keyword_in_title BOOLEAN DEFAULT false,
  keyword_in_h1 BOOLEAN DEFAULT false,
  keyword_in_first_paragraph BOOLEAN DEFAULT false,
  keyword_in_url BOOLEAN DEFAULT false,
  keyword_prominence_score INTEGER CHECK (keyword_prominence_score >= 0 AND keyword_prominence_score <= 100),

  -- Heading structure
  h1_count INTEGER DEFAULT 0,
  h2_count INTEGER DEFAULT 0,
  h3_count INTEGER DEFAULT 0,
  h4_count INTEGER DEFAULT 0,
  h5_count INTEGER DEFAULT 0,
  h6_count INTEGER DEFAULT 0,
  heading_structure_score INTEGER CHECK (heading_structure_score >= 0 AND heading_structure_score <= 100),

  -- Content quality
  content_quality_score INTEGER CHECK (content_quality_score >= 0 AND content_quality_score <= 100),
  uniqueness_score INTEGER CHECK (uniqueness_score >= 0 AND uniqueness_score <= 100),
  engagement_score INTEGER CHECK (engagement_score >= 0 AND engagement_score <= 100),

  -- LSI Keywords (Latent Semantic Indexing)
  lsi_keywords TEXT[] DEFAULT '{}',
  lsi_keywords_found INTEGER DEFAULT 0,
  lsi_keywords_recommended TEXT[] DEFAULT '{}',
  lsi_coverage_score INTEGER CHECK (lsi_coverage_score >= 0 AND lsi_coverage_score <= 100),

  -- Topic coverage
  topic_coverage_score INTEGER CHECK (topic_coverage_score >= 0 AND topic_coverage_score <= 100),
  missing_topics TEXT[] DEFAULT '{}',
  covered_topics TEXT[] DEFAULT '{}',

  -- AI-generated insights
  ai_summary TEXT,
  ai_suggestions JSONB DEFAULT '[]',
  /*
  Example:
  [
    {
      "type": "keyword_density",
      "priority": "high",
      "current": 0.5,
      "recommended": 1.5,
      "suggestion": "Increase keyword usage to 1-2% density"
    },
    {
      "type": "readability",
      "priority": "medium",
      "suggestion": "Break up long sentences. Current average: 25 words, recommended: 15-20 words"
    }
  ]
  */

  -- Content improvements
  title_suggestions TEXT[] DEFAULT '{}',
  meta_description_suggestions TEXT[] DEFAULT '{}',
  heading_suggestions JSONB DEFAULT '[]',
  content_additions TEXT[] DEFAULT '{}',

  -- Media recommendations
  image_suggestions TEXT[] DEFAULT '{}',
  video_suggestions TEXT[] DEFAULT '{}',
  infographic_topics TEXT[] DEFAULT '{}',

  -- Internal linking recommendations
  recommended_internal_links JSONB DEFAULT '[]',
  /*
  Example:
  [
    {
      "anchor_text": "best seo practices",
      "target_url": "/blog/seo-best-practices",
      "reason": "Related topic, improves topical authority"
    }
  ]
  */

  -- Overall optimization score
  optimization_score INTEGER CHECK (optimization_score >= 0 AND optimization_score <= 100),
  optimization_level TEXT CHECK (optimization_level IN ('poor', 'fair', 'good', 'excellent')),

  -- Status
  status TEXT DEFAULT 'analyzed' CHECK (status IN ('analyzed', 'optimizing', 'optimized', 'published')),
  optimized_at TIMESTAMP WITH TIME ZONE,

  -- Comparison with competitors
  competitor_avg_word_count INTEGER,
  competitor_avg_readability NUMERIC(5,2),
  competitive_gap TEXT,

  -- Metadata
  analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  analyzed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================
-- SEO SEMANTIC ANALYSIS TABLE
-- ============================================
-- Analyzes semantic relationships and topic clusters

CREATE TABLE IF NOT EXISTS public.seo_semantic_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  primary_topic TEXT NOT NULL,

  -- Topic cluster
  topic_cluster_id TEXT,
  cluster_name TEXT,
  is_pillar_content BOOLEAN DEFAULT false,
  related_content_urls TEXT[] DEFAULT '{}',

  -- Semantic keywords
  main_entities JSONB DEFAULT '[]',
  /*
  Example:
  [
    {"entity": "SEO", "type": "CONCEPT", "salience": 0.85, "mentions": 15},
    {"entity": "Google", "type": "ORGANIZATION", "salience": 0.62, "mentions": 8},
    {"entity": "search rankings", "type": "CONCEPT", "salience": 0.48, "mentions": 6}
  ]
  */

  -- Semantic keywords and variations
  semantic_keywords JSONB DEFAULT '[]',
  /*
  Example:
  [
    {
      "keyword": "search engine optimization",
      "variations": ["SEO", "search optimization", "organic search"],
      "relevance": 0.95,
      "usage_count": 12
    }
  ]
  */

  -- TF-IDF Analysis (Term Frequency-Inverse Document Frequency)
  tf_idf_keywords JSONB DEFAULT '[]',
  /*
  Example:
  [
    {"term": "optimization", "tf_idf": 0.45, "frequency": 15},
    {"term": "rankings", "tf_idf": 0.38, "frequency": 10}
  ]
  */

  -- Co-occurrence analysis
  keyword_co_occurrence JSONB DEFAULT '{}',
  /*
  Example:
  {
    "SEO": ["tools", "strategy", "optimization", "rankings"],
    "content": ["quality", "marketing", "strategy"]
  }
  */

  -- Topic modeling
  topics_detected TEXT[] DEFAULT '{}',
  topic_weights JSONB DEFAULT '{}',
  /*
  Example:
  {
    "technical_seo": 0.45,
    "content_marketing": 0.30,
    "link_building": 0.25
  }
  */

  -- Sentiment analysis
  overall_sentiment TEXT CHECK (overall_sentiment IN ('positive', 'neutral', 'negative', 'mixed')),
  sentiment_score NUMERIC(5,2), -- -1.0 to 1.0
  emotional_tone TEXT[] DEFAULT '{}', -- ['informative', 'professional', 'enthusiastic']

  -- Intent analysis
  content_intent TEXT CHECK (content_intent IN ('informational', 'navigational', 'transactional', 'commercial')),
  search_intent_match_score INTEGER CHECK (search_intent_match_score >= 0 AND search_intent_match_score <= 100),

  -- Semantic richness
  vocabulary_size INTEGER, -- Unique words
  lexical_diversity NUMERIC(5,2), -- Ratio of unique to total words
  semantic_density NUMERIC(5,2), -- Meaningful words vs filler words

  -- Question coverage
  questions_addressed TEXT[] DEFAULT '{}',
  missing_questions TEXT[] DEFAULT '{}',
  faq_potential_score INTEGER CHECK (faq_potential_score >= 0 AND faq_potential_score <= 100),

  -- E-A-T signals (Expertise, Authoritativeness, Trustworthiness)
  expertise_signals JSONB DEFAULT '[]',
  authority_signals JSONB DEFAULT '[]',
  trust_signals JSONB DEFAULT '[]',
  eat_score INTEGER CHECK (eat_score >= 0 AND eat_score <= 100),

  -- Recommendations
  semantic_gaps TEXT[] DEFAULT '{}',
  recommended_entities TEXT[] DEFAULT '{}',
  recommended_topics TEXT[] DEFAULT '{}',
  content_depth_recommendation TEXT,

  -- NLP analysis metadata
  nlp_model_used TEXT,
  nlp_confidence_score NUMERIC(5,2),

  -- Overall scores
  semantic_relevance_score INTEGER CHECK (semantic_relevance_score >= 0 AND semantic_relevance_score <= 100),
  topical_authority_score INTEGER CHECK (topical_authority_score >= 0 AND topical_authority_score <= 100),

  -- Metadata
  analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  analyzed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Content Optimization indexes
CREATE INDEX IF NOT EXISTS idx_seo_content_url ON public.seo_content_optimization(url);
CREATE INDEX IF NOT EXISTS idx_seo_content_keyword ON public.seo_content_optimization(target_keyword);
CREATE INDEX IF NOT EXISTS idx_seo_content_score ON public.seo_content_optimization(optimization_score DESC);
CREATE INDEX IF NOT EXISTS idx_seo_content_status ON public.seo_content_optimization(status);
CREATE INDEX IF NOT EXISTS idx_seo_content_analyzed_at ON public.seo_content_optimization(analyzed_at DESC);

-- Semantic Analysis indexes
CREATE INDEX IF NOT EXISTS idx_seo_semantic_url ON public.seo_semantic_analysis(url);
CREATE INDEX IF NOT EXISTS idx_seo_semantic_topic ON public.seo_semantic_analysis(primary_topic);
CREATE INDEX IF NOT EXISTS idx_seo_semantic_cluster ON public.seo_semantic_analysis(topic_cluster_id);
CREATE INDEX IF NOT EXISTS idx_seo_semantic_pillar ON public.seo_semantic_analysis(is_pillar_content) WHERE is_pillar_content = true;
CREATE INDEX IF NOT EXISTS idx_seo_semantic_relevance ON public.seo_semantic_analysis(semantic_relevance_score DESC);
CREATE INDEX IF NOT EXISTS idx_seo_semantic_analyzed_at ON public.seo_semantic_analysis(analyzed_at DESC);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.seo_content_optimization ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_semantic_analysis ENABLE ROW LEVEL SECURITY;

-- Content Optimization policies
DROP POLICY IF EXISTS "Admins can manage content optimization" ON public.seo_content_optimization;
CREATE POLICY "Admins can manage content optimization"
ON public.seo_content_optimization FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Users can view their own content optimization" ON public.seo_content_optimization;
CREATE POLICY "Users can view their own content optimization"
ON public.seo_content_optimization FOR SELECT
USING (auth.uid() = analyzed_by OR public.has_role(auth.uid(), 'admin'::app_role));

-- Semantic Analysis policies
DROP POLICY IF EXISTS "Admins can manage semantic analysis" ON public.seo_semantic_analysis;
CREATE POLICY "Admins can manage semantic analysis"
ON public.seo_semantic_analysis FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Users can view their own semantic analysis" ON public.seo_semantic_analysis;
CREATE POLICY "Users can view their own semantic analysis"
ON public.seo_semantic_analysis FOR SELECT
USING (auth.uid() = analyzed_by OR public.has_role(auth.uid(), 'admin'::app_role));

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================

DROP TRIGGER IF EXISTS update_seo_content_updated_at ON public.seo_content_optimization;
CREATE TRIGGER update_seo_content_updated_at
BEFORE UPDATE ON public.seo_content_optimization
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_seo_semantic_updated_at ON public.seo_semantic_analysis;
CREATE TRIGGER update_seo_semantic_updated_at
BEFORE UPDATE ON public.seo_semantic_analysis
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to get content by optimization score range
CREATE OR REPLACE FUNCTION public.get_content_by_score_range(
  min_score INTEGER DEFAULT 0,
  max_score INTEGER DEFAULT 100
)
RETURNS TABLE (
  url TEXT,
  page_title TEXT,
  optimization_score INTEGER,
  optimization_level TEXT,
  analyzed_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    url,
    page_title,
    optimization_score,
    optimization_level,
    analyzed_at
  FROM public.seo_content_optimization
  WHERE optimization_score >= min_score
    AND optimization_score <= max_score
  ORDER BY optimization_score ASC, analyzed_at DESC;
$$;

-- Function to get pages needing optimization
CREATE OR REPLACE FUNCTION public.get_pages_needing_optimization()
RETURNS TABLE (
  url TEXT,
  page_title TEXT,
  optimization_score INTEGER,
  critical_issues TEXT[]
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    url,
    page_title,
    optimization_score,
    ARRAY(
      SELECT jsonb_array_elements_text(ai_suggestions)::jsonb->>'type'
      FROM public.seo_content_optimization sco
      WHERE sco.url = public.seo_content_optimization.url
        AND (ai_suggestions::jsonb->>'priority' = 'high' OR ai_suggestions::jsonb->>'priority' = 'critical')
    ) as critical_issues
  FROM public.seo_content_optimization
  WHERE optimization_score < 70
  ORDER BY optimization_score ASC;
$$;

-- Function to find topic cluster opportunities
CREATE OR REPLACE FUNCTION public.find_topic_cluster_opportunities()
RETURNS TABLE (
  primary_topic TEXT,
  page_count BIGINT,
  has_pillar_content BOOLEAN,
  average_score NUMERIC(5,2)
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    primary_topic,
    COUNT(*)::BIGINT as page_count,
    BOOL_OR(is_pillar_content) as has_pillar_content,
    AVG(topical_authority_score) as average_score
  FROM public.seo_semantic_analysis
  GROUP BY primary_topic
  HAVING COUNT(*) >= 3 -- At least 3 pieces of content on the topic
  ORDER BY page_count DESC, average_score DESC;
$$;

-- Function to calculate content freshness score
CREATE OR REPLACE FUNCTION public.calculate_content_freshness_score(
  p_analyzed_at TIMESTAMP WITH TIME ZONE
)
RETURNS INTEGER
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  days_old INTEGER;
  freshness_score INTEGER;
BEGIN
  days_old := EXTRACT(DAY FROM now() - p_analyzed_at)::INTEGER;

  CASE
    WHEN days_old <= 7 THEN freshness_score := 100;
    WHEN days_old <= 30 THEN freshness_score := 90;
    WHEN days_old <= 90 THEN freshness_score := 75;
    WHEN days_old <= 180 THEN freshness_score := 50;
    WHEN days_old <= 365 THEN freshness_score := 25;
    ELSE freshness_score := 10;
  END CASE;

  RETURN freshness_score;
END;
$$;

-- ============================================
-- VIEWS FOR CONVENIENCE
-- ============================================

-- View for content optimization overview
CREATE OR REPLACE VIEW public.seo_content_optimization_summary AS
SELECT
  COUNT(*) as total_pages,
  COUNT(*) FILTER (WHERE optimization_score >= 90) as excellent_pages,
  COUNT(*) FILTER (WHERE optimization_score >= 70 AND optimization_score < 90) as good_pages,
  COUNT(*) FILTER (WHERE optimization_score >= 50 AND optimization_score < 70) as fair_pages,
  COUNT(*) FILTER (WHERE optimization_score < 50) as poor_pages,
  AVG(optimization_score)::NUMERIC(5,2) as avg_optimization_score,
  AVG(readability_score)::NUMERIC(5,2) as avg_readability_score,
  AVG(word_count)::INTEGER as avg_word_count
FROM public.seo_content_optimization;

-- View for semantic analysis overview
CREATE OR REPLACE VIEW public.seo_semantic_analysis_summary AS
SELECT
  COUNT(*) as total_pages_analyzed,
  COUNT(DISTINCT primary_topic) as unique_topics,
  COUNT(DISTINCT topic_cluster_id) as topic_clusters,
  COUNT(*) FILTER (WHERE is_pillar_content = true) as pillar_content_count,
  AVG(semantic_relevance_score)::NUMERIC(5,2) as avg_semantic_score,
  AVG(topical_authority_score)::NUMERIC(5,2) as avg_authority_score,
  AVG(eat_score)::NUMERIC(5,2) as avg_eat_score
FROM public.seo_semantic_analysis;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE public.seo_content_optimization IS 'AI-powered content analysis and optimization suggestions';
COMMENT ON TABLE public.seo_semantic_analysis IS 'Semantic keyword analysis and topic clustering';

COMMENT ON FUNCTION public.get_content_by_score_range IS 'Get content filtered by optimization score range';
COMMENT ON FUNCTION public.get_pages_needing_optimization IS 'Get pages with low optimization scores and critical issues';
COMMENT ON FUNCTION public.find_topic_cluster_opportunities IS 'Find topics with multiple pieces of content that could form clusters';
COMMENT ON FUNCTION public.calculate_content_freshness_score IS 'Calculate content freshness score based on analysis date';

COMMENT ON VIEW public.seo_content_optimization_summary IS 'Summary statistics for content optimization';
COMMENT ON VIEW public.seo_semantic_analysis_summary IS 'Summary statistics for semantic analysis';
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

CREATE TABLE IF NOT EXISTS public.ga4_oauth_credentials (
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

CREATE TABLE IF NOT EXISTS public.ga4_properties (
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

CREATE TABLE IF NOT EXISTS public.ga4_traffic_data (
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

CREATE TABLE IF NOT EXISTS public.bing_webmaster_oauth_credentials (
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

CREATE TABLE IF NOT EXISTS public.bing_webmaster_sites (
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

CREATE TABLE IF NOT EXISTS public.bing_webmaster_search_data (
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

CREATE TABLE IF NOT EXISTS public.yandex_webmaster_oauth_credentials (
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

CREATE TABLE IF NOT EXISTS public.yandex_webmaster_sites (
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

CREATE TABLE IF NOT EXISTS public.yandex_webmaster_search_data (
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

CREATE TABLE IF NOT EXISTS public.unified_search_analytics (
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