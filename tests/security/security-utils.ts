/**
 * Security Testing Utilities
 *
 * Helper functions and payloads for penetration testing.
 * These utilities are designed to test for common vulnerabilities
 * including OWASP Top 10.
 */

import { Page, APIRequestContext, expect } from '@playwright/test';

// =============================================================================
// XSS PAYLOADS
// =============================================================================
export const XSS_PAYLOADS = [
  // Basic script injection
  '<script>alert("XSS")</script>',
  '<img src=x onerror=alert("XSS")>',
  '<svg onload=alert("XSS")>',

  // Event handler injection
  '" onmouseover="alert(\'XSS\')"',
  "' onclick='alert(\"XSS\")'",
  '"><script>alert("XSS")</script>',

  // JavaScript protocol
  'javascript:alert("XSS")',
  'data:text/html,<script>alert("XSS")</script>',

  // Encoded payloads
  '%3Cscript%3Ealert("XSS")%3C/script%3E',
  '&#60;script&#62;alert("XSS")&#60;/script&#62;',

  // Template injection
  '{{constructor.constructor("alert(\'XSS\')")()}}',
  '${alert("XSS")}',

  // CSS injection
  '<style>body{background:url("javascript:alert(\'XSS\')")}</style>',

  // SVG/XML injection
  '<svg><script>alert("XSS")</script></svg>',
  '<?xml version="1.0"?><script>alert("XSS")</script>',
];

// =============================================================================
// SQL INJECTION PAYLOADS
// =============================================================================
export const SQL_INJECTION_PAYLOADS = [
  // Classic SQL injection
  "' OR '1'='1",
  "' OR '1'='1' --",
  "' OR '1'='1' /*",
  "1' OR '1'='1",
  "1 OR 1=1",

  // UNION-based injection
  "' UNION SELECT NULL--",
  "' UNION SELECT username, password FROM users--",

  // Error-based injection
  "' AND 1=CONVERT(int, (SELECT @@version))--",
  "' AND extractvalue(1,concat(0x7e,version()))--",

  // Time-based blind injection
  "' AND SLEEP(5)--",
  "'; WAITFOR DELAY '0:0:5'--",
  "' AND (SELECT * FROM (SELECT(SLEEP(5)))a)--",

  // Comment injection
  "admin'--",
  "admin'/*",
  "*/OR/**/1=1--",

  // Stacked queries
  "'; DROP TABLE users;--",
  "'; INSERT INTO users VALUES('hacker', 'password');--",
];

// =============================================================================
// NOSQL INJECTION PAYLOADS
// =============================================================================
export const NOSQL_INJECTION_PAYLOADS = [
  // MongoDB injection
  '{"$gt": ""}',
  '{"$ne": null}',
  '{"$where": "1==1"}',
  '{"$regex": ".*"}',

  // Object injection
  '{"password": {"$gt": ""}}',
  '{"username": {"$regex": "admin"}}',
];

// =============================================================================
// PATH TRAVERSAL PAYLOADS
// =============================================================================
export const PATH_TRAVERSAL_PAYLOADS = [
  '../../../etc/passwd',
  '..\\..\\..\\windows\\system32\\config\\sam',
  '....//....//....//etc/passwd',
  '..%252f..%252f..%252fetc/passwd',
  '%2e%2e%2f%2e%2e%2f%2e%2e%2fetc/passwd',
  '..%c0%af..%c0%af..%c0%afetc/passwd',
  '/etc/passwd%00.jpg',
];

// =============================================================================
// COMMAND INJECTION PAYLOADS
// =============================================================================
export const COMMAND_INJECTION_PAYLOADS = [
  '; ls -la',
  '| cat /etc/passwd',
  '`id`',
  '$(whoami)',
  '& dir',
  '\n/bin/cat /etc/passwd',
];

// =============================================================================
// SSRF PAYLOADS
// =============================================================================
export const SSRF_PAYLOADS = [
  'http://localhost:80',
  'http://127.0.0.1:80',
  'http://[::1]:80',
  'http://0.0.0.0:80',
  'http://169.254.169.254/latest/meta-data/', // AWS metadata
  'http://metadata.google.internal/', // GCP metadata
  'file:///etc/passwd',
  'gopher://localhost:25/',
];

// =============================================================================
// SECURITY HEADERS TO CHECK
// =============================================================================
export const SECURITY_HEADERS = {
  'Strict-Transport-Security': {
    expected: true,
    pattern: /max-age=\d+/,
    description: 'HSTS header should be set with max-age',
  },
  'X-Content-Type-Options': {
    expected: 'nosniff',
    description: 'Should prevent MIME type sniffing',
  },
  'X-Frame-Options': {
    expected: ['DENY', 'SAMEORIGIN'],
    description: 'Should prevent clickjacking',
  },
  'Content-Security-Policy': {
    expected: true,
    description: 'CSP should be set',
  },
  'X-XSS-Protection': {
    expected: ['1', '1; mode=block'],
    description: 'XSS protection header (legacy)',
  },
  'Referrer-Policy': {
    expected: true,
    description: 'Should control referrer information',
  },
  'Permissions-Policy': {
    expected: true,
    description: 'Should restrict browser features',
  },
};

// =============================================================================
// SECURITY TEST HELPER FUNCTIONS
// =============================================================================

/**
 * Test for XSS vulnerability in an input field
 */
export async function testXSSVulnerability(
  page: Page,
  inputSelector: string,
  submitSelector?: string
): Promise<{ vulnerable: boolean; payload?: string }> {
  for (const payload of XSS_PAYLOADS.slice(0, 5)) { // Test first 5 payloads
    try {
      await page.fill(inputSelector, payload);

      if (submitSelector) {
        await page.click(submitSelector);
        await page.waitForLoadState('networkidle');
      }

      // Check if script executed
      const alertTriggered = await page.evaluate(() => {
        return (window as unknown as { xssTriggered?: boolean }).xssTriggered === true;
      });

      if (alertTriggered) {
        return { vulnerable: true, payload };
      }

      // Check if payload appears unencoded in DOM
      const content = await page.content();
      if (content.includes(payload) && !content.includes(encodeURIComponent(payload))) {
        return { vulnerable: true, payload };
      }
    } catch {
      // Input might be blocked - good sign
    }
  }

  return { vulnerable: false };
}

/**
 * Test security headers for a URL
 */
export async function testSecurityHeaders(
  request: APIRequestContext,
  url: string
): Promise<{
  passed: string[];
  failed: string[];
  missing: string[];
}> {
  const response = await request.get(url);
  const headers = response.headers();

  const passed: string[] = [];
  const failed: string[] = [];
  const missing: string[] = [];

  for (const [header, config] of Object.entries(SECURITY_HEADERS)) {
    const value = headers[header.toLowerCase()];

    if (!value) {
      missing.push(header);
      continue;
    }

    if (config.expected === true) {
      passed.push(header);
    } else if (config.pattern && config.pattern.test(value)) {
      passed.push(header);
    } else if (Array.isArray(config.expected)) {
      if (config.expected.includes(value)) {
        passed.push(header);
      } else {
        failed.push(header);
      }
    } else if (value === config.expected) {
      passed.push(header);
    } else {
      failed.push(header);
    }
  }

  return { passed, failed, missing };
}

/**
 * Test for authentication bypass
 */
export async function testAuthBypass(
  request: APIRequestContext,
  protectedUrl: string
): Promise<{ vulnerable: boolean; method?: string }> {
  // Test without auth
  const noAuthResponse = await request.get(protectedUrl, {
    headers: {},
  });

  if (noAuthResponse.status() === 200) {
    return { vulnerable: true, method: 'no-auth' };
  }

  // Test with invalid token
  const invalidTokenResponse = await request.get(protectedUrl, {
    headers: {
      'Authorization': 'Bearer invalid-token-12345',
    },
  });

  if (invalidTokenResponse.status() === 200) {
    return { vulnerable: true, method: 'invalid-token' };
  }

  // Test with empty token
  const emptyTokenResponse = await request.get(protectedUrl, {
    headers: {
      'Authorization': 'Bearer ',
    },
  });

  if (emptyTokenResponse.status() === 200) {
    return { vulnerable: true, method: 'empty-token' };
  }

  return { vulnerable: false };
}

/**
 * Test for rate limiting
 */
export async function testRateLimiting(
  request: APIRequestContext,
  url: string,
  method: 'GET' | 'POST' = 'GET',
  requestCount: number = 100
): Promise<{
  rateLimited: boolean;
  requestsBeforeLimit?: number;
  limitHeader?: string;
}> {
  let limitedAt: number | undefined;

  for (let i = 0; i < requestCount; i++) {
    const response = method === 'GET'
      ? await request.get(url)
      : await request.post(url, { data: {} });

    if (response.status() === 429) {
      limitedAt = i + 1;
      const limitHeader = response.headers()['x-ratelimit-limit']
        || response.headers()['retry-after'];
      return {
        rateLimited: true,
        requestsBeforeLimit: limitedAt,
        limitHeader,
      };
    }
  }

  return { rateLimited: false };
}

/**
 * Test for IDOR (Insecure Direct Object Reference)
 */
export async function testIDOR(
  request: APIRequestContext,
  resourceUrl: string,
  validUserId: string,
  otherUserIds: string[]
): Promise<{ vulnerable: boolean; accessibleIds: string[] }> {
  const accessibleIds: string[] = [];

  for (const userId of otherUserIds) {
    const testUrl = resourceUrl.replace(validUserId, userId);
    const response = await request.get(testUrl);

    if (response.status() === 200) {
      accessibleIds.push(userId);
    }
  }

  return {
    vulnerable: accessibleIds.length > 0,
    accessibleIds,
  };
}

/**
 * Test for sensitive data exposure in responses
 */
export async function testDataExposure(
  page: Page,
  url: string
): Promise<{ exposed: boolean; patterns: string[] }> {
  await page.goto(url);

  const content = await page.content();
  const exposedPatterns: string[] = [];

  // Check for common sensitive data patterns
  const sensitivePatterns = [
    { name: 'password', pattern: /"password":\s*"[^"]+"/i },
    { name: 'api_key', pattern: /(api[_-]?key|apikey)["']?\s*[:=]\s*["'][^"']+["']/i },
    { name: 'secret', pattern: /(secret|token)["']?\s*[:=]\s*["'][^"']+["']/i },
    { name: 'credit_card', pattern: /\b(?:\d{4}[-\s]?){3}\d{4}\b/ },
    { name: 'ssn', pattern: /\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/ },
    { name: 'private_key', pattern: /-----BEGIN\s+(RSA\s+)?PRIVATE\s+KEY-----/ },
    { name: 'aws_key', pattern: /AKIA[0-9A-Z]{16}/ },
  ];

  for (const { name, pattern } of sensitivePatterns) {
    if (pattern.test(content)) {
      exposedPatterns.push(name);
    }
  }

  return {
    exposed: exposedPatterns.length > 0,
    patterns: exposedPatterns,
  };
}

/**
 * Test cookie security attributes
 */
export async function testCookieSecurity(
  page: Page,
  url: string
): Promise<{
  secure: boolean;
  httpOnly: boolean;
  sameSite: boolean;
  issues: string[];
}> {
  await page.goto(url);

  const cookies = await page.context().cookies();
  const issues: string[] = [];

  let allSecure = true;
  let allHttpOnly = true;
  let allSameSite = true;

  for (const cookie of cookies) {
    if (!cookie.secure) {
      allSecure = false;
      issues.push(`Cookie "${cookie.name}" missing Secure flag`);
    }
    if (!cookie.httpOnly && cookie.name.toLowerCase().includes('session')) {
      allHttpOnly = false;
      issues.push(`Session cookie "${cookie.name}" missing HttpOnly flag`);
    }
    if (!cookie.sameSite || cookie.sameSite === 'None') {
      allSameSite = false;
      issues.push(`Cookie "${cookie.name}" has weak SameSite policy`);
    }
  }

  return {
    secure: allSecure,
    httpOnly: allHttpOnly,
    sameSite: allSameSite,
    issues,
  };
}

/**
 * Setup XSS detection on a page
 */
export async function setupXSSDetection(page: Page): Promise<void> {
  await page.addInitScript(() => {
    // Override alert, prompt, confirm
    window.alert = () => {
      (window as unknown as { xssTriggered: boolean }).xssTriggered = true;
    };
    window.prompt = () => {
      (window as unknown as { xssTriggered: boolean }).xssTriggered = true;
      return null;
    };
    window.confirm = () => {
      (window as unknown as { xssTriggered: boolean }).xssTriggered = true;
      return false;
    };
  });
}

/**
 * Generate a security test report
 */
export function generateSecurityReport(results: {
  xss: { vulnerable: boolean; payload?: string };
  headers: { passed: string[]; failed: string[]; missing: string[] };
  authBypass: { vulnerable: boolean; method?: string };
  rateLimiting: { rateLimited: boolean };
  dataExposure: { exposed: boolean; patterns: string[] };
  cookies: { issues: string[] };
}): string {
  const lines: string[] = [
    '='.repeat(60),
    'SECURITY TEST REPORT',
    '='.repeat(60),
    '',
    `Test Date: ${new Date().toISOString()}`,
    '',
    '-'.repeat(60),
    'XSS VULNERABILITY',
    '-'.repeat(60),
    results.xss.vulnerable
      ? `VULNERABLE - Payload: ${results.xss.payload}`
      : 'PASSED - No XSS vulnerabilities detected',
    '',
    '-'.repeat(60),
    'SECURITY HEADERS',
    '-'.repeat(60),
    `Passed: ${results.headers.passed.join(', ') || 'None'}`,
    `Failed: ${results.headers.failed.join(', ') || 'None'}`,
    `Missing: ${results.headers.missing.join(', ') || 'None'}`,
    '',
    '-'.repeat(60),
    'AUTHENTICATION BYPASS',
    '-'.repeat(60),
    results.authBypass.vulnerable
      ? `VULNERABLE - Method: ${results.authBypass.method}`
      : 'PASSED - No bypass detected',
    '',
    '-'.repeat(60),
    'RATE LIMITING',
    '-'.repeat(60),
    results.rateLimiting.rateLimited
      ? 'PASSED - Rate limiting is active'
      : 'WARNING - No rate limiting detected',
    '',
    '-'.repeat(60),
    'DATA EXPOSURE',
    '-'.repeat(60),
    results.dataExposure.exposed
      ? `VULNERABLE - Exposed: ${results.dataExposure.patterns.join(', ')}`
      : 'PASSED - No sensitive data exposed',
    '',
    '-'.repeat(60),
    'COOKIE SECURITY',
    '-'.repeat(60),
    results.cookies.issues.length > 0
      ? `ISSUES:\n${results.cookies.issues.map(i => `  - ${i}`).join('\n')}`
      : 'PASSED - All cookies properly secured',
    '',
    '='.repeat(60),
  ];

  return lines.join('\n');
}
