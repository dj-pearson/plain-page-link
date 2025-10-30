/**
 * LinkStack Core Types - Ported from Laravel/PHP LinkStack
 * These types support the core link-in-bio functionality from LinkStack
 */

// Link Block Types (from LinkStack)
export type LinkBlockType =
    | "link" // Standard URL link with button
    | "predefined" // Pre-styled links (social media, etc.)
    | "spacer" // Vertical spacing block
    | "heading" // Text heading block
    | "text" // Rich text content block
    | "telephone" // Click-to-call phone link
    | "email" // Click-to-email link
    | "vcard" // Download contact card;

// Button Styles (LinkStack button_id references)
export interface LinkStackButton {
    id: number;
    name: string;
    title: string;
    description: string | null;
    custom_css: string | null;
    custom_icon: string | null;
    created_at: string;
    updated_at: string;
}

// Enhanced Link Type (combining AgentBio + LinkStack features)
export interface LinkStackLink {
    id: number;
    user_id: number;

    // Core Link Data
    link: string | null; // URL (null for non-link blocks like spacer/heading)
    title: string | null; // Display text
    type: LinkBlockType; // Block type
    type_params: Record<string, any> | null; // Type-specific params (JSON)

    // Styling & Display
    button_id: number | null; // References button style
    custom_icon: string; // FontAwesome icon class (e.g., 'fa-external-link')
    custom_css: string; // Custom CSS overrides

    // Ordering & Status
    order: number; // Display order (drag-and-drop)
    up_link: "yes" | "no"; // Featured/pinned status

    // Analytics
    click_number: number; // Total clicks tracked

    // Timestamps
    created_at: string;
    updated_at: string;
}

// Type-specific parameters for each block type
export interface SpacerParams {
    height: number; // Height in pixels
}

export interface HeadingParams {
    content: string; // Heading text
    level: 1 | 2 | 3 | 4 | 5 | 6; // H1-H6
    alignment: "left" | "center" | "right";
}

export interface TextParams {
    content: string; // Rich text content (HTML)
    alignment: "left" | "center" | "right";
}

export interface TelephoneParams {
    phone_number: string; // E.164 format preferred
    country_code: string; // Country code (e.g., '+1')
}

export interface EmailParams {
    email: string;
    subject?: string; // Pre-filled subject line
}

export interface VCardParams {
    name: string;
    phone: string;
    email: string;
    organization?: string;
    title?: string;
    website?: string;
}

export interface PredefinedParams {
    service_name: string; // e.g., 'instagram', 'twitter', 'linkedin'
    username: string; // Username/handle for the service
}

// Create/Update DTOs
export interface LinkStackLinkCreate {
    link?: string;
    title?: string;
    type: LinkBlockType;
    type_params?: Record<string, any>;
    button_id?: number;
    custom_icon?: string;
    custom_css?: string;
    order?: number;
}

export interface LinkStackLinkUpdate extends Partial<LinkStackLinkCreate> {
    id: number;
}

// User Profile Data (LinkStack littlelink_name pattern)
export interface LinkStackUser {
    id: number;
    name: string;
    email: string;
    littlelink_name: string | null; // Profile slug/username
    littlelink_description: string | null; // Bio
    image: string | null; // Avatar URL
    role: "user" | "vip" | "admin";
    block: "yes" | "no";
    theme: string | null; // Theme identifier
    created_at: string;
    updated_at: string;
}

// Theme Configuration
export interface LinkStackTheme {
    id: string; // Theme identifier
    name: string;
    display_name: string;
    colors: {
        background: string;
        card_background: string;
        text_primary: string;
        text_secondary: string;
        link_color: string;
        button_background: string;
        button_text: string;
    };
    fonts: {
        heading: string;
        body: string;
    };
    layout: {
        max_width: string;
        border_radius: string;
        spacing: "compact" | "comfortable" | "spacious";
    };
}

// Predefined Social Links (LinkStack style)
export interface PredefinedLink {
    name: string;
    title: string;
    icon: string; // FontAwesome class
    color: string; // Brand color
    url_pattern: string; // e.g., 'https://instagram.com/{username}'
}

export const PREDEFINED_LINKS: Record<string, PredefinedLink> = {
    instagram: {
        name: "instagram",
        title: "Instagram",
        icon: "fa-brands fa-instagram",
        color: "#E4405F",
        url_pattern: "https://instagram.com/{username}",
    },
    facebook: {
        name: "facebook",
        title: "Facebook",
        icon: "fa-brands fa-facebook",
        color: "#1877F2",
        url_pattern: "https://facebook.com/{username}",
    },
    twitter: {
        name: "twitter",
        title: "Twitter",
        icon: "fa-brands fa-twitter",
        color: "#1DA1F2",
        url_pattern: "https://twitter.com/{username}",
    },
    linkedin: {
        name: "linkedin",
        title: "LinkedIn",
        icon: "fa-brands fa-linkedin",
        color: "#0A66C2",
        url_pattern: "https://linkedin.com/in/{username}",
    },
    tiktok: {
        name: "tiktok",
        title: "TikTok",
        icon: "fa-brands fa-tiktok",
        color: "#000000",
        url_pattern: "https://tiktok.com/@{username}",
    },
    youtube: {
        name: "youtube",
        title: "YouTube",
        icon: "fa-brands fa-youtube",
        color: "#FF0000",
        url_pattern: "https://youtube.com/@{username}",
    },
    github: {
        name: "github",
        title: "GitHub",
        icon: "fa-brands fa-github",
        color: "#181717",
        url_pattern: "https://github.com/{username}",
    },
    website: {
        name: "website",
        title: "Website",
        icon: "fa-solid fa-globe",
        color: "#000000",
        url_pattern: "{username}", // Direct URL
    },
    email: {
        name: "email",
        title: "Email",
        icon: "fa-solid fa-envelope",
        color: "#EA4335",
        url_pattern: "mailto:{username}",
    },
    phone: {
        name: "phone",
        title: "Phone",
        icon: "fa-solid fa-phone",
        color: "#34A853",
        url_pattern: "tel:{username}",
    },
};

// Analytics Event Types
export type AnalyticsEventType =
    | "profile_view"
    | "link_click"
    | "form_submission"
    | "share"
    | "download";

export interface LinkStackAnalyticsEvent {
    id: number;
    user_id: number;
    link_id: number | null;
    event_type: AnalyticsEventType;
    referrer: string | null;
    user_agent: string | null;
    ip_address: string | null; // Anonymized for GDPR
    country: string | null;
    device_type: "mobile" | "tablet" | "desktop";
    created_at: string;
}

