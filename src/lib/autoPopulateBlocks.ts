/**
 * Auto-populate Block Configurations
 * Automatically fills block configurations with user data from their profile, links, and listings
 */

import { supabase } from "@/integrations/supabase/client";
import {
    BlockConfig,
    BioBlockConfig,
    SocialBlockConfig,
    ListingsBlockConfig,
    ContactBlockConfig,
    SocialLink,
} from "@/types/pageBuilder";

/**
 * Fetches user profile data
 */
async function fetchUserProfile(userId: string) {
    const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

    if (error) {
        console.error("Error fetching profile:", error);
        return null;
    }

    return data;
}

/**
 * Fetches user links (converted to social links format)
 */
async function fetchUserLinks(userId: string) {
    const { data, error } = await supabase
        .from("links")
        .select("*")
        .eq("user_id", userId)
        .eq("is_active", true)
        .order("position");

    if (error) {
        console.error("Error fetching links:", error);
        return [];
    }

    return data || [];
}

/**
 * Detects social platform from URL
 */
function detectSocialPlatform(url: string): SocialLink["platform"] | null {
    const urlLower = url.toLowerCase();

    if (urlLower.includes("instagram.com")) return "instagram";
    if (urlLower.includes("facebook.com")) return "facebook";
    if (urlLower.includes("twitter.com") || urlLower.includes("x.com")) return "twitter";
    if (urlLower.includes("linkedin.com")) return "linkedin";
    if (urlLower.includes("youtube.com")) return "youtube";
    if (urlLower.includes("tiktok.com")) return "tiktok";
    if (urlLower.includes("zillow.com")) return "zillow";
    if (urlLower.includes("realtor.com")) return "realtor";

    return null;
}

/**
 * Converts user links to social links format
 */
function convertToSocialLinks(links: any[]): SocialLink[] {
    return links
        .map((link) => {
            const platform = detectSocialPlatform(link.url);
            if (!platform) return null;

            return {
                id: link.id,
                platform,
                url: link.url,
                username: link.title,
            };
        })
        .filter((link): link is SocialLink => link !== null);
}

/**
 * Auto-populates a Bio block with user profile data
 */
async function autoPopulateBioBlock(
    defaultConfig: BioBlockConfig,
    userId: string
): Promise<BioBlockConfig> {
    const profile = await fetchUserProfile(userId);

    if (!profile) return defaultConfig;

    return {
        ...defaultConfig,
        title: profile.full_name || profile.username || defaultConfig.title,
        subtitle: defaultConfig.subtitle,
        description: profile.bio || defaultConfig.description,
        avatarUrl: profile.avatar_url || defaultConfig.avatarUrl,
    };
}

/**
 * Auto-populates a Social block with user's social links
 */
async function autoPopulateSocialBlock(
    defaultConfig: SocialBlockConfig,
    userId: string
): Promise<SocialBlockConfig> {
    const links = await fetchUserLinks(userId);
    const socialLinks = convertToSocialLinks(links);

    // If user has social links, use them; otherwise return empty for manual entry
    if (socialLinks.length > 0) {
        return {
            ...defaultConfig,
            links: socialLinks,
        };
    }

    return defaultConfig;
}

/**
 * Auto-populates a Listings block (config only, data fetched at render time)
 */
async function autoPopulateListingsBlock(
    defaultConfig: ListingsBlockConfig,
    userId: string
): Promise<ListingsBlockConfig> {
    // Listings block pulls data dynamically at render time
    // We just ensure the config is set correctly
    return {
        ...defaultConfig,
        title: "My Featured Properties",
        filter: "active", // Show active listings by default
        maxItems: 6,
    };
}

/**
 * Auto-populates a Contact block with user email
 */
async function autoPopulateContactBlock(
    defaultConfig: ContactBlockConfig,
    userId: string
): Promise<ContactBlockConfig> {
    // Contact form fields are already set up well in default config
    // Could potentially add user's email as a mailto or hidden field
    return defaultConfig;
}

/**
 * Main auto-population function
 * Takes a default block config and enriches it with user data
 */
export async function autoPopulateBlockConfig(
    defaultConfig: BlockConfig,
    userId: string
): Promise<BlockConfig> {
    try {
        switch (defaultConfig.type) {
            case "bio":
                return await autoPopulateBioBlock(defaultConfig, userId);

            case "social":
                return await autoPopulateSocialBlock(defaultConfig, userId);

            case "listings":
                return await autoPopulateListingsBlock(defaultConfig, userId);

            case "contact":
                return await autoPopulateContactBlock(defaultConfig, userId);

            // Other block types don't need auto-population
            default:
                return defaultConfig;
        }
    } catch (error) {
        console.error("Error auto-populating block:", error);
        // Fall back to default config on error
        return defaultConfig;
    }
}

/**
 * Checks if user has any data to auto-populate
 * Returns helpful hints for what's missing
 */
export async function getUserDataStatus(userId: string) {
    const [profile, links] = await Promise.all([
        fetchUserProfile(userId),
        fetchUserLinks(userId),
    ]);

    const socialLinks = convertToSocialLinks(links);

    return {
        hasProfile: !!profile,
        hasFullName: !!(profile?.full_name),
        hasBio: !!(profile?.bio),
        hasAvatar: !!(profile?.avatar_url),
        hasSocialLinks: socialLinks.length > 0,
        socialLinkCount: socialLinks.length,
        suggestions: [] as string[],
    };
}
