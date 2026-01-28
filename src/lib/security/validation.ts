/**
 * Security Layer: Input Validation & Sanitization
 *
 * Validates and sanitizes all user input before processing.
 * This is a cross-cutting concern that applies to all layers.
 *
 * Responsibilities:
 * - Sanitize HTML content (prevent XSS)
 * - Validate input formats
 * - Enforce length limits
 * - Validate UUIDs and other identifiers
 */

import DOMPurify from 'dompurify';
import { logger } from '@/lib/logger';
import type { ValidationResult, ValidationRules, SecurityViolation } from './types';

// ============================================================
// DOMPurify Configuration
// ============================================================

// Configure DOMPurify for strict sanitization
const DOMPURIFY_CONFIG: DOMPurify.Config = {
  ALLOWED_TAGS: [
    'b',
    'i',
    'em',
    'strong',
    'a',
    'p',
    'br',
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
  ],
  ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
  ALLOW_DATA_ATTR: false,
  ADD_ATTR: ['target'], // Allow target="_blank" for links
  FORBID_TAGS: ['script', 'style', 'iframe', 'form', 'input', 'object', 'embed'],
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'style'],
};

// Stricter config for plain text fields (no HTML allowed)
const PLAIN_TEXT_CONFIG: DOMPurify.Config = {
  ALLOWED_TAGS: [],
  ALLOWED_ATTR: [],
};

// ============================================================
// Core Sanitization Functions
// ============================================================

/**
 * Sanitize HTML content, allowing safe tags
 */
export function sanitizeHtml(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return DOMPurify.sanitize(input, DOMPURIFY_CONFIG);
}

/**
 * Strip all HTML tags, returning plain text only
 */
export function stripHtml(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return DOMPurify.sanitize(input, PLAIN_TEXT_CONFIG);
}

/**
 * Sanitize a string for use in URLs (removes dangerous characters)
 */
export function sanitizeUrl(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Remove javascript: and data: protocols
  const dangerous = /^(javascript|data|vbscript):/i;
  if (dangerous.test(input.trim())) {
    logValidationViolation('url_sanitization', 'Dangerous URL protocol detected', input);
    return '';
  }

  // Basic URL encoding for safety
  try {
    const url = new URL(input);
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(url.protocol)) {
      return '';
    }
    return url.toString();
  } catch {
    // If it's a relative URL, allow it after sanitizing
    return encodeURI(input);
  }
}

/**
 * Sanitize a filename (remove path traversal, dangerous chars)
 */
export function sanitizeFilename(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Remove path traversal attempts
  let clean = input.replace(/\.\./g, '');

  // Remove dangerous characters
  clean = clean.replace(/[\/\\:*?"<>|]/g, '');

  // Limit length
  clean = clean.substring(0, 255);

  return clean.trim();
}

// ============================================================
// Validation Functions
// ============================================================

/**
 * Validate a UUID format
 */
export function isValidUUID(input: string): boolean {
  if (!input || typeof input !== 'string') {
    return false;
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(input);
}

/**
 * Validate and sanitize a resource ID
 * Throws if invalid to prevent IDOR attempts
 */
export function validateResourceId(input: string, resourceName: string = 'resource'): string {
  if (!isValidUUID(input)) {
    logValidationViolation('invalid_resource_id', `Invalid ${resourceName} ID format`, input);
    throw new ValidationError(`Invalid ${resourceName} ID format`);
  }

  return input;
}

/**
 * Validate email format
 */
export function isValidEmail(input: string): boolean {
  if (!input || typeof input !== 'string') {
    return false;
  }

  // RFC 5322 compliant email regex (simplified)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(input) && input.length <= 254;
}

/**
 * Validate phone number format (basic validation)
 */
export function isValidPhone(input: string): boolean {
  if (!input || typeof input !== 'string') {
    return false;
  }

  // Allow digits, spaces, dashes, parentheses, and plus sign
  const phoneRegex = /^[\d\s\-\(\)\+]+$/;
  return phoneRegex.test(input) && input.replace(/\D/g, '').length >= 7;
}

/**
 * Validate a string against rules
 */
export function validateString(
  input: string | null | undefined,
  rules: ValidationRules
): ValidationResult<string> {
  const errors: string[] = [];
  let sanitized: string | null = null;

  // Handle null/undefined
  if (input === null || input === undefined) {
    if (rules.required) {
      errors.push('This field is required');
    }
    return { isValid: errors.length === 0, sanitized: null, errors };
  }

  // Type check
  if (typeof input !== 'string') {
    errors.push('Value must be a string');
    return { isValid: false, sanitized: null, errors };
  }

  // Sanitize if requested
  let value = input;
  if (rules.sanitize) {
    value = rules.allowHtml ? sanitizeHtml(input) : stripHtml(input);
  }

  // Check required
  if (rules.required && value.trim().length === 0) {
    errors.push('This field is required');
  }

  // Check min length
  if (rules.minLength && value.length < rules.minLength) {
    errors.push(`Minimum length is ${rules.minLength} characters`);
  }

  // Check max length
  if (rules.maxLength && value.length > rules.maxLength) {
    errors.push(`Maximum length is ${rules.maxLength} characters`);
    value = value.substring(0, rules.maxLength);
  }

  // Check pattern
  if (rules.pattern && !rules.pattern.test(value)) {
    errors.push('Invalid format');
  }

  sanitized = value;

  return {
    isValid: errors.length === 0,
    sanitized,
    errors,
  };
}

/**
 * Validate an object's fields against rules
 */
export function validateObject<T extends Record<string, unknown>>(
  input: T,
  fieldRules: Record<keyof T, ValidationRules>
): ValidationResult<T> {
  const errors: string[] = [];
  const sanitized: Record<string, unknown> = {};

  for (const [field, rules] of Object.entries(fieldRules) as [keyof T, ValidationRules][]) {
    const value = input[field];

    if (typeof value === 'string' || value === null || value === undefined) {
      const result = validateString(value as string | null | undefined, rules);
      if (!result.isValid) {
        errors.push(`${String(field)}: ${result.errors.join(', ')}`);
      }
      sanitized[field as string] = result.sanitized;
    } else {
      sanitized[field as string] = value;
    }
  }

  return {
    isValid: errors.length === 0,
    sanitized: sanitized as T,
    errors,
  };
}

// ============================================================
// Input Sanitization for Common Fields
// ============================================================

/**
 * Sanitize user profile input
 */
export function sanitizeProfileInput(input: {
  username?: string;
  full_name?: string;
  bio?: string;
}): typeof input {
  return {
    username: input.username ? stripHtml(input.username).substring(0, 50) : undefined,
    full_name: input.full_name ? stripHtml(input.full_name).substring(0, 100) : undefined,
    bio: input.bio ? sanitizeHtml(input.bio).substring(0, 500) : undefined,
  };
}

/**
 * Sanitize listing input
 */
export function sanitizeListingInput(input: {
  address?: string;
  city?: string;
  price?: string;
  status?: string;
}): typeof input {
  return {
    address: input.address ? stripHtml(input.address).substring(0, 200) : undefined,
    city: input.city ? stripHtml(input.city).substring(0, 100) : undefined,
    price: input.price ? stripHtml(input.price).substring(0, 50) : undefined,
    status: input.status
      ? ['active', 'pending', 'sold'].includes(input.status)
        ? input.status
        : 'active'
      : undefined,
  };
}

/**
 * Sanitize lead input
 */
export function sanitizeLeadInput(input: {
  name?: string;
  email?: string;
  phone?: string;
  message?: string;
  source?: string;
}): typeof input {
  return {
    name: input.name ? stripHtml(input.name).substring(0, 100) : undefined,
    email: input.email ? stripHtml(input.email).substring(0, 254).toLowerCase() : undefined,
    phone: input.phone ? stripHtml(input.phone).substring(0, 20) : undefined,
    message: input.message ? sanitizeHtml(input.message).substring(0, 1000) : undefined,
    source: input.source ? stripHtml(input.source).substring(0, 50) : undefined,
  };
}

/**
 * Sanitize link input
 */
export function sanitizeLinkInput(input: {
  title?: string;
  url?: string;
  icon?: string;
}): typeof input {
  return {
    title: input.title ? stripHtml(input.title).substring(0, 100) : undefined,
    url: input.url ? sanitizeUrl(input.url) : undefined,
    icon: input.icon ? stripHtml(input.icon).substring(0, 50) : undefined,
  };
}

// ============================================================
// SQL Injection Prevention
// ============================================================

/**
 * Validate that a string doesn't contain SQL injection patterns
 * Note: This is a secondary defense - always use parameterized queries!
 */
export function containsSqlInjection(input: string): boolean {
  if (!input || typeof input !== 'string') {
    return false;
  }

  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|TRUNCATE)\b)/i,
    /(-{2}|\/\*|\*\/)/,
    /(;.*--)/,
    /(\bOR\b.*=.*)/i,
    /(\bAND\b.*=.*)/i,
    /(WAITFOR\s+DELAY)/i,
    /(BENCHMARK\s*\()/i,
    /(SLEEP\s*\()/i,
  ];

  return sqlPatterns.some((pattern) => pattern.test(input));
}

/**
 * Validate input doesn't contain SQL injection (throws if detected)
 */
export function validateNoSqlInjection(input: string, fieldName: string = 'input'): void {
  if (containsSqlInjection(input)) {
    logValidationViolation('sql_injection_attempt', `SQL injection pattern detected in ${fieldName}`, input);
    throw new ValidationError('Invalid input detected');
  }
}

// ============================================================
// XSS Prevention
// ============================================================

/**
 * Check if a string contains potential XSS patterns
 */
export function containsXssPatterns(input: string): boolean {
  if (!input || typeof input !== 'string') {
    return false;
  }

  const xssPatterns = [
    /<script\b[^>]*>/i,
    /javascript:/i,
    /on\w+\s*=/i, // onclick, onerror, etc.
    /data:/i,
    /vbscript:/i,
    /<iframe\b/i,
    /<object\b/i,
    /<embed\b/i,
    /<form\b/i,
  ];

  return xssPatterns.some((pattern) => pattern.test(input));
}

// ============================================================
// Rate Limiting Helpers
// ============================================================

/**
 * Simple in-memory rate limiter for client-side throttling
 */
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

/**
 * Check if an action is rate limited
 */
export function isRateLimited(
  key: string,
  maxAttempts: number,
  windowMs: number
): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || entry.resetAt < now) {
    // Start new window
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }

  if (entry.count >= maxAttempts) {
    return true;
  }

  entry.count++;
  return false;
}

/**
 * Reset rate limit for a key
 */
export function resetRateLimit(key: string): void {
  rateLimitStore.delete(key);
}

// ============================================================
// Security Violation Logging
// ============================================================

function logValidationViolation(type: string, details: string, input?: string): void {
  const violation: SecurityViolation = {
    type: 'input_validation',
    action: type,
    details,
    timestamp: new Date(),
  };

  logger.warn('Input validation violation', {
    type,
    details,
    // Truncate input for logging to prevent log injection
    inputPreview: input?.substring(0, 100),
  });
}

// ============================================================
// Custom Error Classes
// ============================================================

/**
 * Validation error - thrown when input validation fails
 */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}
