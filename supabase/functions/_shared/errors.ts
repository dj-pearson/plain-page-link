/**
 * Error Handling Utilities for Edge Functions
 * Security: Prevents information disclosure through error messages
 */

import { getCorsHeaders } from './cors.ts';

/**
 * Application error with user-friendly message
 */
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public userMessage?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
  }
}

/**
 * Validation error
 */
export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 400, 'Invalid request data', details);
    this.name = 'ValidationError';
  }
}

/**
 * Authentication error
 */
export class AuthError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, 'Authentication required');
    this.name = 'AuthError';
  }
}

/**
 * Authorization error
 */
export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403, 'Access denied');
    this.name = 'ForbiddenError';
  }
}

/**
 * Not found error
 */
export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, `${resource} not found`);
    this.name = 'NotFoundError';
  }
}

/**
 * Rate limit error
 */
export class RateLimitError extends AppError {
  constructor(public resetAt: number) {
    super('Rate limit exceeded', 429, 'Too many requests. Please try again later.');
    this.name = 'RateLimitError';
  }
}

/**
 * Handle errors and return appropriate Response
 * SECURITY: Sanitizes error messages to prevent info disclosure
 *
 * @param error - Error object
 * @param req - Request object (for CORS headers)
 * @returns Response with sanitized error
 */
export function handleError(error: unknown, req: Request): Response {
  const corsHeaders = getCorsHeaders(req.headers.get('origin'));

  // Log full error server-side (appears in Supabase logs)
  console.error('[Error]', {
    error,
    message: error instanceof Error ? error.message : 'Unknown error',
    stack: error instanceof Error ? error.stack : undefined,
    timestamp: new Date().toISOString(),
  });

  // Return user-friendly error
  if (error instanceof AppError) {
    const body = {
      error: error.userMessage || error.message,
      code: error.statusCode,
      ...(error instanceof RateLimitError && {
        resetAt: error.resetAt,
        retryAfter: Math.ceil((error.resetAt - Date.now()) / 1000),
      }),
    };

    return new Response(JSON.stringify(body), {
      status: error.statusCode,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        ...(error instanceof RateLimitError && {
          'Retry-After': String(Math.ceil((error.resetAt - Date.now()) / 1000)),
        }),
      },
    });
  }

  // Generic error for unexpected exceptions (don't leak internals)
  return new Response(
    JSON.stringify({
      error: 'An unexpected error occurred',
      code: 500,
    }),
    {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    }
  );
}

/**
 * Success response helper
 * @param data - Response data
 * @param req - Request object (for CORS headers)
 * @param status - HTTP status code
 * @returns Response
 */
export function successResponse(
  data: unknown,
  req: Request,
  status: number = 200
): Response {
  const corsHeaders = getCorsHeaders(req.headers.get('origin'));

  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}
