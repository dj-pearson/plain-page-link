/**
 * Server-Side Authentication & Authorization Utilities
 * Security: Enforces admin checks on Edge Functions
 */

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * Get authenticated user from request
 * @param req - Request object
 * @param supabase - Supabase client
 * @returns User object or throws error
 */
export async function requireAuth(req: Request, supabase: SupabaseClient) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    throw new Error('Unauthorized: No authorization header');
  }

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    throw new Error('Unauthorized: Invalid token');
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

  // Check admin role in user_roles table
  const { data: userRole, error: roleError } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  if (roleError || userRole?.role !== 'admin') {
    throw new Error('Forbidden: Admin access required');
  }

  return user;
}

/**
 * Get client IP address from request
 * @param req - Request object
 * @returns IP address string
 */
export function getClientIP(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0].trim()
    || req.headers.get('x-real-ip')
    || req.headers.get('cf-connecting-ip') // Cloudflare
    || 'unknown';
}

/**
 * Validate user owns resource
 * @param userId - User ID from auth
 * @param resourceUserId - User ID on the resource
 * @throws Error if not owner
 */
export function requireOwnership(userId: string, resourceUserId: string) {
  if (userId !== resourceUserId) {
    throw new Error('Forbidden: You do not own this resource');
  }
}
