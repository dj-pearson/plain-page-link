-- US-329 (slice of US-286): the public profile page in one round trip.
--
-- /:username — the page in every agent's Instagram bio — needed two serial
-- round trips before it could render: the profiles row by username, then six
-- reads keyed on profile.id (listings, testimonials, links, user_settings,
-- public_agent_response_hours, custom_pages) plus profile_shows_branding and
-- list_public_open_houses. PostgREST embedding cannot merge them: the foreign
-- keys on those tables point at auth.users, not profiles. On a phone on a
-- cellular link a round trip is easily 150-300 ms, all of it before first
-- paint of the agent's content.
--
-- get_public_profile_page(_username) returns the same data as one jsonb value.
--
-- It is SECURITY INVOKER, so it runs as the visitor. Every read inside it is
-- subject to exactly the RLS policies and column grants the table reads it
-- replaces were subject to: anon sees the public profile columns only (and the
-- function names only those, so it raises rather than widening if a grant is
-- ever narrowed), published pages only (US-308), and never sample rows. The
-- owner's preview of an unpublished page (US-265) works through the owner's
-- own policies, as before. No privilege changes, so no DEFINER_CALLABLE entry.
-- The three SECURITY DEFINER helpers it calls are already anon-callable and
-- apply the published-or-owner rule themselves.
--
-- Open houses are included only when the agent shows listings: the page does
-- not render the section otherwise, and this used to be fetched regardless.
--
-- The frontend calls this first and falls back to the table reads when the
-- function is missing (PGRST202), so it can be deployed before this migration.

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
  'US-329: the public profile page (profile, listings, reviews, links, settings, response time, custom page, branding, open houses) in one round trip. SECURITY INVOKER: RLS and column grants apply as for the table reads it replaces.';

REVOKE ALL ON FUNCTION public.get_public_profile_page(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_profile_page(text) TO anon, authenticated, service_role;
