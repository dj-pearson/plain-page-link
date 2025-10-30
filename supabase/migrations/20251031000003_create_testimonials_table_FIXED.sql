-- Create testimonials table for client reviews
CREATE TABLE IF NOT EXISTS public.testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Client Information
  client_name TEXT NOT NULL,
  client_photo TEXT, -- URL to photo in storage
  client_title TEXT, -- e.g., "First-Time Homebuyer", "Relocating Family"
  
  -- Review Content
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  review_text TEXT NOT NULL CHECK (char_length(review_text) <= 1000),
  
  -- Transaction Details
  property_type TEXT, -- e.g., "Single Family Home", "Condo"
  transaction_type TEXT CHECK (transaction_type IN ('buyer', 'seller')),
  date DATE, -- When the transaction occurred
  listing_id UUID REFERENCES public.listings(id) ON DELETE SET NULL, -- Optional link to sold property
  
  -- Display Settings
  is_featured BOOLEAN DEFAULT FALSE,
  is_published BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

-- Create indexes (with IF NOT EXISTS check)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_testimonials_user_id') THEN
    CREATE INDEX idx_testimonials_user_id ON public.testimonials(user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_testimonials_rating') THEN
    CREATE INDEX idx_testimonials_rating ON public.testimonials(rating);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_testimonials_featured') THEN
    CREATE INDEX idx_testimonials_featured ON public.testimonials(is_featured) WHERE is_featured = TRUE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_testimonials_published') THEN
    CREATE INDEX idx_testimonials_published ON public.testimonials(is_published) WHERE is_published = TRUE;
  END IF;
END $$;

-- RLS Policies (drop if exists, then recreate)
DROP POLICY IF EXISTS "Anyone can view published testimonials" ON public.testimonials;
CREATE POLICY "Anyone can view published testimonials"
  ON public.testimonials FOR SELECT
  USING (is_published = TRUE);

DROP POLICY IF EXISTS "Users can view their own testimonials" ON public.testimonials;
CREATE POLICY "Users can view their own testimonials"
  ON public.testimonials FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own testimonials" ON public.testimonials;
CREATE POLICY "Users can insert their own testimonials"
  ON public.testimonials FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own testimonials" ON public.testimonials;
CREATE POLICY "Users can update their own testimonials"
  ON public.testimonials FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own testimonials" ON public.testimonials;
CREATE POLICY "Users can delete their own testimonials"
  ON public.testimonials FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger to update updated_at timestamp
DROP TRIGGER IF EXISTS update_testimonials_updated_at ON public.testimonials;
CREATE TRIGGER update_testimonials_updated_at
  BEFORE UPDATE ON public.testimonials
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE public.testimonials IS 'Client testimonials and reviews for real estate agents';
COMMENT ON COLUMN public.testimonials.rating IS 'Star rating from 1 to 5';
COMMENT ON COLUMN public.testimonials.is_featured IS 'Show in featured/prominent positions on profile';
COMMENT ON COLUMN public.testimonials.is_published IS 'Hide testimonial without deleting it';

