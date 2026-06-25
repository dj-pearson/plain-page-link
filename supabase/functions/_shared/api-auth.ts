/**
 * API key authentication for Edge Functions.
 *
 * Validates an `Authorization: Bearer <api_key>` header as an alternative to a
 * Supabase JWT, enabling programmatic/CRM access. Keys are stored as SHA-256
 * hashes; this hashes the presented key and looks up an active (non-revoked,
 * non-expired) row, returning the owning user_id + permissions.
 */

import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

export const API_KEY_PREFIX = 'ab_';

export interface ApiKeyAuth {
  userId: string;
  keyId: string;
  permissions: { read?: boolean; write?: boolean } & Record<string, unknown>;
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
 * Resolves an API key from the request. Returns null when no key is present or
 * the key is invalid/revoked/expired. Updates last_used_at on success
 * (fire-and-forget). Requires a service-role client (RLS bypass for lookup).
 */
export async function authenticateApiKey(
  req: Request,
  serviceClient: SupabaseClient
): Promise<ApiKeyAuth | null> {
  const header = req.headers.get('Authorization') ?? '';
  const token = header.replace(/^Bearer\s+/i, '').trim();
  if (!token || !token.startsWith(API_KEY_PREFIX)) return null;

  const keyHash = await hashApiKey(token);
  const { data, error } = await serviceClient
    .from('api_keys')
    .select('id, user_id, permissions, expires_at, revoked_at')
    .eq('key_hash', keyHash)
    .maybeSingle();

  if (error || !data) return null;
  if (data.revoked_at) return null;
  if (data.expires_at && new Date(data.expires_at) < new Date()) return null;

  // Touch last_used_at (best-effort).
  void serviceClient
    .from('api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', data.id)
    .then(undefined, () => undefined);

  return {
    userId: data.user_id,
    keyId: data.id,
    permissions: data.permissions ?? { read: true, write: false },
  };
}
