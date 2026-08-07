-- Create testimonials table for client reviews
-- This version handles existing tables by adding missing columns

-- Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  client_name TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  review_text TEXT NOT NULL CHECK (char_length(review_text) <= 1000),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add columns if they don't exist
DO $$ 
BEGIN
  -- Client Information
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='testimonials' AND column_name='client_photo') THEN
    ALTER TABLE public.testimonials ADD COLUMN client_photo TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='testimonials' AND column_name='client_title') THEN
    ALTER TABLE public.testimonials ADD COLUMN client_title TEXT;
  END IF;
  
  -- Transaction Details
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='testimonials' AND column_name='property_type') THEN
    ALTER TABLE public.testimonials ADD COLUMN property_type TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='testimonials' AND column_name='transaction_type') THEN
    ALTER TABLE public.testimonials ADD COLUMN transaction_type TEXT CHECK (transaction_type IN ('buyer', 'seller'));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='testimonials' AND column_name='date') THEN
    ALTER TABLE public.testimonials ADD COLUMN date DATE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='testimonials' AND column_name='listing_id') THEN
    ALTER TABLE public.testimonials ADD COLUMN listing_id UUID REFERENCES public.listings(id) ON DELETE SET NULL;
  END IF;
  
  -- Display Settings
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='testimonials' AND column_name='is_featured') THEN
    ALTER TABLE public.testimonials ADD COLUMN is_featured BOOLEAN DEFAULT FALSE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='testimonials' AND column_name='is_published') THEN
    ALTER TABLE public.testimonials ADD COLUMN is_published BOOLEAN DEFAULT TRUE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='testimonials' AND column_name='sort_order') THEN
    ALTER TABLE public.testimonials ADD COLUMN sort_order INTEGER DEFAULT 0;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

-- Create indexes (only after ensuring columns exist)
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

-- RLS Policies
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

-- Comments
COMMENT ON TABLE public.testimonials IS 'Client testimonials and reviews for real estate agents';
COMMENT ON COLUMN public.testimonials.rating IS 'Star rating from 1 to 5';
COMMENT ON COLUMN public.testimonials.is_featured IS 'Show in featured/prominent positions on profile';
COMMENT ON COLUMN public.testimonials.is_published IS 'Hide testimonial without deleting it';

