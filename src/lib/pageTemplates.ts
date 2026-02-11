/**
 * Page Templates
 * Pre-built page layouts for quick start
 */

import { PageBlock, BlockType } from "@/types/pageBuilder";

export interface PageTemplate {
    id: string;
    name: string;
    description: string;
    category: "real-estate" | "general";
    preview?: string;
    blocks: Omit<PageBlock, "id" | "order">[];
}

/**
 * Luxury Real Estate Agent Template
 * Perfect for high-end property specialists
 */
const luxuryAgentTemplate: PageTemplate = {
    id: "luxury-agent",
    name: "Luxury Agent",
    description: "Professional layout for luxury real estate specialists",
    category: "real-estate",
    blocks: [
        {
            type: "bio",
            visible: true,
            config: {
                type: "bio",
                title: "Your Name",
                subtitle: "Luxury Real Estate Specialist",
                description:
                    "Specializing in high-end properties and exclusive listings. Let me help you find your dream home in the most prestigious neighborhoods.",
                showSocialLinks: true,
                showContactButton: true,
            },
        },
        {
            type: "listings",
            visible: true,
            config: {
                type: "listings",
                title: "Featured Luxury Properties",
                layout: "grid",
                filter: "featured",
                maxItems: 6,
                showPrices: true,
                showStatus: true,
            },
        },
        {
            type: "social",
            visible: true,
            config: {
                type: "social",
                title: "Connect With Me",
                links: [],
                layout: "horizontal",
                iconSize: "medium",
            },
        },
        {
            type: "contact",
            visible: true,
            config: {
                type: "contact",
                title: "Schedule a Consultation",
                fields: [
                    {
                        id: "name",
                        type: "text",
                        label: "Name",
                        placeholder: "Your name",
                        required: true,
                    },
                    {
                        id: "email",
                        type: "email",
                        label: "Email",
                        placeholder: "your@email.com",
                        required: true,
                    },
                    {
                        id: "phone",
                        type: "phone",
                        label: "Phone",
                        placeholder: "(555) 555-5555",
                        required: false,
                    },
                    {
                        id: "interest",
                        type: "select",
                        label: "I'm interested in",
                        placeholder: "Select one",
                        required: true,
                        options: ["Buying", "Selling", "Both"],
                    },
                    {
                        id: "message",
                        type: "textarea",
                        label: "Tell me about your goals",
                        placeholder: "What can I help you with?",
                        required: true,
                    },
                ],
                submitButtonText: "Request Consultation",
                successMessage:
                    "Thank you! I'll be in touch within 24 hours.",
            },
        },
    ],
};

/**
 * First-Time Buyer Specialist Template
 * Friendly and approachable for new homebuyers
 */
const firstTimeBuyerTemplate: PageTemplate = {
    id: "first-time-buyer",
    name: "First-Time Buyer Specialist",
    description: "Friendly layout for agents helping first-time buyers",
    category: "real-estate",
    blocks: [
        {
            type: "bio",
            visible: true,
            config: {
                type: "bio",
                title: "Your Name",
                subtitle: "First-Time Homebuyer Specialist",
                description:
                    "Making your first home purchase stress-free! I guide first-time buyers through every step of the process with patience and expertise.",
                showSocialLinks: true,
                showContactButton: true,
            },
        },
        {
            type: "text",
            visible: true,
            config: {
                type: "text",
                content:
                    "🏠 New to homebuying? You're in the right place! I'll walk you through every step, from getting pre-approved to closing day.",
                align: "center",
                fontSize: "medium",
            },
        },
        {
            type: "listings",
            visible: true,
            config: {
                type: "listings",
                title: "Starter Homes & Condos",
                layout: "grid",
                filter: "active",
                maxItems: 6,
                showPrices: true,
                showStatus: true,
            },
        },
        {
            type: "link",
            visible: true,
            config: {
                type: "link",
                title: "📚 First-Time Buyer Guide (Free Download)",
                url: "#",
                style: "button",
                openInNewTab: false,
            },
        },
        {
            type: "contact",
            visible: true,
            config: {
                type: "contact",
                title: "Let's Get Started!",
                fields: [
                    {
                        id: "name",
                        type: "text",
                        label: "Name",
                        placeholder: "Your name",
                        required: true,
                    },
                    {
                        id: "email",
                        type: "email",
                        label: "Email",
                        placeholder: "your@email.com",
                        required: true,
                    },
                    {
                        id: "phone",
                        type: "phone",
                        label: "Phone",
                        placeholder: "(555) 555-5555",
                        required: false,
                    },
                    {
                        id: "timeline",
                        type: "select",
                        label: "When are you looking to buy?",
                        placeholder: "Select timeframe",
                        required: true,
                        options: [
                            "1-3 months",
                            "3-6 months",
                            "6-12 months",
                            "Just exploring",
                        ],
                    },
                ],
                submitButtonText: "Start My Journey",
                successMessage:
                    "Exciting! I'll reach out soon to help you find your first home.",
            },
        },
        {
            type: "social",
            visible: true,
            config: {
                type: "social",
                title: "Follow for Home Buying Tips",
                links: [],
                layout: "horizontal",
                iconSize: "large",
            },
        },
    ],
};

/**
 * Investment Property Specialist Template
 * Data-driven layout for investor-focused agents
 */
const investorFocusedTemplate: PageTemplate = {
    id: "investor-focused",
    name: "Investment Property Specialist",
    description: "Perfect for agents working with real estate investors",
    category: "real-estate",
    blocks: [
        {
            type: "bio",
            visible: true,
            config: {
                type: "bio",
                title: "Your Name",
                subtitle: "Investment Property Specialist",
                description:
                    "Helping investors build wealth through strategic real estate acquisitions. Data-driven analysis and proven ROI.",
                showSocialLinks: true,
                showContactButton: true,
            },
        },
        {
            type: "listings",
            visible: true,
            config: {
                type: "listings",
                title: "Investment Opportunities",
                layout: "list",
                filter: "active",
                maxItems: 8,
                showPrices: true,
                showStatus: true,
            },
        },
        {
            type: "text",
            visible: true,
            config: {
                type: "text",
                content:
                    "💰 All properties analyzed for cap rate, cash-on-cash return, and appreciation potential.",
                align: "center",
                fontSize: "medium",
            },
        },
        {
            type: "link",
            visible: true,
            config: {
                type: "link",
                title: "📊 Market Analysis Report",
                url: "#",
                style: "button",
                openInNewTab: false,
            },
        },
        {
            type: "contact",
            visible: true,
            config: {
                type: "contact",
                title: "Discuss Investment Strategy",
                fields: [
                    {
                        id: "name",
                        type: "text",
                        label: "Name",
                        placeholder: "Your name",
                        required: true,
                    },
                    {
                        id: "email",
                        type: "email",
                        label: "Email",
                        placeholder: "your@email.com",
                        required: true,
                    },
                    {
                        id: "investment_type",
                        type: "select",
                        label: "Investment Type",
                        placeholder: "Select type",
                        required: true,
                        options: [
                            "Single Family Rental",
                            "Multi-Family",
                            "Commercial",
                            "Fix & Flip",
                            "Mixed Use",
                        ],
                    },
                    {
                        id: "budget",
                        type: "select",
                        label: "Investment Budget",
                        placeholder: "Select range",
                        required: false,
                        options: [
                            "Under $250K",
                            "$250K - $500K",
                            "$500K - $1M",
                            "Over $1M",
                        ],
                    },
                ],
                submitButtonText: "Get Investment Analysis",
                successMessage:
                    "I'll prepare a custom market analysis for you.",
            },
        },
        {
            type: "social",
            visible: true,
            config: {
                type: "social",
                title: "Connect for Market Insights",
                links: [],
                layout: "horizontal",
                iconSize: "medium",
            },
        },
    ],
};

/**
 * Simple & Clean Template
 * Minimalist design that works for any agent
 */
const simpleCleanTemplate: PageTemplate = {
    id: "simple-clean",
    name: "Simple & Clean",
    description: "Minimalist layout that works for any real estate professional",
    category: "general",
    blocks: [
        {
            type: "bio",
            visible: true,
            config: {
                type: "bio",
                title: "Your Name",
                subtitle: "Real Estate Professional",
                description:
                    "Helping clients buy and sell properties with expertise and dedication.",
                showSocialLinks: false,
                showContactButton: true,
            },
        },
        {
            type: "listings",
            visible: true,
            config: {
                type: "listings",
                title: "Current Listings",
                layout: "grid",
                filter: "active",
                maxItems: 6,
                showPrices: true,
                showStatus: false,
            },
        },
        {
            type: "contact",
            visible: true,
            config: {
                type: "contact",
                title: "Get in Touch",
                fields: [
                    {
                        id: "name",
                        type: "text",
                        label: "Name",
                        placeholder: "Your name",
                        required: true,
                    },
                    {
                        id: "email",
                        type: "email",
                        label: "Email",
                        placeholder: "your@email.com",
                        required: true,
                    },
                    {
                        id: "message",
                        type: "textarea",
                        label: "Message",
                        placeholder: "How can I help?",
                        required: true,
                    },
                ],
                submitButtonText: "Send Message",
                successMessage: "Thanks! I'll get back to you soon.",
            },
        },
    ],
};

/**
 * Premium Agent Showcase Template
 * Full-featured page with hero, stats, testimonials, and CTA
 */
const premiumShowcaseTemplate: PageTemplate = {
    id: "premium-showcase",
    name: "Premium Showcase",
    description: "Full-featured page with hero banner, stats, testimonials, and call-to-action",
    category: "real-estate",
    blocks: [
        {
            type: "hero",
            visible: true,
            config: {
                type: "hero",
                headline: "Turning Dreams Into Addresses",
                subheadline: "Trusted real estate professional with a proven track record of finding the perfect home for every client",
                backgroundOverlay: "gradient",
                ctaText: "Schedule a Consultation",
                ctaUrl: "#contact",
                layout: "centered",
                height: "large",
            },
            style: {
                animation: "fadeIn",
            },
        },
        {
            type: "stats",
            visible: true,
            config: {
                type: "stats",
                title: "By The Numbers",
                stats: [
                    { id: "s1", value: "200", label: "Homes Sold", icon: "home", suffix: "+" },
                    { id: "s2", value: "98", label: "Client Satisfaction", icon: "star", suffix: "%" },
                    { id: "s3", value: "15", label: "Years Experience", icon: "award", suffix: "+" },
                    { id: "s4", value: "50", label: "M in Sales", icon: "dollar", prefix: "$" },
                ],
                layout: "cards",
            },
            style: {
                padding: "large",
                animation: "slideUp",
            },
        },
        {
            type: "bio",
            visible: true,
            config: {
                type: "bio",
                title: "Your Name",
                subtitle: "Licensed Real Estate Professional",
                description: "With over 15 years of experience, I specialize in helping families find their dream homes. My approach combines market expertise with genuine care for each client's unique needs.",
                showSocialLinks: false,
                showContactButton: true,
            },
        },
        {
            type: "divider",
            visible: true,
            config: {
                type: "divider",
                style: "gradient",
            },
        },
        {
            type: "listings",
            visible: true,
            config: {
                type: "listings",
                title: "Featured Properties",
                layout: "grid",
                filter: "active",
                maxItems: 6,
                showPrices: true,
                showStatus: true,
            },
            style: {
                animation: "slideUp",
            },
        },
        {
            type: "testimonial",
            visible: true,
            config: {
                type: "testimonial",
                title: "What My Clients Say",
                testimonials: [
                    {
                        id: "t1",
                        name: "Sarah & James M.",
                        role: "First-Time Buyers",
                        content: "An incredible agent who went above and beyond to find us our dream home. Their market knowledge and negotiation skills saved us thousands.",
                        rating: 5,
                    },
                    {
                        id: "t2",
                        name: "Michael R.",
                        role: "Home Seller",
                        content: "Sold our home in just 5 days above asking price. The marketing strategy was top-notch and communication was excellent throughout.",
                        rating: 5,
                    },
                    {
                        id: "t3",
                        name: "Lisa T.",
                        role: "Investment Buyer",
                        content: "A true professional who understands the investment side of real estate. Helped me build a portfolio of three rental properties.",
                        rating: 5,
                    },
                ],
                layout: "slider",
            },
            style: {
                padding: "large",
                animation: "fadeIn",
            },
        },
        {
            type: "cta",
            visible: true,
            config: {
                type: "cta",
                headline: "Ready to Make Your Move?",
                description: "Whether buying, selling, or investing - let's start your real estate journey together.",
                buttonText: "Schedule Free Consultation",
                buttonUrl: "#contact",
                variant: "gradient",
                openInNewTab: false,
            },
            style: {
                animation: "scaleIn",
            },
        },
        {
            type: "contact",
            visible: true,
            config: {
                type: "contact",
                title: "Get In Touch",
                fields: [
                    { id: "name", type: "text", label: "Full Name", placeholder: "Your name", required: true },
                    { id: "email", type: "email", label: "Email", placeholder: "your@email.com", required: true },
                    { id: "phone", type: "phone", label: "Phone", placeholder: "(555) 123-4567", required: false },
                    { id: "message", type: "textarea", label: "Message", placeholder: "Tell me about your real estate goals...", required: true },
                ],
                submitButtonText: "Send Message",
                successMessage: "Thank you! I'll get back to you within 24 hours.",
            },
        },
        {
            type: "social",
            visible: true,
            config: {
                type: "social",
                links: [],
                layout: "horizontal",
                iconSize: "medium",
            },
        },
    ],
};

/**
 * Modern Minimal Template
 * Clean, focused design with hero and essential blocks
 */
const modernMinimalTemplate: PageTemplate = {
    id: "modern-minimal",
    name: "Modern Minimal",
    description: "Clean, sophisticated design with focus on key content",
    category: "real-estate",
    blocks: [
        {
            type: "hero",
            visible: true,
            config: {
                type: "hero",
                headline: "Real Estate, Reimagined",
                subheadline: "A modern approach to finding your perfect space",
                backgroundOverlay: "dark",
                ctaText: "Let's Talk",
                ctaUrl: "#contact",
                layout: "left",
                height: "medium",
            },
            style: {
                borderRadius: "large",
                animation: "fadeIn",
            },
        },
        {
            type: "bio",
            visible: true,
            config: {
                type: "bio",
                title: "Your Name",
                subtitle: "Real Estate Advisor",
                description: "Helping clients navigate the market with data-driven insights and personalized service.",
                showSocialLinks: false,
                showContactButton: false,
            },
        },
        {
            type: "stats",
            visible: true,
            config: {
                type: "stats",
                stats: [
                    { id: "s1", value: "100", label: "Properties Sold", icon: "home", suffix: "+" },
                    { id: "s2", value: "5", label: "Star Rating", icon: "star" },
                    { id: "s3", value: "10", label: "Years in Market", icon: "clock", suffix: "+" },
                ],
                layout: "row",
            },
            style: {
                animation: "slideUp",
            },
        },
        {
            type: "divider",
            visible: true,
            config: { type: "divider", style: "gradient" },
        },
        {
            type: "listings",
            visible: true,
            config: {
                type: "listings",
                title: "Current Listings",
                layout: "grid",
                filter: "active",
                maxItems: 4,
                showPrices: true,
                showStatus: false,
            },
        },
        {
            type: "contact",
            visible: true,
            config: {
                type: "contact",
                title: "Start a Conversation",
                fields: [
                    { id: "name", type: "text", label: "Name", placeholder: "Your name", required: true },
                    { id: "email", type: "email", label: "Email", placeholder: "your@email.com", required: true },
                    { id: "message", type: "textarea", label: "How can I help?", placeholder: "Tell me about what you're looking for...", required: true },
                ],
                submitButtonText: "Send",
                successMessage: "Thanks! I'll be in touch soon.",
            },
        },
        {
            type: "social",
            visible: true,
            config: {
                type: "social",
                links: [],
                layout: "horizontal",
                iconSize: "small",
            },
        },
    ],
};

/**
 * All available templates
 */
export const pageTemplates: PageTemplate[] = [
    luxuryAgentTemplate,
    firstTimeBuyerTemplate,
    investorFocusedTemplate,
    simpleCleanTemplate,
    premiumShowcaseTemplate,
    modernMinimalTemplate,
];

/**
 * Get a template by ID
 */
export function getTemplateById(id: string): PageTemplate | undefined {
    return pageTemplates.find((t) => t.id === id);
}

/**
 * Apply a template to create a new page
 * Assigns proper IDs and order to blocks
 */
export function applyTemplate(
    template: PageTemplate,
    userId: string,
    slug: string
) {
    const blocks: PageBlock[] = template.blocks.map((block, index) => ({
        ...block,
        id: `block_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        order: index,
    }));

    return blocks;
}
