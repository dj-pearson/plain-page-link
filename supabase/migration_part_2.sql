
DROP TRIGGER IF EXISTS on_lead_increment_profile_count ON public.leads;
CREATE TRIGGER on_lead_increment_profile_count
  AFTER INSERT ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_profile_lead_count();

-- Comments for documentation
COMMENT ON COLUMN public.profiles.specialties IS 'JSONB array of specialties like ["Luxury Homes", "First-Time Buyers"]';
COMMENT ON COLUMN public.profiles.certifications IS 'JSONB array of certifications like ["SRES", "GRI", "CRS"]';
COMMENT ON COLUMN public.profiles.service_cities IS 'JSONB array of cities served';
COMMENT ON COLUMN public.profiles.service_zip_codes IS 'JSONB array of zip codes served';
COMMENT ON COLUMN public.profiles.seo_title IS 'Custom title tag for profile page SEO (max 60 chars recommended)';
COMMENT ON COLUMN public.profiles.seo_description IS 'Custom meta description for profile page SEO (max 160 chars recommended)';
COMMENT ON COLUMN public.profiles.og_image IS 'Custom Open Graph image URL for social media sharing';
COMMENT ON COLUMN public.profiles.is_published IS 'If false, profile is hidden from public view (draft mode)';
COMMENT ON COLUMN public.profiles.custom_domain IS 'Custom domain for profile (e.g., agents.brokerage.com/username)';

-- Create storage buckets for images
-- Note: The 'avatars' bucket already exists, so we'll create the others

-- Create listing-photos bucket
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  VALUES (
    'listing-photos',
    'listing-photos',
    true,
    10485760, -- 10MB limit
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic']
  )
  ON CONFLICT (id) DO NOTHING;
END $$;

-- Create brokerage-logos bucket
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  VALUES (
    'brokerage-logos',
    'brokerage-logos',
    true,
    2097152, -- 2MB limit
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml', 'image/webp']
  )
  ON CONFLICT (id) DO NOTHING;
END $$;

-- RLS policies for listing-photos bucket
DROP POLICY IF EXISTS "Listing photos are publicly accessible" ON storage.objects;
CREATE POLICY "Listing photos are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'listing-photos');

DROP POLICY IF EXISTS "Users can upload listing photos" ON storage.objects;
CREATE POLICY "Users can upload listing photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'listing-photos' 
  AND auth.role() = 'authenticated'
);

DROP POLICY IF EXISTS "Users can update their own listing photos" ON storage.objects;
CREATE POLICY "Users can update their own listing photos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'listing-photos' 
  AND auth.role() = 'authenticated'
);

DROP POLICY IF EXISTS "Users can delete their own listing photos" ON storage.objects;
CREATE POLICY "Users can delete their own listing photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'listing-photos' 
  AND auth.role() = 'authenticated'
);

-- RLS policies for brokerage-logos bucket
DROP POLICY IF EXISTS "Brokerage logos are publicly accessible" ON storage.objects;
CREATE POLICY "Brokerage logos are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'brokerage-logos');

DROP POLICY IF EXISTS "Users can upload brokerage logos" ON storage.objects;
CREATE POLICY "Users can upload brokerage logos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'brokerage-logos' 
  AND auth.role() = 'authenticated'
);

DROP POLICY IF EXISTS "Users can update brokerage logos" ON storage.objects;
CREATE POLICY "Users can update brokerage logos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'brokerage-logos' 
  AND auth.role() = 'authenticated'
);

DROP POLICY IF EXISTS "Users can delete brokerage logos" ON storage.objects;
CREATE POLICY "Users can delete brokerage logos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'brokerage-logos' 
  AND auth.role() = 'authenticated'
);

-- Comments
COMMENT ON COLUMN storage.buckets.file_size_limit IS 'Maximum file size in bytes';
COMMENT ON COLUMN storage.buckets.allowed_mime_types IS 'Array of allowed MIME types for uploads';

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
CREATE TABLE IF NOT EXISTS public.ai_configuration (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- AI Models Table  
CREATE TABLE IF NOT EXISTS public.ai_models (
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
DROP POLICY IF EXISTS "Admins can manage AI configuration" ON public.ai_configuration;
CREATE POLICY "Admins can manage AI configuration"
ON public.ai_configuration FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can manage AI models" ON public.ai_models;
CREATE POLICY "Admins can manage AI models"
ON public.ai_models FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- ============================================
-- SOCIAL MEDIA MANAGEMENT (Real Estate Tailored)
-- ============================================

-- Social Media Posts for Real Estate
CREATE TABLE IF NOT EXISTS public.social_media_posts (
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
CREATE TABLE IF NOT EXISTS public.social_media_webhooks (
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
DROP POLICY IF EXISTS "Admins can manage social media posts" ON public.social_media_posts;
CREATE POLICY "Admins can manage social media posts"
ON public.social_media_posts FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can manage webhooks" ON public.social_media_webhooks;
CREATE POLICY "Admins can manage webhooks"
ON public.social_media_webhooks FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- ============================================
-- BLOG/ARTICLE SYSTEM (Real Estate Focused)
-- ============================================

-- Content Suggestions
CREATE TABLE IF NOT EXISTS public.content_suggestions (
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
CREATE TABLE IF NOT EXISTS public.articles (
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
CREATE TABLE IF NOT EXISTS public.article_comments (
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
CREATE TABLE IF NOT EXISTS public.article_webhooks (
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
DROP POLICY IF EXISTS "Anyone can view published articles" ON public.articles;
CREATE POLICY "Anyone can view published articles" 
ON public.articles FOR SELECT 
USING (status = 'published');

DROP POLICY IF EXISTS "Authors can manage their own articles" ON public.articles;
CREATE POLICY "Authors can manage their own articles" 
ON public.articles FOR ALL 
USING (auth.uid() = author_id);

DROP POLICY IF EXISTS "Admins can manage all articles" ON public.articles;
CREATE POLICY "Admins can manage all articles" 
ON public.articles FOR ALL 
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Comment policies
DROP POLICY IF EXISTS "Anyone can view approved comments" ON public.article_comments;
CREATE POLICY "Anyone can view approved comments"
ON public.article_comments FOR SELECT
USING (is_approved = true);

DROP POLICY IF EXISTS "Admins can manage all comments" ON public.article_comments;
CREATE POLICY "Admins can manage all comments"
ON public.article_comments FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Webhook policies
DROP POLICY IF EXISTS "Admins can manage article webhooks" ON public.article_webhooks;
CREATE POLICY "Admins can manage article webhooks"
ON public.article_webhooks FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Content suggestion policies
DROP POLICY IF EXISTS "Admins can manage content suggestions" ON public.content_suggestions;
CREATE POLICY "Admins can manage content suggestions"
ON public.content_suggestions FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_social_posts_status ON public.social_media_posts(status);
CREATE INDEX IF NOT EXISTS idx_social_posts_created_at ON public.social_media_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_social_posts_scheduled ON public.social_media_posts(scheduled_for) WHERE status = 'scheduled';

CREATE INDEX IF NOT EXISTS idx_articles_status ON public.articles(status);
CREATE INDEX IF NOT EXISTS idx_articles_slug ON public.articles(slug);
CREATE INDEX IF NOT EXISTS idx_articles_published_at ON public.articles(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_author ON public.articles(author_id);

CREATE INDEX IF NOT EXISTS idx_article_comments_article ON public.article_comments(article_id);
CREATE INDEX IF NOT EXISTS idx_article_comments_approved ON public.article_comments(is_approved);

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================

DROP TRIGGER IF EXISTS update_ai_configuration_updated_at ON public.ai_configuration;
CREATE TRIGGER update_ai_configuration_updated_at
BEFORE UPDATE ON public.ai_configuration
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_ai_models_updated_at ON public.ai_models;
CREATE TRIGGER update_ai_models_updated_at
BEFORE UPDATE ON public.ai_models
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_social_webhooks_updated_at ON public.social_media_webhooks;
CREATE TRIGGER update_social_webhooks_updated_at
BEFORE UPDATE ON public.social_media_webhooks
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_articles_updated_at ON public.articles;
CREATE TRIGGER update_articles_updated_at
BEFORE UPDATE ON public.articles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_article_comments_updated_at ON public.article_comments;
CREATE TRIGGER update_article_comments_updated_at
BEFORE UPDATE ON public.article_comments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_article_webhooks_updated_at ON public.article_webhooks;
CREATE TRIGGER update_article_webhooks_updated_at
BEFORE UPDATE ON public.article_webhooks
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_content_suggestions_updated_at ON public.content_suggestions;
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
('temperature_creative', '0.7', 'Temperature for creative content generation')
ON CONFLICT DO NOTHING;

-- ============================================
-- DEFAULT AI MODELS
-- ============================================

INSERT INTO public.ai_models (model_id, model_name, provider, description, context_window, max_output_tokens, supports_vision, is_active) VALUES
('google/gemini-2.5-flash', 'Gemini 2.5 Flash', 'Google', 'Balanced choice: fast, cost-effective, good for most tasks', 1000000, 8192, true, true),
('google/gemini-2.5-pro', 'Gemini 2.5 Pro', 'Google', 'Top-tier: Best for complex reasoning and visual content', 2000000, 8192, true, true),
('google/gemini-2.5-flash-lite', 'Gemini 2.5 Flash Lite', 'Google', 'Fastest and cheapest: Good for simple tasks', 1000000, 8192, false, true),
('openai/gpt-5-mini', 'GPT-5 Mini', 'OpenAI', 'Middle ground: Strong performance without high cost', 128000, 16384, true, true),
('openai/gpt-5', 'GPT-5', 'OpenAI', 'Powerful all-rounder: Excellent reasoning and accuracy', 128000, 16384, true, true);-- Add authentication configuration fields to ai_models table
ALTER TABLE public.ai_models
ADD COLUMN auth_type text DEFAULT 'bearer' CHECK (auth_type IN ('bearer', 'x-api-key')),
ADD COLUMN secret_name text,
ADD COLUMN api_endpoint text
ON CONFLICT DO NOTHING;

COMMENT ON COLUMN public.ai_models.auth_type IS 'Authentication method: bearer or x-api-key';
COMMENT ON COLUMN public.ai_models.secret_name IS 'Name of the secret in Supabase (e.g., CLAUDE_API_KEY)';
COMMENT ON COLUMN public.ai_models.api_endpoint IS 'API endpoint URL for this model';

-- Update existing models with default values
UPDATE public.ai_models
SET auth_type = 'bearer',
    secret_name = 'LOVABLE_API_KEY',
    api_endpoint = 'https://ai.gateway.lovable.dev/v1/chat/completions'
WHERE provider IN ('google', 'openai');-- Update existing Google and OpenAI models with correct secret and endpoint
UPDATE public.ai_models
SET 
  secret_name = 'LOVABLE_API_KEY',
  api_endpoint = 'https://ai.gateway.lovable.dev/v1/chat/completions'
WHERE provider IN ('google', 'openai', 'Google', 'OpenAI')
  AND (secret_name IS NULL OR api_endpoint IS NULL);-- Add missing columns to article_webhooks table
ALTER TABLE public.article_webhooks
ADD COLUMN IF NOT EXISTS user_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
ADD COLUMN IF NOT EXISTS name TEXT NOT NULL DEFAULT 'Default Webhook';

-- Create index on user_id
CREATE INDEX IF NOT EXISTS idx_article_webhooks_user_id ON public.article_webhooks(user_id);

-- Enable RLS
ALTER TABLE public.article_webhooks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can manage their own webhooks" ON public.article_webhooks;

-- Create comprehensive policy
DROP POLICY IF EXISTS "Users can manage their own webhooks" ON public.article_webhooks;
CREATE POLICY "Users can manage their own webhooks"
ON public.article_webhooks
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Add trigger for updated_at if it doesn't exist
DROP TRIGGER IF EXISTS update_article_webhooks_updated_at ON public.article_webhooks;
DROP TRIGGER IF EXISTS update_article_webhooks_updated_at ON public.article_webhooks;
CREATE TRIGGER update_article_webhooks_updated_at
BEFORE UPDATE ON public.article_webhooks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();-- Add 'marketing' to content_type allowed values
ALTER TABLE public.social_media_posts DROP CONSTRAINT social_media_posts_content_type_check;
ALTER TABLE public.social_media_posts ADD CONSTRAINT social_media_posts_content_type_check 
  CHECK (content_type = ANY (ARRAY['property_highlight'::text, 'market_update'::text, 'agent_tip'::text, 'community_spotlight'::text, 'success_story'::text, 'general'::text, 'marketing'::text]));

-- Add 'agent_signup' to subject_type allowed values
ALTER TABLE public.social_media_posts DROP CONSTRAINT social_media_posts_subject_type_check;
ALTER TABLE public.social_media_posts ADD CONSTRAINT social_media_posts_subject_type_check 
  CHECK (subject_type = ANY (ARRAY['listing_of_the_day'::text, 'market_analysis'::text, 'buyer_seller_tip'::text, 'neighborhood_feature'::text, 'testimonial_highlight'::text, 'special_announcement'::text, 'agent_signup'::text]));

-- Add 'multi_platform' to platform_type allowed values
ALTER TABLE public.social_media_posts DROP CONSTRAINT social_media_posts_platform_type_check;
ALTER TABLE public.social_media_posts ADD CONSTRAINT social_media_posts_platform_type_check 
  CHECK (platform_type = ANY (ARRAY['twitter_threads'::text, 'facebook_linkedin'::text, 'instagram'::text, 'combined'::text, 'multi_platform'::text]));-- Add 'purchase' and 'sale' to testimonials transaction_type allowed values
ALTER TABLE public.testimonials DROP CONSTRAINT IF EXISTS testimonials_transaction_type_check;
ALTER TABLE public.testimonials ADD CONSTRAINT testimonials_transaction_type_check 
  CHECK (transaction_type IS NULL OR transaction_type = ANY (ARRAY['purchase'::text, 'sale'::text, 'buyer'::text, 'seller'::text]));-- Create the listings storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('listings', 'listings', true)
ON CONFLICT DO NOTHING;

-- Allow public read access to all files in the listings bucket
DROP POLICY IF EXISTS "Public read access for listing images" ON storage.objects;
CREATE POLICY "Public read access for listing images"
ON storage.objects FOR SELECT
USING (bucket_id = 'listings');

-- Allow authenticated users to upload listing images
DROP POLICY IF EXISTS "Authenticated users can upload listing images" ON storage.objects;
CREATE POLICY "Authenticated users can upload listing images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'listings' 
  AND auth.uid() IS NOT NULL
);

-- Allow users to update their own listing images
DROP POLICY IF EXISTS "Users can update listing images" ON storage.objects;
CREATE POLICY "Users can update listing images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'listings'
  AND auth.uid() IS NOT NULL
);

-- Allow users to delete their own listing images
DROP POLICY IF EXISTS "Users can delete listing images" ON storage.objects;
CREATE POLICY "Users can delete listing images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'listings'
  AND auth.uid() IS NOT NULL
);-- Add profile visibility settings to user_settings table
ALTER TABLE user_settings 
ADD COLUMN IF NOT EXISTS show_listings boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS show_sold_properties boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS show_testimonials boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS show_social_proof boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS show_contact_buttons boolean DEFAULT true;-- Fix check_username_available function to be STABLE for index compatibility
CREATE OR REPLACE FUNCTION check_username_available(
  _username TEXT,
  _current_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Check if username exists for a different user
  RETURN NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE LOWER(username) = LOWER(_username)
    AND id != _current_user_id
  );
END;
$$;-- Create custom_pages table for Page Builder
CREATE TABLE IF NOT EXISTS public.custom_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  blocks JSONB NOT NULL DEFAULT '[]'::jsonb,
  theme JSONB NOT NULL DEFAULT '{
    "preset": "default",
    "colors": {
      "primary": "#3b82f6",
      "secondary": "#8b5cf6",
      "background": "#ffffff",
      "text": "#1f2937",
      "accent": "#10b981"
    },
    "font": "inter",
    "borderRadius": "medium",
    "spacing": "normal"
  }'::jsonb,
  seo JSONB NOT NULL DEFAULT '{
    "title": "",
    "description": "",
    "keywords": [],
    "ogImage": "",
    "twitterCard": "summary_large_image",
    "structuredData": null
  }'::jsonb,
  published BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_at TIMESTAMPTZ,
  UNIQUE(user_id, slug)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_custom_pages_user_id ON public.custom_pages(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_pages_slug ON public.custom_pages(slug);
CREATE INDEX IF NOT EXISTS idx_custom_pages_active ON public.custom_pages(user_id, is_active) WHERE is_active = true;

-- Enable RLS
ALTER TABLE public.custom_pages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view their own pages" ON public.custom_pages;
CREATE POLICY "Users can view their own pages"
  ON public.custom_pages
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own pages" ON public.custom_pages;
CREATE POLICY "Users can create their own pages"
  ON public.custom_pages
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own pages" ON public.custom_pages;
CREATE POLICY "Users can update their own pages"
  ON public.custom_pages
  FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own pages" ON public.custom_pages;
CREATE POLICY "Users can delete their own pages"
  ON public.custom_pages
  FOR DELETE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can view published pages" ON public.custom_pages;
CREATE POLICY "Anyone can view published pages"
  ON public.custom_pages
  FOR SELECT
  USING (published = true);

-- Trigger to update updated_at timestamp
DROP TRIGGER IF EXISTS update_custom_pages_updated_at ON public.custom_pages;
CREATE TRIGGER update_custom_pages_updated_at
  BEFORE UPDATE ON public.custom_pages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to set published_at when publishing
CREATE OR REPLACE FUNCTION public.set_published_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.published = true AND OLD.published = false THEN
    NEW.published_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS set_custom_page_published_at ON public.custom_pages;
CREATE TRIGGER set_custom_page_published_at
  BEFORE UPDATE ON public.custom_pages
  FOR EACH ROW
  EXECUTE FUNCTION public.set_published_at();

-- Trigger to ensure only one active page per user
CREATE OR REPLACE FUNCTION public.ensure_single_active_page()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_active = true THEN
    UPDATE public.custom_pages
    SET is_active = false
    WHERE user_id = NEW.user_id
      AND id != NEW.id
      AND is_active = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER ensure_single_active_page_trigger
  BEFORE INSERT OR UPDATE ON public.custom_pages
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_single_active_page();-- Update content_suggestions table to support queue workflow
ALTER TABLE public.content_suggestions 
  ADD COLUMN IF NOT EXISTS keywords text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS generated_article_id uuid REFERENCES public.articles(id) ON DELETE SET NULL;

-- Update status check to include new workflow statuses
COMMENT ON COLUMN public.content_suggestions.status IS 'Status: pending, queued, in_progress, completed, rejected';

-- Create index for faster querying
CREATE INDEX IF NOT EXISTS idx_content_suggestions_status ON public.content_suggestions(status);
CREATE INDEX IF NOT EXISTS idx_content_suggestions_priority ON public.content_suggestions(priority DESC);-- Enable RLS on content_suggestions table
ALTER TABLE public.content_suggestions ENABLE ROW LEVEL SECURITY;

-- Allow admins to manage all suggestions
DROP POLICY IF EXISTS "Admins can manage all suggestions" ON public.content_suggestions;
CREATE POLICY "Admins can manage all suggestions"
ON public.content_suggestions
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow viewing of suggestions
DROP POLICY IF EXISTS "Authenticated users can view suggestions" ON public.content_suggestions;
CREATE POLICY "Authenticated users can view suggestions"
ON public.content_suggestions
FOR SELECT
TO authenticated
USING (true);-- Drop the old check constraint
ALTER TABLE public.content_suggestions 
  DROP CONSTRAINT IF EXISTS content_suggestions_status_check;

-- Add new check constraint with all required statuses
ALTER TABLE public.content_suggestions
  ADD CONSTRAINT content_suggestions_status_check 
  CHECK (status IN ('pending', 'queued', 'in_progress', 'completed', 'rejected'));-- ============================================
-- SEO MANAGEMENT SYSTEM - CORE TABLES
-- ============================================
-- Migration 1 of 6: Core SEO Management Tables
-- Tables: seo_settings, seo_audit_history, seo_fixes_applied, seo_keywords, seo_keyword_history

-- ============================================
-- SEO SETTINGS TABLE
-- ============================================
-- Stores global SEO configuration and meta tags

CREATE TABLE IF NOT EXISTS public.seo_settings (
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

CREATE TABLE IF NOT EXISTS public.seo_audit_history (
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

CREATE TABLE IF NOT EXISTS public.seo_fixes_applied (
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

CREATE TABLE IF NOT EXISTS public.seo_keywords (
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

CREATE TABLE IF NOT EXISTS public.seo_keyword_history (
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
CREATE INDEX IF NOT EXISTS idx_seo_settings_site_url ON public.seo_settings(site_url);

-- Audit History indexes
CREATE INDEX IF NOT EXISTS idx_seo_audit_url ON public.seo_audit_history(url);
CREATE INDEX IF NOT EXISTS idx_seo_audit_created_at ON public.seo_audit_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_seo_audit_type ON public.seo_audit_history(audit_type);
CREATE INDEX IF NOT EXISTS idx_seo_audit_score ON public.seo_audit_history(overall_score DESC);

-- Fixes Applied indexes
CREATE INDEX IF NOT EXISTS idx_seo_fixes_audit_id ON public.seo_fixes_applied(audit_id);
CREATE INDEX IF NOT EXISTS idx_seo_fixes_url ON public.seo_fixes_applied(url);
CREATE INDEX IF NOT EXISTS idx_seo_fixes_status ON public.seo_fixes_applied(status);
CREATE INDEX IF NOT EXISTS idx_seo_fixes_type ON public.seo_fixes_applied(fix_type);
CREATE INDEX IF NOT EXISTS idx_seo_fixes_created_at ON public.seo_fixes_applied(created_at DESC);

-- Keywords indexes
CREATE INDEX IF NOT EXISTS idx_seo_keywords_keyword ON public.seo_keywords(keyword);
CREATE INDEX IF NOT EXISTS idx_seo_keywords_url ON public.seo_keywords(target_url);
CREATE INDEX IF NOT EXISTS idx_seo_keywords_active ON public.seo_keywords(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_seo_keywords_ranking ON public.seo_keywords(is_ranking) WHERE is_ranking = true;
CREATE INDEX IF NOT EXISTS idx_seo_keywords_position ON public.seo_keywords(current_position);
CREATE INDEX IF NOT EXISTS idx_seo_keywords_category ON public.seo_keywords(category);
CREATE INDEX IF NOT EXISTS idx_seo_keywords_priority ON public.seo_keywords(priority DESC);

-- Keyword History indexes
CREATE INDEX IF NOT EXISTS idx_seo_keyword_history_keyword_id ON public.seo_keyword_history(keyword_id);
CREATE INDEX IF NOT EXISTS idx_seo_keyword_history_recorded_at ON public.seo_keyword_history(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_seo_keyword_history_search_engine ON public.seo_keyword_history(search_engine);

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
DROP POLICY IF EXISTS "Admins can manage SEO settings" ON public.seo_settings;
CREATE POLICY "Admins can manage SEO settings"
ON public.seo_settings FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Public can view SEO settings" ON public.seo_settings;
CREATE POLICY "Public can view SEO settings"
ON public.seo_settings FOR SELECT
USING (true);

-- Audit History policies
DROP POLICY IF EXISTS "Admins can manage audit history" ON public.seo_audit_history;
CREATE POLICY "Admins can manage audit history"
ON public.seo_audit_history FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Users can view their own audits" ON public.seo_audit_history;
CREATE POLICY "Users can view their own audits"
ON public.seo_audit_history FOR SELECT
USING (auth.uid() = performed_by OR public.has_role(auth.uid(), 'admin'::app_role));

-- Fixes Applied policies
DROP POLICY IF EXISTS "Admins can manage SEO fixes" ON public.seo_fixes_applied;
CREATE POLICY "Admins can manage SEO fixes"
ON public.seo_fixes_applied FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Users can view their own fixes" ON public.seo_fixes_applied;
CREATE POLICY "Users can view their own fixes"
ON public.seo_fixes_applied FOR SELECT
USING (auth.uid() = applied_by OR public.has_role(auth.uid(), 'admin'::app_role));

-- Keywords policies
DROP POLICY IF EXISTS "Admins can manage SEO keywords" ON public.seo_keywords;
CREATE POLICY "Admins can manage SEO keywords"
ON public.seo_keywords FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Public can view active keywords" ON public.seo_keywords;
CREATE POLICY "Public can view active keywords"
ON public.seo_keywords FOR SELECT
USING (is_active = true);

-- Keyword History policies
DROP POLICY IF EXISTS "Admins can manage keyword history" ON public.seo_keyword_history;
CREATE POLICY "Admins can manage keyword history"
ON public.seo_keyword_history FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Public can view keyword history" ON public.seo_keyword_history;
CREATE POLICY "Public can view keyword history"
ON public.seo_keyword_history FOR SELECT
USING (true);

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================

DROP TRIGGER IF EXISTS update_seo_settings_updated_at ON public.seo_settings;
CREATE TRIGGER update_seo_settings_updated_at
BEFORE UPDATE ON public.seo_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_seo_fixes_applied_updated_at ON public.seo_fixes_applied;
CREATE TRIGGER update_seo_fixes_applied_updated_at
BEFORE UPDATE ON public.seo_fixes_applied
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_seo_keywords_updated_at ON public.seo_keywords;
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
COMMENT ON TABLE public.seo_keyword_history IS 'Historical tracking of keyword positions over time';-- Migration 2: Google Search Console Integration
-- Tables: gsc_oauth_credentials, gsc_properties, gsc_keyword_performance, gsc_page_performance

CREATE TABLE IF NOT EXISTS public.gsc_oauth_credentials (
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

CREATE TABLE IF NOT EXISTS public.gsc_properties (
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

CREATE TABLE IF NOT EXISTS public.gsc_keyword_performance (
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

CREATE TABLE IF NOT EXISTS public.gsc_page_performance (
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
CREATE INDEX IF NOT EXISTS idx_gsc_oauth_user_id ON public.gsc_oauth_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_gsc_oauth_active ON public.gsc_oauth_credentials(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_gsc_properties_user_id ON public.gsc_properties(user_id);
CREATE INDEX IF NOT EXISTS idx_gsc_keyword_property_id ON public.gsc_keyword_performance(property_id);
CREATE INDEX IF NOT EXISTS idx_gsc_keyword_query ON public.gsc_keyword_performance(query);
CREATE INDEX IF NOT EXISTS idx_gsc_keyword_date ON public.gsc_keyword_performance(date DESC);
CREATE INDEX IF NOT EXISTS idx_gsc_page_property_id ON public.gsc_page_performance(property_id);
CREATE INDEX IF NOT EXISTS idx_gsc_page_url ON public.gsc_page_performance(url);
CREATE INDEX IF NOT EXISTS idx_gsc_page_date ON public.gsc_page_performance(date DESC);

-- RLS
ALTER TABLE public.gsc_oauth_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gsc_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gsc_keyword_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gsc_page_performance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own GSC credentials" ON public.gsc_oauth_credentials;
CREATE POLICY "Users can manage their own GSC credentials"
ON public.gsc_oauth_credentials FOR ALL
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own GSC properties" ON public.gsc_properties;
CREATE POLICY "Users can manage their own GSC properties"
ON public.gsc_properties FOR ALL
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own GSC keyword data" ON public.gsc_keyword_performance;
CREATE POLICY "Users can view their own GSC keyword data"
ON public.gsc_keyword_performance FOR SELECT
USING (EXISTS (SELECT 1 FROM public.gsc_properties WHERE gsc_properties.id = gsc_keyword_performance.property_id AND gsc_properties.user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can view their own GSC page data" ON public.gsc_page_performance;
CREATE POLICY "Users can view their own GSC page data"
ON public.gsc_page_performance FOR SELECT
USING (EXISTS (SELECT 1 FROM public.gsc_properties WHERE gsc_properties.id = gsc_page_performance.property_id AND gsc_properties.user_id = auth.uid()));

DROP TRIGGER IF EXISTS update_gsc_oauth_credentials_updated_at ON public.gsc_oauth_credentials;
CREATE TRIGGER update_gsc_oauth_credentials_updated_at
BEFORE UPDATE ON public.gsc_oauth_credentials
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_gsc_properties_updated_at ON public.gsc_properties;
CREATE TRIGGER update_gsc_properties_updated_at
BEFORE UPDATE ON public.gsc_properties
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();-- Migration 3: SEO Automated Monitoring
-- Tables: seo_notification_preferences, seo_alert_rules, seo_alerts, seo_monitoring_schedules, seo_monitoring_log

CREATE TABLE IF NOT EXISTS public.seo_notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email_enabled BOOLEAN DEFAULT true,
  email_address TEXT,
  slack_enabled BOOLEAN DEFAULT false,
  slack_webhook_url TEXT,
  in_app_enabled BOOLEAN DEFAULT true,
  critical_alerts BOOLEAN DEFAULT true,
  ranking_changes BOOLEAN DEFAULT true,
  performance_alerts BOOLEAN DEFAULT true,
  security_alerts BOOLEAN DEFAULT true,
  broken_links BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT one_preference_per_user UNIQUE (user_id)
);

CREATE TABLE IF NOT EXISTS public.seo_alert_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('ranking_drop', 'ranking_increase', 'traffic_drop', 'broken_links', 'security_issue', 'mobile_usability', 'crawl_error', 'duplicate_content', 'missing_meta_tags', 'custom')),
  severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  conditions JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  last_triggered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.seo_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_rule_id UUID REFERENCES seo_alert_rules(id) ON DELETE SET NULL,
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  affected_url TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'acknowledged', 'resolved', 'ignored')),
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.seo_monitoring_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  schedule_type TEXT NOT NULL CHECK (schedule_type IN ('full_audit', 'keyword_check', 'broken_links', 'security_scan')),
  target_url TEXT NOT NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('hourly', 'daily', 'weekly', 'monthly')),
  is_active BOOLEAN DEFAULT true,
  next_run_at TIMESTAMP WITH TIME ZONE,
  last_run_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.seo_monitoring_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID REFERENCES seo_monitoring_schedules(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('started', 'completed', 'failed')),
  results_summary JSONB DEFAULT '{}',
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_seo_alerts_status ON public.seo_alerts(status);
CREATE INDEX IF NOT EXISTS idx_seo_alerts_severity ON public.seo_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_seo_alerts_user_id ON public.seo_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_seo_schedules_active ON public.seo_monitoring_schedules(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_seo_schedules_next_run ON public.seo_monitoring_schedules(next_run_at);

-- RLS
ALTER TABLE public.seo_notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_alert_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_monitoring_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_monitoring_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own notification preferences" ON public.seo_notification_preferences;
CREATE POLICY "Users can manage their own notification preferences"
ON public.seo_notification_preferences FOR ALL
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage alert rules" ON public.seo_alert_rules;
CREATE POLICY "Admins can manage alert rules"
ON public.seo_alert_rules FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can manage all alerts" ON public.seo_alerts;
CREATE POLICY "Admins can manage all alerts"
ON public.seo_alerts FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Users can view their own alerts" ON public.seo_alerts;
CREATE POLICY "Users can view their own alerts"
ON public.seo_alerts FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage monitoring schedules" ON public.seo_monitoring_schedules;
CREATE POLICY "Admins can manage monitoring schedules"
ON public.seo_monitoring_schedules FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can view monitoring logs" ON public.seo_monitoring_log;
CREATE POLICY "Admins can view monitoring logs"
ON public.seo_monitoring_log FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP TRIGGER IF EXISTS update_seo_notif_pref_updated_at ON public.seo_notification_preferences;
CREATE TRIGGER update_seo_notif_pref_updated_at
BEFORE UPDATE ON public.seo_notification_preferences
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_seo_alert_rules_updated_at ON public.seo_alert_rules;
CREATE TRIGGER update_seo_alert_rules_updated_at
BEFORE UPDATE ON public.seo_alert_rules
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_seo_alerts_updated_at ON public.seo_alerts;
CREATE TRIGGER update_seo_alerts_updated_at
BEFORE UPDATE ON public.seo_alerts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();-- ============================================
-- SEO MANAGEMENT SYSTEM - CORE TABLES
-- ============================================
-- Migration 1 of 6: Core SEO Management Tables
-- Tables: seo_settings, seo_audit_history, seo_fixes_applied, seo_keywords, seo_keyword_history

-- ============================================
-- SEO SETTINGS TABLE
-- ============================================
-- Stores global SEO configuration and meta tags

CREATE TABLE IF NOT EXISTS public.seo_settings (
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

CREATE TABLE IF NOT EXISTS public.seo_audit_history (
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