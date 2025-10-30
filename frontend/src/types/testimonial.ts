export type ServiceType = "buyer" | "seller" | "both";

export interface Testimonial {
    id: number;
    profile_id: number;
    listing_id: number | null;

    // Client Info
    client_name: string;
    client_photo: string | null;
    is_anonymous: boolean;

    // Testimonial
    rating: number; // 1-5
    testimonial_text: string;
    service_type: ServiceType;
    property_type: string | null;
    transaction_date: string | null;

    // Media
    video_url: string | null;

    // Display
    is_featured: boolean;
    sort_order: number;
    is_published: boolean;

    created_at: string;
    updated_at: string;
}

export interface TestimonialCreateData {
    client_name: string;
    rating: number;
    testimonial_text: string;
    service_type: ServiceType;
    property_type?: string;
    transaction_date?: string;
    is_anonymous?: boolean;
    listing_id?: number;
}

export interface TestimonialUpdateData extends Partial<TestimonialCreateData> {
    is_featured?: boolean;
    is_published?: boolean;
    video_url?: string;
}
