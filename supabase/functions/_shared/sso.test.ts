/**
 * US-233: a forged SAML response signed in as any user. SAML is refused until
 * a real XML-DSig verifier exists; OIDC claims are checked; and no link is
 * minted for an address outside the organisation's domain.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  SAML_DISABLED_MESSAGE,
  checkIdTokenClaims,
  decodeJwtPayload,
  emailDomain,
  emailMatchesOrgDomain,
  isOidcProvider,
  isSamlProvider,
  mayMintLinkFor,
  type IdTokenExpectations,
} from './sso.ts';

const NOW = 1_800_000_000;
const expected: IdTokenExpectations = { clientId: 'client-1', issuer: 'https://idp.acme.com', nonce: 'n-123', nowSeconds: NOW };
const goodClaims = (): Record<string, unknown> => ({
  iss: 'https://idp.acme.com',
  aud: 'client-1',
  exp: NOW + 300,
  nonce: 'n-123',
  sub: 'idp-subject-1',
  email: 'Jane@Acme.com',
  email_verified: true,
  given_name: 'Jane',
  family_name: 'Doe',
  name: 'Jane Doe',
});

const b64url = (s: string) => Buffer.from(s).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const jwt = (payload: object) => `${b64url('{"alg":"RS256"}')}.${b64url(JSON.stringify(payload))}.sig`;

describe('provider families', () => {
  it('treats saml, okta and azure_ad as SAML and refuses them', () => {
    for (const p of ['saml', 'okta', 'azure_ad']) {
      expect(isSamlProvider(p)).toBe(true);
      expect(isOidcProvider(p)).toBe(false);
    }
  });
  it('treats oidc and google_workspace as OIDC', () => {
    for (const p of ['oidc', 'google_workspace']) {
      expect(isOidcProvider(p)).toBe(true);
      expect(isSamlProvider(p)).toBe(false);
    }
  });
  it('knows neither an unknown nor a missing provider', () => {
    expect(isOidcProvider('ldap')).toBe(false);
    expect(isSamlProvider(undefined)).toBe(false);
    expect(isOidcProvider(null)).toBe(false);
  });
});

describe('emailMatchesOrgDomain', () => {
  it('accepts the exact domain, case-insensitively', () => {
    expect(emailMatchesOrgDomain('jane@acme.com', 'acme.com')).toBe(true);
    expect(emailMatchesOrgDomain(' JANE@ACME.COM ', 'Acme.com')).toBe(true);
  });
  it('refuses another domain, a look-alike, a subdomain and a parent', () => {
    expect(emailMatchesOrgDomain('admin@agentbio.net', 'acme.com')).toBe(false);
    expect(emailMatchesOrgDomain('jane@evil-acme.com', 'acme.com')).toBe(false);
    expect(emailMatchesOrgDomain('jane@acme.com.evil.io', 'acme.com')).toBe(false);
    expect(emailMatchesOrgDomain('jane@mail.acme.com', 'acme.com')).toBe(false);
    expect(emailMatchesOrgDomain('jane@com', 'acme.com')).toBe(false);
  });
  it('refuses malformed addresses and a missing org domain', () => {
    expect(emailMatchesOrgDomain('jane@evil.io@acme.com', 'acme.com')).toBe(false);
    expect(emailMatchesOrgDomain('acme.com', 'acme.com')).toBe(false);
    expect(emailMatchesOrgDomain('@acme.com', 'acme.com')).toBe(false);
    expect(emailMatchesOrgDomain('jane@acme.com', '')).toBe(false);
    expect(emailMatchesOrgDomain('jane@acme.com', null)).toBe(false);
    expect(emailMatchesOrgDomain(undefined, 'acme.com')).toBe(false);
    expect(emailDomain('jane@')).toBeNull();
  });
  it('is the gate before a link is minted', () => {
    expect(mayMintLinkFor('jane@acme.com', 'acme.com')).toBe(true);
    expect(mayMintLinkFor('admin@agentbio.net', 'acme.com')).toBe(false);
  });
});

describe('decodeJwtPayload', () => {
  it('decodes a base64url payload, unpadded', () => {
    expect(decodeJwtPayload(jwt({ sub: 'a', name: 'Zoë ~?>' }))).toEqual({ sub: 'a', name: 'Zoë ~?>' });
  });
  it('throws on a malformed token or a non-object payload', () => {
    expect(() => decodeJwtPayload('not-a-jwt')).toThrow();
    expect(() => decodeJwtPayload(`a.${b64url('[1]')}.c`)).toThrow();
    expect(() => decodeJwtPayload(`a.${b64url('{oops')}.c`)).toThrow();
  });
});

describe('checkIdTokenClaims', () => {
  it('returns the identity, email lower-cased, for good claims', () => {
    const d = checkIdTokenClaims(goodClaims(), expected, 'acme.com');
    expect(d).toEqual({
      ok: true,
      value: {
        email: 'jane@acme.com',
        subjectId: 'idp-subject-1',
        attributes: { email: 'jane@acme.com', nameId: 'idp-subject-1', firstName: 'Jane', lastName: 'Doe', displayName: 'Jane Doe' },
      },
    });
  });

  it("refuses an email outside the organisation's domain with 403", () => {
    const d = checkIdTokenClaims({ ...goodClaims(), email: 'admin@agentbio.net' }, expected, 'acme.com');
    expect(d).toMatchObject({ ok: false, status: 403 });
  });

  it.each([
    ['wrong issuer', { iss: 'https://evil.example' }],
    ['wrong audience', { aud: 'someone-else' }],
    ['audience list without us', { aud: ['a', 'b'] }],
    ['expired', { exp: NOW - 1 }],
    ['no exp', { exp: undefined }],
    ['wrong nonce', { nonce: 'n-999' }],
    ['no nonce', { nonce: undefined }],
    ['no subject', { sub: '' }],
  ])('refuses %s with 401', (_label, patch) => {
    const d = checkIdTokenClaims({ ...goodClaims(), ...patch }, expected, 'acme.com');
    expect(d).toMatchObject({ ok: false, status: 401 });
  });

  it('accepts an audience list containing us when azp is ours, refuses a foreign azp', () => {
    expect(checkIdTokenClaims({ ...goodClaims(), aud: ['client-1', 'x'], azp: 'client-1' }, expected, 'acme.com').ok).toBe(true);
    expect(checkIdTokenClaims({ ...goodClaims(), aud: ['client-1', 'x'], azp: 'x' }, expected, 'acme.com').ok).toBe(false);
  });

  it('refuses when the session has no nonce, even if the token has none either', () => {
    const d = checkIdTokenClaims({ ...goodClaims(), nonce: undefined }, { ...expected, nonce: null }, 'acme.com');
    expect(d.ok).toBe(false);
  });

  it('skips the issuer check only when no issuer is configured', () => {
    expect(checkIdTokenClaims({ ...goodClaims(), iss: 'anything' }, { ...expected, issuer: null }, 'acme.com').ok).toBe(true);
  });

  it('refuses a config without a client id, a missing email and an unverified one', () => {
    expect(checkIdTokenClaims(goodClaims(), { ...expected, clientId: '' }, 'acme.com')).toMatchObject({ ok: false, status: 400 });
    expect(checkIdTokenClaims({ ...goodClaims(), email: undefined }, expected, 'acme.com')).toMatchObject({ ok: false, status: 400 });
    expect(checkIdTokenClaims({ ...goodClaims(), email_verified: false }, expected, 'acme.com')).toMatchObject({ ok: false, status: 403 });
  });
});

describe('the edge functions use it', () => {
  const read = (fn: string) => readFileSync(join(__dirname, '..', fn, 'index.ts'), 'utf8');
  const callback = read('sso-callback');
  const initiate = read('sso-initiate');

  it('sso-callback refuses any SAMLResponse before touching the database', () => {
    const refusal = callback.indexOf('throw new SsoError(SAML_DISABLED_MESSAGE');
    expect(refusal).toBeGreaterThan(-1);
    expect(refusal).toBeLessThan(callback.indexOf('.from('));
    expect(callback).not.toMatch(/extractSAMLAttributes|AttributeValue|NameID/);
  });

  it('sso-callback checks the ID token and the domain before generateLink', () => {
    const mint = callback.indexOf('generateLink(');
    expect(callback.indexOf('checkIdTokenClaims(')).toBeGreaterThan(-1);
    expect(callback.indexOf('checkIdTokenClaims(')).toBeLessThan(mint);
    expect(callback.indexOf('mayMintLinkFor(')).toBeGreaterThan(-1);
    expect(callback.indexOf('mayMintLinkFor(')).toBeLessThan(mint);
  });

  it('sso-initiate refuses SAML providers and never builds a SAMLRequest', () => {
    expect(initiate).toContain('isSamlProvider(ssoConfig.sso_provider)');
    expect(initiate).not.toContain('SAMLRequest');
    expect(initiate.indexOf('isSamlProvider(')).toBeLessThan(initiate.indexOf("from('sso_login_sessions')"));
  });

  it('says why in plain words', () => {
    expect(SAML_DISABLED_MESSAGE).toMatch(/SAML/);
    expect(SAML_DISABLED_MESSAGE).toMatch(/OIDC/);
  });
});
