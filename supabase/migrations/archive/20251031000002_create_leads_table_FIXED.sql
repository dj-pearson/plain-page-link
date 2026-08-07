-- Create leads table for inquiry capture
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Lead Contact Info
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT,
  
  -- Type & Context
  lead_type TEXT NOT NULL, -- buyer, seller, valuation, contact
  listing_id UUID REFERENCES public.listings(id) ON DELETE SET NULL,
  
  -- Lead Details (optional, depends on form type)
  price_range TEXT, -- For buyer inquiries
  timeline TEXT, -- When they want to buy/sell
  property_address TEXT, -- For seller/valuation forms
  preapproved BOOLEAN, -- For buyer inquiries
  
  -- Status Management
  status TEXT DEFAULT 'new', -- new, contacted, qualified, nurturing, closed, lost
  notes TEXT, -- Agent's private notes
  
  -- Tracking & Attribution
  referrer_url TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  device TEXT, -- mobile, desktop, tablet
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  contacted_at TIMESTAMPTZ, -- When agent first contacted lead
  closed_at TIMESTAMPTZ -- When deal closed or lead lost
);

-- Enable RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Create indexes (with IF NOT EXISTS check)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_leads_user_id') THEN
    CREATE INDEX idx_leads_user_id ON public.leads(user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_leads_status') THEN
    CREATE INDEX idx_leads_status ON public.leads(status);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_leads_created_at') THEN
    CREATE INDEX idx_leads_created_at ON public.leads(created_at DESC);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_leads_email') THEN
    CREATE INDEX idx_leads_email ON public.leads(email);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_leads_lead_type') THEN
    CREATE INDEX idx_leads_lead_type ON public.leads(lead_type);
  END IF;
END $$;

-- RLS Policies (drop if exists, then recreate)
DROP POLICY IF EXISTS "Users can view their own leads" ON public.leads;
CREATE POLICY "Users can view their own leads"
  ON public.leads FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can submit leads" ON public.leads;
CREATE POLICY "Anyone can submit leads"
  ON public.leads FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update their own leads" ON public.leads;
CREATE POLICY "Users can update their own leads"
  ON public.leads FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own leads" ON public.leads;
CREATE POLICY "Users can delete their own leads"
  ON public.leads FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger to update updated_at timestamp
DROP TRIGGER IF EXISTS update_leads_updated_at ON public.leads;
CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to send email notification when lead is created
CREATE OR REPLACE FUNCTION public.notify_new_lead()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- This function will trigger the edge function to send email
  -- We'll implement the actual email sending in Edge Functions
  PERFORM pg_notify('new_lead', json_build_object(
    'lead_id', NEW.id,
    'user_id', NEW.user_id,
    'lead_type', NEW.lead_type,
    'name', NEW.name,
    'email', NEW.email
  )::text);
  
  RETURN NEW;
END;
$$;

-- Trigger to notify on new lead
DROP TRIGGER IF EXISTS on_lead_created ON public.leads;
CREATE TRIGGER on_lead_created
  AFTER INSERT ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_lead();

-- Comments for documentation
COMMENT ON TABLE public.leads IS 'Lead inquiries from public profile pages';
COMMENT ON COLUMN public.leads.lead_type IS 'buyer = wants to purchase, seller = wants to list property, valuation = wants home value estimate, contact = general inquiry';
COMMENT ON COLUMN public.leads.status IS 'new = just submitted, contacted = agent reached out, qualified = serious buyer/seller, nurturing = ongoing communication, closed = deal completed, lost = did not convert';

