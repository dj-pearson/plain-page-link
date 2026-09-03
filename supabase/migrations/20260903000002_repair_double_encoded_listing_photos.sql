-- =============================================================================
-- listings.photos: repair rows that hold a JSON string instead of a JSON array
-- =============================================================================
-- `photos` is jsonb, and jsonb stores whatever it is handed. sample-data-service
-- passed `JSON.stringify([...])`, so the column got the JSON *string*
-- '"[\"https://...\"]"' rather than the array. Nothing downstream could read it:
-- toStringList tests Array.isArray, a string fails, every seeded listing came
-- back with zero photos, and the dashboard and every public profile drew the
-- placeholder. Four such rows in production, all created 2026-01-30 by the
-- signup seeder that US-109 later removed; the admin SampleDataManager still
-- wrote them the same way until this change.
--
-- Per-row exception handling rather than one UPDATE with a cast: the inner text
-- is not guaranteed to parse, and one malformed value must not take the whole
-- migration down. Anything that does not parse to an array is left exactly as
-- it is and counted.
-- =============================================================================

DO $$
DECLARE
  r RECORD;
  parsed jsonb;
  repaired integer := 0;
  left_alone integer := 0;
BEGIN
  FOR r IN
    SELECT id, photos #>> '{}' AS inner_text
    FROM public.listings
    WHERE photos IS NOT NULL
      AND jsonb_typeof(photos) = 'string'
  LOOP
    BEGIN
      parsed := r.inner_text::jsonb;
    EXCEPTION
      WHEN others THEN
        left_alone := left_alone + 1;
        CONTINUE;
    END;

    IF jsonb_typeof(parsed) = 'array' THEN
      UPDATE public.listings SET photos = parsed WHERE id = r.id;
      repaired := repaired + 1;
    ELSE
      left_alone := left_alone + 1;
    END IF;
  END LOOP;

  RAISE NOTICE 'listings.photos: % row(s) repaired, % left as-is', repaired, left_alone;
END $$;

-- Stop it coming back. A jsonb column cannot express "array only" in its type,
-- so say it as a constraint: NULL and the '[]' default still pass, and an
-- insert carrying a stringified array now fails loudly at the writer instead of
-- silently emptying the gallery at the reader.
ALTER TABLE public.listings
  DROP CONSTRAINT IF EXISTS listings_photos_is_array;

ALTER TABLE public.listings
  ADD CONSTRAINT listings_photos_is_array
  CHECK (photos IS NULL OR jsonb_typeof(photos) = 'array')
  NOT VALID;

-- Deliberately left NOT VALID and never validated. A NOT VALID check still
-- applies to every insert and update from here on, which is the point; it just
-- does not scan the existing table. Validating would mean that a single row the
-- loop above could not parse - a jsonb string that is not an array at all -
-- aborts the migration in production for the sake of a row the reader already
-- degrades gracefully on.
