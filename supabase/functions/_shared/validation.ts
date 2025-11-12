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

// Sanitize string (remove potentially dangerous characters)
export function sanitizeString(str: string): string {
  return str
    .trim()
    .replace(/[<>]/g, '') // Remove < and >
    .slice(0, 5000); // Hard limit
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
