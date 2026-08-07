-- Create custom_pages table for Page Builder
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
CREATE INDEX idx_custom_pages_user_id ON public.custom_pages(user_id);
CREATE INDEX idx_custom_pages_slug ON public.custom_pages(slug);
CREATE INDEX idx_custom_pages_active ON public.custom_pages(user_id, is_active) WHERE is_active = true;

-- Enable RLS
ALTER TABLE public.custom_pages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own pages"
  ON public.custom_pages
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own pages"
  ON public.custom_pages
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pages"
  ON public.custom_pages
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own pages"
  ON public.custom_pages
  FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view published pages"
  ON public.custom_pages
  FOR SELECT
  USING (published = true);

-- Trigger to update updated_at timestamp
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
  EXECUTE FUNCTION public.ensure_single_active_page();