-- US-056 fallout: adding a property listing was broken outright.
--
-- src/pages/dashboard/Listings.tsx builds its insert payload with `state`,
-- `zip_code` and `open_house_date`. None of the three is a column on `listings`,
-- so PostgREST rejected the whole insert, and the handler's catch turned that
-- into a generic "Failed to add listing. Please try again." toast. The CSV
-- import path (handleCSVImport) sends the same fields, so bulk import was
-- broken the same way.
--
-- Reproduced against the baseline schema before this migration:
--   INSERT INTO listings (user_id,address,city,state,zip_code,price,beds,baths,open_house_date) ...
--   -> ERROR: column "state" of relation "listings" does not exist
-- and the same insert without those three columns succeeds.
--
-- Adding the columns rather than stripping them from the payload: the add-listing
-- form collects all three deliberately (address step: state + ZIP; a dedicated
-- open-house date field), ListingDetailModal already reads `zip_code` to render
-- the address, and they are ordinary attributes of a real estate listing. The UI
-- was right and the schema was behind it.
--
-- Nullable with no default, so existing rows are unaffected.

ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS state text,
  ADD COLUMN IF NOT EXISTS zip_code text,
  ADD COLUMN IF NOT EXISTS open_house_date date;

COMMENT ON COLUMN public.listings.state IS
  'Two-letter state code, collected by the add-listing form. Added in US-056 — the form wrote it before the column existed, which failed every insert.';
COMMENT ON COLUMN public.listings.zip_code IS
  'Postal code, collected by the add-listing form and read by ListingDetailModal.';
COMMENT ON COLUMN public.listings.open_house_date IS
  'Next scheduled open house, collected by the add-listing form.';

-- Public profile pages filter listings by city/state, so index the pair the way
-- that query reads them. Partial on published-relevant rows only.
CREATE INDEX IF NOT EXISTS idx_listings_city_state
  ON public.listings (city, state)
  WHERE state IS NOT NULL;

-- `highlights` is the same defect, one step further along: the add-listing form
-- has a "Property Highlights" textarea, ListingDetailModal renders the list, and
-- src/types/listing.ts declared the field — but no column ever received it, and
-- handleAddListing did not even include it in its payload. So an agent could
-- type highlights and they were silently discarded on save, with the detail
-- modal always showing none.
--
-- Stored as text[] rather than a single blob: the modal iterates it, and the
-- form's comma-separated input splits cleanly.
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS highlights text[];

COMMENT ON COLUMN public.listings.highlights IS
  'Selling points shown in ListingDetailModal, entered comma-separated in the add-listing form. Added in US-056 — the UI existed on both ends with no column between them.';
