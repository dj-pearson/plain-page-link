-- Create keywords table for tracking keyword usage
CREATE TABLE public.keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword TEXT NOT NULL UNIQUE,
  category TEXT DEFAULT 'General',
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  difficulty TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  search_volume INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for fast lookup of unused keywords
CREATE INDEX idx_keywords_active ON public.keywords(is_active);
CREATE INDEX idx_keywords_usage ON public.keywords(usage_count, last_used_at) WHERE is_active = true;
CREATE INDEX idx_keywords_category ON public.keywords(category);

-- Add keyword_id reference to articles table
ALTER TABLE public.articles
ADD COLUMN keyword_id UUID REFERENCES public.keywords(id) ON DELETE SET NULL;

CREATE INDEX idx_articles_keyword ON public.articles(keyword_id);

-- Function to automatically update keywords when article is created
CREATE OR REPLACE FUNCTION update_keyword_usage()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.keyword_id IS NOT NULL THEN
    UPDATE public.keywords
    SET
      usage_count = usage_count + 1,
      last_used_at = now(),
      updated_at = now()
    WHERE id = NEW.keyword_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update keyword usage when article is published
CREATE TRIGGER trigger_update_keyword_usage
  AFTER INSERT OR UPDATE OF status ON public.articles
  FOR EACH ROW
  WHEN (NEW.status = 'published')
  EXECUTE FUNCTION update_keyword_usage();

-- RLS Policies for keywords table
ALTER TABLE public.keywords ENABLE ROW LEVEL SECURITY;

-- Anyone can view active keywords
CREATE POLICY "Anyone can view active keywords"
  ON public.keywords
  FOR SELECT
  USING (is_active = true);

-- Only admins can insert keywords
CREATE POLICY "Only admins can insert keywords"
  ON public.keywords
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Only admins can update keywords
CREATE POLICY "Only admins can update keywords"
  ON public.keywords
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Only admins can delete keywords
CREATE POLICY "Only admins can delete keywords"
  ON public.keywords
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Comment on table
COMMENT ON TABLE public.keywords IS 'Stores SEO keywords with usage tracking to ensure fresh, non-duplicate content generation';
