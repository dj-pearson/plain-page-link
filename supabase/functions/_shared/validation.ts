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

// Phone validation (allows international formats)
export function validatePhone(phone: string): boolean {
  const phoneRegex = /^[\d\s\-\(\)\+]{7,20}$/;
  return phoneRegex.test(phone);
}

// String length validation
export function validateStringLength(str: string, min: number, max: number): boolean {
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

// Sanitize string (remove potentially dangerous characters and XSS vectors)
export function sanitizeString(str: string): string {
  return str
    .trim()
    // Remove HTML tags and their contents for script/style
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    // Remove HTML tags
    .replace(/<[^>]*>/g, '')
    // Decode and remove HTML entities that could be used for XSS
    .replace(/&lt;/gi, '')
    .replace(/&gt;/gi, '')
    .replace(/&quot;/gi, '"')
    .replace(/&#x27;/gi, "'")
    .replace(/&#x2F;/gi, '/')
    .replace(/&amp;/gi, '&')
    // Remove javascript: and data: URLs
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '')
    .replace(/vbscript:/gi, '')
    // Remove event handlers (onclick, onerror, etc.)
    .replace(/on\w+\s*=/gi, '')
    .slice(0, 5000); // Hard limit
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
export function isValidWebhookUrl(url: string, allowedDomains: string[] = ['hooks.zapier.com', 'hook.us1.make.com', 'hook.eu1.make.com']): boolean {
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol.toLowerCase())) {
      return false;
    }
    // Check if the hostname matches any allowed domain
    return allowedDomains.some(domain =>
      parsed.hostname === domain || parsed.hostname.endsWith('.' + domain)
    );
  } catch {
    return false;
  }
}

// Lead data validation
export function validateLeadData(data: any): ValidationResult {
  const errors: string[] = [];

  // Required fields
  if (!data.name || !validateStringLength(data.name, 1, 100)) {
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
  
  if (data.message && !validateStringLength(data.message, 0, 2000)) {
    errors.push('Message must be less than 2000 characters');
  }
  
  if (data.property_address && !validateStringLength(data.property_address, 0, 500)) {
    errors.push('Property address must be less than 500 characters');
  }
  
  if (data.price_range && !validateStringLength(data.price_range, 0, 100)) {
    errors.push('Price range must be less than 100 characters');
  }
  
  if (data.timeline && !validateStringLength(data.timeline, 0, 100)) {
    errors.push('Timeline must be less than 100 characters');
  }
  
  if (data.referrer_url && !validateUrl(data.referrer_url)) {
    errors.push('Invalid referrer URL');
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
