/**
 * US-249: what oauth-proxy may believe about a Google/Apple callback.
 *
 * Before this, `state` was btoa(JSON) of { verifier, redirectTo, provider }:
 * unsigned, unexpiring, and carrying the PKCE code_verifier in the clear, so
 * the value PKCE exists to keep secret travelled through the provider, the
 * browser history and every log that recorded the callback URL. Anyone could
 * hand-write a state naming any provider or redirect. The id_token payload was
 * decoded with plain atob (wrong for base64url, so some tokens failed to parse)
 * and its email was trusted whether or not the provider had verified it.
 *
 * Now the state is `<payload>.<signature>`: base64url JSON { p, r, n, exp }
 * signed with HMAC-SHA256. The PKCE verifier is not in it at all — it is
 * derived on both legs as HMAC(secret, "pkce:" + nonce), so only the server
 * can produce it. A tampered, malformed or expired state is refused (400).
 *
 * Pure functions on Web Crypto only, so vitest can hold them (oauth.test.ts).
 */

import { decodeJwtPayload, type Decision } from '../_shared/sso.ts';

export type OAuthProvider = 'google' | 'apple';

export const STATE_TTL_SECONDS = 10 * 60;

const enc = new TextEncoder();

export function base64UrlEncode(bytes: Uint8Array): string {
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Decode base64url (padding optional) to a UTF-8 string. Throws on bad input. */
export function base64UrlDecodeToString(input: string): string {
  if (!/^[A-Za-z0-9_-]*$/.test(input)) throw new Error('not base64url');
  let b64 = input.replace(/-/g, '+').replace(/_/g, '/');
  while (b64.length % 4) b64 += '=';
  const binary = atob(b64);
  return new TextDecoder().decode(Uint8Array.from(binary, (c) => c.charCodeAt(0)));
}

async function hmac(secret: string, message: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, [
    'sign',
  ]);
  return new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(message)));
}

/** Length-independent comparison so a signature check does not leak a prefix. */
function timingSafeEqual(a: string, b: string): boolean {
  let diff = a.length ^ b.length;
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
}

/**
 * The key that signs state. OAUTH_STATE_SECRET when set; otherwise one derived
 * from the service-role key under its own label, so a deployment that has not
 * set the new secret keeps working without ever using the service-role key
 * itself as an HMAC key. Null when neither exists: refuse to run unsigned.
 */
export function resolveStateSecret(oauthStateSecret: string | undefined, serviceRoleKey: string | undefined): string | null {
  if (oauthStateSecret && oauthStateSecret.length >= 32) return oauthStateSecret;
  if (serviceRoleKey) return `oauth-state-v1:${serviceRoleKey}`;
  return null;
}

/** RFC 7636 verifier (43 base64url chars) derived from the nonce. */
export async function derivePkceVerifier(secret: string, nonce: string): Promise<string> {
  return base64UrlEncode(await hmac(secret, `pkce:${nonce}`));
}

/** S256 challenge for a verifier. */
export async function pkceChallenge(verifier: string): Promise<string> {
  return base64UrlEncode(new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode(verifier))));
}

export function newNonce(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return base64UrlEncode(bytes);
}

export function isOAuthProvider(v: unknown): v is OAuthProvider {
  return v === 'google' || v === 'apple';
}

/**
 * A same-site path to land on after sign-in. Anything that is not a plain
 * absolute path ("//evil.com", "/\\evil.com", "https://…", "@evil.com") falls
 * back to /dashboard; the result is appended to SITE_URL.
 */
export function safeRedirectPath(input: string | null | undefined, fallback = '/dashboard'): string {
  if (typeof input !== 'string' || !input.startsWith('/')) return fallback;
  if (input.startsWith('//') || input.includes('\\') || /[\u0000-\u001f\u007f]/.test(input)) return fallback;
  return input;
}

/**
 * US-594: who sent a visitor who signs up with Google or Apple.
 *
 * An email signup passes ?ref= (the "Powered by AgentBio" badge on an agent's
 * page) and the first-touch utm_source to supabase.auth.signUp as user
 * metadata, and handle_new_user writes them to profiles.referred_by /
 * signup_source. A social signup went through this proxy, which created the
 * user with provider metadata only, so every Google/Apple signup was recorded
 * as unattributed. The frontend now sends both on the authorize leg; they
 * ride in the signed state and are put on the new user's metadata.
 *
 * Same shapes as the client keeps (src/lib/signupIntent.ts REF_RE) and the
 * 100-character cap of the profiles_signup_source_length check. A value that
 * does not fit is dropped, never truncated into something else; handle_new_user
 * still ignores a ref that names no real profile.
 */
const REF_RE = /^[a-z0-9][a-z0-9_-]{0,39}$/;

export interface SignupAttribution {
  ref?: string;
  source?: string;
}

export function sanitizeSignupAttribution(ref: unknown, source: unknown): SignupAttribution {
  const out: SignupAttribution = {};
  if (typeof ref === 'string') {
    const r = ref.trim().toLowerCase();
    if (REF_RE.test(r)) out.ref = r;
  }
  if (typeof source === 'string') {
    const s = source.trim();
    if (s && s.length <= 100 && !/[\u0000-\u001f\u007f]/.test(s)) out.source = s;
  }
  return out;
}

/**
 * user_metadata for an account this proxy creates. ref / signup_source are the
 * keys handle_new_user reads (migration 20260930000010).
 */
export function newSocialUserMetadata(
  identity: SocialIdentity,
  provider: OAuthProvider,
  attribution: SignupAttribution,
): Record<string, string | undefined> {
  return {
    full_name: identity.name,
    avatar_url: identity.picture,
    provider,
    ...(attribution.ref ? { ref: attribution.ref } : {}),
    ...(attribution.source ? { signup_source: attribution.source } : {}),
  };
}

export interface StatePayload extends SignupAttribution {
  provider: OAuthProvider;
  redirectTo: string;
  nonce: string;
  /** Seconds since the epoch. */
  exp: number;
}

export async function signState(secret: string, payload: StatePayload): Promise<string> {
  const attribution = sanitizeSignupAttribution(payload.ref, payload.source);
  const body = base64UrlEncode(
    enc.encode(
      JSON.stringify({
        p: payload.provider,
        r: payload.redirectTo,
        n: payload.nonce,
        exp: payload.exp,
        ...(attribution.ref ? { f: attribution.ref } : {}),
        ...(attribution.source ? { s: attribution.source } : {}),
      }),
    ),
  );
  const sig = base64UrlEncode(await hmac(secret, body));
  return `${body}.${sig}`;
}

/** Verify a state from the callback. Every refusal is a 400. */
export async function verifyState(
  secret: string,
  state: string | null | undefined,
  nowSeconds: number,
): Promise<Decision<StatePayload>> {
  const refuse = (error: string): Decision<StatePayload> => ({ ok: false, status: 400, error });
  if (typeof state !== 'string' || state.length > 2048) return refuse('Invalid state');
  const parts = state.split('.');
  if (parts.length !== 2 || !parts[0] || !parts[1]) return refuse('Invalid state');
  const [body, sig] = parts;

  const expected = base64UrlEncode(await hmac(secret, body));
  if (!timingSafeEqual(sig, expected)) return refuse('Invalid state');

  let parsed: unknown;
  try {
    parsed = JSON.parse(base64UrlDecodeToString(body));
  } catch {
    return refuse('Invalid state');
  }
  if (!parsed || typeof parsed !== 'object') return refuse('Invalid state');
  const { p, r, n, exp, f, s } = parsed as Record<string, unknown>;
  if (!isOAuthProvider(p) || typeof r !== 'string' || typeof n !== 'string' || !n || typeof exp !== 'number') {
    return refuse('Invalid state');
  }
  if (exp <= nowSeconds) return refuse('Sign-in link expired, please try again');
  return {
    ok: true,
    value: { provider: p, redirectTo: safeRedirectPath(r), nonce: n, exp, ...sanitizeSignupAttribution(f, s) },
  };
}

const ISSUERS: Record<OAuthProvider, readonly string[]> = {
  google: ['https://accounts.google.com', 'accounts.google.com'],
  apple: ['https://appleid.apple.com'],
};

export interface SocialIdentity {
  email: string;
  name?: string;
  picture?: string;
}

/**
 * Decode (base64url) and check an id_token from the provider's token endpoint.
 * The token arrived over TLS in exchange for the code and client secret, which
 * OIDC Core 3.1.3.7(6) accepts in lieu of a signature check; its claims are
 * still checked. An email the provider has not verified is refused: trusting
 * it would let someone who registered another person's address at Apple or a
 * Google Workspace tenant sign in to that person's AgentBio account.
 */
export function checkSocialIdToken(
  idToken: unknown,
  expected: { provider: OAuthProvider; clientId: string; nowSeconds: number },
): Decision<SocialIdentity> {
  const refuse = (error: string, status = 401): Decision<SocialIdentity> => ({ ok: false, status, error });
  if (typeof idToken !== 'string') return refuse('No id_token in the token response', 400);

  let claims: Record<string, unknown>;
  try {
    claims = decodeJwtPayload(idToken);
  } catch {
    return refuse('Malformed id_token', 400);
  }

  if (typeof claims.iss !== 'string' || !ISSUERS[expected.provider].includes(claims.iss)) {
    return refuse('id_token issuer does not match');
  }
  const aud = claims.aud;
  const audiences = Array.isArray(aud) ? aud : [aud];
  if (!expected.clientId || !audiences.includes(expected.clientId)) return refuse('id_token audience does not match');
  if (typeof claims.exp !== 'number' || claims.exp <= expected.nowSeconds) return refuse('id_token has expired');

  const email = typeof claims.email === 'string' ? claims.email.trim().toLowerCase() : '';
  if (!email || !email.includes('@')) return refuse('id_token carries no email', 400);

  // Google sends a boolean. Apple has historically sent the string "true".
  // Anything else — false, "false", missing — is unverified.
  if (claims.email_verified !== true && claims.email_verified !== 'true') {
    return refuse('Your email address is not verified with this provider', 403);
  }

  const identity: SocialIdentity = { email };
  if (typeof claims.name === 'string' && claims.name.trim()) identity.name = claims.name.trim();
  if (typeof claims.picture === 'string' && /^https:\/\//.test(claims.picture)) identity.picture = claims.picture;
  return { ok: true, value: identity };
}

/**
 * What to log for a failed token exchange: the provider's `error` code only.
 * The rest of the body can echo back codes, tokens or the user's details.
 */
export function tokenErrorForLog(tokenData: unknown): string {
  if (tokenData && typeof tokenData === 'object') {
    const err = (tokenData as Record<string, unknown>).error;
    if (typeof err === 'string') return err.slice(0, 100);
  }
  return 'unknown_error';
}
