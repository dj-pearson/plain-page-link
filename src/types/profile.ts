export interface Profile {
    id: number;
    user_id: number;
    slug: string;
    display_name: string;
    title: string | null;
    bio: string | null;
    profile_photo: string | null;

    // Professional Info
    license_number: string;
    license_state: string;
    brokerage_name: string | null;
    brokerage_logo: string | null;
    years_experience: number | null;
    specialties: string[];
    certifications: string[];

    // Service Areas
    service_cities: string[];
    service_zip_codes: string[];

    // Contact
    phone: string | null;
    sms_enabled: boolean;
    email_display: string | null;

    // Social Links
    instagram_url: string | null;
    facebook_url: string | null;
    linkedin_url: string | null;
    tiktok_url: string | null;
    youtube_url: string | null;
    zillow_url: string | null;
    realtor_com_url: string | null;
    website_url: string | null;

    // Settings
    is_published: boolean;
    theme_id: string;
    custom_css: string | null;
    seo_title: string | null;
    seo_description: string | null;

    // Analytics
    view_count: number;
    lead_count: number;

    created_at: string;
    updated_at: string;
}

export interface ProfileUpdateData {
    display_name?: string;
    title?: string;
    bio?: string;
    license_number?: string;
    license_state?: string;
    brokerage_name?: string;
    phone?: string;
    sms_enabled?: boolean;
    email_display?: string;
    specialties?: string[];
    certifications?: string[];
    service_cities?: string[];
    service_zip_codes?: string[];
    instagram_url?: string;
    facebook_url?: string;
    linkedin_url?: string;
    tiktok_url?: string;
    youtube_url?: string;
    zillow_url?: string;
    realtor_com_url?: string;
    website_url?: string;
    seo_title?: string;
    seo_description?: string;
}
