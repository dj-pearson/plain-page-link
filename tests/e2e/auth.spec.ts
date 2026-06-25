/**
 * End-to-End Authentication Flow Tests
 *
 * Exercises the critical auth user journeys in a real browser against the
 * dev server: login, registration, logout, and protected-route enforcement.
 *
 * Supabase network calls (GoTrue auth, PostgREST, edge functions) are
 * intercepted so the suite is hermetic — it verifies the app's behavior
 * without depending on a live backend or seeded credentials.
 */

import { test, expect, type Page } from '@playwright/test';

const TEST_USER = {
  id: '00000000-0000-4000-8000-000000000001',
  email: 'e2e-user@example.com',
  password: 'E2eP@ssw0rd!',
  username: 'e2euser',
  fullName: 'E2E User',
};

/** A GoTrue-shaped session the supabase-js client will accept and persist. */
function fakeSession() {
  const nowSeconds = Math.floor(Date.now() / 1000);
  return {
    access_token: 'fake-access-token',
    refresh_token: 'fake-refresh-token',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: nowSeconds + 3600,
    user: {
      id: TEST_USER.id,
      aud: 'authenticated',
      role: 'authenticated',
      email: TEST_USER.email,
      app_metadata: { provider: 'email' },
      user_metadata: { username: TEST_USER.username, full_name: TEST_USER.fullName },
      created_at: new Date(0).toISOString(),
    },
  };
}

/**
 * Installs hermetic Supabase mocks. Routes registered later take precedence
 * in Playwright, so the broad REST catch-all is registered first and the
 * table-specific handlers after it.
 */
async function setupSupabaseMocks(page: Page) {
  // Pre-seed cookie consent so the global consent banner (which overlays the
  // page and intercepts clicks) never renders during the flow.
  await page.addInitScript(() => {
    try {
      window.localStorage.setItem(
        'cookie_consent_v1',
        JSON.stringify({
          version: 1,
          timestamp: new Date(0).toISOString(),
          necessary: true,
          analytics: false,
          preferences: false,
        })
      );
    } catch {
      /* localStorage unavailable — ignore */
    }
  });

  // Catch-all for any PostgREST query → empty result set.
  await page.route('**/rest/v1/**', (route) =>
    route.fulfill({ contentType: 'application/json', body: '[]' })
  );

  // Profile lookup uses .single() → return a single object.
  await page.route('**/rest/v1/profiles**', (route) =>
    route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        id: TEST_USER.id,
        username: TEST_USER.username,
        full_name: TEST_USER.fullName,
      }),
    })
  );

  // Roles list.
  await page.route('**/rest/v1/user_roles**', (route) =>
    route.fulfill({ contentType: 'application/json', body: '[]' })
  );

  // MFA settings use .maybeSingle() → empty object means "no MFA".
  await page.route('**/rest/v1/user_mfa_settings**', (route) =>
    route.fulfill({ contentType: 'application/json', body: '{}' })
  );

  // Edge functions (login-security throttle/record, audit) → benign success.
  await page.route('**/functions/v1/**', (route) =>
    route.fulfill({
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

  // GoTrue auth endpoints.
  await page.route('**/auth/v1/token**', (route) =>
    route.fulfill({ contentType: 'application/json', body: JSON.stringify(fakeSession()) })
  );
  // Return a session-shaped response (access_token present) so supabase-js
  // treats signup as auto-confirmed and persists a session — the app then
  // routes to onboarding instead of the email-verification (OTP) screen.
  await page.route('**/auth/v1/signup**', (route) =>
    route.fulfill({ contentType: 'application/json', body: JSON.stringify(fakeSession()) })
  );
  await page.route('**/auth/v1/user**', (route) =>
    route.fulfill({ contentType: 'application/json', body: JSON.stringify(fakeSession().user) })
  );
  await page.route('**/auth/v1/logout**', (route) => route.fulfill({ status: 204, body: '' }));
}

test.describe('Authentication E2E', () => {
  test('protected route redirects unauthenticated users to login', async ({ page }) => {
    await setupSupabaseMocks(page);

    await page.goto('/dashboard');

    // ProtectedRoute resolves no session and redirects to the login page.
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 15000 });
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test('login form renders and validates input', async ({ page }) => {
    await setupSupabaseMocks(page);

    await page.goto('/auth/login');

    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();

    // Submitting an invalid email keeps the user on the login page.
    await page.fill('input[type="email"]', 'not-an-email');
    await page.fill('input[type="password"]', 'x');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('login flow signs in and redirects to the dashboard', async ({ page }) => {
    await setupSupabaseMocks(page);

    await page.goto('/auth/login');
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
  });

  test('registration flow submits and leaves the registration page on success', async ({
    page,
  }) => {
    await setupSupabaseMocks(page);

    await page.goto('/auth/register');

    await page.fill('#register-username', TEST_USER.username);
    await page.fill('#register-name', TEST_USER.fullName);
    await page.fill('#register-email', TEST_USER.email);
    await page.fill('#register-password', TEST_USER.password);
    await page.fill('#register-confirm-password', TEST_USER.password);
    await page.check('input[type="checkbox"]');

    await page.click('button[type="submit"]');

    // On success the app navigates away from /auth/register (to onboarding).
    await expect(page).not.toHaveURL(/\/auth\/register/, { timeout: 15000 });
  });

  test('logout returns the user to the login page', async ({ page }) => {
    await setupSupabaseMocks(page);

    // Sign in first.
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });

    // Trigger logout from the dashboard sidebar.
    await page.click('button:has-text("Log Out")');

    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 15000 });
  });
});
