/**
 * API key authentication for Edge Functions — the single source of truth.
 *
 * Validates an API key as an alternative to a Supabase JWT, enabling
 * programmatic/CRM access (Make.com, Zapier, n8n). Keys are stored as SHA-256
 * hashes; this hashes the presented key and looks up a usable row, returning
 * the owning user_id + permissions.
 *
 * US-432 (US-385): there used to be two validators. This one checked
 * `revoked_at` and read only `Authorization: Bearer`; webhook-auth.ts's
 * `validateApiKey` checked `is_active`, read `x-api-key` / `apikey`, and had to
 * be patched separately when revocation moved to `revoked_at` (US-377). Every
 * rule now lives here, and webhook-auth delegates to it.
 *
 * Kept free of Deno globals and runtime esm.sh imports so vitest can execute
 * it (api-auth.test.ts).
 */

import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

export const API_KEY_PREFIX = 'ab_';

export interface ApiKeyAuth {
  userId: string;
  keyId: string;
  keyName: string;
  permissions: { read?: boolean; write?: boolean } & Record<string, unknown>;
}

/** The columns of an api_keys row the validator decides on. */
export interface ApiKeyRow {
  id: string;
  user_id: string;
  name: string | null;
  permissions: unknown;
  is_active: boolean | null;
  expires_at: string | null;
  revoked_at: string | null;
}

/** SHA-256 hex digest. */
export async function hashApiKey(key: string): Promise<string> {
  const data = new TextEncoder().encode(key);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * The API key the caller presented, or null when they presented none.
 *
 * - `Authorization: Bearer ab_…` — only when it carries our prefix; any other
 *   bearer token is a Supabase JWT and belongs to the JWT path.
 * - `x-api-key` — an explicit attempt whatever its shape, so a malformed value
 *   is refused rather than ignored.
 * - `apikey` — only when prefixed. supabase-js sends the project's anon key in
 *   this header on every browser request; treating that as an attempted API
 *   key would refuse every web-app call.
 */
export function extractApiKey(req: Request): string | null {
  const bearer = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '').trim();
  if (bearer.startsWith(API_KEY_PREFIX)) return bearer;

  const explicit = (req.headers.get('x-api-key') ?? '').trim();
  if (explicit) return explicit;

  const apikey = (req.headers.get('apikey') ?? '').trim();
  if (apikey.startsWith(API_KEY_PREFIX)) return apikey;

  return null;
}

/**
 * Whether a stored key may authenticate at `now`. Fails closed: a revoked key,
 * a key switched off by `is_active = false` (rows revoked before US-377 carry
 * only that), an expired key, and a key whose expiry cannot be parsed are all
 * refused.
 */
export function isApiKeyUsable(row: ApiKeyRow, now: Date = new Date()): boolean {
  if (row.revoked_at) return false;
  if (row.is_active === false) return false;
  if (row.expires_at) {
    const expires = new Date(row.expires_at).getTime();
    if (Number.isNaN(expires) || expires <= now.getTime()) return false;
  }
  return true;
}

function normalisePermissions(value: unknown): ApiKeyAuth['permissions'] {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as ApiKeyAuth['permissions'];
  }
  return { read: true, write: false };
}

/**
 * Resolves a presented key to its owner. Returns null when the key is
 * malformed, unknown, revoked, inactive or expired. Updates last_used_at on
 * success (fire-and-forget). Requires a service-role client (RLS bypass for
 * the lookup).
 */
export async function resolveApiKey(
  token: string,
  serviceClient: SupabaseClient,
  now: Date = new Date()
): Promise<ApiKeyAuth | null> {
  if (!token.startsWith(API_KEY_PREFIX)) return null;

  const keyHash = await hashApiKey(token);
  const { data, error } = await serviceClient
    .from('api_keys')
    .select('id, user_id, name, permissions, is_active, expires_at, revoked_at')
    .eq('key_hash', keyHash)
    .maybeSingle();

  if (error || !data) return null;
  const row = data as ApiKeyRow;
  if (!isApiKeyUsable(row, now)) return null;

  // Touch last_used_at (best-effort).
  void Promise.resolve(
    serviceClient
      .from('api_keys')
      .update({ last_used_at: now.toISOString() })
      .eq('id', row.id)
  ).then(undefined, () => undefined);

  return {
    userId: row.user_id,
    keyId: row.id,
    keyName: row.name ?? '',
    permissions: normalisePermissions(row.permissions),
  };
}

/**
 * Resolves the API key on a request. Returns null when no key is present or
 * the key is not usable.
 */
export async function authenticateApiKey(
  req: Request,
  serviceClient: SupabaseClient
): Promise<ApiKeyAuth | null> {
  const token = extractApiKey(req);
  if (!token) return null;
  return resolveApiKey(token, serviceClient);
}
