export interface Testimonial {
    id: number;
    profile_id: number;
    client_name: string;
    client_photo?: string | null;
    client_title?: string | null; // e.g., "First-Time Homebuyer"
    rating: number; // 1-5 stars
    review_text: string;
    property_type?: string | null; // e.g., "Single Family Home"
    transaction_type?: "buyer" | "seller" | null;
    date: string; // ISO date
    is_featured: boolean;
    sort_order: number;
    created_at: string;
    updated_at: string;
}

export interface CreateTestimonialData {
    profile_id: number;
    client_name: string;
    client_photo?: string | null;
    client_title?: string | null;
    rating: number;
    review_text: string;
    property_type?: string | null;
    transaction_type?: "buyer" | "seller" | null;
    date: string;
    is_featured?: boolean;
    sort_order?: number;
}

export interface UpdateTestimonialData extends Partial<CreateTestimonialData> {
    id: number;
}
