-- Create listings table for property showcase
CREATE TABLE IF NOT EXISTS public.listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Property Info
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  price DECIMAL(12,2) NOT NULL,
  bedrooms DECIMAL(3,1),
  bathrooms DECIMAL(3,1),
  square_feet INTEGER,
  lot_size_acres DECIMAL(10,2),
  
  -- Details
  property_type TEXT, -- Single Family, Condo, Townhouse, etc.
  description TEXT,
  status TEXT DEFAULT 'active', -- active, pending, under_contract, sold
  mls_number TEXT,
  
  -- Dates
  listed_date DATE,
  sold_date DATE,
  days_on_market INTEGER,
  
  -- Media (stored as JSONB array of URLs)
  photos JSONB DEFAULT '[]'::jsonb,
  virtual_tour_url TEXT,
  
  -- Display Settings
  is_featured BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

-- Indexes for performance
CREATE INDEX idx_listings_user_id ON public.listings(user_id);
CREATE INDEX idx_listings_status ON public.listings(status);
CREATE INDEX idx_listings_created_at ON public.listings(created_at DESC);
CREATE INDEX idx_listings_featured ON public.listings(is_featured) WHERE is_featured = TRUE;

-- RLS Policies
-- Anyone can view active listings
CREATE POLICY "Anyone can view active listings"
  ON public.listings FOR SELECT
  USING (status IN ('active', 'pending', 'under_contract', 'sold'));

-- Users can manage their own listings
CREATE POLICY "Users can insert their own listings"
  ON public.listings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own listings"
  ON public.listings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own listings"
  ON public.listings FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_listings_updated_at
  BEFORE UPDATE ON public.listings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE public.listings IS 'Property listings for real estate agents';
COMMENT ON COLUMN public.listings.photos IS 'JSONB array of photo URLs from listing-photos storage bucket';
COMMENT ON COLUMN public.listings.status IS 'active = available for sale, pending = offer accepted, under_contract = in escrow, sold = closed';

