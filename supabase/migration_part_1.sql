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