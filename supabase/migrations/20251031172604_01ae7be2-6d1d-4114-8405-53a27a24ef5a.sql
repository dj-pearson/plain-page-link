-- ============================================
-- ADMIN & ROLES SYSTEM
-- ============================================

-- Create app_role enum if not exists (safe check)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('admin', 'user');
  END IF;
END $$;

-- Security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- ============================================
-- AI CONFIGURATION SYSTEM
-- ============================================

-- AI Configuration Table
CREATE TABLE public.ai_configuration (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- AI Models Table  
CREATE TABLE public.ai_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id TEXT NOT NULL UNIQUE,
  model_name TEXT NOT NULL,
  provider TEXT NOT NULL,
  description TEXT,
  context_window INTEGER DEFAULT 200000,
  max_output_tokens INTEGER DEFAULT 8192,
  supports_vision BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_configuration ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_models ENABLE ROW LEVEL SECURITY;

-- Admin-only policies for AI configuration
CREATE POLICY "Admins can manage AI configuration"
ON public.ai_configuration FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage AI models"
ON public.ai_models FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- ============================================
-- SOCIAL MEDIA MANAGEMENT (Real Estate Tailored)
-- ============================================

-- Social Media Posts for Real Estate
CREATE TABLE public.social_media_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT NOT NULL CHECK (content_type IN ('property_highlight', 'market_update', 'agent_tip', 'community_spotlight', 'success_story', 'general')),
  subject_type TEXT NOT NULL CHECK (subject_type IN ('listing_of_the_day', 'market_analysis', 'buyer_seller_tip', 'neighborhood_feature', 'testimonial_highlight', 'special_announcement')),
  platform_type TEXT NOT NULL CHECK (platform_type IN ('twitter_threads', 'facebook_linkedin', 'instagram', 'combined')),
  post_content JSONB NOT NULL,
  post_title TEXT,
  listing_id UUID REFERENCES listings(id),
  property_address TEXT,
  webhook_urls TEXT[],
  ai_prompt_used TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'posted', 'scheduled', 'archived')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  posted_at TIMESTAMP WITH TIME ZONE,
  scheduled_for TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id)
);

-- Social Media Webhooks
CREATE TABLE public.social_media_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  platform TEXT NOT NULL,
  webhook_url TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  headers JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.social_media_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_media_webhooks ENABLE ROW LEVEL SECURITY;

-- Admin policies for social media
CREATE POLICY "Admins can manage social media posts"
ON public.social_media_posts FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage webhooks"
ON public.social_media_webhooks FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- ============================================
-- BLOG/ARTICLE SYSTEM (Real Estate Focused)
-- ============================================

-- Content Suggestions
CREATE TABLE public.content_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic TEXT NOT NULL,
  category TEXT,
  priority INTEGER DEFAULT 1,
  suggested_by UUID REFERENCES auth.users(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'generated')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Articles Table
CREATE TABLE public.articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL,
  excerpt TEXT,
  featured_image_url TEXT,
  author_id UUID REFERENCES auth.users(id),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'scheduled', 'archived')),
  category TEXT DEFAULT 'General',
  tags TEXT[] DEFAULT '{}',
  seo_title TEXT,
  seo_description TEXT,
  seo_keywords TEXT[],
  view_count INTEGER DEFAULT 0,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  generated_from_suggestion_id UUID REFERENCES content_suggestions(id)
);

-- Article Comments
CREATE TABLE public.article_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  content TEXT NOT NULL,
  parent_comment_id UUID REFERENCES article_comments(id),
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Article Webhooks
CREATE TABLE public.article_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_url TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  event_type TEXT DEFAULT 'publish' CHECK (event_type IN ('publish', 'update', 'delete')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS Policies for Articles
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_suggestions ENABLE ROW LEVEL SECURITY;

-- Article policies
CREATE POLICY "Anyone can view published articles" 
ON public.articles FOR SELECT 
USING (status = 'published');

CREATE POLICY "Authors can manage their own articles" 
ON public.articles FOR ALL 
USING (auth.uid() = author_id);

CREATE POLICY "Admins can manage all articles" 
ON public.articles FOR ALL 
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Comment policies
CREATE POLICY "Anyone can view approved comments"
ON public.article_comments FOR SELECT
USING (is_approved = true);

CREATE POLICY "Admins can manage all comments"
ON public.article_comments FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Webhook policies
CREATE POLICY "Admins can manage article webhooks"
ON public.article_webhooks FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Content suggestion policies
CREATE POLICY "Admins can manage content suggestions"
ON public.content_suggestions FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX idx_social_posts_status ON public.social_media_posts(status);
CREATE INDEX idx_social_posts_created_at ON public.social_media_posts(created_at DESC);
CREATE INDEX idx_social_posts_scheduled ON public.social_media_posts(scheduled_for) WHERE status = 'scheduled';

CREATE INDEX idx_articles_status ON public.articles(status);
CREATE INDEX idx_articles_slug ON public.articles(slug);
CREATE INDEX idx_articles_published_at ON public.articles(published_at DESC);
CREATE INDEX idx_articles_author ON public.articles(author_id);

CREATE INDEX idx_article_comments_article ON public.article_comments(article_id);
CREATE INDEX idx_article_comments_approved ON public.article_comments(is_approved);

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================

CREATE TRIGGER update_ai_configuration_updated_at
BEFORE UPDATE ON public.ai_configuration
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ai_models_updated_at
BEFORE UPDATE ON public.ai_models
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_social_webhooks_updated_at
BEFORE UPDATE ON public.social_media_webhooks
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_articles_updated_at
BEFORE UPDATE ON public.articles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_article_comments_updated_at
BEFORE UPDATE ON public.article_comments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_article_webhooks_updated_at
BEFORE UPDATE ON public.article_webhooks
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_content_suggestions_updated_at
BEFORE UPDATE ON public.content_suggestions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- DEFAULT AI CONFIGURATION VALUES
-- ============================================

INSERT INTO public.ai_configuration (setting_key, setting_value, description) VALUES
('default_model', '"google/gemini-2.5-flash"', 'Default AI model for all modules'),
('api_endpoint', '"https://ai.gateway.lovable.dev/v1/chat/completions"', 'Lovable AI Gateway endpoint'),
('max_tokens_standard', '2000', 'Default max tokens for standard operations'),
('max_tokens_large', '8000', 'Max tokens for large operations (articles, bulk processing)'),
('temperature_precise', '0.1', 'Temperature for precise extraction tasks'),
('temperature_creative', '0.7', 'Temperature for creative content generation');

-- ============================================
-- DEFAULT AI MODELS
-- ============================================

INSERT INTO public.ai_models (model_id, model_name, provider, description, context_window, max_output_tokens, supports_vision, is_active) VALUES
('google/gemini-2.5-flash', 'Gemini 2.5 Flash', 'Google', 'Balanced choice: fast, cost-effective, good for most tasks', 1000000, 8192, true, true),
('google/gemini-2.5-pro', 'Gemini 2.5 Pro', 'Google', 'Top-tier: Best for complex reasoning and visual content', 2000000, 8192, true, true),
('google/gemini-2.5-flash-lite', 'Gemini 2.5 Flash Lite', 'Google', 'Fastest and cheapest: Good for simple tasks', 1000000, 8192, false, true),
('openai/gpt-5-mini', 'GPT-5 Mini', 'OpenAI', 'Middle ground: Strong performance without high cost', 128000, 16384, true, true),
('openai/gpt-5', 'GPT-5', 'OpenAI', 'Powerful all-rounder: Excellent reasoning and accuracy', 128000, 16384, true, true);