/**
 * Service Role Key Authentication
 * Validates requests using Supabase service role key
 * Suitable for server-to-server calls (Make.com, Zapier, etc.)
 */

/**
 * The shortest value accepted as a service-role key. A legacy service-role JWT
 * is well over 100 characters and a new-style secret key is over 40, so
 * anything shorter is a misconfiguration (an empty or truncated variable), not
 * a key. US-656.
 */
export const MIN_SERVICE_KEY_LENGTH = 32;

/**
 * Compare two strings without returning early on the first differing byte, so
 * response timing does not reveal how much of a guess matched. The length
 * difference is folded into the result rather than checked first.
 */
export function constantTimeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const x = enc.encode(a);
  const y = enc.encode(b);
  const len = Math.max(x.length, y.length);
  let diff = x.length ^ y.length;
  for (let i = 0; i < len; i++) {
    diff |= (x[i] ?? 0) ^ (y[i] ?? 0);
  }
  return diff === 0;
}

/**
 * Check if request is authenticated with service role key.
 *
 * US-656: this used to be `token === Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')`
 * after stripping 'Bearer '. With the variable set but empty (a compose file
 * interpolating an unset variable), `Authorization: Bearer ` matched, which
 * would open process-account-deletions, notify-lead and every scheduler. It now
 * fails closed when the key is unset, blank or implausibly short, requires a
 * well-formed `Bearer <token>` header, and compares in constant time.
 *
 * @param req - Request object
 * @returns true if service role key is valid
 */
export function isServiceRoleRequest(req: Request): boolean {
  const serviceRoleKey = (Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '').trim();
  if (serviceRoleKey.length < MIN_SERVICE_KEY_LENGTH) return false;

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return false;

  const match = /^Bearer\s+(\S+)$/i.exec(authHeader.trim());
  if (!match) return false;
  const token = match[1];
  if (token.length < MIN_SERVICE_KEY_LENGTH) return false;

  return constantTimeEqual(token, serviceRoleKey);
}

/**
 * Get user ID from JWT or return null for service role requests
 * Service role requests can proceed without a specific user ID
 * @param req - Request object
 * @param supabase - Supabase client
 * @returns User ID or null for service role requests
 */
export async function getAuthenticatedUser(
  req: Request,
  supabase: any
): Promise<string | null> {
  // Check if it's a service role key request
  if (isServiceRoleRequest(req)) {
    console.log('[service-auth] Authenticated via service role key');
    return null; // Service role can proceed without user ID
  }

  // Try JWT token
  const authHeader = req.headers.get('Authorization');
  if (authHeader) {
    try {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error } = await supabase.auth.getUser(token);
      
      if (user && !error) {
        console.log('[service-auth] Authenticated via JWT');
        return user.id;
      }
    } catch (error) {
      console.warn('[service-auth] JWT validation failed:', error);
    }
  }

  return null;
}
