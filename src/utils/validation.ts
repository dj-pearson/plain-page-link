/**
 * Validation schemas and utilities
 * Security: Enforces strong password policy (12+ chars)
 */

import { z } from 'zod';

/**
 * Password validation schema with security requirements
 * - Minimum 12 characters
 * - Must contain lowercase letters
 * - Must contain uppercase letters
 * - Must contain numbers
 * - Must contain special characters
 */
export const passwordSchema = z
  .string()
  .min(12, 'Password must be at least 12 characters')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/\d/, 'Password must contain at least one number')
  .regex(/[^a-zA-Z\d]/, 'Password must contain at least one special character');

/**
 * Email validation schema
 */
export const emailSchema = z
  .string()
  .email('Please enter a valid email address')
  .min(1, 'Email is required');

/**
 * Username validation schema
 * - 3-30 characters
 * - Alphanumeric, underscore, and hyphen only
 */
export const usernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(30, 'Username must be at most 30 characters')
  .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens');

/**
 * Sign up form validation schema
 */
export const signUpSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string().min(1, 'Please confirm your password'),
  username: usernameSchema,
  fullName: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

/**
 * Sign in form validation schema
 */
export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

/**
 * Password reset form validation schema
 */
export const passwordResetSchema = z.object({
  password: passwordSchema,
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

/**
 * Type exports for form data
 */
export type SignUpFormData = z.infer<typeof signUpSchema>;
export type SignInFormData = z.infer<typeof signInSchema>;
export type PasswordResetFormData = z.infer<typeof passwordResetSchema>;

/**
 * XSS Prevention Utilities
 * From AUTH_SETUP_DOCUMENTATION.md security best practices
 */

/**
 * Sanitize HTML content to prevent XSS attacks
 * Removes script tags, event handlers, and dangerous attributes
 * 
 * @param html - Untrusted HTML content
 * @returns Sanitized HTML string
 */
export function sanitizeHTML(html: string): string {
  if (!html || typeof html !== 'string') return '';

  // Remove script tags and their content
  let sanitized = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove event handlers (onclick, onerror, etc.)
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*[^\s>]*/gi, '');
  
  // Remove javascript: protocol
  sanitized = sanitized.replace(/javascript:/gi, '');
  
  // Remove data: protocol (can be used for XSS)
  sanitized = sanitized.replace(/data:text\/html/gi, '');
  
  return sanitized.trim();
}

/**
 * Sanitize general input to prevent XSS and SQL injection
 * Removes HTML tags and dangerous characters
 * 
 * @param input - Untrusted user input
 * @returns Sanitized string
 */
export function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') return '';

  // Remove all HTML tags
  let sanitized = input.replace(/<[^>]*>/g, '');
  
  // Remove potential SQL injection patterns
  sanitized = sanitized.replace(/['";\\]/g, '');
  
  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');
  
  return sanitized.trim();
}

/**
 * Sanitize email to prevent email header injection
 * 
 * @param email - Email address
 * @returns Sanitized email
 */
export function sanitizeEmail(email: string): string {
  if (!email || typeof email !== 'string') return '';

  // Remove newlines and carriage returns (email header injection)
  let sanitized = email.replace(/[\r\n]/g, '');
  
  // Remove any whitespace
  sanitized = sanitized.trim();
  
  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(sanitized)) {
    return '';
  }
  
  return sanitized.toLowerCase();
}

/**
 * Sanitize URL to prevent open redirect and XSS attacks
 * Only allows http, https, mailto, and tel protocols
 * 
 * @param url - URL to sanitize
 * @returns Sanitized URL or empty string if invalid
 */
export function sanitizeURL(url: string): string {
  if (!url || typeof url !== 'string') return '';

  const trimmed = url.trim();
  
  // Remove dangerous protocols
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
  const lowerUrl = trimmed.toLowerCase();
  
  for (const protocol of dangerousProtocols) {
    if (lowerUrl.startsWith(protocol)) {
      return '';
    }
  }
  
  // Only allow safe protocols
  const safeProtocols = ['http://', 'https://', 'mailto:', 'tel:', '/'];
  const isAllowed = safeProtocols.some(protocol => 
    lowerUrl.startsWith(protocol) || (protocol === '/' && trimmed.startsWith('/'))
  );
  
  if (!isAllowed) {
    return '';
  }
  
  // For relative URLs, ensure they don't start with //
  if (trimmed.startsWith('/') && trimmed.startsWith('//')) {
    return '';
  }
  
  return trimmed;
}

/**
 * Sanitize filename to prevent directory traversal attacks
 * 
 * @param filename - Filename to sanitize
 * @returns Safe filename
 */
export function sanitizeFilename(filename: string): string {
  if (!filename || typeof filename !== 'string') return '';

  // Remove directory traversal attempts
  let sanitized = filename.replace(/\.\./g, '');
  
  // Remove path separators
  sanitized = sanitized.replace(/[\/\\]/g, '');
  
  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');
  
  // Only allow alphanumeric, dash, underscore, and dot
  sanitized = sanitized.replace(/[^a-zA-Z0-9._-]/g, '_');
  
  return sanitized.trim();
}