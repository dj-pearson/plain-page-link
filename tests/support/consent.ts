import { test as base, expect, type Page } from '@playwright/test';

/**
 * Pre-seed the cookie-consent decision before the SPA boots.
 *
 * The banner renders as `position: fixed; inset-x-0; bottom-0; z-[100]`, so it
 * sits over the bottom of every page and its subtree intercepts pointer
 * events. Any `page.click()` on something underneath it — the submit button of
 * the login form, for one — retries until the 60s test timeout and then reports
 * as an application failure.
 *
 * `necessary` only: nothing here opts the test browser into analytics.
 */
export async function seedCookieConsent(page: Page): Promise<void> {
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
      /* storage unavailable — the banner will show and clicks will be blocked */
    }
  });
}

/**
 * `test` with the seed applied to every `page`, and only to tests that ask for
 * one — a `beforeEach` naming `page` would build a browser page for the
 * request-only specs too.
 *
 * The a11y and e2e suites each inline their own copy of the seed inside a
 * setup helper. The security suite had none, which is why 49 of its 165 CI
 * tests timed out on a click that a local run never reached, having dismissed
 * the banner in an earlier spec of the same worker.
 */
export const test = base.extend({
  page: async ({ page }, use) => {
    await seedCookieConsent(page);
    await use(page);
  },
});

export { expect };
