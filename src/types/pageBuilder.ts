/**
 * Page Builder Types
 * Type definitions for the drag-and-drop page builder system
 */

// Block types that can be added to a page
export type BlockType =
    | "bio"
    | "listings"
    | "link"
    | "contact"
    | "social"
    | "video"
    | "testimonial"
    | "spacer"
    | "image"
    | "text"
    | "hero"
    | "stats"
    | "gallery"
    | "cta"
    | "divider";

// Per-block styling that can be applied to any block
export interface BlockStyle {
    backgroundColor?: string;
    backgroundGradient?: string; // e.g. "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
    padding?: "none" | "small" | "medium" | "large";
    margin?: "none" | "small" | "medium" | "large";
    borderRadius?: "none" | "small" | "medium" | "large" | "full";
    border?: string; // e.g. "1px solid #e5e7eb"
    shadow?: "none" | "small" | "medium" | "large" | "glow";
    animation?: "none" | "fadeIn" | "slideUp" | "slideLeft" | "slideRight" | "scaleIn" | "bounce";
    textColor?: string;
}

// Base block interface
export interface PageBlock {
    id: string;
    type: BlockType;
    order: number;
    visible: boolean;
    config: BlockConfig;
    style?: BlockStyle;
}

// Block configurations for different types
export type BlockConfig =
    | BioBlockConfig
    | ListingsBlockConfig
    | LinkBlockConfig
    | ContactBlockConfig
    | SocialBlockConfig
    | VideoBlockConfig
    | TestimonialBlockConfig
    | SpacerBlockConfig
    | ImageBlockConfig
    | TextBlockConfig
    | HeroBlockConfig
    | StatsBlockConfig
    | GalleryBlockConfig
    | CTABlockConfig
    | DividerBlockConfig;

// Bio Block
export interface BioBlockConfig {
    type: "bio";
    title: string;
    subtitle?: string;
    description: string;
    avatarUrl?: string;
    showSocialLinks: boolean;
    showContactButton: boolean;
}

// Listings Block
export interface ListingsBlockConfig {
    type: "listings";
    title: string;
    layout: "grid" | "list" | "carousel";
    filter: "all" | "active" | "featured";
    maxItems?: number;
    showPrices: boolean;
    showStatus: boolean;
}

// Link Block
export interface LinkBlockConfig {
    type: "link";
    title: string;
    url: string;
    icon?: string;
    style: "button" | "card" | "minimal";
    openInNewTab: boolean;
}

// Contact Form Block
export interface ContactBlockConfig {
    type: "contact";
    title: string;
    fields: ContactField[];
    submitButtonText: string;
    successMessage: string;
}

export interface ContactField {
    id: string;
    type: "text" | "email" | "phone" | "textarea" | "select" | "checkbox";
    label: string;
    placeholder?: string;
    required: boolean;
    options?: string[]; // For select fields
}

// Social Links Block
export interface SocialBlockConfig {
    type: "social";
    title?: string;
    links: SocialLink[];
    layout: "horizontal" | "vertical" | "grid";
    iconSize: "small" | "medium" | "large";
}

export interface SocialLink {
    id: string;
    platform:
        | "instagram"
        | "facebook"
        | "twitter"
        | "linkedin"
        | "youtube"
        | "tiktok"
        | "zillow"
        | "realtor";
    url: string;
    username?: string;
}

// Video Block
export interface VideoBlockConfig {
    type: "video";
    title?: string;
    videoUrl: string; // YouTube, Vimeo, or direct URL
    thumbnail?: string;
    autoplay: boolean;
    muted: boolean;
}

// Testimonial Block
export interface TestimonialBlockConfig {
    type: "testimonial";
    title?: string;
    testimonials: Testimonial[];
    layout: "slider" | "grid" | "stacked";
}

export interface Testimonial {
    id: string;
    name: string;
    role?: string;
    content: string;
    avatarUrl?: string;
    rating?: number;
}

// Spacer Block
export interface SpacerBlockConfig {
    type: "spacer";
    height: number; // in pixels
}

// Image Block
export interface ImageBlockConfig {
    type: "image";
    imageUrl: string;
    alt: string;
    caption?: string;
    link?: string;
    size: "small" | "medium" | "large" | "full";
}

// Text Block
export interface TextBlockConfig {
    type: "text";
    content: string;
    align: "left" | "center" | "right";
    fontSize: "small" | "medium" | "large";
}

// Hero Block - prominent header section with background
export interface HeroBlockConfig {
    type: "hero";
    headline: string;
    subheadline?: string;
    backgroundImageUrl?: string;
    backgroundOverlay?: "none" | "light" | "dark" | "gradient";
    ctaText?: string;
    ctaUrl?: string;
    layout: "centered" | "left" | "split";
    height: "small" | "medium" | "large";
}

// Stats Block - showcase agent metrics
export interface StatsBlockConfig {
    type: "stats";
    title?: string;
    stats: StatItem[];
    layout: "row" | "grid" | "cards";
}

export interface StatItem {
    id: string;
    value: string;
    label: string;
    icon?: string;
    prefix?: string;
    suffix?: string;
}

// Gallery Block - photo showcase
export interface GalleryBlockConfig {
    type: "gallery";
    title?: string;
    images: GalleryImage[];
    layout: "grid" | "masonry" | "carousel";
    columns: 2 | 3 | 4;
}

export interface GalleryImage {
    id: string;
    url: string;
    alt: string;
    caption?: string;
}

// CTA Block - prominent call to action
export interface CTABlockConfig {
    type: "cta";
    headline: string;
    description?: string;
    buttonText: string;
    buttonUrl: string;
    variant: "solid" | "outline" | "gradient";
    openInNewTab: boolean;
}

// Divider Block - visual separator
export interface DividerBlockConfig {
    type: "divider";
    style: "line" | "dashed" | "dotted" | "gradient" | "wave";
    color?: string;
}

// Page configuration
export interface PageConfig {
    id: string;
    userId: string;
    slug: string;
    title: string;
    description: string;
    blocks: PageBlock[];
    theme: PageTheme;
    seo: PageSEO;
    published: boolean;
    createdAt: Date;
    updatedAt: Date;
}

// Theme configuration
export interface PageTheme {
    name: string;
    preset?: string; // predefined theme name
    colors: {
        primary: string;
        secondary: string;
        background: string;
        text: string;
        accent: string;
    };
    fonts: {
        heading: string;
        body: string;
    };
    borderRadius: "none" | "small" | "medium" | "large" | "full";
    spacing: "compact" | "normal" | "spacious";
}

// SEO configuration
export interface PageSEO {
    title: string;
    description: string;
    keywords: string[];
    ogImage?: string;
    twitterCard: "summary" | "summary_large_image";
    structuredData?: Record<string, any>;
}

// Builder state
export interface BuilderState {
    page: PageConfig;
    selectedBlockId: string | null;
    isDragging: boolean;
    history: PageConfig[];
    historyIndex: number;
}

// Block template for adding new blocks
export interface BlockTemplate {
    type: BlockType;
    name: string;
    description: string;
    icon: string;
    category: "content" | "media" | "engagement" | "layout";
    defaultConfig: BlockConfig;
}
