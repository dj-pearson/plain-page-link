/**
 * US-249: Google/Apple sign-in trusted an unsigned state that carried the PKCE
 * verifier, trusted unverified emails, and failed for returning users past the
 * first page of listUsers().
 */
import { describe, it, expect } from 'vitest';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  STATE_TTL_SECONDS,
  base64UrlDecodeToString,
  checkSocialIdToken,
  derivePkceVerifier,
  pkceChallenge,
  resolveStateSecret,
  safeRedirectPath,
  signState,
  tokenErrorForLog,
  verifyState,
  type StatePayload,
} from './oauth.ts';
import { findAuthUserIdByEmail, isEmailExistsError, type RpcClient } from '../_shared/auth-user-lookup.ts';

const SECRET = 'test-secret-that-is-at-least-32-characters-long';
const NOW = 1_800_000_000;
const payload = (over: Partial<StatePayload> = {}): StatePayload => ({
  provider: 'google',
  redirectTo: '/dashboard/leads',
  nonce: 'nonce-abc',
  exp: NOW + STATE_TTL_SECONDS,
  ...over,
});

const b64url = (s: string) => Buffer.from(s).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const jwt = (claims: object) => `${b64url('{"alg":"RS256"}')}.${b64url(JSON.stringify(claims))}.sig`;

describe('OAuth state', () => {
  it('round-trips a signed state', async () => {
    const state = await signState(SECRET, payload());
    const d = await verifyState(SECRET, state, NOW);
    expect(d).toEqual({ ok: true, value: payload() });
  });

  it('does not carry the PKCE verifier', async () => {
    const state = await signState(SECRET, payload());
    const verifier = await derivePkceVerifier(SECRET, 'nonce-abc');
    expect(state).not.toContain(verifier);
    const body = JSON.parse(base64UrlDecodeToString(state.split('.')[0]));
    expect(Object.keys(body).sort()).toEqual(['exp', 'n', 'p', 'r']);
  });

  it('refuses a tampered payload with 400', async () => {
    const state = await signState(SECRET, payload());
    const [, sig] = state.split('.');
    const forged = b64url(JSON.stringify({ p: 'google', r: '/admin', n: 'nonce-abc', exp: NOW + 600 }));
    const d = await verifyState(SECRET, `${forged}.${sig}`, NOW);
    expect(d).toMatchObject({ ok: false, status: 400 });
  });

  it('refuses a state signed with another key', async () => {
    const state = await signState('another-secret-that-is-also-32-characters', payload());
    expect(await verifyState(SECRET, state, NOW)).toMatchObject({ ok: false, status: 400 });
  });

  it('refuses an expired state with 400', async () => {
    const state = await signState(SECRET, payload({ exp: NOW - 1 }));
    expect(await verifyState(SECRET, state, NOW)).toMatchObject({ ok: false, status: 400 });
  });

  it('refuses the old unsigned btoa(JSON) state', async () => {
    const legacy = btoa(JSON.stringify({ verifier: 'v', redirectTo: '/dashboard', provider: 'google' }));
    expect(await verifyState(SECRET, legacy, NOW)).toMatchObject({ ok: false, status: 400 });
    expect(await verifyState(SECRET, null, NOW)).toMatchObject({ ok: false, status: 400 });
    expect(await verifyState(SECRET, 'a.b.c', NOW)).toMatchObject({ ok: false, status: 400 });
  });

  it('derives a stable RFC 7636 verifier per nonce', async () => {
    const v1 = await derivePkceVerifier(SECRET, 'n1');
    expect(v1).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(await derivePkceVerifier(SECRET, 'n1')).toBe(v1);
    expect(await derivePkceVerifier(SECRET, 'n2')).not.toBe(v1);
    expect(await derivePkceVerifier('different-secret-of-thirty-two-chars!', 'n1')).not.toBe(v1);
    // S256 = base64url(sha256(verifier)), checked against node's own crypto.
    expect(await pkceChallenge(v1)).toBe(createHash('sha256').update(v1).digest('base64url'));
  });

  it('resolves the signing secret, never running unsigned', () => {
    expect(resolveStateSecret(SECRET, 'srk')).toBe(SECRET);
    expect(resolveStateSecret('short', 'srk')).toBe('oauth-state-v1:srk');
    expect(resolveStateSecret(undefined, 'srk')).toBe('oauth-state-v1:srk');
    expect(resolveStateSecret(undefined, undefined)).toBeNull();
  });

  it('keeps redirects on this site', () => {
    expect(safeRedirectPath('/dashboard/listings?x=1')).toBe('/dashboard/listings?x=1');
    for (const bad of ['//evil.com', '/\\evil.com', 'https://evil.com', '@evil.com', '', null, undefined, '/a\nb']) {
      expect(safeRedirectPath(bad)).toBe('/dashboard');
    }
  });
});

describe('id_token checks', () => {
  const google = { provider: 'google' as const, clientId: 'g-client', nowSeconds: NOW };
  const claims = (over: Record<string, unknown> = {}) => ({
    iss: 'https://accounts.google.com',
    aud: 'g-client',
    exp: NOW + 300,
    email: 'Jane@Example.com',
    email_verified: true,
    name: 'Jane Doe',
    picture: 'https://lh3.googleusercontent.com/a/x',
    ...over,
  });

  it('accepts a verified email and lower-cases it', () => {
    expect(checkSocialIdToken(jwt(claims()), google)).toEqual({
      ok: true,
      value: { email: 'jane@example.com', name: 'Jane Doe', picture: 'https://lh3.googleusercontent.com/a/x' },
    });
  });

  it('refuses an email the provider has not verified', () => {
    for (const v of [false, 'false', undefined, null, 1]) {
      expect(checkSocialIdToken(jwt(claims({ email_verified: v })), google)).toMatchObject({ ok: false, status: 403 });
    }
  });

  it('accepts Apple\'s string "true"', () => {
    const apple = { provider: 'apple' as const, clientId: 'a-client', nowSeconds: NOW };
    const d = checkSocialIdToken(jwt(claims({ iss: 'https://appleid.apple.com', aud: 'a-client', email_verified: 'true' })), apple);
    expect(d.ok).toBe(true);
  });

  it('decodes payloads as base64url, not base64', () => {
    // "~~~" and "???" encode to bytes that need - and _ in base64url.
    const token = jwt(claims({ name: '~~~???>>>' }));
    expect(token.split('.')[1]).toMatch(/[-_]/);
    const d = checkSocialIdToken(token, google);
    expect(d).toMatchObject({ ok: true, value: { name: '~~~???>>>' } });
  });

  it('refuses wrong issuer, audience, expiry and malformed tokens', () => {
    expect(checkSocialIdToken(jwt(claims({ iss: 'https://evil.example' })), google).ok).toBe(false);
    expect(checkSocialIdToken(jwt(claims({ aud: 'other-client' })), google).ok).toBe(false);
    expect(checkSocialIdToken(jwt(claims({ exp: NOW - 1 })), google).ok).toBe(false);
    expect(checkSocialIdToken('not-a-jwt', google)).toMatchObject({ ok: false, status: 400 });
    expect(checkSocialIdToken(undefined, google)).toMatchObject({ ok: false, status: 400 });
    expect(checkSocialIdToken(jwt(claims({ email: undefined })), google)).toMatchObject({ ok: false, status: 400 });
  });
});

describe('token error logging', () => {
  it('logs only the error field', () => {
    expect(tokenErrorForLog({ error: 'invalid_grant', error_description: 'Bad code for jane@example.com', id_token: 'x' })).toBe(
      'invalid_grant',
    );
    expect(tokenErrorForLog({ error_description: 'x' })).toBe('unknown_error');
    expect(tokenErrorForLog(null)).toBe('unknown_error');
  });
});

describe('existing-user lookup', () => {
  const client = (data: unknown, error: { message: string } | null = null) => {
    const calls: Array<[string, Record<string, unknown>]> = [];
    const c: RpcClient = {
      rpc: (fn, args) => {
        calls.push([fn, args]);
        return Promise.resolve({ data, error });
      },
    };
    return { c, calls };
  };

  it('asks the service-role RPC with the normalised email', async () => {
    const { c, calls } = client('11111111-1111-1111-1111-111111111111');
    expect(await findAuthUserIdByEmail(c, '  Jane@Example.COM ')).toBe('11111111-1111-1111-1111-111111111111');
    expect(calls).toEqual([['auth_user_id_by_email', { p_email: 'jane@example.com' }]]);
  });

  it('returns null for no account and throws when the lookup fails', async () => {
    expect(await findAuthUserIdByEmail(client(null).c, 'a@b.co')).toBeNull();
    await expect(findAuthUserIdByEmail(client(null, { message: 'boom' }).c, 'a@b.co')).rejects.toThrow(/lookup failed/);
  });

  it('recognises an email_exists create error', () => {
    expect(isEmailExistsError({ code: 'email_exists' })).toBe(true);
    expect(isEmailExistsError({ message: 'A user with this email address has already been registered' })).toBe(true);
    expect(isEmailExistsError({ code: 'unexpected_failure', message: 'db down' })).toBe(false);
    expect(isEmailExistsError(null)).toBe(false);
  });
});

describe('callers', () => {
  const src = (fn: string) => readFileSync(join(__dirname, '..', fn, 'index.ts'), 'utf8');

  it('neither oauth-proxy nor sso-callback pages through listUsers()', () => {
    for (const fn of ['oauth-proxy', 'sso-callback']) {
      expect(src(fn)).not.toMatch(/listUsers\s*\(/);
      expect(src(fn)).toMatch(/findAuthUserIdByEmail\(/);
    }
  });

  it('oauth-proxy logs no token response body and no plain atob of the id_token', () => {
    const s = src('oauth-proxy');
    expect(s).not.toMatch(/console\.\w+\([^)]*tokenData\s*\)/);
    expect(s).not.toMatch(/atob\(/);
    expect(s).toMatch(/verifyState\(/);
    expect(s).toMatch(/checkSocialIdToken\(/);
  });
});
