/**
 * SEO Utilities
 * Structured data generation, sitemap creation, and SEO optimization
 */

import { PageConfig } from "@/types/pageBuilder";
import { getSafeOrigin } from "@/lib/utils";

/**
 * Breadcrumb item interface
 */
export interface BreadcrumbItem {
    name: string;
    url: string;
}

/**
 * Generate BreadcrumbList Schema
 * Helps Google understand site hierarchy and displays breadcrumbs in search results
 */
export const generateBreadcrumbSchema = (items: BreadcrumbItem[]): Record<string, any> => {
    const itemListElements = items.map((item, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "name": item.name,
        "item": item.url
    }));

    return {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": itemListElements
    };
};

/**
 * Generate Person Schema for Real Estate Agent
 */
export const generatePersonSchema = (page: PageConfig): Record<string, any> => {
    const bioBlock = page.blocks.find((b) => b.type === "bio");
    const contactBlock = page.blocks.find((b) => b.type === "contact");
    const socialBlock = page.blocks.find((b) => b.type === "social");

    const schema: Record<string, any> = {
        "@context": "https://schema.org",
        "@type": "Person",
        name: bioBlock?.config.title || page.title,
        jobTitle:
            (bioBlock as any)?.config.subtitle || "Real Estate Professional",
        description: (bioBlock as any)?.config.description || page.description,
        url: `${getSafeOrigin()}/p/${page.slug}`,
    };

    // Add image if available
    if ((bioBlock as any)?.config.avatarUrl) {
        schema.image = (bioBlock as any).config.avatarUrl;
    }

    // Add social media links
    if (socialBlock) {
        const socialLinks = (socialBlock as any).config.links || [];
        schema.sameAs = socialLinks.map((link: any) => link.url);
    }

    return schema;
};

/**
 * Generate RealEstateAgent Schema
 */
export const generateRealEstateAgentSchema = (
    page: PageConfig
): Record<string, any> => {
    const bioBlock = page.blocks.find((b) => b.type === "bio");
    const listingsBlock = page.blocks.find((b) => b.type === "listings");

    const schema: Record<string, any> = {
        "@context": "https://schema.org",
        "@type": "RealEstateAgent",
        name: bioBlock?.config.title || page.title,
        description: (bioBlock as any)?.config.description || page.description,
        url: `${getSafeOrigin()}/p/${page.slug}`,
    };

    // Add image if available
    if ((bioBlock as any)?.config.avatarUrl) {
        schema.image = (bioBlock as any).config.avatarUrl;
    }

    // Add number of listings
    if (listingsBlock) {
        schema.numberOfAvailableAccommodations =
            (listingsBlock as any).config.maxItems || 0;
    }

    return schema;
};

/**
 * Generate LocalBusiness Schema
 */
export const generateLocalBusinessSchema = (
    page: PageConfig,
    businessInfo: {
        businessName?: string;
        address?: string;
        city?: string;
        state?: string;
        zip?: string;
        phone?: string;
        email?: string;
    }
): Record<string, any> => {
    const schema: Record<string, any> = {
        "@context": "https://schema.org",
        "@type": "RealEstateAgent",
        name: businessInfo.businessName || page.title,
        description: page.description,
        url: `${getSafeOrigin()}/p/${page.slug}`,
    };

    // Add address if available
    if (businessInfo.address && businessInfo.city && businessInfo.state) {
        schema.address = {
            "@type": "PostalAddress",
            streetAddress: businessInfo.address,
            addressLocality: businessInfo.city,
            addressRegion: businessInfo.state,
            postalCode: businessInfo.zip || "",
            addressCountry: "US",
        };
    }

    // Add contact information
    if (businessInfo.phone) {
        schema.telephone = businessInfo.phone;
    }
    if (businessInfo.email) {
        schema.email = businessInfo.email;
    }

    return schema;
};

/**
 * Generate enhanced Organization Schema with social signals
 * Includes social media profiles, contact info, and ratings for Knowledge Graph optimization
 */
export const generateEnhancedOrganizationSchema = (): Record<string, any> => {
    const baseUrl = getSafeOrigin();

    return {
        "@context": "https://schema.org",
        "@type": "Organization",
        "@id": `${baseUrl}/#organization`,
        "name": "AgentBio",
        "legalName": "AgentBio Intelligence",
        "url": baseUrl,
        "logo": {
            "@type": "ImageObject",
            "url": `${baseUrl}/logo.png`,
            "width": "512",
            "height": "512"
        },
        "image": `${baseUrl}/Cover.png`,
        "description": "AI-powered real estate agent bio page builder. Purpose-built platform for real estate professionals to showcase properties, capture leads, and convert Instagram followers into clients.",
        "foundingDate": "2024",
        "slogan": "Transform Instagram followers into qualified leads",
        "contactPoint": {
            "@type": "ContactPoint",
            "contactType": "Customer Service",
            "email": "support@agentbio.net",
            "url": `${baseUrl}/contact`,
            "availableLanguage": ["English"]
        },
        "sameAs": [
            "https://twitter.com/agentbio",
            "https://www.facebook.com/agentbio",
            "https://www.linkedin.com/company/agentbio",
            "https://www.instagram.com/agentbio",
            "https://www.youtube.com/@agentbio",
            "https://github.com/agentbio"
        ],
        "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.8",
            "reviewCount": "523",
            "bestRating": "5",
            "worstRating": "1"
        },
        "areaServed": {
            "@type": "Country",
            "name": "United States"
        }
    };
};

/**
 * Generate enhanced LocalBusiness Schema for homepage/landing page
 * Optimized for local SEO with comprehensive business information
 */
export const generateEnhancedLocalBusinessSchema = (): Record<string, any> => {
    const baseUrl = getSafeOrigin();

    return {
        "@context": "https://schema.org",
        "@type": "ProfessionalService",
        "name": "AgentBio",
        "description": "AI-powered real estate agent bio page builder. Purpose-built platform for real estate professionals to showcase properties, capture leads, and convert Instagram followers into clients.",
        "url": baseUrl,
        "logo": {
            "@type": "ImageObject",
            "url": `${baseUrl}/logo.png`
        },
        "image": `${baseUrl}/Cover.png`,
        "priceRange": "$$$",
        "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.8",
            "reviewCount": "523",
            "bestRating": "5",
            "worstRating": "1"
        },
        "areaServed": {
            "@type": "Country",
            "name": "United States"
        },
        "serviceType": "Real Estate Marketing Software",
        "provider": {
            "@type": "Organization",
            "name": "AgentBio"
        },
        "offers": {
            "@type": "Offer",
            "price": "39",
            "priceCurrency": "USD",
            "priceValidUntil": "2025-12-31",
            "availability": "https://schema.org/InStock",
            "url": `${baseUrl}/pricing`
        }
    };
};

/**
 * Generate all structured data for a page
 */
export const generateStructuredData = (
    page: PageConfig
): Record<string, any> => {
    // Combine multiple schemas using @graph
    const schemas = [
        generatePersonSchema(page),
        generateRealEstateAgentSchema(page),
    ];

    return {
        "@context": "https://schema.org",
        "@graph": schemas,
    };
};

/**
 * Generate sitemap XML for all published pages
 */
export const generateSitemap = (pages: PageConfig[]): string => {
    const publishedPages = pages.filter((p) => p.published);
    const baseUrl = getSafeOrigin();

    const urlEntries = publishedPages
        .map(
            (page) => `
  <url>
    <loc>${baseUrl}/p/${page.slug}</loc>
    <lastmod>${new Date(page.updatedAt).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`
        )
        .join("");

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${urlEntries}
</urlset>`;
};

/**
 * Generate robots.txt content
 */
export const generateRobotsTxt = (sitemapUrl: string): string => {
    return `User-agent: *
Allow: /

Sitemap: ${sitemapUrl}`;
};

/**
 * Validate SEO requirements
 */
export const validateSEO = (
    page: PageConfig
): { valid: boolean; warnings: string[]; suggestions: string[] } => {
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Check title length (50-60 chars is optimal)
    if (!page.seo.title || page.seo.title.length === 0) {
        warnings.push("SEO title is missing");
    } else if (page.seo.title.length < 30) {
        suggestions.push("SEO title is too short (< 30 chars)");
    } else if (page.seo.title.length > 60) {
        warnings.push("SEO title is too long (> 60 chars)");
    }

    // Check description length (150-160 chars is optimal)
    if (!page.seo.description || page.seo.description.length === 0) {
        warnings.push("SEO description is missing");
    } else if (page.seo.description.length < 120) {
        suggestions.push("SEO description is too short (< 120 chars)");
    } else if (page.seo.description.length > 160) {
        warnings.push("SEO description is too long (> 160 chars)");
    }

    // Check keywords
    if (!page.seo.keywords || page.seo.keywords.length === 0) {
        suggestions.push("Add keywords for better SEO");
    } else if (page.seo.keywords.length < 3) {
        suggestions.push("Add more keywords (at least 3)");
    }

    // Check OG image
    if (!page.seo.ogImage) {
        suggestions.push("Add an Open Graph image for social media sharing");
    }

    // Check for Bio block (important for personal pages)
    const hasBioBlock = page.blocks.some((b) => b.type === "bio");
    if (!hasBioBlock) {
        suggestions.push("Add a Bio block for better SEO");
    }

    return {
        valid: warnings.length === 0,
        warnings,
        suggestions,
    };
};

/**
 * Generate social media preview
 */
export const generateSocialPreview = (page: PageConfig) => {
    const bioBlock = page.blocks.find((b) => b.type === "bio") as any;

    return {
        title: page.seo.title || page.title,
        description: page.seo.description || page.description,
        image:
            page.seo.ogImage ||
            bioBlock?.config?.avatarUrl ||
            "/default-og-image.png",
        url: `${getSafeOrigin()}/p/${page.slug}`,
        siteName: "AgentBio",
        twitterCard: page.seo.twitterCard || "summary_large_image",
    };
};

/**
 * Generate canonical URL
 */
export const generateCanonicalUrl = (slug: string): string => {
    return `${getSafeOrigin()}/p/${slug}`;
};

/**
 * Generate meta tags for SEO
 */
export const generateMetaTags = (page: PageConfig): string[] => {
    const tags: string[] = [];
    const preview = generateSocialPreview(page);

    // Basic meta tags
    tags.push(`<title>${preview.title}</title>`);
    tags.push(`<meta name="description" content="${preview.description}" />`);
    tags.push(
        `<meta name="keywords" content="${page.seo.keywords.join(", ")}" />`
    );

    // Canonical URL
    tags.push(
        `<link rel="canonical" href="${generateCanonicalUrl(page.slug)}" />`
    );

    // Open Graph tags
    tags.push(`<meta property="og:title" content="${preview.title}" />`);
    tags.push(
        `<meta property="og:description" content="${preview.description}" />`
    );
    tags.push(`<meta property="og:image" content="${preview.image}" />`);
    tags.push(`<meta property="og:url" content="${preview.url}" />`);
    tags.push(`<meta property="og:type" content="website" />`);
    tags.push(`<meta property="og:site_name" content="${preview.siteName}" />`);

    // Twitter Card tags
    tags.push(`<meta name="twitter:card" content="${preview.twitterCard}" />`);
    tags.push(`<meta name="twitter:title" content="${preview.title}" />`);
    tags.push(
        `<meta name="twitter:description" content="${preview.description}" />`
    );
    tags.push(`<meta name="twitter:image" content="${preview.image}" />`);

    return tags;
};

/**
 * Optimize page title for SEO
 */
export const optimizeTitle = (title: string): string => {
    // Remove extra whitespace
    let optimized = title.trim().replace(/\s+/g, " ");

    // Capitalize first letter
    optimized = optimized.charAt(0).toUpperCase() + optimized.slice(1);

    // Truncate if too long
    if (optimized.length > 60) {
        optimized = optimized.substring(0, 57) + "...";
    }

    return optimized;
};

/**
 * Optimize description for SEO
 */
export const optimizeDescription = (description: string): string => {
    // Remove extra whitespace
    let optimized = description.trim().replace(/\s+/g, " ");

    // Truncate if too long
    if (optimized.length > 160) {
        optimized = optimized.substring(0, 157) + "...";
    }

    return optimized;
};
