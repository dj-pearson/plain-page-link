/**
 * US-169: src/utils/navigation.ts holds this application's open-redirect guard
 * and its protocol allow-list, and had no test of any kind.
 *
 * What it did have was a Playwright spec claiming to cover it —
 * "should sanitize XSS in redirect URLs" in tests/security/xss.security.spec.ts,
 * which loaded /auth/login?redirect=javascript:alert(1), submitted the form, and
 * asserted:
 *
 *     expect(page.url()).not.toMatch(/^javascript:/)
 *
 * `page.url()` after a same-document form submit cannot begin with `javascript:`
 * whatever the code does. The assertion could not fail. So the one genuinely
 * dangerous parameter in the app — Login.tsx really does read `?redirect=` and
 * hand it to validateRedirectPath — was covered by a test incapable of noticing
 * if the guard were deleted.
 *
 * These run in milliseconds, against the function itself, and each one fails if
 * the guard stops working. That is the whole difference.
 */
import { describe, it, expect, vi } from 'vitest';
import { validateRedirectPath, isValidExternalUrl, getSafeReturnUrl } from './navigation';

vi.mock('@/lib/logger', () => ({
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

describe('validateRedirectPath', () => {
  it('allows a path on the allow-list', () => {
    expect(validateRedirectPath('/dashboard')).toBe('/dashboard');
    expect(validateRedirectPath('/settings')).toBe('/settings');
  });

  it('allows a child of an allowed path', () => {
    expect(validateRedirectPath('/dashboard/leads')).toBe('/dashboard/leads');
    expect(validateRedirectPath('/legal/privacy')).toBe('/legal/privacy');
  });

  it('preserves query and hash, which is the point of not just returning the prefix', () => {
    expect(validateRedirectPath('/dashboard/leads?status=new')).toBe('/dashboard/leads?status=new');
    expect(validateRedirectPath('/dashboard#section')).toBe('/dashboard#section');
    expect(validateRedirectPath('/dashboard/leads?a=1#b')).toBe('/dashboard/leads?a=1#b');
  });

  /**
   * Verified by mutation, not by assumption. Two changes were made to
   * validateRedirectPath and the suite re-run:
   *
   *   Replacing `cleanPath === allowed || cleanPath.startsWith(allowed + '/')`
   *   with a plain `startsWith(allowed)` — CAUGHT, by "refuses a path that
   *   merely resembles an allowed one". That is the load-bearing check.
   *
   *   Deleting the `cleanPath.startsWith('//')` rejection — NOT caught, and
   *   correctly so: with this allow-list, `//evil.example.com` fails the
   *   allow-list anyway, so removing that clause changes no observable
   *   behaviour. It is defence in depth against a future loosening of the
   *   list, and a behavioural test cannot see a branch that is unreachable.
   *   Recorded here so nobody mistakes it for a hole in these tests, and so
   *   nobody deletes the clause on the grounds that nothing failed.
   */
  describe('refuses to send the visitor off-site', () => {
    // Each of these is a real open-redirect payload. A guard that returns
    // anything but the default for one of them is a live vulnerability.
    it.each([
      ['//evil.example.com', 'protocol-relative URL — the classic bypass'],
      ['///evil.example.com', 'three slashes, same trick'],
      ['https://evil.example.com', 'absolute URL'],
      ['http://evil.example.com/dashboard', 'absolute URL that ends in an allowed path'],
      ['//evil.example.com/dashboard', 'protocol-relative ending in an allowed path'],
    ])('blocks %s (%s)', (payload) => {
      expect(validateRedirectPath(payload)).toBe('/dashboard');
    });
  });

  describe('refuses a script-bearing scheme', () => {
    it.each([
      ['javascript:alert(1)'],
      ['JavaScript:alert(1)'],
      ['data:text/html,<script>alert(1)</script>'],
      ['vbscript:msgbox(1)'],
      ['file:///etc/passwd'],
    ])('blocks %s', (payload) => {
      expect(validateRedirectPath(payload)).toBe('/dashboard');
    });
  });

  it('refuses a path that merely resembles an allowed one', () => {
    // `startsWith(allowed + '/')` is what makes these different, and a change
    // to plain startsWith(allowed) would let all of them through.
    expect(validateRedirectPath('/dashboard-evil')).toBe('/dashboard');
    expect(validateRedirectPath('/adminpanel')).toBe('/dashboard');
    expect(validateRedirectPath('/settingsomething')).toBe('/dashboard');
  });

  it('refuses anything not on the allow-list at all', () => {
    expect(validateRedirectPath('/some/unknown/route')).toBe('/dashboard');
    expect(validateRedirectPath('/')).toBe('/dashboard');
  });

  it('handles absent and non-string input without throwing', () => {
    expect(validateRedirectPath(null)).toBe('/dashboard');
    expect(validateRedirectPath(undefined)).toBe('/dashboard');
    expect(validateRedirectPath('')).toBe('/dashboard');
    expect(validateRedirectPath(123 as unknown as string)).toBe('/dashboard');
  });

  it('honours a caller-supplied default rather than assuming /dashboard', () => {
    expect(validateRedirectPath('https://evil.example.com', '/pricing')).toBe('/pricing');
    expect(validateRedirectPath(null, '/pricing')).toBe('/pricing');
  });
});

describe('isValidExternalUrl', () => {
  it('accepts the protocols a profile link may use', () => {
    expect(isValidExternalUrl('https://agentbio.net')).toBe(true);
    expect(isValidExternalUrl('http://example.com')).toBe(true);
    expect(isValidExternalUrl('mailto:agent@example.com')).toBe(true);
    expect(isValidExternalUrl('tel:+15551234567')).toBe(true);
  });

  it.each([
    ['javascript:alert(1)'],
    ['JAVASCRIPT:alert(1)'],
    ['  javascript:alert(1)  '],
    ['data:text/html,<script>alert(1)</script>'],
    ['vbscript:msgbox(1)'],
    ['file:///etc/passwd'],
  ])('rejects %s', (url) => {
    expect(isValidExternalUrl(url)).toBe(false);
  });

  it('rejects a scheme it does not recognise rather than allowing by default', () => {
    // An allow-list, not a block-list: this is what makes the block-list above
    // a belt-and-braces check rather than the only thing standing there.
    expect(isValidExternalUrl('ftp://example.com')).toBe(false);
    expect(isValidExternalUrl('ssh://example.com')).toBe(false);
    expect(isValidExternalUrl('//evil.example.com')).toBe(false);
    expect(isValidExternalUrl('example.com')).toBe(false);
  });

  it('handles absent and non-string input without throwing', () => {
    expect(isValidExternalUrl('')).toBe(false);
    expect(isValidExternalUrl(null as unknown as string)).toBe(false);
    expect(isValidExternalUrl(undefined as unknown as string)).toBe(false);
  });
});

describe('getSafeReturnUrl', () => {
  it('reads the named parameter and validates it', () => {
    expect(getSafeReturnUrl(new URLSearchParams('returnTo=/dashboard/leads'))).toBe(
      '/dashboard/leads'
    );
  });

  it('validates rather than trusting — the whole reason it is not searchParams.get', () => {
    expect(getSafeReturnUrl(new URLSearchParams('returnTo=https://evil.example.com'))).toBe(
      '/dashboard'
    );
    expect(getSafeReturnUrl(new URLSearchParams('returnTo=//evil.example.com'))).toBe('/dashboard');
  });

  it('falls back when the parameter is absent', () => {
    expect(getSafeReturnUrl(new URLSearchParams(''))).toBe('/dashboard');
    expect(getSafeReturnUrl(new URLSearchParams('other=1'), 'returnTo', '/pricing')).toBe(
      '/pricing'
    );
  });

  it('reads whichever parameter name it is given', () => {
    expect(getSafeReturnUrl(new URLSearchParams('redirect=/settings'), 'redirect')).toBe(
      '/settings'
    );
  });
});
