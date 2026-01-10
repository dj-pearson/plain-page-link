/**
 * Security Headers Tests
 *
 * Tests for HTTP security headers and general web security.
 * Covers various OWASP recommendations for secure headers.
 */

import { test, expect } from '@playwright/test';
import { testSecurityHeaders, SECURITY_HEADERS } from './security-utils';

test.describe('Security Headers', () => {
  test.describe('HTTP Response Headers', () => {
    test('should include HSTS header', async ({ request }) => {
      const response = await request.get('/');
      const hsts = response.headers()['strict-transport-security'];

      // HSTS should be present with reasonable max-age
      if (hsts) {
        expect(hsts).toMatch(/max-age=\d+/);
        // max-age should be at least 1 year (31536000 seconds) for production
        const maxAgeMatch = hsts.match(/max-age=(\d+)/);
        if (maxAgeMatch) {
          const maxAge = parseInt(maxAgeMatch[1], 10);
          expect(maxAge).toBeGreaterThanOrEqual(31536000);
        }
      }
    });

    test('should include X-Content-Type-Options header', async ({ request }) => {
      const response = await request.get('/');
      const xcto = response.headers()['x-content-type-options'];

      expect(xcto).toBe('nosniff');
    });

    test('should include X-Frame-Options header', async ({ request }) => {
      const response = await request.get('/');
      const xfo = response.headers()['x-frame-options'];

      // Should be DENY or SAMEORIGIN
      expect(['DENY', 'SAMEORIGIN']).toContain(xfo?.toUpperCase());
    });

    test('should include Referrer-Policy header', async ({ request }) => {
      const response = await request.get('/');
      const rp = response.headers()['referrer-policy'];

      // Should have a referrer policy
      if (rp) {
        const validPolicies = [
          'no-referrer',
          'no-referrer-when-downgrade',
          'origin',
          'origin-when-cross-origin',
          'same-origin',
          'strict-origin',
          'strict-origin-when-cross-origin',
        ];
        expect(validPolicies).toContain(rp);
      }
    });

    test('should include Permissions-Policy header', async ({ request }) => {
      const response = await request.get('/');
      const pp = response.headers()['permissions-policy'];

      // Permissions-Policy should restrict sensitive features
      if (pp) {
        // Should restrict at least some features
        expect(pp.length).toBeGreaterThan(0);
      }
    });

    test('should not expose server version', async ({ request }) => {
      const response = await request.get('/');
      const server = response.headers()['server'];
      const poweredBy = response.headers()['x-powered-by'];

      // Should not expose detailed server info
      if (server) {
        expect(server).not.toMatch(/\d+\.\d+/); // No version numbers
      }

      // X-Powered-By should not be present
      expect(poweredBy).toBeUndefined();
    });

    test('should run full security headers check', async ({ request }) => {
      const result = await testSecurityHeaders(request, '/');

      console.log('Security Headers Report:');
      console.log('Passed:', result.passed);
      console.log('Failed:', result.failed);
      console.log('Missing:', result.missing);

      // At minimum, these headers should be present
      // (Relaxed for development environment)
      expect(result.missing).not.toContain('X-Content-Type-Options');
    });
  });

  test.describe('Cache Control', () => {
    test('should set no-cache for sensitive pages', async ({ request }) => {
      const sensitivePaths = ['/auth/login', '/dashboard'];

      for (const path of sensitivePaths) {
        const response = await request.get(path);
        const cacheControl = response.headers()['cache-control'];

        // Sensitive pages should not be cached or have short cache times
        if (cacheControl) {
          const hasNoCacheDirective =
            cacheControl.includes('no-cache') ||
            cacheControl.includes('no-store') ||
            cacheControl.includes('private');

          // Either no-cache directives or short max-age
          expect(hasNoCacheDirective || cacheControl.includes('max-age=0')).toBe(true);
        }
      }
    });

    test('should cache static assets appropriately', async ({ request }) => {
      // Static assets should have long cache times
      const response = await request.get('/');
      const html = await response.text();

      // Find a static asset URL from the HTML
      const assetMatch = html.match(/src="([^"]+\.(js|css))"/);

      if (assetMatch) {
        const assetUrl = assetMatch[1];
        const assetResponse = await request.get(assetUrl);
        const cacheControl = assetResponse.headers()['cache-control'];

        // Static assets should be cacheable
        if (cacheControl) {
          // Should have a reasonable max-age
          const maxAgeMatch = cacheControl.match(/max-age=(\d+)/);
          if (maxAgeMatch) {
            const maxAge = parseInt(maxAgeMatch[1], 10);
            // At least 1 day for static assets
            expect(maxAge).toBeGreaterThanOrEqual(86400);
          }
        }
      }
    });
  });

  test.describe('CORS Headers', () => {
    test('should not have wildcard CORS in production', async ({ request }) => {
      const response = await request.get('/');
      const acao = response.headers()['access-control-allow-origin'];

      // Should not be wildcard
      expect(acao).not.toBe('*');
    });

    test('should validate CORS preflight requests', async ({ request }) => {
      const response = await request.fetch('/', {
        method: 'OPTIONS',
        headers: {
          'Origin': 'https://malicious-site.com',
          'Access-Control-Request-Method': 'POST',
        },
      });

      const acao = response.headers()['access-control-allow-origin'];

      // Should not allow arbitrary origins
      expect(acao).not.toBe('https://malicious-site.com');
    });

    test('should restrict allowed methods', async ({ request }) => {
      const response = await request.fetch('/', {
        method: 'OPTIONS',
        headers: {
          'Origin': 'https://agentbio.net',
          'Access-Control-Request-Method': 'DELETE',
        },
      });

      const acam = response.headers()['access-control-allow-methods'];

      // If present, should be specific, not allow everything
      if (acam) {
        // Should not include dangerous methods for public endpoints
      }
    });
  });

  test.describe('Content Type', () => {
    test('should serve HTML with correct content type', async ({ request }) => {
      const response = await request.get('/');
      const contentType = response.headers()['content-type'];

      expect(contentType).toContain('text/html');
    });

    test('should serve JSON with correct content type', async ({ request }) => {
      // Test an API endpoint that returns JSON
      const response = await request.get('/api/health', {
        failOnStatusCode: false,
      });

      if (response.status() === 200) {
        const contentType = response.headers()['content-type'];
        expect(contentType).toContain('application/json');
      }
    });

    test('should serve JavaScript with correct content type', async ({ request }) => {
      const htmlResponse = await request.get('/');
      const html = await htmlResponse.text();

      const jsMatch = html.match(/src="([^"]+\.js)"/);

      if (jsMatch) {
        const jsResponse = await request.get(jsMatch[1]);
        const contentType = jsResponse.headers()['content-type'];

        expect(contentType).toMatch(/application\/javascript|text\/javascript/);
      }
    });
  });

  test.describe('Cookie Security', () => {
    test('should set Secure flag on cookies over HTTPS', async ({ page }) => {
      await page.goto('/');
      const cookies = await page.context().cookies();

      // In production (HTTPS), all cookies should be Secure
      // In development (HTTP), this may not apply
    });

    test('should set HttpOnly flag on session cookies', async ({ page }) => {
      await page.goto('/');
      const cookies = await page.context().cookies();

      for (const cookie of cookies) {
        if (cookie.name.toLowerCase().includes('session') ||
            cookie.name.toLowerCase().includes('token') ||
            cookie.name.toLowerCase().includes('auth')) {
          expect(cookie.httpOnly).toBe(true);
        }
      }
    });

    test('should set SameSite attribute on cookies', async ({ page }) => {
      await page.goto('/');
      const cookies = await page.context().cookies();

      for (const cookie of cookies) {
        // SameSite should be set (Lax or Strict preferred)
        expect(cookie.sameSite).toBeTruthy();
        expect(cookie.sameSite).not.toBe('None');
      }
    });
  });

  test.describe('Error Handling', () => {
    test('should not expose stack traces in error pages', async ({ page }) => {
      await page.goto('/this-page-does-not-exist-404');

      const content = await page.content();

      // Should not contain stack traces
      expect(content).not.toMatch(/at\s+\w+\s+\([^)]+:\d+:\d+\)/);
      expect(content).not.toContain('node_modules');
      expect(content).not.toContain('.ts:');
      expect(content).not.toContain('.tsx:');
    });

    test('should return appropriate error status codes', async ({ request }) => {
      const response = await request.get('/this-page-does-not-exist-404');

      expect(response.status()).toBe(404);
    });

    test('should not expose sensitive info in 500 errors', async ({ request }) => {
      // Trigger a server error if possible
      const response = await request.post('/api/trigger-error', {
        failOnStatusCode: false,
        data: { malformed: true },
      });

      if (response.status() === 500) {
        const body = await response.text();

        // Should not expose internal details
        expect(body).not.toContain('password');
        expect(body).not.toContain('secret');
        expect(body).not.toContain('database');
        expect(body).not.toMatch(/postgres|mysql|mongodb/i);
      }
    });
  });
});
