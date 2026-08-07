import type { Database } from '@/integrations/supabase/types';

export type ListingStatus = 'active' | 'pending' | 'under_contract' | 'sold' | 'draft';
export type PropertyType =
  | 'single_family'
  | 'condo'
  | 'townhouse'
  | 'multi_family'
  | 'land'
  | 'commercial';

export interface Listing {
  id: number;
  profile_id: number;

  // Property Details
  address_street: string;
  address_city: string;
  address_state: string;
  address_zip: string;
  address_full: string;

  // Location
  latitude: number | null;
  longitude: number | null;

  // Property Info
  price: number;
  original_price: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  square_feet: number | null;
  lot_size_acres: number | null;
  property_type: PropertyType;
  year_built: number | null;

  // Description
  title: string | null;
  description: string | null;
  highlights: string[];

  // Status
  status: ListingStatus;
  listed_date: string | null;
  sold_date: string | null;
  days_on_market: number | null;

  // MLS Info
  mls_number: string | null;
  mls_source: string | null;

  // Media
  primary_photo: string | null;
  photos: string[];
  virtual_tour_url: string | null;
  video_url: string | null;

  // Open House
  open_house_date: string | null;
  open_house_end_date: string | null;

  // Sorting & Display
  sort_order: number;
  is_featured: boolean;

  created_at: string;
  updated_at: string;
}

/**
 * PublicListing matches the shape returned by usePublicProfile's DB query
 * and transformations. Use this type in profile-facing components instead
 * of the canonical Listing type.
 */
/**
 * A listing as the public profile components consume it.
 *
 * Derived from the generated Row type rather than restated. The hand-written
 * version claimed six fields that are not columns — `title`, `original_price`,
 * `video_url`, `highlights`, and (until 20260806000006 added them) `state` and
 * `zip_code`. That is the same invented-schema pattern that hid the missing
 * profile headshot and the blank testimonial quotes; see US-056.
 *
 * Two of those had visible consequences and are recorded rather than silently
 * dropped:
 *   - `original_price` drove a strikethrough "was" price in
 *     FeaturedListingsCarousel that could never render.
 *   - `highlights` is still collected by the add-listing form and discarded on
 *     save, because no column receives it. Removing it here does not change
 *     that; the form field needs either a column or removal — a product call.
 *
 * `id` is widened to `number | string` only because the test fixtures use
 * numbers; the column is a uuid.
 */
export type PublicListing = Omit<
  Database['public']['Tables']['listings']['Row'],
  'photos' | 'user_id'
> & {
  /** jsonb in the schema; every reader treats it as a URL list. */
  photos: string[] | null;
};

export interface ListingUpdateData extends Partial<PublicListing> {
  highlights?: string[];
  title?: string;
  year_built?: number;
  virtual_tour_url?: string;
  video_url?: string;
  open_house_date?: string;
  open_house_end_date?: string;
  is_featured?: boolean;
}

/**
 * The subset of a listing that a public profile page receives.
 *
 * usePublicProfile selects these columns only, so the profile components must
 * not be typed against the full row — the same boundary problem PublicProfile
 * solves for `profiles`. Pick rejects a name that is not a real column, so the
 * list cannot drift from the schema without a compile error.
 */
export type PublicListingFields =
  | 'id'
  | 'image'
  | 'photos'
  | 'address'
  | 'city'
  | 'price'
  | 'beds'
  | 'baths'
  | 'bedrooms'
  | 'bathrooms'
  | 'sqft'
  | 'square_feet'
  | 'status'
  | 'sort_order'
  | 'is_featured'
  | 'days_on_market'
  | 'description'
  | 'property_type'
  | 'state'
  | 'zip_code'
  | 'mls_number'
  | 'lot_size_acres'
  | 'virtual_tour_url'
  | 'highlights'
  | 'created_at';

export type PublicProfileListing = Pick<PublicListing, PublicListingFields>;
