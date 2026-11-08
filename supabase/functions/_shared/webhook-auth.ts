/**
 * Webhook & API Key Authentication
 * Supports external services like Make.com, Zapier, n8n, etc.
 *
 * Security: Validates API keys for server-to-server communication. The key
 * rules themselves live in api-auth.ts; this module only decides how an API
 * key and a JWT combine.
 */

import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import { authenticateApiKey, extractApiKey } from './api-auth.ts';
import { unauthorized } from './http-error.ts';

/**
 * Validate the API key on a request (`Authorization: Bearer ab_…`,
 * `x-api-key`, or a prefixed `apikey`).
 *
 * US-432: this delegates to authenticateApiKey in api-auth.ts, which owns
 * every rule (prefix, hash lookup, revoked_at, is_active, expiry). It used to
 * repeat the lookup with its own rules, which drifted: it was the copy that
 * kept honouring revoked keys until US-377.
 *
 * @param req - Request object
 * @param supabase - A service-role client (the lookup bypasses RLS)
 * @returns The key's owner, or null when no key was presented. Throws a 401
 *   when a key was presented and is not usable.
 */
export async function validateApiKey(
  req: Request,
  supabase: SupabaseClient
): Promise<{ user_id: string; key_name: string } | null> {
  if (!extractApiKey(req)) return null;

  const auth = await authenticateApiKey(req, supabase);
  if (!auth) {
    throw unauthorized('Unauthorized: Invalid API key', 'AUTH_SESSION_INVALID');
  }
  return { user_id: auth.userId, key_name: auth.keyName };
}

/**
 * Flexible authentication - supports both JWT and API key
 * Use this for functions that can be called from web app or webhooks
 * @param req - Request object
 * @param supabase - Service-role client (used for the API-key lookup)
 * @returns User ID or null if no valid auth was provided
 */
export async function flexibleAuth(
  req: Request,
  supabase: SupabaseClient
): Promise<string | null> {
  // A presented API key decides the outcome on its own: a revoked or unknown
  // key does not fall through to the JWT path.
  if (extractApiKey(req)) {
    const auth = await authenticateApiKey(req, supabase);
    return auth ? auth.userId : null;
  }

  // JWT (web app)
  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '').trim();
  if (!token) return null;
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (user && !error) return user.id;
  } catch {
    // JWT validation failed
  }

  return null;
}

/**
 * Require authentication (JWT or API key)
 * Throws error if neither is valid
 * @param req - Request object
 * @param supabase - Supabase client
 * @returns User ID
 */
export async function requireFlexibleAuth(
  req: Request,
  supabase: SupabaseClient
): Promise<string> {
  const userId = await flexibleAuth(req, supabase);

  if (!userId) {
    throw unauthorized('Unauthorized: Valid JWT token or API key required', 'AUTH_TOKEN_MISSING');
  }

  return userId;
}
