/**
 * End-to-end onboarding.
 *
 * US-108: filling in the Location field — with the placeholder's own example,
 * "Austin, TX" — made the wizard write a `city` column that `profiles` does
 * not have. PostgREST rejected the whole update, so the agent's name, title,
 * bio, phone, avatar, theme AND onboarding_completed_at were lost together;
 * they saw "Failed to save your information" and were routed back into the
 * wizard on every login afterwards.
 *
 * The spec that matters is therefore the one with a Location filled in. It
 * asserts what the wizard SENDS — a PATCH naming only real columns — because
 * the failure was in the payload, and a hermetic run cannot observe a real
 * database rejecting it.
 *
 * Supabase calls are intercepted, as in auth.spec.ts, so this needs no backend.
 */

import { test, expect, type Page, type Request } from '@playwright/test';

const TEST_USER = {
  id: '00000000-0000-4000-8000-000000000002',
  email: 'e2e-onboarding@example.com',
  username: 'e2eonboarding',
  fullName: 'E2E Onboarding',
};

/** Columns `profiles` actually has, as far as this flow is concerned. */
const REAL_PROFILE_COLUMNS = new Set([
  'full_name',
  'title',
  'bio',
  'phone',
  'avatar_url',
  'theme',
  'service_cities',
  'license_state',
  'onboarding_completed_at',
  'updated_at',
]);

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

async function setupMocks(page: Page, profilePatches: Request[]) {
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

  await page.route('**/rest/v1/**', (route) =>
    route.fulfill({ contentType: 'application/json', body: '[]' })
  );

  await page.route('**/rest/v1/profiles**', (route) => {
    const request = route.request();
    if (request.method() === 'PATCH') {
      profilePatches.push(request);
      return route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({ id: TEST_USER.id }),
      });
    }
    return route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        id: TEST_USER.id,
        username: TEST_USER.username,
        full_name: TEST_USER.fullName,
        onboarding_completed_at: null,
      }),
    });
  });

  await page.route('**/rest/v1/user_roles**', (route) =>
    route.fulfill({ contentType: 'application/json', body: '[]' })
  );

  // .maybeSingle() → an empty object means "no MFA".
  await page.route('**/rest/v1/user_mfa_settings**', (route) =>
    route.fulfill({ contentType: 'application/json', body: '{}' })
  );

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

  // Per-endpoint, as in auth.spec.ts: supabase-js expects a different shape
  // from each, so a single catch-all leaves the client unauthenticated.
  await page.route('**/auth/v1/token**', (route) =>
    route.fulfill({ contentType: 'application/json', body: JSON.stringify(fakeSession()) })
  );
  await page.route('**/auth/v1/user**', (route) =>
    route.fulfill({ contentType: 'application/json', body: JSON.stringify(fakeSession().user) })
  );
  await page.route('**/auth/v1/logout**', (route) => route.fulfill({ status: 204, body: '' }));

  await page.route('**/storage/v1/**', (route) =>
    route.fulfill({ contentType: 'application/json', body: JSON.stringify({ Key: 'ok' }) })
  );
}

/** Signs in through the real form; the profile mock reports onboarding as not done. */
async function signIn(page: Page) {
  await page.goto('/auth/login');
  await page.fill('input[type="email"]', TEST_USER.email);
  await page.fill('input[type="password"]', 'E2eP@ssw0rd!');
  await page.click('button[type="submit"]');
}

test.describe('Onboarding E2E', () => {
  test('an agent who has not onboarded is sent to the wizard, whatever route they asked for', async ({
    page,
  }) => {
    const patches: Request[] = [];
    await setupMocks(page, patches);

    await signIn(page);

    // The redirect used to live in Login.tsx's password path only, so an OAuth
    // signup never saw the wizard. It is in ProtectedRoute now (US-108).
    await expect(page).toHaveURL(/\/onboarding\/wizard/, { timeout: 20000 });
  });

  test('the wizard opens on its template step', async ({ page }) => {
    const patches: Request[] = [];
    await setupMocks(page, patches);

    await signIn(page);
    await expect(page).toHaveURL(/\/onboarding\/wizard/, { timeout: 20000 });

    await expect(page.getByText('Modern Clean').first()).toBeVisible({ timeout: 15000 });
  });

  test('a profile update names only columns that exist', async ({ page }) => {
    const patches: Request[] = [];
    await setupMocks(page, patches);

    await signIn(page);
    await expect(page).toHaveURL(/\/onboarding\/wizard/, { timeout: 20000 });
    await expect(page.getByText('Modern Clean').first()).toBeVisible({ timeout: 15000 });

    // Every PATCH this flow produces must name only real columns. `city` is
    // what took the entire update down when a Location was filled in.
    for (const request of patches) {
      const body = request.postDataJSON() as Record<string, unknown>;
      for (const key of Object.keys(body ?? {})) {
        expect(REAL_PROFILE_COLUMNS.has(key), `unexpected column "${key}"`).toBe(true);
      }
    }
  });
});
