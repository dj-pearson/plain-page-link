// API Configuration
// For self-hosted Supabase, use the Supabase URL from environment
// Falls back to the production app URL when not explicitly set
export const API_URL =
    import.meta.env.VITE_API_URL || import.meta.env.VITE_SUPABASE_URL || "https://api.agentbio.net";
export const APP_URL = import.meta.env.VITE_APP_URL || "https://agentbio.net";

// Property Types
export const PROPERTY_TYPES = [
    { value: "single_family", label: "Single Family" },
    { value: "condo", label: "Condo" },
    { value: "townhouse", label: "Townhouse" },
    { value: "multi_family", label: "Multi-Family" },
    { value: "land", label: "Land" },
    { value: "commercial", label: "Commercial" },
] as const;

// US States
export const US_STATES = [
    { value: "AL", label: "Alabama" },
    { value: "AK", label: "Alaska" },
    { value: "AZ", label: "Arizona" },
    { value: "AR", label: "Arkansas" },
    { value: "CA", label: "California" },
    { value: "CO", label: "Colorado" },
    { value: "CT", label: "Connecticut" },
    { value: "DE", label: "Delaware" },
    { value: "FL", label: "Florida" },
    { value: "GA", label: "Georgia" },
    { value: "HI", label: "Hawaii" },
    { value: "ID", label: "Idaho" },
    { value: "IL", label: "Illinois" },
    { value: "IN", label: "Indiana" },
    { value: "IA", label: "Iowa" },
    { value: "KS", label: "Kansas" },
    { value: "KY", label: "Kentucky" },
    { value: "LA", label: "Louisiana" },
    { value: "ME", label: "Maine" },
    { value: "MD", label: "Maryland" },
    { value: "MA", label: "Massachusetts" },
    { value: "MI", label: "Michigan" },
    { value: "MN", label: "Minnesota" },
    { value: "MS", label: "Mississippi" },
    { value: "MO", label: "Missouri" },
    { value: "MT", label: "Montana" },
    { value: "NE", label: "Nebraska" },
    { value: "NV", label: "Nevada" },
    { value: "NH", label: "New Hampshire" },
    { value: "NJ", label: "New Jersey" },
    { value: "NM", label: "New Mexico" },
    { value: "NY", label: "New York" },
    { value: "NC", label: "North Carolina" },
    { value: "ND", label: "North Dakota" },
    { value: "OH", label: "Ohio" },
    { value: "OK", label: "Oklahoma" },
    { value: "OR", label: "Oregon" },
    { value: "PA", label: "Pennsylvania" },
    { value: "RI", label: "Rhode Island" },
    { value: "SC", label: "South Carolina" },
    { value: "SD", label: "South Dakota" },
    { value: "TN", label: "Tennessee" },
    { value: "TX", label: "Texas" },
    { value: "UT", label: "Utah" },
    { value: "VT", label: "Vermont" },
    { value: "VA", label: "Virginia" },
    { value: "WA", label: "Washington" },
    { value: "WV", label: "West Virginia" },
    { value: "WI", label: "Wisconsin" },
    { value: "WY", label: "Wyoming" },
] as const;

// Lead Form Types
export const LEAD_FORM_TYPES = [
    { value: "buyer_inquiry", label: "Buyer Inquiry" },
    { value: "seller_inquiry", label: "Seller Inquiry" },
    { value: "home_valuation", label: "Home Valuation" },
    { value: "general_contact", label: "General Contact" },
    { value: "showing_request", label: "Showing Request" },
] as const;

// Contact Methods
export const CONTACT_METHODS = [
    { value: "email", label: "Email" },
    { value: "phone", label: "Phone" },
    { value: "sms", label: "Text/SMS" },
    { value: "video", label: "Video Call" },
] as const;

// Lead Status
export const LEAD_STATUSES = [
    { value: "new", label: "New", color: "blue" },
    { value: "contacted", label: "Contacted", color: "yellow" },
    { value: "qualified", label: "Qualified", color: "green" },
    { value: "nurturing", label: "Nurturing", color: "purple" },
    { value: "converted", label: "Converted", color: "emerald" },
    { value: "closed", label: "Closed", color: "gray" },
    { value: "spam", label: "Spam", color: "red" },
] as const;

// Listing Status
export const LISTING_STATUSES = [
    { value: "draft", label: "Draft", color: "gray" },
    { value: "active", label: "Active", color: "green" },
    { value: "pending", label: "Pending", color: "yellow" },
    { value: "under_contract", label: "Under Contract", color: "orange" },
    { value: "sold", label: "Sold", color: "blue" },
] as const;

// Social Icons
export const SOCIAL_ICONS = [
    { id: "instagram", label: "Instagram", icon: "Instagram" },
    { id: "facebook", label: "Facebook", icon: "Facebook" },
    { id: "linkedin", label: "LinkedIn", icon: "Linkedin" },
    { id: "tiktok", label: "TikTok", icon: "Music" },
    { id: "youtube", label: "YouTube", icon: "Youtube" },
    { id: "zillow", label: "Zillow", icon: "Home" },
    { id: "realtor_com", label: "Realtor.com", icon: "Building" },
    { id: "website", label: "Website", icon: "Globe" },
] as const;

// Theme IDs
export const THEME_IDS = [
    "luxury",
    "modern-clean",
    "classic",
    "coastal",
    "urban",
    "farmhouse",
] as const;

// Font Options
export const FONT_OPTIONS = [
    { value: "Inter", label: "Inter" },
    { value: "Roboto", label: "Roboto" },
    { value: "Open Sans", label: "Open Sans" },
    { value: "Lato", label: "Lato" },
    { value: "Montserrat", label: "Montserrat" },
    { value: "Playfair Display", label: "Playfair Display" },
    { value: "Merriweather", label: "Merriweather" },
    { value: "Poppins", label: "Poppins" },
    { value: "Raleway", label: "Raleway" },
    { value: "Ubuntu", label: "Ubuntu" },
] as const;

// File Upload Limits
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
export const MAX_IMAGES_PER_LISTING = 25;
export const ACCEPTED_IMAGE_TYPES = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
];

// Pagination
export const DEFAULT_PAGE_SIZE = 20;
export const ITEMS_PER_PAGE_OPTIONS = [10, 20, 50, 100];

// Analytics Date Ranges
export const ANALYTICS_DATE_RANGES = [
    { value: "7d", label: "Last 7 days" },
    { value: "30d", label: "Last 30 days" },
    { value: "90d", label: "Last 90 days" },
    { value: "custom", label: "Custom range" },
] as const;
