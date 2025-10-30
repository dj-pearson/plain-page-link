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
