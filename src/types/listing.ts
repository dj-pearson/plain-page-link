export type ListingStatus =
    | "active"
    | "pending"
    | "under_contract"
    | "sold"
    | "draft";
export type PropertyType =
    | "single_family"
    | "condo"
    | "townhouse"
    | "multi_family"
    | "land"
    | "commercial";

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
export interface PublicListing {
    id: number | string;
    // Address fields (DB columns)
    address: string | null;
    city: string | null;
    state?: string | null;
    zip_code?: string | null;
    // Price (may be string or number from DB)
    price: number | string | null;
    original_price?: number | string | null;
    // Property stats (DB may have both naming conventions)
    beds?: number | null;
    baths?: number | null;
    bedrooms: number | null;
    bathrooms: number | null;
    sqft?: number | null;
    square_feet: number | null;
    lot_size_acres?: number | null;
    // Media
    image?: string | null;
    photos: string[] | null;
    virtual_tour_url?: string | null;
    video_url?: string | null;
    // Property info
    title: string | null;
    description: string | null;
    property_type: string | null;
    status: ListingStatus;
    highlights?: string[] | null;
    // MLS
    mls_number?: string | null;
    // Sorting & display
    sort_order?: number;
    is_featured?: boolean;
    days_on_market?: number | null;
    // Timestamps
    created_at?: string;
    updated_at?: string;
}

export interface ListingCreateData {
    address_street: string;
    address_city: string;
    address_state: string;
    address_zip: string;
    price: number;
    bedrooms?: number;
    bathrooms?: number;
    square_feet?: number;
    property_type: PropertyType;
    description?: string;
    status?: ListingStatus;
}

export interface ListingUpdateData extends Partial<ListingCreateData> {
    highlights?: string[];
    title?: string;
    year_built?: number;
    virtual_tour_url?: string;
    video_url?: string;
    open_house_date?: string;
    open_house_end_date?: string;
    is_featured?: boolean;
}
