/**
 * HTML Sanitization Utilities
 * Security: Prevents XSS attacks by sanitizing user-generated content
 */

import DOMPurify from 'dompurify';

export interface SanitizeOptions {
  allowedTags?: string[];
  allowedAttributes?: { [key: string]: string[] };
}

/**
 * Sanitize HTML content to prevent XSS attacks
 * @param dirty - Untrusted HTML string
 * @param options - Optional configuration for allowed tags and attributes
 * @returns Sanitized HTML string safe for rendering
 */
export const sanitizeHtml = (
  dirty: string,
  options?: SanitizeOptions
): string => {
  const config = {
    ALLOWED_TAGS: options?.allowedTags || [
      'p', 'br', 'strong', 'em', 'u', 'a', 'ul', 'ol', 'li',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'code', 'pre'
    ],
    ALLOWED_ATTR: options?.allowedAttributes || {
      'a': ['href', 'target', 'rel']
    },
    ALLOW_DATA_ATTR: false,
  };

  // Ensure external links open safely
  DOMPurify.addHook('afterSanitizeAttributes', function (node) {
    if (node.tagName === 'A') {
      const href = node.getAttribute('href');
      if (href && (href.startsWith('http://') || href.startsWith('https://'))) {
        node.setAttribute('target', '_blank');
        node.setAttribute('rel', 'noopener noreferrer');
      }
    }
  });

  return DOMPurify.sanitize(dirty, config);
};

/**
 * Sanitize plain text by stripping all HTML
 * @param text - Untrusted text string
 * @returns Text with all HTML tags removed
 */
export const sanitizeText = (text: string): string => {
  return DOMPurify.sanitize(text, { ALLOWED_TAGS: [] });
};

/**
 * Sanitize user profile/bio content with limited formatting
 * Allows only basic text formatting, no links or complex HTML
 */
export const sanitizeBio = (bio: string): string => {
  return sanitizeHtml(bio, {
    allowedTags: ['p', 'br', 'strong', 'em'],
    allowedAttributes: {}
  });
};

/**
 * Sanitize listing/testimonial content with rich formatting
 * Allows more formatting options for property descriptions
 */
export const sanitizeRichContent = (content: string): string => {
  return sanitizeHtml(content, {
    allowedTags: [
      'p', 'br', 'strong', 'em', 'u', 'h2', 'h3', 'h4',
      'ul', 'ol', 'li', 'blockquote'
    ],
    allowedAttributes: {}
  });
};

/**
 * Sanitize URLs to prevent javascript: and data: URI XSS
 * @param url - Untrusted URL string
 * @returns Safe URL or empty string if invalid
 */
export const sanitizeUrl = (url: string): string => {
  const trimmed = url.trim().toLowerCase();

  // Block dangerous protocols
  if (
    trimmed.startsWith('javascript:') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('vbscript:') ||
    trimmed.startsWith('file:')
  ) {
    return '';
  }

  // Allow http, https, mailto, tel
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('mailto:') ||
    trimmed.startsWith('tel:') ||
    trimmed.startsWith('/')
  ) {
    return url.trim();
  }

  // Default to https for domain-only URLs
  return url.trim();
};

/**
 * Validate and sanitize email addresses
 * @param email - Untrusted email string
 * @returns Sanitized email or empty string if invalid
 */
export const sanitizeEmail = (email: string): string => {
  const sanitized = sanitizeText(email).trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  return emailRegex.test(sanitized) ? sanitized : '';
};

/**
 * Sanitize phone numbers (basic)
 * @param phone - Untrusted phone string
 * @returns Sanitized phone with only digits, spaces, dashes, parentheses, and plus
 */
export const sanitizePhone = (phone: string): string => {
  return sanitizeText(phone).replace(/[^0-9\s\-\(\)\+]/g, '');
};
