/**
 * Image SEO Utilities
 *
 * Provides helpers for image optimization, alt text validation,
 * and structured data generation for images.
 */

/**
 * Validates alt text for SEO best practices
 * Returns an object with validation status and suggestions
 */
export function validateAltText(alt: string): {
  isValid: boolean;
  warnings: string[];
  suggestions: string[];
} {
  const warnings: string[] = [];
  const suggestions: string[] = [];

  // Check if alt text is empty
  if (!alt || alt.trim().length === 0) {
    warnings.push('Alt text is required for SEO and accessibility');
    return { isValid: false, warnings, suggestions };
  }

  const trimmedAlt = alt.trim();

  // Check for decorative image indicators
  if (trimmedAlt.toLowerCase() === 'image' || trimmedAlt.toLowerCase() === 'photo') {
    warnings.push('Alt text should describe the image content, not just say "image" or "photo"');
  }

  // Check for file names used as alt text
  if (/\.(jpg|jpeg|png|gif|webp|svg)$/i.test(trimmedAlt)) {
    warnings.push('Alt text appears to be a filename. Use descriptive text instead');
  }

  // Check minimum length
  if (trimmedAlt.length < 10) {
    suggestions.push('Consider using more descriptive alt text (at least 10 characters)');
  }

  // Check maximum length (125 characters is recommended)
  if (trimmedAlt.length > 125) {
    suggestions.push('Alt text is longer than 125 characters. Consider shortening for better SEO');
  }

  // Check for keyword stuffing (repeated words)
  const words = trimmedAlt.toLowerCase().split(/\s+/);
  const wordCounts: Record<string, number> = {};
  words.forEach(word => {
    if (word.length > 3) {
      wordCounts[word] = (wordCounts[word] || 0) + 1;
    }
  });
  const repeatedWords = Object.entries(wordCounts).filter(([, count]) => count > 2);
  if (repeatedWords.length > 0) {
    suggestions.push('Avoid repeating the same words in alt text');
  }

  // Check for starting with "image of" or "picture of"
  if (/^(image|picture|photo|graphic)\s+(of|showing)/i.test(trimmedAlt)) {
    suggestions.push('Avoid starting alt text with "image of" or "picture of" - describe the content directly');
  }

  return {
    isValid: warnings.length === 0,
    warnings,
    suggestions
  };
}

/**
 * Generates appropriate alt text for real estate images
 */
export function generatePropertyImageAlt(
  propertyTitle: string,
  imageType: 'exterior' | 'interior' | 'kitchen' | 'bathroom' | 'bedroom' | 'living' | 'backyard' | 'pool' | 'other',
  index?: number
): string {
  const typeDescriptions: Record<string, string> = {
    exterior: 'exterior view',
    interior: 'interior',
    kitchen: 'kitchen',
    bathroom: 'bathroom',
    bedroom: 'bedroom',
    living: 'living room',
    backyard: 'backyard',
    pool: 'pool area',
    other: 'view'
  };

  const description = typeDescriptions[imageType] || 'view';
  const indexSuffix = index !== undefined && index > 0 ? ` ${index + 1}` : '';

  return `${propertyTitle} - ${description}${indexSuffix}`;
}

/**
 * Generates alt text for agent profile photos
 */
export function generateAgentPhotoAlt(
  agentName: string,
  type: 'headshot' | 'professional' | 'casual' = 'professional'
): string {
  const typeDescriptions = {
    headshot: 'headshot photo',
    professional: 'professional portrait',
    casual: 'photo'
  };

  return `${agentName} - Real Estate Agent ${typeDescriptions[type]}`;
}

/**
 * Generates ImageObject schema for structured data
 */
export function generateImageSchema(
  imageUrl: string,
  alt: string,
  options?: {
    width?: number;
    height?: number;
    caption?: string;
    author?: string;
    datePublished?: string;
  }
): Record<string, unknown> {
  const schema: Record<string, unknown> = {
    '@type': 'ImageObject',
    'url': imageUrl,
    'name': alt,
    'contentUrl': imageUrl
  };

  if (options?.width) schema.width = options.width;
  if (options?.height) schema.height = options.height;
  if (options?.caption) schema.caption = options.caption;
  if (options?.author) {
    schema.author = {
      '@type': 'Person',
      'name': options.author
    };
  }
  if (options?.datePublished) schema.datePublished = options.datePublished;

  return schema;
}

/**
 * Checks if an image URL is likely to support WebP transformation
 */
export function supportsWebPTransformation(url: string): boolean {
  // Supabase storage URLs
  if (url.includes('.supabase.co/storage')) return true;

  // Cloudinary
  if (url.includes('cloudinary.com')) return true;

  // imgix
  if (url.includes('imgix.net')) return true;

  // Cloudflare Images
  if (url.includes('imagedelivery.net')) return true;

  return false;
}

/**
 * Transforms an image URL to WebP format if supported
 */
export function getWebPUrl(url: string): string | null {
  // Supabase storage
  if (url.includes('.supabase.co/storage')) {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}format=webp`;
  }

  // Cloudinary
  if (url.includes('cloudinary.com')) {
    // Insert f_webp transformation
    return url.replace('/upload/', '/upload/f_webp/');
  }

  // imgix
  if (url.includes('imgix.net')) {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}fm=webp`;
  }

  return null;
}

/**
 * Generates responsive image sizes attribute based on common breakpoints
 */
export function generateSizesAttribute(
  config: {
    mobile?: string;
    tablet?: string;
    desktop?: string;
    default?: string;
  }
): string {
  const parts: string[] = [];

  if (config.mobile) {
    parts.push(`(max-width: 640px) ${config.mobile}`);
  }
  if (config.tablet) {
    parts.push(`(max-width: 1024px) ${config.tablet}`);
  }
  if (config.desktop) {
    parts.push(`(max-width: 1280px) ${config.desktop}`);
  }

  parts.push(config.default || '100vw');

  return parts.join(', ');
}

/**
 * Common sizes presets for different use cases
 */
export const IMAGE_SIZES_PRESETS = {
  // Full-width hero images
  hero: '100vw',

  // Property listing cards in grid
  listingCard: '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',

  // Property gallery thumbnails
  thumbnail: '(max-width: 640px) 25vw, 10vw',

  // Agent profile photos
  avatar: '(max-width: 640px) 80px, 120px',

  // Blog post featured images
  blogFeatured: '(max-width: 640px) 100vw, (max-width: 1024px) 75vw, 50vw',

  // Social sharing images
  ogImage: '1200px'
} as const;

/**
 * Recommended image dimensions for different use cases
 */
export const RECOMMENDED_DIMENSIONS = {
  hero: { width: 1920, height: 1080 },
  listingCard: { width: 800, height: 600 },
  thumbnail: { width: 200, height: 150 },
  avatar: { width: 400, height: 400 },
  blogFeatured: { width: 1200, height: 630 },
  ogImage: { width: 1200, height: 630 }
} as const;
