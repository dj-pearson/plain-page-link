-- Combined migrations for AgentBio
-- Run with: psql -v ON_ERROR_STOP=0 to skip already-existing objects
-- All CREATE TABLE/INDEX use IF NOT EXISTS
-- Policies and other objects will error-and-skip if they exist

-- Create app_role enum for user roles
DO $$ BEGIN CREATE TYPE public.app_role AS ENUM ('admin', 'user'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  theme TEXT DEFAULT 'default',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create user_roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create links table for link-in-bio functionality
CREATE TABLE IF NOT EXISTS public.links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  icon TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  click_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on links
ALTER TABLE public.links ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
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

-- Profiles RLS policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- User roles RLS policies (admins can manage, users can view their own)
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Links RLS policies
DROP POLICY IF EXISTS "Anyone can view active links" ON public.links;
CREATE POLICY "Anyone can view active links"
  ON public.links FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Users can manage their own links" ON public.links;
CREATE POLICY "Users can manage their own links"
  ON public.links FOR ALL
  USING (auth.uid() = user_id);

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'full_name', '')
  );
  
  -- Assign default 'user' role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'user');
  
  RETURN new;
END;
$$;

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Add updated_at triggers
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_links_updated_at ON public.links;
CREATE TRIGGER update_links_updated_at
  BEFORE UPDATE ON public.links
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();-- Fix search_path for update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;-- Create listings table
CREATE TABLE IF NOT EXISTS public.listings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  image text,
  address text NOT NULL,
  city text NOT NULL,
  price text NOT NULL,
  beds integer NOT NULL,
  baths integer NOT NULL,
  sqft integer,
  status text DEFAULT 'active',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own listings" ON public.listings;
CREATE POLICY "Users can view their own listings" ON public.listings
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own listings" ON public.listings;
CREATE POLICY "Users can insert their own listings" ON public.listings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own listings" ON public.listings;
CREATE POLICY "Users can update their own listings" ON public.listings
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own listings" ON public.listings;
CREATE POLICY "Users can delete their own listings" ON public.listings
  FOR DELETE USING (auth.uid() = user_id);

-- Create testimonials table
CREATE TABLE IF NOT EXISTS public.testimonials (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  client_name text NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review text NOT NULL,
  property_type text,
  date date DEFAULT CURRENT_DATE,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own testimonials" ON public.testimonials;
CREATE POLICY "Users can view their own testimonials" ON public.testimonials
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own testimonials" ON public.testimonials;
CREATE POLICY "Users can insert their own testimonials" ON public.testimonials
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own testimonials" ON public.testimonials;
CREATE POLICY "Users can update their own testimonials" ON public.testimonials
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own testimonials" ON public.testimonials;
CREATE POLICY "Users can delete their own testimonials" ON public.testimonials
  FOR DELETE USING (auth.uid() = user_id);

-- Create leads table
CREATE TABLE IF NOT EXISTS public.leads (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  lead_type text NOT NULL,
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  message text,
  status text DEFAULT 'new',
  source text DEFAULT 'profile_page',
  form_data jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own leads" ON public.leads;
CREATE POLICY "Users can view their own leads" ON public.leads
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own leads" ON public.leads;
CREATE POLICY "Users can insert their own leads" ON public.leads
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own leads" ON public.leads;
CREATE POLICY "Users can update their own leads" ON public.leads
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own leads" ON public.leads;
CREATE POLICY "Users can delete their own leads" ON public.leads
  FOR DELETE USING (auth.uid() = user_id);

-- Create analytics_views table for tracking profile views
CREATE TABLE IF NOT EXISTS public.analytics_views (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  visitor_id text,
  viewed_at timestamp with time zone DEFAULT now(),
  source text,
  device text,
  location text
);

ALTER TABLE public.analytics_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own analytics" ON public.analytics_views;
CREATE POLICY "Users can view their own analytics" ON public.analytics_views
  FOR SELECT USING (auth.uid() = user_id);

-- Add triggers for updated_at
DROP TRIGGER IF EXISTS update_listings_updated_at ON public.listings;
CREATE TRIGGER update_listings_updated_at
  BEFORE UPDATE ON public.listings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_testimonials_updated_at ON public.testimonials;
CREATE TRIGGER update_testimonials_updated_at
  BEFORE UPDATE ON public.testimonials
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_leads_updated_at ON public.leads;
CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();-- Create user_settings table for preferences
CREATE TABLE IF NOT EXISTS public.user_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  email_leads boolean DEFAULT true,
  sms_leads boolean DEFAULT false,
  weekly_report boolean DEFAULT true,
  marketing_emails boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own settings" ON public.user_settings;
CREATE POLICY "Users can view their own settings" ON public.user_settings
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own settings" ON public.user_settings;
CREATE POLICY "Users can insert their own settings" ON public.user_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own settings" ON public.user_settings;
CREATE POLICY "Users can update their own settings" ON public.user_settings
  FOR UPDATE USING (auth.uid() = user_id);

-- Add trigger for updated_at
DROP TRIGGER IF EXISTS update_user_settings_updated_at ON public.user_settings;
CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();-- Allow anyone to insert analytics views (for tracking profile views from anonymous visitors)
DROP POLICY IF EXISTS "Anyone can insert analytics views" ON analytics_views;
CREATE POLICY "Anyone can insert analytics views"
ON analytics_views
FOR INSERT
WITH CHECK (true);

-- Allow anyone to increment link click counts
DROP POLICY IF EXISTS "Anyone can increment link clicks" ON links;
CREATE POLICY "Anyone can increment link clicks"
ON links
FOR UPDATE
USING (true)
WITH CHECK (true);-- Create a function to safely increment link click counts
CREATE OR REPLACE FUNCTION increment_link_clicks(link_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE links
  SET click_count = COALESCE(click_count, 0) + 1
  WHERE id = link_id;
END;
$$;-- Fix the function to set search_path for security
DROP FUNCTION IF EXISTS increment_link_clicks(uuid);

CREATE OR REPLACE FUNCTION increment_link_clicks(link_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE links
  SET click_count = COALESCE(click_count, 0) + 1
  WHERE id = link_id;
END;
$$;-- Create subscription status enum
DO $$ BEGIN CREATE TYPE subscription_status AS ENUM ('active', 'canceled', 'past_due', 'incomplete', 'trialing'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Create subscription plans table
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  stripe_price_id TEXT UNIQUE,
  price_monthly DECIMAL(10,2) NOT NULL,
  price_yearly DECIMAL(10,2),
  features JSONB NOT NULL DEFAULT '{}',
  limits JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create user subscriptions table
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES subscription_plans(id),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT UNIQUE,
  status subscription_status DEFAULT 'active',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Create usage tracking table
CREATE TABLE IF NOT EXISTS usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  resource_type TEXT NOT NULL,
  count INTEGER DEFAULT 0,
  last_reset_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, resource_type)
);

-- Enable RLS
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subscription_plans
DROP POLICY IF EXISTS "Anyone can view active plans" ON subscription_plans;
CREATE POLICY "Anyone can view active plans"
  ON subscription_plans FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage plans" ON subscription_plans;
CREATE POLICY "Admins can manage plans"
  ON subscription_plans FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for user_subscriptions
DROP POLICY IF EXISTS "Users can view their own subscription" ON user_subscriptions;
CREATE POLICY "Users can view their own subscription"
  ON user_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can manage subscriptions" ON user_subscriptions;
CREATE POLICY "Service role can manage subscriptions"
  ON user_subscriptions FOR ALL
  USING (true);

-- RLS Policies for usage_tracking
DROP POLICY IF EXISTS "Users can view their own usage" ON usage_tracking;
CREATE POLICY "Users can view their own usage"
  ON usage_tracking FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can manage usage" ON usage_tracking;
CREATE POLICY "Service role can manage usage"
  ON usage_tracking FOR ALL
  USING (true);

-- Function to check subscription limits
CREATE OR REPLACE FUNCTION check_usage_limit(
  _user_id UUID,
  _resource_type TEXT,
  _limit INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_count INTEGER;
BEGIN
  SELECT COALESCE(count, 0) INTO current_count
  FROM usage_tracking
  WHERE user_id = _user_id AND resource_type = _resource_type;
  
  RETURN current_count < _limit;
END;
$$;

-- Function to get user's subscription plan
CREATE OR REPLACE FUNCTION get_user_plan(_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  plan_data JSONB;
BEGIN
  SELECT jsonb_build_object(
    'plan_name', sp.name,
    'limits', sp.limits,
    'features', sp.features,
    'status', us.status,
    'current_period_end', us.current_period_end
  ) INTO plan_data
  FROM user_subscriptions us
  JOIN subscription_plans sp ON us.plan_id = sp.id
  WHERE us.user_id = _user_id AND us.status = 'active';
  
  IF plan_data IS NULL THEN
    -- Return free plan limits
    plan_data := jsonb_build_object(
      'plan_name', 'free',
      'limits', jsonb_build_object(
        'listings', 3,
        'links', 5,
        'testimonials', 0,
        'analytics_days', 7
      ),
      'features', jsonb_build_object(),
      'status', 'free'
    );
  END IF;
  
  RETURN plan_data;
END;
$$;

-- Insert default plans
INSERT INTO subscription_plans (name, stripe_price_id, price_monthly, price_yearly, limits, features, sort_order) VALUES
('free', NULL, 0, 0, 
  '{"listings": 3, "links": 5, "testimonials": 0, "analytics_days": 7, "themes": 1}'::jsonb,
  '{"branding": true, "support": "community"}'::jsonb, 0),
('starter', 'price_starter_monthly', 19, 190,
  '{"listings": 10, "sold_properties": 10, "links": -1, "testimonials": 3, "analytics_days": 30, "themes": 3}'::jsonb,
  '{"lead_capture": true, "calendar_integration": true, "remove_branding": true, "support": "email_72hr"}'::jsonb, 1),
('professional', 'price_professional_monthly', 39, 390,
  '{"listings": -1, "sold_properties": -1, "links": -1, "testimonials": -1, "analytics_days": 365, "themes": 10}'::jsonb,
  '{"lead_capture": true, "calendar_integration": true, "home_valuation": true, "custom_colors": true, "qr_codes": true, "lead_export": true, "remove_branding": true, "support": "email_48hr"}'::jsonb, 2),
('team', 'price_team_monthly', 29, 290,
  '{"listings": -1, "sold_properties": -1, "links": -1, "testimonials": -1, "analytics_days": 365, "themes": -1}'::jsonb,
  '{"team_dashboard": true, "shared_assets": true, "team_branding": true, "team_directory": true, "multi_user": true, "priority_support": true, "onboarding_call": true}'::jsonb, 3),
('enterprise', NULL, 0, 0,
  '{"listings": -1, "sold_properties": -1, "links": -1, "testimonials": -1, "analytics_days": -1, "themes": -1}'::jsonb,
  '{"white_label": true, "custom_domain": true, "custom_css": true, "sso": true, "dedicated_manager": true, "phone_support": true, "lead_routing": true, "api_access": true}'::jsonb, 4)
ON CONFLICT DO NOTHING;

-- Trigger to update usage tracking
CREATE OR REPLACE FUNCTION update_usage_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO usage_tracking (user_id, resource_type, count)
  VALUES (NEW.user_id, TG_ARGV[0], 1)
  ON CONFLICT (user_id, resource_type)
  DO UPDATE SET 
    count = usage_tracking.count + 1,
    updated_at = now();
  RETURN NEW;
END;
$$;

-- Add triggers for usage tracking
DROP TRIGGER IF EXISTS track_listings_usage ON listings;
CREATE TRIGGER track_listings_usage
  AFTER INSERT ON listings
  FOR EACH ROW
  EXECUTE FUNCTION update_usage_count('listings');

DROP TRIGGER IF EXISTS track_links_usage ON links;
CREATE TRIGGER track_links_usage
  AFTER INSERT ON links
  FOR EACH ROW
  EXECUTE FUNCTION update_usage_count('links');

DROP TRIGGER IF EXISTS track_testimonials_usage ON testimonials;
CREATE TRIGGER track_testimonials_usage
  AFTER INSERT ON testimonials
  FOR EACH ROW
  EXECUTE FUNCTION update_usage_count('testimonials');-- Update handle_new_user to create numeric username by default
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  numeric_username TEXT;
BEGIN
  -- Generate numeric username from user ID (remove hyphens and take first 9 digits)
  numeric_username := REPLACE(new.id::TEXT, '-', '');
  numeric_username := SUBSTRING(numeric_username, 1, 9);
  
  INSERT INTO public.profiles (id, username, full_name)
  VALUES (
    new.id,
    numeric_username,
    COALESCE(new.raw_user_meta_data->>'full_name', '')
  );
  
  -- Assign default 'user' role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'user');
  
  RETURN new;
END;
$function$;

-- Function to check username availability
CREATE OR REPLACE FUNCTION check_username_available(
  _username TEXT,
  _current_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
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
$$;

-- Add index for username lookups
CREATE INDEX IF NOT EXISTS idx_profiles_username_lower ON profiles (LOWER(username));-- Create avatars storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT DO NOTHING;

-- RLS policies for avatars bucket
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);-- Create listings table for property showcase
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
DROP POLICY IF EXISTS "Anyone can view active listings" ON public.listings;
CREATE POLICY "Anyone can view active listings"
  ON public.listings FOR SELECT
  USING (status IN ('active', 'pending', 'under_contract', 'sold'));

DROP POLICY IF EXISTS "Users can insert their own listings" ON public.listings;
DROP POLICY IF EXISTS "Users can insert their own listings" ON public.listings;
CREATE POLICY "Users can insert their own listings"
  ON public.listings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own listings" ON public.listings;
DROP POLICY IF EXISTS "Users can update their own listings" ON public.listings;
CREATE POLICY "Users can update their own listings"
  ON public.listings FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own listings" ON public.listings;
DROP POLICY IF EXISTS "Users can delete their own listings" ON public.listings;
CREATE POLICY "Users can delete their own listings"
  ON public.listings FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger to update updated_at timestamp
DROP TRIGGER IF EXISTS update_listings_updated_at ON public.listings;
DROP TRIGGER IF EXISTS update_listings_updated_at ON public.listings;
CREATE TRIGGER update_listings_updated_at
  BEFORE UPDATE ON public.listings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Comments
COMMENT ON TABLE public.listings IS 'Property listings for real estate agents';
COMMENT ON COLUMN public.listings.photos IS 'JSONB array of photo URLs from listing-photos storage bucket';
COMMENT ON COLUMN public.listings.status IS 'active = available for sale, pending = offer accepted, under_contract = in escrow, sold = closed';

-- Create keywords table for tracking keyword usage
CREATE TABLE IF NOT EXISTS public.keywords (
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
CREATE INDEX IF NOT EXISTS idx_keywords_active ON public.keywords(is_active);
CREATE INDEX IF NOT EXISTS idx_keywords_usage ON public.keywords(usage_count, last_used_at) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_keywords_category ON public.keywords(category);

-- Add keyword_id reference to articles table
ALTER TABLE public.articles
ADD COLUMN keyword_id UUID REFERENCES public.keywords(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_articles_keyword ON public.articles(keyword_id);

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
DROP POLICY IF EXISTS "Anyone can view active keywords" ON public.keywords;
CREATE POLICY "Anyone can view active keywords"
  ON public.keywords
  FOR SELECT
  USING (is_active = true);

-- Only admins can insert keywords
DROP POLICY IF EXISTS "Only admins can insert keywords" ON public.keywords;
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
DROP POLICY IF EXISTS "Only admins can update keywords" ON public.keywords;
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
DROP POLICY IF EXISTS "Only admins can delete keywords" ON public.keywords;
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
DROP POLICY IF EXISTS "Users can view their own leads" ON public.leads;
CREATE POLICY "Users can view their own leads"
  ON public.leads FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can submit leads" ON public.leads;
DROP POLICY IF EXISTS "Anyone can submit leads" ON public.leads;
CREATE POLICY "Anyone can submit leads"
  ON public.leads FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update their own leads" ON public.leads;
DROP POLICY IF EXISTS "Users can update their own leads" ON public.leads;
CREATE POLICY "Users can update their own leads"
  ON public.leads FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own leads" ON public.leads;
DROP POLICY IF EXISTS "Users can delete their own leads" ON public.leads;
CREATE POLICY "Users can delete their own leads"
  ON public.leads FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger to update updated_at timestamp
DROP TRIGGER IF EXISTS update_leads_updated_at ON public.leads;
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
DROP TRIGGER IF EXISTS on_lead_created ON public.leads;
CREATE TRIGGER on_lead_created
  AFTER INSERT ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_lead();

-- Comments for documentation
COMMENT ON TABLE public.leads IS 'Lead inquiries from public profile pages';
COMMENT ON COLUMN public.leads.lead_type IS 'buyer = wants to purchase, seller = wants to list property, valuation = wants home value estimate, contact = general inquiry';
COMMENT ON COLUMN public.leads.status IS 'new = just submitted, contacted = agent reached out, qualified = serious buyer/seller, nurturing = ongoing communication, closed = deal completed, lost = did not convert';

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
DROP POLICY IF EXISTS "Anyone can view published testimonials" ON public.testimonials;
CREATE POLICY "Anyone can view published testimonials"
  ON public.testimonials FOR SELECT
  USING (is_published = TRUE);

DROP POLICY IF EXISTS "Users can view their own testimonials" ON public.testimonials;
DROP POLICY IF EXISTS "Users can view their own testimonials" ON public.testimonials;
CREATE POLICY "Users can view their own testimonials"
  ON public.testimonials FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own testimonials" ON public.testimonials;
DROP POLICY IF EXISTS "Users can insert their own testimonials" ON public.testimonials;
CREATE POLICY "Users can insert their own testimonials"
  ON public.testimonials FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own testimonials" ON public.testimonials;
DROP POLICY IF EXISTS "Users can update their own testimonials" ON public.testimonials;
CREATE POLICY "Users can update their own testimonials"
  ON public.testimonials FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own testimonials" ON public.testimonials;
DROP POLICY IF EXISTS "Users can delete their own testimonials" ON public.testimonials;
CREATE POLICY "Users can delete their own testimonials"
  ON public.testimonials FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger to update updated_at timestamp
DROP TRIGGER IF EXISTS update_testimonials_updated_at ON public.testimonials;
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

-- Create subscriptions table for payment tracking
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  
  -- Subscription Plan
  plan_name TEXT NOT NULL DEFAULT 'free', -- free, professional, team, enterprise
  status TEXT NOT NULL DEFAULT 'active', -- active, cancelled, past_due, trialing, paused
  
  -- Stripe Integration
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_price_id TEXT,
  
  -- Billing Periods
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  cancel_at TIMESTAMPTZ, -- If cancelled, when will it end
  canceled_at TIMESTAMPTZ, -- When cancellation was requested
  
  -- Pricing
  amount DECIMAL(10,2), -- Monthly price in USD
  currency TEXT DEFAULT 'usd',
  interval TEXT DEFAULT 'month', -- month, year
  
  -- Feature Limits (based on plan)
  max_listings INTEGER DEFAULT 3,
  max_links INTEGER DEFAULT 5,
  max_testimonials INTEGER DEFAULT 3,
  analytics_history_days INTEGER DEFAULT 7,
  custom_domain_enabled BOOLEAN DEFAULT FALSE,
  remove_branding BOOLEAN DEFAULT FALSE,
  priority_support BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id ON public.subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON public.subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);

-- RLS Policies
-- Users can only view their own subscription
DROP POLICY IF EXISTS "Users can view their own subscription" ON public.subscriptions;
CREATE POLICY "Users can view their own subscription"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Only system (service role) can insert subscriptions
-- This is typically done via Stripe webhook
DROP POLICY IF EXISTS "Service role can insert subscriptions" ON public.subscriptions;
CREATE POLICY "Service role can insert subscriptions"
  ON public.subscriptions FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Users cannot directly update subscriptions (done via Stripe)
DROP POLICY IF EXISTS "Service role can update subscriptions" ON public.subscriptions;
CREATE POLICY "Service role can update subscriptions"
  ON public.subscriptions FOR UPDATE
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Trigger to update updated_at timestamp
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to create default free subscription for new users
CREATE OR REPLACE FUNCTION public.create_default_subscription()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.subscriptions (
    user_id,
    plan_name,
    status,
    max_listings,
    max_links,
    max_testimonials,
    analytics_history_days
  ) VALUES (
    NEW.id,
    'free',
    'active',
    3,  -- Free plan: 3 listings
    5,  -- Free plan: 5 links
    3,  -- Free plan: 3 testimonials
    7   -- Free plan: 7 days analytics
  );
  
  RETURN NEW;
END;
$$;

-- Trigger to create subscription on user signup
-- Note: This runs after handle_new_user() function
DROP TRIGGER IF EXISTS on_user_subscription_created ON public.profiles;
CREATE TRIGGER on_user_subscription_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.create_default_subscription();

-- Function to check if user has reached plan limits
CREATE OR REPLACE FUNCTION public.check_subscription_limit(
  _user_id UUID,
  _limit_type TEXT -- 'listings', 'links', 'testimonials'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_count INTEGER;
  max_allowed INTEGER;
BEGIN
  -- Get max allowed for this user's plan
  SELECT 
    CASE 
      WHEN _limit_type = 'listings' THEN max_listings
      WHEN _limit_type = 'links' THEN max_links
      WHEN _limit_type = 'testimonials' THEN max_testimonials
      ELSE 0
    END INTO max_allowed
  FROM public.subscriptions
  WHERE user_id = _user_id;
  
  -- Count current usage
  current_count := CASE 
    WHEN _limit_type = 'listings' THEN (SELECT COUNT(*) FROM public.listings WHERE user_id = _user_id)
    WHEN _limit_type = 'links' THEN (SELECT COUNT(*) FROM public.links WHERE user_id = _user_id)
    WHEN _limit_type = 'testimonials' THEN (SELECT COUNT(*) FROM public.testimonials WHERE user_id = _user_id)
    ELSE 0
  END;
  
  -- Return true if under limit
  RETURN current_count < max_allowed;
END;
$$;

-- Comments for documentation
COMMENT ON TABLE public.subscriptions IS 'User subscription plans and billing information';
COMMENT ON COLUMN public.subscriptions.plan_name IS 'free, professional ($39/mo), team ($29/agent), enterprise (custom)';
COMMENT ON COLUMN public.subscriptions.status IS 'active = paying, cancelled = ending at period_end, past_due = payment failed, trialing = in trial period';
COMMENT ON FUNCTION public.check_subscription_limit IS 'Check if user can add more items based on their plan limits';

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
  ctr NUMERIC(5,2), -- Click-through rate
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  avg_position NUMERIC(5,2),

  -- Status and tracking
  is_active BOOLEAN DEFAULT true,
  is_ranking BOOLEAN DEFAULT false,
  first_ranked_at TIMESTAMP WITH TIME ZONE,
  last_checked_at TIMESTAMP WITH TIME ZONE,
  last_position_change_at TIMESTAMP WITH TIME ZONE,

  -- Metadata
  notes TEXT,
  tags TEXT[] DEFAULT '{}',
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
  url TEXT,
  device TEXT DEFAULT 'desktop' CHECK (device IN ('desktop', 'mobile', 'tablet')),
  location TEXT DEFAULT 'global',
  search_engine TEXT DEFAULT 'google' CHECK (search_engine IN ('google', 'bing', 'yahoo', 'duckduckgo')),
  data_source TEXT DEFAULT 'manual' CHECK (data_source IN ('manual', 'gsc', 'serpapi', 'ahrefs', 'moz', 'semrush')),
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
COMMENT ON TABLE public.seo_keyword_history IS 'Historical tracking of keyword positions over time';
-- ============================================
-- SEO MANAGEMENT SYSTEM - GOOGLE SEARCH CONSOLE
-- ============================================
-- Migration 2 of 6: Google Search Console Integration
-- Tables: gsc_oauth_credentials, gsc_properties, gsc_keyword_performance, gsc_page_performance

-- ============================================
-- GSC OAUTH CREDENTIALS TABLE
-- ============================================
-- Stores encrypted OAuth credentials for Google Search Console API access

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

-- ============================================
-- GSC PROPERTIES TABLE
-- ============================================
-- Stores Google Search Console properties (websites) connected to the account

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

-- ============================================
-- GSC KEYWORD PERFORMANCE TABLE
-- ============================================
-- Stores keyword performance data from Google Search Console

CREATE TABLE IF NOT EXISTS public.gsc_keyword_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES gsc_properties(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  url TEXT,
  country TEXT,
  device TEXT CHECK (device IN ('DESKTOP', 'MOBILE', 'TABLET')),
  search_type TEXT DEFAULT 'web' CHECK (search_type IN ('web', 'image', 'video', 'news')),

  -- Performance metrics
  clicks INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  ctr NUMERIC(10,6), -- Click-through rate (stored as decimal, e.g., 0.05 = 5%)
  position NUMERIC(10,2), -- Average position

  -- Date range
  date DATE NOT NULL,

  -- Change tracking
  clicks_change INTEGER,
  impressions_change INTEGER,
  ctr_change NUMERIC(10,6),
  position_change NUMERIC(10,2),

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),

  CONSTRAINT unique_gsc_keyword_date UNIQUE (property_id, query, url, date, device, country)
);

-- ============================================
-- GSC PAGE PERFORMANCE TABLE
-- ============================================
-- Stores page-level performance data from Google Search Console

CREATE TABLE IF NOT EXISTS public.gsc_page_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES gsc_properties(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  country TEXT,
  device TEXT CHECK (device IN ('DESKTOP', 'MOBILE', 'TABLET')),
  search_type TEXT DEFAULT 'web' CHECK (search_type IN ('web', 'image', 'video', 'news')),

  -- Performance metrics
  clicks INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  ctr NUMERIC(10,6), -- Click-through rate
  position NUMERIC(10,2), -- Average position

  -- Top queries for this page
  top_queries JSONB DEFAULT '[]',

  -- Date range
  date DATE NOT NULL,

  -- Page metadata
  page_title TEXT,
  page_description TEXT,

  -- Change tracking
  clicks_change INTEGER,
  impressions_change INTEGER,
  ctr_change NUMERIC(10,6),
  position_change NUMERIC(10,2),

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),

  CONSTRAINT unique_gsc_page_date UNIQUE (property_id, url, date, device, country)
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- OAuth Credentials indexes
CREATE INDEX IF NOT EXISTS idx_gsc_oauth_user_id ON public.gsc_oauth_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_gsc_oauth_active ON public.gsc_oauth_credentials(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_gsc_oauth_expires_at ON public.gsc_oauth_credentials(expires_at);

-- Properties indexes
CREATE INDEX IF NOT EXISTS idx_gsc_properties_user_id ON public.gsc_properties(user_id);
CREATE INDEX IF NOT EXISTS idx_gsc_properties_url ON public.gsc_properties(property_url);
CREATE INDEX IF NOT EXISTS idx_gsc_properties_primary ON public.gsc_properties(is_primary) WHERE is_primary = true;
CREATE INDEX IF NOT EXISTS idx_gsc_properties_sync_status ON public.gsc_properties(sync_status);
CREATE INDEX IF NOT EXISTS idx_gsc_properties_last_synced ON public.gsc_properties(last_synced_at DESC);

-- Keyword Performance indexes
CREATE INDEX IF NOT EXISTS idx_gsc_keyword_property_id ON public.gsc_keyword_performance(property_id);
CREATE INDEX IF NOT EXISTS idx_gsc_keyword_query ON public.gsc_keyword_performance(query);
CREATE INDEX IF NOT EXISTS idx_gsc_keyword_url ON public.gsc_keyword_performance(url);
CREATE INDEX IF NOT EXISTS idx_gsc_keyword_date ON public.gsc_keyword_performance(date DESC);
CREATE INDEX IF NOT EXISTS idx_gsc_keyword_clicks ON public.gsc_keyword_performance(clicks DESC);
CREATE INDEX IF NOT EXISTS idx_gsc_keyword_impressions ON public.gsc_keyword_performance(impressions DESC);
CREATE INDEX IF NOT EXISTS idx_gsc_keyword_position ON public.gsc_keyword_performance(position);
CREATE INDEX IF NOT EXISTS idx_gsc_keyword_device ON public.gsc_keyword_performance(device);
CREATE INDEX IF NOT EXISTS idx_gsc_keyword_country ON public.gsc_keyword_performance(country);

-- Page Performance indexes
CREATE INDEX IF NOT EXISTS idx_gsc_page_property_id ON public.gsc_page_performance(property_id);
CREATE INDEX IF NOT EXISTS idx_gsc_page_url ON public.gsc_page_performance(url);
CREATE INDEX IF NOT EXISTS idx_gsc_page_date ON public.gsc_page_performance(date DESC);
CREATE INDEX IF NOT EXISTS idx_gsc_page_clicks ON public.gsc_page_performance(clicks DESC);
CREATE INDEX IF NOT EXISTS idx_gsc_page_impressions ON public.gsc_page_performance(impressions DESC);
CREATE INDEX IF NOT EXISTS idx_gsc_page_position ON public.gsc_page_performance(position);
CREATE INDEX IF NOT EXISTS idx_gsc_page_device ON public.gsc_page_performance(device);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.gsc_oauth_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gsc_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gsc_keyword_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gsc_page_performance ENABLE ROW LEVEL SECURITY;

-- OAuth Credentials policies (User-specific + Admin)
DROP POLICY IF EXISTS "Users can manage their own GSC credentials" ON public.gsc_oauth_credentials;
CREATE POLICY "Users can manage their own GSC credentials"
ON public.gsc_oauth_credentials FOR ALL
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage all GSC credentials" ON public.gsc_oauth_credentials;
CREATE POLICY "Admins can manage all GSC credentials"
ON public.gsc_oauth_credentials FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Properties policies
DROP POLICY IF EXISTS "Users can manage their own GSC properties" ON public.gsc_properties;
CREATE POLICY "Users can manage their own GSC properties"
ON public.gsc_properties FOR ALL
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage all GSC properties" ON public.gsc_properties;
CREATE POLICY "Admins can manage all GSC properties"
ON public.gsc_properties FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Keyword Performance policies
DROP POLICY IF EXISTS "Users can view their own GSC keyword data" ON public.gsc_keyword_performance;
CREATE POLICY "Users can view their own GSC keyword data"
ON public.gsc_keyword_performance FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.gsc_properties
    WHERE gsc_properties.id = gsc_keyword_performance.property_id
    AND gsc_properties.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Admins can manage all GSC keyword data" ON public.gsc_keyword_performance;
CREATE POLICY "Admins can manage all GSC keyword data"
ON public.gsc_keyword_performance FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Page Performance policies
DROP POLICY IF EXISTS "Users can view their own GSC page data" ON public.gsc_page_performance;
CREATE POLICY "Users can view their own GSC page data"
ON public.gsc_page_performance FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.gsc_properties
    WHERE gsc_properties.id = gsc_page_performance.property_id
    AND gsc_properties.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Admins can manage all GSC page data" ON public.gsc_page_performance;
CREATE POLICY "Admins can manage all GSC page data"
ON public.gsc_page_performance FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================

DROP TRIGGER IF EXISTS update_gsc_oauth_credentials_updated_at ON public.gsc_oauth_credentials;
CREATE TRIGGER update_gsc_oauth_credentials_updated_at
BEFORE UPDATE ON public.gsc_oauth_credentials
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_gsc_properties_updated_at ON public.gsc_properties;
CREATE TRIGGER update_gsc_properties_updated_at
BEFORE UPDATE ON public.gsc_properties
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to check if OAuth token is expired
CREATE OR REPLACE FUNCTION public.is_gsc_token_expired(credential_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT expires_at < now()
  FROM public.gsc_oauth_credentials
  WHERE id = credential_id
  AND is_active = true;
$$;

-- Function to get active GSC credential for user
CREATE OR REPLACE FUNCTION public.get_active_gsc_credential(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  access_token TEXT,
  refresh_token TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_expired BOOLEAN
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    id,
    access_token,
    refresh_token,
    expires_at,
    expires_at < now() as is_expired
  FROM public.gsc_oauth_credentials
  WHERE user_id = p_user_id
  AND is_active = true
  ORDER BY created_at DESC
  LIMIT 1;
$$;

-- Function to clean up old performance data (for maintenance)
CREATE OR REPLACE FUNCTION public.cleanup_old_gsc_data(days_to_keep INTEGER DEFAULT 90)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete keyword performance data older than specified days
  DELETE FROM public.gsc_keyword_performance
  WHERE date < CURRENT_DATE - days_to_keep;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  -- Delete page performance data older than specified days
  DELETE FROM public.gsc_page_performance
  WHERE date < CURRENT_DATE - days_to_keep;

  GET DIAGNOSTICS deleted_count = deleted_count + ROW_COUNT;

  RETURN deleted_count;
END;
$$;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE public.gsc_oauth_credentials IS 'OAuth2 credentials for Google Search Console API access';
COMMENT ON TABLE public.gsc_properties IS 'Google Search Console properties (websites) connected to the account';
COMMENT ON TABLE public.gsc_keyword_performance IS 'Keyword performance metrics from Google Search Console';
COMMENT ON TABLE public.gsc_page_performance IS 'Page-level performance metrics from Google Search Console';

COMMENT ON FUNCTION public.is_gsc_token_expired IS 'Check if a GSC OAuth token has expired';
COMMENT ON FUNCTION public.get_active_gsc_credential IS 'Get active GSC OAuth credential for a user';
COMMENT ON FUNCTION public.cleanup_old_gsc_data IS 'Clean up old GSC performance data (maintenance function)';
-- ============================================
-- SEO MANAGEMENT SYSTEM - AUTOMATED MONITORING
-- ============================================
-- Migration 3 of 6: SEO Automated Monitoring
-- Tables: seo_notification_preferences, seo_alert_rules, seo_alerts, seo_monitoring_schedules, seo_monitoring_log

-- ============================================
-- SEO NOTIFICATION PREFERENCES TABLE
-- ============================================
-- Manages user notification preferences for SEO alerts

CREATE TABLE IF NOT EXISTS public.seo_notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Email notifications
  email_enabled BOOLEAN DEFAULT true,
  email_address TEXT,
  email_frequency TEXT DEFAULT 'immediate' CHECK (email_frequency IN ('immediate', 'hourly', 'daily', 'weekly')),

  -- Slack notifications
  slack_enabled BOOLEAN DEFAULT false,
  slack_webhook_url TEXT,
  slack_channel TEXT,

  -- In-app notifications
  in_app_enabled BOOLEAN DEFAULT true,

  -- SMS notifications (optional)
  sms_enabled BOOLEAN DEFAULT false,
  sms_phone_number TEXT,

  -- Notification types preferences
  critical_alerts BOOLEAN DEFAULT true,
  ranking_changes BOOLEAN DEFAULT true,
  performance_alerts BOOLEAN DEFAULT true,
  security_alerts BOOLEAN DEFAULT true,
  broken_links BOOLEAN DEFAULT true,
  content_issues BOOLEAN DEFAULT false,
  technical_issues BOOLEAN DEFAULT true,

  -- Quiet hours
  quiet_hours_enabled BOOLEAN DEFAULT false,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  quiet_hours_timezone TEXT DEFAULT 'UTC',

  -- Aggregation settings
  digest_enabled BOOLEAN DEFAULT false,
  digest_frequency TEXT DEFAULT 'daily' CHECK (digest_frequency IN ('daily', 'weekly', 'monthly')),
  digest_time TIME DEFAULT '09:00:00',

  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),

  CONSTRAINT one_preference_per_user UNIQUE (user_id)
);

-- ============================================
-- SEO ALERT RULES TABLE
-- ============================================
-- Defines rules for triggering SEO alerts

CREATE TABLE IF NOT EXISTS public.seo_alert_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  rule_type TEXT NOT NULL CHECK (rule_type IN (
    'ranking_drop', 'ranking_increase', 'traffic_drop', 'traffic_increase',
    'page_speed_degradation', 'core_web_vitals_fail', 'broken_links',
    'security_issue', 'mobile_usability', 'crawl_error', 'duplicate_content',
    'missing_meta_tags', 'redirect_chain', 'content_freshness', 'custom'
  )),
  severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),

  -- Rule conditions (JSONB for flexibility)
  conditions JSONB NOT NULL DEFAULT '{}',
  /*
  Example conditions structure:
  {
    "metric": "ranking_position",
    "operator": "greater_than",
    "threshold": 10,
    "comparison_period": "7_days",
    "min_change": 3
  }
  */

  -- Scope
  applies_to TEXT DEFAULT 'all' CHECK (applies_to IN ('all', 'specific_urls', 'specific_keywords', 'specific_pages')),
  target_urls TEXT[] DEFAULT '{}',
  target_keywords TEXT[] DEFAULT '{}',

  -- Actions
  actions JSONB DEFAULT '[]',
  /*
  Example actions:
  [
    {"type": "email", "recipients": ["admin@example.com"]},
    {"type": "slack", "channel": "#seo-alerts"},
    {"type": "webhook", "url": "https://example.com/webhook"}
  ]
  */

  -- Status
  is_active BOOLEAN DEFAULT true,
  last_triggered_at TIMESTAMP WITH TIME ZONE,
  trigger_count INTEGER DEFAULT 0,

  -- Cooldown to prevent alert spam
  cooldown_minutes INTEGER DEFAULT 60,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- ============================================
-- SEO ALERTS TABLE
-- ============================================
-- Stores triggered SEO alerts

CREATE TABLE IF NOT EXISTS public.seo_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_rule_id UUID REFERENCES seo_alert_rules(id) ON DELETE SET NULL,

  -- Alert details
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  details JSONB DEFAULT '{}',

  -- Affected resources
  affected_url TEXT,
  affected_keyword TEXT,
  affected_page TEXT,

  -- Metrics
  metric_name TEXT,
  previous_value TEXT,
  current_value TEXT,
  change_percentage NUMERIC(10,2),

  -- Status
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'acknowledged', 'resolved', 'ignored')),
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  acknowledged_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES auth.users(id),
  resolution_notes TEXT,

  -- Notifications sent
  notifications_sent JSONB DEFAULT '[]',
  /*
  Example:
  [
    {"type": "email", "sent_at": "2025-11-05T10:30:00Z", "status": "delivered"},
    {"type": "slack", "sent_at": "2025-11-05T10:30:01Z", "status": "delivered"}
  ]
  */

  -- Auto-resolution
  auto_resolved BOOLEAN DEFAULT false,
  auto_resolution_reason TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================
-- SEO MONITORING SCHEDULES TABLE
-- ============================================
-- Manages automated SEO monitoring schedules

CREATE TABLE IF NOT EXISTS public.seo_monitoring_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,

  -- Schedule type
  schedule_type TEXT NOT NULL CHECK (schedule_type IN (
    'full_audit', 'quick_scan', 'keyword_check', 'broken_links',
    'core_web_vitals', 'security_scan', 'competitor_check', 'custom'
  )),

  -- Target
  target_url TEXT NOT NULL,
  additional_urls TEXT[] DEFAULT '{}',

  -- Frequency
  frequency TEXT NOT NULL CHECK (frequency IN ('hourly', 'daily', 'weekly', 'monthly', 'custom')),
  cron_expression TEXT, -- For custom schedules
  time_of_day TIME,
  day_of_week INTEGER, -- 0-6 (Sunday = 0)
  day_of_month INTEGER, -- 1-31
  timezone TEXT DEFAULT 'UTC',

  -- Next run
  next_run_at TIMESTAMP WITH TIME ZONE,
  last_run_at TIMESTAMP WITH TIME ZONE,
  last_run_status TEXT CHECK (last_run_status IN ('success', 'failed', 'partial')),
  last_run_duration_ms INTEGER,

  -- Configuration
  config JSONB DEFAULT '{}',
  /*
  Example config:
  {
    "max_pages_to_crawl": 100,
    "check_images": true,
    "check_links": true,
    "alert_on_issues": true
  }
  */

  -- Status
  is_active BOOLEAN DEFAULT true,
  run_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- ============================================
-- SEO MONITORING LOG TABLE
-- ============================================
-- Logs all automated monitoring activities

CREATE TABLE IF NOT EXISTS public.seo_monitoring_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID REFERENCES seo_monitoring_schedules(id) ON DELETE CASCADE,

  -- Execution details
  execution_type TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('started', 'running', 'completed', 'failed', 'cancelled')),

  -- Results
  results_summary JSONB DEFAULT '{}',
  /*
  Example:
  {
    "pages_checked": 50,
    "issues_found": 12,
    "critical_issues": 2,
    "warnings": 10,
    "score": 85
  }
  */

  -- Performance
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  duration_ms INTEGER,

  -- Error handling
  error_message TEXT,
  error_details JSONB,

  -- References
  audit_id UUID REFERENCES seo_audit_history(id),
  alerts_generated INTEGER DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Notification Preferences indexes
CREATE INDEX IF NOT EXISTS idx_seo_notif_pref_user_id ON public.seo_notification_preferences(user_id);

-- Alert Rules indexes
CREATE INDEX IF NOT EXISTS idx_seo_alert_rules_type ON public.seo_alert_rules(rule_type);
CREATE INDEX IF NOT EXISTS idx_seo_alert_rules_active ON public.seo_alert_rules(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_seo_alert_rules_severity ON public.seo_alert_rules(severity);

-- Alerts indexes
CREATE INDEX IF NOT EXISTS idx_seo_alerts_rule_id ON public.seo_alerts(alert_rule_id);
CREATE INDEX IF NOT EXISTS idx_seo_alerts_status ON public.seo_alerts(status);
CREATE INDEX IF NOT EXISTS idx_seo_alerts_severity ON public.seo_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_seo_alerts_created_at ON public.seo_alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_seo_alerts_url ON public.seo_alerts(affected_url);
CREATE INDEX IF NOT EXISTS idx_seo_alerts_keyword ON public.seo_alerts(affected_keyword);
CREATE INDEX IF NOT EXISTS idx_seo_alerts_open ON public.seo_alerts(status) WHERE status = 'open';

-- Monitoring Schedules indexes
CREATE INDEX IF NOT EXISTS idx_seo_schedules_active ON public.seo_monitoring_schedules(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_seo_schedules_next_run ON public.seo_monitoring_schedules(next_run_at);
CREATE INDEX IF NOT EXISTS idx_seo_schedules_type ON public.seo_monitoring_schedules(schedule_type);
CREATE INDEX IF NOT EXISTS idx_seo_schedules_url ON public.seo_monitoring_schedules(target_url);

-- Monitoring Log indexes
CREATE INDEX IF NOT EXISTS idx_seo_monitoring_log_schedule_id ON public.seo_monitoring_log(schedule_id);
CREATE INDEX IF NOT EXISTS idx_seo_monitoring_log_status ON public.seo_monitoring_log(status);
CREATE INDEX IF NOT EXISTS idx_seo_monitoring_log_started_at ON public.seo_monitoring_log(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_seo_monitoring_log_audit_id ON public.seo_monitoring_log(audit_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.seo_notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_alert_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_monitoring_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_monitoring_log ENABLE ROW LEVEL SECURITY;

-- Notification Preferences policies
DROP POLICY IF EXISTS "Users can manage their own notification preferences" ON public.seo_notification_preferences;
CREATE POLICY "Users can manage their own notification preferences"
ON public.seo_notification_preferences FOR ALL
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage all notification preferences" ON public.seo_notification_preferences;
CREATE POLICY "Admins can manage all notification preferences"
ON public.seo_notification_preferences FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Alert Rules policies
DROP POLICY IF EXISTS "Admins can manage alert rules" ON public.seo_alert_rules;
CREATE POLICY "Admins can manage alert rules"
ON public.seo_alert_rules FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Users can view alert rules" ON public.seo_alert_rules;
CREATE POLICY "Users can view alert rules"
ON public.seo_alert_rules FOR SELECT
USING (true);

-- Alerts policies
DROP POLICY IF EXISTS "Admins can manage all alerts" ON public.seo_alerts;
CREATE POLICY "Admins can manage all alerts"
ON public.seo_alerts FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "All authenticated users can view alerts" ON public.seo_alerts;
CREATE POLICY "All authenticated users can view alerts"
ON public.seo_alerts FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Monitoring Schedules policies
DROP POLICY IF EXISTS "Admins can manage monitoring schedules" ON public.seo_monitoring_schedules;
CREATE POLICY "Admins can manage monitoring schedules"
ON public.seo_monitoring_schedules FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Users can view monitoring schedules" ON public.seo_monitoring_schedules;
CREATE POLICY "Users can view monitoring schedules"
ON public.seo_monitoring_schedules FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Monitoring Log policies
DROP POLICY IF EXISTS "Admins can manage monitoring logs" ON public.seo_monitoring_log;
CREATE POLICY "Admins can manage monitoring logs"
ON public.seo_monitoring_log FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Users can view monitoring logs" ON public.seo_monitoring_log;
CREATE POLICY "Users can view monitoring logs"
ON public.seo_monitoring_log FOR SELECT
USING (auth.uid() IS NOT NULL);

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================

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
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_seo_schedules_updated_at ON public.seo_monitoring_schedules;
CREATE TRIGGER update_seo_schedules_updated_at
BEFORE UPDATE ON public.seo_monitoring_schedules
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to get open alerts count
CREATE OR REPLACE FUNCTION public.get_open_alerts_count()
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.seo_alerts
  WHERE status = 'open';
$$;

-- Function to get critical alerts count
CREATE OR REPLACE FUNCTION public.get_critical_alerts_count()
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.seo_alerts
  WHERE status = 'open'
  AND severity = 'critical';
$$;

-- Function to calculate next run time for a schedule
CREATE OR REPLACE FUNCTION public.calculate_next_run_time(
  p_schedule_id UUID
)
RETURNS TIMESTAMP WITH TIME ZONE
LANGUAGE plpgsql
AS $$
DECLARE
  v_frequency TEXT;
  v_time_of_day TIME;
  v_day_of_week INTEGER;
  v_day_of_month INTEGER;
  v_next_run TIMESTAMP WITH TIME ZONE;
BEGIN
  SELECT frequency, time_of_day, day_of_week, day_of_month
  INTO v_frequency, v_time_of_day, v_day_of_week, v_day_of_month
  FROM public.seo_monitoring_schedules
  WHERE id = p_schedule_id;

  CASE v_frequency
    WHEN 'hourly' THEN
      v_next_run := now() + INTERVAL '1 hour';
    WHEN 'daily' THEN
      v_next_run := (CURRENT_DATE + 1)::TIMESTAMP + COALESCE(v_time_of_day, '00:00:00'::TIME);
    WHEN 'weekly' THEN
      v_next_run := (CURRENT_DATE + ((7 + COALESCE(v_day_of_week, 0) - EXTRACT(DOW FROM CURRENT_DATE)::INTEGER) % 7))::TIMESTAMP + COALESCE(v_time_of_day, '00:00:00'::TIME);
    WHEN 'monthly' THEN
      v_next_run := (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' + (COALESCE(v_day_of_month, 1) - 1)::TEXT || ' days')::TIMESTAMP + COALESCE(v_time_of_day, '00:00:00'::TIME);
    ELSE
      v_next_run := now() + INTERVAL '1 day';
  END CASE;

  RETURN v_next_run;
END;
$$;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE public.seo_notification_preferences IS 'User notification preferences for SEO alerts';
COMMENT ON TABLE public.seo_alert_rules IS 'Rules for triggering automated SEO alerts';
COMMENT ON TABLE public.seo_alerts IS 'Triggered SEO alerts and their status';
COMMENT ON TABLE public.seo_monitoring_schedules IS 'Automated SEO monitoring schedules';
COMMENT ON TABLE public.seo_monitoring_log IS 'Log of all automated monitoring executions';

COMMENT ON FUNCTION public.get_open_alerts_count IS 'Get count of open SEO alerts';
COMMENT ON FUNCTION public.get_critical_alerts_count IS 'Get count of critical open SEO alerts';
COMMENT ON FUNCTION public.calculate_next_run_time IS 'Calculate next run time for a monitoring schedule';
-- ============================================
-- SEO MANAGEMENT SYSTEM - ADVANCED SEO FEATURES
-- ============================================
-- Migration 4 of 6: Advanced SEO Features
-- Tables: seo_competitor_analysis, seo_page_scores, seo_core_web_vitals, seo_crawl_results

-- ============================================
-- SEO COMPETITOR ANALYSIS TABLE
-- ============================================
-- Stores competitor SEO analysis data

CREATE TABLE IF NOT EXISTS public.seo_competitor_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competitor_domain TEXT NOT NULL,
  competitor_name TEXT,
  our_domain TEXT NOT NULL,

  -- Rankings comparison
  shared_keywords INTEGER DEFAULT 0,
  keywords_we_rank_better INTEGER DEFAULT 0,
  keywords_they_rank_better INTEGER DEFAULT 0,
  keyword_gap_count INTEGER DEFAULT 0, -- Keywords they rank for but we don't

  -- Traffic estimates
  estimated_monthly_traffic INTEGER,
  estimated_monthly_traffic_value NUMERIC(10,2),

  -- Domain metrics
  domain_authority INTEGER CHECK (domain_authority >= 0 AND domain_authority <= 100),
  page_authority INTEGER CHECK (page_authority >= 0 AND page_authority <= 100),
  trust_flow INTEGER,
  citation_flow INTEGER,
  backlinks_count INTEGER DEFAULT 0,
  referring_domains INTEGER DEFAULT 0,

  -- Content analysis
  total_pages INTEGER,
  indexed_pages INTEGER,
  blog_post_count INTEGER,
  content_update_frequency TEXT,

  -- Technical SEO
  mobile_friendly BOOLEAN,
  page_speed_score INTEGER CHECK (page_speed_score >= 0 AND page_speed_score <= 100),
  has_ssl BOOLEAN,
  has_sitemap BOOLEAN,

  -- Detailed data
  top_performing_keywords JSONB DEFAULT '[]',
  keyword_gap_list JSONB DEFAULT '[]',
  top_pages JSONB DEFAULT '[]',
  content_gaps JSONB DEFAULT '[]',
  backlink_profile JSONB DEFAULT '{}',

  -- Metadata
  analysis_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  data_source TEXT CHECK (data_source IN ('manual', 'ahrefs', 'semrush', 'moz', 'serpapi', 'gsc')),
  notes TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  analyzed_by UUID REFERENCES auth.users(id)
);

-- ============================================
-- SEO PAGE SCORES TABLE
-- ============================================
-- Stores individual page SEO scores and metrics

CREATE TABLE IF NOT EXISTS public.seo_page_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  page_title TEXT,
  page_type TEXT CHECK (page_type IN ('homepage', 'product', 'category', 'blog', 'article', 'landing_page', 'other')),

  -- Overall scores
  overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
  seo_score INTEGER CHECK (seo_score >= 0 AND seo_score <= 100),
  content_score INTEGER CHECK (content_score >= 0 AND content_score <= 100),
  technical_score INTEGER CHECK (technical_score >= 0 AND technical_score <= 100),
  ux_score INTEGER CHECK (ux_score >= 0 AND ux_score <= 100),

  -- Meta tags scoring
  title_score INTEGER CHECK (title_score >= 0 AND title_score <= 10),
  description_score INTEGER CHECK (description_score >= 0 AND description_score <= 10),
  keywords_score INTEGER CHECK (keywords_score >= 0 AND keywords_score <= 10),
  headings_score INTEGER CHECK (headings_score >= 0 AND headings_score <= 10),

  -- Content quality
  word_count INTEGER,
  readability_score NUMERIC(5,2),
  keyword_density NUMERIC(5,2),
  content_uniqueness NUMERIC(5,2), -- Percentage
  internal_links INTEGER DEFAULT 0,
  external_links INTEGER DEFAULT 0,

  -- Technical SEO
  load_time_ms INTEGER,
  mobile_score INTEGER CHECK (mobile_score >= 0 AND mobile_score <= 100),
  has_canonical BOOLEAN DEFAULT false,
  has_structured_data BOOLEAN DEFAULT false,
  has_alt_tags BOOLEAN DEFAULT false,
  images_optimized BOOLEAN DEFAULT false,

  -- Performance
  first_contentful_paint INTEGER, -- milliseconds
  largest_contentful_paint INTEGER,
  cumulative_layout_shift NUMERIC(5,3),
  time_to_interactive INTEGER,

  -- Issues
  critical_issues INTEGER DEFAULT 0,
  warnings INTEGER DEFAULT 0,
  recommendations JSONB DEFAULT '[]',

  -- Tracking
  last_scored_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  score_change INTEGER, -- Change from previous score
  previous_score INTEGER,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================
-- SEO CORE WEB VITALS TABLE
-- ============================================
-- Stores Core Web Vitals metrics

CREATE TABLE IF NOT EXISTS public.seo_core_web_vitals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  device TEXT NOT NULL CHECK (device IN ('mobile', 'desktop')),

  -- Core Web Vitals
  lcp NUMERIC(10,2), -- Largest Contentful Paint (seconds)
  fid NUMERIC(10,2), -- First Input Delay (milliseconds)
  cls NUMERIC(5,3), -- Cumulative Layout Shift (score)

  -- Additional metrics
  fcp NUMERIC(10,2), -- First Contentful Paint (seconds)
  ttfb NUMERIC(10,2), -- Time to First Byte (seconds)
  tti NUMERIC(10,2), -- Time to Interactive (seconds)
  tbt NUMERIC(10,2), -- Total Blocking Time (milliseconds)
  si NUMERIC(10,2), -- Speed Index

  -- Scores
  performance_score INTEGER CHECK (performance_score >= 0 AND performance_score <= 100),
  overall_category TEXT CHECK (overall_category IN ('FAST', 'AVERAGE', 'SLOW')),

  -- Pass/Fail status
  lcp_pass BOOLEAN,
  fid_pass BOOLEAN,
  cls_pass BOOLEAN,

  -- Detailed data
  lab_data JSONB DEFAULT '{}', -- Lab data from PageSpeed Insights
  field_data JSONB DEFAULT '{}', -- Field data from CrUX
  opportunities JSONB DEFAULT '[]', -- Performance opportunities
  diagnostics JSONB DEFAULT '[]', -- Diagnostics

  -- Metadata
  data_source TEXT DEFAULT 'pagespeed' CHECK (data_source IN ('pagespeed', 'crux', 'lighthouse', 'manual')),
  fetch_time_ms INTEGER,
  measured_at TIMESTAMP WITH TIME ZONE DEFAULT now(),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================
-- SEO CRAWL RESULTS TABLE
-- ============================================
-- Stores results from site crawls

CREATE TABLE IF NOT EXISTS public.seo_crawl_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  crawl_session_id UUID NOT NULL,
  url TEXT NOT NULL,
  parent_url TEXT, -- URL that linked to this page

  -- HTTP response
  status_code INTEGER,
  response_time_ms INTEGER,
  redirect_url TEXT,
  redirect_chain JSONB DEFAULT '[]',

  -- Page metadata
  title TEXT,
  title_length INTEGER,
  description TEXT,
  description_length INTEGER,
  canonical_url TEXT,
  h1 TEXT,
  h1_count INTEGER DEFAULT 0,

  -- Content
  word_count INTEGER,
  content_hash TEXT, -- For duplicate content detection
  language TEXT,

  -- Links
  internal_links INTEGER DEFAULT 0,
  external_links INTEGER DEFAULT 0,
  broken_links INTEGER DEFAULT 0,
  links_found JSONB DEFAULT '[]',

  -- Images
  images_count INTEGER DEFAULT 0,
  images_without_alt INTEGER DEFAULT 0,
  images_data JSONB DEFAULT '[]',

  -- Technical
  has_robots_meta BOOLEAN DEFAULT false,
  robots_content TEXT,
  has_canonical BOOLEAN DEFAULT false,
  has_viewport BOOLEAN DEFAULT false,
  has_schema BOOLEAN DEFAULT false,
  schema_types TEXT[] DEFAULT '{}',

  -- Performance
  page_size_kb INTEGER,
  load_time_ms INTEGER,
  resources_count INTEGER,

  -- Issues found
  issues JSONB DEFAULT '[]',
  warnings JSONB DEFAULT '[]',

  -- Crawl metadata
  crawl_depth INTEGER DEFAULT 0, -- How many clicks from start URL
  is_indexable BOOLEAN DEFAULT true,
  is_crawlable BOOLEAN DEFAULT true,

  crawled_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Competitor Analysis indexes
CREATE INDEX IF NOT EXISTS idx_seo_competitor_domain ON public.seo_competitor_analysis(competitor_domain);
CREATE INDEX IF NOT EXISTS idx_seo_competitor_our_domain ON public.seo_competitor_analysis(our_domain);
CREATE INDEX IF NOT EXISTS idx_seo_competitor_date ON public.seo_competitor_analysis(analysis_date DESC);

-- Page Scores indexes
CREATE INDEX IF NOT EXISTS idx_seo_page_scores_url ON public.seo_page_scores(url);
CREATE INDEX IF NOT EXISTS idx_seo_page_scores_overall ON public.seo_page_scores(overall_score DESC);
CREATE INDEX IF NOT EXISTS idx_seo_page_scores_type ON public.seo_page_scores(page_type);
CREATE INDEX IF NOT EXISTS idx_seo_page_scores_scored_at ON public.seo_page_scores(last_scored_at DESC);

-- Core Web Vitals indexes
CREATE INDEX IF NOT EXISTS idx_seo_cwv_url ON public.seo_core_web_vitals(url);
CREATE INDEX IF NOT EXISTS idx_seo_cwv_device ON public.seo_core_web_vitals(device);
CREATE INDEX IF NOT EXISTS idx_seo_cwv_measured_at ON public.seo_core_web_vitals(measured_at DESC);
CREATE INDEX IF NOT EXISTS idx_seo_cwv_performance_score ON public.seo_core_web_vitals(performance_score DESC);
CREATE INDEX IF NOT EXISTS idx_seo_cwv_lcp_pass ON public.seo_core_web_vitals(lcp_pass);

-- Crawl Results indexes
CREATE INDEX IF NOT EXISTS idx_seo_crawl_session_id ON public.seo_crawl_results(crawl_session_id);
CREATE INDEX IF NOT EXISTS idx_seo_crawl_url ON public.seo_crawl_results(url);
CREATE INDEX IF NOT EXISTS idx_seo_crawl_status ON public.seo_crawl_results(status_code);
CREATE INDEX IF NOT EXISTS idx_seo_crawl_parent_url ON public.seo_crawl_results(parent_url);
CREATE INDEX IF NOT EXISTS idx_seo_crawl_date ON public.seo_crawl_results(crawled_at DESC);
CREATE INDEX IF NOT EXISTS idx_seo_crawl_content_hash ON public.seo_crawl_results(content_hash);
CREATE INDEX IF NOT EXISTS idx_seo_crawl_broken_links ON public.seo_crawl_results(broken_links) WHERE broken_links > 0;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.seo_competitor_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_page_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_core_web_vitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_crawl_results ENABLE ROW LEVEL SECURITY;

-- Competitor Analysis policies
DROP POLICY IF EXISTS "Admins can manage competitor analysis" ON public.seo_competitor_analysis;
CREATE POLICY "Admins can manage competitor analysis"
ON public.seo_competitor_analysis FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Authenticated users can view competitor analysis" ON public.seo_competitor_analysis;
CREATE POLICY "Authenticated users can view competitor analysis"
ON public.seo_competitor_analysis FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Page Scores policies
DROP POLICY IF EXISTS "Admins can manage page scores" ON public.seo_page_scores;
CREATE POLICY "Admins can manage page scores"
ON public.seo_page_scores FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Authenticated users can view page scores" ON public.seo_page_scores;
CREATE POLICY "Authenticated users can view page scores"
ON public.seo_page_scores FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Core Web Vitals policies
DROP POLICY IF EXISTS "Admins can manage core web vitals" ON public.seo_core_web_vitals;
CREATE POLICY "Admins can manage core web vitals"
ON public.seo_core_web_vitals FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Public can view core web vitals" ON public.seo_core_web_vitals;
CREATE POLICY "Public can view core web vitals"
ON public.seo_core_web_vitals FOR SELECT
USING (true);

-- Crawl Results policies
DROP POLICY IF EXISTS "Admins can manage crawl results" ON public.seo_crawl_results;
CREATE POLICY "Admins can manage crawl results"
ON public.seo_crawl_results FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Authenticated users can view crawl results" ON public.seo_crawl_results;
CREATE POLICY "Authenticated users can view crawl results"
ON public.seo_crawl_results FOR SELECT
USING (auth.uid() IS NOT NULL);

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================

DROP TRIGGER IF EXISTS update_seo_competitor_updated_at ON public.seo_competitor_analysis;
CREATE TRIGGER update_seo_competitor_updated_at
BEFORE UPDATE ON public.seo_competitor_analysis
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_seo_page_scores_updated_at ON public.seo_page_scores;
CREATE TRIGGER update_seo_page_scores_updated_at
BEFORE UPDATE ON public.seo_page_scores
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to get average page score
CREATE OR REPLACE FUNCTION public.get_average_page_score()
RETURNS INTEGER
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(AVG(overall_score)::INTEGER, 0)
  FROM public.seo_page_scores
  WHERE last_scored_at > now() - INTERVAL '30 days';
$$;

-- Function to get pages failing Core Web Vitals
CREATE OR REPLACE FUNCTION public.get_failing_cwv_pages()
RETURNS TABLE (
  url TEXT,
  device TEXT,
  lcp NUMERIC(10,2),
  fid NUMERIC(10,2),
  cls NUMERIC(5,3),
  measured_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    url,
    device,
    lcp,
    fid,
    cls,
    measured_at
  FROM public.seo_core_web_vitals
  WHERE lcp_pass = false
     OR fid_pass = false
     OR cls_pass = false
  ORDER BY measured_at DESC;
$$;

-- Function to find duplicate content
CREATE OR REPLACE FUNCTION public.find_duplicate_content()
RETURNS TABLE (
  content_hash TEXT,
  url_count BIGINT,
  urls TEXT[]
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    content_hash,
    COUNT(*)::BIGINT as url_count,
    ARRAY_AGG(url) as urls
  FROM public.seo_crawl_results
  WHERE content_hash IS NOT NULL
  GROUP BY content_hash
  HAVING COUNT(*) > 1
  ORDER BY url_count DESC;
$$;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE public.seo_competitor_analysis IS 'Competitor SEO analysis and comparison data';
COMMENT ON TABLE public.seo_page_scores IS 'Individual page SEO scores and metrics';
COMMENT ON TABLE public.seo_core_web_vitals IS 'Core Web Vitals metrics for pages';
COMMENT ON TABLE public.seo_crawl_results IS 'Results from automated site crawls';

COMMENT ON FUNCTION public.get_average_page_score IS 'Get average page score for the last 30 days';
COMMENT ON FUNCTION public.get_failing_cwv_pages IS 'Get pages failing Core Web Vitals checks';
COMMENT ON FUNCTION public.find_duplicate_content IS 'Find pages with duplicate content based on content hash';
-- ============================================
-- SEO MANAGEMENT SYSTEM - ENTERPRISE SEO FEATURES
-- ============================================
-- Migration 5 of 6: Enterprise SEO Features
-- Tables: seo_image_analysis, seo_redirect_analysis, seo_duplicate_content,
--         seo_security_analysis, seo_link_analysis, seo_structured_data,
--         seo_mobile_analysis, seo_performance_budget

-- ============================================
-- SEO IMAGE ANALYSIS TABLE
-- ============================================
-- Analyzes images for SEO optimization

CREATE TABLE IF NOT EXISTS public.seo_image_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  page_url TEXT NOT NULL,
  image_src TEXT NOT NULL,

  -- Image properties
  file_name TEXT,
  file_size_kb INTEGER,
  file_format TEXT,
  width INTEGER,
  height INTEGER,
  aspect_ratio TEXT,

  -- SEO attributes
  alt_text TEXT,
  alt_text_length INTEGER,
  title_attribute TEXT,
  has_alt BOOLEAN DEFAULT false,
  has_title BOOLEAN DEFAULT false,
  has_caption BOOLEAN DEFAULT false,

  -- Optimization
  is_optimized BOOLEAN DEFAULT false,
  optimization_score INTEGER CHECK (optimization_score >= 0 AND optimization_score <= 100),
  compression_ratio NUMERIC(5,2),
  potential_savings_kb INTEGER,

  -- Format recommendations
  recommended_format TEXT,
  supports_lazy_loading BOOLEAN DEFAULT false,
  is_lazy_loaded BOOLEAN DEFAULT false,
  has_srcset BOOLEAN DEFAULT false,
  is_responsive BOOLEAN DEFAULT false,

  -- Issues
  issues JSONB DEFAULT '[]',
  /*
  Example:
  [
    {"type": "missing_alt", "severity": "high"},
    {"type": "oversized", "severity": "medium", "details": "Image is 500KB, recommend < 100KB"},
    {"type": "wrong_format", "severity": "low", "recommendation": "Use WebP"}
  ]
  */

  -- Metadata
  analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================
-- SEO REDIRECT ANALYSIS TABLE
-- ============================================
-- Tracks and analyzes redirects

CREATE TABLE IF NOT EXISTS public.seo_redirect_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_url TEXT NOT NULL,
  final_url TEXT NOT NULL,

  -- Redirect chain
  redirect_chain JSONB NOT NULL DEFAULT '[]',
  /*
  Example:
  [
    {"url": "http://example.com", "status": 301, "location": "https://example.com"},
    {"url": "https://example.com", "status": 301, "location": "https://www.example.com"},
    {"url": "https://www.example.com", "status": 200}
  ]
  */
  chain_length INTEGER DEFAULT 0,

  -- Redirect details
  redirect_type INTEGER, -- 301, 302, 307, 308
  is_permanent BOOLEAN,
  is_chain BOOLEAN DEFAULT false, -- More than one redirect

  -- Performance impact
  total_time_ms INTEGER,
  time_per_hop_ms INTEGER,

  -- Issues
  has_issues BOOLEAN DEFAULT false,
  issues JSONB DEFAULT '[]',
  /*
  Example issues:
  [
    {"type": "redirect_chain", "severity": "medium", "details": "3 redirects in chain"},
    {"type": "mixed_redirects", "severity": "high", "details": "Mix of 301 and 302"},
    {"type": "redirect_loop", "severity": "critical"}
  ]
  */

  -- Recommendations
  recommended_action TEXT,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'critical')),

  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'fixed', 'ignored')),
  fixed_at TIMESTAMP WITH TIME ZONE,

  -- Metadata
  last_checked_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================
-- SEO DUPLICATE CONTENT TABLE
-- ============================================
-- Detects and tracks duplicate content

CREATE TABLE IF NOT EXISTS public.seo_duplicate_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_hash TEXT NOT NULL,
  content_snippet TEXT,

  -- Affected URLs
  urls JSONB NOT NULL DEFAULT '[]',
  url_count INTEGER DEFAULT 0,
  primary_url TEXT, -- Canonical/preferred URL

  -- Similarity analysis
  similarity_score NUMERIC(5,2), -- Percentage similarity
  duplicate_type TEXT CHECK (duplicate_type IN (
    'exact', 'near_duplicate', 'partial', 'thin_content', 'scraped'
  )),

  -- Content details
  word_count INTEGER,
  title_duplicate BOOLEAN DEFAULT false,
  description_duplicate BOOLEAN DEFAULT false,
  h1_duplicate BOOLEAN DEFAULT false,

  -- Impact
  impact_level TEXT CHECK (impact_level IN ('low', 'medium', 'high', 'critical')),
  affects_rankings BOOLEAN DEFAULT false,

  -- Resolution
  status TEXT DEFAULT 'detected' CHECK (status IN ('detected', 'reviewed', 'resolved', 'ignored')),
  resolution_method TEXT CHECK (resolution_method IN (
    'canonical_tag', 'noindex', 'redirect', 'content_consolidation', 'content_rewrite', 'other'
  )),
  resolution_notes TEXT,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES auth.users(id),

  -- Metadata
  first_detected_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_checked_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================
-- SEO SECURITY ANALYSIS TABLE
-- ============================================
-- Analyzes security headers and configurations

CREATE TABLE IF NOT EXISTS public.seo_security_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,

  -- HTTPS/SSL
  has_ssl BOOLEAN DEFAULT false,
  ssl_valid BOOLEAN DEFAULT false,
  ssl_expiry_date TIMESTAMP WITH TIME ZONE,
  ssl_issuer TEXT,
  mixed_content_issues INTEGER DEFAULT 0,

  -- Security headers
  has_hsts BOOLEAN DEFAULT false,
  hsts_max_age INTEGER,
  has_csp BOOLEAN DEFAULT false,
  csp_policy TEXT,
  has_x_frame_options BOOLEAN DEFAULT false,
  x_frame_options TEXT,
  has_x_content_type_options BOOLEAN DEFAULT false,
  has_referrer_policy BOOLEAN DEFAULT false,
  referrer_policy TEXT,
  has_permissions_policy BOOLEAN DEFAULT false,

  -- Security score
  security_score INTEGER CHECK (security_score >= 0 AND security_score <= 100),
  security_grade TEXT CHECK (security_grade IN ('A+', 'A', 'B', 'C', 'D', 'F')),

  -- Vulnerabilities
  vulnerabilities JSONB DEFAULT '[]',
  /*
  Example:
  [
    {"type": "missing_hsts", "severity": "high", "recommendation": "Add Strict-Transport-Security header"},
    {"type": "weak_csp", "severity": "medium"},
    {"type": "clickjacking_risk", "severity": "high", "recommendation": "Add X-Frame-Options: DENY"}
  ]
  */

  -- Cookie security
  secure_cookies BOOLEAN DEFAULT false,
  httponly_cookies BOOLEAN DEFAULT false,
  samesite_cookies TEXT,

  -- Status
  critical_issues INTEGER DEFAULT 0,
  warnings INTEGER DEFAULT 0,
  passed_checks INTEGER DEFAULT 0,
  total_checks INTEGER DEFAULT 0,

  -- Metadata
  scanned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================
-- SEO LINK ANALYSIS TABLE
-- ============================================
-- Analyzes internal and external link structure

CREATE TABLE IF NOT EXISTS public.seo_link_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_url TEXT NOT NULL,

  -- Link counts
  total_links INTEGER DEFAULT 0,
  internal_links INTEGER DEFAULT 0,
  external_links INTEGER DEFAULT 0,
  broken_links INTEGER DEFAULT 0,
  redirect_links INTEGER DEFAULT 0,
  nofollow_links INTEGER DEFAULT 0,

  -- Link quality
  external_nofollow_count INTEGER DEFAULT 0,
  external_dofollow_count INTEGER DEFAULT 0,
  toxic_links INTEGER DEFAULT 0,
  quality_score INTEGER CHECK (quality_score >= 0 AND quality_score <= 100),

  -- Anchor text analysis
  anchor_texts JSONB DEFAULT '[]',
  /*
  Example:
  [
    {"text": "click here", "count": 5, "type": "generic"},
    {"text": "best seo tools", "count": 3, "type": "keyword_rich"},
    {"text": "example.com", "count": 2, "type": "url"}
  ]
  */
  over_optimized_anchors INTEGER DEFAULT 0,

  -- Internal linking
  orphan_page BOOLEAN DEFAULT false, -- No internal links pointing to this page
  dead_end_page BOOLEAN DEFAULT false, -- No outgoing links
  deep_level INTEGER, -- How many clicks from homepage

  -- Link details
  link_list JSONB DEFAULT '[]',
  /*
  Example:
  [
    {
      "url": "https://example.com/page",
      "anchor": "Example Page",
      "type": "internal",
      "rel": "dofollow",
      "status": 200
    }
  ]
  */

  -- Issues
  issues JSONB DEFAULT '[]',
  recommendations JSONB DEFAULT '[]',

  -- Metadata
  analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================
-- SEO STRUCTURED DATA TABLE
-- ============================================
-- Validates and tracks structured data (Schema.org)

CREATE TABLE IF NOT EXISTS public.seo_structured_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,

  -- Schema types found
  schema_types TEXT[] DEFAULT '{}',
  /*
  Example: ['Article', 'BreadcrumbList', 'Organization', 'WebPage']
  */

  -- Validation
  has_structured_data BOOLEAN DEFAULT false,
  is_valid BOOLEAN DEFAULT false,
  validation_errors JSONB DEFAULT '[]',
  validation_warnings JSONB DEFAULT '[]',

  -- Schema details
  schemas JSONB DEFAULT '[]',
  /*
  Example:
  [
    {
      "type": "Article",
      "valid": true,
      "required_fields": ["headline", "image", "datePublished"],
      "missing_fields": [],
      "data": {...}
    }
  ]
  */

  -- Coverage
  schema_coverage_score INTEGER CHECK (schema_coverage_score >= 0 AND schema_coverage_score <= 100),
  recommended_schemas TEXT[] DEFAULT '{}',

  -- Rich results eligibility
  eligible_for_rich_results BOOLEAN DEFAULT false,
  rich_result_types TEXT[] DEFAULT '{}',
  /*
  Example: ['Article', 'Recipe', 'FAQ', 'HowTo', 'Product']
  */

  -- Issues
  critical_errors INTEGER DEFAULT 0,
  warnings INTEGER DEFAULT 0,

  -- Testing tools results
  google_test_result JSONB,
  schema_markup_validator_result JSONB,

  -- Metadata
  validated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================
-- SEO MOBILE ANALYSIS TABLE
-- ============================================
-- Analyzes mobile-friendliness and usability

CREATE TABLE IF NOT EXISTS public.seo_mobile_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,

  -- Mobile-friendliness
  mobile_friendly BOOLEAN DEFAULT false,
  mobile_score INTEGER CHECK (mobile_score >= 0 AND mobile_score <= 100),

  -- Viewport
  has_viewport_meta BOOLEAN DEFAULT false,
  viewport_content TEXT,
  viewport_width TEXT,

  -- Touch elements
  touch_targets_sized_appropriately BOOLEAN DEFAULT false,
  tap_target_issues INTEGER DEFAULT 0,
  minimum_tap_target_size INTEGER, -- pixels

  -- Content sizing
  content_fits_viewport BOOLEAN DEFAULT false,
  horizontal_scroll_required BOOLEAN DEFAULT false,
  font_size_legible BOOLEAN DEFAULT false,

  -- Mobile-specific issues
  issues JSONB DEFAULT '[]',
  /*
  Example:
  [
    {"type": "text_too_small", "severity": "high", "details": "Font size is 10px, minimum recommended is 16px"},
    {"type": "tap_targets_too_close", "severity": "medium"},
    {"type": "viewport_not_set", "severity": "critical"}
  ]
  */

  -- Performance on mobile
  mobile_page_speed INTEGER CHECK (mobile_page_speed >= 0 AND mobile_page_speed <= 100),
  mobile_lcp NUMERIC(10,2),
  mobile_fid NUMERIC(10,2),
  mobile_cls NUMERIC(5,3),

  -- Resources
  resource_count INTEGER,
  total_resource_size_kb INTEGER,
  uses_responsive_images BOOLEAN DEFAULT false,

  -- Mobile usability score
  usability_score INTEGER CHECK (usability_score >= 0 AND usability_score <= 100),

  -- Status
  passed_mobile_friendly_test BOOLEAN DEFAULT false,
  google_mobile_friendly_result JSONB,

  -- Metadata
  tested_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================
-- SEO PERFORMANCE BUDGET TABLE
-- ============================================
-- Tracks performance budgets and violations

CREATE TABLE IF NOT EXISTS public.seo_performance_budget (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  url_pattern TEXT NOT NULL, -- Regex or glob pattern

  -- Budget limits
  max_page_size_kb INTEGER,
  max_image_size_kb INTEGER,
  max_js_size_kb INTEGER,
  max_css_size_kb INTEGER,
  max_font_size_kb INTEGER,
  max_requests INTEGER,
  max_load_time_ms INTEGER,
  max_lcp_ms INTEGER,
  max_fid_ms INTEGER,
  max_cls NUMERIC(5,3),

  -- Current values
  current_page_size_kb INTEGER,
  current_image_size_kb INTEGER,
  current_js_size_kb INTEGER,
  current_css_size_kb INTEGER,
  current_font_size_kb INTEGER,
  current_requests INTEGER,
  current_load_time_ms INTEGER,
  current_lcp_ms INTEGER,
  current_fid_ms INTEGER,
  current_cls NUMERIC(5,3),

  -- Budget status
  is_within_budget BOOLEAN DEFAULT true,
  violations JSONB DEFAULT '[]',
  /*
  Example:
  [
    {
      "metric": "page_size",
      "budget": 500,
      "actual": 750,
      "overage": 250,
      "percentage": 150
    }
  ]
  */
  violation_count INTEGER DEFAULT 0,

  -- Alerts
  alert_on_violation BOOLEAN DEFAULT true,
  alert_threshold_percentage INTEGER DEFAULT 90, -- Alert when approaching budget

  -- Status
  is_active BOOLEAN DEFAULT true,
  last_checked_at TIMESTAMP WITH TIME ZONE,
  last_violation_at TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Image Analysis indexes
CREATE INDEX IF NOT EXISTS idx_seo_image_page_url ON public.seo_image_analysis(page_url);
CREATE INDEX IF NOT EXISTS idx_seo_image_optimized ON public.seo_image_analysis(is_optimized);
CREATE INDEX IF NOT EXISTS idx_seo_image_analyzed_at ON public.seo_image_analysis(analyzed_at DESC);

-- Redirect Analysis indexes
CREATE INDEX IF NOT EXISTS idx_seo_redirect_source ON public.seo_redirect_analysis(source_url);
CREATE INDEX IF NOT EXISTS idx_seo_redirect_final ON public.seo_redirect_analysis(final_url);
CREATE INDEX IF NOT EXISTS idx_seo_redirect_status ON public.seo_redirect_analysis(status);
CREATE INDEX IF NOT EXISTS idx_seo_redirect_chain ON public.seo_redirect_analysis(is_chain) WHERE is_chain = true;

-- Duplicate Content indexes
CREATE INDEX IF NOT EXISTS idx_seo_duplicate_hash ON public.seo_duplicate_content(content_hash);
CREATE INDEX IF NOT EXISTS idx_seo_duplicate_status ON public.seo_duplicate_content(status);
CREATE INDEX IF NOT EXISTS idx_seo_duplicate_impact ON public.seo_duplicate_content(impact_level);

-- Security Analysis indexes
CREATE INDEX IF NOT EXISTS idx_seo_security_url ON public.seo_security_analysis(url);
CREATE INDEX IF NOT EXISTS idx_seo_security_score ON public.seo_security_analysis(security_score);
CREATE INDEX IF NOT EXISTS idx_seo_security_grade ON public.seo_security_analysis(security_grade);

-- Link Analysis indexes
CREATE INDEX IF NOT EXISTS idx_seo_link_page_url ON public.seo_link_analysis(page_url);
CREATE INDEX IF NOT EXISTS idx_seo_link_broken ON public.seo_link_analysis(broken_links) WHERE broken_links > 0;
CREATE INDEX IF NOT EXISTS idx_seo_link_orphan ON public.seo_link_analysis(orphan_page) WHERE orphan_page = true;

-- Structured Data indexes
CREATE INDEX IF NOT EXISTS idx_seo_schema_url ON public.seo_structured_data(url);
CREATE INDEX IF NOT EXISTS idx_seo_schema_valid ON public.seo_structured_data(is_valid);
CREATE INDEX IF NOT EXISTS idx_seo_schema_eligible ON public.seo_structured_data(eligible_for_rich_results);

-- Mobile Analysis indexes
CREATE INDEX IF NOT EXISTS idx_seo_mobile_url ON public.seo_mobile_analysis(url);
CREATE INDEX IF NOT EXISTS idx_seo_mobile_friendly ON public.seo_mobile_analysis(mobile_friendly);
CREATE INDEX IF NOT EXISTS idx_seo_mobile_score ON public.seo_mobile_analysis(mobile_score);

-- Performance Budget indexes
CREATE INDEX IF NOT EXISTS idx_seo_budget_active ON public.seo_performance_budget(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_seo_budget_within ON public.seo_performance_budget(is_within_budget);
CREATE INDEX IF NOT EXISTS idx_seo_budget_url_pattern ON public.seo_performance_budget(url_pattern);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.seo_image_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_redirect_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_duplicate_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_security_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_link_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_structured_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_mobile_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_performance_budget ENABLE ROW LEVEL SECURITY;

-- Admin-only policies for all enterprise tables
DROP POLICY IF EXISTS "Admins can manage image analysis" ON public.seo_image_analysis;
CREATE POLICY "Admins can manage image analysis"
ON public.seo_image_analysis FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can manage redirect analysis" ON public.seo_redirect_analysis;
CREATE POLICY "Admins can manage redirect analysis"
ON public.seo_redirect_analysis FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can manage duplicate content" ON public.seo_duplicate_content;
CREATE POLICY "Admins can manage duplicate content"
ON public.seo_duplicate_content FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can manage security analysis" ON public.seo_security_analysis;
CREATE POLICY "Admins can manage security analysis"
ON public.seo_security_analysis FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can manage link analysis" ON public.seo_link_analysis;
CREATE POLICY "Admins can manage link analysis"
ON public.seo_link_analysis FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can manage structured data" ON public.seo_structured_data;
CREATE POLICY "Admins can manage structured data"
ON public.seo_structured_data FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can manage mobile analysis" ON public.seo_mobile_analysis;
CREATE POLICY "Admins can manage mobile analysis"
ON public.seo_mobile_analysis FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can manage performance budgets" ON public.seo_performance_budget;
CREATE POLICY "Admins can manage performance budgets"
ON public.seo_performance_budget FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Public read policies for some tables
DROP POLICY IF EXISTS "Authenticated users can view security analysis" ON public.seo_security_analysis;
CREATE POLICY "Authenticated users can view security analysis"
ON public.seo_security_analysis FOR SELECT
USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can view mobile analysis" ON public.seo_mobile_analysis;
CREATE POLICY "Authenticated users can view mobile analysis"
ON public.seo_mobile_analysis FOR SELECT
USING (auth.uid() IS NOT NULL);

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================

DROP TRIGGER IF EXISTS update_seo_redirect_updated_at ON public.seo_redirect_analysis;
CREATE TRIGGER update_seo_redirect_updated_at
BEFORE UPDATE ON public.seo_redirect_analysis
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_seo_duplicate_updated_at ON public.seo_duplicate_content;
CREATE TRIGGER update_seo_duplicate_updated_at
BEFORE UPDATE ON public.seo_duplicate_content
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_seo_budget_updated_at ON public.seo_performance_budget;
CREATE TRIGGER update_seo_budget_updated_at
BEFORE UPDATE ON public.seo_performance_budget
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE public.seo_image_analysis IS 'Image SEO analysis and optimization recommendations';
COMMENT ON TABLE public.seo_redirect_analysis IS 'Redirect chain detection and analysis';
COMMENT ON TABLE public.seo_duplicate_content IS 'Duplicate content detection and tracking';
COMMENT ON TABLE public.seo_security_analysis IS 'Security headers and HTTPS analysis';
COMMENT ON TABLE public.seo_link_analysis IS 'Internal and external link structure analysis';
COMMENT ON TABLE public.seo_structured_data IS 'Structured data (Schema.org) validation';
COMMENT ON TABLE public.seo_mobile_analysis IS 'Mobile-friendliness and usability analysis';
COMMENT ON TABLE public.seo_performance_budget IS 'Performance budget tracking and violations';
-- ============================================
-- SEO MANAGEMENT SYSTEM - CONTENT OPTIMIZATION
-- ============================================
-- Migration 6 of 6: Content Optimization Features
-- Tables: seo_content_optimization, seo_semantic_analysis

-- ============================================
-- SEO CONTENT OPTIMIZATION TABLE
-- ============================================
-- Stores content analysis and AI-powered optimization suggestions

CREATE TABLE IF NOT EXISTS public.seo_content_optimization (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  page_title TEXT,
  target_keyword TEXT,

  -- Content metrics
  word_count INTEGER,
  paragraph_count INTEGER,
  sentence_count INTEGER,
  average_sentence_length NUMERIC(5,2),

  -- Readability scores
  flesch_reading_ease NUMERIC(5,2),
  flesch_kincaid_grade NUMERIC(5,2),
  readability_level TEXT, -- 'very_easy', 'easy', 'moderate', 'difficult', 'very_difficult'
  readability_score INTEGER CHECK (readability_score >= 0 AND readability_score <= 100),

  -- Keyword analysis
  keyword_density NUMERIC(5,2), -- Percentage
  keyword_count INTEGER,
  keyword_in_title BOOLEAN DEFAULT false,
  keyword_in_h1 BOOLEAN DEFAULT false,
  keyword_in_first_paragraph BOOLEAN DEFAULT false,
  keyword_in_url BOOLEAN DEFAULT false,
  keyword_prominence_score INTEGER CHECK (keyword_prominence_score >= 0 AND keyword_prominence_score <= 100),

  -- Heading structure
  h1_count INTEGER DEFAULT 0,
  h2_count INTEGER DEFAULT 0,
  h3_count INTEGER DEFAULT 0,
  h4_count INTEGER DEFAULT 0,
  h5_count INTEGER DEFAULT 0,
  h6_count INTEGER DEFAULT 0,
  heading_structure_score INTEGER CHECK (heading_structure_score >= 0 AND heading_structure_score <= 100),

  -- Content quality
  content_quality_score INTEGER CHECK (content_quality_score >= 0 AND content_quality_score <= 100),
  uniqueness_score INTEGER CHECK (uniqueness_score >= 0 AND uniqueness_score <= 100),
  engagement_score INTEGER CHECK (engagement_score >= 0 AND engagement_score <= 100),

  -- LSI Keywords (Latent Semantic Indexing)
  lsi_keywords TEXT[] DEFAULT '{}',
  lsi_keywords_found INTEGER DEFAULT 0,
  lsi_keywords_recommended TEXT[] DEFAULT '{}',
  lsi_coverage_score INTEGER CHECK (lsi_coverage_score >= 0 AND lsi_coverage_score <= 100),

  -- Topic coverage
  topic_coverage_score INTEGER CHECK (topic_coverage_score >= 0 AND topic_coverage_score <= 100),
  missing_topics TEXT[] DEFAULT '{}',
  covered_topics TEXT[] DEFAULT '{}',

  -- AI-generated insights
  ai_summary TEXT,
  ai_suggestions JSONB DEFAULT '[]',
  /*
  Example:
  [
    {
      "type": "keyword_density",
      "priority": "high",
      "current": 0.5,
      "recommended": 1.5,
      "suggestion": "Increase keyword usage to 1-2% density"
    },
    {
      "type": "readability",
      "priority": "medium",
      "suggestion": "Break up long sentences. Current average: 25 words, recommended: 15-20 words"
    }
  ]
  */

  -- Content improvements
  title_suggestions TEXT[] DEFAULT '{}',
  meta_description_suggestions TEXT[] DEFAULT '{}',
  heading_suggestions JSONB DEFAULT '[]',
  content_additions TEXT[] DEFAULT '{}',

  -- Media recommendations
  image_suggestions TEXT[] DEFAULT '{}',
  video_suggestions TEXT[] DEFAULT '{}',
  infographic_topics TEXT[] DEFAULT '{}',

  -- Internal linking recommendations
  recommended_internal_links JSONB DEFAULT '[]',
  /*
  Example:
  [
    {
      "anchor_text": "best seo practices",
      "target_url": "/blog/seo-best-practices",
      "reason": "Related topic, improves topical authority"
    }
  ]
  */

  -- Overall optimization score
  optimization_score INTEGER CHECK (optimization_score >= 0 AND optimization_score <= 100),
  optimization_level TEXT CHECK (optimization_level IN ('poor', 'fair', 'good', 'excellent')),

  -- Status
  status TEXT DEFAULT 'analyzed' CHECK (status IN ('analyzed', 'optimizing', 'optimized', 'published')),
  optimized_at TIMESTAMP WITH TIME ZONE,

  -- Comparison with competitors
  competitor_avg_word_count INTEGER,
  competitor_avg_readability NUMERIC(5,2),
  competitive_gap TEXT,

  -- Metadata
  analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  analyzed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================
-- SEO SEMANTIC ANALYSIS TABLE
-- ============================================
-- Analyzes semantic relationships and topic clusters

CREATE TABLE IF NOT EXISTS public.seo_semantic_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  primary_topic TEXT NOT NULL,

  -- Topic cluster
  topic_cluster_id TEXT,
  cluster_name TEXT,
  is_pillar_content BOOLEAN DEFAULT false,
  related_content_urls TEXT[] DEFAULT '{}',

  -- Semantic keywords
  main_entities JSONB DEFAULT '[]',
  /*
  Example:
  [
    {"entity": "SEO", "type": "CONCEPT", "salience": 0.85, "mentions": 15},
    {"entity": "Google", "type": "ORGANIZATION", "salience": 0.62, "mentions": 8},
    {"entity": "search rankings", "type": "CONCEPT", "salience": 0.48, "mentions": 6}
  ]
  */

  -- Semantic keywords and variations
  semantic_keywords JSONB DEFAULT '[]',
  /*
  Example:
  [
    {
      "keyword": "search engine optimization",
      "variations": ["SEO", "search optimization", "organic search"],
      "relevance": 0.95,
      "usage_count": 12
    }
  ]
  */

  -- TF-IDF Analysis (Term Frequency-Inverse Document Frequency)
  tf_idf_keywords JSONB DEFAULT '[]',
  /*
  Example:
  [
    {"term": "optimization", "tf_idf": 0.45, "frequency": 15},
    {"term": "rankings", "tf_idf": 0.38, "frequency": 10}
  ]
  */

  -- Co-occurrence analysis
  keyword_co_occurrence JSONB DEFAULT '{}',
  /*
  Example:
  {
    "SEO": ["tools", "strategy", "optimization", "rankings"],
    "content": ["quality", "marketing", "strategy"]
  }
  */

  -- Topic modeling
  topics_detected TEXT[] DEFAULT '{}',
  topic_weights JSONB DEFAULT '{}',
  /*
  Example:
  {
    "technical_seo": 0.45,
    "content_marketing": 0.30,
    "link_building": 0.25
  }
  */

  -- Sentiment analysis
  overall_sentiment TEXT CHECK (overall_sentiment IN ('positive', 'neutral', 'negative', 'mixed')),
  sentiment_score NUMERIC(5,2), -- -1.0 to 1.0
  emotional_tone TEXT[] DEFAULT '{}', -- ['informative', 'professional', 'enthusiastic']

  -- Intent analysis
  content_intent TEXT CHECK (content_intent IN ('informational', 'navigational', 'transactional', 'commercial')),
  search_intent_match_score INTEGER CHECK (search_intent_match_score >= 0 AND search_intent_match_score <= 100),

  -- Semantic richness
  vocabulary_size INTEGER, -- Unique words
  lexical_diversity NUMERIC(5,2), -- Ratio of unique to total words
  semantic_density NUMERIC(5,2), -- Meaningful words vs filler words

  -- Question coverage
  questions_addressed TEXT[] DEFAULT '{}',
  missing_questions TEXT[] DEFAULT '{}',
  faq_potential_score INTEGER CHECK (faq_potential_score >= 0 AND faq_potential_score <= 100),

  -- E-A-T signals (Expertise, Authoritativeness, Trustworthiness)
  expertise_signals JSONB DEFAULT '[]',
  authority_signals JSONB DEFAULT '[]',
  trust_signals JSONB DEFAULT '[]',
  eat_score INTEGER CHECK (eat_score >= 0 AND eat_score <= 100),

  -- Recommendations
  semantic_gaps TEXT[] DEFAULT '{}',
  recommended_entities TEXT[] DEFAULT '{}',
  recommended_topics TEXT[] DEFAULT '{}',
  content_depth_recommendation TEXT,

  -- NLP analysis metadata
  nlp_model_used TEXT,
  nlp_confidence_score NUMERIC(5,2),

  -- Overall scores
  semantic_relevance_score INTEGER CHECK (semantic_relevance_score >= 0 AND semantic_relevance_score <= 100),
  topical_authority_score INTEGER CHECK (topical_authority_score >= 0 AND topical_authority_score <= 100),

  -- Metadata
  analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  analyzed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Content Optimization indexes
CREATE INDEX IF NOT EXISTS idx_seo_content_url ON public.seo_content_optimization(url);
CREATE INDEX IF NOT EXISTS idx_seo_content_keyword ON public.seo_content_optimization(target_keyword);
CREATE INDEX IF NOT EXISTS idx_seo_content_score ON public.seo_content_optimization(optimization_score DESC);
CREATE INDEX IF NOT EXISTS idx_seo_content_status ON public.seo_content_optimization(status);
CREATE INDEX IF NOT EXISTS idx_seo_content_analyzed_at ON public.seo_content_optimization(analyzed_at DESC);

-- Semantic Analysis indexes
CREATE INDEX IF NOT EXISTS idx_seo_semantic_url ON public.seo_semantic_analysis(url);
CREATE INDEX IF NOT EXISTS idx_seo_semantic_topic ON public.seo_semantic_analysis(primary_topic);
CREATE INDEX IF NOT EXISTS idx_seo_semantic_cluster ON public.seo_semantic_analysis(topic_cluster_id);
CREATE INDEX IF NOT EXISTS idx_seo_semantic_pillar ON public.seo_semantic_analysis(is_pillar_content) WHERE is_pillar_content = true;
CREATE INDEX IF NOT EXISTS idx_seo_semantic_relevance ON public.seo_semantic_analysis(semantic_relevance_score DESC);
CREATE INDEX IF NOT EXISTS idx_seo_semantic_analyzed_at ON public.seo_semantic_analysis(analyzed_at DESC);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.seo_content_optimization ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_semantic_analysis ENABLE ROW LEVEL SECURITY;

-- Content Optimization policies
DROP POLICY IF EXISTS "Admins can manage content optimization" ON public.seo_content_optimization;
CREATE POLICY "Admins can manage content optimization"
ON public.seo_content_optimization FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Users can view their own content optimization" ON public.seo_content_optimization;
CREATE POLICY "Users can view their own content optimization"
ON public.seo_content_optimization FOR SELECT
USING (auth.uid() = analyzed_by OR public.has_role(auth.uid(), 'admin'::app_role));

-- Semantic Analysis policies
DROP POLICY IF EXISTS "Admins can manage semantic analysis" ON public.seo_semantic_analysis;
CREATE POLICY "Admins can manage semantic analysis"
ON public.seo_semantic_analysis FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Users can view their own semantic analysis" ON public.seo_semantic_analysis;
CREATE POLICY "Users can view their own semantic analysis"
ON public.seo_semantic_analysis FOR SELECT
USING (auth.uid() = analyzed_by OR public.has_role(auth.uid(), 'admin'::app_role));

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================

DROP TRIGGER IF EXISTS update_seo_content_updated_at ON public.seo_content_optimization;
CREATE TRIGGER update_seo_content_updated_at
BEFORE UPDATE ON public.seo_content_optimization
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_seo_semantic_updated_at ON public.seo_semantic_analysis;
CREATE TRIGGER update_seo_semantic_updated_at
BEFORE UPDATE ON public.seo_semantic_analysis
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to get content by optimization score range
CREATE OR REPLACE FUNCTION public.get_content_by_score_range(
  min_score INTEGER DEFAULT 0,
  max_score INTEGER DEFAULT 100
)
RETURNS TABLE (
  url TEXT,
  page_title TEXT,
  optimization_score INTEGER,
  optimization_level TEXT,
  analyzed_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    url,
    page_title,
    optimization_score,
    optimization_level,
    analyzed_at
  FROM public.seo_content_optimization
  WHERE optimization_score >= min_score
    AND optimization_score <= max_score
  ORDER BY optimization_score ASC, analyzed_at DESC;
$$;

-- Function to get pages needing optimization
CREATE OR REPLACE FUNCTION public.get_pages_needing_optimization()
RETURNS TABLE (
  url TEXT,
  page_title TEXT,
  optimization_score INTEGER,
  critical_issues TEXT[]
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    url,
    page_title,
    optimization_score,
    ARRAY(
      SELECT jsonb_array_elements_text(ai_suggestions)::jsonb->>'type'
      FROM public.seo_content_optimization sco
      WHERE sco.url = public.seo_content_optimization.url
        AND (ai_suggestions::jsonb->>'priority' = 'high' OR ai_suggestions::jsonb->>'priority' = 'critical')
    ) as critical_issues
  FROM public.seo_content_optimization
  WHERE optimization_score < 70
  ORDER BY optimization_score ASC;
$$;

-- Function to find topic cluster opportunities
CREATE OR REPLACE FUNCTION public.find_topic_cluster_opportunities()
RETURNS TABLE (
  primary_topic TEXT,
  page_count BIGINT,
  has_pillar_content BOOLEAN,
  average_score NUMERIC(5,2)
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    primary_topic,
    COUNT(*)::BIGINT as page_count,
    BOOL_OR(is_pillar_content) as has_pillar_content,
    AVG(topical_authority_score) as average_score
  FROM public.seo_semantic_analysis
  GROUP BY primary_topic
  HAVING COUNT(*) >= 3 -- At least 3 pieces of content on the topic
  ORDER BY page_count DESC, average_score DESC;
$$;

-- Function to calculate content freshness score
CREATE OR REPLACE FUNCTION public.calculate_content_freshness_score(
  p_analyzed_at TIMESTAMP WITH TIME ZONE
)
RETURNS INTEGER
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  days_old INTEGER;
  freshness_score INTEGER;
BEGIN
  days_old := EXTRACT(DAY FROM now() - p_analyzed_at)::INTEGER;

  CASE
    WHEN days_old <= 7 THEN freshness_score := 100;
    WHEN days_old <= 30 THEN freshness_score := 90;
    WHEN days_old <= 90 THEN freshness_score := 75;
    WHEN days_old <= 180 THEN freshness_score := 50;
    WHEN days_old <= 365 THEN freshness_score := 25;
    ELSE freshness_score := 10;
  END CASE;

  RETURN freshness_score;
END;
$$;

-- ============================================
-- VIEWS FOR CONVENIENCE
-- ============================================

-- View for content optimization overview
CREATE OR REPLACE VIEW public.seo_content_optimization_summary AS
SELECT
  COUNT(*) as total_pages,
  COUNT(*) FILTER (WHERE optimization_score >= 90) as excellent_pages,
  COUNT(*) FILTER (WHERE optimization_score >= 70 AND optimization_score < 90) as good_pages,
  COUNT(*) FILTER (WHERE optimization_score >= 50 AND optimization_score < 70) as fair_pages,
  COUNT(*) FILTER (WHERE optimization_score < 50) as poor_pages,
  AVG(optimization_score)::NUMERIC(5,2) as avg_optimization_score,
  AVG(readability_score)::NUMERIC(5,2) as avg_readability_score,
  AVG(word_count)::INTEGER as avg_word_count
FROM public.seo_content_optimization;

-- View for semantic analysis overview
CREATE OR REPLACE VIEW public.seo_semantic_analysis_summary AS
SELECT
  COUNT(*) as total_pages_analyzed,
  COUNT(DISTINCT primary_topic) as unique_topics,
  COUNT(DISTINCT topic_cluster_id) as topic_clusters,
  COUNT(*) FILTER (WHERE is_pillar_content = true) as pillar_content_count,
  AVG(semantic_relevance_score)::NUMERIC(5,2) as avg_semantic_score,
  AVG(topical_authority_score)::NUMERIC(5,2) as avg_authority_score,
  AVG(eat_score)::NUMERIC(5,2) as avg_eat_score
FROM public.seo_semantic_analysis;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE public.seo_content_optimization IS 'AI-powered content analysis and optimization suggestions';
COMMENT ON TABLE public.seo_semantic_analysis IS 'Semantic keyword analysis and topic clustering';

COMMENT ON FUNCTION public.get_content_by_score_range IS 'Get content filtered by optimization score range';
COMMENT ON FUNCTION public.get_pages_needing_optimization IS 'Get pages with low optimization scores and critical issues';
COMMENT ON FUNCTION public.find_topic_cluster_opportunities IS 'Find topics with multiple pieces of content that could form clusters';
COMMENT ON FUNCTION public.calculate_content_freshness_score IS 'Calculate content freshness score based on analysis date';

COMMENT ON VIEW public.seo_content_optimization_summary IS 'Summary statistics for content optimization';
COMMENT ON VIEW public.seo_semantic_analysis_summary IS 'Summary statistics for semantic analysis';
-- ============================================
-- SEARCH ANALYTICS DASHBOARD - MULTI-PLATFORM INTEGRATION
-- ============================================
-- Migration: Comprehensive search traffic analytics dashboard
-- Platforms: Google Analytics 4, Bing Webmaster Tools, Yandex Webmaster
-- Purpose: Unified analytics view for all search traffic sources

-- ============================================
-- GOOGLE ANALYTICS 4 OAUTH CREDENTIALS TABLE
-- ============================================
-- Stores encrypted OAuth credentials for Google Analytics 4 API access

CREATE TABLE IF NOT EXISTS public.ga4_oauth_credentials (
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

  CONSTRAINT one_active_ga4_credential_per_user UNIQUE (user_id, is_active)
);

-- ============================================
-- GOOGLE ANALYTICS 4 PROPERTIES TABLE
-- ============================================
-- Stores GA4 properties connected to the account

CREATE TABLE IF NOT EXISTS public.ga4_properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  credential_id UUID REFERENCES ga4_oauth_credentials(id) ON DELETE CASCADE,
  property_id TEXT NOT NULL, -- GA4 property ID (e.g., "123456789")
  property_name TEXT NOT NULL,
  display_name TEXT,
  property_type TEXT DEFAULT 'PROPERTY_TYPE_ORDINARY',
  currency_code TEXT DEFAULT 'USD',
  time_zone TEXT DEFAULT 'America/Los_Angeles',
  is_primary BOOLEAN DEFAULT false,
  last_synced_at TIMESTAMP WITH TIME ZONE,
  sync_status TEXT DEFAULT 'pending' CHECK (sync_status IN ('pending', 'syncing', 'completed', 'failed')),
  sync_error TEXT,
  sync_frequency TEXT DEFAULT 'daily' CHECK (sync_frequency IN ('hourly', 'daily', 'weekly', 'manual')),
  auto_sync_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),

  CONSTRAINT unique_ga4_property_per_user UNIQUE (user_id, property_id)
);

-- ============================================
-- GOOGLE ANALYTICS 4 TRAFFIC DATA TABLE
-- ============================================
-- Stores traffic metrics from Google Analytics 4

CREATE TABLE IF NOT EXISTS public.ga4_traffic_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES ga4_properties(id) ON DELETE CASCADE,

  -- Dimensions
  date DATE NOT NULL,
  page_path TEXT,
  page_title TEXT,
  landing_page TEXT,
  source TEXT,
  medium TEXT,
  campaign TEXT,
  device_category TEXT CHECK (device_category IN ('desktop', 'mobile', 'tablet')),
  country TEXT,
  city TEXT,

  -- Traffic metrics
  sessions INTEGER DEFAULT 0,
  users INTEGER DEFAULT 0,
  new_users INTEGER DEFAULT 0,
  pageviews INTEGER DEFAULT 0,
  engaged_sessions INTEGER DEFAULT 0,

  -- Engagement metrics
  average_session_duration NUMERIC(10,2), -- in seconds
  bounce_rate NUMERIC(10,6), -- stored as decimal
  engagement_rate NUMERIC(10,6),
  events_per_session NUMERIC(10,2),

  -- Conversion metrics
  conversions INTEGER DEFAULT 0,
  conversion_rate NUMERIC(10,6),
  total_revenue NUMERIC(12,2),

  -- Change tracking
  sessions_change INTEGER,
  users_change INTEGER,
  pageviews_change INTEGER,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),

  CONSTRAINT unique_ga4_traffic_date UNIQUE (property_id, date, page_path, source, medium, device_category, country)
);

-- ============================================
-- BING WEBMASTER TOOLS OAUTH CREDENTIALS TABLE
-- ============================================
-- Stores OAuth credentials for Bing Webmaster Tools API

CREATE TABLE IF NOT EXISTS public.bing_webmaster_oauth_credentials (
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

  CONSTRAINT one_active_bing_credential_per_user UNIQUE (user_id, is_active)
);

-- ============================================
-- BING WEBMASTER SITES TABLE
-- ============================================
-- Stores Bing Webmaster Tools sites connected to the account

CREATE TABLE IF NOT EXISTS public.bing_webmaster_sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  credential_id UUID REFERENCES bing_webmaster_oauth_credentials(id) ON DELETE CASCADE,
  site_url TEXT NOT NULL,
  site_name TEXT,
  is_verified BOOLEAN DEFAULT false,
  is_primary BOOLEAN DEFAULT false,
  last_synced_at TIMESTAMP WITH TIME ZONE,
  sync_status TEXT DEFAULT 'pending' CHECK (sync_status IN ('pending', 'syncing', 'completed', 'failed')),
  sync_error TEXT,
  sync_frequency TEXT DEFAULT 'daily' CHECK (sync_frequency IN ('hourly', 'daily', 'weekly', 'manual')),
  auto_sync_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),

  CONSTRAINT unique_bing_site_per_user UNIQUE (user_id, site_url)
);

-- ============================================
-- BING WEBMASTER SEARCH DATA TABLE
-- ============================================
-- Stores search performance data from Bing Webmaster Tools

CREATE TABLE IF NOT EXISTS public.bing_webmaster_search_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES bing_webmaster_sites(id) ON DELETE CASCADE,

  -- Dimensions
  date DATE NOT NULL,
  query TEXT,
  page_url TEXT,
  country TEXT,
  device TEXT CHECK (device IN ('Desktop', 'Mobile', 'Tablet')),

  -- Performance metrics
  clicks INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  ctr NUMERIC(10,6), -- Click-through rate
  average_position NUMERIC(10,2),

  -- Change tracking
  clicks_change INTEGER,
  impressions_change INTEGER,
  ctr_change NUMERIC(10,6),
  position_change NUMERIC(10,2),

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),

  CONSTRAINT unique_bing_search_date UNIQUE (site_id, date, query, page_url, device, country)
);

-- ============================================
-- YANDEX WEBMASTER OAUTH CREDENTIALS TABLE
-- ============================================
-- Stores OAuth credentials for Yandex Webmaster API

CREATE TABLE IF NOT EXISTS public.yandex_webmaster_oauth_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_type TEXT DEFAULT 'Bearer',
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_refreshed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),

  CONSTRAINT one_active_yandex_credential_per_user UNIQUE (user_id, is_active)
);

-- ============================================
-- YANDEX WEBMASTER SITES TABLE
-- ============================================
-- Stores Yandex Webmaster sites connected to the account

CREATE TABLE IF NOT EXISTS public.yandex_webmaster_sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  credential_id UUID REFERENCES yandex_webmaster_oauth_credentials(id) ON DELETE CASCADE,
  host_id TEXT NOT NULL, -- Yandex host ID
  host_url TEXT NOT NULL,
  host_display_name TEXT,
  verification_state TEXT,
  is_primary BOOLEAN DEFAULT false,
  last_synced_at TIMESTAMP WITH TIME ZONE,
  sync_status TEXT DEFAULT 'pending' CHECK (sync_status IN ('pending', 'syncing', 'completed', 'failed')),
  sync_error TEXT,
  sync_frequency TEXT DEFAULT 'daily' CHECK (sync_frequency IN ('hourly', 'daily', 'weekly', 'manual')),
  auto_sync_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),

  CONSTRAINT unique_yandex_site_per_user UNIQUE (user_id, host_id)
);

-- ============================================
-- YANDEX WEBMASTER SEARCH DATA TABLE
-- ============================================
-- Stores search performance data from Yandex Webmaster

CREATE TABLE IF NOT EXISTS public.yandex_webmaster_search_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES yandex_webmaster_sites(id) ON DELETE CASCADE,

  -- Dimensions
  date DATE NOT NULL,
  query TEXT,
  page_url TEXT,
  device TEXT CHECK (device IN ('DESKTOP', 'MOBILE_AND_TABLET', 'ALL')),

  -- Performance metrics
  clicks INTEGER DEFAULT 0,
  shows INTEGER DEFAULT 0, -- Yandex uses "shows" instead of "impressions"
  ctr NUMERIC(10,6),
  position NUMERIC(10,2),

  -- Change tracking
  clicks_change INTEGER,
  shows_change INTEGER,
  ctr_change NUMERIC(10,6),
  position_change NUMERIC(10,2),

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),

  CONSTRAINT unique_yandex_search_date UNIQUE (site_id, date, query, page_url, device)
);

-- ============================================
-- UNIFIED SEARCH ANALYTICS VIEW
-- ============================================
-- Aggregated view combining all search platforms

CREATE TABLE IF NOT EXISTS public.unified_search_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Source identification
  source_platform TEXT NOT NULL CHECK (source_platform IN ('google_search_console', 'google_analytics', 'bing_webmaster', 'yandex_webmaster')),
  source_property_id UUID, -- Reference to the source property/site

  -- Dimensions
  date DATE NOT NULL,
  page_url TEXT,
  page_title TEXT,
  query TEXT,
  country TEXT,
  device TEXT,

  -- Normalized metrics (standardized across platforms)
  clicks INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0, -- shows for Yandex
  sessions INTEGER DEFAULT 0, -- GA4 only
  users INTEGER DEFAULT 0, -- GA4 only
  pageviews INTEGER DEFAULT 0, -- GA4 only
  ctr NUMERIC(10,6),
  average_position NUMERIC(10,2),
  bounce_rate NUMERIC(10,6), -- GA4 only
  engagement_rate NUMERIC(10,6), -- GA4 only

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),

  CONSTRAINT unique_unified_analytics UNIQUE (user_id, source_platform, date, page_url, query, device, country)
);

-- ============================================
-- DASHBOARD CONFIGURATION TABLE
-- ============================================
-- Stores user preferences for dashboard display

CREATE TABLE IF NOT EXISTS public.search_dashboard_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Display preferences
  default_date_range TEXT DEFAULT '30days' CHECK (default_date_range IN ('7days', '30days', '90days', '6months', '1year', 'custom')),
  default_comparison_period TEXT DEFAULT 'previous_period' CHECK (default_comparison_period IN ('previous_period', 'previous_year', 'none')),
  default_grouping TEXT DEFAULT 'daily' CHECK (default_grouping IN ('hourly', 'daily', 'weekly', 'monthly')),

  -- Platform preferences
  enabled_platforms JSONB DEFAULT '["google_search_console", "google_analytics"]',
  primary_platform TEXT DEFAULT 'google_search_console',

  -- Widget configuration
  dashboard_layout JSONB DEFAULT '[]', -- Store widget positions and sizes
  visible_metrics JSONB DEFAULT '["clicks", "impressions", "ctr", "position", "sessions", "users"]',

  -- Notification preferences
  enable_alerts BOOLEAN DEFAULT true,
  alert_thresholds JSONB DEFAULT '{}', -- Custom threshold values

  -- Export preferences
  export_format TEXT DEFAULT 'csv' CHECK (export_format IN ('csv', 'xlsx', 'json', 'pdf')),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),

  CONSTRAINT one_config_per_user UNIQUE (user_id)
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- GA4 OAuth Credentials indexes
CREATE INDEX IF NOT EXISTS idx_ga4_oauth_user_id ON public.ga4_oauth_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_ga4_oauth_active ON public.ga4_oauth_credentials(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_ga4_oauth_expires_at ON public.ga4_oauth_credentials(expires_at);

-- GA4 Properties indexes
CREATE INDEX IF NOT EXISTS idx_ga4_properties_user_id ON public.ga4_properties(user_id);
CREATE INDEX IF NOT EXISTS idx_ga4_properties_property_id ON public.ga4_properties(property_id);
CREATE INDEX IF NOT EXISTS idx_ga4_properties_sync_status ON public.ga4_properties(sync_status);

-- GA4 Traffic Data indexes
CREATE INDEX IF NOT EXISTS idx_ga4_traffic_property_id ON public.ga4_traffic_data(property_id);
CREATE INDEX IF NOT EXISTS idx_ga4_traffic_date ON public.ga4_traffic_data(date DESC);
CREATE INDEX IF NOT EXISTS idx_ga4_traffic_page_path ON public.ga4_traffic_data(page_path);
CREATE INDEX IF NOT EXISTS idx_ga4_traffic_source ON public.ga4_traffic_data(source);
CREATE INDEX IF NOT EXISTS idx_ga4_traffic_device ON public.ga4_traffic_data(device_category);

-- Bing OAuth Credentials indexes
CREATE INDEX IF NOT EXISTS idx_bing_oauth_user_id ON public.bing_webmaster_oauth_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_bing_oauth_active ON public.bing_webmaster_oauth_credentials(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_bing_oauth_expires_at ON public.bing_webmaster_oauth_credentials(expires_at);

-- Bing Sites indexes
CREATE INDEX IF NOT EXISTS idx_bing_sites_user_id ON public.bing_webmaster_sites(user_id);
CREATE INDEX IF NOT EXISTS idx_bing_sites_url ON public.bing_webmaster_sites(site_url);
CREATE INDEX IF NOT EXISTS idx_bing_sites_sync_status ON public.bing_webmaster_sites(sync_status);

-- Bing Search Data indexes
CREATE INDEX IF NOT EXISTS idx_bing_search_site_id ON public.bing_webmaster_search_data(site_id);
CREATE INDEX IF NOT EXISTS idx_bing_search_date ON public.bing_webmaster_search_data(date DESC);
CREATE INDEX IF NOT EXISTS idx_bing_search_query ON public.bing_webmaster_search_data(query);
CREATE INDEX IF NOT EXISTS idx_bing_search_page ON public.bing_webmaster_search_data(page_url);

-- Yandex OAuth Credentials indexes
CREATE INDEX IF NOT EXISTS idx_yandex_oauth_user_id ON public.yandex_webmaster_oauth_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_yandex_oauth_active ON public.yandex_webmaster_oauth_credentials(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_yandex_oauth_expires_at ON public.yandex_webmaster_oauth_credentials(expires_at);

-- Yandex Sites indexes
CREATE INDEX IF NOT EXISTS idx_yandex_sites_user_id ON public.yandex_webmaster_sites(user_id);
CREATE INDEX IF NOT EXISTS idx_yandex_sites_host_id ON public.yandex_webmaster_sites(host_id);
CREATE INDEX IF NOT EXISTS idx_yandex_sites_sync_status ON public.yandex_webmaster_sites(sync_status);

-- Yandex Search Data indexes
CREATE INDEX IF NOT EXISTS idx_yandex_search_site_id ON public.yandex_webmaster_search_data(site_id);
CREATE INDEX IF NOT EXISTS idx_yandex_search_date ON public.yandex_webmaster_search_data(date DESC);
CREATE INDEX IF NOT EXISTS idx_yandex_search_query ON public.yandex_webmaster_search_data(query);
CREATE INDEX IF NOT EXISTS idx_yandex_search_page ON public.yandex_webmaster_search_data(page_url);

-- Unified Analytics indexes
CREATE INDEX IF NOT EXISTS idx_unified_user_id ON public.unified_search_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_unified_platform ON public.unified_search_analytics(source_platform);
CREATE INDEX IF NOT EXISTS idx_unified_date ON public.unified_search_analytics(date DESC);
CREATE INDEX IF NOT EXISTS idx_unified_page ON public.unified_search_analytics(page_url);
CREATE INDEX IF NOT EXISTS idx_unified_query ON public.unified_search_analytics(query);
CREATE INDEX IF NOT EXISTS idx_unified_composite ON public.unified_search_analytics(user_id, date DESC, source_platform);

-- Dashboard Config indexes
CREATE INDEX IF NOT EXISTS idx_dashboard_config_user_id ON public.search_dashboard_config(user_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.ga4_oauth_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ga4_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ga4_traffic_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bing_webmaster_oauth_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bing_webmaster_sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bing_webmaster_search_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.yandex_webmaster_oauth_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.yandex_webmaster_sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.yandex_webmaster_search_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unified_search_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_dashboard_config ENABLE ROW LEVEL SECURITY;

-- GA4 OAuth Credentials policies
DROP POLICY IF EXISTS "Users can manage their own GA4 credentials" ON public.ga4_oauth_credentials;
CREATE POLICY "Users can manage their own GA4 credentials"
ON public.ga4_oauth_credentials FOR ALL
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage all GA4 credentials" ON public.ga4_oauth_credentials;
CREATE POLICY "Admins can manage all GA4 credentials"
ON public.ga4_oauth_credentials FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- GA4 Properties policies
DROP POLICY IF EXISTS "Users can manage their own GA4 properties" ON public.ga4_properties;
CREATE POLICY "Users can manage their own GA4 properties"
ON public.ga4_properties FOR ALL
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage all GA4 properties" ON public.ga4_properties;
CREATE POLICY "Admins can manage all GA4 properties"
ON public.ga4_properties FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- GA4 Traffic Data policies
DROP POLICY IF EXISTS "Users can view their own GA4 traffic data" ON public.ga4_traffic_data;
CREATE POLICY "Users can view their own GA4 traffic data"
ON public.ga4_traffic_data FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.ga4_properties
    WHERE ga4_properties.id = ga4_traffic_data.property_id
    AND ga4_properties.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Admins can manage all GA4 traffic data" ON public.ga4_traffic_data;
CREATE POLICY "Admins can manage all GA4 traffic data"
ON public.ga4_traffic_data FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Bing OAuth Credentials policies
DROP POLICY IF EXISTS "Users can manage their own Bing credentials" ON public.bing_webmaster_oauth_credentials;
CREATE POLICY "Users can manage their own Bing credentials"
ON public.bing_webmaster_oauth_credentials FOR ALL
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage all Bing credentials" ON public.bing_webmaster_oauth_credentials;
CREATE POLICY "Admins can manage all Bing credentials"
ON public.bing_webmaster_oauth_credentials FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Bing Sites policies
DROP POLICY IF EXISTS "Users can manage their own Bing sites" ON public.bing_webmaster_sites;
CREATE POLICY "Users can manage their own Bing sites"
ON public.bing_webmaster_sites FOR ALL
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage all Bing sites" ON public.bing_webmaster_sites;
CREATE POLICY "Admins can manage all Bing sites"
ON public.bing_webmaster_sites FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Bing Search Data policies
DROP POLICY IF EXISTS "Users can view their own Bing search data" ON public.bing_webmaster_search_data;
CREATE POLICY "Users can view their own Bing search data"
ON public.bing_webmaster_search_data FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.bing_webmaster_sites
    WHERE bing_webmaster_sites.id = bing_webmaster_search_data.site_id
    AND bing_webmaster_sites.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Admins can manage all Bing search data" ON public.bing_webmaster_search_data;
CREATE POLICY "Admins can manage all Bing search data"
ON public.bing_webmaster_search_data FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Yandex OAuth Credentials policies
DROP POLICY IF EXISTS "Users can manage their own Yandex credentials" ON public.yandex_webmaster_oauth_credentials;
CREATE POLICY "Users can manage their own Yandex credentials"
ON public.yandex_webmaster_oauth_credentials FOR ALL
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage all Yandex credentials" ON public.yandex_webmaster_oauth_credentials;
CREATE POLICY "Admins can manage all Yandex credentials"
ON public.yandex_webmaster_oauth_credentials FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Yandex Sites policies
DROP POLICY IF EXISTS "Users can manage their own Yandex sites" ON public.yandex_webmaster_sites;
CREATE POLICY "Users can manage their own Yandex sites"
ON public.yandex_webmaster_sites FOR ALL
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage all Yandex sites" ON public.yandex_webmaster_sites;
CREATE POLICY "Admins can manage all Yandex sites"
ON public.yandex_webmaster_sites FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Yandex Search Data policies
DROP POLICY IF EXISTS "Users can view their own Yandex search data" ON public.yandex_webmaster_search_data;
CREATE POLICY "Users can view their own Yandex search data"
ON public.yandex_webmaster_search_data FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.yandex_webmaster_sites
    WHERE yandex_webmaster_sites.id = yandex_webmaster_search_data.site_id
    AND yandex_webmaster_sites.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Admins can manage all Yandex search data" ON public.yandex_webmaster_search_data;
CREATE POLICY "Admins can manage all Yandex search data"
ON public.yandex_webmaster_search_data FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Unified Analytics policies
DROP POLICY IF EXISTS "Users can view their own unified analytics" ON public.unified_search_analytics;
CREATE POLICY "Users can view their own unified analytics"
ON public.unified_search_analytics FOR ALL
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage all unified analytics" ON public.unified_search_analytics;
CREATE POLICY "Admins can manage all unified analytics"
ON public.unified_search_analytics FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Dashboard Config policies
DROP POLICY IF EXISTS "Users can manage their own dashboard config" ON public.search_dashboard_config;
CREATE POLICY "Users can manage their own dashboard config"
ON public.search_dashboard_config FOR ALL
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage all dashboard configs" ON public.search_dashboard_config;
CREATE POLICY "Admins can manage all dashboard configs"
ON public.search_dashboard_config FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================

DROP TRIGGER IF EXISTS update_ga4_oauth_credentials_updated_at ON public.ga4_oauth_credentials;
CREATE TRIGGER update_ga4_oauth_credentials_updated_at
BEFORE UPDATE ON public.ga4_oauth_credentials
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_ga4_properties_updated_at ON public.ga4_properties;
CREATE TRIGGER update_ga4_properties_updated_at
BEFORE UPDATE ON public.ga4_properties
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_bing_oauth_credentials_updated_at ON public.bing_webmaster_oauth_credentials;
CREATE TRIGGER update_bing_oauth_credentials_updated_at
BEFORE UPDATE ON public.bing_webmaster_oauth_credentials
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_bing_sites_updated_at ON public.bing_webmaster_sites;
CREATE TRIGGER update_bing_sites_updated_at
BEFORE UPDATE ON public.bing_webmaster_sites
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_yandex_oauth_credentials_updated_at ON public.yandex_webmaster_oauth_credentials;
CREATE TRIGGER update_yandex_oauth_credentials_updated_at
BEFORE UPDATE ON public.yandex_webmaster_oauth_credentials
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_yandex_sites_updated_at ON public.yandex_webmaster_sites;
CREATE TRIGGER update_yandex_sites_updated_at
BEFORE UPDATE ON public.yandex_webmaster_sites
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_unified_analytics_updated_at ON public.unified_search_analytics;
CREATE TRIGGER update_unified_analytics_updated_at
BEFORE UPDATE ON public.unified_search_analytics
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_dashboard_config_updated_at ON public.search_dashboard_config;
CREATE TRIGGER update_dashboard_config_updated_at
BEFORE UPDATE ON public.search_dashboard_config
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to get all connected platforms for a user
CREATE OR REPLACE FUNCTION public.get_connected_search_platforms(p_user_id UUID)
RETURNS TABLE (
  platform TEXT,
  is_connected BOOLEAN,
  last_sync TIMESTAMP WITH TIME ZONE,
  credential_status TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT 'google_analytics' as platform,
         EXISTS(SELECT 1 FROM public.ga4_oauth_credentials WHERE user_id = p_user_id AND is_active = true) as is_connected,
         (SELECT MAX(last_synced_at) FROM public.ga4_properties WHERE user_id = p_user_id) as last_sync,
         CASE
           WHEN EXISTS(SELECT 1 FROM public.ga4_oauth_credentials WHERE user_id = p_user_id AND is_active = true AND expires_at > now()) THEN 'active'
           WHEN EXISTS(SELECT 1 FROM public.ga4_oauth_credentials WHERE user_id = p_user_id AND is_active = true) THEN 'expired'
           ELSE 'not_connected'
         END as credential_status

  UNION ALL

  SELECT 'google_search_console' as platform,
         EXISTS(SELECT 1 FROM public.gsc_oauth_credentials WHERE user_id = p_user_id AND is_active = true) as is_connected,
         (SELECT MAX(last_synced_at) FROM public.gsc_properties WHERE user_id = p_user_id) as last_sync,
         CASE
           WHEN EXISTS(SELECT 1 FROM public.gsc_oauth_credentials WHERE user_id = p_user_id AND is_active = true AND expires_at > now()) THEN 'active'
           WHEN EXISTS(SELECT 1 FROM public.gsc_oauth_credentials WHERE user_id = p_user_id AND is_active = true) THEN 'expired'
           ELSE 'not_connected'
         END as credential_status

  UNION ALL

  SELECT 'bing_webmaster' as platform,
         EXISTS(SELECT 1 FROM public.bing_webmaster_oauth_credentials WHERE user_id = p_user_id AND is_active = true) as is_connected,
         (SELECT MAX(last_synced_at) FROM public.bing_webmaster_sites WHERE user_id = p_user_id) as last_sync,
         CASE
           WHEN EXISTS(SELECT 1 FROM public.bing_webmaster_oauth_credentials WHERE user_id = p_user_id AND is_active = true AND expires_at > now()) THEN 'active'
           WHEN EXISTS(SELECT 1 FROM public.bing_webmaster_oauth_credentials WHERE user_id = p_user_id AND is_active = true) THEN 'expired'
           ELSE 'not_connected'
         END as credential_status

  UNION ALL

  SELECT 'yandex_webmaster' as platform,
         EXISTS(SELECT 1 FROM public.yandex_webmaster_oauth_credentials WHERE user_id = p_user_id AND is_active = true) as is_connected,
         (SELECT MAX(last_synced_at) FROM public.yandex_webmaster_sites WHERE user_id = p_user_id) as last_sync,
         CASE
           WHEN EXISTS(SELECT 1 FROM public.yandex_webmaster_oauth_credentials WHERE user_id = p_user_id AND is_active = true AND expires_at > now()) THEN 'active'
           WHEN EXISTS(SELECT 1 FROM public.yandex_webmaster_oauth_credentials WHERE user_id = p_user_id AND is_active = true) THEN 'expired'
           ELSE 'not_connected'
         END as credential_status;
$$;

-- Function to aggregate unified analytics data
CREATE OR REPLACE FUNCTION public.refresh_unified_analytics(
  p_user_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  inserted_count INTEGER := 0;
  row_count_temp INTEGER;
BEGIN
  -- Insert/Update GSC data
  INSERT INTO public.unified_search_analytics (
    user_id, source_platform, source_property_id, date, page_url, query,
    country, device, clicks, impressions, ctr, average_position
  )
  SELECT
    gp.user_id,
    'google_search_console'::TEXT,
    gpp.property_id,
    gpp.date,
    gpp.url,
    NULL, -- GSC page data doesn't include query
    gpp.country,
    gpp.device,
    gpp.clicks,
    gpp.impressions,
    gpp.ctr,
    gpp.position
  FROM public.gsc_page_performance gpp
  JOIN public.gsc_properties gp ON gpp.property_id = gp.id
  WHERE gp.user_id = p_user_id
    AND gpp.date BETWEEN p_start_date AND p_end_date
  ON CONFLICT (user_id, source_platform, date, page_url, query, device, country)
  DO UPDATE SET
    clicks = EXCLUDED.clicks,
    impressions = EXCLUDED.impressions,
    ctr = EXCLUDED.ctr,
    average_position = EXCLUDED.average_position,
    updated_at = now();

  GET DIAGNOSTICS row_count_temp = ROW_COUNT;
  inserted_count := inserted_count + row_count_temp;

  -- Insert/Update GA4 data
  INSERT INTO public.unified_search_analytics (
    user_id, source_platform, source_property_id, date, page_url, page_title,
    country, device, sessions, users, pageviews, bounce_rate, engagement_rate
  )
  SELECT
    gp.user_id,
    'google_analytics'::TEXT,
    gtd.property_id,
    gtd.date,
    gtd.page_path,
    gtd.page_title,
    gtd.country,
    gtd.device_category,
    gtd.sessions,
    gtd.users,
    gtd.pageviews,
    gtd.bounce_rate,
    gtd.engagement_rate
  FROM public.ga4_traffic_data gtd
  JOIN public.ga4_properties gp ON gtd.property_id = gp.id
  WHERE gp.user_id = p_user_id
    AND gtd.date BETWEEN p_start_date AND p_end_date
  ON CONFLICT (user_id, source_platform, date, page_url, query, device, country)
  DO UPDATE SET
    sessions = EXCLUDED.sessions,
    users = EXCLUDED.users,
    pageviews = EXCLUDED.pageviews,
    bounce_rate = EXCLUDED.bounce_rate,
    engagement_rate = EXCLUDED.engagement_rate,
    updated_at = now();

  GET DIAGNOSTICS row_count_temp = ROW_COUNT;
  inserted_count := inserted_count + row_count_temp;

  -- Insert/Update Bing data
  INSERT INTO public.unified_search_analytics (
    user_id, source_platform, source_property_id, date, page_url, query,
    country, device, clicks, impressions, ctr, average_position
  )
  SELECT
    bs.user_id,
    'bing_webmaster'::TEXT,
    bsd.site_id,
    bsd.date,
    bsd.page_url,
    bsd.query,
    bsd.country,
    bsd.device,
    bsd.clicks,
    bsd.impressions,
    bsd.ctr,
    bsd.average_position
  FROM public.bing_webmaster_search_data bsd
  JOIN public.bing_webmaster_sites bs ON bsd.site_id = bs.id
  WHERE bs.user_id = p_user_id
    AND bsd.date BETWEEN p_start_date AND p_end_date
  ON CONFLICT (user_id, source_platform, date, page_url, query, device, country)
  DO UPDATE SET
    clicks = EXCLUDED.clicks,
    impressions = EXCLUDED.impressions,
    ctr = EXCLUDED.ctr,
    average_position = EXCLUDED.average_position,
    updated_at = now();

  GET DIAGNOSTICS row_count_temp = ROW_COUNT;
  inserted_count := inserted_count + row_count_temp;

  -- Insert/Update Yandex data
  INSERT INTO public.unified_search_analytics (
    user_id, source_platform, source_property_id, date, page_url, query,
    device, clicks, impressions, ctr, average_position
  )
  SELECT
    ys.user_id,
    'yandex_webmaster'::TEXT,
    ysd.site_id,
    ysd.date,
    ysd.page_url,
    ysd.query,
    ysd.device,
    ysd.clicks,
    ysd.shows, -- Yandex uses "shows" as impressions
    ysd.ctr,
    ysd.position
  FROM public.yandex_webmaster_search_data ysd
  JOIN public.yandex_webmaster_sites ys ON ysd.site_id = ys.id
  WHERE ys.user_id = p_user_id
    AND ysd.date BETWEEN p_start_date AND p_end_date
  ON CONFLICT (user_id, source_platform, date, page_url, query, device, country)
  DO UPDATE SET
    clicks = EXCLUDED.clicks,
    impressions = EXCLUDED.impressions,
    ctr = EXCLUDED.ctr,
    average_position = EXCLUDED.average_position,
    updated_at = now();

  GET DIAGNOSTICS row_count_temp = ROW_COUNT;
  inserted_count := inserted_count + row_count_temp;

  RETURN inserted_count;
END;
$$;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE public.ga4_oauth_credentials IS 'OAuth2 credentials for Google Analytics 4 API access';
COMMENT ON TABLE public.ga4_properties IS 'Google Analytics 4 properties connected to the account';
COMMENT ON TABLE public.ga4_traffic_data IS 'Traffic and engagement metrics from Google Analytics 4';
COMMENT ON TABLE public.bing_webmaster_oauth_credentials IS 'OAuth2 credentials for Bing Webmaster Tools API';
COMMENT ON TABLE public.bing_webmaster_sites IS 'Bing Webmaster Tools sites connected to the account';
COMMENT ON TABLE public.bing_webmaster_search_data IS 'Search performance metrics from Bing Webmaster Tools';
COMMENT ON TABLE public.yandex_webmaster_oauth_credentials IS 'OAuth2 credentials for Yandex Webmaster API';
COMMENT ON TABLE public.yandex_webmaster_sites IS 'Yandex Webmaster sites connected to the account';
COMMENT ON TABLE public.yandex_webmaster_search_data IS 'Search performance metrics from Yandex Webmaster';
COMMENT ON TABLE public.unified_search_analytics IS 'Aggregated analytics data from all search platforms';
COMMENT ON TABLE public.search_dashboard_config IS 'User preferences and configuration for the search analytics dashboard';

COMMENT ON FUNCTION public.get_connected_search_platforms IS 'Get connection status for all search platforms for a user';
COMMENT ON FUNCTION public.refresh_unified_analytics IS 'Aggregate and refresh unified analytics data from all platforms';
-- Add Zapier webhook integration to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS zapier_webhook_url TEXT;

-- Add index for profiles with webhook configured
CREATE INDEX IF NOT EXISTS idx_profiles_zapier_webhook
  ON public.profiles(id)
  WHERE zapier_webhook_url IS NOT NULL;

-- Comment for documentation
COMMENT ON COLUMN public.profiles.zapier_webhook_url IS 'Zapier webhook URL for automatic lead forwarding to CRM systems';
-- SEO Automation System
-- Automated audit scheduling, auto-fix rules, competitor tracking, and performance monitoring

-- =============================================
-- SEO AUDIT SCHEDULES
-- =============================================

CREATE TABLE IF NOT EXISTS seo_audit_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  schedule_type TEXT NOT NULL CHECK (schedule_type IN ('daily', 'weekly', 'monthly', 'cron')),
  cron_expression TEXT,
  audit_config JSONB DEFAULT '{}'::jsonb, -- Which checks to run (all, performance, accessibility, seo, etc.)
  notification_channels TEXT[] DEFAULT ARRAY[]::TEXT[], -- ['email', 'slack', 'in_app']
  notification_recipients TEXT[] DEFAULT ARRAY[]::TEXT[],
  active BOOLEAN DEFAULT true,
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  last_run_status TEXT CHECK (last_run_status IN ('success', 'failed', 'running')),
  last_run_results JSONB,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_seo_audit_schedules_next_run ON seo_audit_schedules(next_run_at) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_seo_audit_schedules_created_by ON seo_audit_schedules(created_by);

-- Updated_at trigger
DROP TRIGGER IF EXISTS update_seo_audit_schedules_updated_at ON seo_audit_schedules;
CREATE TRIGGER update_seo_audit_schedules_updated_at
  BEFORE UPDATE ON seo_audit_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE seo_audit_schedules IS 'Scheduled automated SEO audits';

-- =============================================
-- SEO AUTO-FIX RULES
-- =============================================

CREATE TABLE IF NOT EXISTS seo_autofix_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  issue_type TEXT NOT NULL, -- 'missing_meta_description', 'broken_link', 'missing_alt_text', etc.
  conditions JSONB DEFAULT '{}'::jsonb, -- Conditions for when to apply the fix
  fix_action JSONB NOT NULL, -- What action to take
  requires_approval BOOLEAN DEFAULT true,
  auto_apply BOOLEAN DEFAULT false, -- If true, apply without approval
  priority INTEGER DEFAULT 50, -- Higher priority rules run first
  applied_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_seo_autofix_rules_issue_type ON seo_autofix_rules(issue_type) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_seo_autofix_rules_priority ON seo_autofix_rules(priority DESC) WHERE active = true;

-- Updated_at trigger
DROP TRIGGER IF EXISTS update_seo_autofix_rules_updated_at ON seo_autofix_rules;
CREATE TRIGGER update_seo_autofix_rules_updated_at
  BEFORE UPDATE ON seo_autofix_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE seo_autofix_rules IS 'Rules for automatically fixing SEO issues';

-- =============================================
-- SEO AUTO-FIX HISTORY
-- =============================================

CREATE TABLE IF NOT EXISTS seo_autofix_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID REFERENCES seo_autofix_rules(id) ON DELETE SET NULL,
  issue_id UUID, -- Reference to specific issue (could be from various tables)
  issue_type TEXT NOT NULL,
  fix_applied JSONB NOT NULL, -- Details of what was changed
  result TEXT NOT NULL CHECK (result IN ('success', 'failed', 'rolled_back', 'pending_approval')),
  error_message TEXT,
  approved_by UUID REFERENCES auth.users(id),
  applied_by UUID REFERENCES auth.users(id),
  applied_at TIMESTAMPTZ DEFAULT now(),
  rolled_back_at TIMESTAMPTZ,
  rollback_reason TEXT
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_seo_autofix_history_rule_id ON seo_autofix_history(rule_id);
CREATE INDEX IF NOT EXISTS idx_seo_autofix_history_applied_at ON seo_autofix_history(applied_at DESC);
CREATE INDEX IF NOT EXISTS idx_seo_autofix_history_result ON seo_autofix_history(result);

COMMENT ON TABLE seo_autofix_history IS 'History of all auto-applied SEO fixes';

-- =============================================
-- SEO COMPETITOR TRACKING
-- =============================================

CREATE TABLE IF NOT EXISTS seo_competitor_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competitor_domain TEXT NOT NULL,
  competitor_name TEXT,
  keywords TEXT[] DEFAULT ARRAY[]::TEXT[], -- Keywords to track for this competitor
  check_frequency TEXT DEFAULT 'weekly' CHECK (check_frequency IN ('daily', 'weekly', 'biweekly', 'monthly')),
  last_checked_at TIMESTAMPTZ,
  next_check_at TIMESTAMPTZ,
  alert_on_rank_change BOOLEAN DEFAULT true,
  alert_on_new_backlinks BOOLEAN DEFAULT true,
  alert_on_content_updates BOOLEAN DEFAULT false,
  rank_change_threshold INTEGER DEFAULT 5, -- Alert if rank changes by more than N positions
  notification_channels TEXT[] DEFAULT ARRAY['in_app']::TEXT[],
  notification_recipients TEXT[] DEFAULT ARRAY[]::TEXT[],
  active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb, -- Additional tracking metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_seo_competitor_tracking_next_check ON seo_competitor_tracking(next_check_at) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_seo_competitor_tracking_domain ON seo_competitor_tracking(competitor_domain);

-- Updated_at trigger
DROP TRIGGER IF EXISTS update_seo_competitor_tracking_updated_at ON seo_competitor_tracking;
CREATE TRIGGER update_seo_competitor_tracking_updated_at
  BEFORE UPDATE ON seo_competitor_tracking
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE seo_competitor_tracking IS 'Automated competitor monitoring and tracking';

-- =============================================
-- SEO AUTOMATION LOGS
-- =============================================

CREATE TABLE IF NOT EXISTS seo_automation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_type TEXT NOT NULL CHECK (automation_type IN ('audit', 'autofix', 'competitor_check', 'report_generation')),
  automation_id UUID, -- ID of the schedule/rule/tracker
  status TEXT NOT NULL CHECK (status IN ('started', 'running', 'completed', 'failed')),
  message TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  duration_ms INTEGER, -- Execution time in milliseconds
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_seo_automation_logs_type ON seo_automation_logs(automation_type);
CREATE INDEX IF NOT EXISTS idx_seo_automation_logs_created_at ON seo_automation_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_seo_automation_logs_status ON seo_automation_logs(status);

COMMENT ON TABLE seo_automation_logs IS 'Logs of all SEO automation executions';

-- =============================================
-- SEO NOTIFICATION QUEUE
-- =============================================

CREATE TABLE IF NOT EXISTS seo_notification_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_type TEXT NOT NULL CHECK (notification_type IN ('critical_issue', 'warning', 'opportunity', 'competitor_alert', 'report_ready')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  channels TEXT[] NOT NULL, -- ['email', 'slack', 'in_app']
  recipients TEXT[] NOT NULL,
  data JSONB DEFAULT '{}'::jsonb, -- Additional notification data
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_seo_notification_queue_status ON seo_notification_queue(status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_seo_notification_queue_created_at ON seo_notification_queue(created_at DESC);

COMMENT ON TABLE seo_notification_queue IS 'Queue for SEO-related notifications';

-- =============================================
-- SEO SCHEDULED REPORTS
-- =============================================

CREATE TABLE IF NOT EXISTS seo_scheduled_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  report_type TEXT NOT NULL CHECK (report_type IN ('comprehensive', 'executive_summary', 'keyword_performance', 'competitor_analysis', 'technical_seo')),
  schedule_type TEXT NOT NULL CHECK (schedule_type IN ('daily', 'weekly', 'monthly', 'cron')),
  cron_expression TEXT,
  report_config JSONB DEFAULT '{}'::jsonb, -- What to include in the report
  format TEXT DEFAULT 'pdf' CHECK (format IN ('pdf', 'html', 'json')),
  recipients TEXT[] NOT NULL,
  delivery_channels TEXT[] DEFAULT ARRAY['email']::TEXT[],
  active BOOLEAN DEFAULT true,
  last_generated_at TIMESTAMPTZ,
  next_generation_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_seo_scheduled_reports_next_gen ON seo_scheduled_reports(next_generation_at) WHERE active = true;

-- Updated_at trigger
DROP TRIGGER IF EXISTS update_seo_scheduled_reports_updated_at ON seo_scheduled_reports;
CREATE TRIGGER update_seo_scheduled_reports_updated_at
  BEFORE UPDATE ON seo_scheduled_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE seo_scheduled_reports IS 'Scheduled automated SEO reports';

-- =============================================
-- SEO REPORT HISTORY
-- =============================================

CREATE TABLE IF NOT EXISTS seo_report_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID REFERENCES seo_scheduled_reports(id) ON DELETE SET NULL,
  report_type TEXT NOT NULL,
  report_data JSONB NOT NULL, -- Full report data
  file_url TEXT, -- If stored as file
  generated_at TIMESTAMPTZ DEFAULT now(),
  sent_to TEXT[], -- Who received it
  generation_time_ms INTEGER
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_seo_report_history_schedule_id ON seo_report_history(schedule_id);
CREATE INDEX IF NOT EXISTS idx_seo_report_history_generated_at ON seo_report_history(generated_at DESC);

COMMENT ON TABLE seo_report_history IS 'History of generated SEO reports';

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on all tables
ALTER TABLE seo_audit_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_autofix_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_autofix_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_competitor_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_automation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_notification_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_scheduled_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_report_history ENABLE ROW LEVEL SECURITY;

-- Admin-only access policies for all tables
DROP POLICY IF EXISTS "Admin full access to seo_audit_schedules" ON seo_audit_schedules;
CREATE POLICY "Admin full access to seo_audit_schedules" ON seo_audit_schedules
  FOR ALL USING (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admin full access to seo_autofix_rules" ON seo_autofix_rules;
CREATE POLICY "Admin full access to seo_autofix_rules" ON seo_autofix_rules
  FOR ALL USING (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admin full access to seo_autofix_history" ON seo_autofix_history;
CREATE POLICY "Admin full access to seo_autofix_history" ON seo_autofix_history
  FOR ALL USING (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admin full access to seo_competitor_tracking" ON seo_competitor_tracking;
CREATE POLICY "Admin full access to seo_competitor_tracking" ON seo_competitor_tracking
  FOR ALL USING (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admin full access to seo_automation_logs" ON seo_automation_logs;
CREATE POLICY "Admin full access to seo_automation_logs" ON seo_automation_logs
  FOR ALL USING (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admin full access to seo_notification_queue" ON seo_notification_queue;
CREATE POLICY "Admin full access to seo_notification_queue" ON seo_notification_queue
  FOR ALL USING (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admin full access to seo_scheduled_reports" ON seo_scheduled_reports;
CREATE POLICY "Admin full access to seo_scheduled_reports" ON seo_scheduled_reports
  FOR ALL USING (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admin full access to seo_report_history" ON seo_report_history;
CREATE POLICY "Admin full access to seo_report_history" ON seo_report_history
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- =============================================
-- HELPER FUNCTIONS
-- =============================================

-- Function to calculate next run time based on schedule type
CREATE OR REPLACE FUNCTION calculate_next_run_time(
  p_schedule_type TEXT,
  p_cron_expression TEXT DEFAULT NULL,
  p_current_time TIMESTAMPTZ DEFAULT now()
)
RETURNS TIMESTAMPTZ AS $$
BEGIN
  CASE p_schedule_type
    WHEN 'daily' THEN
      RETURN p_current_time + INTERVAL '1 day';
    WHEN 'weekly' THEN
      RETURN p_current_time + INTERVAL '7 days';
    WHEN 'monthly' THEN
      RETURN p_current_time + INTERVAL '1 month';
    WHEN 'cron' THEN
      -- For cron, we'll calculate in the edge function
      -- This is a placeholder - actual cron parsing would be more complex
      RETURN p_current_time + INTERVAL '1 hour';
    ELSE
      RETURN p_current_time + INTERVAL '1 day';
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- Function to log automation execution
CREATE OR REPLACE FUNCTION log_automation_execution(
  p_automation_type TEXT,
  p_automation_id UUID,
  p_status TEXT,
  p_message TEXT DEFAULT NULL,
  p_details JSONB DEFAULT '{}'::jsonb,
  p_duration_ms INTEGER DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO seo_automation_logs (
    automation_type,
    automation_id,
    status,
    message,
    details,
    duration_ms
  ) VALUES (
    p_automation_type,
    p_automation_id,
    p_status,
    p_message,
    p_details,
    p_duration_ms
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql;

-- Function to queue SEO notification
CREATE OR REPLACE FUNCTION queue_seo_notification(
  p_notification_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_severity TEXT,
  p_channels TEXT[],
  p_recipients TEXT[],
  p_data JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO seo_notification_queue (
    notification_type,
    title,
    message,
    severity,
    channels,
    recipients,
    data
  ) VALUES (
    p_notification_type,
    p_title,
    p_message,
    p_severity,
    p_channels,
    p_recipients,
    p_data
  )
  RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update rule statistics
CREATE OR REPLACE FUNCTION update_autofix_rule_stats(
  p_rule_id UUID,
  p_success BOOLEAN
)
RETURNS VOID AS $$
BEGIN
  UPDATE seo_autofix_rules
  SET
    applied_count = applied_count + 1,
    success_count = CASE WHEN p_success THEN success_count + 1 ELSE success_count END,
    failure_count = CASE WHEN NOT p_success THEN failure_count + 1 ELSE failure_count END,
    updated_at = now()
  WHERE id = p_rule_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- DEFAULT DATA / EXAMPLES
-- =============================================

-- Insert example audit schedule (daily comprehensive audit)
INSERT INTO seo_audit_schedules (name, description, schedule_type, audit_config, notification_channels, active)
VALUES (
  'Daily Comprehensive SEO Audit',
  'Runs a full SEO audit every day at 6:00 AM',
  'daily',
  '{"checks": ["all"], "include_performance": true, "include_accessibility": true}'::jsonb,
  ARRAY['in_app', 'email']::TEXT[],
  false -- Disabled by default, admin can enable
)
ON CONFLICT DO NOTHING;

-- Insert example auto-fix rules
INSERT INTO seo_autofix_rules (name, description, issue_type, conditions, fix_action, requires_approval, auto_apply, priority)
VALUES
  (
    'Auto-add missing alt text to images',
    'Automatically generates descriptive alt text for images missing alt attributes',
    'missing_alt_text',
    '{"image_type": "content", "exclude_decorative": true}'::jsonb,
    '{"action": "generate_alt_text", "use_ai": true}'::jsonb,
    true,
    false,
    80
  ),
  (
    'Fix broken internal links',
    'Automatically updates broken internal links to correct URLs',
    'broken_link',
    '{"link_type": "internal", "status_code": 404}'::jsonb,
    '{"action": "update_link", "find_similar": true}'::jsonb,
    true,
    false,
    90
  ),
  (
    'Add missing meta descriptions',
    'Generates meta descriptions for pages missing them',
    'missing_meta_description',
    '{"page_type": "article", "min_content_length": 200}'::jsonb,
    '{"action": "generate_meta_description", "use_ai": true, "max_length": 160}'::jsonb,
    true,
    false,
    70
  )
ON CONFLICT DO NOTHING;

-- Insert example scheduled report
INSERT INTO seo_scheduled_reports (name, description, report_type, schedule_type, format, recipients, active)
VALUES (
  'Weekly SEO Executive Summary',
  'High-level overview of SEO performance sent every Monday',
  'executive_summary',
  'weekly',
  'pdf',
  ARRAY['admin@example.com']::TEXT[],
  false -- Disabled by default
)
ON CONFLICT DO NOTHING;
-- Admin Operations Hub Database Schema
-- Centralized error logging, system monitoring, and admin audit trail

-- =============================================
-- ERROR LOGS (Centralized)
-- =============================================

CREATE TABLE IF NOT EXISTS error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  error_type TEXT NOT NULL,
  error_message TEXT,
  stack_trace TEXT,
  user_context JSONB DEFAULT '{}'::jsonb, -- Browser, route, user data, etc.
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  resolved BOOLEAN DEFAULT false,
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'error_logs' AND column_name = 'severity') THEN
    CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON error_logs(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_error_logs_user_id ON error_logs(user_id);
    CREATE INDEX IF NOT EXISTS idx_error_logs_severity ON error_logs(severity) WHERE NOT resolved;
    CREATE INDEX IF NOT EXISTS idx_error_logs_resolved ON error_logs(resolved);
  END IF;
END $$;

COMMENT ON TABLE error_logs IS 'Centralized error logging for the entire application';

-- =============================================
-- SYSTEM METRICS (Real-time monitoring)
-- =============================================

CREATE TABLE IF NOT EXISTS system_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_type TEXT NOT NULL, -- 'edge_function', 'database', 'webhook', 'api'
  metric_name TEXT NOT NULL, -- Specific function/table/endpoint name
  value NUMERIC NOT NULL,
  unit TEXT, -- 'ms', 'count', 'percentage', 'bytes'
  metadata JSONB DEFAULT '{}'::jsonb,
  recorded_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'system_metrics' AND column_name = 'metric_type') THEN
    CREATE INDEX IF NOT EXISTS idx_system_metrics_recorded_at ON system_metrics(recorded_at DESC);
    CREATE INDEX IF NOT EXISTS idx_system_metrics_type_name ON system_metrics(metric_type, metric_name);
    CREATE INDEX IF NOT EXISTS idx_system_metrics_type ON system_metrics(metric_type);
  END IF;
END $$;

-- Partitioning hint: Consider partitioning by recorded_at for large datasets
COMMENT ON TABLE system_metrics IS 'Real-time system health and performance metrics';

-- =============================================
-- ADMIN AUDIT LOG (Track all admin actions)
-- =============================================

CREATE TABLE IF NOT EXISTS admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL, -- 'role_change', 'user_delete', 'seo_audit', 'impersonate', etc.
  target_type TEXT, -- 'user', 'article', 'seo_rule', etc.
  target_id UUID,
  details JSONB DEFAULT '{}'::jsonb, -- Full context of the action
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_audit_log' AND column_name = 'admin_id') THEN
    CREATE INDEX IF NOT EXISTS idx_admin_audit_log_admin_id ON admin_audit_log(admin_id);
    CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created_at ON admin_audit_log(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_admin_audit_log_action ON admin_audit_log(action);
    CREATE INDEX IF NOT EXISTS idx_admin_audit_log_target ON admin_audit_log(target_type, target_id);
  END IF;
END $$;

COMMENT ON TABLE admin_audit_log IS 'Complete audit trail of all admin operations';

-- =============================================
-- USER ACTIVITY LOG (Track user actions for support)
-- =============================================

CREATE TABLE IF NOT EXISTS user_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  activity_type TEXT NOT NULL, -- 'login', 'article_view', 'profile_update', etc.
  activity_data JSONB DEFAULT '{}'::jsonb,
  page_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_activity_log' AND column_name = 'user_id') THEN
    CREATE INDEX IF NOT EXISTS idx_user_activity_log_user_id ON user_activity_log(user_id);
    CREATE INDEX IF NOT EXISTS idx_user_activity_log_created_at ON user_activity_log(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_user_activity_log_type ON user_activity_log(activity_type);
  END IF;
END $$;

COMMENT ON TABLE user_activity_log IS 'User activity tracking for debugging and support';

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_log ENABLE ROW LEVEL SECURITY;

-- Admin-only access for error logs
DROP POLICY IF EXISTS "Admin full access to error_logs" ON error_logs;
CREATE POLICY "Admin full access to error_logs" ON error_logs
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Admin-only access for system metrics
DROP POLICY IF EXISTS "Admin full access to system_metrics" ON system_metrics;
CREATE POLICY "Admin full access to system_metrics" ON system_metrics
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Admin-only access for admin audit log
DROP POLICY IF EXISTS "Admin full access to admin_audit_log" ON admin_audit_log;
CREATE POLICY "Admin full access to admin_audit_log" ON admin_audit_log
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Admin can see all user activity, users can see their own
DROP POLICY IF EXISTS "Admin or own user activity" ON user_activity_log;
CREATE POLICY "Admin or own user activity" ON user_activity_log
  FOR SELECT USING (
    has_role(auth.uid(), 'admin') OR user_id = auth.uid()
  );

DROP POLICY IF EXISTS "Admin insert user activity" ON user_activity_log;
CREATE POLICY "Admin insert user activity" ON user_activity_log
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));

-- =============================================
-- HELPER FUNCTIONS
-- =============================================

-- Function to log admin actions
CREATE OR REPLACE FUNCTION log_admin_action(
  p_admin_id UUID,
  p_action TEXT,
  p_target_type TEXT DEFAULT NULL,
  p_target_id UUID DEFAULT NULL,
  p_details JSONB DEFAULT '{}'::jsonb,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO admin_audit_log (
    admin_id,
    action,
    target_type,
    target_id,
    details,
    ip_address,
    user_agent
  ) VALUES (
    p_admin_id,
    p_action,
    p_target_type,
    p_target_id,
    p_details,
    p_ip_address,
    p_user_agent
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log errors
CREATE OR REPLACE FUNCTION log_error(
  p_user_id UUID,
  p_error_type TEXT,
  p_error_message TEXT,
  p_stack_trace TEXT DEFAULT NULL,
  p_user_context JSONB DEFAULT '{}'::jsonb,
  p_severity TEXT DEFAULT 'medium'
)
RETURNS UUID AS $$
DECLARE
  v_error_id UUID;
BEGIN
  INSERT INTO error_logs (
    user_id,
    error_type,
    error_message,
    stack_trace,
    user_context,
    severity
  ) VALUES (
    p_user_id,
    p_error_type,
    p_error_message,
    p_stack_trace,
    p_user_context,
    p_severity
  )
  RETURNING id INTO v_error_id;

  RETURN v_error_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log user activity
CREATE OR REPLACE FUNCTION log_user_activity(
  p_user_id UUID,
  p_activity_type TEXT,
  p_activity_data JSONB DEFAULT '{}'::jsonb,
  p_page_url TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_activity_id UUID;
BEGIN
  INSERT INTO user_activity_log (
    user_id,
    activity_type,
    activity_data,
    page_url
  ) VALUES (
    p_user_id,
    p_activity_type,
    p_activity_data,
    p_page_url
  )
  RETURNING id INTO v_activity_id;

  RETURN v_activity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record system metric
CREATE OR REPLACE FUNCTION record_system_metric(
  p_metric_type TEXT,
  p_metric_name TEXT,
  p_value NUMERIC,
  p_unit TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  v_metric_id UUID;
BEGIN
  INSERT INTO system_metrics (
    metric_type,
    metric_name,
    value,
    unit,
    metadata
  ) VALUES (
    p_metric_type,
    p_metric_name,
    p_value,
    p_unit,
    p_metadata
  )
  RETURNING id INTO v_metric_id;

  RETURN v_metric_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get system health summary
CREATE OR REPLACE FUNCTION get_system_health_summary()
RETURNS TABLE (
  metric_type TEXT,
  avg_value NUMERIC,
  min_value NUMERIC,
  max_value NUMERIC,
  count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    sm.metric_type,
    AVG(sm.value)::NUMERIC,
    MIN(sm.value)::NUMERIC,
    MAX(sm.value)::NUMERIC,
    COUNT(*)::BIGINT
  FROM system_metrics sm
  WHERE sm.recorded_at > NOW() - INTERVAL '1 hour'
  GROUP BY sm.metric_type;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user statistics
CREATE OR REPLACE FUNCTION get_user_statistics()
RETURNS TABLE (
  total_users BIGINT,
  active_users_24h BIGINT,
  active_users_7d BIGINT,
  admin_count BIGINT,
  users_with_subscriptions BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM auth.users)::BIGINT,
    (SELECT COUNT(DISTINCT user_id) FROM user_activity_log WHERE created_at > NOW() - INTERVAL '24 hours')::BIGINT,
    (SELECT COUNT(DISTINCT user_id) FROM user_activity_log WHERE created_at > NOW() - INTERVAL '7 days')::BIGINT,
    (SELECT COUNT(DISTINCT user_id) FROM user_roles WHERE role = 'admin')::BIGINT,
    (SELECT COUNT(DISTINCT user_id) FROM subscriptions WHERE status = 'active')::BIGINT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- DATA RETENTION POLICIES (Optional - commented out)
-- =============================================

-- Uncomment to enable automatic cleanup of old data

-- DELETE old error logs (keep 90 days)
-- CREATE OR REPLACE FUNCTION cleanup_old_error_logs()
-- RETURNS void AS $$
-- BEGIN
--   DELETE FROM error_logs
--   WHERE created_at < NOW() - INTERVAL '90 days'
--   AND resolved = true;
-- END;
-- $$ LANGUAGE plpgsql;

-- DELETE old system metrics (keep 30 days)
-- CREATE OR REPLACE FUNCTION cleanup_old_metrics()
-- RETURNS void AS $$
-- BEGIN
--   DELETE FROM system_metrics
--   WHERE recorded_at < NOW() - INTERVAL '30 days';
-- END;
-- $$ LANGUAGE plpgsql;

-- DELETE old user activity logs (keep 180 days)
-- CREATE OR REPLACE FUNCTION cleanup_old_activity()
-- RETURNS void AS $$
-- BEGIN
--   DELETE FROM user_activity_log
--   WHERE created_at < NOW() - INTERVAL '180 days';
-- END;
-- $$ LANGUAGE plpgsql;
-- Migration: Add Calendly Integration
-- Description: Adds calendly_url field to profiles table for calendar booking integration
-- Created: 2025-11-10

-- Add calendly_url to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS calendly_url TEXT;

-- Add comment
COMMENT ON COLUMN profiles.calendly_url IS 'Calendly booking URL for showing appointments';

-- Example: https://calendly.com/johndoe/30min or https://calendly.com/johndoe/property-showing
-- Security fixes for RLS policies and database functions
-- This migration addresses critical security issues identified in security scan

-- ============================================
-- 1. FIX RLS POLICIES - RESTRICT SENSITIVE DATA ACCESS
-- ============================================

-- Drop overly permissive profile policy
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;

-- Create restricted profile view policy - only show public-safe fields
DROP POLICY IF EXISTS "Public can view limited profile info" ON public.profiles;
CREATE POLICY "Public can view limited profile info"
ON public.profiles
FOR SELECT
TO public
USING (
  is_published = true
);

-- Note: The application layer should use explicit SELECT fields to only fetch:
-- username, full_name, bio, avatar_url, theme, title, certifications, 
-- service_cities, service_zip_codes, years_experience, brokerage_name, brokerage_logo
-- Exclude: phone, email_display, license_number, license_state, etc.

-- Create authenticated user access to their own full profile
DROP POLICY IF EXISTS "Users can view own full profile" ON public.profiles;
CREATE POLICY "Users can view own full profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);


-- Fix articles table - Don't expose author_id to public
DROP POLICY IF EXISTS "Anyone can view published articles" ON public.articles;

DROP POLICY IF EXISTS "Public can view published articles without author tracking" ON public.articles;
CREATE POLICY "Public can view published articles without author tracking"
ON public.articles
FOR SELECT
TO public
USING (status = 'published');

-- Note: Application should exclude author_id from public queries


-- Fix listings table - Don't expose user_id to public
DROP POLICY IF EXISTS "Anyone can view active listings" ON public.listings;

DROP POLICY IF EXISTS "Public can view active listings without user tracking" ON public.listings;
CREATE POLICY "Public can view active listings without user tracking"
ON public.listings
FOR SELECT
TO public
USING (status IN ('active', 'pending', 'under_contract', 'sold'));

-- Note: Application should exclude user_id from public queries


-- ============================================
-- 2. ADD FIXED SEARCH_PATH TO SECURITY DEFINER FUNCTIONS
-- ============================================

-- Fix update_keyword_usage function
CREATE OR REPLACE FUNCTION public.update_keyword_usage()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
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
$function$;

-- Fix set_published_at function
CREATE OR REPLACE FUNCTION public.set_published_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  IF NEW.published = true AND OLD.published = false THEN
    NEW.published_at = now();
  END IF;
  RETURN NEW;
END;
$function$;

-- Fix ensure_single_active_page function
CREATE OR REPLACE FUNCTION public.ensure_single_active_page()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
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
$function$;

-- Fix increment_profile_views function
CREATE OR REPLACE FUNCTION public.increment_profile_views(_profile_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  UPDATE public.profiles
  SET view_count = view_count + 1
  WHERE id = _profile_id;
END;
$function$;

-- Fix increment_profile_leads function
CREATE OR REPLACE FUNCTION public.increment_profile_leads(_profile_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  UPDATE public.profiles
  SET lead_count = lead_count + 1
  WHERE id = _profile_id;
END;
$function$;

-- Fix update_profile_lead_count function
CREATE OR REPLACE FUNCTION public.update_profile_lead_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  PERFORM public.increment_profile_leads(NEW.user_id);
  RETURN NEW;
END;
$function$;

-- Fix increment_link_clicks function
CREATE OR REPLACE FUNCTION public.increment_link_clicks(link_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  UPDATE public.links
  SET click_count = COALESCE(click_count, 0) + 1
  WHERE id = link_id;
END;
$function$;

-- Fix update_usage_count function
CREATE OR REPLACE FUNCTION public.update_usage_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  INSERT INTO public.usage_tracking (user_id, resource_type, count)
  VALUES (NEW.user_id, TG_ARGV[0], 1)
  ON CONFLICT (user_id, resource_type)
  DO UPDATE SET 
    count = public.usage_tracking.count + 1,
    updated_at = now();
  RETURN NEW;
END;
$function$;

-- Fix create_default_subscription function
CREATE OR REPLACE FUNCTION public.create_default_subscription()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  INSERT INTO public.subscriptions (
    user_id,
    plan_name,
    status,
    max_listings,
    max_links,
    max_testimonials,
    analytics_history_days
  ) VALUES (
    NEW.id,
    'free',
    'active',
    3,
    5,
    3,
    7
  );
  
  RETURN NEW;
END;
$function$;

-- Fix notify_new_lead function
CREATE OR REPLACE FUNCTION public.notify_new_lead()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  PERFORM pg_notify('new_lead', json_build_object(
    'lead_id', NEW.id,
    'user_id', NEW.user_id,
    'lead_type', NEW.lead_type,
    'name', NEW.name,
    'email', NEW.email
  )::text);
  
  RETURN NEW;
END;
$function$;

-- Note: The following functions already have SET search_path = 'public':
-- - has_role
-- - check_username_available
-- - check_usage_limit
-- - handle_new_user
-- - update_updated_at_column
-- - get_user_plan
-- - check_subscription_limit
-- - refresh_unified_analytics
-- - get_connected_search_platforms

COMMENT ON FUNCTION public.update_keyword_usage() IS 'Security hardened: Added SET search_path to prevent privilege escalation';
COMMENT ON FUNCTION public.set_published_at() IS 'Security hardened: Added SET search_path to prevent privilege escalation';
COMMENT ON FUNCTION public.ensure_single_active_page() IS 'Security hardened: Added SET search_path to prevent privilege escalation';
COMMENT ON FUNCTION public.increment_profile_views(uuid) IS 'Security hardened: Added SET search_path to prevent privilege escalation';
COMMENT ON FUNCTION public.increment_profile_leads(uuid) IS 'Security hardened: Added SET search_path to prevent privilege escalation';
COMMENT ON FUNCTION public.update_profile_lead_count() IS 'Security hardened: Added SET search_path to prevent privilege escalation';
COMMENT ON FUNCTION public.increment_link_clicks(uuid) IS 'Security hardened: Added SET search_path to prevent privilege escalation';
COMMENT ON FUNCTION public.update_usage_count() IS 'Security hardened: Added SET search_path to prevent privilege escalation';
COMMENT ON FUNCTION public.create_default_subscription() IS 'Security hardened: Added SET search_path to prevent privilege escalation';
COMMENT ON FUNCTION public.notify_new_lead() IS 'Security hardened: Added SET search_path to prevent privilege escalation';-- ============================================================================
-- ML Lead Scoring Tables
-- Stores model weights and A/B test results for ML-based lead scoring
-- ============================================================================

-- ============================================================================
-- ML Model Weights Table
-- Stores trained model weights per user for personalized lead scoring
-- ============================================================================

CREATE TABLE IF NOT EXISTS ml_model_weights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Model data (stored as JSONB for flexibility)
    weights JSONB NOT NULL DEFAULT '{}'::jsonb,

    -- Model metadata
    version TEXT,
    training_examples INTEGER DEFAULT 0,
    accuracy DECIMAL(5,4),
    auc DECIMAL(5,4),

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Ensure one model per user (upsert pattern)
    CONSTRAINT ml_model_weights_user_unique UNIQUE (user_id)
);

-- Index for user lookup
CREATE INDEX IF NOT EXISTS idx_ml_model_weights_user_id ON ml_model_weights(user_id);

-- Enable RLS
ALTER TABLE ml_model_weights ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own model weights
DROP POLICY IF EXISTS "Users can view own model weights" ON ml_model_weights;
CREATE POLICY "Users can view own model weights"
    ON ml_model_weights
    FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own model weights" ON ml_model_weights;
CREATE POLICY "Users can insert own model weights"
    ON ml_model_weights
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own model weights" ON ml_model_weights;
CREATE POLICY "Users can update own model weights"
    ON ml_model_weights
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own model weights" ON ml_model_weights;
CREATE POLICY "Users can delete own model weights"
    ON ml_model_weights
    FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================================================
-- A/B Test Results Table
-- Stores historical A/B test results comparing ML vs rule-based scoring
-- ============================================================================

CREATE TABLE IF NOT EXISTS ab_test_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Test identification
    test_id TEXT NOT NULL,

    -- Test analysis results (stored as JSONB)
    analysis JSONB NOT NULL DEFAULT '{}'::jsonb,

    -- Denormalized key metrics for easy querying
    ml_conversion_rate DECIMAL(5,4),
    rules_conversion_rate DECIMAL(5,4),
    winner TEXT CHECK (winner IN ('ml', 'rules', 'inconclusive')),
    confidence DECIMAL(5,4),
    duration_days DECIMAL(10,2),

    -- Sample sizes
    ml_count INTEGER DEFAULT 0,
    rules_count INTEGER DEFAULT 0,
    ml_conversions INTEGER DEFAULT 0,
    rules_conversions INTEGER DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ab_test_results_user_id ON ab_test_results(user_id);
CREATE INDEX IF NOT EXISTS idx_ab_test_results_test_id ON ab_test_results(test_id);
CREATE INDEX IF NOT EXISTS idx_ab_test_results_created_at ON ab_test_results(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ab_test_results_winner ON ab_test_results(winner);

-- Enable RLS
ALTER TABLE ab_test_results ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view own A/B test results" ON ab_test_results;
CREATE POLICY "Users can view own A/B test results"
    ON ab_test_results
    FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own A/B test results" ON ab_test_results;
CREATE POLICY "Users can insert own A/B test results"
    ON ab_test_results
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own A/B test results" ON ab_test_results;
CREATE POLICY "Users can update own A/B test results"
    ON ab_test_results
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own A/B test results" ON ab_test_results;
CREATE POLICY "Users can delete own A/B test results"
    ON ab_test_results
    FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================================================
-- Lead Scores Table (Optional - for persistence and analytics)
-- Stores individual lead scores for historical analysis
-- ============================================================================

CREATE TABLE IF NOT EXISTS lead_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    lead_id UUID NOT NULL,

    -- Score data
    score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
    priority TEXT NOT NULL CHECK (priority IN ('hot', 'warm', 'cold')),
    variant TEXT NOT NULL CHECK (variant IN ('ml', 'rules')),

    -- ML-specific data
    confidence DECIMAL(5,4),
    probability DECIMAL(5,4),
    model_version TEXT,

    -- Feature importance (top 5 contributing features)
    feature_importance JSONB,

    -- Outcome tracking
    converted BOOLEAN,
    conversion_recorded_at TIMESTAMPTZ,

    -- Timestamps
    scored_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Unique constraint: one score per lead (latest wins)
    CONSTRAINT lead_scores_lead_unique UNIQUE (lead_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_lead_scores_user_id ON lead_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_lead_scores_lead_id ON lead_scores(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_scores_priority ON lead_scores(priority);
CREATE INDEX IF NOT EXISTS idx_lead_scores_variant ON lead_scores(variant);
CREATE INDEX IF NOT EXISTS idx_lead_scores_scored_at ON lead_scores(scored_at DESC);
CREATE INDEX IF NOT EXISTS idx_lead_scores_converted ON lead_scores(converted) WHERE converted IS NOT NULL;

-- Enable RLS
ALTER TABLE lead_scores ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view own lead scores" ON lead_scores;
CREATE POLICY "Users can view own lead scores"
    ON lead_scores
    FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own lead scores" ON lead_scores;
CREATE POLICY "Users can insert own lead scores"
    ON lead_scores
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own lead scores" ON lead_scores;
CREATE POLICY "Users can update own lead scores"
    ON lead_scores
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own lead scores" ON lead_scores;
CREATE POLICY "Users can delete own lead scores"
    ON lead_scores
    FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================================================
-- ML Training Examples Table
-- Stores labeled examples for model training
-- ============================================================================

CREATE TABLE IF NOT EXISTS ml_training_examples (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    lead_id UUID NOT NULL,

    -- Feature data (stored as JSONB)
    features JSONB NOT NULL,

    -- Label
    converted BOOLEAN NOT NULL,

    -- Metadata
    source TEXT,
    lead_type TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    lead_created_at TIMESTAMPTZ,
    conversion_recorded_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ml_training_examples_user_id ON ml_training_examples(user_id);
CREATE INDEX IF NOT EXISTS idx_ml_training_examples_converted ON ml_training_examples(converted);
CREATE INDEX IF NOT EXISTS idx_ml_training_examples_created_at ON ml_training_examples(created_at DESC);

-- Enable RLS
ALTER TABLE ml_training_examples ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view own training examples" ON ml_training_examples;
CREATE POLICY "Users can view own training examples"
    ON ml_training_examples
    FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own training examples" ON ml_training_examples;
CREATE POLICY "Users can insert own training examples"
    ON ml_training_examples
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own training examples" ON ml_training_examples;
CREATE POLICY "Users can delete own training examples"
    ON ml_training_examples
    FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================================================
-- Triggers for updated_at
-- ============================================================================

-- Trigger function (reuse if exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to ml_model_weights
DROP TRIGGER IF EXISTS update_ml_model_weights_updated_at ON ml_model_weights;
DROP TRIGGER IF EXISTS update_ml_model_weights_updated_at ON ml_model_weights;
CREATE TRIGGER update_ml_model_weights_updated_at
    BEFORE UPDATE ON ml_model_weights
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Helper function to extract denormalized metrics from analysis JSON
-- ============================================================================

CREATE OR REPLACE FUNCTION extract_ab_test_metrics()
RETURNS TRIGGER AS $$
BEGIN
    -- Extract metrics from analysis JSONB for easier querying
    NEW.ml_conversion_rate := (NEW.analysis->'mlResults'->>'conversionRate')::DECIMAL;
    NEW.rules_conversion_rate := (NEW.analysis->'rulesResults'->>'conversionRate')::DECIMAL;
    NEW.winner := NEW.analysis->>'winner';
    NEW.confidence := (NEW.analysis->>'confidence')::DECIMAL;
    NEW.duration_days := (NEW.analysis->>'duration')::DECIMAL;
    NEW.ml_count := (NEW.analysis->'mlResults'->>'count')::INTEGER;
    NEW.rules_count := (NEW.analysis->'rulesResults'->>'count')::INTEGER;
    NEW.ml_conversions := (NEW.analysis->'mlResults'->>'conversions')::INTEGER;
    NEW.rules_conversions := (NEW.analysis->'rulesResults'->>'conversions')::INTEGER;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to ab_test_results
DROP TRIGGER IF EXISTS extract_ab_test_metrics_trigger ON ab_test_results;
CREATE TRIGGER extract_ab_test_metrics_trigger
    BEFORE INSERT OR UPDATE ON ab_test_results
    FOR EACH ROW
    EXECUTE FUNCTION extract_ab_test_metrics();

-- ============================================================================
-- Comments for documentation
-- ============================================================================

COMMENT ON TABLE ml_model_weights IS 'Stores trained ML model weights for personalized lead scoring per user';
COMMENT ON TABLE ab_test_results IS 'Stores A/B test results comparing ML vs rule-based lead scoring';
COMMENT ON TABLE lead_scores IS 'Stores individual lead scores for historical analysis and tracking';
COMMENT ON TABLE ml_training_examples IS 'Stores labeled examples for ML model training';

COMMENT ON COLUMN ml_model_weights.weights IS 'JSONB containing model weights, bias, and metadata';
COMMENT ON COLUMN ab_test_results.analysis IS 'Full A/B test analysis including variant-specific metrics';
COMMENT ON COLUMN lead_scores.feature_importance IS 'Top contributing features to the lead score';
-- Multi-Factor Authentication (MFA/2FA) Tables
-- Supports TOTP, Email, and SMS-based authentication

-- =============================================
-- USER MFA SETTINGS
-- =============================================

CREATE TABLE IF NOT EXISTS user_mfa_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mfa_enabled BOOLEAN DEFAULT false,
  mfa_method TEXT CHECK (mfa_method IN ('totp', 'email', 'sms')),
  totp_secret TEXT, -- Base32 encoded secret (encrypted via application layer)
  backup_codes TEXT[], -- Array of hashed backup codes
  backup_codes_generated_at TIMESTAMPTZ,
  phone_number TEXT, -- For SMS-based MFA
  email_verified_for_mfa BOOLEAN DEFAULT false,
  verified_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  failed_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_user_mfa_settings_user_id ON user_mfa_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_mfa_settings_enabled ON user_mfa_settings(mfa_enabled) WHERE mfa_enabled = true;

-- Updated_at trigger
DROP TRIGGER IF EXISTS update_user_mfa_settings_updated_at ON user_mfa_settings;
CREATE TRIGGER update_user_mfa_settings_updated_at
  BEFORE UPDATE ON user_mfa_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE user_mfa_settings IS 'Stores MFA configuration and secrets for users';

-- =============================================
-- MFA VERIFICATION LOGS
-- =============================================

CREATE TABLE IF NOT EXISTS mfa_verification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  method TEXT NOT NULL CHECK (method IN ('totp', 'email', 'sms', 'backup_code')),
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'expired', 'blocked')),
  ip_address INET,
  user_agent TEXT,
  device_fingerprint TEXT,
  failure_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for security analysis
CREATE INDEX IF NOT EXISTS idx_mfa_verification_logs_user_id ON mfa_verification_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_mfa_verification_logs_status ON mfa_verification_logs(status);
CREATE INDEX IF NOT EXISTS idx_mfa_verification_logs_created_at ON mfa_verification_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mfa_verification_logs_ip ON mfa_verification_logs(ip_address);

COMMENT ON TABLE mfa_verification_logs IS 'Audit trail of all MFA verification attempts';

-- =============================================
-- TRUSTED DEVICES
-- =============================================

CREATE TABLE IF NOT EXISTS mfa_trusted_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_fingerprint TEXT NOT NULL,
  device_name TEXT,
  browser TEXT,
  os TEXT,
  ip_address INET,
  last_used_at TIMESTAMPTZ DEFAULT now(),
  trusted_until TIMESTAMPTZ NOT NULL,
  revoked BOOLEAN DEFAULT false,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, device_fingerprint)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_mfa_trusted_devices_user_id ON mfa_trusted_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_mfa_trusted_devices_fingerprint ON mfa_trusted_devices(device_fingerprint);
CREATE INDEX IF NOT EXISTS idx_mfa_trusted_devices_trusted_until ON mfa_trusted_devices(trusted_until) WHERE revoked = false;

COMMENT ON TABLE mfa_trusted_devices IS 'Devices marked as trusted to skip MFA for a period';

-- =============================================
-- TEMPORARY MFA CODES (for email/SMS)
-- =============================================

CREATE TABLE IF NOT EXISTS mfa_temp_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code_hash TEXT NOT NULL, -- Hashed verification code
  code_type TEXT NOT NULL CHECK (code_type IN ('email', 'sms', 'setup_verification')),
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT false,
  used_at TIMESTAMPTZ,
  attempts INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_mfa_temp_codes_user_id ON mfa_temp_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_mfa_temp_codes_expires_at ON mfa_temp_codes(expires_at);
CREATE INDEX IF NOT EXISTS idx_mfa_temp_codes_used ON mfa_temp_codes(used);

COMMENT ON TABLE mfa_temp_codes IS 'Temporary verification codes for email/SMS MFA';

-- =============================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================

ALTER TABLE user_mfa_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE mfa_verification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE mfa_trusted_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE mfa_temp_codes ENABLE ROW LEVEL SECURITY;

-- Users can read and update their own MFA settings
DROP POLICY IF EXISTS "Users can view own MFA settings" ON user_mfa_settings;
CREATE POLICY "Users can view own MFA settings"
  ON user_mfa_settings FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own MFA settings" ON user_mfa_settings;
CREATE POLICY "Users can update own MFA settings"
  ON user_mfa_settings FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own MFA settings" ON user_mfa_settings;
CREATE POLICY "Users can insert own MFA settings"
  ON user_mfa_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Verification logs - users can only view their own
DROP POLICY IF EXISTS "Users can view own MFA verification logs" ON mfa_verification_logs;
CREATE POLICY "Users can view own MFA verification logs"
  ON mfa_verification_logs FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can insert verification logs
DROP POLICY IF EXISTS "Service role can insert verification logs" ON mfa_verification_logs;
CREATE POLICY "Service role can insert verification logs"
  ON mfa_verification_logs FOR INSERT
  WITH CHECK (true);

-- Trusted devices - users can manage their own
DROP POLICY IF EXISTS "Users can view own trusted devices" ON mfa_trusted_devices;
CREATE POLICY "Users can view own trusted devices"
  ON mfa_trusted_devices FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own trusted devices" ON mfa_trusted_devices;
CREATE POLICY "Users can manage own trusted devices"
  ON mfa_trusted_devices FOR ALL
  USING (auth.uid() = user_id);

-- Temp codes - service role only for security
DROP POLICY IF EXISTS "Service role manages temp codes" ON mfa_temp_codes;
CREATE POLICY "Service role manages temp codes"
  ON mfa_temp_codes FOR ALL
  USING (true);

-- =============================================
-- HELPER FUNCTIONS
-- =============================================

-- Function to check if user has MFA enabled
CREATE OR REPLACE FUNCTION check_mfa_enabled(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_mfa_settings
    WHERE user_id = p_user_id
    AND mfa_enabled = true
    AND verified_at IS NOT NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if device is trusted
CREATE OR REPLACE FUNCTION is_device_trusted(p_user_id UUID, p_device_fingerprint TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM mfa_trusted_devices
    WHERE user_id = p_user_id
    AND device_fingerprint = p_device_fingerprint
    AND revoked = false
    AND trusted_until > now()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment failed MFA attempts
CREATE OR REPLACE FUNCTION increment_mfa_failed_attempts(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_attempts INTEGER;
BEGIN
  UPDATE user_mfa_settings
  SET
    failed_attempts = failed_attempts + 1,
    locked_until = CASE
      WHEN failed_attempts >= 4 THEN now() + interval '15 minutes'
      ELSE locked_until
    END,
    updated_at = now()
  WHERE user_id = p_user_id
  RETURNING failed_attempts INTO v_attempts;

  RETURN COALESCE(v_attempts, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reset failed attempts on successful verification
CREATE OR REPLACE FUNCTION reset_mfa_failed_attempts(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE user_mfa_settings
  SET
    failed_attempts = 0,
    locked_until = NULL,
    last_used_at = now(),
    updated_at = now()
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if MFA is locked
CREATE OR REPLACE FUNCTION is_mfa_locked(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_mfa_settings
    WHERE user_id = p_user_id
    AND locked_until IS NOT NULL
    AND locked_until > now()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cleanup function for expired temp codes
CREATE OR REPLACE FUNCTION cleanup_expired_mfa_codes()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM mfa_temp_codes
  WHERE expires_at < now() OR (used = true AND created_at < now() - interval '1 day');

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION check_mfa_enabled IS 'Check if a user has MFA enabled and verified';
COMMENT ON FUNCTION is_device_trusted IS 'Check if a device is trusted for a user';
COMMENT ON FUNCTION increment_mfa_failed_attempts IS 'Increment failed MFA attempts and lock if necessary';
COMMENT ON FUNCTION reset_mfa_failed_attempts IS 'Reset failed attempts after successful verification';
COMMENT ON FUNCTION is_mfa_locked IS 'Check if MFA is temporarily locked due to failed attempts';
COMMENT ON FUNCTION cleanup_expired_mfa_codes IS 'Cleanup expired temporary MFA codes';
-- Enterprise SSO (SAML/OIDC) Tables
-- Supports SAML 2.0, OpenID Connect, and Azure AD integration

-- =============================================
-- ENTERPRISE SSO CONFIGURATIONS
-- =============================================

CREATE TABLE IF NOT EXISTS enterprise_sso_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID, -- Future: link to organizations table
  organization_name TEXT NOT NULL,
  organization_domain TEXT NOT NULL, -- e.g., 'acme.com' for user@acme.com
  sso_provider TEXT NOT NULL CHECK (sso_provider IN ('saml', 'oidc', 'azure_ad', 'okta', 'google_workspace')),

  -- SAML Configuration
  saml_entity_id TEXT UNIQUE,
  saml_sso_url TEXT, -- IdP Single Sign-On URL
  saml_slo_url TEXT, -- IdP Single Logout URL (optional)
  saml_certificate TEXT, -- IdP X.509 Certificate
  saml_metadata_url TEXT, -- URL to fetch IdP metadata
  saml_name_id_format TEXT DEFAULT 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',

  -- OIDC Configuration
  oidc_client_id TEXT,
  oidc_client_secret TEXT, -- Encrypted
  oidc_issuer TEXT,
  oidc_authorization_endpoint TEXT,
  oidc_token_endpoint TEXT,
  oidc_userinfo_endpoint TEXT,
  oidc_jwks_uri TEXT,
  oidc_scopes TEXT[] DEFAULT ARRAY['openid', 'email', 'profile'],

  -- Attribute Mapping (maps IdP attributes to user profile)
  attribute_mappings JSONB DEFAULT '{
    "email": "email",
    "firstName": "given_name",
    "lastName": "family_name",
    "displayName": "name",
    "groups": "groups"
  }'::jsonb,

  -- Access Control
  allowed_groups TEXT[], -- If set, only users in these groups can access
  default_role TEXT DEFAULT 'user' CHECK (default_role IN ('user', 'admin')),
  auto_provision_users BOOLEAN DEFAULT true, -- Create user on first SSO login

  -- Status
  active BOOLEAN DEFAULT false,
  verified_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,

  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_enterprise_sso_config_domain ON enterprise_sso_config(organization_domain) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_enterprise_sso_config_entity_id ON enterprise_sso_config(saml_entity_id);
CREATE INDEX IF NOT EXISTS idx_enterprise_sso_config_provider ON enterprise_sso_config(sso_provider);

-- Updated_at trigger
DROP TRIGGER IF EXISTS update_enterprise_sso_config_updated_at ON enterprise_sso_config;
CREATE TRIGGER update_enterprise_sso_config_updated_at
  BEFORE UPDATE ON enterprise_sso_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE enterprise_sso_config IS 'Enterprise SSO configurations for SAML/OIDC providers';

-- =============================================
-- SSO LOGIN SESSIONS
-- =============================================

CREATE TABLE IF NOT EXISTS sso_login_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_id UUID NOT NULL REFERENCES enterprise_sso_config(id) ON DELETE CASCADE,
  request_id TEXT UNIQUE NOT NULL, -- SAML RequestID or OIDC state parameter
  user_email TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'expired')),

  -- SAML specific
  saml_request TEXT, -- Original SAML AuthnRequest (for debugging)
  saml_response TEXT, -- Received SAML Response (for debugging, encrypted)
  saml_assertion_id TEXT,

  -- OIDC specific
  oidc_nonce TEXT,
  oidc_code_verifier TEXT, -- PKCE code verifier

  -- Result
  user_id UUID REFERENCES auth.users(id),
  error_code TEXT,
  error_message TEXT,

  -- Metadata
  ip_address INET,
  user_agent TEXT,
  redirect_uri TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '10 minutes'),
  completed_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sso_login_sessions_request_id ON sso_login_sessions(request_id);
CREATE INDEX IF NOT EXISTS idx_sso_login_sessions_config_id ON sso_login_sessions(config_id);
CREATE INDEX IF NOT EXISTS idx_sso_login_sessions_status ON sso_login_sessions(status);
CREATE INDEX IF NOT EXISTS idx_sso_login_sessions_expires_at ON sso_login_sessions(expires_at);

COMMENT ON TABLE sso_login_sessions IS 'Tracks SSO login attempts and their status';

-- =============================================
-- SSO USER MAPPINGS
-- =============================================

CREATE TABLE IF NOT EXISTS sso_user_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  config_id UUID NOT NULL REFERENCES enterprise_sso_config(id) ON DELETE CASCADE,
  sso_subject_id TEXT NOT NULL, -- User ID from IdP (SAML NameID or OIDC sub)
  sso_email TEXT NOT NULL,
  sso_groups TEXT[],
  sso_attributes JSONB DEFAULT '{}'::jsonb, -- Raw attributes from IdP
  last_login_at TIMESTAMPTZ DEFAULT now(),
  login_count INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(config_id, sso_subject_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sso_user_mappings_user_id ON sso_user_mappings(user_id);
CREATE INDEX IF NOT EXISTS idx_sso_user_mappings_config_id ON sso_user_mappings(config_id);
CREATE INDEX IF NOT EXISTS idx_sso_user_mappings_subject ON sso_user_mappings(sso_subject_id);
CREATE INDEX IF NOT EXISTS idx_sso_user_mappings_email ON sso_user_mappings(sso_email);

-- Updated_at trigger
DROP TRIGGER IF EXISTS update_sso_user_mappings_updated_at ON sso_user_mappings;
CREATE TRIGGER update_sso_user_mappings_updated_at
  BEFORE UPDATE ON sso_user_mappings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE sso_user_mappings IS 'Links Supabase users to their SSO identities';

-- =============================================
-- SSO AUDIT LOGS
-- =============================================

CREATE TABLE IF NOT EXISTS sso_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_id UUID REFERENCES enterprise_sso_config(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'login_initiated', 'login_success', 'login_failed',
    'logout', 'config_created', 'config_updated',
    'config_deleted', 'config_verified', 'user_provisioned',
    'user_deprovisioned', 'group_sync'
  )),
  event_details JSONB DEFAULT '{}'::jsonb,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sso_audit_logs_config_id ON sso_audit_logs(config_id);
CREATE INDEX IF NOT EXISTS idx_sso_audit_logs_user_id ON sso_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_sso_audit_logs_event_type ON sso_audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_sso_audit_logs_created_at ON sso_audit_logs(created_at DESC);

COMMENT ON TABLE sso_audit_logs IS 'Audit trail for all SSO-related events';

-- =============================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================

ALTER TABLE enterprise_sso_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE sso_login_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sso_user_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE sso_audit_logs ENABLE ROW LEVEL SECURITY;

-- SSO Config - only admins can manage
DROP POLICY IF EXISTS "Admins can manage SSO configs" ON enterprise_sso_config;
CREATE POLICY "Admins can manage SSO configs"
  ON enterprise_sso_config FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Users can view active configs for their domain
DROP POLICY IF EXISTS "Users can view active SSO configs for their domain" ON enterprise_sso_config;
CREATE POLICY "Users can view active SSO configs for their domain"
  ON enterprise_sso_config FOR SELECT
  USING (
    active = true
  );

-- Login sessions - service role manages these
DROP POLICY IF EXISTS "Service role manages SSO sessions" ON sso_login_sessions;
CREATE POLICY "Service role manages SSO sessions"
  ON sso_login_sessions FOR ALL
  USING (true);

-- User mappings - users can view their own
DROP POLICY IF EXISTS "Users can view own SSO mappings" ON sso_user_mappings;
CREATE POLICY "Users can view own SSO mappings"
  ON sso_user_mappings FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all mappings for their configs
DROP POLICY IF EXISTS "Admins can manage SSO user mappings" ON sso_user_mappings;
CREATE POLICY "Admins can manage SSO user mappings"
  ON sso_user_mappings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Audit logs - admins can view
DROP POLICY IF EXISTS "Admins can view SSO audit logs" ON sso_audit_logs;
CREATE POLICY "Admins can view SSO audit logs"
  ON sso_audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Users can view their own audit logs
DROP POLICY IF EXISTS "Users can view own SSO audit logs" ON sso_audit_logs;
CREATE POLICY "Users can view own SSO audit logs"
  ON sso_audit_logs FOR SELECT
  USING (auth.uid() = user_id);

-- =============================================
-- HELPER FUNCTIONS
-- =============================================

-- Function to find SSO config by email domain
CREATE OR REPLACE FUNCTION find_sso_config_by_email(p_email TEXT)
RETURNS UUID AS $$
DECLARE
  v_domain TEXT;
  v_config_id UUID;
BEGIN
  -- Extract domain from email
  v_domain := split_part(p_email, '@', 2);

  SELECT id INTO v_config_id
  FROM enterprise_sso_config
  WHERE organization_domain = v_domain
  AND active = true
  LIMIT 1;

  RETURN v_config_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to find or create user from SSO
CREATE OR REPLACE FUNCTION find_or_create_sso_user(
  p_config_id UUID,
  p_email TEXT,
  p_subject_id TEXT,
  p_full_name TEXT DEFAULT NULL,
  p_groups TEXT[] DEFAULT NULL,
  p_attributes JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
  v_config enterprise_sso_config%ROWTYPE;
BEGIN
  -- Get SSO config
  SELECT * INTO v_config FROM enterprise_sso_config WHERE id = p_config_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'SSO config not found';
  END IF;

  -- Check if user already exists via SSO mapping
  SELECT user_id INTO v_user_id
  FROM sso_user_mappings
  WHERE config_id = p_config_id AND sso_subject_id = p_subject_id;

  IF v_user_id IS NOT NULL THEN
    -- Update existing mapping
    UPDATE sso_user_mappings
    SET
      sso_email = p_email,
      sso_groups = COALESCE(p_groups, sso_groups),
      sso_attributes = p_attributes,
      last_login_at = now(),
      login_count = login_count + 1,
      updated_at = now()
    WHERE config_id = p_config_id AND sso_subject_id = p_subject_id;

    RETURN v_user_id;
  END IF;

  -- Check if user exists by email
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = p_email;

  IF v_user_id IS NOT NULL THEN
    -- Link existing user to SSO
    INSERT INTO sso_user_mappings (user_id, config_id, sso_subject_id, sso_email, sso_groups, sso_attributes)
    VALUES (v_user_id, p_config_id, p_subject_id, p_email, p_groups, p_attributes);

    RETURN v_user_id;
  END IF;

  -- Auto-provision is handled at the application layer via Supabase Auth
  -- Return NULL to indicate new user needs to be created
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log SSO events
CREATE OR REPLACE FUNCTION log_sso_event(
  p_config_id UUID,
  p_user_id UUID,
  p_event_type TEXT,
  p_details JSONB DEFAULT '{}'::jsonb,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO sso_audit_logs (config_id, user_id, event_type, event_details, ip_address, user_agent)
  VALUES (p_config_id, p_user_id, p_event_type, p_details, p_ip_address, p_user_agent)
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cleanup function for expired SSO sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sso_sessions()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  UPDATE sso_login_sessions
  SET status = 'expired'
  WHERE status = 'pending' AND expires_at < now();

  -- Delete old sessions (keep for 30 days for audit)
  DELETE FROM sso_login_sessions
  WHERE created_at < now() - interval '30 days';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION find_sso_config_by_email IS 'Find SSO configuration by email domain';
COMMENT ON FUNCTION find_or_create_sso_user IS 'Find existing user or prepare for creation from SSO';
COMMENT ON FUNCTION log_sso_event IS 'Log SSO audit events';
COMMENT ON FUNCTION cleanup_expired_sso_sessions IS 'Cleanup expired SSO login sessions';
-- Visual Workflow Builder & Multi-Step Orchestration Tables
-- Supports visual workflow design, execution, and monitoring

-- =============================================
-- WORKFLOWS (Main workflow definitions)
-- =============================================

CREATE TABLE IF NOT EXISTS workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'general' CHECK (category IN ('lead_management', 'listing_automation', 'marketing', 'notifications', 'integrations', 'general')),

  -- Visual Builder Data
  nodes JSONB NOT NULL DEFAULT '[]'::jsonb,
  edges JSONB NOT NULL DEFAULT '[]'::jsonb,
  viewport JSONB DEFAULT '{"x": 0, "y": 0, "zoom": 1}'::jsonb,

  -- Workflow Settings
  is_published BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT false,
  trigger_config JSONB DEFAULT '{}'::jsonb, -- Trigger configuration

  -- Versioning
  version INTEGER DEFAULT 1,
  published_version INTEGER,
  last_published_at TIMESTAMPTZ,

  -- Stats
  execution_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  last_executed_at TIMESTAMPTZ,

  -- Metadata
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_workflows_user_id ON workflows(user_id);
CREATE INDEX IF NOT EXISTS idx_workflows_category ON workflows(category);
CREATE INDEX IF NOT EXISTS idx_workflows_active ON workflows(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_workflows_published ON workflows(is_published) WHERE is_published = true;

-- Updated_at trigger
DROP TRIGGER IF EXISTS update_workflows_updated_at ON workflows;
CREATE TRIGGER update_workflows_updated_at
  BEFORE UPDATE ON workflows
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE workflows IS 'User-created automation workflows with visual builder data';

-- =============================================
-- WORKFLOW VERSIONS (Version history)
-- =============================================

CREATE TABLE IF NOT EXISTS workflow_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  nodes JSONB NOT NULL,
  edges JSONB NOT NULL,
  trigger_config JSONB,
  change_summary TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(workflow_id, version)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_workflow_versions_workflow_id ON workflow_versions(workflow_id);

COMMENT ON TABLE workflow_versions IS 'Version history for workflows';

-- =============================================
-- WORKFLOW NODE TEMPLATES (Pre-built nodes)
-- =============================================

CREATE TABLE IF NOT EXISTS workflow_node_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('trigger', 'action', 'condition', 'delay', 'loop', 'transform')),
  subtype TEXT NOT NULL, -- e.g., 'new_lead', 'send_email', 'update_status'
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  category TEXT NOT NULL,

  -- Configuration Schema
  config_schema JSONB NOT NULL DEFAULT '{}'::jsonb, -- JSON Schema for node config
  default_config JSONB DEFAULT '{}'::jsonb,

  -- Display
  color TEXT DEFAULT '#4F46E5',
  documentation_url TEXT,

  -- Metadata
  is_premium BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(type, subtype)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_workflow_node_templates_type ON workflow_node_templates(type);
CREATE INDEX IF NOT EXISTS idx_workflow_node_templates_category ON workflow_node_templates(category);

COMMENT ON TABLE workflow_node_templates IS 'Pre-built workflow node templates';

-- =============================================
-- WORKFLOW EXECUTIONS (Runtime instances)
-- =============================================

CREATE TABLE IF NOT EXISTS workflow_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workflow_version INTEGER NOT NULL,

  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'paused', 'completed', 'failed', 'cancelled', 'timeout')),

  -- Execution Context
  trigger_type TEXT NOT NULL,
  trigger_data JSONB DEFAULT '{}'::jsonb, -- Data that triggered the workflow
  context JSONB DEFAULT '{}'::jsonb, -- Shared context between steps
  variables JSONB DEFAULT '{}'::jsonb, -- User-defined variables

  -- Progress
  current_node_id TEXT,
  completed_nodes TEXT[] DEFAULT ARRAY[]::TEXT[],

  -- Timing
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  timeout_at TIMESTAMPTZ,

  -- Result
  result JSONB,
  error_message TEXT,
  error_node_id TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_workflow_executions_workflow_id ON workflow_executions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_user_id ON workflow_executions(user_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_status ON workflow_executions(status);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_started_at ON workflow_executions(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_running ON workflow_executions(status) WHERE status = 'running';

COMMENT ON TABLE workflow_executions IS 'Running and completed workflow instances';

-- =============================================
-- WORKFLOW EXECUTION STEPS (Per-node tracking)
-- =============================================

CREATE TABLE IF NOT EXISTS workflow_execution_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id UUID NOT NULL REFERENCES workflow_executions(id) ON DELETE CASCADE,
  node_id TEXT NOT NULL,
  node_type TEXT NOT NULL,
  node_name TEXT,

  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'skipped', 'waiting')),

  -- Data
  input_data JSONB DEFAULT '{}'::jsonb,
  output_data JSONB DEFAULT '{}'::jsonb,

  -- Timing
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,

  -- Error
  error_message TEXT,
  error_details JSONB,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_workflow_execution_steps_execution_id ON workflow_execution_steps(execution_id);
CREATE INDEX IF NOT EXISTS idx_workflow_execution_steps_status ON workflow_execution_steps(status);
CREATE INDEX IF NOT EXISTS idx_workflow_execution_steps_node_id ON workflow_execution_steps(node_id);

COMMENT ON TABLE workflow_execution_steps IS 'Individual step execution records within a workflow';

-- =============================================
-- WORKFLOW EXECUTION QUEUE (Async processing)
-- =============================================

CREATE TABLE IF NOT EXISTS workflow_execution_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id UUID NOT NULL REFERENCES workflow_executions(id) ON DELETE CASCADE,
  node_id TEXT NOT NULL,

  -- Queue Settings
  priority INTEGER DEFAULT 50, -- Higher = sooner
  scheduled_for TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Processing
  locked_at TIMESTAMPTZ,
  locked_by TEXT, -- Worker ID
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 5,

  -- Error handling
  last_error TEXT,
  next_retry_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_workflow_execution_queue_scheduled ON workflow_execution_queue(scheduled_for, priority DESC) WHERE locked_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_workflow_execution_queue_execution_id ON workflow_execution_queue(execution_id);
CREATE INDEX IF NOT EXISTS idx_workflow_execution_queue_locked ON workflow_execution_queue(locked_at) WHERE locked_at IS NOT NULL;

COMMENT ON TABLE workflow_execution_queue IS 'Queue for async workflow node processing';

-- =============================================
-- WORKFLOW TRIGGERS (Event subscriptions)
-- =============================================

CREATE TABLE IF NOT EXISTS workflow_triggers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,

  -- Trigger Type
  trigger_type TEXT NOT NULL CHECK (trigger_type IN (
    'manual', 'schedule', 'webhook',
    'lead_created', 'lead_updated', 'lead_status_changed',
    'listing_created', 'listing_updated', 'listing_sold',
    'form_submitted', 'page_viewed', 'link_clicked',
    'email_opened', 'email_clicked'
  )),

  -- Configuration
  config JSONB DEFAULT '{}'::jsonb,

  -- Schedule (for cron triggers)
  cron_expression TEXT,
  next_run_at TIMESTAMPTZ,
  last_run_at TIMESTAMPTZ,

  -- Webhook (for webhook triggers)
  webhook_secret TEXT,
  webhook_url TEXT GENERATED ALWAYS AS (
    CASE WHEN trigger_type = 'webhook'
    THEN 'https://api.agentbio.net/webhooks/workflow/' || id::text
    ELSE NULL END
  ) STORED,

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_workflow_triggers_workflow_id ON workflow_triggers(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_triggers_type ON workflow_triggers(trigger_type) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_workflow_triggers_schedule ON workflow_triggers(next_run_at) WHERE trigger_type = 'schedule' AND is_active = true;

-- Updated_at trigger
DROP TRIGGER IF EXISTS update_workflow_triggers_updated_at ON workflow_triggers;
CREATE TRIGGER update_workflow_triggers_updated_at
  BEFORE UPDATE ON workflow_triggers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE workflow_triggers IS 'Event triggers that start workflow executions';

-- =============================================
-- WORKFLOW SHARED TEMPLATES (Community/Admin)
-- =============================================

CREATE TABLE IF NOT EXISTS workflow_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,

  -- Template Data
  nodes JSONB NOT NULL,
  edges JSONB NOT NULL,
  trigger_config JSONB,

  -- Display
  icon TEXT,
  preview_image_url TEXT,

  -- Stats
  use_count INTEGER DEFAULT 0,
  rating NUMERIC(3,2) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,

  -- Access
  is_public BOOLEAN DEFAULT true,
  is_premium BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),

  -- Metadata
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_workflow_templates_category ON workflow_templates(category) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_workflow_templates_rating ON workflow_templates(rating DESC) WHERE is_public = true;

COMMENT ON TABLE workflow_templates IS 'Shareable workflow templates';

-- =============================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================

ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_node_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_execution_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_execution_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_triggers ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_templates ENABLE ROW LEVEL SECURITY;

-- Workflows - users own their workflows
DROP POLICY IF EXISTS "Users can manage own workflows" ON workflows;
CREATE POLICY "Users can manage own workflows"
  ON workflows FOR ALL
  USING (auth.uid() = user_id);

-- Workflow versions - same as workflows
DROP POLICY IF EXISTS "Users can manage own workflow versions" ON workflow_versions;
CREATE POLICY "Users can manage own workflow versions"
  ON workflow_versions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM workflows
      WHERE workflows.id = workflow_versions.workflow_id
      AND workflows.user_id = auth.uid()
    )
  );

-- Node templates - everyone can read
DROP POLICY IF EXISTS "Everyone can read node templates" ON workflow_node_templates;
CREATE POLICY "Everyone can read node templates"
  ON workflow_node_templates FOR SELECT
  USING (is_active = true);

-- Admins can manage templates
DROP POLICY IF EXISTS "Admins can manage node templates" ON workflow_node_templates;
CREATE POLICY "Admins can manage node templates"
  ON workflow_node_templates FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Executions - users can view their own
DROP POLICY IF EXISTS "Users can view own workflow executions" ON workflow_executions;
CREATE POLICY "Users can view own workflow executions"
  ON workflow_executions FOR SELECT
  USING (user_id = auth.uid());

-- Service role manages executions
DROP POLICY IF EXISTS "Service role manages executions" ON workflow_executions;
CREATE POLICY "Service role manages executions"
  ON workflow_executions FOR ALL
  USING (true);

-- Execution steps - users can view their own
DROP POLICY IF EXISTS "Users can view own execution steps" ON workflow_execution_steps;
CREATE POLICY "Users can view own execution steps"
  ON workflow_execution_steps FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workflow_executions
      WHERE workflow_executions.id = workflow_execution_steps.execution_id
      AND workflow_executions.user_id = auth.uid()
    )
  );

-- Queue - service role only
DROP POLICY IF EXISTS "Service role manages queue" ON workflow_execution_queue;
CREATE POLICY "Service role manages queue"
  ON workflow_execution_queue FOR ALL
  USING (true);

-- Triggers - users can manage their own
DROP POLICY IF EXISTS "Users can manage own triggers" ON workflow_triggers;
CREATE POLICY "Users can manage own triggers"
  ON workflow_triggers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM workflows
      WHERE workflows.id = workflow_triggers.workflow_id
      AND workflows.user_id = auth.uid()
    )
  );

-- Templates - public can read, admins can manage
DROP POLICY IF EXISTS "Public can read templates" ON workflow_templates;
CREATE POLICY "Public can read templates"
  ON workflow_templates FOR SELECT
  USING (is_public = true);

DROP POLICY IF EXISTS "Admins can manage templates" ON workflow_templates;
CREATE POLICY "Admins can manage templates"
  ON workflow_templates FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- =============================================
-- HELPER FUNCTIONS
-- =============================================

-- Function to start a workflow execution
CREATE OR REPLACE FUNCTION start_workflow_execution(
  p_workflow_id UUID,
  p_trigger_type TEXT,
  p_trigger_data JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  v_workflow workflows%ROWTYPE;
  v_execution_id UUID;
BEGIN
  -- Get workflow
  SELECT * INTO v_workflow FROM workflows WHERE id = p_workflow_id AND is_active = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Workflow not found or not active';
  END IF;

  -- Create execution
  INSERT INTO workflow_executions (
    workflow_id, user_id, workflow_version,
    status, trigger_type, trigger_data,
    started_at, timeout_at
  )
  VALUES (
    p_workflow_id, v_workflow.user_id, v_workflow.version,
    'running', p_trigger_type, p_trigger_data,
    now(), now() + interval '1 hour'
  )
  RETURNING id INTO v_execution_id;

  -- Update workflow stats
  UPDATE workflows
  SET
    execution_count = execution_count + 1,
    last_executed_at = now(),
    updated_at = now()
  WHERE id = p_workflow_id;

  RETURN v_execution_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to complete a workflow execution
CREATE OR REPLACE FUNCTION complete_workflow_execution(
  p_execution_id UUID,
  p_status TEXT,
  p_result JSONB DEFAULT NULL,
  p_error_message TEXT DEFAULT NULL,
  p_error_node_id TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  v_execution workflow_executions%ROWTYPE;
BEGIN
  -- Get execution
  SELECT * INTO v_execution FROM workflow_executions WHERE id = p_execution_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Execution not found';
  END IF;

  -- Update execution
  UPDATE workflow_executions
  SET
    status = p_status,
    completed_at = now(),
    result = p_result,
    error_message = p_error_message,
    error_node_id = p_error_node_id
  WHERE id = p_execution_id;

  -- Update workflow stats
  IF p_status = 'completed' THEN
    UPDATE workflows
    SET success_count = success_count + 1, updated_at = now()
    WHERE id = v_execution.workflow_id;
  ELSIF p_status = 'failed' THEN
    UPDATE workflows
    SET failure_count = failure_count + 1, updated_at = now()
    WHERE id = v_execution.workflow_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get next scheduled workflows
CREATE OR REPLACE FUNCTION get_scheduled_workflows(p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
  trigger_id UUID,
  workflow_id UUID,
  user_id UUID,
  trigger_config JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    wt.id as trigger_id,
    wt.workflow_id,
    w.user_id,
    wt.config as trigger_config
  FROM workflow_triggers wt
  JOIN workflows w ON w.id = wt.workflow_id
  WHERE wt.trigger_type = 'schedule'
  AND wt.is_active = true
  AND w.is_active = true
  AND wt.next_run_at <= now()
  ORDER BY wt.next_run_at
  LIMIT p_limit
  FOR UPDATE OF wt SKIP LOCKED;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION start_workflow_execution IS 'Start a new workflow execution';
COMMENT ON FUNCTION complete_workflow_execution IS 'Complete a workflow execution with status and result';
COMMENT ON FUNCTION get_scheduled_workflows IS 'Get workflows that are due for scheduled execution';

-- =============================================
-- SEED DATA: Default Node Templates
-- =============================================

INSERT INTO workflow_node_templates (type, subtype, name, description, icon, category, config_schema, default_config, color) VALUES
-- Triggers
('trigger', 'manual', 'Manual Trigger', 'Start workflow manually', 'play', 'triggers',
  '{"type": "object", "properties": {"name": {"type": "string"}}}',
  '{}', '#10B981'),
('trigger', 'schedule', 'Schedule', 'Run on a schedule', 'clock', 'triggers',
  '{"type": "object", "properties": {"cron": {"type": "string"}, "timezone": {"type": "string"}}}',
  '{"cron": "0 9 * * *", "timezone": "America/New_York"}', '#10B981'),
('trigger', 'lead_created', 'New Lead', 'When a new lead is created', 'user-plus', 'triggers',
  '{"type": "object", "properties": {"source": {"type": "string"}}}',
  '{}', '#10B981'),
('trigger', 'listing_created', 'New Listing', 'When a new listing is created', 'home', 'triggers',
  '{"type": "object", "properties": {"status": {"type": "string"}}}',
  '{}', '#10B981'),
('trigger', 'webhook', 'Webhook', 'Triggered by external webhook', 'link', 'triggers',
  '{"type": "object", "properties": {}}',
  '{}', '#10B981'),

-- Actions
('action', 'send_email', 'Send Email', 'Send an email to a recipient', 'mail', 'communication',
  '{"type": "object", "properties": {"to": {"type": "string"}, "subject": {"type": "string"}, "body": {"type": "string"}}, "required": ["to", "subject", "body"]}',
  '{}', '#6366F1'),
('action', 'send_sms', 'Send SMS', 'Send an SMS message', 'message-square', 'communication',
  '{"type": "object", "properties": {"to": {"type": "string"}, "message": {"type": "string"}}, "required": ["to", "message"]}',
  '{}', '#6366F1'),
('action', 'update_lead', 'Update Lead', 'Update lead properties', 'edit', 'crm',
  '{"type": "object", "properties": {"leadId": {"type": "string"}, "updates": {"type": "object"}}}',
  '{}', '#6366F1'),
('action', 'create_task', 'Create Task', 'Create a follow-up task', 'check-square', 'productivity',
  '{"type": "object", "properties": {"title": {"type": "string"}, "dueDate": {"type": "string"}, "assignee": {"type": "string"}}}',
  '{}', '#6366F1'),
('action', 'webhook_call', 'HTTP Request', 'Make an HTTP request', 'globe', 'integrations',
  '{"type": "object", "properties": {"url": {"type": "string"}, "method": {"type": "string"}, "headers": {"type": "object"}, "body": {"type": "object"}}}',
  '{"method": "POST"}', '#6366F1'),
('action', 'add_tag', 'Add Tag', 'Add a tag to a record', 'tag', 'organization',
  '{"type": "object", "properties": {"recordType": {"type": "string"}, "recordId": {"type": "string"}, "tag": {"type": "string"}}}',
  '{}', '#6366F1'),

-- Conditions
('condition', 'if_else', 'If/Else', 'Branch based on a condition', 'git-branch', 'logic',
  '{"type": "object", "properties": {"field": {"type": "string"}, "operator": {"type": "string"}, "value": {"type": "string"}}}',
  '{}', '#F59E0B'),
('condition', 'switch', 'Switch', 'Multiple branches based on value', 'git-merge', 'logic',
  '{"type": "object", "properties": {"field": {"type": "string"}, "cases": {"type": "array"}}}',
  '{}', '#F59E0B'),
('condition', 'filter', 'Filter', 'Filter records based on criteria', 'filter', 'logic',
  '{"type": "object", "properties": {"conditions": {"type": "array"}}}',
  '{}', '#F59E0B'),

-- Delays
('delay', 'wait', 'Wait', 'Wait for a specified duration', 'clock', 'timing',
  '{"type": "object", "properties": {"duration": {"type": "number"}, "unit": {"type": "string"}}}',
  '{"duration": 1, "unit": "hours"}', '#8B5CF6'),
('delay', 'wait_until', 'Wait Until', 'Wait until a specific time', 'calendar', 'timing',
  '{"type": "object", "properties": {"datetime": {"type": "string"}}}',
  '{}', '#8B5CF6'),

-- Transform
('transform', 'set_variable', 'Set Variable', 'Set a workflow variable', 'variable', 'data',
  '{"type": "object", "properties": {"name": {"type": "string"}, "value": {"type": "string"}}}',
  '{}', '#EC4899'),
('transform', 'format_data', 'Format Data', 'Transform data format', 'code', 'data',
  '{"type": "object", "properties": {"template": {"type": "string"}}}',
  '{}', '#EC4899'),

-- Loops
('loop', 'for_each', 'For Each', 'Loop over array items', 'repeat', 'iteration',
  '{"type": "object", "properties": {"array": {"type": "string"}, "itemVariable": {"type": "string"}}}',
  '{"itemVariable": "item"}', '#14B8A6')
ON CONFLICT (type, subtype) DO NOTHING;
-- Authentication Security Features Migration
-- Implements: Session Management, Brute Force Protection, Distributed Rate Limiting,
-- Audit Logging, GDPR Data Export, and GDPR Account Deletion

-- =============================================
-- 1. USER SESSIONS TABLE
-- Track active sessions for session management UI
-- =============================================

CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token_hash TEXT NOT NULL, -- SHA-256 hash of session token for validation
  ip_address INET,
  user_agent TEXT,
  device_type TEXT CHECK (device_type IN ('desktop', 'mobile', 'tablet', 'unknown')),
  browser TEXT,
  os TEXT,
  location_city TEXT,
  location_country TEXT,
  is_current BOOLEAN DEFAULT false, -- Mark current session
  last_activity_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  revoked BOOLEAN DEFAULT false,
  revoked_at TIMESTAMPTZ,
  revoked_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_ip ON user_sessions(ip_address);
CREATE INDEX IF NOT EXISTS idx_user_sessions_revoked ON user_sessions(revoked);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions(user_id, revoked, expires_at);

COMMENT ON TABLE user_sessions IS 'Tracks user sessions for session management UI with view/revoke capability';

-- =============================================
-- 2. LOGIN ATTEMPTS TABLE
-- Brute force protection and login throttling
-- =============================================

CREATE TABLE IF NOT EXISTS login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL, -- Email attempted (not necessarily valid)
  ip_address INET NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- May be null for non-existent accounts
  success BOOLEAN NOT NULL DEFAULT false,
  failure_reason TEXT, -- 'invalid_email', 'wrong_password', 'account_locked', 'mfa_failed'
  user_agent TEXT,
  device_fingerprint TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for rate limiting queries
CREATE INDEX IF NOT EXISTS idx_login_attempts_email ON login_attempts(email);
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip ON login_attempts(ip_address);
CREATE INDEX IF NOT EXISTS idx_login_attempts_created_at ON login_attempts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_login_attempts_email_ip_recent ON login_attempts(email, ip_address, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_login_attempts_success ON login_attempts(success);
CREATE INDEX IF NOT EXISTS idx_login_attempts_failed ON login_attempts(email, created_at DESC);

COMMENT ON TABLE login_attempts IS 'Records all login attempts for brute force protection and security analysis';

-- =============================================
-- 3. RATE LIMIT ENTRIES TABLE
-- Distributed rate limiting (fallback for Redis)
-- =============================================

CREATE TABLE IF NOT EXISTS rate_limit_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL, -- Can be IP, user_id, or composite key
  limit_type TEXT NOT NULL, -- 'login', 'api', 'password_reset', 'mfa', etc.
  request_count INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ DEFAULT now(),
  window_end TIMESTAMPTZ NOT NULL,
  blocked_until TIMESTAMPTZ, -- If rate limit exceeded, blocked until this time
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(identifier, limit_type)
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_rate_limit_identifier ON rate_limit_entries(identifier);
CREATE INDEX IF NOT EXISTS idx_rate_limit_type ON rate_limit_entries(limit_type);
CREATE INDEX IF NOT EXISTS idx_rate_limit_window ON rate_limit_entries(window_end);
CREATE INDEX IF NOT EXISTS idx_rate_limit_blocked ON rate_limit_entries(blocked_until);

COMMENT ON TABLE rate_limit_entries IS 'Distributed rate limiting entries with configurable windows';

-- =============================================
-- 4. AUDIT LOGS TABLE
-- General security audit logging
-- =============================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Who performed the action (for admin actions)
  action TEXT NOT NULL, -- 'login', 'logout', 'password_change', 'profile_update', 'session_revoke', etc.
  resource_type TEXT, -- 'profile', 'listing', 'lead', 'session', 'subscription', etc.
  resource_id TEXT, -- ID of the affected resource
  status TEXT NOT NULL CHECK (status IN ('success', 'failure', 'blocked')),
  ip_address INET,
  user_agent TEXT,
  details JSONB, -- Additional context about the action
  risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for security analysis and querying
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_status ON audit_logs(status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_risk ON audit_logs(risk_level);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_ip ON audit_logs(ip_address);

-- Composite index for user activity queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_activity ON audit_logs(user_id, created_at DESC);

COMMENT ON TABLE audit_logs IS 'Comprehensive audit log for all security-relevant actions';

-- =============================================
-- 5. GDPR DATA REQUESTS TABLE
-- Data export and deletion requests
-- =============================================

CREATE TABLE IF NOT EXISTS gdpr_data_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  request_type TEXT NOT NULL CHECK (request_type IN ('export', 'deletion', 'access')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  email_verified BOOLEAN DEFAULT false, -- Verified ownership before processing
  verification_token_hash TEXT, -- For email verification
  verification_expires_at TIMESTAMPTZ,
  file_url TEXT, -- Signed URL for data export file
  file_expires_at TIMESTAMPTZ,
  scheduled_deletion_at TIMESTAMPTZ, -- 30-day grace period for deletion
  processed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  failed_reason TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_gdpr_requests_user_id ON gdpr_data_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_gdpr_requests_status ON gdpr_data_requests(status);
CREATE INDEX IF NOT EXISTS idx_gdpr_requests_type ON gdpr_data_requests(request_type);
CREATE INDEX IF NOT EXISTS idx_gdpr_requests_scheduled_deletion ON gdpr_data_requests(scheduled_deletion_at);

-- Updated_at trigger
DROP TRIGGER IF EXISTS update_gdpr_data_requests_updated_at ON gdpr_data_requests;
CREATE TRIGGER update_gdpr_data_requests_updated_at
  BEFORE UPDATE ON gdpr_data_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE gdpr_data_requests IS 'GDPR data export and deletion requests with audit trail';

-- =============================================
-- 6. ACCOUNT DELETION SCHEDULED TABLE
-- Soft deletion with recovery period
-- =============================================

CREATE TABLE IF NOT EXISTS account_deletion_scheduled (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  gdpr_request_id UUID REFERENCES gdpr_data_requests(id),
  reason TEXT, -- Optional reason for deletion
  scheduled_for TIMESTAMPTZ NOT NULL, -- Actual deletion date (30 days from request)
  cancelled BOOLEAN DEFAULT false,
  cancelled_at TIMESTAMPTZ,
  cancelled_reason TEXT,
  executed BOOLEAN DEFAULT false,
  executed_at TIMESTAMPTZ,
  anonymization_completed BOOLEAN DEFAULT false,
  data_backup_url TEXT, -- Final backup before deletion
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_account_deletion_scheduled_for ON account_deletion_scheduled(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_account_deletion_cancelled ON account_deletion_scheduled(cancelled);
CREATE INDEX IF NOT EXISTS idx_account_deletion_executed ON account_deletion_scheduled(executed);
CREATE INDEX IF NOT EXISTS idx_account_deletion_user ON account_deletion_scheduled(user_id);

COMMENT ON TABLE account_deletion_scheduled IS 'Scheduled account deletions with 30-day recovery period';

-- =============================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================

ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limit_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE gdpr_data_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_deletion_scheduled ENABLE ROW LEVEL SECURITY;

-- User Sessions Policies
DROP POLICY IF EXISTS "Users can view own sessions" ON user_sessions;
CREATE POLICY "Users can view own sessions"
  ON user_sessions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can revoke own sessions" ON user_sessions;
CREATE POLICY "Users can revoke own sessions"
  ON user_sessions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can manage sessions" ON user_sessions;
CREATE POLICY "Service role can manage sessions"
  ON user_sessions FOR ALL
  USING (true);

-- Login Attempts - service role only for writing, users can view own
DROP POLICY IF EXISTS "Users can view own login attempts" ON login_attempts;
CREATE POLICY "Users can view own login attempts"
  ON login_attempts FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Service role can manage login attempts" ON login_attempts;
CREATE POLICY "Service role can manage login attempts"
  ON login_attempts FOR ALL
  USING (true);

-- Rate Limit - service role only
DROP POLICY IF EXISTS "Service role manages rate limits" ON rate_limit_entries;
CREATE POLICY "Service role manages rate limits"
  ON rate_limit_entries FOR ALL
  USING (true);

-- Audit Logs - users can view own logs
DROP POLICY IF EXISTS "Users can view own audit logs" ON audit_logs;
CREATE POLICY "Users can view own audit logs"
  ON audit_logs FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Service role can manage audit logs" ON audit_logs;
CREATE POLICY "Service role can manage audit logs"
  ON audit_logs FOR ALL
  USING (true);

-- GDPR Requests - users can view and create own requests
DROP POLICY IF EXISTS "Users can view own GDPR requests" ON gdpr_data_requests;
CREATE POLICY "Users can view own GDPR requests"
  ON gdpr_data_requests FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own GDPR requests" ON gdpr_data_requests;
CREATE POLICY "Users can create own GDPR requests"
  ON gdpr_data_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can cancel own pending GDPR requests" ON gdpr_data_requests;
CREATE POLICY "Users can cancel own pending GDPR requests"
  ON gdpr_data_requests FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending');

DROP POLICY IF EXISTS "Service role can manage GDPR requests" ON gdpr_data_requests;
CREATE POLICY "Service role can manage GDPR requests"
  ON gdpr_data_requests FOR ALL
  USING (true);

-- Account Deletion Schedule - users can view and cancel own
DROP POLICY IF EXISTS "Users can view own deletion schedule" ON account_deletion_scheduled;
CREATE POLICY "Users can view own deletion schedule"
  ON account_deletion_scheduled FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can cancel own deletion" ON account_deletion_scheduled;
CREATE POLICY "Users can cancel own deletion"
  ON account_deletion_scheduled FOR UPDATE
  USING (auth.uid() = user_id AND cancelled = false AND executed = false);

DROP POLICY IF EXISTS "Service role can manage deletion schedule" ON account_deletion_scheduled;
CREATE POLICY "Service role can manage deletion schedule"
  ON account_deletion_scheduled FOR ALL
  USING (true);

-- =============================================
-- HELPER FUNCTIONS
-- =============================================

-- Function to check login throttling
CREATE OR REPLACE FUNCTION check_login_throttle(
  p_email TEXT,
  p_ip_address INET,
  p_window_minutes INTEGER DEFAULT 15,
  p_max_attempts INTEGER DEFAULT 5
)
RETURNS TABLE (
  is_blocked BOOLEAN,
  attempts_remaining INTEGER,
  blocked_until TIMESTAMPTZ,
  reason TEXT
) AS $$
DECLARE
  v_email_attempts INTEGER;
  v_ip_attempts INTEGER;
  v_window_start TIMESTAMPTZ;
BEGIN
  v_window_start := now() - (p_window_minutes || ' minutes')::INTERVAL;

  -- Count failed attempts by email
  SELECT COUNT(*) INTO v_email_attempts
  FROM login_attempts
  WHERE email = p_email
    AND success = false
    AND created_at > v_window_start;

  -- Count failed attempts by IP
  SELECT COUNT(*) INTO v_ip_attempts
  FROM login_attempts
  WHERE ip_address = p_ip_address
    AND success = false
    AND created_at > v_window_start;

  -- Check if blocked by email attempts (stricter limit)
  IF v_email_attempts >= p_max_attempts THEN
    RETURN QUERY SELECT
      true,
      0,
      v_window_start + (p_window_minutes * 2 || ' minutes')::INTERVAL,
      'Too many failed attempts for this email';
    RETURN;
  END IF;

  -- Check if blocked by IP attempts (higher limit)
  IF v_ip_attempts >= p_max_attempts * 3 THEN
    RETURN QUERY SELECT
      true,
      0,
      v_window_start + (p_window_minutes || ' minutes')::INTERVAL,
      'Too many failed attempts from this IP address';
    RETURN;
  END IF;

  -- Not blocked
  RETURN QUERY SELECT
    false,
    LEAST(p_max_attempts - v_email_attempts, (p_max_attempts * 3) - v_ip_attempts),
    NULL::TIMESTAMPTZ,
    NULL::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record login attempt
CREATE OR REPLACE FUNCTION record_login_attempt(
  p_email TEXT,
  p_ip_address INET,
  p_user_id UUID DEFAULT NULL,
  p_success BOOLEAN DEFAULT false,
  p_failure_reason TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_device_fingerprint TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_attempt_id UUID;
BEGIN
  INSERT INTO login_attempts (
    email, ip_address, user_id, success, failure_reason,
    user_agent, device_fingerprint
  )
  VALUES (
    p_email, p_ip_address, p_user_id, p_success, p_failure_reason,
    p_user_agent, p_device_fingerprint
  )
  RETURNING id INTO v_attempt_id;

  RETURN v_attempt_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check and update rate limit
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_identifier TEXT,
  p_limit_type TEXT,
  p_max_requests INTEGER DEFAULT 10,
  p_window_seconds INTEGER DEFAULT 60
)
RETURNS TABLE (
  allowed BOOLEAN,
  remaining INTEGER,
  reset_at TIMESTAMPTZ
) AS $$
DECLARE
  v_entry rate_limit_entries%ROWTYPE;
  v_window_end TIMESTAMPTZ;
BEGIN
  v_window_end := now() + (p_window_seconds || ' seconds')::INTERVAL;

  -- Try to get existing entry
  SELECT * INTO v_entry
  FROM rate_limit_entries
  WHERE identifier = p_identifier
    AND limit_type = p_limit_type
    AND window_end > now()
  FOR UPDATE;

  IF v_entry.id IS NULL THEN
    -- Create new entry
    INSERT INTO rate_limit_entries (identifier, limit_type, request_count, window_end)
    VALUES (p_identifier, p_limit_type, 1, v_window_end)
    ON CONFLICT (identifier, limit_type) DO UPDATE
    SET
      request_count = CASE
        WHEN rate_limit_entries.window_end < now() THEN 1
        ELSE rate_limit_entries.request_count + 1
      END,
      window_end = CASE
        WHEN rate_limit_entries.window_end < now() THEN v_window_end
        ELSE rate_limit_entries.window_end
      END,
      updated_at = now()
    RETURNING * INTO v_entry;
  ELSE
    -- Update existing entry
    UPDATE rate_limit_entries
    SET request_count = request_count + 1, updated_at = now()
    WHERE id = v_entry.id
    RETURNING * INTO v_entry;
  END IF;

  -- Return result
  IF v_entry.request_count > p_max_requests THEN
    RETURN QUERY SELECT false, 0, v_entry.window_end;
  ELSE
    RETURN QUERY SELECT true, p_max_requests - v_entry.request_count, v_entry.window_end;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log audit event
CREATE OR REPLACE FUNCTION log_audit_event(
  p_user_id UUID,
  p_action TEXT,
  p_status TEXT,
  p_resource_type TEXT DEFAULT NULL,
  p_resource_id TEXT DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_details JSONB DEFAULT NULL,
  p_risk_level TEXT DEFAULT 'low',
  p_actor_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO audit_logs (
    user_id, actor_id, action, resource_type, resource_id,
    status, ip_address, user_agent, details, risk_level
  )
  VALUES (
    p_user_id, COALESCE(p_actor_id, p_user_id), p_action, p_resource_type, p_resource_id,
    p_status, p_ip_address, p_user_agent, p_details, p_risk_level
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's active sessions
CREATE OR REPLACE FUNCTION get_user_sessions(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  ip_address INET,
  user_agent TEXT,
  device_type TEXT,
  browser TEXT,
  os TEXT,
  location_city TEXT,
  location_country TEXT,
  is_current BOOLEAN,
  last_activity_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id, s.ip_address, s.user_agent, s.device_type,
    s.browser, s.os, s.location_city, s.location_country,
    s.is_current, s.last_activity_at, s.created_at
  FROM user_sessions s
  WHERE s.user_id = p_user_id
    AND s.revoked = false
    AND s.expires_at > now()
  ORDER BY s.is_current DESC, s.last_activity_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to revoke a session
CREATE OR REPLACE FUNCTION revoke_user_session(
  p_session_id UUID,
  p_user_id UUID,
  p_reason TEXT DEFAULT 'user_revoked'
)
RETURNS BOOLEAN AS $$
DECLARE
  v_affected INTEGER;
BEGIN
  UPDATE user_sessions
  SET
    revoked = true,
    revoked_at = now(),
    revoked_reason = p_reason
  WHERE id = p_session_id
    AND user_id = p_user_id
    AND revoked = false;

  GET DIAGNOSTICS v_affected = ROW_COUNT;

  -- Log the session revocation
  IF v_affected > 0 THEN
    PERFORM log_audit_event(
      p_user_id,
      'session_revoke',
      'success',
      'session',
      p_session_id::TEXT,
      NULL,
      NULL,
      jsonb_build_object('reason', p_reason),
      'medium'
    );
  END IF;

  RETURN v_affected > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to revoke all user sessions except current
CREATE OR REPLACE FUNCTION revoke_all_other_sessions(
  p_user_id UUID,
  p_current_session_id UUID DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  v_affected INTEGER;
BEGIN
  UPDATE user_sessions
  SET
    revoked = true,
    revoked_at = now(),
    revoked_reason = 'revoke_all_by_user'
  WHERE user_id = p_user_id
    AND revoked = false
    AND (p_current_session_id IS NULL OR id != p_current_session_id);

  GET DIAGNOSTICS v_affected = ROW_COUNT;

  -- Log the action
  IF v_affected > 0 THEN
    PERFORM log_audit_event(
      p_user_id,
      'revoke_all_sessions',
      'success',
      'session',
      NULL,
      NULL,
      NULL,
      jsonb_build_object('sessions_revoked', v_affected, 'preserved_session', p_current_session_id),
      'high'
    );
  END IF;

  RETURN v_affected;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create GDPR data export request
CREATE OR REPLACE FUNCTION request_gdpr_data_export(
  p_user_id UUID,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_request_id UUID;
  v_pending_count INTEGER;
BEGIN
  -- Check for existing pending request
  SELECT COUNT(*) INTO v_pending_count
  FROM gdpr_data_requests
  WHERE user_id = p_user_id
    AND request_type = 'export'
    AND status IN ('pending', 'processing')
    AND created_at > now() - interval '24 hours';

  IF v_pending_count > 0 THEN
    RAISE EXCEPTION 'A data export request is already pending. Please wait for it to complete.';
  END IF;

  -- Create the request
  INSERT INTO gdpr_data_requests (
    user_id, request_type, status, ip_address, user_agent
  )
  VALUES (
    p_user_id, 'export', 'pending', p_ip_address, p_user_agent
  )
  RETURNING id INTO v_request_id;

  -- Log the audit event
  PERFORM log_audit_event(
    p_user_id,
    'gdpr_export_request',
    'success',
    'gdpr_request',
    v_request_id::TEXT,
    p_ip_address,
    p_user_agent,
    NULL,
    'medium'
  );

  RETURN v_request_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to request account deletion
CREATE OR REPLACE FUNCTION request_account_deletion(
  p_user_id UUID,
  p_reason TEXT DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_grace_period_days INTEGER DEFAULT 30
)
RETURNS UUID AS $$
DECLARE
  v_request_id UUID;
  v_scheduled_for TIMESTAMPTZ;
  v_existing_deletion UUID;
BEGIN
  v_scheduled_for := now() + (p_grace_period_days || ' days')::INTERVAL;

  -- Check for existing deletion request
  SELECT id INTO v_existing_deletion
  FROM account_deletion_scheduled
  WHERE user_id = p_user_id
    AND cancelled = false
    AND executed = false;

  IF v_existing_deletion IS NOT NULL THEN
    RAISE EXCEPTION 'An account deletion is already scheduled. Cancel it first to create a new request.';
  END IF;

  -- Create GDPR request
  INSERT INTO gdpr_data_requests (
    user_id, request_type, status, scheduled_deletion_at, ip_address, user_agent
  )
  VALUES (
    p_user_id, 'deletion', 'pending', v_scheduled_for, p_ip_address, p_user_agent
  )
  RETURNING id INTO v_request_id;

  -- Create deletion schedule
  INSERT INTO account_deletion_scheduled (
    user_id, gdpr_request_id, reason, scheduled_for, ip_address
  )
  VALUES (
    p_user_id, v_request_id, p_reason, v_scheduled_for, p_ip_address
  );

  -- Log the audit event
  PERFORM log_audit_event(
    p_user_id,
    'account_deletion_request',
    'success',
    'account',
    p_user_id::TEXT,
    p_ip_address,
    p_user_agent,
    jsonb_build_object(
      'reason', p_reason,
      'scheduled_for', v_scheduled_for,
      'grace_period_days', p_grace_period_days
    ),
    'critical'
  );

  RETURN v_request_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cancel account deletion
CREATE OR REPLACE FUNCTION cancel_account_deletion(
  p_user_id UUID,
  p_cancel_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_affected INTEGER;
BEGIN
  -- Cancel the scheduled deletion
  UPDATE account_deletion_scheduled
  SET
    cancelled = true,
    cancelled_at = now(),
    cancelled_reason = p_cancel_reason
  WHERE user_id = p_user_id
    AND cancelled = false
    AND executed = false;

  GET DIAGNOSTICS v_affected = ROW_COUNT;

  -- Update the GDPR request
  UPDATE gdpr_data_requests
  SET
    status = 'cancelled',
    updated_at = now()
  WHERE user_id = p_user_id
    AND request_type = 'deletion'
    AND status = 'pending';

  -- Log the audit event
  IF v_affected > 0 THEN
    PERFORM log_audit_event(
      p_user_id,
      'account_deletion_cancelled',
      'success',
      'account',
      p_user_id::TEXT,
      NULL,
      NULL,
      jsonb_build_object('cancel_reason', p_cancel_reason),
      'high'
    );
  END IF;

  RETURN v_affected > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cleanup function for expired entries
CREATE OR REPLACE FUNCTION cleanup_security_tables()
RETURNS TABLE (
  sessions_cleaned INTEGER,
  rate_limits_cleaned INTEGER,
  login_attempts_cleaned INTEGER
) AS $$
DECLARE
  v_sessions INTEGER;
  v_rate_limits INTEGER;
  v_login_attempts INTEGER;
BEGIN
  -- Clean expired sessions
  DELETE FROM user_sessions
  WHERE (expires_at < now() AND revoked = false)
    OR (revoked = true AND revoked_at < now() - interval '30 days');
  GET DIAGNOSTICS v_sessions = ROW_COUNT;

  -- Clean expired rate limit entries
  DELETE FROM rate_limit_entries
  WHERE window_end < now() - interval '1 hour';
  GET DIAGNOSTICS v_rate_limits = ROW_COUNT;

  -- Clean old login attempts (keep 90 days)
  DELETE FROM login_attempts
  WHERE created_at < now() - interval '90 days';
  GET DIAGNOSTICS v_login_attempts = ROW_COUNT;

  RETURN QUERY SELECT v_sessions, v_rate_limits, v_login_attempts;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION check_login_throttle IS 'Check if login should be throttled for brute force protection';
COMMENT ON FUNCTION record_login_attempt IS 'Record a login attempt for security tracking';
COMMENT ON FUNCTION check_rate_limit IS 'Check and update rate limit for distributed rate limiting';
COMMENT ON FUNCTION log_audit_event IS 'Log a security-relevant action to the audit log';
COMMENT ON FUNCTION get_user_sessions IS 'Get all active sessions for a user';
COMMENT ON FUNCTION revoke_user_session IS 'Revoke a specific session';
COMMENT ON FUNCTION revoke_all_other_sessions IS 'Revoke all sessions except the current one';
COMMENT ON FUNCTION request_gdpr_data_export IS 'Create a GDPR data export request';
COMMENT ON FUNCTION request_account_deletion IS 'Schedule account deletion with grace period';
COMMENT ON FUNCTION cancel_account_deletion IS 'Cancel a scheduled account deletion';
COMMENT ON FUNCTION cleanup_security_tables IS 'Cleanup expired security-related entries';
-- =============================================
-- Billing Schema Consolidation Migration
-- =============================================
-- This migration consolidates the billing infrastructure by:
-- 1. Creating missing tables referenced in code (feature_usage, feature_catalog, etc.)
-- 2. Adding usage-based billing support
-- 3. Creating unified views for subscription data
-- 4. Adding helper functions for billing operations
-- =============================================

-- =============================================
-- 1. Feature Catalog - defines all billable features
-- =============================================
CREATE TABLE IF NOT EXISTS public.feature_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_key TEXT NOT NULL UNIQUE, -- e.g., 'ai_listing_description', 'market_report'
  name TEXT NOT NULL,
  description TEXT,

  -- Pricing configuration
  pricing_type TEXT NOT NULL DEFAULT 'included', -- 'included', 'metered', 'tiered'
  unit_price DECIMAL(10,4), -- Price per unit (for metered features)
  unit_name TEXT DEFAULT 'use', -- e.g., 'use', 'photo', 'report'

  -- Limits for included features
  free_limit INTEGER DEFAULT 0, -- Number included in free plan
  starter_limit INTEGER DEFAULT 0,
  professional_limit INTEGER DEFAULT 0,
  team_limit INTEGER DEFAULT 0,
  enterprise_limit INTEGER, -- NULL means unlimited

  -- Feature flags
  is_active BOOLEAN DEFAULT TRUE,
  requires_subscription BOOLEAN DEFAULT FALSE,

  -- Metadata
  category TEXT, -- 'ai', 'reports', 'integrations', 'storage'
  sort_order INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.feature_catalog ENABLE ROW LEVEL SECURITY;

-- Everyone can read the feature catalog
DROP POLICY IF EXISTS "Anyone can read feature catalog" ON public.feature_catalog;
CREATE POLICY "Anyone can read feature catalog"
  ON public.feature_catalog FOR SELECT
  USING (true);

-- Only admins can modify
DROP POLICY IF EXISTS "Admins can modify feature catalog" ON public.feature_catalog;
CREATE POLICY "Admins can modify feature catalog"
  ON public.feature_catalog FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Seed default features
INSERT INTO public.feature_catalog (feature_key, name, description, pricing_type, unit_price, unit_name, free_limit, starter_limit, professional_limit, team_limit, category)
VALUES
  ('listings', 'Property Listings', 'Active property listings', 'included', NULL, 'listing', 3, 10, 25, 100, 'core'),
  ('links', 'Bio Links', 'Custom links on profile', 'included', NULL, 'link', 5, 15, 50, 200, 'core'),
  ('testimonials', 'Testimonials', 'Client testimonials', 'included', NULL, 'testimonial', 3, 10, 25, 100, 'core'),
  ('analytics_days', 'Analytics History', 'Days of analytics data retention', 'included', NULL, 'day', 7, 30, 90, 365, 'analytics'),
  ('ai_listing_description', 'AI Listing Description', 'AI-generated property descriptions', 'metered', 2.00, 'use', 0, 3, 10, 50, 'ai'),
  ('market_report', 'Market Report', 'Local market analysis report', 'metered', 10.00, 'report', 0, 0, 2, 10, 'reports'),
  ('virtual_staging', 'Virtual Staging', 'AI virtual staging for photos', 'metered', 5.00, 'photo', 0, 0, 5, 25, 'ai'),
  ('video_tour', 'Video Tour', 'Automated video tour creation', 'metered', 15.00, 'tour', 0, 0, 2, 10, 'media'),
  ('cma_report', 'CMA Report', 'Comparative market analysis', 'metered', 19.99, 'report', 0, 0, 1, 5, 'reports'),
  ('custom_domain', 'Custom Domain', 'Use your own domain', 'included', NULL, 'domain', 0, 0, 1, 5, 'branding'),
  ('remove_branding', 'Remove Branding', 'Remove AgentBio branding', 'included', NULL, 'feature', 0, 0, 1, 1, 'branding'),
  ('priority_support', 'Priority Support', 'Priority customer support', 'included', NULL, 'feature', 0, 0, 1, 1, 'support'),
  ('team_members', 'Team Members', 'Additional team member seats', 'included', NULL, 'seat', 0, 0, 1, 10, 'team')
ON CONFLICT (feature_key) DO NOTHING;

-- =============================================
-- 2. Feature Usage Tracking
-- =============================================
CREATE TABLE IF NOT EXISTS public.feature_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature_key TEXT NOT NULL REFERENCES public.feature_catalog(feature_key),

  -- Usage tracking
  usage_count INTEGER NOT NULL DEFAULT 0,
  usage_period_start TIMESTAMPTZ NOT NULL DEFAULT date_trunc('month', NOW()),
  usage_period_end TIMESTAMPTZ NOT NULL DEFAULT (date_trunc('month', NOW()) + INTERVAL '1 month'),

  -- Billing status
  billed_count INTEGER DEFAULT 0, -- Count already billed to Stripe
  pending_count INTEGER GENERATED ALWAYS AS (usage_count - billed_count) STORED,

  -- Metadata
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- One record per user per feature per billing period
  UNIQUE(user_id, feature_key, usage_period_start)
);

-- Enable RLS
ALTER TABLE public.feature_usage ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_feature_usage_user_id ON public.feature_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_feature_usage_feature_key ON public.feature_usage(feature_key);
CREATE INDEX IF NOT EXISTS idx_feature_usage_period ON public.feature_usage(usage_period_start, usage_period_end);

-- Users can view their own usage
DROP POLICY IF EXISTS "Users can view own usage" ON public.feature_usage;
CREATE POLICY "Users can view own usage"
  ON public.feature_usage FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can manage all usage
DROP POLICY IF EXISTS "Service role can manage usage" ON public.feature_usage;
CREATE POLICY "Service role can manage usage"
  ON public.feature_usage FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_feature_usage_updated_at ON public.feature_usage;
CREATE TRIGGER update_feature_usage_updated_at
  BEFORE UPDATE ON public.feature_usage
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- 3. Stripe Customer Mapping
-- =============================================
CREATE TABLE IF NOT EXISTS public.stripe_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  stripe_customer_id TEXT NOT NULL UNIQUE,

  -- Customer metadata
  email TEXT,
  name TEXT,
  default_payment_method TEXT,

  -- Status
  is_active BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.stripe_customers ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_stripe_customers_user_id ON public.stripe_customers(user_id);
CREATE INDEX IF NOT EXISTS idx_stripe_customers_stripe_id ON public.stripe_customers(stripe_customer_id);

-- Users can view their own customer record
DROP POLICY IF EXISTS "Users can view own stripe customer" ON public.stripe_customers;
CREATE POLICY "Users can view own stripe customer"
  ON public.stripe_customers FOR SELECT
  USING (auth.uid() = user_id);

-- Service role manages customer records
DROP POLICY IF EXISTS "Service role can manage stripe customers" ON public.stripe_customers;
CREATE POLICY "Service role can manage stripe customers"
  ON public.stripe_customers FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- =============================================
-- 4. Monthly Usage Summary (for billing)
-- =============================================
CREATE TABLE IF NOT EXISTS public.monthly_usage_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Period
  period_year INTEGER NOT NULL,
  period_month INTEGER NOT NULL,

  -- Summary data
  total_usage_amount DECIMAL(10,2) DEFAULT 0,
  features_used JSONB DEFAULT '{}', -- { feature_key: { count, amount } }

  -- Billing status
  billing_status TEXT DEFAULT 'pending', -- 'pending', 'invoiced', 'paid', 'failed'
  stripe_invoice_id TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, period_year, period_month)
);

-- Enable RLS
ALTER TABLE public.monthly_usage_summary ENABLE ROW LEVEL SECURITY;

-- Users can view their own summaries
DROP POLICY IF EXISTS "Users can view own usage summary" ON public.monthly_usage_summary;
CREATE POLICY "Users can view own usage summary"
  ON public.monthly_usage_summary FOR SELECT
  USING (auth.uid() = user_id);

-- Service role manages summaries
DROP POLICY IF EXISTS "Service role can manage usage summaries" ON public.monthly_usage_summary;
CREATE POLICY "Service role can manage usage summaries"
  ON public.monthly_usage_summary FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- =============================================
-- 5. Stripe Usage Records (sync tracking)
-- =============================================
CREATE TABLE IF NOT EXISTS public.stripe_usage_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature_key TEXT NOT NULL,

  -- Stripe data
  stripe_subscription_item_id TEXT,
  stripe_usage_record_id TEXT,

  -- Usage data sent to Stripe
  quantity INTEGER NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  action TEXT DEFAULT 'increment', -- 'increment' or 'set'

  -- Sync status
  synced_at TIMESTAMPTZ,
  sync_status TEXT DEFAULT 'pending', -- 'pending', 'synced', 'failed'
  sync_error TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.stripe_usage_records ENABLE ROW LEVEL SECURITY;

-- Users can view their own records
DROP POLICY IF EXISTS "Users can view own stripe records" ON public.stripe_usage_records;
CREATE POLICY "Users can view own stripe records"
  ON public.stripe_usage_records FOR SELECT
  USING (auth.uid() = user_id);

-- Service role manages records
DROP POLICY IF EXISTS "Service role can manage stripe records" ON public.stripe_usage_records;
CREATE POLICY "Service role can manage stripe records"
  ON public.stripe_usage_records FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- =============================================
-- 6. Unified Subscription View
-- =============================================
CREATE OR REPLACE VIEW public.user_subscription_details AS
SELECT
  s.id,
  s.user_id,
  s.plan_name,
  s.status,
  s.stripe_customer_id,
  s.stripe_subscription_id,
  s.current_period_start,
  s.current_period_end,
  s.trial_end,
  s.cancel_at,
  s.canceled_at,

  -- Feature limits from subscription
  s.max_listings,
  s.max_links,
  s.max_testimonials,
  s.analytics_history_days,
  s.custom_domain_enabled,
  s.remove_branding,
  s.priority_support,

  -- Current usage counts
  (SELECT COUNT(*) FROM public.listings WHERE user_id = s.user_id) AS current_listings,
  (SELECT COUNT(*) FROM public.links WHERE user_id = s.user_id) AS current_links,
  (SELECT COUNT(*) FROM public.testimonials WHERE user_id = s.user_id) AS current_testimonials,

  -- Calculated fields
  CASE
    WHEN s.status = 'active' AND (s.cancel_at IS NULL OR s.cancel_at > NOW()) THEN TRUE
    WHEN s.status = 'trialing' AND (s.trial_end IS NULL OR s.trial_end > NOW()) THEN TRUE
    ELSE FALSE
  END AS is_subscription_active,

  s.created_at,
  s.updated_at
FROM public.subscriptions s;

-- =============================================
-- 7. Helper Functions
-- =============================================

-- Function to record feature usage
CREATE OR REPLACE FUNCTION public.record_feature_usage(
  _user_id UUID,
  _feature_key TEXT,
  _count INTEGER DEFAULT 1,
  _metadata JSONB DEFAULT '{}'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_period_start TIMESTAMPTZ := date_trunc('month', NOW());
  current_period_end TIMESTAMPTZ := date_trunc('month', NOW()) + INTERVAL '1 month';
BEGIN
  -- Insert or update usage record
  INSERT INTO public.feature_usage (
    user_id,
    feature_key,
    usage_count,
    usage_period_start,
    usage_period_end,
    metadata
  )
  VALUES (
    _user_id,
    _feature_key,
    _count,
    current_period_start,
    current_period_end,
    _metadata
  )
  ON CONFLICT (user_id, feature_key, usage_period_start)
  DO UPDATE SET
    usage_count = public.feature_usage.usage_count + _count,
    metadata = public.feature_usage.metadata || _metadata,
    updated_at = NOW();

  RETURN TRUE;
EXCEPTION WHEN OTHERS THEN
  RETURN FALSE;
END;
$$;

-- Function to check feature limit
CREATE OR REPLACE FUNCTION public.check_feature_limit(
  _user_id UUID,
  _feature_key TEXT
)
RETURNS TABLE (
  allowed BOOLEAN,
  current_usage INTEGER,
  limit_amount INTEGER,
  remaining INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_plan TEXT;
  feature_limit INTEGER;
  current_usage_count INTEGER;
BEGIN
  -- Get user's plan
  SELECT plan_name INTO user_plan
  FROM public.subscriptions
  WHERE user_id = _user_id;

  -- Default to free if no subscription
  user_plan := COALESCE(user_plan, 'free');

  -- Get feature limit for user's plan
  SELECT
    CASE user_plan
      WHEN 'free' THEN fc.free_limit
      WHEN 'starter' THEN fc.starter_limit
      WHEN 'professional' THEN fc.professional_limit
      WHEN 'team' THEN fc.team_limit
      WHEN 'enterprise' THEN fc.enterprise_limit
      ELSE fc.free_limit
    END INTO feature_limit
  FROM public.feature_catalog fc
  WHERE fc.feature_key = _feature_key;

  -- Default to 0 if feature not found
  feature_limit := COALESCE(feature_limit, 0);

  -- Get current usage for this period
  SELECT COALESCE(SUM(fu.usage_count), 0) INTO current_usage_count
  FROM public.feature_usage fu
  WHERE fu.user_id = _user_id
    AND fu.feature_key = _feature_key
    AND fu.usage_period_start = date_trunc('month', NOW());

  -- Return results
  RETURN QUERY SELECT
    (current_usage_count < feature_limit OR feature_limit IS NULL) AS allowed,
    current_usage_count AS current_usage,
    feature_limit AS limit_amount,
    GREATEST(0, feature_limit - current_usage_count) AS remaining;
END;
$$;

-- Function to get user's complete subscription with usage
CREATE OR REPLACE FUNCTION public.get_user_subscription_with_usage(_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
  sub_record RECORD;
  usage_data JSONB;
BEGIN
  -- Get subscription details
  SELECT * INTO sub_record
  FROM public.user_subscription_details
  WHERE user_id = _user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'subscription', NULL,
      'usage', '{}'::JSONB,
      'has_subscription', FALSE
    );
  END IF;

  -- Get current period usage
  SELECT COALESCE(
    jsonb_object_agg(feature_key, jsonb_build_object('count', usage_count, 'billed', billed_count)),
    '{}'::JSONB
  ) INTO usage_data
  FROM public.feature_usage
  WHERE user_id = _user_id
    AND usage_period_start = date_trunc('month', NOW());

  -- Build result
  result := jsonb_build_object(
    'subscription', row_to_json(sub_record)::JSONB,
    'usage', usage_data,
    'has_subscription', TRUE
  );

  RETURN result;
END;
$$;

-- =============================================
-- 8. Comments for documentation
-- =============================================
COMMENT ON TABLE public.feature_catalog IS 'Master list of all billable features with pricing and limits';
COMMENT ON TABLE public.feature_usage IS 'Tracks usage of metered features per user per billing period';
COMMENT ON TABLE public.stripe_customers IS 'Maps users to Stripe customer IDs';
COMMENT ON TABLE public.monthly_usage_summary IS 'Aggregated monthly usage data for billing';
COMMENT ON TABLE public.stripe_usage_records IS 'Records of usage data synced to Stripe';
COMMENT ON VIEW public.user_subscription_details IS 'Unified view of subscription data with current usage';
COMMENT ON FUNCTION public.record_feature_usage IS 'Record usage of a metered feature';
COMMENT ON FUNCTION public.check_feature_limit IS 'Check if user can use a feature based on their plan limits';
COMMENT ON FUNCTION public.get_user_subscription_with_usage IS 'Get complete subscription info with current usage data';
-- =============================================
-- Lead Activities / Timeline Persistence
-- =============================================
-- This migration creates the infrastructure for:
-- 1. Persistent lead activity timeline
-- 2. Activity logging for CRM interactions
-- 3. Functions for recording and querying activities
-- =============================================

-- =============================================
-- 1. Lead Activities Table
-- =============================================
CREATE TABLE IF NOT EXISTS public.lead_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Activity type and content
  activity_type TEXT NOT NULL, -- 'note', 'email', 'call', 'meeting', 'status_change', 'task', 'sms', 'form_submission'
  title TEXT,
  content TEXT,

  -- For status change activities
  previous_status TEXT,
  new_status TEXT,

  -- For email activities
  email_subject TEXT,
  email_recipient TEXT,

  -- For call activities
  call_duration_seconds INTEGER,
  call_outcome TEXT, -- 'answered', 'voicemail', 'no_answer', 'busy'

  -- For meeting activities
  meeting_type TEXT, -- 'in_person', 'video', 'phone'
  meeting_location TEXT,
  meeting_scheduled_at TIMESTAMPTZ,

  -- For task activities
  task_due_date TIMESTAMPTZ,
  task_completed_at TIMESTAMPTZ,
  task_priority TEXT, -- 'low', 'medium', 'high'

  -- Metadata
  metadata JSONB DEFAULT '{}',
  is_internal BOOLEAN DEFAULT TRUE, -- Internal note vs. external communication

  -- Timestamps
  activity_at TIMESTAMPTZ DEFAULT NOW(), -- When the activity occurred
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.lead_activities ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_lead_activities_lead_id ON public.lead_activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_activities_user_id ON public.lead_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_lead_activities_type ON public.lead_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_lead_activities_activity_at ON public.lead_activities(activity_at DESC);
CREATE INDEX IF NOT EXISTS idx_lead_activities_lead_activity_at ON public.lead_activities(lead_id, activity_at DESC);

-- RLS Policies
-- Users can view activities for their own leads
DROP POLICY IF EXISTS "Users can view activities for own leads" ON public.lead_activities;
CREATE POLICY "Users can view activities for own leads"
  ON public.lead_activities FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.leads
      WHERE leads.id = lead_activities.lead_id
        AND leads.user_id = auth.uid()
    )
  );

-- Users can create activities for their own leads
DROP POLICY IF EXISTS "Users can create activities for own leads" ON public.lead_activities;
CREATE POLICY "Users can create activities for own leads"
  ON public.lead_activities FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.leads
      WHERE leads.id = lead_activities.lead_id
        AND leads.user_id = auth.uid()
    )
  );

-- Users can update their own activities
DROP POLICY IF EXISTS "Users can update own activities" ON public.lead_activities;
CREATE POLICY "Users can update own activities"
  ON public.lead_activities FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own activities
DROP POLICY IF EXISTS "Users can delete own activities" ON public.lead_activities;
CREATE POLICY "Users can delete own activities"
  ON public.lead_activities FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_lead_activities_updated_at ON public.lead_activities;
CREATE TRIGGER update_lead_activities_updated_at
  BEFORE UPDATE ON public.lead_activities
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- 2. Activity Summary View
-- =============================================
CREATE OR REPLACE VIEW public.lead_activity_summary AS
SELECT
  la.lead_id,
  COUNT(*) AS total_activities,
  COUNT(*) FILTER (WHERE la.activity_type = 'note') AS notes_count,
  COUNT(*) FILTER (WHERE la.activity_type = 'email') AS emails_count,
  COUNT(*) FILTER (WHERE la.activity_type = 'call') AS calls_count,
  COUNT(*) FILTER (WHERE la.activity_type = 'meeting') AS meetings_count,
  COUNT(*) FILTER (WHERE la.activity_type = 'status_change') AS status_changes_count,
  MAX(la.activity_at) AS last_activity_at,
  MAX(la.activity_at) FILTER (WHERE la.activity_type = 'email') AS last_email_at,
  MAX(la.activity_at) FILTER (WHERE la.activity_type = 'call') AS last_call_at,
  MIN(la.activity_at) AS first_activity_at
FROM public.lead_activities la
GROUP BY la.lead_id;

-- =============================================
-- 3. Helper Functions
-- =============================================

-- Function to log a lead activity
CREATE OR REPLACE FUNCTION public.log_lead_activity(
  _lead_id UUID,
  _activity_type TEXT,
  _content TEXT DEFAULT NULL,
  _title TEXT DEFAULT NULL,
  _metadata JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_activity_id UUID;
  current_user_id UUID := auth.uid();
BEGIN
  -- Verify user owns the lead
  IF NOT EXISTS (
    SELECT 1 FROM public.leads
    WHERE id = _lead_id AND user_id = current_user_id
  ) THEN
    RAISE EXCEPTION 'Lead not found or access denied';
  END IF;

  -- Insert the activity
  INSERT INTO public.lead_activities (
    lead_id,
    user_id,
    activity_type,
    title,
    content,
    metadata
  )
  VALUES (
    _lead_id,
    current_user_id,
    _activity_type,
    _title,
    _content,
    _metadata
  )
  RETURNING id INTO new_activity_id;

  -- Update lead's last_contacted_at for communication activities
  IF _activity_type IN ('email', 'call', 'meeting', 'sms') THEN
    UPDATE public.leads
    SET last_contacted_at = NOW(), updated_at = NOW()
    WHERE id = _lead_id;
  END IF;

  RETURN new_activity_id;
END;
$$;

-- Function to log status change
CREATE OR REPLACE FUNCTION public.log_lead_status_change(
  _lead_id UUID,
  _previous_status TEXT,
  _new_status TEXT,
  _note TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_activity_id UUID;
  current_user_id UUID := auth.uid();
BEGIN
  -- Verify user owns the lead
  IF NOT EXISTS (
    SELECT 1 FROM public.leads
    WHERE id = _lead_id AND user_id = current_user_id
  ) THEN
    RAISE EXCEPTION 'Lead not found or access denied';
  END IF;

  -- Insert the status change activity
  INSERT INTO public.lead_activities (
    lead_id,
    user_id,
    activity_type,
    title,
    content,
    previous_status,
    new_status,
    metadata
  )
  VALUES (
    _lead_id,
    current_user_id,
    'status_change',
    'Status changed to ' || _new_status,
    _note,
    _previous_status,
    _new_status,
    jsonb_build_object('previous_status', _previous_status, 'new_status', _new_status)
  )
  RETURNING id INTO new_activity_id;

  RETURN new_activity_id;
END;
$$;

-- Function to log email activity
CREATE OR REPLACE FUNCTION public.log_lead_email(
  _lead_id UUID,
  _subject TEXT,
  _recipient TEXT,
  _body TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_activity_id UUID;
  current_user_id UUID := auth.uid();
BEGIN
  -- Verify user owns the lead
  IF NOT EXISTS (
    SELECT 1 FROM public.leads
    WHERE id = _lead_id AND user_id = current_user_id
  ) THEN
    RAISE EXCEPTION 'Lead not found or access denied';
  END IF;

  -- Insert the email activity
  INSERT INTO public.lead_activities (
    lead_id,
    user_id,
    activity_type,
    title,
    content,
    email_subject,
    email_recipient,
    is_internal,
    metadata
  )
  VALUES (
    _lead_id,
    current_user_id,
    'email',
    'Email: ' || _subject,
    _body,
    _subject,
    _recipient,
    FALSE,
    jsonb_build_object('subject', _subject, 'recipient', _recipient)
  )
  RETURNING id INTO new_activity_id;

  -- Update last contacted
  UPDATE public.leads
  SET last_contacted_at = NOW(), updated_at = NOW()
  WHERE id = _lead_id;

  RETURN new_activity_id;
END;
$$;

-- Function to log call activity
CREATE OR REPLACE FUNCTION public.log_lead_call(
  _lead_id UUID,
  _outcome TEXT,
  _duration_seconds INTEGER DEFAULT NULL,
  _notes TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_activity_id UUID;
  current_user_id UUID := auth.uid();
BEGIN
  -- Verify user owns the lead
  IF NOT EXISTS (
    SELECT 1 FROM public.leads
    WHERE id = _lead_id AND user_id = current_user_id
  ) THEN
    RAISE EXCEPTION 'Lead not found or access denied';
  END IF;

  -- Insert the call activity
  INSERT INTO public.lead_activities (
    lead_id,
    user_id,
    activity_type,
    title,
    content,
    call_duration_seconds,
    call_outcome,
    is_internal,
    metadata
  )
  VALUES (
    _lead_id,
    current_user_id,
    'call',
    'Phone call - ' || _outcome,
    _notes,
    _duration_seconds,
    _outcome,
    FALSE,
    jsonb_build_object('outcome', _outcome, 'duration', _duration_seconds)
  )
  RETURNING id INTO new_activity_id;

  -- Update last contacted
  UPDATE public.leads
  SET last_contacted_at = NOW(), updated_at = NOW()
  WHERE id = _lead_id;

  RETURN new_activity_id;
END;
$$;

-- Function to get lead timeline
CREATE OR REPLACE FUNCTION public.get_lead_timeline(
  _lead_id UUID,
  _limit INTEGER DEFAULT 50,
  _offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  activity_type TEXT,
  title TEXT,
  content TEXT,
  metadata JSONB,
  activity_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verify user owns the lead
  IF NOT EXISTS (
    SELECT 1 FROM public.leads
    WHERE leads.id = _lead_id AND leads.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Lead not found or access denied';
  END IF;

  RETURN QUERY
  SELECT
    la.id,
    la.activity_type,
    la.title,
    la.content,
    la.metadata,
    la.activity_at,
    la.created_at
  FROM public.lead_activities la
  WHERE la.lead_id = _lead_id
  ORDER BY la.activity_at DESC
  LIMIT _limit
  OFFSET _offset;
END;
$$;

-- =============================================
-- 4. Trigger to auto-log status changes on leads table
-- =============================================
CREATE OR REPLACE FUNCTION public.auto_log_lead_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only log if status actually changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.lead_activities (
      lead_id,
      user_id,
      activity_type,
      title,
      previous_status,
      new_status,
      metadata
    )
    VALUES (
      NEW.id,
      NEW.user_id,
      'status_change',
      'Status changed from ' || COALESCE(OLD.status, 'none') || ' to ' || NEW.status,
      OLD.status,
      NEW.status,
      jsonb_build_object('previous_status', OLD.status, 'new_status', NEW.status, 'auto_logged', true)
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Create the trigger on leads table
DROP TRIGGER IF EXISTS on_lead_status_change ON public.leads;
CREATE TRIGGER on_lead_status_change
  AFTER UPDATE OF status ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_log_lead_status_change();

-- =============================================
-- 5. Auto-log lead creation
-- =============================================
CREATE OR REPLACE FUNCTION public.auto_log_lead_creation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.lead_activities (
    lead_id,
    user_id,
    activity_type,
    title,
    content,
    metadata
  )
  VALUES (
    NEW.id,
    NEW.user_id,
    'form_submission',
    'Lead created',
    'New lead captured from ' || COALESCE(NEW.source, 'direct'),
    jsonb_build_object(
      'source', NEW.source,
      'type', NEW.type,
      'auto_logged', true
    )
  );

  RETURN NEW;
END;
$$;

-- Create the trigger on leads table
DROP TRIGGER IF EXISTS on_lead_created ON public.leads;
DROP TRIGGER IF EXISTS on_lead_created ON public.leads;
CREATE TRIGGER on_lead_created
  AFTER INSERT ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_log_lead_creation();

-- =============================================
-- 6. Comments for documentation
-- =============================================
COMMENT ON TABLE public.lead_activities IS 'Persistent timeline of all lead activities and interactions';
COMMENT ON VIEW public.lead_activity_summary IS 'Aggregated activity metrics per lead';
COMMENT ON FUNCTION public.log_lead_activity IS 'Log a generic activity for a lead';
COMMENT ON FUNCTION public.log_lead_status_change IS 'Log a status change for a lead';
COMMENT ON FUNCTION public.log_lead_email IS 'Log an email sent to a lead';
COMMENT ON FUNCTION public.log_lead_call IS 'Log a phone call with a lead';
COMMENT ON FUNCTION public.get_lead_timeline IS 'Get paginated timeline for a lead';
-- =============================================
-- Update Subscription Plans with Stripe Price IDs
-- =============================================
-- This migration adds support for separate monthly and yearly Stripe price IDs
-- and updates the existing plans with the correct pricing structure.
--
-- After running the setup-stripe-products script, update the price IDs below
-- with the actual values from Stripe.
-- =============================================

-- 1. Add stripe_price_id_yearly column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscription_plans'
    AND column_name = 'stripe_price_id_yearly'
  ) THEN
    ALTER TABLE subscription_plans
    ADD COLUMN stripe_price_id_yearly TEXT;
  END IF;
END $$;

-- 2. Rename existing stripe_price_id to stripe_price_id_monthly for clarity
-- (keeping stripe_price_id as an alias for backwards compatibility)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscription_plans'
    AND column_name = 'stripe_price_id_monthly'
  ) THEN
    ALTER TABLE subscription_plans
    ADD COLUMN stripe_price_id_monthly TEXT;

    -- Copy existing values
    UPDATE subscription_plans
    SET stripe_price_id_monthly = stripe_price_id;
  END IF;
END $$;

-- 3. Add payment_link columns for direct checkout links
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscription_plans'
    AND column_name = 'payment_link_monthly'
  ) THEN
    ALTER TABLE subscription_plans
    ADD COLUMN payment_link_monthly TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscription_plans'
    AND column_name = 'payment_link_yearly'
  ) THEN
    ALTER TABLE subscription_plans
    ADD COLUMN payment_link_yearly TEXT;
  END IF;
END $$;

-- 4. Update existing plans with correct pricing
-- Note: stripe_price_id values are placeholders - update after running setup script
UPDATE subscription_plans SET
  price_monthly = 0,
  price_yearly = 0,
  stripe_price_id_monthly = NULL,
  stripe_price_id_yearly = NULL,
  limits = '{"listings": 3, "links": 5, "testimonials": 3, "analytics_days": 7, "themes": 1}'::jsonb,
  features = '{"lead_capture": true, "support": "community"}'::jsonb
WHERE name = 'free';

UPDATE subscription_plans SET
  price_monthly = 19,
  price_yearly = 189,
  -- UPDATE THESE AFTER RUNNING setup-stripe-products script:
  -- stripe_price_id_monthly = 'price_xxx',
  -- stripe_price_id_yearly = 'price_xxx',
  limits = '{"listings": 10, "sold_properties": 10, "links": 15, "testimonials": 10, "analytics_days": 90, "themes": 3}'::jsonb,
  features = '{"lead_capture": true, "calendar_integration": true, "email_support": true, "support": "email_72hr"}'::jsonb
WHERE name = 'starter';

UPDATE subscription_plans SET
  price_monthly = 39,
  price_yearly = 389,
  -- UPDATE THESE AFTER RUNNING setup-stripe-products script:
  -- stripe_price_id_monthly = 'price_xxx',
  -- stripe_price_id_yearly = 'price_xxx',
  limits = '{"listings": 25, "sold_properties": -1, "links": -1, "testimonials": 25, "analytics_days": 365, "themes": 10}'::jsonb,
  features = '{"lead_capture": true, "calendar_integration": true, "home_valuation": true, "custom_colors": true, "qr_codes": true, "lead_export": true, "remove_branding": true, "custom_domain": true, "advanced_analytics": true, "support": "email_48hr"}'::jsonb
WHERE name = 'professional';

UPDATE subscription_plans SET
  price_monthly = 29,
  price_yearly = 289,
  -- UPDATE THESE AFTER RUNNING setup-stripe-products script:
  -- stripe_price_id_monthly = 'price_xxx',
  -- stripe_price_id_yearly = 'price_xxx',
  limits = '{"listings": -1, "sold_properties": -1, "links": -1, "testimonials": -1, "analytics_days": 730, "themes": -1}'::jsonb,
  features = '{"team_dashboard": true, "shared_assets": true, "team_branding": true, "team_directory": true, "multi_user": true, "priority_support": true, "onboarding_call": true, "custom_domain": true, "remove_branding": true, "support": "priority"}'::jsonb
WHERE name = 'team';

UPDATE subscription_plans SET
  price_monthly = 99,
  price_yearly = 989,
  -- UPDATE THESE AFTER RUNNING setup-stripe-products script:
  -- stripe_price_id_monthly = 'price_xxx',
  -- stripe_price_id_yearly = 'price_xxx',
  limits = '{"listings": -1, "sold_properties": -1, "links": -1, "testimonials": -1, "analytics_days": -1, "themes": -1}'::jsonb,
  features = '{"white_label": true, "custom_domain": true, "custom_css": true, "sso": true, "dedicated_manager": true, "phone_support": true, "lead_routing": true, "api_access": true, "support": "dedicated"}'::jsonb
WHERE name = 'enterprise';

-- 5. Create helper function to get price ID based on interval
CREATE OR REPLACE FUNCTION get_stripe_price_id(
  _plan_name TEXT,
  _interval TEXT DEFAULT 'month'
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  price_id TEXT;
BEGIN
  IF _interval = 'year' OR _interval = 'yearly' THEN
    SELECT COALESCE(stripe_price_id_yearly, stripe_price_id_monthly, stripe_price_id)
    INTO price_id
    FROM subscription_plans
    WHERE name = _plan_name AND is_active = true;
  ELSE
    SELECT COALESCE(stripe_price_id_monthly, stripe_price_id)
    INTO price_id
    FROM subscription_plans
    WHERE name = _plan_name AND is_active = true;
  END IF;

  RETURN price_id;
END;
$$;

-- 6. Create helper function to get payment link
CREATE OR REPLACE FUNCTION get_payment_link(
  _plan_name TEXT,
  _interval TEXT DEFAULT 'month'
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  link TEXT;
BEGIN
  IF _interval = 'year' OR _interval = 'yearly' THEN
    SELECT payment_link_yearly INTO link
    FROM subscription_plans
    WHERE name = _plan_name AND is_active = true;
  ELSE
    SELECT payment_link_monthly INTO link
    FROM subscription_plans
    WHERE name = _plan_name AND is_active = true;
  END IF;

  RETURN link;
END;
$$;

-- 7. Update get_user_plan function to include stripe_price_id
CREATE OR REPLACE FUNCTION get_user_plan(_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  plan_data JSONB;
BEGIN
  SELECT jsonb_build_object(
    'plan_name', sp.name,
    'limits', sp.limits,
    'features', sp.features,
    'status', us.status,
    'current_period_end', us.current_period_end,
    'stripe_price_id', COALESCE(sp.stripe_price_id_monthly, sp.stripe_price_id),
    'stripe_price_id_yearly', sp.stripe_price_id_yearly,
    'price_monthly', sp.price_monthly,
    'price_yearly', sp.price_yearly
  ) INTO plan_data
  FROM user_subscriptions us
  JOIN subscription_plans sp ON us.plan_id = sp.id
  WHERE us.user_id = _user_id AND us.status = 'active';

  IF plan_data IS NULL THEN
    -- Return free plan limits
    SELECT jsonb_build_object(
      'plan_name', 'free',
      'limits', limits,
      'features', features,
      'status', 'free',
      'stripe_price_id', stripe_price_id_monthly,
      'stripe_price_id_yearly', stripe_price_id_yearly,
      'price_monthly', price_monthly,
      'price_yearly', price_yearly
    ) INTO plan_data
    FROM subscription_plans
    WHERE name = 'free' AND is_active = true;

    -- Fallback if no free plan exists
    IF plan_data IS NULL THEN
      plan_data := jsonb_build_object(
        'plan_name', 'free',
        'limits', jsonb_build_object(
          'listings', 3,
          'links', 5,
          'testimonials', 3,
          'analytics_days', 7
        ),
        'features', jsonb_build_object(),
        'status', 'free',
        'price_monthly', 0,
        'price_yearly', 0
      );
    END IF;
  END IF;

  RETURN plan_data;
END;
$$;

-- 8. Add comments
COMMENT ON COLUMN subscription_plans.stripe_price_id_monthly IS 'Stripe price ID for monthly billing';
COMMENT ON COLUMN subscription_plans.stripe_price_id_yearly IS 'Stripe price ID for yearly billing';
COMMENT ON COLUMN subscription_plans.payment_link_monthly IS 'Stripe payment link for monthly checkout';
COMMENT ON COLUMN subscription_plans.payment_link_yearly IS 'Stripe payment link for yearly checkout';
COMMENT ON FUNCTION get_stripe_price_id IS 'Get the Stripe price ID for a plan based on billing interval';
COMMENT ON FUNCTION get_payment_link IS 'Get the payment link URL for a plan based on billing interval';

-- =============================================
-- INSTRUCTIONS FOR UPDATING STRIPE PRICE IDs
-- =============================================
-- After running the setup-stripe-products script:
--
-- 1. Get the price IDs from the script output
-- 2. Run these UPDATE statements with the actual values:
--
-- UPDATE subscription_plans SET
--   stripe_price_id_monthly = 'price_xxx',
--   stripe_price_id_yearly = 'price_xxx',
--   payment_link_monthly = 'https://buy.stripe.com/xxx',
--   payment_link_yearly = 'https://buy.stripe.com/xxx'
-- WHERE name = 'starter';
--
-- UPDATE subscription_plans SET
--   stripe_price_id_monthly = 'price_xxx',
--   stripe_price_id_yearly = 'price_xxx',
--   payment_link_monthly = 'https://buy.stripe.com/xxx',
--   payment_link_yearly = 'https://buy.stripe.com/xxx'
-- WHERE name = 'professional';
--
-- UPDATE subscription_plans SET
--   stripe_price_id_monthly = 'price_xxx',
--   stripe_price_id_yearly = 'price_xxx',
--   payment_link_monthly = 'https://buy.stripe.com/xxx',
--   payment_link_yearly = 'https://buy.stripe.com/xxx'
-- WHERE name = 'team';
--
-- UPDATE subscription_plans SET
--   stripe_price_id_monthly = 'price_xxx',
--   stripe_price_id_yearly = 'price_xxx',
--   payment_link_monthly = 'https://buy.stripe.com/xxx',
--   payment_link_yearly = 'https://buy.stripe.com/xxx'
-- WHERE name = 'enterprise';
-- =============================================
-- =============================================================================
-- PII Encryption Support Migration
-- =============================================================================
-- This migration sets up infrastructure for PII encryption at rest:
-- 1. Creates encrypted_pii_config table to track encrypted fields
-- 2. Adds helper functions for encryption status management
-- 3. Creates audit logging for encryption operations
--
-- IMPORTANT: The actual encryption is performed by the Edge Function
-- using AES-256-GCM with a master key stored in environment secrets.
-- =============================================================================

-- Enable pgcrypto extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =============================================================================
-- 1. Encrypted PII Configuration Table
-- =============================================================================
-- Tracks which fields in which tables are encrypted
CREATE TABLE IF NOT EXISTS encrypted_pii_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name TEXT NOT NULL,
    field_name TEXT NOT NULL,
    encryption_type TEXT NOT NULL DEFAULT 'aes-256-gcm',
    is_encrypted BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(table_name, field_name)
);

-- Add index for quick lookups
CREATE INDEX IF NOT EXISTS idx_encrypted_pii_config_table
ON encrypted_pii_config(table_name);

-- Enable RLS
ALTER TABLE encrypted_pii_config ENABLE ROW LEVEL SECURITY;

-- Only admins can view/modify encryption config
DROP POLICY IF EXISTS "Admins can manage encryption config" ON encrypted_pii_config;
CREATE POLICY "Admins can manage encryption config"
ON encrypted_pii_config
FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- =============================================================================
-- 2. PII Encryption Audit Log
-- =============================================================================
-- Tracks all encryption/decryption operations for compliance
CREATE TABLE IF NOT EXISTS pii_encryption_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    operation TEXT NOT NULL CHECK (operation IN ('encrypt', 'decrypt', 'key_rotation', 'config_change')),
    table_name TEXT NOT NULL,
    record_id TEXT,
    fields_affected TEXT[],
    success BOOLEAN NOT NULL DEFAULT true,
    error_message TEXT,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes for audit queries
CREATE INDEX IF NOT EXISTS idx_pii_encryption_audit_user
ON pii_encryption_audit(user_id);

CREATE INDEX IF NOT EXISTS idx_pii_encryption_audit_table
ON pii_encryption_audit(table_name);

CREATE INDEX IF NOT EXISTS idx_pii_encryption_audit_operation
ON pii_encryption_audit(operation);

CREATE INDEX IF NOT EXISTS idx_pii_encryption_audit_created
ON pii_encryption_audit(created_at DESC);

-- Enable RLS
ALTER TABLE pii_encryption_audit ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
DROP POLICY IF EXISTS "Admins can view encryption audit" ON pii_encryption_audit;
CREATE POLICY "Admins can view encryption audit"
ON pii_encryption_audit
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- System can insert audit logs
DROP POLICY IF EXISTS "System can insert encryption audit" ON pii_encryption_audit;
CREATE POLICY "System can insert encryption audit"
ON pii_encryption_audit
FOR INSERT
WITH CHECK (true);

-- =============================================================================
-- 3. Encryption Key Metadata Table
-- =============================================================================
-- Stores metadata about encryption keys (NOT the keys themselves)
-- Used for key rotation tracking
CREATE TABLE IF NOT EXISTS encryption_key_metadata (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key_id TEXT NOT NULL UNIQUE,
    key_version INTEGER NOT NULL DEFAULT 1,
    algorithm TEXT NOT NULL DEFAULT 'aes-256-gcm',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    rotated_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'rotating', 'deprecated', 'revoked')),
    created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE encryption_key_metadata ENABLE ROW LEVEL SECURITY;

-- Only admins can manage key metadata
DROP POLICY IF EXISTS "Admins can manage encryption keys" ON encryption_key_metadata;
CREATE POLICY "Admins can manage encryption keys"
ON encryption_key_metadata
FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- =============================================================================
-- 4. Insert Default PII Field Configurations
-- =============================================================================
-- These are the fields that should be encrypted based on the analysis

-- Profiles table PII fields
INSERT INTO encrypted_pii_config (table_name, field_name, encryption_type)
VALUES
    ('profiles', 'phone', 'aes-256-gcm'),
    ('profiles', 'license_number', 'aes-256-gcm'),
    ('profiles', 'email_display', 'aes-256-gcm')
ON CONFLICT (table_name, field_name) DO NOTHING;

-- Leads table PII fields
INSERT INTO encrypted_pii_config (table_name, field_name, encryption_type)
VALUES
    ('leads', 'name', 'aes-256-gcm'),
    ('leads', 'email', 'aes-256-gcm'),
    ('leads', 'phone', 'aes-256-gcm'),
    ('leads', 'property_address', 'aes-256-gcm')
ON CONFLICT (table_name, field_name) DO NOTHING;

-- Testimonials table PII fields
INSERT INTO encrypted_pii_config (table_name, field_name, encryption_type)
VALUES
    ('testimonials', 'client_name', 'aes-256-gcm')
ON CONFLICT (table_name, field_name) DO NOTHING;

-- Listings table PII fields
INSERT INTO encrypted_pii_config (table_name, field_name, encryption_type)
VALUES
    ('listings', 'address', 'aes-256-gcm')
ON CONFLICT (table_name, field_name) DO NOTHING;

-- OAuth credentials (highly sensitive)
INSERT INTO encrypted_pii_config (table_name, field_name, encryption_type)
VALUES
    ('bing_webmaster_oauth_credentials', 'access_token', 'aes-256-gcm'),
    ('bing_webmaster_oauth_credentials', 'refresh_token', 'aes-256-gcm'),
    ('ga4_oauth_credentials', 'access_token', 'aes-256-gcm'),
    ('ga4_oauth_credentials', 'refresh_token', 'aes-256-gcm'),
    ('gsc_oauth_credentials', 'access_token', 'aes-256-gcm'),
    ('gsc_oauth_credentials', 'refresh_token', 'aes-256-gcm'),
    ('yandex_webmaster_oauth_credentials', 'access_token', 'aes-256-gcm'),
    ('yandex_webmaster_oauth_credentials', 'refresh_token', 'aes-256-gcm')
ON CONFLICT (table_name, field_name) DO NOTHING;

-- MFA secrets (critical)
INSERT INTO encrypted_pii_config (table_name, field_name, encryption_type)
VALUES
    ('user_mfa_settings', 'totp_secret', 'aes-256-gcm')
ON CONFLICT (table_name, field_name) DO NOTHING;

-- Session and login data
INSERT INTO encrypted_pii_config (table_name, field_name, encryption_type)
VALUES
    ('user_sessions', 'ip_address', 'aes-256-gcm'),
    ('login_attempts', 'ip_address', 'aes-256-gcm')
ON CONFLICT (table_name, field_name) DO NOTHING;

-- =============================================================================
-- 5. Helper Functions
-- =============================================================================

-- Function to check if a field is encrypted
CREATE OR REPLACE FUNCTION is_field_encrypted(
    p_table_name TEXT,
    p_field_name TEXT
) RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM encrypted_pii_config
        WHERE table_name = p_table_name
        AND field_name = p_field_name
        AND is_encrypted = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get all encrypted fields for a table
CREATE OR REPLACE FUNCTION get_encrypted_fields(
    p_table_name TEXT
) RETURNS TEXT[] AS $$
DECLARE
    result TEXT[];
BEGIN
    SELECT array_agg(field_name)
    INTO result
    FROM encrypted_pii_config
    WHERE table_name = p_table_name
    AND is_encrypted = true;

    RETURN COALESCE(result, ARRAY[]::TEXT[]);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log encryption operation
CREATE OR REPLACE FUNCTION log_encryption_operation(
    p_user_id UUID,
    p_operation TEXT,
    p_table_name TEXT,
    p_record_id TEXT DEFAULT NULL,
    p_fields TEXT[] DEFAULT NULL,
    p_success BOOLEAN DEFAULT true,
    p_error TEXT DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    audit_id UUID;
BEGIN
    INSERT INTO pii_encryption_audit (
        user_id,
        operation,
        table_name,
        record_id,
        fields_affected,
        success,
        error_message,
        ip_address,
        user_agent
    ) VALUES (
        p_user_id,
        p_operation,
        p_table_name,
        p_record_id,
        p_fields,
        p_success,
        p_error,
        p_ip_address,
        p_user_agent
    )
    RETURNING id INTO audit_id;

    RETURN audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate a secure encryption key (for key rotation)
-- Note: This generates the key but does NOT store it in the database
-- The key should be securely transferred to environment secrets
CREATE OR REPLACE FUNCTION generate_encryption_key()
RETURNS TEXT AS $$
BEGIN
    -- Generate 32 random bytes (256 bits) and encode as base64
    RETURN encode(gen_random_bytes(32), 'base64');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION is_field_encrypted(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_encrypted_fields(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION log_encryption_operation(UUID, TEXT, TEXT, TEXT, TEXT[], BOOLEAN, TEXT, INET, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION generate_encryption_key() TO service_role;

-- =============================================================================
-- 6. Update timestamp trigger
-- =============================================================================
CREATE OR REPLACE FUNCTION update_encrypted_pii_config_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_encrypted_pii_config_timestamp ON encrypted_pii_config;
CREATE TRIGGER trigger_update_encrypted_pii_config_timestamp
    BEFORE UPDATE ON encrypted_pii_config
    FOR EACH ROW
    EXECUTE FUNCTION update_encrypted_pii_config_timestamp();

-- =============================================================================
-- Comments for documentation
-- =============================================================================
COMMENT ON TABLE encrypted_pii_config IS 'Tracks which database fields contain encrypted PII data';
COMMENT ON TABLE pii_encryption_audit IS 'Audit log for all PII encryption/decryption operations';
COMMENT ON TABLE encryption_key_metadata IS 'Metadata for encryption keys (keys stored in environment secrets)';
COMMENT ON FUNCTION is_field_encrypted IS 'Check if a specific field is configured for encryption';
COMMENT ON FUNCTION get_encrypted_fields IS 'Get all encrypted fields for a given table';
COMMENT ON FUNCTION log_encryption_operation IS 'Log an encryption operation to the audit table';
COMMENT ON FUNCTION generate_encryption_key IS 'Generate a new 256-bit encryption key (admin use only)';
-- Create API Keys table for webhook authentication
CREATE TABLE IF NOT EXISTS public.api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL, -- Friendly name like "Make.com Webhook"
  key_hash text NOT NULL UNIQUE, -- Store the actual key (or hash in production)
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz,
  expires_at timestamptz,
  
  -- Metadata
  description text,
  scopes text[], -- Future: limit API key to specific functions
  
  CONSTRAINT api_keys_name_not_empty CHECK (char_length(name) > 0),
  CONSTRAINT api_keys_key_hash_not_empty CHECK (char_length(key_hash) > 0)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON public.api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON public.api_keys(key_hash) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_api_keys_expires_at ON public.api_keys(expires_at) WHERE is_active = true;

-- Add comments
COMMENT ON TABLE public.api_keys IS 'API keys for webhook and external service authentication';
COMMENT ON COLUMN public.api_keys.key_hash IS 'The API key value (should be hashed with bcrypt in production)';
COMMENT ON COLUMN public.api_keys.scopes IS 'Optional: limit API key to specific edge functions';

-- Enable RLS
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own API keys
DROP POLICY IF EXISTS "Users can view own api_keys" ON public.api_keys;
CREATE POLICY "Users can view own api_keys"
  ON public.api_keys
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can create their own API keys
DROP POLICY IF EXISTS "Users can create own api_keys" ON public.api_keys;
CREATE POLICY "Users can create own api_keys"
  ON public.api_keys
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own API keys
DROP POLICY IF EXISTS "Users can update own api_keys" ON public.api_keys;
CREATE POLICY "Users can update own api_keys"
  ON public.api_keys
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own API keys
DROP POLICY IF EXISTS "Users can delete own api_keys" ON public.api_keys;
CREATE POLICY "Users can delete own api_keys"
  ON public.api_keys
  FOR DELETE
  USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON public.api_keys TO authenticated;
GRANT SELECT ON public.api_keys TO service_role;
-- pSEO (Programmatic SEO) Tables
-- Supports automated generation of ~9,550 agent discovery pages

-- Core pSEO pages table
CREATE TABLE IF NOT EXISTS pseo_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_type TEXT NOT NULL CHECK (page_type IN (
    'city-directory',
    'city-specialty',
    'city-buyers-agent',
    'city-listing-agent',
    'state-directory',
    'neighborhood-directory',
    'city-situation'
  )),
  url_path TEXT NOT NULL UNIQUE,
  combination JSONB NOT NULL,
  content JSONB NOT NULL,
  is_published BOOLEAN DEFAULT false,
  quality_score INTEGER DEFAULT 0,
  agent_count INTEGER NOT NULL DEFAULT 0,
  content_hash TEXT,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  next_refresh_at TIMESTAMPTZ,
  generation_model TEXT DEFAULT 'claude-sonnet-4-20250514',
  error_count INTEGER DEFAULT 0,
  CONSTRAINT valid_url_path CHECK (url_path ~ '^/[a-z0-9-/]+$')
);

CREATE INDEX IF NOT EXISTS idx_pseo_pages_url_path ON pseo_pages(url_path);
CREATE INDEX IF NOT EXISTS idx_pseo_pages_page_type ON pseo_pages(page_type);
CREATE INDEX IF NOT EXISTS idx_pseo_pages_published ON pseo_pages(is_published) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_pseo_pages_combination_city ON pseo_pages USING gin(combination);
CREATE INDEX IF NOT EXISTS idx_pseo_pages_refresh ON pseo_pages(next_refresh_at) WHERE is_published = true;

-- Auto-update updated_at and set published_at
CREATE OR REPLACE FUNCTION update_pseo_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  IF NEW.is_published = true AND (OLD.is_published = false OR OLD.is_published IS NULL) THEN
    NEW.published_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS pseo_pages_updated_at ON pseo_pages;
CREATE TRIGGER pseo_pages_updated_at
  BEFORE UPDATE ON pseo_pages
  FOR EACH ROW EXECUTE FUNCTION update_pseo_updated_at();

-- RLS
ALTER TABLE pseo_pages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read published pseo pages" ON pseo_pages;
CREATE POLICY "Public read published pseo pages"
  ON pseo_pages FOR SELECT
  USING (is_published = true);

DROP POLICY IF EXISTS "Admin full access pseo pages" ON pseo_pages;
CREATE POLICY "Admin full access pseo pages"
  ON pseo_pages FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Generation queue table
CREATE TABLE IF NOT EXISTS pseo_combination_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_type TEXT NOT NULL,
  combination JSONB NOT NULL,
  priority INTEGER NOT NULL DEFAULT 5,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'complete', 'failed', 'insufficient_data')),
  queued_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  error_message TEXT,
  attempt_count INTEGER DEFAULT 0,
  UNIQUE (page_type, combination)
);

CREATE INDEX IF NOT EXISTS idx_queue_status_priority ON pseo_combination_queue(status, priority, queued_at);

ALTER TABLE pseo_combination_queue ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin full access pseo queue" ON pseo_combination_queue;
CREATE POLICY "Admin full access pseo queue"
  ON pseo_combination_queue FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Taxonomy table (city/state/specialty/situation context objects)
CREATE TABLE IF NOT EXISTS pseo_taxonomy (
  id TEXT PRIMARY KEY,
  taxonomy_type TEXT NOT NULL
    CHECK (taxonomy_type IN ('city', 'state', 'neighborhood', 'specialty', 'situation', 'property_type')),
  display_name TEXT NOT NULL,
  parent_id TEXT REFERENCES pseo_taxonomy(id),
  context JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  tier INTEGER DEFAULT 3,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_taxonomy_type ON pseo_taxonomy(taxonomy_type);
CREATE INDEX IF NOT EXISTS idx_taxonomy_parent ON pseo_taxonomy(parent_id);

ALTER TABLE pseo_taxonomy ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read active taxonomy" ON pseo_taxonomy;
CREATE POLICY "Public read active taxonomy"
  ON pseo_taxonomy FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Admin full access taxonomy" ON pseo_taxonomy;
CREATE POLICY "Admin full access taxonomy"
  ON pseo_taxonomy FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Generation errors log
CREATE TABLE IF NOT EXISTS pseo_generation_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_type TEXT NOT NULL,
  combination JSONB NOT NULL,
  error_type TEXT NOT NULL
    CHECK (error_type IN ('api_error', 'validation_failed', 'quality_check_failed', 'timeout', 'parse_error')),
  error_detail TEXT,
  quality_check_failures JSONB,
  raw_response TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_errors_created_at ON pseo_generation_errors(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_errors_type ON pseo_generation_errors(error_type);

ALTER TABLE pseo_generation_errors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin read errors" ON pseo_generation_errors;
CREATE POLICY "Admin read errors"
  ON pseo_generation_errors FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Prompt templates table
CREATE TABLE IF NOT EXISTS pseo_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_type TEXT NOT NULL UNIQUE,
  system_prompt TEXT NOT NULL,
  user_prompt_template TEXT NOT NULL,
  version INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE pseo_prompts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin access prompts" ON pseo_prompts;
CREATE POLICY "Admin access prompts"
  ON pseo_prompts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );
-- Instagram Bio Analyzer Tables
-- Tables for storing bio analyses, email captures, and analytics

-- Table for storing bio analyses
CREATE TABLE IF NOT EXISTS instagram_bio_analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

  -- Input data (JSONB for flexibility)
  input_data JSONB NOT NULL,

  -- Result data (JSONB for flexibility)
  result_data JSONB NOT NULL,

  -- Key metrics for querying
  overall_score INTEGER NOT NULL,
  market TEXT,

  -- Tracking
  session_id TEXT,
  user_agent TEXT,
  ip_address INET
);

-- Table for email captures
CREATE TABLE IF NOT EXISTS instagram_bio_email_captures (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

  -- Related analysis
  analysis_id UUID REFERENCES instagram_bio_analyses(id) ON DELETE SET NULL,

  -- Contact info
  email TEXT NOT NULL,
  first_name TEXT NOT NULL,
  market TEXT NOT NULL,
  brokerage TEXT,

  -- Email sequence tracking
  email_sequence_started BOOLEAN DEFAULT false,
  email_sequence_completed BOOLEAN DEFAULT false,
  last_email_sent_at TIMESTAMP WITH TIME ZONE,

  -- Conversion tracking
  converted_to_trial BOOLEAN DEFAULT false,
  converted_to_paid BOOLEAN DEFAULT false,
  converted_at TIMESTAMP WITH TIME ZONE,

  -- Referral tracking
  referral_code TEXT,
  referrals_count INTEGER DEFAULT 0
);

-- Table for analytics events
CREATE TABLE IF NOT EXISTS instagram_bio_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

  -- Event details
  event_type TEXT NOT NULL, -- 'analyzer_started', 'analyzer_completed', 'email_captured', 'shared', etc.
  event_data JSONB,

  -- Session tracking
  session_id TEXT NOT NULL,

  -- User tracking (if available)
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Meta
  user_agent TEXT,
  ip_address INET,
  referrer TEXT
);

-- Table for email nurture sequences
CREATE TABLE IF NOT EXISTS instagram_bio_email_sequences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

  -- Related capture
  email_capture_id UUID REFERENCES instagram_bio_email_captures(id) ON DELETE CASCADE,

  -- Email details
  sequence_number INTEGER NOT NULL, -- 1-7
  email_subject TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,

  -- Engagement
  opened BOOLEAN DEFAULT false,
  clicked BOOLEAN DEFAULT false,
  converted BOOLEAN DEFAULT false
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_bio_analyses_created_at ON instagram_bio_analyses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bio_analyses_market ON instagram_bio_analyses(market);
CREATE INDEX IF NOT EXISTS idx_bio_analyses_score ON instagram_bio_analyses(overall_score DESC);
CREATE INDEX IF NOT EXISTS idx_bio_analyses_session ON instagram_bio_analyses(session_id);

CREATE INDEX IF NOT EXISTS idx_email_captures_created_at ON instagram_bio_email_captures(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_captures_email ON instagram_bio_email_captures(email);
CREATE INDEX IF NOT EXISTS idx_email_captures_market ON instagram_bio_email_captures(market);
CREATE INDEX IF NOT EXISTS idx_email_captures_analysis ON instagram_bio_email_captures(analysis_id);

CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON instagram_bio_analytics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON instagram_bio_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_session ON instagram_bio_analytics(session_id);

CREATE INDEX IF NOT EXISTS idx_email_sequences_capture ON instagram_bio_email_sequences(email_capture_id);
CREATE INDEX IF NOT EXISTS idx_email_sequences_sent ON instagram_bio_email_sequences(sent_at);

-- Enable Row Level Security
ALTER TABLE instagram_bio_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE instagram_bio_email_captures ENABLE ROW LEVEL SECURITY;
ALTER TABLE instagram_bio_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE instagram_bio_email_sequences ENABLE ROW LEVEL SECURITY;

-- Policies (Allow public insert for lead capture)
DROP POLICY IF EXISTS "Allow public insert on analyses" ON instagram_bio_analyses;
CREATE POLICY "Allow public insert on analyses" ON instagram_bio_analyses
  FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public select on analyses" ON instagram_bio_analyses;
CREATE POLICY "Allow public select on analyses" ON instagram_bio_analyses
  FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Allow public insert on email captures" ON instagram_bio_email_captures;
CREATE POLICY "Allow public insert on email captures" ON instagram_bio_email_captures
  FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public insert on analytics" ON instagram_bio_analytics;
CREATE POLICY "Allow public insert on analytics" ON instagram_bio_analytics
  FOR INSERT TO anon WITH CHECK (true);

-- Admin policies
DROP POLICY IF EXISTS "Allow authenticated users full access to analyses" ON instagram_bio_analyses;
CREATE POLICY "Allow authenticated users full access to analyses" ON instagram_bio_analyses
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated users full access to email captures" ON instagram_bio_email_captures;
CREATE POLICY "Allow authenticated users full access to email captures" ON instagram_bio_email_captures
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated users full access to analytics" ON instagram_bio_analytics;
CREATE POLICY "Allow authenticated users full access to analytics" ON instagram_bio_analytics
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated users full access to email sequences" ON instagram_bio_email_sequences;
CREATE POLICY "Allow authenticated users full access to email sequences" ON instagram_bio_email_sequences
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for updated_at
CREATE TRIGGER update_bio_analyses_updated_at BEFORE UPDATE ON instagram_bio_analyses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- View for analytics dashboard
CREATE OR REPLACE VIEW instagram_bio_stats AS
SELECT
  COUNT(DISTINCT ia.id) as total_analyses,
  AVG(ia.overall_score)::numeric(10,2) as avg_score,
  COUNT(DISTINCT iec.id) as total_email_captures,
  (COUNT(DISTINCT iec.id)::float / NULLIF(COUNT(DISTINCT ia.id), 0) * 100)::numeric(10,2) as capture_rate,
  COUNT(DISTINCT CASE WHEN iec.converted_to_trial THEN iec.id END) as trial_conversions,
  COUNT(DISTINCT CASE WHEN iec.converted_to_paid THEN iec.id END) as paid_conversions,
  COUNT(DISTINCT ia.market) as unique_markets
FROM instagram_bio_analyses ia
LEFT JOIN instagram_bio_email_captures iec ON ia.id = iec.analysis_id;

COMMENT ON TABLE instagram_bio_analyses IS 'Stores Instagram bio analysis results';
COMMENT ON TABLE instagram_bio_email_captures IS 'Stores email captures from the bio analyzer tool';
COMMENT ON TABLE instagram_bio_analytics IS 'Tracks user events and analytics for the bio analyzer';
COMMENT ON TABLE instagram_bio_email_sequences IS 'Tracks email nurture sequence sends and engagement';
-- Triggers and functions for Instagram Bio Analyzer email automation

-- Function to initialize email sequence on capture
CREATE OR REPLACE FUNCTION initialize_bio_email_sequence()
RETURNS TRIGGER AS $$
BEGIN
  -- Create placeholder entries for all 7 emails in the sequence
  INSERT INTO instagram_bio_email_sequences (email_capture_id, sequence_number, email_subject, sent_at)
  VALUES
    (NEW.id, 1, 'Your 3 Optimized Instagram Bios + Action Plan Inside', NULL),
    (NEW.id, 2, 'The Instagram bio mistake 73% of agents make', NULL),
    (NEW.id, 3, 'Your Instagram profile as a 24/7 showing scheduler', NULL),
    (NEW.id, 4, NEW.first_name || ', here''s your 30-day Instagram content calendar', NULL),
    (NEW.id, 5, 'Real data: What converts Instagram followers to clients', NULL),
    (NEW.id, 6, 'Linktree vs AgentBio for real estate (honest comparison)', NULL),
    (NEW.id, 7, NEW.first_name || ', final call: 20% off + free setup (expires tonight)', NULL);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to initialize sequence on email capture
DROP TRIGGER IF EXISTS init_bio_email_sequence ON instagram_bio_email_captures;
DROP TRIGGER IF EXISTS init_bio_email_sequence ON instagram_bio_email_captures;
CREATE TRIGGER init_bio_email_sequence
  AFTER INSERT ON instagram_bio_email_captures
  FOR EACH ROW
  WHEN (NEW.email_sequence_started = true)
  EXECUTE FUNCTION initialize_bio_email_sequence();

-- Function to mark sequence complete when all emails sent
CREATE OR REPLACE FUNCTION check_bio_email_sequence_complete()
RETURNS TRIGGER AS $$
DECLARE
  total_emails INTEGER;
  sent_emails INTEGER;
BEGIN
  -- Count total and sent emails for this capture
  SELECT COUNT(*), COUNT(*) FILTER (WHERE sent_at IS NOT NULL)
  INTO total_emails, sent_emails
  FROM instagram_bio_email_sequences
  WHERE email_capture_id = NEW.email_capture_id;

  -- If all emails sent, mark sequence as complete
  IF sent_emails >= total_emails THEN
    UPDATE instagram_bio_email_captures
    SET email_sequence_completed = true
    WHERE id = NEW.email_capture_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to check sequence completion on email sent
DROP TRIGGER IF EXISTS check_bio_sequence_complete ON instagram_bio_email_sequences;
CREATE TRIGGER check_bio_sequence_complete
  AFTER UPDATE OF sent_at ON instagram_bio_email_sequences
  FOR EACH ROW
  WHEN (NEW.sent_at IS NOT NULL AND OLD.sent_at IS NULL)
  EXECUTE FUNCTION check_bio_email_sequence_complete();

-- View for email performance dashboard
CREATE OR REPLACE VIEW bio_email_performance AS
SELECT
  es.sequence_number,
  es.email_subject,
  COUNT(*) as total_sent,
  COUNT(*) FILTER (WHERE es.opened = true) as total_opened,
  COUNT(*) FILTER (WHERE es.clicked = true) as total_clicked,
  ROUND(AVG(CASE WHEN es.opened = true THEN 1 ELSE 0 END) * 100, 2) as open_rate,
  ROUND(AVG(CASE WHEN es.clicked = true THEN 1 ELSE 0 END) * 100, 2) as click_rate,
  COUNT(DISTINCT ec.id) FILTER (WHERE ec.converted_to_trial = true) as conversions_to_trial,
  COUNT(DISTINCT ec.id) FILTER (WHERE ec.converted_to_paid = true) as conversions_to_paid
FROM instagram_bio_email_sequences es
JOIN instagram_bio_email_captures ec ON ec.id = es.email_capture_id
WHERE es.sent_at IS NOT NULL
GROUP BY es.sequence_number, es.email_subject
ORDER BY es.sequence_number;

COMMENT ON VIEW bio_email_performance IS 'Performance metrics for bio analyzer email sequence';

-- View for conversion funnel analysis
CREATE OR REPLACE VIEW bio_analyzer_funnel AS
SELECT
  COUNT(DISTINCT ia.id) as total_analyses,
  COUNT(DISTINCT iec.id) as email_captures,
  COUNT(DISTINCT iec.id) FILTER (WHERE iec.email_sequence_started = true) as sequences_started,
  COUNT(DISTINCT iec.id) FILTER (WHERE iec.email_sequence_completed = true) as sequences_completed,
  COUNT(DISTINCT iec.id) FILTER (WHERE iec.converted_to_trial = true) as trial_signups,
  COUNT(DISTINCT iec.id) FILTER (WHERE iec.converted_to_paid = true) as paid_conversions,
  ROUND(COUNT(DISTINCT iec.id)::numeric / NULLIF(COUNT(DISTINCT ia.id), 0) * 100, 2) as capture_rate,
  ROUND(COUNT(DISTINCT iec.id) FILTER (WHERE iec.converted_to_trial = true)::numeric / NULLIF(COUNT(DISTINCT iec.id), 0) * 100, 2) as trial_conversion_rate,
  ROUND(COUNT(DISTINCT iec.id) FILTER (WHERE iec.converted_to_paid = true)::numeric / NULLIF(COUNT(DISTINCT iec.id), 0) * 100, 2) as paid_conversion_rate
FROM instagram_bio_analyses ia
LEFT JOIN instagram_bio_email_captures iec ON ia.id = iec.analysis_id
WHERE ia.created_at >= CURRENT_DATE - INTERVAL '30 days';

COMMENT ON VIEW bio_analyzer_funnel IS 'Conversion funnel metrics for the last 30 days';

-- Indexes for email delivery queries
CREATE INDEX IF NOT EXISTS idx_email_sequences_pending
  ON instagram_bio_email_sequences(email_capture_id, sequence_number)
  WHERE sent_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_email_captures_active_sequences
  ON instagram_bio_email_captures(created_at)
  WHERE email_sequence_started = true AND email_sequence_completed = false;

-- Grant permissions to service role
GRANT SELECT ON bio_email_performance TO service_role;
GRANT SELECT ON bio_analyzer_funnel TO service_role;

-- Function to get next emails to send (used by cron job)
CREATE OR REPLACE FUNCTION get_pending_bio_emails()
RETURNS TABLE (
  capture_id UUID,
  email TEXT,
  first_name TEXT,
  market TEXT,
  sequence_number INTEGER,
  days_since_capture INTEGER,
  overall_score INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ec.id as capture_id,
    ec.email,
    ec.first_name,
    ec.market,
    es.sequence_number,
    EXTRACT(DAY FROM NOW() - ec.created_at)::INTEGER as days_since_capture,
    ia.overall_score
  FROM instagram_bio_email_captures ec
  JOIN instagram_bio_email_sequences es ON es.email_capture_id = ec.id
  LEFT JOIN instagram_bio_analyses ia ON ia.id = ec.analysis_id
  WHERE
    ec.email_sequence_started = true
    AND ec.email_sequence_completed = false
    AND es.sent_at IS NULL
    AND ec.created_at >= CURRENT_DATE - INTERVAL '14 days'
  ORDER BY ec.created_at ASC, es.sequence_number ASC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_pending_bio_emails IS 'Returns emails that need to be sent based on schedule';
-- Listing Description Generator Tables
-- Tables for storing property descriptions, email captures, and analytics

-- Table for storing generated listing descriptions
CREATE TABLE IF NOT EXISTS listing_descriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

  -- Property details (JSONB for flexibility)
  property_details JSONB NOT NULL,

  -- Generated descriptions (JSONB array of 3 styles)
  descriptions JSONB NOT NULL,

  -- Tracking
  session_id TEXT,
  user_agent TEXT,
  ip_address INET,

  -- User association (if logged in)
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Table for email captures
CREATE TABLE IF NOT EXISTS listing_email_captures (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

  -- Related listing description
  listing_id UUID REFERENCES listing_descriptions(id) ON DELETE SET NULL,

  -- Contact info
  email TEXT NOT NULL,
  first_name TEXT NOT NULL,
  brokerage_name TEXT,
  phone_number TEXT,

  -- Email sequence tracking
  email_sequence_started BOOLEAN DEFAULT false,
  email_sequence_completed BOOLEAN DEFAULT false,
  last_email_sent_at TIMESTAMP WITH TIME ZONE,

  -- Conversion tracking
  converted_to_trial BOOLEAN DEFAULT false,
  converted_to_paid BOOLEAN DEFAULT false,
  converted_at TIMESTAMP WITH TIME ZONE,

  -- Referral tracking
  referral_code TEXT,
  referrals_count INTEGER DEFAULT 0
);

-- Table for analytics events
CREATE TABLE IF NOT EXISTS listing_generator_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

  -- Event details
  event_type TEXT NOT NULL, -- 'generator_started', 'generator_completed', 'email_captured', 'description_copied', etc.
  event_data JSONB,

  -- Session tracking
  session_id TEXT NOT NULL,

  -- User tracking (if available)
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Meta
  user_agent TEXT,
  ip_address INET,
  referrer TEXT
);

-- Table for email nurture sequences
CREATE TABLE IF NOT EXISTS listing_email_sequences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

  -- Related capture
  email_capture_id UUID REFERENCES listing_email_captures(id) ON DELETE CASCADE,

  -- Email details
  sequence_number INTEGER NOT NULL, -- 1-7
  email_subject TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,

  -- Engagement
  opened BOOLEAN DEFAULT false,
  clicked BOOLEAN DEFAULT false,
  converted BOOLEAN DEFAULT false
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_listing_descriptions_created_at ON listing_descriptions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_listing_descriptions_session ON listing_descriptions(session_id);
CREATE INDEX IF NOT EXISTS idx_listing_descriptions_user ON listing_descriptions(user_id);

CREATE INDEX IF NOT EXISTS idx_listing_email_captures_created_at ON listing_email_captures(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_listing_email_captures_email ON listing_email_captures(email);
CREATE INDEX IF NOT EXISTS idx_listing_email_captures_listing ON listing_email_captures(listing_id);

CREATE INDEX IF NOT EXISTS idx_listing_analytics_created_at ON listing_generator_analytics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_listing_analytics_event_type ON listing_generator_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_listing_analytics_session ON listing_generator_analytics(session_id);

CREATE INDEX IF NOT EXISTS idx_listing_email_sequences_capture ON listing_email_sequences(email_capture_id);
CREATE INDEX IF NOT EXISTS idx_listing_email_sequences_sent ON listing_email_sequences(sent_at);

-- Enable Row Level Security
ALTER TABLE listing_descriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_email_captures ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_generator_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_email_sequences ENABLE ROW LEVEL SECURITY;

-- Policies (Allow public insert for lead capture)
DROP POLICY IF EXISTS "Allow public insert on listing descriptions" ON listing_descriptions;
CREATE POLICY "Allow public insert on listing descriptions" ON listing_descriptions
  FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public select on listing descriptions" ON listing_descriptions;
CREATE POLICY "Allow public select on listing descriptions" ON listing_descriptions
  FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Allow public insert on listing email captures" ON listing_email_captures;
CREATE POLICY "Allow public insert on listing email captures" ON listing_email_captures
  FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public insert on listing analytics" ON listing_generator_analytics;
CREATE POLICY "Allow public insert on listing analytics" ON listing_generator_analytics
  FOR INSERT TO anon WITH CHECK (true);

-- Admin policies
DROP POLICY IF EXISTS "Allow authenticated users full access to listing descriptions" ON listing_descriptions;
CREATE POLICY "Allow authenticated users full access to listing descriptions" ON listing_descriptions
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated users full access to listing email captures" ON listing_email_captures;
CREATE POLICY "Allow authenticated users full access to listing email captures" ON listing_email_captures
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated users full access to listing analytics" ON listing_generator_analytics;
CREATE POLICY "Allow authenticated users full access to listing analytics" ON listing_generator_analytics
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated users full access to listing email sequences" ON listing_email_sequences;
CREATE POLICY "Allow authenticated users full access to listing email sequences" ON listing_email_sequences
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Function to update updated_at timestamp
CREATE TRIGGER update_listing_descriptions_updated_at BEFORE UPDATE ON listing_descriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- View for analytics dashboard
CREATE OR REPLACE VIEW listing_generator_stats AS
SELECT
  COUNT(DISTINCT ld.id) as total_generations,
  COUNT(DISTINCT lec.id) as total_email_captures,
  (COUNT(DISTINCT lec.id)::float / NULLIF(COUNT(DISTINCT ld.id), 0) * 100)::numeric(10,2) as capture_rate,
  COUNT(DISTINCT CASE WHEN lec.converted_to_trial THEN lec.id END) as trial_conversions,
  COUNT(DISTINCT CASE WHEN lec.converted_to_paid THEN lec.id END) as paid_conversions,
  COUNT(DISTINCT (property_details->>'city')) as unique_markets
FROM listing_descriptions ld
LEFT JOIN listing_email_captures lec ON ld.id = lec.listing_id
WHERE ld.created_at >= CURRENT_DATE - INTERVAL '30 days';

-- View for property type distribution
CREATE OR REPLACE VIEW listing_property_types AS
SELECT
  property_details->>'propertyType' as property_type,
  COUNT(*) as count,
  ROUND(COUNT(*)::numeric / SUM(COUNT(*)) OVER () * 100, 2) as percentage
FROM listing_descriptions
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY property_details->>'propertyType'
ORDER BY count DESC;

-- View for popular features
CREATE OR REPLACE VIEW listing_popular_features AS
SELECT
  feature,
  COUNT(*) as count
FROM listing_descriptions,
LATERAL jsonb_array_elements_text(property_details->'selectedFeatures') as feature
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY feature
ORDER BY count DESC
LIMIT 20;

-- View for conversion funnel
CREATE OR REPLACE VIEW listing_generator_funnel AS
SELECT
  COUNT(DISTINCT ld.id) as total_generations,
  COUNT(DISTINCT lec.id) as email_captures,
  COUNT(DISTINCT lec.id) FILTER (WHERE lec.email_sequence_started = true) as sequences_started,
  COUNT(DISTINCT lec.id) FILTER (WHERE lec.email_sequence_completed = true) as sequences_completed,
  COUNT(DISTINCT lec.id) FILTER (WHERE lec.converted_to_trial = true) as trial_signups,
  COUNT(DISTINCT lec.id) FILTER (WHERE lec.converted_to_paid = true) as paid_conversions,
  ROUND(COUNT(DISTINCT lec.id)::numeric / NULLIF(COUNT(DISTINCT ld.id), 0) * 100, 2) as capture_rate,
  ROUND(COUNT(DISTINCT lec.id) FILTER (WHERE lec.converted_to_trial = true)::numeric / NULLIF(COUNT(DISTINCT lec.id), 0) * 100, 2) as trial_conversion_rate,
  ROUND(COUNT(DISTINCT lec.id) FILTER (WHERE lec.converted_to_paid = true)::numeric / NULLIF(COUNT(DISTINCT lec.id), 0) * 100, 2) as paid_conversion_rate
FROM listing_descriptions ld
LEFT JOIN listing_email_captures lec ON ld.id = lec.listing_id
WHERE ld.created_at >= CURRENT_DATE - INTERVAL '30 days';

COMMENT ON TABLE listing_descriptions IS 'Stores AI-generated listing descriptions';
COMMENT ON TABLE listing_email_captures IS 'Stores email captures from the listing generator tool';
COMMENT ON TABLE listing_generator_analytics IS 'Tracks user events and analytics for the listing generator';
COMMENT ON TABLE listing_email_sequences IS 'Tracks email nurture sequence sends and engagement';
COMMENT ON VIEW listing_generator_stats IS 'Summary statistics for the listing generator';
COMMENT ON VIEW listing_property_types IS 'Distribution of property types generated';
COMMENT ON VIEW listing_popular_features IS 'Most commonly selected property features';
COMMENT ON VIEW listing_generator_funnel IS 'Conversion funnel metrics';
-- Listing Description Generator Email Automation Triggers
-- Auto-creates email sequence entries and manages completion status

-- Function to initialize email sequence when email is captured
CREATE OR REPLACE FUNCTION init_listing_email_sequence()
RETURNS TRIGGER AS $$
BEGIN
  -- Create 7 email sequence entries
  INSERT INTO listing_email_sequences (email_capture_id, sequence_number, email_subject)
  VALUES
    (NEW.id, 1, 'The listing description mistake that costs agents thousands'),
    (NEW.id, 2, 'Power words that make buyers take action'),
    (NEW.id, 3, 'How to choose the right description style for your listing'),
    (NEW.id, 5, 'Real data: What sells homes faster in 2025'),
    (NEW.id, 6, 'Your listing checklist: Beyond the description'),
    (NEW.id, 7, '20% off AgentBio (expires tonight) + Free listing templates');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-create sequence on email capture
DROP TRIGGER IF EXISTS trigger_init_listing_email_sequence ON listing_email_captures;
DROP TRIGGER IF EXISTS trigger_init_listing_email_sequence ON listing_email_captures;
CREATE TRIGGER trigger_init_listing_email_sequence
  AFTER INSERT ON listing_email_captures
  FOR EACH ROW
  EXECUTE FUNCTION init_listing_email_sequence();

-- Function to check if email sequence is complete
CREATE OR REPLACE FUNCTION check_listing_sequence_complete()
RETURNS TRIGGER AS $$
DECLARE
  total_emails INTEGER;
  sent_emails INTEGER;
BEGIN
  -- Count total and sent emails for this capture
  SELECT COUNT(*), COUNT(*) FILTER (WHERE sent_at IS NOT NULL)
  INTO total_emails, sent_emails
  FROM listing_email_sequences
  WHERE email_capture_id = NEW.email_capture_id;

  -- If all emails sent, mark sequence complete
  IF total_emails = sent_emails THEN
    UPDATE listing_email_captures
    SET email_sequence_completed = true
    WHERE id = NEW.email_capture_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to check completion after each email sent
DROP TRIGGER IF EXISTS trigger_check_listing_sequence_complete ON listing_email_sequences;
CREATE TRIGGER trigger_check_listing_sequence_complete
  AFTER UPDATE OF sent_at ON listing_email_sequences
  FOR EACH ROW
  WHEN (NEW.sent_at IS NOT NULL AND OLD.sent_at IS NULL)
  EXECUTE FUNCTION check_listing_sequence_complete();

-- Function to get pending emails (for cron job)
CREATE OR REPLACE FUNCTION get_pending_listing_emails()
RETURNS TABLE (
  id UUID,
  email TEXT,
  first_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  days_since_capture INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    lec.id,
    lec.email,
    lec.first_name,
    lec.created_at,
    EXTRACT(DAY FROM (NOW() - lec.created_at))::INTEGER as days_since_capture
  FROM listing_email_captures lec
  WHERE
    -- Sequence started but not completed
    lec.email_sequence_started = true
    AND lec.email_sequence_completed = false
    -- At least 1 day since capture
    AND lec.created_at < NOW() - INTERVAL '1 day'
    -- Check if there's a pending email for today
    AND EXISTS (
      SELECT 1
      FROM listing_email_sequences les
      WHERE les.email_capture_id = lec.id
      AND les.sent_at IS NULL
      -- Check schedule: email 1 = day 2, email 2 = day 3, etc.
      AND (
        (les.sequence_number = 1 AND EXTRACT(DAY FROM (NOW() - lec.created_at))::INTEGER >= 1) OR
        (les.sequence_number = 2 AND EXTRACT(DAY FROM (NOW() - lec.created_at))::INTEGER >= 2) OR
        (les.sequence_number = 3 AND EXTRACT(DAY FROM (NOW() - lec.created_at))::INTEGER >= 3) OR
        (les.sequence_number = 5 AND EXTRACT(DAY FROM (NOW() - lec.created_at))::INTEGER >= 5) OR
        (les.sequence_number = 6 AND EXTRACT(DAY FROM (NOW() - lec.created_at))::INTEGER >= 6) OR
        (les.sequence_number = 7 AND EXTRACT(DAY FROM (NOW() - lec.created_at))::INTEGER >= 7)
      )
    )
  ORDER BY lec.created_at ASC;
END;
$$ LANGUAGE plpgsql;

-- View for email performance metrics
CREATE OR REPLACE VIEW listing_email_performance AS
SELECT
  les.sequence_number,
  les.email_subject,
  COUNT(*) as total_sent,
  COUNT(*) FILTER (WHERE les.opened = true) as opens,
  COUNT(*) FILTER (WHERE les.clicked = true) as clicks,
  COUNT(*) FILTER (WHERE les.converted = true) as conversions,
  ROUND(COUNT(*) FILTER (WHERE les.opened = true)::numeric / NULLIF(COUNT(*), 0) * 100, 2) as open_rate,
  ROUND(COUNT(*) FILTER (WHERE les.clicked = true)::numeric / NULLIF(COUNT(*), 0) * 100, 2) as click_rate,
  ROUND(COUNT(*) FILTER (WHERE les.converted = true)::numeric / NULLIF(COUNT(*), 0) * 100, 2) as conversion_rate
FROM listing_email_sequences les
WHERE les.sent_at IS NOT NULL
GROUP BY les.sequence_number, les.email_subject
ORDER BY les.sequence_number;

-- View for listing generator funnel (already in main migration, but adding here for completeness)
CREATE OR REPLACE VIEW listing_generator_funnel AS
SELECT
  COUNT(DISTINCT ld.id) as total_generations,
  COUNT(DISTINCT lec.id) as email_captures,
  COUNT(DISTINCT lec.id) FILTER (WHERE lec.email_sequence_started = true) as sequences_started,
  COUNT(DISTINCT lec.id) FILTER (WHERE lec.email_sequence_completed = true) as sequences_completed,
  COUNT(DISTINCT lec.id) FILTER (WHERE lec.converted_to_trial = true) as trial_signups,
  COUNT(DISTINCT lec.id) FILTER (WHERE lec.converted_to_paid = true) as paid_conversions,
  ROUND(COUNT(DISTINCT lec.id)::numeric / NULLIF(COUNT(DISTINCT ld.id), 0) * 100, 2) as capture_rate,
  ROUND(COUNT(DISTINCT lec.id) FILTER (WHERE lec.converted_to_trial = true)::numeric / NULLIF(COUNT(DISTINCT lec.id), 0) * 100, 2) as trial_conversion_rate,
  ROUND(COUNT(DISTINCT lec.id) FILTER (WHERE lec.converted_to_paid = true)::numeric / NULLIF(COUNT(DISTINCT lec.id), 0) * 100, 2) as paid_conversion_rate
FROM listing_descriptions ld
LEFT JOIN listing_email_captures lec ON ld.id = lec.listing_id
WHERE ld.created_at >= CURRENT_DATE - INTERVAL '30 days';

COMMENT ON FUNCTION init_listing_email_sequence() IS 'Auto-creates 7 email sequence entries when email is captured';
COMMENT ON FUNCTION check_listing_sequence_complete() IS 'Marks sequence complete when all emails are sent';
COMMENT ON FUNCTION get_pending_listing_emails() IS 'Returns emails that need to be sent today (used by cron job)';
COMMENT ON VIEW listing_email_performance IS 'Email engagement metrics by sequence number';
