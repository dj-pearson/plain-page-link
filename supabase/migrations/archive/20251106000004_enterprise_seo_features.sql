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

CREATE TABLE public.seo_image_analysis (
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

CREATE TABLE public.seo_redirect_analysis (
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

CREATE TABLE public.seo_duplicate_content (
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

CREATE TABLE public.seo_security_analysis (
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

CREATE TABLE public.seo_link_analysis (
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

CREATE TABLE public.seo_structured_data (
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

CREATE TABLE public.seo_mobile_analysis (
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

CREATE TABLE public.seo_performance_budget (
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
CREATE INDEX idx_seo_image_page_url ON public.seo_image_analysis(page_url);
CREATE INDEX idx_seo_image_optimized ON public.seo_image_analysis(is_optimized);
CREATE INDEX idx_seo_image_analyzed_at ON public.seo_image_analysis(analyzed_at DESC);

-- Redirect Analysis indexes
CREATE INDEX idx_seo_redirect_source ON public.seo_redirect_analysis(source_url);
CREATE INDEX idx_seo_redirect_final ON public.seo_redirect_analysis(final_url);
CREATE INDEX idx_seo_redirect_status ON public.seo_redirect_analysis(status);
CREATE INDEX idx_seo_redirect_chain ON public.seo_redirect_analysis(is_chain) WHERE is_chain = true;

-- Duplicate Content indexes
CREATE INDEX idx_seo_duplicate_hash ON public.seo_duplicate_content(content_hash);
CREATE INDEX idx_seo_duplicate_status ON public.seo_duplicate_content(status);
CREATE INDEX idx_seo_duplicate_impact ON public.seo_duplicate_content(impact_level);

-- Security Analysis indexes
CREATE INDEX idx_seo_security_url ON public.seo_security_analysis(url);
CREATE INDEX idx_seo_security_score ON public.seo_security_analysis(security_score);
CREATE INDEX idx_seo_security_grade ON public.seo_security_analysis(security_grade);

-- Link Analysis indexes
CREATE INDEX idx_seo_link_page_url ON public.seo_link_analysis(page_url);
CREATE INDEX idx_seo_link_broken ON public.seo_link_analysis(broken_links) WHERE broken_links > 0;
CREATE INDEX idx_seo_link_orphan ON public.seo_link_analysis(orphan_page) WHERE orphan_page = true;

-- Structured Data indexes
CREATE INDEX idx_seo_schema_url ON public.seo_structured_data(url);
CREATE INDEX idx_seo_schema_valid ON public.seo_structured_data(is_valid);
CREATE INDEX idx_seo_schema_eligible ON public.seo_structured_data(eligible_for_rich_results);

-- Mobile Analysis indexes
CREATE INDEX idx_seo_mobile_url ON public.seo_mobile_analysis(url);
CREATE INDEX idx_seo_mobile_friendly ON public.seo_mobile_analysis(mobile_friendly);
CREATE INDEX idx_seo_mobile_score ON public.seo_mobile_analysis(mobile_score);

-- Performance Budget indexes
CREATE INDEX idx_seo_budget_active ON public.seo_performance_budget(is_active) WHERE is_active = true;
CREATE INDEX idx_seo_budget_within ON public.seo_performance_budget(is_within_budget);
CREATE INDEX idx_seo_budget_url_pattern ON public.seo_performance_budget(url_pattern);

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
CREATE POLICY "Admins can manage image analysis"
ON public.seo_image_analysis FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage redirect analysis"
ON public.seo_redirect_analysis FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage duplicate content"
ON public.seo_duplicate_content FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage security analysis"
ON public.seo_security_analysis FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage link analysis"
ON public.seo_link_analysis FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage structured data"
ON public.seo_structured_data FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage mobile analysis"
ON public.seo_mobile_analysis FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage performance budgets"
ON public.seo_performance_budget FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Public read policies for some tables
CREATE POLICY "Authenticated users can view security analysis"
ON public.seo_security_analysis FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view mobile analysis"
ON public.seo_mobile_analysis FOR SELECT
USING (auth.uid() IS NOT NULL);

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================

CREATE TRIGGER update_seo_redirect_updated_at
BEFORE UPDATE ON public.seo_redirect_analysis
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_seo_duplicate_updated_at
BEFORE UPDATE ON public.seo_duplicate_content
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

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
