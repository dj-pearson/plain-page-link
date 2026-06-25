import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders } from '../_shared/cors.ts';
import { requireAuth } from '../_shared/auth.ts';
import { successResponse, errorResponse, handleUnexpectedError } from '../_shared/response.ts';
import { hashApiKey, API_KEY_PREFIX } from '../_shared/api-auth.ts';

/**
 * API Keys CRUD
 *   POST   { action: 'create', name, permissions?, expiresAt? } → full key (once)
 *   POST   { action: 'list' }                                    → user's keys (no secrets)
 *   POST   { action: 'revoke', id }                              → revoke a key
 *
 * Keys are `ab_<43 url-safe base64 chars>`; only the SHA-256 hash + an 8-char
 * prefix are stored. Max 10 active keys per user.
 */

const MAX_KEYS_PER_USER = 10;

function generateApiKey(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const b64 = btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  return `${API_KEY_PREFIX}${b64}`;
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get('origin'));
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return errorResponse('Method not allowed', 'METHOD_NOT_ALLOWED', req, 405);
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );
    const user = await requireAuth(req, supabase);

    // Service client for writes/reads independent of RLS nuances.
    const service = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const body = await req.json();
    const action = body.action as string;

    if (action === 'list') {
      const { data, error } = await service
        .from('api_keys')
        .select('id, name, key_prefix, permissions, last_used_at, expires_at, revoked_at, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return successResponse({ keys: data ?? [] }, req);
    }

    if (action === 'create') {
      const name = (body.name as string)?.trim();
      if (!name) {
        return errorResponse('A name is required', 'REQUEST_VALIDATION_FAILED', req);
      }

      // Enforce the per-user active-key cap.
      const { count } = await service
        .from('api_keys')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .is('revoked_at', null);
      if ((count ?? 0) >= MAX_KEYS_PER_USER) {
        return errorResponse(
          `You can have at most ${MAX_KEYS_PER_USER} active API keys.`,
          'RATE_LIMIT',
          req,
          429
        );
      }

      const fullKey = generateApiKey();
      const keyHash = await hashApiKey(fullKey);
      const keyPrefix = fullKey.slice(0, 8);

      const { data, error } = await service
        .from('api_keys')
        .insert({
          user_id: user.id,
          name,
          key_hash: keyHash,
          key_prefix: keyPrefix,
          permissions: body.permissions ?? { read: true, write: false },
          expires_at: body.expiresAt ?? null,
        })
        .select('id, name, key_prefix, permissions, created_at')
        .single();
      if (error) throw error;

      await service
        .rpc('log_audit_event', {
          p_user_id: user.id,
          p_action: 'api_key_create',
          p_status: 'success',
          p_resource_type: 'api_key',
          p_resource_id: data.id,
        })
        .catch(() => undefined);

      // Full key returned ONCE — never retrievable again.
      return successResponse({ key: fullKey, record: data }, req);
    }

    if (action === 'revoke') {
      const id = body.id as string;
      if (!id) return errorResponse('id is required', 'REQUEST_VALIDATION_FAILED', req);

      const { error } = await service
        .from('api_keys')
        .update({ revoked_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', user.id);
      if (error) throw error;

      await service
        .rpc('log_audit_event', {
          p_user_id: user.id,
          p_action: 'api_key_revoke',
          p_status: 'success',
          p_resource_type: 'api_key',
          p_resource_id: id,
        })
        .catch(() => undefined);

      return successResponse({ revoked: true }, req);
    }

    return errorResponse('Unknown action', 'REQUEST_VALIDATION_FAILED', req);
  } catch (error) {
    return handleUnexpectedError(error, req);
  }
});
