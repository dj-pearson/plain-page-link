-- ============================================
-- SEO MANAGEMENT SYSTEM - CONTENT OPTIMIZATION
-- ============================================
-- Migration 6 of 6: Content Optimization Features
-- Tables: seo_content_optimization, seo_semantic_analysis

-- ============================================
-- SEO CONTENT OPTIMIZATION TABLE
-- ============================================
-- Stores content analysis and AI-powered optimization suggestions

CREATE TABLE public.seo_content_optimization (
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

CREATE TABLE public.seo_semantic_analysis (
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
CREATE INDEX idx_seo_content_url ON public.seo_content_optimization(url);
CREATE INDEX idx_seo_content_keyword ON public.seo_content_optimization(target_keyword);
CREATE INDEX idx_seo_content_score ON public.seo_content_optimization(optimization_score DESC);
CREATE INDEX idx_seo_content_status ON public.seo_content_optimization(status);
CREATE INDEX idx_seo_content_analyzed_at ON public.seo_content_optimization(analyzed_at DESC);

-- Semantic Analysis indexes
CREATE INDEX idx_seo_semantic_url ON public.seo_semantic_analysis(url);
CREATE INDEX idx_seo_semantic_topic ON public.seo_semantic_analysis(primary_topic);
CREATE INDEX idx_seo_semantic_cluster ON public.seo_semantic_analysis(topic_cluster_id);
CREATE INDEX idx_seo_semantic_pillar ON public.seo_semantic_analysis(is_pillar_content) WHERE is_pillar_content = true;
CREATE INDEX idx_seo_semantic_relevance ON public.seo_semantic_analysis(semantic_relevance_score DESC);
CREATE INDEX idx_seo_semantic_analyzed_at ON public.seo_semantic_analysis(analyzed_at DESC);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.seo_content_optimization ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_semantic_analysis ENABLE ROW LEVEL SECURITY;

-- Content Optimization policies
CREATE POLICY "Admins can manage content optimization"
ON public.seo_content_optimization FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own content optimization"
ON public.seo_content_optimization FOR SELECT
USING (auth.uid() = analyzed_by OR public.has_role(auth.uid(), 'admin'::app_role));

-- Semantic Analysis policies
CREATE POLICY "Admins can manage semantic analysis"
ON public.seo_semantic_analysis FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own semantic analysis"
ON public.seo_semantic_analysis FOR SELECT
USING (auth.uid() = analyzed_by OR public.has_role(auth.uid(), 'admin'::app_role));

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================

CREATE TRIGGER update_seo_content_updated_at
BEFORE UPDATE ON public.seo_content_optimization
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

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
