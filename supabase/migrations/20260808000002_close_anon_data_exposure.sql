-- US-071, US-072, US-073: close the three ways an anonymous visitor reads data
-- they should never see.
--
-- All three share a shape: a boundary that looks restrictive but is not. A view
-- that appears to inherit its base table's RLS; a policy that reads as
-- domain-scoped; a policy named "limited" that is nothing of the sort. The anon
-- key ships in the frontend bundle, so "anon" here means anybody at all.

-- ===========================================================================
-- US-071 — twelve views bypass RLS
-- ===========================================================================
-- A view without security_invoker executes with the privileges of its OWNER
-- (postgres), so RLS on the base tables is not applied. Every one of these was
-- granted SELECT to anon. Verified before the fix: `subscriptions` returned 0
-- rows to anon while `user_subscription_details` returned the row complete with
-- stripe_customer_id and stripe_subscription_id; `lead_activities` returned 0
-- while `lead_activity_summary` returned per-lead call and email counts across
-- every tenant.
--
-- security_invoker was added in PostgreSQL 15; Supabase is on 15+.

ALTER VIEW public.bio_analyzer_funnel               SET (security_invoker = on);
ALTER VIEW public.bio_email_performance             SET (security_invoker = on);
ALTER VIEW public.instagram_bio_stats               SET (security_invoker = on);
ALTER VIEW public.lead_activity_summary             SET (security_invoker = on);
ALTER VIEW public.listing_email_performance         SET (security_invoker = on);
ALTER VIEW public.listing_generator_funnel          SET (security_invoker = on);
ALTER VIEW public.listing_generator_stats           SET (security_invoker = on);
ALTER VIEW public.listing_popular_features          SET (security_invoker = on);
ALTER VIEW public.listing_property_types            SET (security_invoker = on);
ALTER VIEW public.seo_content_optimization_summary  SET (security_invoker = on);
ALTER VIEW public.seo_semantic_analysis_summary     SET (security_invoker = on);
ALTER VIEW public.user_subscription_details         SET (security_invoker = on);

-- security_invoker alone is enough to make these safe, but a grant nothing uses
-- is a grant waiting to be misused. Of the twelve, exactly one has a caller in
-- the application: lead_activity_summary, read by src/hooks/useLeadActivities.ts
-- for the signed-in agent's own leads. The other eleven are read by nothing but
-- the generated types.
REVOKE SELECT ON public.bio_analyzer_funnel              FROM anon, authenticated;
REVOKE SELECT ON public.bio_email_performance            FROM anon, authenticated;
REVOKE SELECT ON public.instagram_bio_stats              FROM anon, authenticated;
REVOKE SELECT ON public.listing_email_performance        FROM anon, authenticated;
REVOKE SELECT ON public.listing_generator_funnel         FROM anon, authenticated;
REVOKE SELECT ON public.listing_generator_stats          FROM anon, authenticated;
REVOKE SELECT ON public.listing_popular_features         FROM anon, authenticated;
REVOKE SELECT ON public.listing_property_types           FROM anon, authenticated;
REVOKE SELECT ON public.seo_content_optimization_summary FROM anon, authenticated;
REVOKE SELECT ON public.seo_semantic_analysis_summary    FROM anon, authenticated;
REVOKE SELECT ON public.user_subscription_details        FROM anon, authenticated;

-- Keep the one real caller, now correctly scoped by the base table's RLS.
REVOKE SELECT ON public.lead_activity_summary FROM anon;

-- ===========================================================================
-- US-072 — enterprise_sso_config leaks its OIDC client secret
-- ===========================================================================
-- "Users can view active SSO configs for their domain" had no TO clause, so
-- Postgres defaulted it to TO PUBLIC. The table holds oidc_client_secret and
-- saml_certificate. verify:schema's over-permissive check did not catch it
-- because the qualifier is `active = true` rather than a literal `true`.
--
-- OPERATIONAL: any client secret that has been live under this policy must be
-- treated as disclosed and rotated at the identity provider.

DROP POLICY IF EXISTS "Users can view active SSO configs for their domain"
  ON public.enterprise_sso_config;

-- Nothing needs an anonymous read of this table. The two discovery paths both
-- run privileged already: sso-initiate builds a SERVICE_ROLE client, and the
-- database side has public.find_sso_config_by_email(text), a SECURITY DEFINER
-- function that returns only the config id. Adding another discovery primitive
-- here would be redundant surface, so the policy is simply dropped. The
-- remaining "Admins can manage SSO configs" policy covers useSSO.ts, whose
-- queries are already gated on isAdmin.

-- ===========================================================================
-- US-073 — the public profiles policy publishes secrets
-- ===========================================================================
-- "Public can view limited profile info" USING (is_published = true) filters
-- ROWS, not columns, so the whole row was public: zapier_webhook_url (a bearer
-- secret — anyone holding it can inject fabricated records into the agent's
-- automations), phone, license_number, custom_domain, custom_css and the
-- denormalised counters.
--
-- The column set below matches the public shape src/types/profile.ts already
-- models; the database simply never enforced it.

-- The column set below is exactly PublicProfileFields from src/types/profile.ts,
-- which already models the public shape — the database simply never enforced
-- it. phone and license_number ARE in that set and stay public: an agent's
-- business phone drives the tel: contact buttons, and a licence number is
-- commonly required to be displayed. What leaves is zapier_webhook_url (a
-- bearer secret), custom_domain, custom_css, notification_preferences,
-- onboarding_completed_at, updated_at and the denormalised counters.
CREATE OR REPLACE VIEW public.public_profiles
WITH (security_invoker = on) AS
  SELECT
    p.id,
    p.username,
    p.full_name,
    p.bio,
    p.avatar_url,
    p.theme,
    p.title,
    p.brokerage_name,
    p.brokerage_logo,
    p.years_experience,
    p.certifications,
    p.specialties,
    p.service_cities,
    p.service_zip_codes,
    p.license_number,
    p.license_state,
    p.phone,
    p.sms_enabled,
    p.email_display,
    p.calendly_url,
    p.instagram_url,
    p.facebook_url,
    p.linkedin_url,
    p.tiktok_url,
    p.youtube_url,
    p.zillow_url,
    p.realtor_com_url,
    p.website_url,
    p.seo_title,
    p.seo_description,
    p.og_image,
    p.created_at,
    p.is_published
  FROM public.profiles p
  WHERE p.is_published = true;

COMMENT ON VIEW public.public_profiles IS
  'US-073: mirrors PublicProfileFields in src/types/profile.ts. Omits zapier_webhook_url, custom_domain, custom_css, notification_preferences and the denormalised counters.';

GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- The row policy stays (security_invoker means the view is subject to it), but
-- RLS cannot restrict COLUMNS, so a direct `select=*` on profiles would still
-- have returned everything. Column-level privileges are the mechanism that can.
DROP POLICY IF EXISTS "Public can view limited profile info" ON public.profiles;

CREATE POLICY "Published profiles are publicly readable"
  ON public.profiles FOR SELECT
  TO anon, authenticated
  USING (is_published = true);

REVOKE SELECT ON public.profiles FROM anon;
GRANT SELECT (
  id, username, full_name, bio, avatar_url, theme, title,
  brokerage_name, brokerage_logo, years_experience, certifications, specialties,
  service_cities, service_zip_codes, license_number, license_state, phone,
  sms_enabled, email_display, calendly_url, instagram_url, facebook_url,
  linkedin_url, tiktok_url, youtube_url, zillow_url, realtor_com_url,
  website_url, seo_title, seo_description, og_image, created_at, is_published
) ON public.profiles TO anon;
