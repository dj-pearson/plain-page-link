-- US-235: listing photos can carry alt text.
--
-- listings.photos held bare URL strings, so an agent had nowhere to describe a
-- photo and every renderer used the street address as the alt of every image.
-- An element may now also be {"url": "...", "alt": "..."}. The app reads both
-- shapes through normalizePhotos (src/lib/listingPhotos.ts) and writes a photo
-- with no alt as a bare string, so older readers keep seeing a URL list.
--
-- The check guards the shape, not the content. It is NOT VALID so no existing
-- row is re-checked, and it admits a top-level JSON string because sample data
-- once stored the list that way (see toStringList in src/types/profile.ts); a
-- constraint that rejected those rows would fail every unrelated UPDATE to them.

CREATE OR REPLACE FUNCTION public.listing_photos_valid(p jsonb)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path = public, extensions, pg_temp
AS $$
  SELECT p IS NULL
    OR jsonb_typeof(p) IN ('null', 'string')
    OR (
      jsonb_typeof(p) = 'array'
      AND NOT EXISTS (
        SELECT 1
        FROM jsonb_array_elements(p) AS e
        -- COALESCE: a missing "url" makes jsonb_typeof NULL, and a NULL here
        -- would drop the row from EXISTS and pass {"alt": "x"}.
        WHERE NOT COALESCE(
          jsonb_typeof(e) = 'string'
          OR (
            jsonb_typeof(e) = 'object'
            AND jsonb_typeof(e -> 'url') = 'string'
            AND (NOT e ? 'alt' OR jsonb_typeof(e -> 'alt') = 'string')
          ),
          false
        )
      )
    );
$$;

ALTER TABLE public.listings DROP CONSTRAINT IF EXISTS listings_photos_shape;
ALTER TABLE public.listings
  ADD CONSTRAINT listings_photos_shape CHECK (public.listing_photos_valid(photos)) NOT VALID;

COMMENT ON COLUMN public.listings.photos IS
  'Gallery, in order; photos[0] is the cover and mirrors image. Each element is a URL string or {"url", "alt"} (US-235). Read with normalizePhotos.';
