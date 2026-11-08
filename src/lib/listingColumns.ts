import type { Database } from '@/integrations/supabase/types';

type ListingRow = Database['public']['Tables']['listings']['Row'];

/**
 * The columns of `listings` the owner's dashboard reads (US-342, US-575).
 *
 * useListings asked for `select('*')`. That has two costs. A column added to
 * the table later is fetched by every dashboard load whether or not anything
 * shows it, and the day a column-level grant lands on `listings` (as it did on
 * profiles in US-073 and leads in US-254) a `*` read is refused outright and
 * the Listings page goes blank. Naming the columns means a new column is a
 * deliberate addition here, and a revoked one fails one read loudly in review.
 *
 * Every column the `Listing` type in useListings carries, so the edit dialog
 * and the cards keep the fields they already use. A literal string, so
 * supabase-js types the returned rows; the `: Listing` mapping in useListings
 * then fails to compile if one is missing, and listingColumns.test.ts fails if
 * one names a column types.ts does not have.
 */
export const OWNER_LISTING_COLUMNS =
  'id, user_id, address, city, state, zip_code, price, status, property_type, description, mls_number, beds, baths, sqft, bedrooms, bathrooms, square_feet, lot_size_acres, year_built, garage_spaces, stories, image, photos, highlights, virtual_tour_url, listed_date, sold_date, days_on_market, is_featured, is_sample, sort_order, open_house_date, open_house_end_date, created_at, updated_at';

/**
 * The columns the page-builder listings block renders (US-342, US-575).
 *
 * The block is on the agent's public page, so it is read by visitors under the
 * anon key: it asks only for what its cards show (address line, price,
 * status, beds/baths/sqft and the photo), not the whole row. The status and
 * featured filters are applied in the WHERE clause and need not be selected.
 */
export const LISTINGS_BLOCK_COLUMNS =
  'id, address, city, state, price, status, bedrooms, bathrooms, square_feet, photos, image';

/** The row shape LISTINGS_BLOCK_COLUMNS returns. */
export type ListingsBlockRow = Pick<
  ListingRow,
  | 'id'
  | 'address'
  | 'city'
  | 'state'
  | 'price'
  | 'status'
  | 'bedrooms'
  | 'bathrooms'
  | 'square_feet'
  | 'photos'
  | 'image'
>;

/** Split a select list into its column names. */
export function selectedColumns(list: string): string[] {
  return list
    .split(',')
    .map((c) => c.trim())
    .filter((c) => c.length > 0);
}
