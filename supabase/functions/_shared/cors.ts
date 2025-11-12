/**
 * CORS Configuration for Edge Functions
 * Restricts cross-origin requests to approved domains only
 *
 * Security Fix: Replaces wildcard CORS ('*') with domain whitelist
 * Severity: CRITICAL
 */

const ALLOWED_ORIGINS = [
  'https://agentbio.net',
  'https://www.agentbio.net',
  // Add development origins only in non-production environments
  ...(Deno.env.get('ENVIRONMENT') === 'development'
    ? ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:4173']
    : [])
];

export interface CorsHeaders {
  'Access-Control-Allow-Origin': string;
  'Access-Control-Allow-Headers': string;
  'Access-Control-Allow-Credentials': string;
  'Access-Control-Allow-Methods'?: string;
  [key: string]: string | undefined;
}

/**
 * Get CORS headers for a request
 * @param requestOrigin - The Origin header from the request
 * @param allowMethods - Optional methods to allow (defaults to common methods)
 * @returns CORS headers object
 */
export function getCorsHeaders(
  requestOrigin: string | null,
  allowMethods?: string
): Record<string, string> {
  // Check if the request origin is in the allowed list
  const origin = requestOrigin && ALLOWED_ORIGINS.includes(requestOrigin)
    ? requestOrigin
    : ALLOWED_ORIGINS[0]; // Default to primary domain

  const headers: Record<string, string> = {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Credentials': 'true',
  };

  if (allowMethods) {
    headers['Access-Control-Allow-Methods'] = allowMethods;
  }

  return headers;
}

/**
 * Create a CORS preflight response
 * @param requestOrigin - The Origin header from the request
 * @returns Response object for OPTIONS request
 */
export function handleCorsPreFlight(requestOrigin: string | null): Response {
  return new Response('ok', {
    headers: getCorsHeaders(requestOrigin, 'GET, POST, PUT, DELETE, OPTIONS')
  });
}
