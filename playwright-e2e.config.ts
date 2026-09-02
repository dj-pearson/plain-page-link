/**
 * Playwright Configuration for End-to-End (E2E) Testing
 *
 * Separate from playwright.config.ts (which is dedicated to security /
 * penetration testing under tests/security). This config drives the
 * functional user-journey tests under tests/e2e against the dev server.
 */

import { defineConfig, devices } from '@playwright/test';

const E2E_ORIGIN = process.env.TEST_BASE_URL || 'http://127.0.0.1:8080';

export default defineConfig({
  testDir: './tests/e2e',

  timeout: 60000,
  expect: {
    timeout: 10000,
  },

  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  reporter: [
    ['html', { outputFolder: 'playwright-report-e2e' }],
    ['json', { outputFile: 'test-results/e2e-results.json' }],
    ['list'],
  ],

  use: {
    baseURL: E2E_ORIGIN,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
  },

  projects: [
    {
      name: 'e2e-chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Allow pinning a pre-installed browser (e.g. sandboxes where the
        // Playwright-managed download is unavailable). Set PW_CHROMIUM_PATH
        // to override; otherwise Playwright's bundled browser is used.
        ...(process.env.PW_CHROMIUM_PATH
          ? { launchOptions: { executablePath: process.env.PW_CHROMIUM_PATH } }
          : {}),
      },
    },
  ],

  // Boot the Vite dev server for the duration of the test run.
  // Force an IPv4 bind so this works in sandboxes without IPv6 (vite's
  // own config defaults host to '::', which fails where IPv6 is absent).
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1',
    url: E2E_ORIGIN,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    // src/integrations/supabase/client.ts throws at import when these are
    // unset, so without them the SPA never mounts and every spec runs against
    // a blank <body>. CI sets no env for this job. Same fix, and same reason
    // for the origin, as playwright-a11y.config.ts: index.html's CSP
    // connect-src is 'self' plus the agentbio.net hosts, so a request to any
    // other localhost port is refused before Playwright's router sees it.
    // The specs intercept every /rest/v1, /auth/v1 and /functions/v1 call, so
    // nothing is ever sent to this origin.
    env: {
      VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL || E2E_ORIGIN,
      VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY || 'e2e-placeholder-anon-key',
      VITE_FUNCTIONS_URL: process.env.VITE_FUNCTIONS_URL || `${E2E_ORIGIN}/functions/v1`,
    },
  },
});
