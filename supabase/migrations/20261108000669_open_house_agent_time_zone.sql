-- US-669 (US-639 slice 1): open-house times in the agent's zone for visitors.
--
-- The dashboard has shown and saved open-house times in the agent's zone
-- since US-628 (profiles.timezone, US-433). Visitors did not get that zone:
-- the public profile's open-house list and the /open-house/:id kiosk formatted
-- starts_at in the visitor's browser zone. Someone in Denver browsing a
-- Chicago listing read "Sat 12:00–2:00 PM" for a 1–3 PM open house, and a
-- kiosk tablet left on another zone showed the wrong window at the door.
--
-- Both visitor RPCs now also return the agent's IANA zone as time_zone (NULL
-- when the agent has not set one; the page then falls back to the visitor's
-- zone, as before). An agent's zone is coarse location already implied by
-- their service area and listings, and is no more private than the addresses
-- these functions already return. The body is otherwise unchanged from
-- 20261107000308: the same published-or-owner rule (US-308), the same
-- scheduled/ends_at filters and get_public_open_house's 12-hour window.
--
-- Adding an output column changes the return type, which CREATE OR REPLACE
-- cannot do, so both are dropped and recreated. get_public_profile_page
-- (plpgsql, 20261108000514) reads list_public_open_houses through
-- to_jsonb(o), so its openHouses entries gain time_zone with no change; a
-- plpgsql body holds no dependency, so the drop does not cascade into it.

DROP FUNCTION IF EXISTS public.list_public_open_houses(uuid);
DROP FUNCTION IF EXISTS public.get_public_open_house(uuid);

CREATE FUNCTION public.list_public_open_houses(_user_id uuid)
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
  photos jsonb,
  time_zone text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $function$
  SELECT o.id, o.listing_id, o.starts_at, o.ends_at, o.public_notes,
         l.address, l.city, l.state, l.zip_code, l.price, l.beds, l.baths, l.sqft,
         l.image, l.photos, p.timezone
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

CREATE FUNCTION public.get_public_open_house(_open_house_id uuid)
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
  agent_brokerage_name text,
  time_zone text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $function$
  SELECT o.id, o.user_id, o.listing_id, o.starts_at, o.ends_at, o.public_notes,
         l.address, l.city, l.state, l.zip_code, l.price, l.beds, l.baths, l.sqft,
         l.image, l.photos,
         p.username, p.full_name, p.avatar_url, p.title, p.brokerage_name,
         p.timezone
    FROM public.open_houses o
    JOIN public.listings l ON l.id = o.listing_id
    JOIN public.profiles p ON p.id = o.user_id
   WHERE o.id = _open_house_id
     AND o.status = 'scheduled'
     AND o.ends_at > now() - interval '12 hours'
     AND (p.is_published IS TRUE OR o.user_id = auth.uid());
$function$;

COMMENT ON FUNCTION public.list_public_open_houses(uuid) IS
  'Visitor read of an agent''s upcoming public open houses (no private_notes). Published-or-owner (US-308). time_zone is the agent''s IANA zone for formatting the times (US-669).';
COMMENT ON FUNCTION public.get_public_open_house(uuid) IS
  'Open-house kiosk read (no private_notes); scheduled, ended under 12 hours ago, published-or-owner (US-308). time_zone is the agent''s IANA zone for formatting the times (US-669).';

-- A new function gets Supabase's default EXECUTE grants; state them exactly.
REVOKE ALL ON FUNCTION public.list_public_open_houses(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_public_open_house(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.list_public_open_houses(uuid) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_public_open_house(uuid) TO anon, authenticated, service_role;
