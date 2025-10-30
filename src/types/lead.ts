export type LeadFormType =
    | "buyer_inquiry"
    | "seller_inquiry"
    | "home_valuation"
    | "general_contact"
    | "showing_request";
export type LeadStatus =
    | "new"
    | "contacted"
    | "qualified"
    | "nurturing"
    | "converted"
    | "closed"
    | "spam";
export type LeadPriority = "low" | "medium" | "high";
export type ContactMethod = "email" | "phone" | "sms" | "video";

export interface Lead {
    id: number;
    profile_id: number;
    listing_id: number | null;

    form_type: LeadFormType;

    // Contact Info
    first_name: string;
    last_name: string;
    email: string;
    phone: string | null;
    preferred_contact_method: ContactMethod;

    // Lead Details
    lead_data: Record<string, any>;

    // Management
    status: LeadStatus;
    priority: LeadPriority;
    notes: string | null;

    // Source Tracking
    source: string | null;
    utm_source: string | null;
    utm_medium: string | null;
    utm_campaign: string | null;
    referrer_url: string | null;

    // Follow-up
    contacted_at: string | null;
    next_follow_up: string | null;

    created_at: string;
    updated_at: string;
}

export interface BuyerInquiryData {
    price_range_min?: number;
    price_range_max?: number;
    bedrooms_min?: number;
    timeline?: string;
    preapproval_status?: string;
    message?: string;
}

export interface SellerInquiryData {
    property_address: string;
    desired_timeline?: string;
    estimated_value?: number;
    reason_for_selling?: string;
    message?: string;
}

export interface HomeValuationData {
    property_address: string;
    property_type?: string;
    bedrooms?: number;
    bathrooms?: number;
    square_feet?: number;
    best_time_to_discuss?: string;
}

export interface LeadSubmitData {
    listing_id?: number;
    form_type: LeadFormType;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    preferred_contact_method?: ContactMethod;
    lead_data:
        | BuyerInquiryData
        | SellerInquiryData
        | HomeValuationData
        | Record<string, any>;
    source?: string;
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
}

export interface LeadUpdateData {
    status?: LeadStatus;
    priority?: LeadPriority;
    notes?: string;
    contacted_at?: string;
    next_follow_up?: string;
}
