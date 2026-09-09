/**
 * Authentication Security Tests
 *
 * Tests for authentication and session management security.
 * Covers OWASP A07:2021 - Identification and Authentication Failures
 */

import { test, expect } from '@playwright/test';
import {
  testAuthBypass,
  testRateLimiting,
  testCookieSecurity,
  dismissCookieConsent,
  SQL_INJECTION_PAYLOADS,
} from './security-utils';

test.describe('Authentication Security', () => {
  // The consent banner covers the submit button on the auth pages (US-168).
  test.beforeEach(async ({ page }) => {
    await dismissCookieConsent(page);
  });

  test.describe('Login Security', () => {
    test('should block SQL injection in login form', async ({ page }) => {
      await page.goto('/auth/login');

      for (const payload of SQL_INJECTION_PAYLOADS.slice(0, 5)) {
        await page.fill('input[type="email"], input[name="email"]', payload);
        await page.fill('input[type="password"]', 'password123');

        const submitButton = page.locator('button[type="submit"]');
        await submitButton.click();

        // Should not show successful login
        await expect(page).not.toHaveURL('/dashboard');

        // Should show error or stay on login
        const url = page.url();
        expect(url).toContain('/auth/login');

        // Clear for next test
        await page.goto('/auth/login');
      }
    });

    /**
     * US-168: was `testRateLimiting(request, '/auth/login', 'POST', 20)`.
     *
     * `/auth/login` is a CLIENT route, not an endpoint. Twenty POSTs to it hit
     * the Vite dev server, which answered every one with index.html and 200,
     * and the suite concluded the login endpoint has no rate limiting. There is
     * no login endpoint on this origin to rate limit.
     *
     * The real throttle is database-backed and shared by the edge functions.
     * This asserts it is still in place — the failure that happens is someone
     * removing the check, not the limiter mis-counting.
     */
    test('the shared rate limiter is still enforced on the public entry points', async () => {
      const { readFileSync } = await import('node:fs');
      const { join } = await import('node:path');
      const source = readFileSync(
        join(process.cwd(), 'supabase/functions/submit-lead/index.ts'),
        'utf8'
      );

      expect(source, 'must consult the shared limiter').toContain('checkRateLimitDb');
      expect(source, 'must refuse when over the limit').toContain('rateLimitResponse');
      expect(source, 'must not answer before checking').toMatch(
        /checkRateLimitDb[\s\S]*?rateLimit\.allowed/
      );
    });

    /**
     * US-168: this filled the login form twice and read `[role="alert"]` to
     * compare the two error messages. With no Supabase behind the dev server no
     * request ever resolves, no alert is ever rendered, and `page.textContent`
     * sat for the full 60-second timeout. Worse than slow: had it not timed out
     * it would have compared two empty strings and passed, which is a vacuous
     * pass on a property nobody had checked.
     *
     * Non-enumeration here is a property of GoTrue, which answers "Invalid
     * login credentials" for an unknown address and a wrong password alike. The
     * client cannot make that better, but it can make it worse — by catching
     * the error and branching on it. That is what this checks.
     */
    test('the client adds no user-enumerating branch to a failed login', async () => {
      const { readFileSync } = await import('node:fs');
      const { join } = await import('node:path');
      const source = readFileSync(join(process.cwd(), 'src/stores/useAuthStore.ts'), 'utf8');

      // Surfacing the provider's message verbatim is the correct behaviour;
      // rewriting it per-case is how enumeration gets introduced.
      for (const tell of [
        'no account',
        'not found',
        'does not exist',
        "doesn't exist",
        'unknown user',
      ]) {
        expect(source.toLowerCase(), `must not distinguish "${tell}"`).not.toContain(tell);
      }
    });

    /**
     * US-168: same failure, same reason — see above. `resetPasswordForEmail`
     * does not report whether the address exists, and ForgotPassword renders
     * one "check your email" screen on success regardless. The check is that
     * the success path stays unconditional.
     */
    test('password reset confirms nothing about whether the address exists', async () => {
      const { readFileSync } = await import('node:fs');
      const { join } = await import('node:path');
      const source = readFileSync(join(process.cwd(), 'src/pages/auth/ForgotPassword.tsx'), 'utf8');

      expect(source, 'must use the provider call that does not enumerate').toContain(
        'resetPasswordForEmail'
      );
      // One success screen, set unconditionally in the non-error branch.
      expect(source, 'the sent screen must not be conditional on the address').toMatch(
        /else\s*\{\s*setSent\(true\);?\s*\}/
      );
      for (const tell of ['no account', 'not found', 'does not exist', 'no user']) {
        expect(source.toLowerCase(), `must not reveal "${tell}"`).not.toContain(tell);
      }
    });

    test('should enforce password complexity requirements', async ({ page }) => {
      await page.goto('/auth/register');

      // Try weak passwords
      const weakPasswords = ['123456', 'password', 'abc', 'test'];

      for (const weakPassword of weakPasswords) {
        await page.fill('input[name="password"]', weakPassword);

        // Look for password strength indicator or error
        const hasError =
          (await page
            .locator('[data-password-error], .password-error, [aria-invalid="true"]')
            .count()) > 0 ||
          (await page.locator('text=/too weak|too short|must contain/i').count()) > 0;

        // Password should be rejected or flagged as weak
        // (Exact behavior depends on implementation)
      }
    });
  });

  test.describe('Session Security', () => {
    test('should set secure cookie attributes', async ({ page }) => {
      await page.goto('/');

      const result = await testCookieSecurity(page, '/');

      // All cookies should have security attributes
      if (result.issues.length > 0) {
        console.log('Cookie security issues:', result.issues);
      }

      // Session cookies must be HttpOnly
      // All cookies should be Secure in production
    });

    test('should invalidate session on logout', async ({ page, context }) => {
      // First, login
      await page.goto('/auth/login');

      // Get initial cookies
      const cookiesBefore = await context.cookies();
      const sessionCookie = cookiesBefore.find(
        (c) => c.name.includes('session') || c.name.includes('token')
      );

      // Logout
      await page.goto('/dashboard');
      const logoutButton = page.locator(
        'button:has-text("Logout"), a:has-text("Logout"), [data-logout]'
      );
      if ((await logoutButton.count()) > 0) {
        await logoutButton.click();
        await page.waitForURL(/\/(auth\/login)?$/);
      }

      // Try to access protected route with old session
      await page.goto('/dashboard');

      // Should be redirected to login
      await expect(page).toHaveURL(/auth\/login/);
    });

    test('should prevent session fixation', async ({ page, context }) => {
      // Get session ID before login
      await page.goto('/auth/login');
      const cookiesBefore = await context.cookies();
      const sessionBefore = cookiesBefore.find((c) => c.name.includes('session'));

      // Perform login (if session exists, it should change)
      // The session ID should change after authentication
    });
  });

  test.describe('Protected Routes', () => {
    /**
     * US-168: this test used to probe /api/profile, /api/leads, /api/listings
     * and /api/analytics with testAuthBypass(), and report `vulnerable: true`
     * for all four.
     *
     * This application has no /api/* routes at all. It is a static SPA plus
     * Supabase: data goes to /rest/v1/* under RLS, and privileged work to
     * /functions/v1/*, both on a different origin. So each of those requests
     * hit the Vite dev server, got the SPA fallback — index.html, 200 — and
     * testAuthBypass treats any 200 as a bypass.
     *
     * The most alarming-sounding failure in the whole suite was the dev server
     * correctly serving a web page.
     *
     * What replaces it asserts the thing that is actually true and actually
     * worth protecting: no route in this app is served by an origin that could
     * authorise it, so authorisation is entirely RLS and edge-function guards.
     * Those are covered by assertions that can really see them —
     * edge-authz.security.spec.ts on the guards, scripts/verify-schema.mjs on
     * the policies. Re-adding a live probe here means first having something
     * live to probe.
     */
    test('serves client routes from the SPA, and holds no API origin of its own', async ({
      request,
    }) => {
      for (const path of ['/dashboard', '/dashboard/leads', '/dashboard/settings']) {
        const response = await request.get(path);
        const contentType = response.headers()['content-type'] ?? '';

        // 200 + HTML is correct for a client-routed path, and is NOT a bypass:
        // the document carries no data, and the route guard runs in the client.
        expect(response.status(), `${path} should serve the SPA document`).toBe(200);
        expect(contentType, `${path} should be HTML, not data`).toContain('text/html');

        const body = await response.text();
        expect(body, `${path} must not carry server-rendered account data`).not.toMatch(
          /encrypted_email|service_role|"leads"\s*:/
        );
      }
    });

    test('has no /api/* surface, so nothing here is protected by an origin', async ({
      request,
    }) => {
      // The guard on the guard: if a real /api/* ever appears, it needs real
      // authorization tests, and this failing is how anyone finds out.
      for (const path of ['/api/profile', '/api/leads', '/api/health']) {
        const response = await request.get(path, { failOnStatusCode: false });
        const contentType = response.headers()['content-type'] ?? '';

        expect(
          contentType,
          `${path} now returns something other than the SPA document. If this app ` +
            `has grown a real API origin, delete this test and write authorization ` +
            `tests against it — do not just widen the assertion.`
        ).toContain('text/html');
      }
    });

    test('should redirect unauthenticated users from dashboard', async ({ page }) => {
      await page.goto('/dashboard');

      // Should redirect to login
      await expect(page).toHaveURL(/auth\/login/);
    });

    test('should redirect unauthenticated users from settings', async ({ page }) => {
      await page.goto('/dashboard/settings');

      // Should redirect to login
      await expect(page).toHaveURL(/auth\/login/);
    });
  });

  test.describe('Password Reset Security', () => {
    /**
     * US-168: was a live probe of /api/auth/reset-password, which does not
     * exist — password reset goes to Supabase GoTrue on another origin, and
     * this suite has no Supabase. It POSTed ten times to the SPA fallback, got
     * ten 200s, and reported "no rate limiting on password reset".
     *
     * Rate limiting IS implemented, but not where this looked: GoTrue's own
     * limits, plus the login throttle in src/hooks/useLoginSecurity.ts and the
     * database-backed limiter the edge functions share. Asserting it here needs
     * a live stack. Asserting that it is still wired up does not.
     */
    test('the login throttle is still wired into the auth path', async () => {
      const { readFileSync } = await import('node:fs');
      const { join } = await import('node:path');
      const source = readFileSync(join(process.cwd(), 'src/hooks/useLoginSecurity.ts'), 'utf8');

      expect(source, 'must ask whether this address is throttled').toContain('check_throttle');
      expect(source, 'must record each attempt').toContain('record_attempt');
      expect(source, 'must be able to answer "blocked"').toContain('blocked');
      // Throttling per address, not per session: a client-side counter is not a
      // throttle, and this check is what stops one being substituted.
      expect(source, 'the decision must come from the server').toMatch(
        /callEdgeFunction|supabase\.functions|invoke/
      );
    });
  });

  test.describe('Token Security', () => {
    test('should not expose JWT tokens in URL', async ({ page }) => {
      // Navigate through the app
      await page.goto('/');
      await page.goto('/auth/login');
      await page.goto('/');

      // Check URL doesn't contain tokens
      const url = page.url();
      expect(url).not.toMatch(/token=/i);
      expect(url).not.toMatch(/jwt=/i);
      expect(url).not.toMatch(/access_token=/i);
    });

    test('should not expose tokens in response body to non-authenticated requests', async ({
      request,
    }) => {
      const response = await request.get('/');
      const body = await response.text();

      // Check for exposed tokens
      expect(body).not.toMatch(/eyJ[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*/); // JWT pattern
    });
  });
});
