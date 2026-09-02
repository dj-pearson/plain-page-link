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
  const headers: Record<string, string> = {
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  // No Origin header means a server-to-server caller — a webhook, a cron
  // invocation, curl. Those do not read ACAO, so omit the header entirely
  // rather than answering '*'. Sending '*' told every browser on the internet
  // that these endpoints were fair game the moment a request reached them
  // without an Origin, which is exactly the shape of a request an attacker
  // controls (US-123).
  if (requestOrigin) {
    // An origin outside the whitelist gets the canonical origin back, which
    // its browser will reject — the request is refused, not silently allowed.
    headers['Access-Control-Allow-Origin'] = ALLOWED_ORIGINS.includes(requestOrigin)
      ? requestOrigin
      : ALLOWED_ORIGINS[0];
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
