/**
 * Playwright Configuration for Security Testing
 *
 * This configuration is optimized for security and penetration testing,
 * including OWASP Top 10 vulnerability checks.
 */

import { defineConfig, devices } from '@playwright/test';

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
    baseURL: process.env.TEST_BASE_URL || 'http://localhost:8080',

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
        // Disable security features to test vulnerabilities
        launchOptions: {
          args: [
            '--disable-web-security',
            '--allow-running-insecure-content',
          ],
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
      },
    },
  ],

  // Local dev server configuration
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:8080',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
