/**
 * Page Builder Engine
 * Core functionality for the drag-and-drop page builder
 */

import {
    PageBlock,
    PageConfig,
    BlockType,
    BlockConfig,
    BlockTemplate,
} from "@/types/pageBuilder";
import { autoPopulateBlockConfig } from "./autoPopulateBlocks";

/**
 * Page Builder Engine
 * Manages page state, block operations, and persistence
 */
class PageBuilderEngine {
    /**
     * Create a new empty page
     */
    createNewPage(userId: string, slug: string): PageConfig {
        return {
            id: this.generateId(),
            userId,
            slug,
            title: "My Link-in-Bio Page",
            description: "Real Estate Professional",
            blocks: [],
            theme: this.getDefaultTheme(),
            seo: {
                title: "My Link-in-Bio Page",
                description: "Real Estate Professional",
                keywords: ["real estate", "agent", "properties"],
                twitterCard: "summary_large_image",
            },
            published: false,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
    }

    /**
     * Get default theme
     */
    private getDefaultTheme() {
        return {
            name: "Default",
            preset: "modern",
            colors: {
                primary: "#2563eb",
                secondary: "#10b981",
                background: "#ffffff",
                text: "#1f2937",
                accent: "#f59e0b",
            },
            fonts: {
                heading: "Inter",
                body: "Inter",
            },
            borderRadius: "medium" as const,
            spacing: "normal" as const,
        };
    }

    /**
     * Add a block to the page (with auto-population)
     */
    async addBlock(
        page: PageConfig,
        blockType: BlockType,
        position?: number,
        userId?: string
    ): Promise<PageConfig> {
        const template = this.getBlockTemplate(blockType);
        if (!template) {
            throw new Error(`Unknown block type: ${blockType}`);
        }

        // Auto-populate the config with user data if userId is provided
        let blockConfig = template.defaultConfig;
        if (userId) {
            blockConfig = await autoPopulateBlockConfig(
                template.defaultConfig,
                userId
            );
        }

        const newBlock: PageBlock = {
            id: this.generateId(),
            type: blockType,
            order: position !== undefined ? position : page.blocks.length,
            visible: true,
            config: blockConfig,
        };

        const updatedBlocks = [...page.blocks];
        if (position !== undefined) {
            // Insert at specific position
            updatedBlocks.splice(position, 0, newBlock);
            // Reorder all blocks
            updatedBlocks.forEach((block, index) => {
                block.order = index;
            });
        } else {
            updatedBlocks.push(newBlock);
        }

        return {
            ...page,
            blocks: updatedBlocks,
            updatedAt: new Date(),
        };
    }

    /**
     * Remove a block from the page
     */
    removeBlock(page: PageConfig, blockId: string): PageConfig {
        const updatedBlocks = page.blocks
            .filter((block) => block.id !== blockId)
            .map((block, index) => ({
                ...block,
                order: index,
            }));

        return {
            ...page,
            blocks: updatedBlocks,
            updatedAt: new Date(),
        };
    }

    /**
     * Update a block's configuration
     */
    updateBlock(
        page: PageConfig,
        blockId: string,
        config: Partial<BlockConfig>
    ): PageConfig {
        const updatedBlocks = page.blocks.map((block) =>
            block.id === blockId
                ? {
                      ...block,
                      config: { ...block.config, ...config },
                  }
                : block
        );

        return {
            ...page,
            blocks: updatedBlocks,
            updatedAt: new Date(),
        };
    }

    /**
     * Reorder blocks
     */
    reorderBlocks(
        page: PageConfig,
        sourceIndex: number,
        destinationIndex: number
    ): PageConfig {
        const updatedBlocks = [...page.blocks];
        const [movedBlock] = updatedBlocks.splice(sourceIndex, 1);
        updatedBlocks.splice(destinationIndex, 0, movedBlock);

        // Update order property
        updatedBlocks.forEach((block, index) => {
            block.order = index;
        });

        return {
            ...page,
            blocks: updatedBlocks,
            updatedAt: new Date(),
        };
    }

    /**
     * Toggle block visibility
     */
    toggleBlockVisibility(page: PageConfig, blockId: string): PageConfig {
        const updatedBlocks = page.blocks.map((block) =>
            block.id === blockId ? { ...block, visible: !block.visible } : block
        );

        return {
            ...page,
            blocks: updatedBlocks,
            updatedAt: new Date(),
        };
    }

    /**
     * Duplicate a block
     */
    duplicateBlock(page: PageConfig, blockId: string): PageConfig {
        const block = page.blocks.find((b) => b.id === blockId);
        if (!block) {
            return page;
        }

        const duplicatedBlock: PageBlock = {
            ...block,
            id: this.generateId(),
            order: block.order + 1,
        };

        const updatedBlocks = [...page.blocks];
        updatedBlocks.splice(block.order + 1, 0, duplicatedBlock);

        // Reorder all blocks after the duplicated one
        updatedBlocks.forEach((b, index) => {
            if (index > block.order) {
                b.order = index;
            }
        });

        return {
            ...page,
            blocks: updatedBlocks,
            updatedAt: new Date(),
        };
    }

    /**
     * Get available block templates
     */
    getBlockTemplates(): BlockTemplate[] {
        return [
            {
                type: "bio",
                name: "Bio Section",
                description: "Your profile and introduction",
                icon: "User",
                category: "content",
                defaultConfig: {
                    type: "bio",
                    title: "Your Name",
                    subtitle: "Real Estate Professional",
                    description:
                        "Helping clients find their dream homes in [Your City]. Licensed agent with [X] years of experience.",
                    showSocialLinks: true,
                    showContactButton: true,
                },
            },
            {
                type: "listings",
                name: "Property Listings",
                description: "Showcase your active listings",
                icon: "Home",
                category: "content",
                defaultConfig: {
                    type: "listings",
                    title: "Featured Properties",
                    layout: "grid",
                    filter: "active",
                    maxItems: 6,
                    showPrices: true,
                    showStatus: true,
                },
            },
            {
                type: "link",
                name: "Link Button",
                description: "Add a custom link",
                icon: "Link",
                category: "content",
                defaultConfig: {
                    type: "link",
                    title: "Click Here",
                    url: "https://example.com",
                    style: "button",
                    openInNewTab: true,
                },
            },
            {
                type: "contact",
                name: "Contact Form",
                description: "Let visitors reach out",
                icon: "Mail",
                category: "engagement",
                defaultConfig: {
                    type: "contact",
                    title: "Get In Touch",
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
                            placeholder: "How can I help you?",
                            required: true,
                        },
                    ],
                    submitButtonText: "Send Message",
                    successMessage: "Thank you! I'll get back to you soon.",
                },
            },
            {
                type: "social",
                name: "Social Links",
                description: "Connect on social media",
                icon: "Share2",
                category: "engagement",
                defaultConfig: {
                    type: "social",
                    title: "Follow Me",
                    links: [],
                    layout: "horizontal",
                    iconSize: "medium",
                },
            },
            {
                type: "video",
                name: "Video",
                description: "Embed a video",
                icon: "Video",
                category: "media",
                defaultConfig: {
                    type: "video",
                    title: "Watch My Introduction",
                    videoUrl: "",
                    autoplay: false,
                    muted: true,
                },
            },
            {
                type: "testimonial",
                name: "Testimonials",
                description: "Client reviews",
                icon: "MessageSquare",
                category: "content",
                defaultConfig: {
                    type: "testimonial",
                    title: "What Clients Say",
                    testimonials: [],
                    layout: "slider",
                },
            },
            {
                type: "spacer",
                name: "Spacer",
                description: "Add vertical space",
                icon: "MoveVertical",
                category: "content",
                defaultConfig: {
                    type: "spacer",
                    height: 40,
                },
            },
            {
                type: "image",
                name: "Image",
                description: "Add an image",
                icon: "Image",
                category: "media",
                defaultConfig: {
                    type: "image",
                    imageUrl: "",
                    alt: "Image",
                    size: "medium",
                },
            },
            {
                type: "text",
                name: "Text Block",
                description: "Add custom text",
                icon: "Type",
                category: "content",
                defaultConfig: {
                    type: "text",
                    content: "Your text here...",
                    align: "left",
                    fontSize: "medium",
                },
            },
            {
                type: "hero",
                name: "Hero Section",
                description: "Eye-catching header with CTA",
                icon: "Sparkles",
                category: "content",
                defaultConfig: {
                    type: "hero",
                    headline: "Your Dream Home Awaits",
                    subheadline: "Expert real estate guidance tailored to your goals",
                    backgroundOverlay: "gradient",
                    ctaText: "Get Started",
                    ctaUrl: "#contact",
                    layout: "centered",
                    height: "medium",
                },
            },
            {
                type: "stats",
                name: "Stats & Numbers",
                description: "Showcase your achievements",
                icon: "BarChart3",
                category: "content",
                defaultConfig: {
                    type: "stats",
                    title: "By The Numbers",
                    stats: [
                        { id: "s1", value: "150", label: "Homes Sold", icon: "home", suffix: "+" },
                        { id: "s2", value: "98", label: "Client Satisfaction", icon: "star", suffix: "%" },
                        { id: "s3", value: "15", label: "Years Experience", icon: "award", suffix: "+" },
                        { id: "s4", value: "50", label: "M in Sales", icon: "dollar", prefix: "$" },
                    ],
                    layout: "row",
                },
            },
            {
                type: "gallery",
                name: "Photo Gallery",
                description: "Showcase photos",
                icon: "Images",
                category: "media",
                defaultConfig: {
                    type: "gallery",
                    title: "Gallery",
                    images: [],
                    layout: "grid",
                    columns: 3,
                },
            },
            {
                type: "cta",
                name: "Call to Action",
                description: "Prominent action section",
                icon: "Megaphone",
                category: "engagement",
                defaultConfig: {
                    type: "cta",
                    headline: "Ready to Find Your Dream Home?",
                    description: "Let's start your journey together. Schedule a free consultation today.",
                    buttonText: "Schedule Consultation",
                    buttonUrl: "#contact",
                    variant: "gradient",
                    openInNewTab: false,
                },
            },
            {
                type: "divider",
                name: "Divider",
                description: "Visual separator",
                icon: "Minus",
                category: "layout",
                defaultConfig: {
                    type: "divider",
                    style: "gradient",
                },
            },
        ];
    }

    /**
     * Get a block template by type
     */
    private getBlockTemplate(type: BlockType): BlockTemplate | undefined {
        return this.getBlockTemplates().find((t) => t.type === type);
    }

    /**
     * Generate a unique ID
     */
    private generateId(): string {
        return `block_${Date.now()}_${Math.random()
            .toString(36)
            .substring(2, 9)}`;
    }

    /**
     * Validate page configuration
     */
    validatePage(page: PageConfig): {
        valid: boolean;
        errors: string[];
    } {
        const errors: string[] = [];

        // Check required fields
        if (!page.slug || page.slug.trim() === "") {
            errors.push("Page slug is required");
        }

        if (!page.title || page.title.trim() === "") {
            errors.push("Page title is required");
        }

        // Validate slug format (alphanumeric and hyphens only)
        if (!/^[a-z0-9-]+$/i.test(page.slug)) {
            errors.push(
                "Page slug must contain only letters, numbers, and hyphens"
            );
        }

        // Check for duplicate block IDs
        const blockIds = page.blocks.map((b) => b.id);
        const uniqueIds = new Set(blockIds);
        if (blockIds.length !== uniqueIds.size) {
            errors.push("Duplicate block IDs detected");
        }

        return {
            valid: errors.length === 0,
            errors,
        };
    }
}

// Singleton instance
export const pageBuilder = new PageBuilderEngine();

// Export helper functions
export const createNewPage = pageBuilder.createNewPage.bind(pageBuilder);
export const addBlock = pageBuilder.addBlock.bind(pageBuilder);
export const removeBlock = pageBuilder.removeBlock.bind(pageBuilder);
export const updateBlock = pageBuilder.updateBlock.bind(pageBuilder);
export const reorderBlocks = pageBuilder.reorderBlocks.bind(pageBuilder);
export const toggleBlockVisibility =
    pageBuilder.toggleBlockVisibility.bind(pageBuilder);
export const duplicateBlock = pageBuilder.duplicateBlock.bind(pageBuilder);
export const getBlockTemplates =
    pageBuilder.getBlockTemplates.bind(pageBuilder);
export const validatePage = pageBuilder.validatePage.bind(pageBuilder);
