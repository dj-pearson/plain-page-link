/**
 * HTML Sanitization Utilities
 * Security: Prevents XSS attacks by sanitizing user-generated content
 */

import DOMPurify from 'dompurify';

export interface SanitizeOptions {
  allowedTags?: string[];
  /**
   * A flat list of attribute names, e.g. ['href', 'target', 'rel'].
   *
   * This was typed (and defaulted) as a per-tag map, `{ a: ['href', ...] }`.
   * DOMPurify has no such option: it reads ALLOWED_ATTR through addToSet,
   * which returns early on anything that is not an array. The map therefore
   * produced an EMPTY allowed-attribute set, so sanitizeHtml stripped every
   * attribute — href included — and the afterSanitizeAttributes hook below
   * found no href to act on. Nothing imports sanitizeHtml today (only
   * sanitizeUrl is used), so this never shipped as a live defect; it would
   * have bitten the first caller.
   */
  allowedAttributes?: string[];
}

const DEFAULT_ALLOWED_TAGS = [
  'p',
  'br',
  'strong',
  'em',
  'u',
  'a',
  'ul',
  'ol',
  'li',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'blockquote',
  'code',
  'pre',
];

const DEFAULT_ALLOWED_ATTR = ['href', 'target', 'rel'];

/**
 * Registered once at module scope.
 *
 * This used to be inside sanitizeHtml. DOMPurify.addHook appends rather than
 * replaces, so every call added another copy of the same hook and they ran
 * cumulatively — unbounded growth on any render path that sanitizes.
 */
DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node.nodeName === 'A') {
    const href = node.getAttribute('href');
    if (href && (href.startsWith('http://') || href.startsWith('https://'))) {
      node.setAttribute('target', '_blank');
      node.setAttribute('rel', 'noopener noreferrer');
    }
  }
});

/**
 * Sanitize HTML content to prevent XSS attacks
 * @param dirty - Untrusted HTML string
 * @param options - Optional configuration for allowed tags and attributes
 * @returns Sanitized HTML string safe for rendering
 */
export const sanitizeHtml = (dirty: string, options?: SanitizeOptions): string => {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: options?.allowedTags ?? DEFAULT_ALLOWED_TAGS,
    ALLOWED_ATTR: options?.allowedAttributes ?? DEFAULT_ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
  });
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
    allowedAttributes: [],
  });
};

/**
 * Sanitize listing/testimonial content with rich formatting
 * Allows more formatting options for property descriptions
 */
export const sanitizeRichContent = (content: string): string => {
  return sanitizeHtml(content, {
    allowedTags: ['p', 'br', 'strong', 'em', 'u', 'h2', 'h3', 'h4', 'ul', 'ol', 'li', 'blockquote'],
    allowedAttributes: [],
  });
};

/**
 * Schemes an agent-supplied URL may use. Everything else — javascript:,
 * data:, vbscript:, file:, blob:, intent:, … — is refused by omission rather
 * than by a deny-list, because a deny-list only blocks the spellings someone
 * thought of.
 */
const SAFE_URL_PROTOCOLS = new Set(['http:', 'https:', 'mailto:', 'tel:']);

/**
 * What the WHATWG URL parser silently discards before it reads a scheme:
 * leading/trailing C0 control characters and spaces, and every ASCII tab or
 * newline anywhere in the string. We strip the same characters first, so the
 * string we inspect is the string the browser will navigate to.
 */
// eslint-disable-next-line no-control-regex
const C0_OR_SPACE_EDGES = /^[\u0000- ]+|[\u0000- ]+$/g;
const TAB_OR_NEWLINE = /[\t\n\r]/g;

/** "zillow.com/me" or "www.example.com:8080/x" — a host with no scheme. */
const BARE_HOST =
  /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)*\.[a-z]{2,}(?::\d{1,5})?(?:[/?#]|$)/i;

/**
 * Sanitize an untrusted URL for use as an href or a navigation target.
 *
 * US-268: this used to lowercase and trim the input and test it with
 * startsWith('javascript:'). The URL parser strips tabs and newlines inside
 * the scheme and C0 control characters around it, so "java\tscript:alert(1)"
 * and "\u0001javascript:alert(1)" sailed through and came back unchanged —
 * and the page builder's LinkBlock and CTABlock assign the result to
 * window.location.href on the agent's public profile. Anything unrecognised
 * was also returned as-is, so "zillow.com/me" became a relative link to
 * agentbio.net/zillow.com/me, and "//evil.example" passed the "starts with /"
 * test as a protocol-relative URL to another host.
 *
 * Now the value is cleaned the way the browser cleans it, then parsed, and
 * only http(s), mailto and tel survive. A same-site path ("/blog") and a
 * same-page fragment ("#contact") are kept; a bare host gets https:// in front.
 *
 * @param url - Untrusted URL string
 * @returns A safe URL, or an empty string when the input must not be used
 */
export const sanitizeUrl = (url: string | null | undefined): string => {
  if (typeof url !== 'string') return '';
  const cleaned = url.replace(C0_OR_SPACE_EDGES, '').replace(TAB_OR_NEWLINE, '');
  if (!cleaned) return '';

  // A same-site path. "//host" and "/\host" are protocol-relative URLs to
  // another origin (browsers read a backslash as a slash), so not paths.
  if (cleaned.startsWith('/')) {
    return /^\/[/\\]/.test(cleaned) ? '' : cleaned;
  }

  // A same-page fragment ("#contact", the page-builder CTA default). It
  // cannot change the scheme or the origin, so it is kept as-is.
  if (cleaned.startsWith('#')) return cleaned;

  let candidate = '';
  if (/^[a-z][a-z0-9+.-]*:/i.test(cleaned) && !BARE_HOST.test(cleaned)) {
    candidate = cleaned;
  } else if (BARE_HOST.test(cleaned)) {
    candidate = `https://${cleaned}`;
  }
  if (!candidate) return '';

  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    return '';
  }
  if (!SAFE_URL_PROTOCOLS.has(parsed.protocol)) return '';
  if ((parsed.protocol === 'http:' || parsed.protocol === 'https:') && !parsed.hostname) {
    return '';
  }
  return candidate;
};

/**
 * sanitizeUrl, restricted to links that leave the site: http(s) only. For the
 * agent's link-in-bio rows, social profiles and virtual tours, where a path on
 * agentbio.net or a mailto: is not what the field holds.
 */
export const sanitizeExternalUrl = (url: string | null | undefined): string => {
  const safe = sanitizeUrl(url);
  return /^https?:\/\//i.test(safe) ? safe : '';
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
