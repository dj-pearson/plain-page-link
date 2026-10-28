/**
 * US-233: what sso-callback is allowed to believe before it mints a session.
 *
 * Before this, the SAML branch base64-decoded whatever SAMLResponse it was
 * POSTed, read the email out of it with a regex, and handed that email to
 * auth.admin.generateLink. Nothing checked the XML signature — the configured
 * `saml_certificate` was never read — so anyone could start a SAML login for
 * any org (sso-initiate is public), post back a hand-written response naming
 * any address, and receive a magic link for that account, admins included.
 * The email was not even required to belong to the organisation's domain.
 *
 * Verifying XML-DSig correctly (canonicalisation, reference/transform checks,
 * signature-wrapping defences) is not something to hand-roll in an edge
 * function, and no verifier exists in this codebase. So SAML-family providers
 * are switched off — sso-initiate will not start one and sso-callback refuses
 * any SAMLResponse — until a real verifier is wired in.
 *
 * The OIDC branch stays: its ID token arrives directly from the configured
 * token endpoint over TLS in exchange for a code and the client secret, which
 * OIDC Core 3.1.3.7(6) accepts in lieu of a signature check. Its claims are
 * still checked here (issuer, audience, expiry, the nonce sso-initiate stored),
 * and the email must belong to the config's organization_domain.
 *
 * Pure functions only, so vitest can hold them (see sso.test.ts).
 */

/** Providers whose sign-in arrives as a SAML assertion. */
export const SAML_PROVIDERS: readonly string[] = ['saml', 'okta', 'azure_ad'];

/** Providers whose sign-in is an OIDC authorization-code exchange. */
export const OIDC_PROVIDERS: readonly string[] = ['oidc', 'google_workspace'];

export const SAML_DISABLED_MESSAGE =
  'SAML single sign-on is not available: SAML responses cannot be signature-verified yet. ' +
  'Ask your administrator to configure OIDC, or sign in with email and password.';

export function isSamlProvider(provider: string | null | undefined): boolean {
  return !!provider && SAML_PROVIDERS.includes(provider);
}

export function isOidcProvider(provider: string | null | undefined): boolean {
  return !!provider && OIDC_PROVIDERS.includes(provider);
}

/** Lower-cased domain of an address, or null when it is not one. */
export function emailDomain(email: string | null | undefined): string | null {
  if (typeof email !== 'string') return null;
  const trimmed = email.trim().toLowerCase();
  const at = trimmed.lastIndexOf('@');
  if (at <= 0 || at === trimmed.length - 1) return null;
  if (trimmed.indexOf('@') !== at) return null; // more than one '@'
  return trimmed.slice(at + 1);
}

/**
 * True only when the email's domain is exactly the organisation's domain.
 * A subdomain, a look-alike suffix ("evil-acme.com") or a missing domain fails.
 */
export function emailMatchesOrgDomain(email: string | null | undefined, organizationDomain: string | null | undefined): boolean {
  const domain = emailDomain(email);
  const org = typeof organizationDomain === 'string' ? organizationDomain.trim().toLowerCase() : '';
  return !!domain && !!org && domain === org;
}

/** Decode a JWT's payload without verifying it. Throws on a malformed token. */
export function decodeJwtPayload(token: string): Record<string, unknown> {
  const parts = typeof token === 'string' ? token.split('.') : [];
  if (parts.length !== 3) throw new Error('Invalid JWT format');
  let b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
  while (b64.length % 4) b64 += '=';
  const binary = atob(b64);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  const parsed: unknown = JSON.parse(new TextDecoder().decode(bytes));
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Invalid JWT payload');
  return parsed as Record<string, unknown>;
}

export interface IdTokenExpectations {
  /** enterprise_sso_config.oidc_client_id */
  clientId: string | null | undefined;
  /** enterprise_sso_config.oidc_issuer; checked when configured. */
  issuer: string | null | undefined;
  /** sso_login_sessions.oidc_nonce, stored by sso-initiate. */
  nonce: string | null | undefined;
  /** Seconds since the epoch. */
  nowSeconds: number;
}

export type Decision<T> = { ok: true; value: T } | { ok: false; status: number; error: string };

export interface OidcIdentity {
  email: string;
  subjectId: string;
  attributes: Record<string, string>;
}

const str = (v: unknown): string | undefined => (typeof v === 'string' && v.trim() ? v.trim() : undefined);

/**
 * Check an ID token's claims against the session and config, and that its
 * email belongs to the organisation. Returns the identity to sign in, or a
 * 4xx refusal; nothing downstream should mint a link without `ok: true`.
 */
export function checkIdTokenClaims(
  claims: Record<string, unknown>,
  expected: IdTokenExpectations,
  organizationDomain: string | null | undefined,
): Decision<OidcIdentity> {
  const refuse = (error: string, status = 401): Decision<OidcIdentity> => ({ ok: false, status, error });

  const clientId = str(expected.clientId);
  if (!clientId) return refuse('SSO configuration is missing its OIDC client id', 400);

  const configuredIssuer = str(expected.issuer);
  if (configuredIssuer && str(claims.iss) !== configuredIssuer) return refuse('ID token issuer does not match');

  const aud = claims.aud;
  const audiences = Array.isArray(aud) ? aud.filter((a): a is string => typeof a === 'string') : typeof aud === 'string' ? [aud] : [];
  if (!audiences.includes(clientId)) return refuse('ID token audience does not match');
  if (audiences.length > 1 && claims.azp !== undefined && claims.azp !== clientId) {
    return refuse('ID token authorized party does not match');
  }

  if (typeof claims.exp !== 'number' || claims.exp <= expected.nowSeconds) return refuse('ID token has expired');

  const nonce = str(expected.nonce);
  if (!nonce || claims.nonce !== nonce) return refuse('ID token nonce does not match');

  const subjectId = str(claims.sub);
  if (!subjectId) return refuse('ID token has no subject');

  const rawEmail = str(claims.email);
  if (!rawEmail) return refuse('Unable to extract email from OIDC response', 400);
  if (claims.email_verified === false || claims.email_verified === 'false') {
    return refuse('Identity provider reports the email as unverified', 403);
  }
  const email = rawEmail.toLowerCase();
  if (!emailMatchesOrgDomain(email, organizationDomain)) {
    return refuse("Email is not in this organization's domain", 403);
  }

  const attributes: Record<string, string> = { email, nameId: subjectId };
  const given = str(claims.given_name);
  const family = str(claims.family_name);
  const name = str(claims.name);
  if (given) attributes.firstName = given;
  if (family) attributes.lastName = family;
  if (name) attributes.displayName = name;

  return { ok: true, value: { email, subjectId, attributes } };
}

/**
 * Last gate before auth.admin.generateLink: whatever path resolved the email
 * (new mapping, existing mapping, existing account), it must be the org's.
 */
export function mayMintLinkFor(email: string | null | undefined, organizationDomain: string | null | undefined): boolean {
  return emailMatchesOrgDomain(email, organizationDomain);
}
