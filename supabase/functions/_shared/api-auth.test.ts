/**
 * US-432 (US-385): one API-key validator. api-auth.ts owns the rules;
 * webhook-auth.ts delegates. These run the real modules under Node with a
 * fake service client, so a rule that drifts between the two paths — as
 * revocation did before US-377 — fails here.
 */
import { describe, it, expect, vi } from 'vitest';
import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import {
  API_KEY_PREFIX,
  authenticateApiKey,
  extractApiKey,
  hashApiKey,
  isApiKeyUsable,
  resolveApiKey,
  type ApiKeyRow,
} from './api-auth';
import { flexibleAuth, requireFlexibleAuth, validateApiKey } from './webhook-auth';
import { HttpError } from './http-error';

const KEY = `${API_KEY_PREFIX}abcdefghijklmnopqrstuvwxyz0123456789ABCDEFG`;
const NOW = new Date('2026-11-08T12:00:00Z');

function row(overrides: Partial<ApiKeyRow> = {}): ApiKeyRow {
  return {
    id: 'key-1',
    user_id: 'user-1',
    name: 'Zapier',
    permissions: { read: true, write: true },
    is_active: true,
    expires_at: null,
    revoked_at: null,
    ...overrides,
  };
}

/** A service client whose api_keys table holds `rows`, keyed by hash. */
function fakeClient(rows: Record<string, ApiKeyRow>, jwtUser: string | null = null) {
  const updates: Array<{ values: unknown; id: unknown }> = [];
  const lookups: string[] = [];
  const getUser = vi.fn(async () => ({
    data: { user: jwtUser ? { id: jwtUser } : null },
    error: jwtUser ? null : new Error('bad jwt'),
  }));
  const client = {
    from(table: string) {
      expect(table).toBe('api_keys');
      return {
        select() {
          return {
            eq(_col: string, hash: string) {
              lookups.push(hash);
              return {
                maybeSingle: async () => ({ data: rows[hash] ?? null, error: null }),
              };
            },
          };
        },
        update(values: unknown) {
          return {
            eq(_col: string, id: unknown) {
              updates.push({ values, id });
              return Promise.resolve({ data: null, error: null });
            },
          };
        },
      };
    },
    auth: { getUser },
  };
  return { client: client as unknown as SupabaseClient, updates, lookups, getUser };
}

function req(headers: Record<string, string>): Request {
  return new Request('https://functions.agentbio.net/x', { method: 'POST', headers });
}

describe('extractApiKey', () => {
  it('reads a prefixed bearer token', () => {
    expect(extractApiKey(req({ Authorization: `Bearer ${KEY}` }))).toBe(KEY);
  });

  it('leaves a JWT bearer token to the JWT path', () => {
    expect(extractApiKey(req({ Authorization: 'Bearer eyJhbGciOi.jwt.sig' }))).toBeNull();
  });

  it('treats any x-api-key value as an attempt', () => {
    expect(extractApiKey(req({ 'x-api-key': 'mk_legacy' }))).toBe('mk_legacy');
  });

  it('ignores the anon key supabase-js sends in apikey', () => {
    expect(extractApiKey(req({ apikey: 'eyJanon.key.here' }))).toBeNull();
    expect(extractApiKey(req({ apikey: KEY }))).toBe(KEY);
  });
});

describe('isApiKeyUsable', () => {
  it('accepts an active, unexpired key', () => {
    expect(isApiKeyUsable(row(), NOW)).toBe(true);
    expect(isApiKeyUsable(row({ expires_at: '2027-01-01T00:00:00Z' }), NOW)).toBe(true);
  });

  it('refuses a revoked key even when is_active was never cleared', () => {
    expect(isApiKeyUsable(row({ revoked_at: '2026-10-01T00:00:00Z', is_active: true }), NOW)).toBe(false);
  });

  it('refuses an inactive key with no revoked_at', () => {
    expect(isApiKeyUsable(row({ is_active: false }), NOW)).toBe(false);
  });

  it('refuses an expired key and one expiring exactly now', () => {
    expect(isApiKeyUsable(row({ expires_at: '2026-11-01T00:00:00Z' }), NOW)).toBe(false);
    expect(isApiKeyUsable(row({ expires_at: NOW.toISOString() }), NOW)).toBe(false);
  });

  it('fails closed on an unparseable expiry', () => {
    expect(isApiKeyUsable(row({ expires_at: 'not a date' }), NOW)).toBe(false);
  });
});

describe('resolveApiKey', () => {
  it('looks the key up by its SHA-256 hash, returns the owner and touches last_used_at', async () => {
    const hash = await hashApiKey(KEY);
    const { client, updates, lookups } = fakeClient({ [hash]: row() });
    const auth = await resolveApiKey(KEY, client, NOW);
    expect(lookups).toEqual([hash]);
    expect(auth).toEqual({
      userId: 'user-1',
      keyId: 'key-1',
      keyName: 'Zapier',
      permissions: { read: true, write: true },
    });
    await Promise.resolve();
    expect(updates).toEqual([{ values: { last_used_at: NOW.toISOString() }, id: 'key-1' }]);
  });

  it('never queries for a token without the prefix', async () => {
    const { client, lookups } = fakeClient({});
    expect(await resolveApiKey('mk_legacy', client, NOW)).toBeNull();
    expect(lookups).toEqual([]);
  });

  it('returns null for an unknown or revoked key and does not touch it', async () => {
    const hash = await hashApiKey(KEY);
    const { client, updates } = fakeClient({ [hash]: row({ revoked_at: '2026-10-01T00:00:00Z' }) });
    expect(await resolveApiKey(KEY, client, NOW)).toBeNull();
    expect(await resolveApiKey(`${KEY}x`, client, NOW)).toBeNull();
    expect(updates).toEqual([]);
  });

  it('defaults non-object permissions to read-only', async () => {
    const hash = await hashApiKey(KEY);
    const { client } = fakeClient({ [hash]: row({ permissions: null }) });
    expect((await resolveApiKey(KEY, client, NOW))?.permissions).toEqual({ read: true, write: false });
  });
});

describe('both entry points apply the same rules', () => {
  it('a revoked key is refused through Authorization and through x-api-key', async () => {
    const hash = await hashApiKey(KEY);
    const { client } = fakeClient({ [hash]: row({ revoked_at: '2026-10-01T00:00:00Z' }) });
    expect(await authenticateApiKey(req({ Authorization: `Bearer ${KEY}` }), client)).toBeNull();
    expect(await authenticateApiKey(req({ 'x-api-key': KEY }), client)).toBeNull();
    await expect(validateApiKey(req({ 'x-api-key': KEY }), client)).rejects.toMatchObject({ status: 401 });
    await expect(validateApiKey(req({ Authorization: `Bearer ${KEY}` }), client)).rejects.toBeInstanceOf(HttpError);
  });

  it('an inactive key with no revoked_at is refused by validateApiKey too', async () => {
    const hash = await hashApiKey(KEY);
    const { client } = fakeClient({ [hash]: row({ is_active: false }) });
    await expect(validateApiKey(req({ 'x-api-key': KEY }), client)).rejects.toMatchObject({ status: 401 });
  });

  it('validateApiKey returns the owner for a good key and null when none is presented', async () => {
    const hash = await hashApiKey(KEY);
    const { client } = fakeClient({ [hash]: row() });
    expect(await validateApiKey(req({ 'x-api-key': KEY }), client)).toEqual({ user_id: 'user-1', key_name: 'Zapier' });
    expect(await validateApiKey(req({ apikey: 'eyJanon.key.here' }), client)).toBeNull();
  });
});

describe('flexibleAuth', () => {
  it('authenticates a valid API key without consulting the JWT path', async () => {
    const hash = await hashApiKey(KEY);
    const { client, getUser } = fakeClient({ [hash]: row() }, 'jwt-user');
    expect(await flexibleAuth(req({ 'x-api-key': KEY }), client)).toBe('user-1');
    expect(getUser).not.toHaveBeenCalled();
  });

  it('does not fall back to a JWT when the presented API key is revoked', async () => {
    const hash = await hashApiKey(KEY);
    const { client, getUser } = fakeClient({ [hash]: row({ revoked_at: '2026-10-01T00:00:00Z' }) }, 'jwt-user');
    const r = req({ 'x-api-key': KEY, Authorization: 'Bearer eyJ.valid.jwt' });
    expect(await flexibleAuth(r, client)).toBeNull();
    expect(getUser).not.toHaveBeenCalled();
    await expect(requireFlexibleAuth(r, client)).rejects.toMatchObject({ status: 401 });
  });

  it('uses the JWT when no API key is presented, ignoring the anon apikey header', async () => {
    const { client, getUser } = fakeClient({}, 'jwt-user');
    expect(
      await flexibleAuth(req({ Authorization: 'Bearer eyJ.valid.jwt', apikey: 'eyJanon.key.here' }), client)
    ).toBe('jwt-user');
    expect(getUser).toHaveBeenCalledWith('eyJ.valid.jwt');
  });

  it('returns null with no credentials at all', async () => {
    const { client } = fakeClient({});
    expect(await flexibleAuth(req({}), client)).toBeNull();
  });
});
