-- US-514 (US-488): agents' custom CSS reaches their public page.
--
-- Owner decision 2026-11-08: agents can add custom CSS to /:username, scoped to
-- the profile and sanitised. profiles.custom_css has existed since 2025 but
-- nothing read it: it is a private column (US-073, US-235), so a visitor could
-- not select it, and get_public_profile_page did not return it.
--
-- 1. public_profile_custom_css(_user_id) — SECURITY DEFINER, anon-callable,
--    returns the stored CSS only when the page is published (or the caller is
--    its owner previewing it, US-265/US-308) AND the agent's plan has the
--    customThemes feature today. A downgraded agent's CSS stops applying
--    without anyone touching the row. The CSS is not a secret once rendered;
--    the column stays private so the published-and-entitled rule has one home.
--
-- 2. enforce_custom_css — BEFORE INSERT OR UPDATE OF custom_css:
--      * at most 10,000 characters, for every writer (matches
--        CUSTOM_CSS_MAX_LENGTH in src/lib/customCss.ts);
--      * the owner may set non-empty CSS only on a plan with customThemes
--        (DETAIL plan_feature:customThemes, like customDomain). Clearing it is
--        always allowed.
--
-- 3. get_public_profile_page gains 'customCss', so the page still loads in one
--    round trip. The body is otherwise unchanged from 20261107000329.
--
-- The stored text is untrusted. The browser never renders it as written:
-- sanitizeCustomCss (src/lib/customCss.ts) rebuilds it with every selector
-- prefixed by the profile container's class, drops @import / @font-face /
-- url() to other origins / expression() / escapes, and the container is
-- rendered with contain: paint, outside of which the compliance footer sits.

-- ---------------------------------------------------------------------------
-- 1. The visitor's read
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.public_profile_custom_css(_user_id uuid)
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = public, extensions, pg_temp
AS $function$
  SELECT p.custom_css
    FROM public.profiles p
   WHERE p.id = _user_id
     AND (p.is_published IS TRUE OR p.id = auth.uid())
     AND p.custom_css IS NOT NULL
     AND btrim(p.custom_css) <> ''
     AND COALESCE((public.resolve_user_plan(p.id) -> 'features' ->> 'customThemes')::boolean, false);
$function$;

COMMENT ON FUNCTION public.public_profile_custom_css(uuid) IS
  'US-514 (US-488): the agent''s custom CSS for their public page, only when the page is published (or the caller owns it) and the plan has customThemes. The browser sanitises and scopes it before rendering (src/lib/customCss.ts).';

REVOKE ALL ON FUNCTION public.public_profile_custom_css(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.public_profile_custom_css(uuid) TO anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 2. The write
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.enforce_custom_css()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, extensions, pg_temp
AS $function$
BEGIN
  IF NEW.custom_css IS NULL OR btrim(NEW.custom_css) = '' THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'UPDATE' AND NEW.custom_css IS NOT DISTINCT FROM OLD.custom_css THEN
    RETURN NEW;
  END IF;
  IF char_length(NEW.custom_css) > 10000 THEN
    RAISE EXCEPTION 'Custom CSS is limited to 10,000 characters.'
      USING ERRCODE = 'check_violation',
            DETAIL = 'custom_css_too_long';
  END IF;
  IF auth.uid() IS NOT NULL AND auth.uid() = NEW.id
     AND NOT COALESCE((public.resolve_user_plan(NEW.id) -> 'features' ->> 'customThemes')::boolean, false) THEN
    RAISE EXCEPTION 'Custom CSS is part of the paid plans. Upgrade to style your page with your own CSS.'
      USING ERRCODE = 'check_violation',
            DETAIL = 'plan_feature:customThemes',
            HINT = 'See /dashboard/subscription';
  END IF;
  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.enforce_custom_css() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.enforce_custom_css() TO service_role;

DROP TRIGGER IF EXISTS enforce_custom_css ON public.profiles;
CREATE TRIGGER enforce_custom_css
  BEFORE INSERT OR UPDATE OF custom_css ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.enforce_custom_css();

-- ---------------------------------------------------------------------------
-- 3. The page payload (20261107000329 plus 'customCss')
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_public_profile_page(_username text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public, extensions, pg_temp
AS $function$
DECLARE
  v_profile jsonb;
  v_id uuid;
  v_settings jsonb;
BEGIN
  -- Same columns and filter as usePublicProfile's table read. The caller
  -- passes the username already canonical (lower case, trimmed).
  SELECT to_jsonb(x) INTO v_profile
    FROM (
      SELECT p.id, p.username, p.full_name, p.bio, p.avatar_url, p.theme, p.title,
             p.brokerage_name, p.brokerage_logo, p.years_experience, p.certifications,
             p.specialties, p.service_cities, p.service_zip_codes, p.license_number,
             p.license_state, p.phone, p.sms_enabled, p.email_display, p.calendly_url,
             p.instagram_url, p.facebook_url, p.linkedin_url, p.tiktok_url, p.youtube_url,
             p.zillow_url, p.realtor_com_url, p.website_url, p.seo_title, p.seo_description,
             p.og_image, p.created_at, p.is_published
        FROM public.profiles p
       WHERE p.username = _username
         AND (p.is_published IS TRUE OR p.id = auth.uid())
       LIMIT 1
    ) x;

  IF v_profile IS NULL THEN
    RETURN NULL;
  END IF;

  v_id := (v_profile ->> 'id')::uuid;

  SELECT to_jsonb(s) INTO v_settings
    FROM (
      SELECT us.show_listings, us.show_sold_properties, us.show_testimonials,
             us.show_social_proof, us.show_contact_buttons
        FROM public.user_settings us
       WHERE us.user_id = v_id
       LIMIT 1
    ) s;

  RETURN jsonb_build_object(
    'profile', v_profile,

    -- The dashboard's order exactly (US-253).
    'listings', COALESCE((
      SELECT jsonb_agg(to_jsonb(l) ORDER BY l.sort_order ASC, l.created_at DESC, l.id ASC)
        FROM (
          SELECT li.id, li.image, li.photos, li.address, li.city, li.price, li.bedrooms,
                 li.bathrooms, li.square_feet, li.status, li.sort_order, li.is_featured,
                 li.days_on_market, li.description, li.property_type, li.state, li.zip_code,
                 li.mls_number, li.lot_size_acres, li.virtual_tour_url, li.highlights,
                 li.created_at
            FROM public.listings li
           WHERE li.user_id = v_id
             AND li.status IN ('active', 'pending', 'under_contract', 'sold')
        ) l
    ), '[]'::jsonb),

    'testimonials', COALESCE((
      SELECT jsonb_agg(to_jsonb(t) ORDER BY t.sort_order ASC)
        FROM (
          SELECT te.id, te.client_name, te.client_title, te.client_photo, te.review,
                 te.rating, te.sort_order, te.date, te.is_featured, te.transaction_type,
                 te.property_type, te.created_at, te.is_published
            FROM public.testimonials te
           WHERE te.user_id = v_id
             AND te.is_published = true
        ) t
    ), '[]'::jsonb),

    'links', COALESCE((
      SELECT jsonb_agg(to_jsonb(k) ORDER BY k.position ASC)
        FROM (
          SELECT lk.id, lk.title, lk.url, lk.icon, lk.position, lk.is_active
            FROM public.links lk
           WHERE lk.user_id = v_id
             AND lk.is_active = true
        ) k
    ), '[]'::jsonb),

    'settings', v_settings,

    'responseHours', public.public_agent_response_hours(v_id),

    'customPage', (
      SELECT to_jsonb(c)
        FROM (
          SELECT cp.id, cp.slug, cp.title, cp.blocks, cp.theme
            FROM public.custom_pages cp
           WHERE cp.user_id = v_id
             AND cp.is_active = true
             AND cp.published = true
           ORDER BY cp.updated_at DESC
           LIMIT 1
        ) c
    ),

    'showsBranding', public.profile_shows_branding(v_id),

    -- US-514: published-or-owner and plan-gated inside the helper.
    'customCss', public.public_profile_custom_css(v_id),

    'openHouses', CASE
      WHEN COALESCE((v_settings ->> 'show_listings')::boolean, true) THEN
        COALESCE((
          SELECT jsonb_agg(to_jsonb(o) ORDER BY o.starts_at)
            FROM public.list_public_open_houses(v_id) o
        ), '[]'::jsonb)
    END
  );
END;
$function$;

COMMENT ON FUNCTION public.get_public_profile_page(text) IS
  'US-329: the public profile page (profile, listings, reviews, links, settings, response time, custom page, branding, custom CSS (US-514), open houses) in one round trip. SECURITY INVOKER: RLS and column grants apply as for the table reads it replaces.';

REVOKE ALL ON FUNCTION public.get_public_profile_page(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_profile_page(text) TO anon, authenticated, service_role;
