import type { PublicListing, PublicProfileListing } from '@/types/listing';

/**
 * Listing fixtures, built against the real `listings` schema.
 *
 * These previously described the invented `Listing` interface that used to sit
 * in @/types/listing — `id: 1`, `price: 425000`, `address_street`,
 * `primary_photo`. None of those are columns, so the fixtures could only ever
 * exercise a shape production does not produce. `id` is a uuid and `price` is
 * text; both are spelled that way here now.
 */
export const mockListing: PublicListing = {
  id: '33333333-3333-3333-3333-333333333333',
  address: '123 Maple Avenue',
  city: 'Springfield',
  state: 'IL',
  zip_code: '62704',
  price: '425000',
  bedrooms: 4,
  bathrooms: 3,
  square_feet: 2400,
  lot_size_acres: 0.25,
  // Derived columns (US-106). Present on a Row, never written; the fixture
  // carries them because PublicListing is the full row shape.
  beds: 4,
  baths: 3,
  sqft: 2400,
  year_built: 1998,
  stories: 2,
  garage_spaces: 2,
  open_house_end_date: null,
  property_type: 'single_family',
  description: 'A beautifully maintained 4-bedroom home with a spacious yard.',
  highlights: ['Updated kitchen', 'Finished basement', 'Two-car garage'],
  status: 'active',
  listed_date: '2026-02-01',
  sold_date: null,
  days_on_market: 14,
  mls_number: 'MLS123456',
  image: 'https://example.com/listings/1/primary.jpg',
  photos: [
    'https://example.com/listings/1/photo1.jpg',
    'https://example.com/listings/1/photo2.jpg',
  ],
  virtual_tour_url: null,
  open_house_date: null,
  sort_order: 0,
  is_featured: true,
  created_at: '2026-02-01T00:00:00.000Z',
  updated_at: '2026-02-10T00:00:00.000Z',
};

/**
 * Exactly the columns usePublicProfile selects — no more.
 *
 * Built from mockListing so the two cannot drift; Pick rejects any key that is
 * not in PublicListingFields.
 */
export const mockPublicListing: PublicProfileListing = {
  id: mockListing.id,
  image: mockListing.image,
  photos: mockListing.photos,
  address: mockListing.address,
  city: mockListing.city,
  price: mockListing.price,
  bedrooms: mockListing.bedrooms,
  bathrooms: mockListing.bathrooms,
  square_feet: mockListing.square_feet,
  status: mockListing.status,
  sort_order: mockListing.sort_order,
  is_featured: mockListing.is_featured,
  days_on_market: mockListing.days_on_market,
  description: mockListing.description,
  property_type: mockListing.property_type,
  state: mockListing.state,
  zip_code: mockListing.zip_code,
  mls_number: mockListing.mls_number,
  lot_size_acres: mockListing.lot_size_acres,
  virtual_tour_url: mockListing.virtual_tour_url,
  highlights: mockListing.highlights,
  created_at: mockListing.created_at,
};

export const makeListing = (overrides: Partial<PublicListing> = {}): PublicListing => ({
  ...mockListing,
  ...overrides,
});

export const makePublicListing = (
  overrides: Partial<PublicProfileListing> = {}
): PublicProfileListing => ({
  ...mockPublicListing,
  ...overrides,
});
