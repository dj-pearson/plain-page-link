/**
 * Service Role Key Authentication
 * Validates requests using Supabase service role key
 * Suitable for server-to-server calls (Make.com, Zapier, etc.)
 */

/**
 * Check if request is authenticated with service role key
 * @param req - Request object
 * @returns true if service role key is valid
 */
export function isServiceRoleRequest(req: Request): boolean {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return false;

  const token = authHeader.replace('Bearer ', '').trim();
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  return token === serviceRoleKey;
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
