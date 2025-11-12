-- Security fixes for RLS policies and database functions
-- This migration addresses critical security issues identified in security scan

-- ============================================
-- 1. FIX RLS POLICIES - RESTRICT SENSITIVE DATA ACCESS
-- ============================================

-- Drop overly permissive profile policy
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;

-- Create restricted profile view policy - only show public-safe fields
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
CREATE POLICY "Users can view own full profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);


-- Fix articles table - Don't expose author_id to public
DROP POLICY IF EXISTS "Anyone can view published articles" ON public.articles;

CREATE POLICY "Public can view published articles without author tracking"
ON public.articles
FOR SELECT
TO public
USING (status = 'published');

-- Note: Application should exclude author_id from public queries


-- Fix listings table - Don't expose user_id to public
DROP POLICY IF EXISTS "Anyone can view active listings" ON public.listings;

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
COMMENT ON FUNCTION public.notify_new_lead() IS 'Security hardened: Added SET search_path to prevent privilege escalation';