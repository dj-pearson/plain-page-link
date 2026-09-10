// Input validation schemas for edge functions
// Using a simple validation approach since zod is not available in Deno by default

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

// Email validation
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
}

/**
 * Phone validation (US-197).
 *
 * This was a character allow-list: /^[\d\s\-()+]{7,20}$/. Every one of the four
 * public lead forms validates phone client-side as `z.string().min(10)`, so a
 * visitor could type a number the browser accepted and the server then refused
 * — and a refused submission reaches them as a failed form, not as "try a
 * different format". These were all rejected:
 *
 *     555.123.4567          dots, which is how a great many people write it
 *     555-123-4567 x12      an extension, which agents ask for
 *     (555) 123–4567        an en dash, which iOS and Word insert for you
 *
 * A lost lead is the expensive error here; a slightly odd string in a text
 * column is not. So the rule is what actually matters — enough digits to be a
 * phone number, not so many that it is something else — plus a check that the
 * rest is punctuation a person plausibly wrote, rather than prose.
 */

/** A trailing extension, in the forms people write. Checked separately. */
const PHONE_EXTENSION = /(?:[,;]|\b(?:ext|extn|extension|x))\.?\s*\d{1,6}\s*$/i;

/** Digits, spaces, and the separators a written phone number uses — Unicode
 *  dashes included, because a phone keyboard and a word processor both produce
 *  them without being asked. */
const PHONE_BODY = /^[\d\s().+/\-\u2010-\u2015\u2212]+$/;

export function validatePhone(phone: unknown): boolean {
  if (typeof phone !== 'string') return false;
  if (phone.length > 40) return false;

  const body = phone.replace(PHONE_EXTENSION, '').trim();
  if (!PHONE_BODY.test(body)) return false;

  // E.164 allows at most 15 digits; 7 is the shortest national number in use.
  const digits = (body.match(/\d/g) ?? []).length;
  return digits >= 7 && digits <= 15;
}

/**
 * String length validation.
 *
 * `unknown`, not `string`: this called `.trim()` on whatever it was handed, so
 * a request with `"name": 12345` threw a TypeError inside validateLeadData and
 * the caller got a 500 instead of "Name must be between 1 and 100 characters".
 * A validator that crashes on invalid input is not validating it (US-197).
 */
export function validateStringLength(str: unknown, min: number, max: number): boolean {
  if (typeof str !== 'string') return false;
  const trimmed = str.trim();
  return trimmed.length >= min && trimmed.length <= max;
}

// URL validation
export function validateUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// UUID validation — accepts any RFC 4122 version, which is what Postgres does.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function validateUuid(value: unknown): boolean {
  return typeof value === 'string' && UUID_RE.test(value);
}

/**
 * Patterns that must not survive sanitisation, applied to a fixed point.
 *
 * A single pass over a blacklist can be made to reconstruct the thing it
 * removes, because the replacement joins the text on either side of the match:
 *
 *     'dadata:ta:'            -> removes the inner 'data:'       -> 'data:'
 *     'javajavascript:script:' -> removes the inner 'javascript:' -> 'javascript:'
 *
 * Nothing renders this output unescaped today — every email template goes
 * through escapeHtml, and React escapes the dashboard — so this was defence in
 * depth rather than a live hole. A sanitiser that can be talked out of its own
 * rule is still not one worth keeping (US-197).
 */
const DANGEROUS: RegExp[] = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi,
  /<[^>]*>/g,
  /&lt;/gi,
  /&gt;/gi,
  /javascript:/gi,
  /data:/gi,
  /vbscript:/gi,
  /on\w+\s*=/gi,
];

/** Entities that are decoded rather than dropped: they are ordinary text. */
const DECODE: Array<[RegExp, string]> = [
  [/&quot;/gi, '"'],
  [/&#x27;/gi, "'"],
  [/&#x2F;/gi, '/'],
  [/&amp;/gi, '&'],
];

/** Bound on the fixpoint loop, so a pathological input cannot spin. */
const MAX_SANITIZE_PASSES = 8;

// Sanitize string (remove potentially dangerous characters and XSS vectors)
export function sanitizeString(str: unknown): string {
  // Same reason as validateStringLength: this is reached with whatever was in
  // the request body, and `.trim()` on a number threw (US-197).
  if (typeof str !== 'string') return '';

  let out = str.trim();
  for (let pass = 0; pass < MAX_SANITIZE_PASSES; pass++) {
    const before = out;
    for (const pattern of DANGEROUS) out = out.replace(pattern, '');
    if (out === before) break;
  }

  for (const [pattern, replacement] of DECODE) out = out.replace(pattern, replacement);

  // Decoding can reveal a token that was hidden behind an entity, so the
  // dangerous set gets one more look afterwards.
  for (let pass = 0; pass < MAX_SANITIZE_PASSES; pass++) {
    const before = out;
    for (const pattern of DANGEROUS) out = out.replace(pattern, '');
    if (out === before) break;
  }

  return out.slice(0, 5000); // Hard limit
}

// Validate that a URL is safe (not javascript:, data:, or other dangerous protocols)
export function isValidSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const safeProtocols = ['http:', 'https:'];
    return safeProtocols.includes(parsed.protocol.toLowerCase());
  } catch {
    return false;
  }
}

// SSRF-safe URL validation: only public http(s) URLs, blocking private /
// loopback / link-local ranges and internal hostnames. Use this before any
// server-side fetch() of a user-supplied URL.
export function isPublicFetchableUrl(url: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }

  if (!['http:', 'https:'].includes(parsed.protocol.toLowerCase())) {
    return false;
  }

  const host = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, '');

  // Block obvious internal hostnames
  if (
    host === 'localhost' ||
    host === '0.0.0.0' ||
    host.endsWith('.localhost') ||
    host.endsWith('.local') ||
    host.endsWith('.internal') ||
    host === 'metadata.google.internal'
  ) {
    return false;
  }

  // IPv4 literal checks
  const ipv4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4) {
    const [a, b] = [Number(ipv4[1]), Number(ipv4[2])];
    if (ipv4.slice(1).some((o) => Number(o) > 255)) return false;
    if (a === 10) return false; // 10.0.0.0/8
    if (a === 127) return false; // loopback
    if (a === 0) return false; // 0.0.0.0/8
    if (a === 169 && b === 254) return false; // link-local / cloud metadata
    if (a === 172 && b >= 16 && b <= 31) return false; // 172.16.0.0/12
    if (a === 192 && b === 168) return false; // 192.168.0.0/16
    if (a === 100 && b >= 64 && b <= 127) return false; // CGNAT 100.64.0.0/10
    if (a >= 224) return false; // multicast / reserved
  }

  // IPv6 loopback / unique-local / link-local
  if (host === '::1' || host === '::' ) return false;
  if (host.startsWith('fc') || host.startsWith('fd')) return false; // fc00::/7 ULA
  if (host.startsWith('fe80')) return false; // link-local
  // IPv4-mapped IPv6 targeting metadata (e.g. ::ffff:169.254.169.254)
  if (host.includes('169.254.169.254') || host.includes('127.0.0.1')) return false;

  return true;
}

// Validate webhook URL against allowed domains (for SSRF prevention)
/**
 * Whether a URL is an accepted webhook destination.
 *
 * The allow-list is the control, not the SSRF guard: a guard proves a URL is
 * not internal, this proves it is one of the two integrations the product
 * actually supports. Both are applied (US-119).
 *
 * https only. A webhook carries lead PII to a third party, and every
 * destination on this list serves https; permitting http meant that payload
 * could be sent in clear text.
 *
 * `hook.*.make.com` rather than two named regions: Make assigns regional
 * hostnames (us1, us2, eu1, eu2 …) and a hard-coded pair silently rejected
 * agents in the others.
 */
export function isValidWebhookUrl(
  url: string,
  allowedDomains: string[] = ['hooks.zapier.com']
): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol.toLowerCase() !== 'https:') {
      return false;
    }

    const host = parsed.hostname.toLowerCase();

    // Credentials in the URL are a redirect trick and never legitimate here.
    if (parsed.username || parsed.password) {
      return false;
    }

    if (/^hook\.[a-z0-9-]+\.make\.com$/.test(host)) {
      return true;
    }

    return allowedDomains.some(
      (domain) => host === domain.toLowerCase() || host.endsWith('.' + domain.toLowerCase())
    );
  } catch {
    return false;
  }
}

// Lead data validation
/**
 * The bounds validateLeadData enforces, named rather than scattered through it.
 *
 * They were literals in the comparisons below, and no client knew them. Not one
 * of the four public lead forms had a single `.max()` on any field, so a buyer
 * writing more than 2000 characters about what they are looking for — which a
 * motivated one does — passed client validation, pressed Send, and got a
 * generic failure with nothing to act on. Their message was gone (US-198).
 *
 * src/lib/leadFieldLimits.ts carries the same numbers for the browser. The two
 * cannot import each other — one is Deno, one is bundled by Vite — so
 * src/lib/leadFieldLimits.test.ts imports both and fails if they drift.
 */
export const LEAD_FIELD_LIMITS = {
  name: { min: 1, max: 100 },
  email: { max: 255 },
  message: { min: 0, max: 2000 },
  property_address: { min: 0, max: 500 },
  price_range: { min: 0, max: 100 },
  timeline: { min: 0, max: 100 },
} as const;

export function validateLeadData(data: any): ValidationResult {
  const errors: string[] = [];

  // Required fields
  if (!data.name || !validateStringLength(data.name, LEAD_FIELD_LIMITS.name.min, LEAD_FIELD_LIMITS.name.max)) {
    errors.push('Name must be between 1 and 100 characters');
  }
  
  if (!data.email || !validateEmail(data.email)) {
    errors.push('Invalid email address');
  }
  
  if (!data.lead_type || !['buyer', 'seller', 'valuation', 'contact'].includes(data.lead_type)) {
    errors.push('Invalid lead type');
  }
  
  if (!data.user_id || typeof data.user_id !== 'string') {
    errors.push('Invalid user ID');
  }

  // Optional fields validation
  if (data.phone && !validatePhone(data.phone)) {
    errors.push('Invalid phone number format');
  }
  
  if (data.message && !validateStringLength(data.message, LEAD_FIELD_LIMITS.message.min, LEAD_FIELD_LIMITS.message.max)) {
    errors.push('Message must be less than 2000 characters');
  }
  
  if (data.property_address && !validateStringLength(data.property_address, LEAD_FIELD_LIMITS.property_address.min, LEAD_FIELD_LIMITS.property_address.max)) {
    errors.push('Property address must be less than 500 characters');
  }
  
  if (data.price_range && !validateStringLength(data.price_range, LEAD_FIELD_LIMITS.price_range.min, LEAD_FIELD_LIMITS.price_range.max)) {
    errors.push('Price range must be less than 100 characters');
  }
  
  if (data.timeline && !validateStringLength(data.timeline, LEAD_FIELD_LIMITS.timeline.min, LEAD_FIELD_LIMITS.timeline.max)) {
    errors.push('Timeline must be less than 100 characters');
  }
  
  if (data.referrer_url && !validateUrl(data.referrer_url)) {
    errors.push('Invalid referrer URL');
  }

  // `preapproved` is a boolean column. A string reached it for a year and
  // Postgres coerced 'yes' while raising 22P02 on 'in-process', 'not-yet' and
  // 'cash' — a database error surfaced to the visitor as "Submission Failed"
  // rather than a validation message (US-096). Rejecting it here means the
  // next caller that gets the type wrong is told so.
  if (data.preapproved !== undefined && typeof data.preapproved !== 'boolean') {
    errors.push('Pre-approval status must be a boolean');
  }

  // listing_id is a uuid FK to listings. Anything else is a 22P02 from the
  // insert, for the same reason.
  if (data.listing_id !== undefined && !validateUuid(data.listing_id)) {
    errors.push('Invalid listing ID');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// Contact form validation
export function validateContactData(data: any): ValidationResult {
  const errors: string[] = [];

  if (!data.name || !validateStringLength(data.name, 1, 100)) {
    errors.push('Name must be between 1 and 100 characters');
  }
  
  if (!data.email || !validateEmail(data.email)) {
    errors.push('Invalid email address');
  }
  
  if (data.phone && !validatePhone(data.phone)) {
    errors.push('Invalid phone number format');
  }
  
  if (data.message && !validateStringLength(data.message, 0, 2000)) {
    errors.push('Message must be less than 2000 characters');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// Get client IP from request
export function getClientIP(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0] || 
         req.headers.get('x-real-ip') || 
         'unknown';
}

/**
 * Public review submission (US-113).
 *
 * The RLS policy added in 20260808000004 carries the same bounds as a backstop
 * for the direct anon insert; these are the messages a visitor can act on.
 * `client_email` is deliberately absent — the review page used to require an
 * address "for verification only" that no column stored and nothing verified.
 */
export function validateReviewData(data: any): ValidationResult {
  const errors: string[] = [];

  if (!validateUuid(data?.user_id)) {
    errors.push('Invalid agent ID');
  }

  if (!data?.client_name || !validateStringLength(String(data.client_name), 1, 100)) {
    errors.push('Name must be between 1 and 100 characters');
  }

  if (!data?.review || !validateStringLength(String(data.review), 1, 2000)) {
    errors.push('Review must be between 1 and 2000 characters');
  }

  // Number, not numeric-string: `rating` is an integer column, and '5' reaches
  // it as a 22P02 the visitor sees as a generic failure.
  if (!Number.isInteger(data?.rating) || data.rating < 1 || data.rating > 5) {
    errors.push('Rating must be a whole number between 1 and 5');
  }

  if (
    data?.transaction_type !== undefined &&
    !['buyer', 'seller', 'both'].includes(data.transaction_type)
  ) {
    errors.push('Invalid transaction type');
  }

  if (data?.client_title && !validateStringLength(String(data.client_title), 0, 100)) {
    errors.push('Title must be less than 100 characters');
  }

  if (data?.property_type && !validateStringLength(String(data.property_type), 0, 100)) {
    errors.push('Property type must be less than 100 characters');
  }

  return { valid: errors.length === 0, errors };
}
