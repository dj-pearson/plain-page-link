-- US-308 (US-302): unpublishing a page hides everything on it, not just the
-- profile row.
--
-- US-265 gave agents a "Page is live" switch, and profiles.is_published has
-- gated the profile row since 20260808000002 ("Published profiles are publicly
-- readable"). But the visitor policies on the rows that make up the page never
-- looked at it:
--
--   listings      "Public can view active listings without user tracking"
--   links         "Anyone can view active links"
--   testimonials  "Anyone can view published testimonials"
--
-- each checked only the row's own status / is_active / is_published and
-- is_sample (20260930000002). So an agent who unpublished — to take a page
-- down while changing brokerages, say — still had every listing address,
-- price and photo, every link and every review readable by anyone holding the
-- anon key (which ships in the bundle), one `?user_id=eq.<id>` away. The user
-- id is not secret either: it is in every lead, every analytics beacon and
-- every listing URL that was ever shared.
--
-- The visitor policies now also require the owning profile to be published.
-- The owner keeps every row through their own policies ("Users can view their
-- own listings", "Users can manage their own links", "Users can view their own
-- testimonials"), which RLS ORs with these, so the US-265 preview still works.
--
-- The predicate is an ordinary EXISTS against profiles, run as the caller. It
-- relies on what anon and authenticated can already see of profiles — the
-- published rows (policy) and the id / is_published columns (column grants,
-- 20260808000002 and 20261028000003) — so no new SECURITY DEFINER function is
-- needed. `is_published IS TRUE` matches the profile policy exactly: a NULL is
-- unpublished there, so it is unpublished here.
--
-- The three SECURITY DEFINER functions that serve a page's content to
-- visitors bypass RLS and so apply the same rule themselves:
--
--   list_public_open_houses / get_public_open_house tested
--   `is_published IS NOT FALSE`, which let a NULL through; they now require
--   IS TRUE, unless the caller is the agent (the preview, and the sign-in kiosk
--   an agent opens on their own device at the door).
--
--   public_agent_response_hours answered for any user id; it now returns NULL
--   for an unpublished agent, except to the agent.
--
-- The policies are also scoped TO anon, authenticated: they had no TO clause,
-- which Postgres reads as TO PUBLIC.

-- ---------------------------------------------------------------------------
-- Visitor policies
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public can view active listings without user tracking" ON public.listings;
CREATE POLICY "Public can view active listings without user tracking" ON public.listings
  FOR SELECT
  TO anon, authenticated
  USING (
    status = ANY (ARRAY['active'::text, 'pending'::text, 'under_contract'::text, 'sold'::text])
    AND NOT is_sample
    AND EXISTS (
      SELECT 1 FROM public.profiles p
       WHERE p.id = listings.user_id
         AND p.is_published IS TRUE
    )
  );

DROP POLICY IF EXISTS "Anyone can view active links" ON public.links;
CREATE POLICY "Anyone can view active links" ON public.links
  FOR SELECT
  TO anon, authenticated
  USING (
    is_active = true
    AND NOT is_sample
    AND EXISTS (
      SELECT 1 FROM public.profiles p
       WHERE p.id = links.user_id
         AND p.is_published IS TRUE
    )
  );

DROP POLICY IF EXISTS "Anyone can view published testimonials" ON public.testimonials;
CREATE POLICY "Anyone can view published testimonials" ON public.testimonials
  FOR SELECT
  TO anon, authenticated
  USING (
    is_published = true
    AND NOT is_sample
    AND EXISTS (
      SELECT 1 FROM public.profiles p
       WHERE p.id = testimonials.user_id
         AND p.is_published IS TRUE
    )
  );

COMMENT ON POLICY "Public can view active listings without user tracking" ON public.listings IS
  'US-308: visitors see an agent''s for-sale and sold listings only while the agent''s page is published; never sample rows.';
COMMENT ON POLICY "Anyone can view active links" ON public.links IS
  'US-308: visitors see active links only while the agent''s page is published; never sample rows.';
COMMENT ON POLICY "Anyone can view published testimonials" ON public.testimonials IS
  'US-308: visitors see approved reviews only while the agent''s page is published; never sample rows.';

-- ---------------------------------------------------------------------------
-- Open house RPCs (bodies otherwise unchanged from 20260923000001)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.list_public_open_houses(_user_id uuid)
RETURNS TABLE (
  id uuid,
  listing_id uuid,
  starts_at timestamptz,
  ends_at timestamptz,
  public_notes text,
  address text,
  city text,
  state text,
  zip_code text,
  price text,
  beds integer,
  baths integer,
  sqft integer,
  image text,
  photos jsonb
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $function$
  SELECT o.id, o.listing_id, o.starts_at, o.ends_at, o.public_notes,
         l.address, l.city, l.state, l.zip_code, l.price, l.beds, l.baths, l.sqft,
         l.image, l.photos
    FROM public.open_houses o
    JOIN public.listings l ON l.id = o.listing_id
    JOIN public.profiles p ON p.id = o.user_id
   WHERE o.user_id = _user_id
     AND o.is_public
     AND o.status = 'scheduled'
     AND o.ends_at > now()
     AND (p.is_published IS TRUE OR o.user_id = auth.uid())
     AND l.status IN ('active', 'pending', 'under_contract')
   ORDER BY o.starts_at
   LIMIT 20;
$function$;

CREATE OR REPLACE FUNCTION public.get_public_open_house(_open_house_id uuid)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  listing_id uuid,
  starts_at timestamptz,
  ends_at timestamptz,
  public_notes text,
  address text,
  city text,
  state text,
  zip_code text,
  price text,
  beds integer,
  baths integer,
  sqft integer,
  image text,
  photos jsonb,
  agent_username text,
  agent_full_name text,
  agent_avatar_url text,
  agent_title text,
  agent_brokerage_name text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $function$
  SELECT o.id, o.user_id, o.listing_id, o.starts_at, o.ends_at, o.public_notes,
         l.address, l.city, l.state, l.zip_code, l.price, l.beds, l.baths, l.sqft,
         l.image, l.photos,
         p.username, p.full_name, p.avatar_url, p.title, p.brokerage_name
    FROM public.open_houses o
    JOIN public.listings l ON l.id = o.listing_id
    JOIN public.profiles p ON p.id = o.user_id
   WHERE o.id = _open_house_id
     AND o.status = 'scheduled'
     AND o.ends_at > now() - interval '12 hours'
     AND (p.is_published IS TRUE OR o.user_id = auth.uid());
$function$;

-- CREATE OR REPLACE keeps existing grants; restated so this file stands alone.
REVOKE ALL ON FUNCTION public.list_public_open_houses(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_public_open_house(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_public_open_houses(uuid) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_public_open_house(uuid) TO anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Response time (body otherwise unchanged from 20260902000010)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.public_agent_response_hours(_user_id uuid)
RETURNS numeric
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
  SELECT CASE
    WHEN count(*) >= 5 THEN
      round(
        percentile_cont(0.5) WITHIN GROUP (
          ORDER BY EXTRACT(EPOCH FROM (first_responded_at - created_at)) / 3600.0
        )::numeric,
        1
      )
    ELSE NULL
  END
  FROM public.leads
  WHERE user_id = _user_id
    AND first_responded_at IS NOT NULL
    AND created_at IS NOT NULL
    AND first_responded_at >= created_at
    AND created_at >= now() - INTERVAL '90 days'
    AND EXISTS (
      SELECT 1 FROM public.profiles p
       WHERE p.id = _user_id
         AND (p.is_published IS TRUE OR p.id = auth.uid())
    );
$$;

REVOKE ALL ON FUNCTION public.public_agent_response_hours(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.public_agent_response_hours(uuid) TO anon, authenticated, service_role;
