/**
 * Accessibility tests (axe-core)
 *
 * Runs axe.analyze() against key pages and fails on any 'critical' or
 * 'serious' violations. Supabase + cookie consent are mocked so the run is
 * hermetic (no live backend), matching the E2E approach.
 *
 * Baseline (initial run, 2026) — count of distinct critical/serious axe rules
 * per page. To avoid blocking on the pre-existing baseline (per the story:
 * "warn but not fail initially"), each test fails only when critical/serious
 * violations EXCEED this baseline — i.e. it's a regression guard. Drive these
 * numbers down over time; the CI job is also configured warn-only.
 *
 *   landing        : 3  (button-name [critical], color-contrast, link-in-text-block)
 *   login          : 1  (color-contrast)
 *   register       : 1  (color-contrast)
 *   dashboard      : 1  (color-contrast)
 *   public profile : 1  (color-contrast)
 */

const BASELINE: Record<string, number> = {
  landing: 3,
  login: 1,
  register: 1,
  dashboard: 1,
  'public profile': 1,
};

import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const SERIOUS = ['critical', 'serious'];

async function setupMocks(page: Page) {
  // Pre-seed cookie consent so the banner doesn't overlay/serialize into a11y noise.
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
      /* ignore */
    }
  });

  const session = () => {
    const now = Math.floor(Date.now() / 1000);
    return {
      access_token: 'fake',
      refresh_token: 'fake',
      token_type: 'bearer',
      expires_in: 3600,
      expires_at: now + 3600,
      user: {
        id: '00000000-0000-4000-8000-000000000001',
        email: 'a11y@example.com',
        aud: 'authenticated',
        role: 'authenticated',
        user_metadata: {},
      },
    };
  };

  await page.route('**/rest/v1/**', (r) =>
    r.fulfill({ contentType: 'application/json', body: '[]' })
  );
  await page.route('**/rest/v1/profiles**', (r) =>
    r.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        id: '00000000-0000-4000-8000-000000000001',
        username: 'demo',
        full_name: 'Demo Agent',
      }),
    })
  );
  await page.route('**/functions/v1/**', (r) =>
    r.fulfill({ contentType: 'application/json', body: '{"success":true}' })
  );
  await page.route('**/auth/v1/token**', (r) =>
    r.fulfill({ contentType: 'application/json', body: JSON.stringify(session()) })
  );
  await page.route('**/auth/v1/user**', (r) =>
    r.fulfill({ contentType: 'application/json', body: JSON.stringify(session().user) })
  );
}

async function analyze(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  const blocking = results.violations.filter((v) => SERIOUS.includes(v.impact ?? ''));
  return { blocking, total: results.violations.length };
}

const PAGES: { name: string; path: string }[] = [
  { name: 'landing', path: '/' },
  { name: 'login', path: '/auth/login' },
  { name: 'register', path: '/auth/register' },
  { name: 'dashboard', path: '/dashboard' },
  { name: 'public profile', path: '/demo' },
];

test.describe('Accessibility (axe-core)', () => {
  for (const { name, path } of PAGES) {
    test(`${name} critical/serious a11y violations stay at/below baseline`, async ({ page }) => {
      await setupMocks(page);
      await page.goto(path, { waitUntil: 'domcontentloaded' });
      // Let the SPA render.
      await page.waitForTimeout(1500);

      const { blocking, total } = await analyze(page);
      if (blocking.length > 0) {
        console.log(
          `[a11y] ${name}: ${blocking.length} critical/serious of ${total} total →`,
          blocking.map((v) => `${v.id} (${v.impact})`).join(', ')
        );
      }
      const baseline = BASELINE[name] ?? 0;
      expect(
        blocking.length,
        `New critical/serious a11y violations on ${name} (baseline ${baseline}): ` +
          blocking.map((v) => `${v.id} (${v.impact})`).join(', ')
      ).toBeLessThanOrEqual(baseline);
    });
  }
});
