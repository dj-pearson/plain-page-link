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
  'https://api.agentbio.net',
  'https://functions.agentbio.net',
  // Webhook and automation platforms
  'https://hook.us1.make.com',
  'https://hook.eu1.make.com',
  'https://hook.eu2.make.com',
  'https://hook.integromat.com',
  // Add development origins only in non-production environments
  ...(Deno.env.get('ENVIRONMENT') === 'development'
    ? ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:4173', 'http://localhost:8080']
    : [])
];

/**
 * Default CORS headers for simple responses
 * Use getCorsHeaders() for dynamic origin handling
 */
export const corsHeaders = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGINS[0],
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

export interface CorsHeaders {
  'Access-Control-Allow-Origin': string;
  'Access-Control-Allow-Headers': string;
  'Access-Control-Allow-Credentials': string;
  'Access-Control-Allow-Methods'?: string;
  [key: string]: string | undefined;
}

/**
 * Get CORS headers for a request
 * @param requestOrigin - The Origin header from the request (null for non-browser requests like webhooks)
 * @param allowMethods - Optional methods to allow (defaults to common methods)
 * @returns CORS headers object
 */
export function getCorsHeaders(
  requestOrigin: string | null,
  allowMethods?: string
): Record<string, string> {
  // For webhook/server-to-server requests (no Origin header), use wildcard
  // For browser requests, validate against whitelist
  const origin = requestOrigin 
    ? (ALLOWED_ORIGINS.includes(requestOrigin) ? requestOrigin : ALLOWED_ORIGINS[0])
    : '*'; // Allow webhooks without Origin header

  const headers: Record<string, string> = {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  // Only set credentials for browser requests with specific origin
  if (origin !== '*') {
    headers['Access-Control-Allow-Credentials'] = 'true';
  }

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
