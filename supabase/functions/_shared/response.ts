/**
 * Standardized Response Helpers for Edge Functions
 *
 * All edge functions should use these helpers for consistent API responses.
 * Format: { success: boolean, data?: any, error?: { code: string, message: string, details?: any } }
 *
 * Error Code Conventions (RESOURCE_ACTION_REASON):
 * ─────────────────────────────────────────────────
 * AUTH_LOGIN_RATE_LIMITED      - Too many login attempts
 * AUTH_LOGIN_INVALID           - Invalid credentials
 * AUTH_TOKEN_EXPIRED           - JWT token expired
 * AUTH_TOKEN_MISSING           - No authorization header
 * AUTH_SESSION_INVALID         - Invalid or revoked session
 * AUTH_MFA_REQUIRED            - MFA verification needed
 * AUTH_MFA_INVALID             - Invalid MFA code
 * LEAD_CREATE_VALIDATION       - Lead submission validation failed
 * LEAD_CREATE_RATE_LIMITED     - Too many lead submissions
 * LEAD_CREATE_DUPLICATE        - Duplicate lead detected
 * LISTING_CREATE_VALIDATION    - Listing validation failed
 * LISTING_UPDATE_FORBIDDEN     - Not authorized to update listing
 * ARTICLE_GENERATE_FAILED      - AI article generation failed
 * ARTICLE_GENERATE_QUOTA       - Article generation quota exceeded
 * SEO_AUDIT_VALIDATION         - SEO audit request validation failed
 * SEO_AUDIT_FAILED             - SEO audit execution failed
 * CONTENT_ANALYZE_FAILED       - Content analysis failed
 * PAYMENT_CHECKOUT_FAILED      - Stripe checkout session creation failed
 * PAYMENT_WEBHOOK_INVALID      - Invalid Stripe webhook signature
 * EMAIL_SEND_FAILED            - Email delivery failed
 * UPLOAD_FILE_VALIDATION       - File upload validation failed
 * UPLOAD_FILE_TOO_LARGE        - File exceeds size limit
 * RESOURCE_NOT_FOUND           - Requested resource not found
 * REQUEST_VALIDATION_FAILED    - General request validation error
 * REQUEST_METHOD_NOT_ALLOWED   - HTTP method not allowed
 * INTERNAL_SERVER_ERROR        - Unexpected server error
 * RATE_LIMIT_EXCEEDED          - General rate limit exceeded
 */

import { getCorsHeaders } from './cors.ts';

/**
 * Standard API response shape
 */
interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/**
 * Return a successful JSON response
 * @param data - Response payload
 * @param req - Request object (for CORS headers)
 * @param status - HTTP status code (default 200)
 */
export function successResponse<T>(data: T, req: Request, status: number = 200): Response {
  const corsHeaders = getCorsHeaders(req.headers.get('origin'));
  const body: ApiResponse<T> = { success: true, data };

  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

/**
 * Return a standardized error JSON response
 * @param message - User-facing error message
 * @param code - Machine-readable error code (RESOURCE_ACTION_REASON)
 * @param req - Request object (for CORS headers)
 * @param status - HTTP status code (default 400)
 * @param details - Optional additional error context
 */
export function errorResponse(
  message: string,
  code: string,
  req: Request,
  status: number = 400,
  details?: unknown
): Response {
  const corsHeaders = getCorsHeaders(req.headers.get('origin'));
  const body: ApiResponse = {
    success: false,
    error: { code, message, ...(details !== undefined && { details }) },
  };

  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

/**
 * Return a validation error response (400) with field-level details
 * @param errors - Validation error details (field-level or array of messages)
 * @param req - Request object (for CORS headers)
 */
export function validationError(
  errors: Record<string, string> | string[],
  req: Request
): Response {
  return errorResponse(
    'Validation failed',
    'REQUEST_VALIDATION_FAILED',
    req,
    400,
    errors
  );
}

/**
 * Return a rate limit error response (429) with Retry-After header
 * @param message - User-facing message
 * @param retryAfterSeconds - Seconds until rate limit resets
 * @param req - Request object (for CORS headers)
 */
export function rateLimitResponse(
  retryAfterSeconds: number,
  req: Request,
  message: string = 'Too many requests. Please try again later.'
): Response {
  const corsHeaders = getCorsHeaders(req.headers.get('origin'));
  const body: ApiResponse = {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message,
      details: { retryAfter: retryAfterSeconds },
    },
  };

  return new Response(JSON.stringify(body), {
    status: 429,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
      'Retry-After': String(retryAfterSeconds),
    },
  });
}

/**
 * Return a 401 Unauthorized response
 * @param req - Request object (for CORS headers)
 * @param message - Optional custom message
 */
export function unauthorizedResponse(
  req: Request,
  message: string = 'Authentication required'
): Response {
  return errorResponse(message, 'AUTH_TOKEN_MISSING', req, 401);
}

/**
 * Return a 404 Not Found response
 * @param resource - Name of the resource that was not found
 * @param req - Request object (for CORS headers)
 */
export function notFoundResponse(resource: string, req: Request): Response {
  return errorResponse(`${resource} not found`, 'RESOURCE_NOT_FOUND', req, 404);
}

/**
 * Return a 405 Method Not Allowed response
 * @param req - Request object (for CORS headers)
 * @param allowed - Allowed HTTP methods
 */
export function methodNotAllowedResponse(req: Request, allowed: string[] = ['POST']): Response {
  const corsHeaders = getCorsHeaders(req.headers.get('origin'));
  const body: ApiResponse = {
    success: false,
    error: {
      code: 'REQUEST_METHOD_NOT_ALLOWED',
      message: `Method not allowed. Use: ${allowed.join(', ')}`,
    },
  };

  return new Response(JSON.stringify(body), {
    status: 405,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
      Allow: allowed.join(', '),
    },
  });
}

/**
 * Catch-all error handler for unexpected exceptions.
 * Logs the full error server-side, returns a sanitized response to the client.
 * @param error - Caught error
 * @param req - Request object (for CORS headers)
 */
export function handleUnexpectedError(error: unknown, req: Request): Response {
  console.error('[UnexpectedError]', {
    message: error instanceof Error ? error.message : 'Unknown error',
    stack: error instanceof Error ? error.stack : undefined,
    timestamp: new Date().toISOString(),
  });

  return errorResponse(
    'An unexpected error occurred',
    'INTERNAL_SERVER_ERROR',
    req,
    500
  );
}
