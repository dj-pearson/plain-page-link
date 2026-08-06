-- Create listings table for property showcase
-- This version handles existing tables by adding missing columns

-- Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  price DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add columns if they don't exist (for existing tables)
DO $$ 
BEGIN
  -- Property Info
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='listings' AND column_name='bedrooms') THEN
    ALTER TABLE public.listings ADD COLUMN bedrooms DECIMAL(3,1);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='listings' AND column_name='bathrooms') THEN
    ALTER TABLE public.listings ADD COLUMN bathrooms DECIMAL(3,1);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='listings' AND column_name='square_feet') THEN
    ALTER TABLE public.listings ADD COLUMN square_feet INTEGER;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='listings' AND column_name='lot_size_acres') THEN
    ALTER TABLE public.listings ADD COLUMN lot_size_acres DECIMAL(10,2);
  END IF;
  
  -- Details
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='listings' AND column_name='property_type') THEN
    ALTER TABLE public.listings ADD COLUMN property_type TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='listings' AND column_name='description') THEN
    ALTER TABLE public.listings ADD COLUMN description TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='listings' AND column_name='status') THEN
    ALTER TABLE public.listings ADD COLUMN status TEXT DEFAULT 'active';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='listings' AND column_name='mls_number') THEN
    ALTER TABLE public.listings ADD COLUMN mls_number TEXT;
  END IF;
  
  -- Dates
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='listings' AND column_name='listed_date') THEN
    ALTER TABLE public.listings ADD COLUMN listed_date DATE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='listings' AND column_name='sold_date') THEN
    ALTER TABLE public.listings ADD COLUMN sold_date DATE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='listings' AND column_name='days_on_market') THEN
    ALTER TABLE public.listings ADD COLUMN days_on_market INTEGER;
  END IF;
  
  -- Media
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='listings' AND column_name='photos') THEN
    ALTER TABLE public.listings ADD COLUMN photos JSONB DEFAULT '[]'::jsonb;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='listings' AND column_name='virtual_tour_url') THEN
    ALTER TABLE public.listings ADD COLUMN virtual_tour_url TEXT;
  END IF;
  
  -- Display Settings
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='listings' AND column_name='is_featured') THEN
    ALTER TABLE public.listings ADD COLUMN is_featured BOOLEAN DEFAULT FALSE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='listings' AND column_name='sort_order') THEN
    ALTER TABLE public.listings ADD COLUMN sort_order INTEGER DEFAULT 0;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

-- Create indexes (only after ensuring columns exist)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_listings_user_id') THEN
    CREATE INDEX idx_listings_user_id ON public.listings(user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_listings_status') THEN
    CREATE INDEX idx_listings_status ON public.listings(status);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_listings_created_at') THEN
    CREATE INDEX idx_listings_created_at ON public.listings(created_at DESC);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_listings_featured') THEN
    CREATE INDEX idx_listings_featured ON public.listings(is_featured) WHERE is_featured = TRUE;
  END IF;
END $$;

-- RLS Policies
DROP POLICY IF EXISTS "Anyone can view active listings" ON public.listings;
CREATE POLICY "Anyone can view active listings"
  ON public.listings FOR SELECT
  USING (status IN ('active', 'pending', 'under_contract', 'sold'));

DROP POLICY IF EXISTS "Users can insert their own listings" ON public.listings;
CREATE POLICY "Users can insert their own listings"
  ON public.listings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own listings" ON public.listings;
CREATE POLICY "Users can update their own listings"
  ON public.listings FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own listings" ON public.listings;
CREATE POLICY "Users can delete their own listings"
  ON public.listings FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger to update updated_at timestamp
DROP TRIGGER IF EXISTS update_listings_updated_at ON public.listings;
CREATE TRIGGER update_listings_updated_at
  BEFORE UPDATE ON public.listings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Comments
COMMENT ON TABLE public.listings IS 'Property listings for real estate agents';
COMMENT ON COLUMN public.listings.photos IS 'JSONB array of photo URLs from listing-photos storage bucket';
COMMENT ON COLUMN public.listings.status IS 'active = available for sale, pending = offer accepted, under_contract = in escrow, sold = closed';

