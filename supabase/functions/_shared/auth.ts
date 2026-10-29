/**
 * Server-Side Authentication & Authorization Utilities
 * Security: Enforces admin checks on Edge Functions
 */

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import { forbidden, unauthorized } from './http-error.ts';
import { isServiceRoleRequest } from './service-auth.ts';

/**
 * Get authenticated user from request
 * @param req - Request object
 * @param supabase - Supabase client
 * @returns User object or throws error
 */
export async function requireAuth(req: Request, supabase: SupabaseClient) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    throw unauthorized('Unauthorized: No authorization header', 'AUTH_TOKEN_MISSING');
  }

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    throw unauthorized('Unauthorized: Invalid token', 'AUTH_SESSION_INVALID');
  }

  return user;
}

/**
 * Require admin role for Edge Function access
 * @param req - Request object
 * @param supabase - Supabase client
 * @returns User object if admin, throws error otherwise
 */
export async function requireAdmin(req: Request, supabase: SupabaseClient) {
  const user = await requireAuth(req, supabase);

  // Check for an admin role row directly. Filtering by role (rather than
  // .single() over all of the user's roles) avoids throwing when a user
  // legitimately has more than one role row.
  const { data: adminRole, error: roleError } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .eq('role', 'admin')
    .maybeSingle();

  if (roleError || !adminRole) {
    throw forbidden('Forbidden: Admin access required');
  }

  return user;
}

/**
 * Require an admin, or the backend itself (the service-role key).
 *
 * US-234: run-scheduled-audit calls seo-audit and analyze-content
 * server-to-server with the service-role key, which carries no user, so
 * requireAdmin alone would refuse the scheduler. Returns the admin user, or
 * null for a service-role call — and never anything for anyone else.
 */
export async function requireAdminOrServiceRole(req: Request, supabase: SupabaseClient) {
  if (isServiceRoleRequest(req)) return null;
  return await requireAdmin(req, supabase);
}

// The one implementation lives in client-ip.ts (US-214).
export { getClientIP } from './client-ip.ts';

/**
 * Validate user owns resource
 * @param userId - User ID from auth
 * @param resourceUserId - User ID on the resource
 * @throws Error if not owner
 */
export function requireOwnership(userId: string, resourceUserId: string) {
  if (userId !== resourceUserId) {
    throw forbidden('Forbidden: You do not own this resource');
  }
}
