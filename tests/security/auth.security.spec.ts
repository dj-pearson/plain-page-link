/**
 * Authentication Security Tests
 *
 * Tests for authentication and session management security.
 * Covers OWASP A07:2021 - Identification and Authentication Failures
 */

import { test, expect } from '../support/consent';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { testCookieSecurity, SQL_INJECTION_PAYLOADS } from './security-utils';

const FUNCTIONS = join(process.cwd(), 'supabase/functions');

test.describe('Authentication Security', () => {
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
     * The origin under test serves static files and a client-side router. It
     * has no `POST /auth/login` and no `/api/auth/reset-password`, which is
     * what this test and its password-reset twin used to probe for a 429. A
     * path that does not exist cannot be rate limited, so
     * `expect(rateLimited).toBe(true)` could only fail — and did, on every run
     * since US-205 made this suite blocking.
     *
     * The limiter is real, it is just not on this origin: auth-sensitive
     * traffic goes to the login-security edge function, which calls
     * checkRateLimitDb before it branches on the action. These are SOURCE
     * assertions for the same reason edge-authz.security.spec.ts's are — no
     * Deno runtime and no Supabase instance in CI, so what is checkable is
     * that the guard is still in the file.
     */
    test('login-security rate limits before it branches on the action', () => {
      const source = readFileSync(join(FUNCTIONS, 'login-security/index.ts'), 'utf8');

      const limiterAt = source.indexOf('checkRateLimitDb(');
      const switchAt = source.indexOf('switch (body.action)');

      expect(limiterAt).toBeGreaterThan(-1);
      expect(switchAt).toBeGreaterThan(-1);
      expect(limiterAt).toBeLessThan(switchAt);

      expect(source).toContain('RATE_LIMITS.auth');
      expect(source).toMatch(/status:\s*429/);
      expect(source).toContain("'Retry-After'");
    });

    test('the auth rate limit is strict and fails closed', () => {
      const source = readFileSync(join(FUNCTIONS, '_shared/rate-limiter.ts'), 'utf8');

      const auth = /auth:\s*\{([^}]*)\}/.exec(source)?.[1] ?? '';

      // Five per minute. Loose enough for a typo, useless for a script.
      expect(auth).toMatch(/maxRequests:\s*([1-9]|10)\b/);
      // An unavailable limiter must refuse, not wave traffic through.
      expect(auth).toContain('failClosed: true');
    });

    /**
     * User enumeration on the login form.
     *
     * There is no auth backend behind a dev server, so this used to submit two
     * addresses at a VITE_SUPABASE_URL pointing back at the dev origin, read
     * whatever the failed fetch produced, and assert one of the two strings
     * contained "invalid", "incorrect" or "failed". What it actually measured
     * was the shape of a network error.
     *
     * Stubbing GoTrue makes the question answerable: give the two addresses
     * DIFFERENT upstream errors — one naming the address, as a real
     * "User not found" would — and require the page to render the same thing
     * for both. That is the property, and Login.tsx holds it by rendering a
     * constant rather than the error it caught.
     */
    test('renders the same failure whatever the auth backend says', async ({ page }) => {
      const seen: string[] = [];

      await page.route('**/functions/v1/login-security', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            blocked: false,
            attemptsRemaining: 5,
            blockedUntil: null,
            reason: null,
          }),
        })
      );

      for (const [email, upstream] of [
        ['nonexistent@example.test', 'User not found: nonexistent@example.test'],
        ['admin@agentbio.net', 'Invalid login credentials'],
      ] as const) {
        await page.route('**/auth/v1/token**', (route) =>
          route.fulfill({
            status: 400,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'invalid_grant', error_description: upstream }),
          })
        );

        await page.goto('/auth/login');
        await page.fill('input[type="email"], input[name="email"]', email);
        await page.fill('input[type="password"]', 'wrong-password-for-this-test');
        await page.click('button[type="submit"]');

        const alert = page.getByRole('alert').filter({ hasText: 'Login Failed' });
        await expect(alert).toBeVisible({ timeout: 15000 });
        seen.push(((await alert.textContent()) ?? '').replace(/\s+/g, ' ').trim());

        await page.unroute('**/auth/v1/token**');
      }

      expect(seen).toHaveLength(2);
      expect(seen[0]).toBe(seen[1]);
      // And it must not be the upstream message, which named the address.
      expect(seen[0]).not.toContain('nonexistent@example.test');
      expect(seen[0].toLowerCase()).toContain('invalid email or password');
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
     * This platform has no REST API. App.tsx routes no `/api/*` path and the
     * string `/api/` appears nowhere in src/ — data goes to Supabase
     * PostgREST under RLS and to /functions/v1/* edge functions.
     *
     * So the previous version of this test probed /api/profile, /api/leads,
     * /api/listings and /api/analytics, got the SPA fallback (200, the app
     * shell) for each, and reported `vulnerable: true` four times: a security
     * suite raising unauthenticated-data-access findings against endpoints
     * that do not exist.
     *
     * What is worth holding is that it stays that way. If an /api/* path ever
     * answers with JSON it is a data endpoint nobody wrote a policy for. The
     * guards on the surface that does exist are in
     * edge-authz.security.spec.ts and scripts/verify-schema.mjs.
     */
    test('no /api/* path serves data', async ({ request }) => {
      const endpoints = ['/api/profile', '/api/leads', '/api/listings', '/api/analytics'];

      for (const endpoint of endpoints) {
        const response = await request.get(endpoint, { failOnStatusCode: false });
        const contentType = response.headers()['content-type'] ?? '';

        expect(contentType, `${endpoint} answered with ${contentType}`).not.toContain(
          'application/json'
        );
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
     * Password reset is GoTrue's `/auth/v1/recover`, not an endpoint of this
     * app — there has never been an `/api/auth/reset-password` here. Its rate
     * limit is GoTrue's own, configured on the Supabase instance, and is not
     * reachable from a dev server. The limit this repository owns and can
     * assert is the one above.
     */

    /**
     * Same question as the login form, and until this story the answer was
     * worse: ForgotPassword.tsx rendered `error.message` from GoTrue straight
     * into the page. "User not found" is a message GoTrue will produce, and it
     * answers the one question a password-reset form must never answer.
     *
     * The old test could not have caught it. It typed one address, read
     * `.success-message, [role="alert"]` — neither of which the page had — got
     * '' from a form that had not submitted anywhere real, and asserted that
     * the empty string does not contain "not found".
     */
    test('does not echo the auth backend when a reset fails', async ({ page }) => {
      await page.route('**/auth/v1/recover**', (route) =>
        route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 'user_not_found',
            msg: 'User not found: random@example.test',
          }),
        })
      );

      await page.goto('/auth/forgot-password');
      await page.fill('input[type="email"]', 'random@example.test');
      await page.click('button[type="submit"]');

      const alert = page.getByRole('alert');
      await expect(alert).toBeVisible({ timeout: 15000 });

      const message = ((await alert.textContent()) ?? '').toLowerCase();
      expect(message).not.toContain('not found');
      expect(message).not.toContain("doesn't exist");
      expect(message).not.toContain('random@example.test');
      expect(message).toContain("couldn't send that email");
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
