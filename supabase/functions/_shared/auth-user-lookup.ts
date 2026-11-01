/**
 * US-249: find the existing account for a sign-in's email.
 *
 * oauth-proxy and sso-callback used auth.admin.listUsers() and searched the
 * result, but listUsers() returns only its first page (50 users). Past that,
 * a returning user was "not found": oauth-proxy went on to createUser, which
 * failed with email_exists, and social sign-in broke for everyone not on page
 * one. public.auth_user_id_by_email (migration 20261101000011) is a single
 * service-role-only lookup over all of auth.users.
 */

/** The slice of a service-role supabase client this module needs. */
export interface RpcClient {
  rpc(fn: string, args: Record<string, unknown>): PromiseLike<{ data: unknown; error: { message: string } | null }>;
}

/**
 * The auth.users id for `email` (case-insensitive), or null when there is no
 * such account. Throws when the lookup itself fails: treating a failed lookup
 * as "no account" would send a returning user down the create path.
 */
export async function findAuthUserIdByEmail(client: RpcClient, email: string): Promise<string | null> {
  const normalised = email.trim().toLowerCase();
  if (!normalised) return null;
  const { data, error } = await client.rpc('auth_user_id_by_email', { p_email: normalised });
  if (error) throw new Error(`auth user lookup failed: ${error.message}`);
  return typeof data === 'string' && data ? data : null;
}

/**
 * True when an auth.admin.createUser error means the address is already
 * registered — a concurrent sign-in created it between lookup and create.
 */
export function isEmailExistsError(error: { code?: unknown; status?: unknown; message?: unknown } | null | undefined): boolean {
  if (!error) return false;
  if (error.code === 'email_exists' || error.code === 'user_already_exists') return true;
  return typeof error.message === 'string' && /already (been )?registered|already exists/i.test(error.message);
}
