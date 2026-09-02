-- US-106: finish the beds/bedrooms reconciliation instead of writing both.
--
-- `listings` carries two names for each dimension: beds/bedrooms,
-- baths/bathrooms, sqft/square_feet. Create wrote both pairs; edit wrote only
-- beds/baths/sqft. The public read normalises with `bedrooms ?? beds`, so the
-- STALE value wins: an agent changed 3 beds to 4, saved, and their clients
-- went on seeing 3. ListingsBlock reads bedrooms only, so the page builder
-- showed the old number too.
--
-- The integer columns also made two things unsaveable. AddListingModal renders
-- baths with step 0.5, and 2.5 into an integer column fails — the agent saw a
-- generic "Failed to add listing". And the sqft placeholder is "2,400" while
-- the writer used parseInt, so "2,400" stored 2 and the card rendered
-- "$625,000/sqft".
--
-- bedrooms/bathrooms (numeric(3,1)) and square_feet (integer) become canonical.
--
-- beds/baths/sqft are not dropped: they are re-added as GENERATED columns.
-- Every reader in the app and in any external integration keeps working, while
-- any writer that still names them now fails LOUDLY (generated columns reject
-- writes) rather than silently diverging from the canonical value — which is
-- the exact failure this story is about. Drop them once nothing names them.

-- ---------------------------------------------------------------------------
-- 1. Backfill, so no row loses a value in the swap.
-- ---------------------------------------------------------------------------
UPDATE public.listings
SET bedrooms = COALESCE(bedrooms, beds),
    bathrooms = COALESCE(bathrooms, baths),
    square_feet = COALESCE(square_feet, sqft)
WHERE bedrooms IS NULL OR bathrooms IS NULL OR square_feet IS NULL;

-- ---------------------------------------------------------------------------
-- 2. The canonical columns carry the NOT NULL that beds/baths used to.
-- ---------------------------------------------------------------------------
UPDATE public.listings SET bedrooms = 0 WHERE bedrooms IS NULL;
UPDATE public.listings SET bathrooms = 0 WHERE bathrooms IS NULL;

ALTER TABLE public.listings
  ALTER COLUMN bedrooms SET DEFAULT 0,
  ALTER COLUMN bedrooms SET NOT NULL,
  ALTER COLUMN bathrooms SET DEFAULT 0,
  ALTER COLUMN bathrooms SET NOT NULL;

-- ---------------------------------------------------------------------------
-- 3. beds/baths/sqft become derived. A column cannot be converted in place, so
--    they are dropped and re-added.
--
--    beds and baths round to the nearest whole number: they are integers, and
--    2.5 bathrooms has always had to become something. Rounding is what a
--    reader of an integer column expects; the truth lives in `bathrooms`.
-- ---------------------------------------------------------------------------
ALTER TABLE public.listings DROP COLUMN beds;
ALTER TABLE public.listings DROP COLUMN baths;
ALTER TABLE public.listings DROP COLUMN sqft;

ALTER TABLE public.listings
  ADD COLUMN beds integer GENERATED ALWAYS AS (round(bedrooms)::integer) STORED,
  ADD COLUMN baths integer GENERATED ALWAYS AS (round(bathrooms)::integer) STORED,
  ADD COLUMN sqft integer GENERATED ALWAYS AS (square_feet) STORED;

COMMENT ON COLUMN public.listings.beds IS
  'Derived from bedrooms (US-106). Read-only; write bedrooms instead.';
COMMENT ON COLUMN public.listings.baths IS
  'Derived from bathrooms, rounded (US-106). Read-only; write bathrooms instead.';
COMMENT ON COLUMN public.listings.sqft IS
  'Derived from square_feet (US-106). Read-only; write square_feet instead.';

-- ---------------------------------------------------------------------------
-- 4. Four fields the Add Listing form has always collected and silently thrown
--    away: year built, stories, garage spaces and an open-house END time. The
--    CSV template advertises year_built too, and drops it.
--
--    Added rather than removed from the form: they are ordinary property facts
--    a buyer asks about, the agent has already typed them, and discarding
--    typed input is the worse half of the choice. `videoUrl` is NOT added — it
--    duplicates virtual_tour_url, and two URL fields both meaning "a video of
--    the property" is the confusion, not the fix; it is removed from the form.
-- ---------------------------------------------------------------------------
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS year_built integer,
  ADD COLUMN IF NOT EXISTS stories numeric(3,1),
  ADD COLUMN IF NOT EXISTS garage_spaces integer,
  ADD COLUMN IF NOT EXISTS open_house_end_date date;

-- A year outside this range is a typo, not a building.
ALTER TABLE public.listings
  ADD CONSTRAINT listings_year_built_check
  CHECK (year_built IS NULL OR (year_built >= 1600 AND year_built <= 2200));
