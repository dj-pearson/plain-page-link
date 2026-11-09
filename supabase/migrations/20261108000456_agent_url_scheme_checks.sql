-- US-456 (US-289): the database refuses a javascript: (or any non-web) URL in
-- the columns an agent writes that end up as a link on their public page.
--
-- US-268 made the browser check schemes before rendering (sanitizeUrl /
-- sanitizeExternalUrl in src/utils/sanitize.ts). But the anon key ships in the
-- bundle and RLS lets an agent write their own rows directly, so any API
-- caller, CSV import or future client could still store javascript:alert(1)
-- in links.url, a profile's social/website/Calendly column or a listing's
-- virtual tour — and every renderer, present and future, then has to remember
-- to refuse it. The rule now lives with the data:
--
--   links.url             http(s)://host, mailto:, tel:, a same-site path
--                         ("/listings", never "//host" or "/\host") or a
--                         same-page fragment ("#contact") — exactly what
--                         sanitizeUrl keeps, which is what CustomLinks renders.
--                         The sample-data links use same-site paths.
--   profiles.*_url,       http(s)://host only (sanitizeExternalUrl), or NULL,
--   calendly_url,         or '' (the dashboard Profile form saves '' for an
--   listings.             empty field).
--     virtual_tour_url
--
-- A BEFORE trigger first normalises the value the way sanitizeUrl does, so
-- what agents actually type keeps working: surrounding whitespace and control
-- characters and embedded tabs/newlines are removed (the browser's URL parser
-- removes them too, which is how "java\tscript:" used to slip past a prefix
-- test), and a bare host ("zillow.com/me", "instagram.com/agent") gets
-- https:// in front. Anything still non-conforming is refused with
-- check_violation on a constraint named <table>_<column>_scheme, which
-- src/lib/urlSchemeErrors.ts turns into a message for the agent.
--
-- Existing rows are cleaned before the constraints are validated, because a
-- NOT VALID constraint is still checked on every UPDATE of the row — one bad
-- instagram_url would otherwise make every later profile save fail:
--   * values that normalise to a conforming URL are rewritten to it;
--   * profile/listing values that still do not conform become NULL. The
--     renderers already dropped them (sanitizeExternalUrl returns ''), so no
--     visitor saw them and nothing on any page changes;
--   * links.url is NOT NULL, so a non-conforming link becomes url '#' and is
--     switched off (is_active = false). CustomLinks already hid it.
--
-- The functions are IMMUTABLE SECURITY INVOKER helpers with no table access,
-- so the DEFINER_CALLABLE rule does not apply; the trigger functions are
-- SECURITY INVOKER too.

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.normalize_agent_url(p_url text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public, extensions, pg_temp
AS $function$
DECLARE
  v text;
BEGIN
  IF p_url IS NULL THEN
    RETURN NULL;
  END IF;
  -- Leading/trailing C0 controls and spaces, then tabs and newlines anywhere:
  -- what the WHATWG URL parser strips before it reads the scheme.
  v := regexp_replace(p_url, '^[\x01-\x20]+|[\x01-\x20]+$', '', 'g');
  v := regexp_replace(v, '[\t\n\r]', '', 'g');
  -- A bare host (BARE_HOST in src/utils/sanitize.ts) becomes https://host.
  -- It wins over an apparent scheme, as in sanitizeUrl: "example.com:8080/x".
  IF v ~* '^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*\.[a-z]{2,}(:[0-9]{1,5})?([/?#]|$)' THEN
    v := 'https://' || v;
  END IF;
  RETURN v;
END;
$function$;

COMMENT ON FUNCTION public.normalize_agent_url(text) IS
  'US-456: trims controls/whitespace, drops embedded tabs/newlines and prefixes https:// on a bare host, mirroring sanitizeUrl. Used by the agent-URL BEFORE triggers.';

-- http(s) with a host. NULL and '' mean "no URL" and are allowed.
CREATE OR REPLACE FUNCTION public.is_external_agent_url(p_url text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path = public, extensions, pg_temp
AS $function$
  SELECT p_url IS NULL
      OR p_url = ''
      OR p_url ~* '^https?://[^/\\?#[:space:]]';
$function$;

COMMENT ON FUNCTION public.is_external_agent_url(text) IS
  'US-456: true for NULL, '''' or an http(s) URL with a host (sanitizeExternalUrl). CHECK on profile social/website/calendly URLs and listings.virtual_tour_url.';

-- What sanitizeUrl keeps: http(s) with a host, mailto:, tel:, a same-site path
-- that is not protocol-relative, or a same-page fragment.
CREATE OR REPLACE FUNCTION public.is_link_agent_url(p_url text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path = public, extensions, pg_temp
AS $function$
  SELECT p_url IS NOT NULL
     AND p_url ~* '^(https?://[^/\\?#[:space:]]|mailto:.|tel:.|#|/$|/[^/\\])';
$function$;

COMMENT ON FUNCTION public.is_link_agent_url(text) IS
  'US-456: true for an http(s) URL with a host, mailto:, tel:, a same-site path or a #fragment (sanitizeUrl). CHECK on links.url.';

-- ---------------------------------------------------------------------------
-- Normalising trigger
-- ---------------------------------------------------------------------------

-- One trigger function per table: verify:schema checks that a trigger
-- function names only columns of the table it is attached to.

CREATE OR REPLACE FUNCTION public.normalize_link_url()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, extensions, pg_temp
AS $function$
BEGIN
  NEW.url := public.normalize_agent_url(NEW.url);
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.normalize_listing_urls()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, extensions, pg_temp
AS $function$
BEGIN
  NEW.virtual_tour_url := public.normalize_agent_url(NEW.virtual_tour_url);
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.normalize_profile_urls()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, extensions, pg_temp
AS $function$
BEGIN
  NEW.website_url     := public.normalize_agent_url(NEW.website_url);
  NEW.instagram_url   := public.normalize_agent_url(NEW.instagram_url);
  NEW.facebook_url    := public.normalize_agent_url(NEW.facebook_url);
  NEW.linkedin_url    := public.normalize_agent_url(NEW.linkedin_url);
  NEW.tiktok_url      := public.normalize_agent_url(NEW.tiktok_url);
  NEW.youtube_url     := public.normalize_agent_url(NEW.youtube_url);
  NEW.zillow_url      := public.normalize_agent_url(NEW.zillow_url);
  NEW.realtor_com_url := public.normalize_agent_url(NEW.realtor_com_url);
  NEW.calendly_url    := public.normalize_agent_url(NEW.calendly_url);
  RETURN NEW;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.normalize_link_url() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.normalize_listing_urls() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.normalize_profile_urls() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS normalize_agent_urls ON public.links;
CREATE TRIGGER normalize_agent_urls
  BEFORE INSERT OR UPDATE OF url ON public.links
  FOR EACH ROW EXECUTE FUNCTION public.normalize_link_url();

DROP TRIGGER IF EXISTS normalize_agent_urls ON public.listings;
CREATE TRIGGER normalize_agent_urls
  BEFORE INSERT OR UPDATE OF virtual_tour_url ON public.listings
  FOR EACH ROW EXECUTE FUNCTION public.normalize_listing_urls();

DROP TRIGGER IF EXISTS normalize_agent_urls ON public.profiles;
CREATE TRIGGER normalize_agent_urls
  BEFORE INSERT OR UPDATE OF website_url, instagram_url, facebook_url, linkedin_url,
    tiktok_url, youtube_url, zillow_url, realtor_com_url, calendly_url
  ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.normalize_profile_urls();

-- ---------------------------------------------------------------------------
-- Clean existing rows
-- ---------------------------------------------------------------------------

CREATE FUNCTION pg_temp.clean_external_url(p_url text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $function$
  SELECT CASE
    WHEN public.is_external_agent_url(public.normalize_agent_url(p_url))
      THEN public.normalize_agent_url(p_url)
    ELSE NULL
  END;
$function$;

UPDATE public.profiles SET
  website_url     = pg_temp.clean_external_url(website_url),
  instagram_url   = pg_temp.clean_external_url(instagram_url),
  facebook_url    = pg_temp.clean_external_url(facebook_url),
  linkedin_url    = pg_temp.clean_external_url(linkedin_url),
  tiktok_url      = pg_temp.clean_external_url(tiktok_url),
  youtube_url     = pg_temp.clean_external_url(youtube_url),
  zillow_url      = pg_temp.clean_external_url(zillow_url),
  realtor_com_url = pg_temp.clean_external_url(realtor_com_url),
  calendly_url    = pg_temp.clean_external_url(calendly_url)
WHERE website_url     IS DISTINCT FROM pg_temp.clean_external_url(website_url)
   OR instagram_url   IS DISTINCT FROM pg_temp.clean_external_url(instagram_url)
   OR facebook_url    IS DISTINCT FROM pg_temp.clean_external_url(facebook_url)
   OR linkedin_url    IS DISTINCT FROM pg_temp.clean_external_url(linkedin_url)
   OR tiktok_url      IS DISTINCT FROM pg_temp.clean_external_url(tiktok_url)
   OR youtube_url     IS DISTINCT FROM pg_temp.clean_external_url(youtube_url)
   OR zillow_url      IS DISTINCT FROM pg_temp.clean_external_url(zillow_url)
   OR realtor_com_url IS DISTINCT FROM pg_temp.clean_external_url(realtor_com_url)
   OR calendly_url    IS DISTINCT FROM pg_temp.clean_external_url(calendly_url);

UPDATE public.listings
SET virtual_tour_url = pg_temp.clean_external_url(virtual_tour_url)
WHERE virtual_tour_url IS DISTINCT FROM pg_temp.clean_external_url(virtual_tour_url);

-- Links whose URL normalises to something valid: rewrite it (the trigger
-- normalises on UPDATE OF url).
UPDATE public.links
SET url = url
WHERE url IS DISTINCT FROM public.normalize_agent_url(url)
  AND public.is_link_agent_url(public.normalize_agent_url(url));

-- Links that can never be valid: already hidden by CustomLinks; switch off.
UPDATE public.links
SET url = '#', is_active = false
WHERE NOT public.is_link_agent_url(public.normalize_agent_url(url));

DROP FUNCTION pg_temp.clean_external_url(text);

-- ---------------------------------------------------------------------------
-- Constraints: NOT VALID (brief lock), then VALIDATE (scan without blocking writes)
-- ---------------------------------------------------------------------------

ALTER TABLE public.links DROP CONSTRAINT IF EXISTS links_url_scheme;
ALTER TABLE public.links ADD CONSTRAINT links_url_scheme
  CHECK (public.is_link_agent_url(url)) NOT VALID;

ALTER TABLE public.listings DROP CONSTRAINT IF EXISTS listings_virtual_tour_url_scheme;
ALTER TABLE public.listings ADD CONSTRAINT listings_virtual_tour_url_scheme
  CHECK (public.is_external_agent_url(virtual_tour_url)) NOT VALID;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_website_url_scheme,
  DROP CONSTRAINT IF EXISTS profiles_instagram_url_scheme,
  DROP CONSTRAINT IF EXISTS profiles_facebook_url_scheme,
  DROP CONSTRAINT IF EXISTS profiles_linkedin_url_scheme,
  DROP CONSTRAINT IF EXISTS profiles_tiktok_url_scheme,
  DROP CONSTRAINT IF EXISTS profiles_youtube_url_scheme,
  DROP CONSTRAINT IF EXISTS profiles_zillow_url_scheme,
  DROP CONSTRAINT IF EXISTS profiles_realtor_com_url_scheme,
  DROP CONSTRAINT IF EXISTS profiles_calendly_url_scheme;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_website_url_scheme     CHECK (public.is_external_agent_url(website_url)) NOT VALID,
  ADD CONSTRAINT profiles_instagram_url_scheme   CHECK (public.is_external_agent_url(instagram_url)) NOT VALID,
  ADD CONSTRAINT profiles_facebook_url_scheme    CHECK (public.is_external_agent_url(facebook_url)) NOT VALID,
  ADD CONSTRAINT profiles_linkedin_url_scheme    CHECK (public.is_external_agent_url(linkedin_url)) NOT VALID,
  ADD CONSTRAINT profiles_tiktok_url_scheme      CHECK (public.is_external_agent_url(tiktok_url)) NOT VALID,
  ADD CONSTRAINT profiles_youtube_url_scheme     CHECK (public.is_external_agent_url(youtube_url)) NOT VALID,
  ADD CONSTRAINT profiles_zillow_url_scheme      CHECK (public.is_external_agent_url(zillow_url)) NOT VALID,
  ADD CONSTRAINT profiles_realtor_com_url_scheme CHECK (public.is_external_agent_url(realtor_com_url)) NOT VALID,
  ADD CONSTRAINT profiles_calendly_url_scheme    CHECK (public.is_external_agent_url(calendly_url)) NOT VALID;

ALTER TABLE public.links    VALIDATE CONSTRAINT links_url_scheme;
ALTER TABLE public.listings VALIDATE CONSTRAINT listings_virtual_tour_url_scheme;
ALTER TABLE public.profiles VALIDATE CONSTRAINT profiles_website_url_scheme;
ALTER TABLE public.profiles VALIDATE CONSTRAINT profiles_instagram_url_scheme;
ALTER TABLE public.profiles VALIDATE CONSTRAINT profiles_facebook_url_scheme;
ALTER TABLE public.profiles VALIDATE CONSTRAINT profiles_linkedin_url_scheme;
ALTER TABLE public.profiles VALIDATE CONSTRAINT profiles_tiktok_url_scheme;
ALTER TABLE public.profiles VALIDATE CONSTRAINT profiles_youtube_url_scheme;
ALTER TABLE public.profiles VALIDATE CONSTRAINT profiles_zillow_url_scheme;
ALTER TABLE public.profiles VALIDATE CONSTRAINT profiles_realtor_com_url_scheme;
ALTER TABLE public.profiles VALIDATE CONSTRAINT profiles_calendly_url_scheme;
