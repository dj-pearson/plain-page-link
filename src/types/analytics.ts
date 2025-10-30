export type EventType =
    | "page_view"
    | "link_click"
    | "listing_view"
    | "form_submit"
    | "phone_click"
    | "email_click"
    | "booking_click";
export type DeviceType = "mobile" | "tablet" | "desktop";

export interface AnalyticsEvent {
    id: number;
    profile_id: number;
    event_type: EventType;
    event_data: Record<string, any>;

    // Visitor Info
    visitor_id: string;
    session_id: string;

    // Source
    referrer_url: string | null;
    utm_source: string | null;
    utm_medium: string | null;
    utm_campaign: string | null;

    // Device
    device_type: DeviceType;
    browser: string | null;
    os: string | null;

    // Location
    country: string | null;
    state: string | null;
    city: string | null;

    created_at: string;
}

export interface AnalyticsOverview {
    total_views: number;
    unique_visitors: number;
    total_clicks: number;
    total_leads: number;
    conversion_rate: number;
    period: {
        start: string;
        end: string;
    };
}

export interface TrafficSource {
    source: string;
    visits: number;
    percentage: number;
}

export interface TopListing {
    listing_id: number;
    listing_title: string;
    listing_address: string;
    views: number;
    inquiries: number;
}

export interface ConversionFunnel {
    step: string;
    count: number;
    percentage: number;
}

export interface AnalyticsDateRange {
    start_date: string;
    end_date: string;
}
