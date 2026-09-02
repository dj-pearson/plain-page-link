/**
 * Playwright Configuration for Security Testing
 *
 * This configuration is optimized for security and penetration testing,
 * including OWASP Top 10 vulnerability checks.
 */

import { defineConfig, devices } from '@playwright/test';

const SECURITY_ORIGIN = process.env.TEST_BASE_URL || 'http://127.0.0.1:8080';

export default defineConfig({
  // Test directory
  testDir: './tests/security',

  // Maximum time for a single test
  timeout: 60000,

  // Maximum time for expect() assertions
  expect: {
    timeout: 10000,
  },

  // Run tests in parallel
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : undefined,

  // Reporter configuration
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/security-results.json' }],
    ['list'],
  ],

  // Shared settings for all projects
  use: {
    // Base URL for tests
    baseURL: SECURITY_ORIGIN,

    // Collect trace when retrying the failed test
    trace: 'on-first-retry',

    // Capture screenshots on failure
    screenshot: 'only-on-failure',

    // Record video on failure
    video: 'on-first-retry',

    // Additional HTTP headers for security testing
    extraHTTPHeaders: {
      'X-Security-Test': 'true',
    },
  },

  // Configure projects for security testing
  projects: [
    // Desktop Chrome - primary security testing
    {
      name: 'security-chrome',
      use: {
        ...devices['Desktop Chrome'],
        ...(process.env.PW_CHROMIUM_PATH
          ? { launchOptions: { executablePath: process.env.PW_CHROMIUM_PATH } }
          : {}),
        // Disable security features to test vulnerabilities
        launchOptions: {
          args: ['--disable-web-security', '--allow-running-insecure-content'],
        },
      },
    },

    // Mobile Safari - iOS security testing
    {
      name: 'security-mobile',
      use: { ...devices['iPhone 13'] },
    },

    // API security testing (no browser)
    {
      name: 'security-api',
      use: {
        // No browser - pure API testing
        ...devices['Desktop Chrome'],
        ...(process.env.PW_CHROMIUM_PATH
          ? { launchOptions: { executablePath: process.env.PW_CHROMIUM_PATH } }
          : {}),
      },
    },
  ],

  // Local dev server configuration
  // Two things this needed before it would run at all (US-119):
  //
  //   - `--host 127.0.0.1`. vite's own config defaults host to '::', and in a
  //     sandbox or runner without IPv6 the dev server dies with
  //     "listen EAFNOSUPPORT: address family not supported :::8080", so the
  //     whole suite errored before a single spec ran.
  //   - the VITE_SUPABASE_* placeholders. src/integrations/supabase/client.ts
  //     throws at import without them, so the SPA never mounted and every spec
  //     ran against a blank <body> — the same defect found in the a11y and e2e
  //     configs under US-114/US-116.
  //
  // The origin must be the dev server's own: index.html ships a CSP whose
  // connect-src is 'self' plus the agentbio.net hosts.
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1',
    url: SECURITY_ORIGIN,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    env: {
      VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL || SECURITY_ORIGIN,
      VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY || 'security-placeholder-anon-key',
      VITE_FUNCTIONS_URL: process.env.VITE_FUNCTIONS_URL || `${SECURITY_ORIGIN}/functions/v1`,
    },
  },
});
