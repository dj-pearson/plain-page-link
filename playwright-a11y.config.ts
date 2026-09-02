/**
 * Playwright configuration for accessibility (axe-core) tests.
 * Separate from the security and E2E configs; tests live in tests/a11y.
 */

import { defineConfig, devices } from '@playwright/test';

const A11Y_ORIGIN = process.env.TEST_BASE_URL || 'http://127.0.0.1:8080';

export default defineConfig({
  testDir: './tests/a11y',
  timeout: 60000,
  expect: { timeout: 10000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: 'playwright-report-a11y' }],
    ['json', { outputFile: 'test-results/a11y-results.json' }],
    ['list'],
  ],
  use: {
    baseURL: A11Y_ORIGIN,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'a11y-chromium',
      use: {
        ...devices['Desktop Chrome'],
        ...(process.env.PW_CHROMIUM_PATH
          ? { launchOptions: { executablePath: process.env.PW_CHROMIUM_PATH } }
          : {}),
      },
    },
  ],
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1',
    url: A11Y_ORIGIN,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    // Without these the suite tested nothing (US-113). src/integrations/supabase/client.ts
    // throws at import when VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are
    // absent, so the SPA never mounted, every page under test was a blank
    // <body>, and axe dutifully reported zero violations on all five of them.
    // CI sets no env for this job, so that is what CI has been running.
    //
    // The values are placeholders on purpose: the specs intercept every
    // request to /rest/v1, /auth/v1 and /functions/v1, so nothing is ever
    // sent to this origin. A real project URL would make the run non-hermetic.
    //
    // It has to be the dev server's own origin rather than an arbitrary
    // localhost port: index.html ships a Content-Security-Policy meta tag
    // whose connect-src is 'self' plus the agentbio.net hosts, and the browser
    // refuses a blocked connection before Playwright's router ever sees it.
    env: {
      VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL || A11Y_ORIGIN,
      VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY || 'a11y-placeholder-anon-key',
      VITE_FUNCTIONS_URL: process.env.VITE_FUNCTIONS_URL || `${A11Y_ORIGIN}/functions/v1`,
    },
  },
});
