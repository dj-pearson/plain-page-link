-- Extend profiles table with real estate specific fields
-- This migration adds all the fields needed for agent profiles

-- Professional Information
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS license_number TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS license_state TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS brokerage_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS brokerage_logo TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS years_experience INTEGER;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS specialties JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS certifications JSONB DEFAULT '[]'::jsonb;

-- Service Areas
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS service_cities JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS service_zip_codes JSONB DEFAULT '[]'::jsonb;

-- Contact Information
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS sms_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email_display TEXT;

-- Social Media Links
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS instagram_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS facebook_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS linkedin_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tiktok_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS youtube_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS zillow_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS realtor_com_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS website_url TEXT;

-- SEO & Marketing
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS seo_title TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS seo_description TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS og_image TEXT; -- Open Graph image for social sharing

-- Settings
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT TRUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS custom_css TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS custom_domain TEXT UNIQUE;

-- Analytics Counters (denormalized for performance)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS lead_count INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS link_click_count INTEGER DEFAULT 0;

-- Create indexes for commonly queried fields
CREATE INDEX IF NOT EXISTS idx_profiles_license_state ON public.profiles(license_state);
CREATE INDEX IF NOT EXISTS idx_profiles_brokerage_name ON public.profiles(brokerage_name);
CREATE INDEX IF NOT EXISTS idx_profiles_is_published ON public.profiles(is_published) WHERE is_published = TRUE;
CREATE INDEX IF NOT EXISTS idx_profiles_custom_domain ON public.profiles(custom_domain) WHERE custom_domain IS NOT NULL;

-- Full text search index for agent discovery (future feature)
CREATE INDEX IF NOT EXISTS idx_profiles_full_name_search ON public.profiles 
  USING gin(to_tsvector('english', COALESCE(full_name, '')));

CREATE INDEX IF NOT EXISTS idx_profiles_bio_search ON public.profiles 
  USING gin(to_tsvector('english', COALESCE(bio, '')));

-- Function to increment view count (called from analytics tracking)
CREATE OR REPLACE FUNCTION public.increment_profile_views(_profile_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.profiles
  SET view_count = view_count + 1
  WHERE id = _profile_id;
END;
$$;

-- Function to increment lead count (called when lead is created)
CREATE OR REPLACE FUNCTION public.increment_profile_leads(_profile_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.profiles
  SET lead_count = lead_count + 1
  WHERE id = _profile_id;
END;
$$;

-- Trigger to increment lead count when new lead is created
CREATE OR REPLACE FUNCTION public.update_profile_lead_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM public.increment_profile_leads(NEW.user_id);
  RETURN NEW;
END;
$$;

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

