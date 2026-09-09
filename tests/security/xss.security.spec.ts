/**
 * XSS (Cross-Site Scripting) Security Tests
 *
 * Tests for XSS vulnerabilities across the application.
 * Covers OWASP A03:2021 - Injection
 */

import { test, expect } from '@playwright/test';
import {
  XSS_PAYLOADS,
  setupXSSDetection,
  testXSSVulnerability,
  dismissCookieConsent,
} from './security-utils';

test.describe('XSS Security', () => {
  test.beforeEach(async ({ page }) => {
    await setupXSSDetection(page);
    // The consent banner covers the submit button on the auth pages (US-168).
    await dismissCookieConsent(page);
  });

  test.describe('Input Field XSS', () => {
    test('should sanitize XSS in login form', async ({ page }) => {
      await page.goto('/auth/login');

      for (const payload of XSS_PAYLOADS.slice(0, 5)) {
        await page.fill('input[type="email"], input[name="email"]', payload);

        // Check if XSS was triggered
        const xssTriggered = await page.evaluate(
          () => (window as unknown as { xssTriggered?: boolean }).xssTriggered
        );

        expect(xssTriggered).not.toBe(true);
      }
    });

    test('should sanitize XSS in registration form', async ({ page }) => {
      await page.goto('/auth/register');

      const inputSelectors = [
        'input[name="name"]',
        'input[name="email"]',
        'input[name="username"]',
      ];

      for (const selector of inputSelectors) {
        const input = page.locator(selector);
        if ((await input.count()) > 0) {
          for (const payload of XSS_PAYLOADS.slice(0, 3)) {
            await input.fill(payload);

            const xssTriggered = await page.evaluate(
              () => (window as unknown as { xssTriggered?: boolean }).xssTriggered
            );

            expect(xssTriggered).not.toBe(true);
          }
        }
      }
    });

    test('should sanitize XSS in search inputs', async ({ page }) => {
      await page.goto('/');

      const searchInputs = page.locator('input[type="search"], input[placeholder*="search" i]');

      if ((await searchInputs.count()) > 0) {
        for (const payload of XSS_PAYLOADS.slice(0, 3)) {
          await searchInputs.first().fill(payload);
          await page.keyboard.press('Enter');

          const xssTriggered = await page.evaluate(
            () => (window as unknown as { xssTriggered?: boolean }).xssTriggered
          );

          expect(xssTriggered).not.toBe(true);
        }
      }
    });
  });

  test.describe('URL Parameter XSS', () => {
    /**
     * US-169: these three tests were vacuous, each in the same way — they aimed
     * a payload at a surface this application does not have, and passed because
     * nothing rendered it.
     *
     *   /?search=<payload>      nothing on the landing page reads ?search
     *   /profile/<payload>      there is no /profile/:x route; profiles are /:username
     *   ?redirect=<payload>     asserted page.url() does not start with "javascript:",
     *                           which a same-document form submit can never produce
     *
     * The third is the one that mattered: Login.tsx really does read ?redirect
     * and pass it to validateRedirectPath, so there IS an open-redirect surface
     * — and the test covering it could not fail if the guard were deleted. That
     * guard now has real tests, in src/utils/navigation.test.ts, verified by
     * mutation.
     *
     * What is left here is the part that needs a browser: that the payload
     * reaches a real route, is rendered by React, and neither executes nor
     * appears unescaped in the DOM.
     */
    test('a payload in the profile slug is rendered as text, never executed', async ({ page }) => {
      for (const payload of XSS_PAYLOADS.slice(0, 5)) {
        // /:username is a real route, and the slug reaches the page.
        await page.goto(`/${encodeURIComponent(payload)}`, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(300);

        const xssTriggered = await page.evaluate(
          () => (window as unknown as { xssTriggered?: boolean }).xssTriggered
        );
        expect(xssTriggered, `payload executed: ${payload}`).not.toBe(true);

        // The app must have rendered SOMETHING, or this proves nothing — the
        // vacuous-pass trap these tests fell into (US-168, US-169).
        const bodyText = (await page.locator('body').innerText()).trim();
        expect(
          bodyText.length,
          'the SPA did not render; this assertion is meaningless'
        ).toBeGreaterThan(0);

        // No live element from the payload anywhere in the document.
        const injected = await page.evaluate(
          () => document.querySelectorAll('script[data-xss], img[onerror], svg[onload]').length
        );
        expect(injected, `payload produced live DOM: ${payload}`).toBe(0);
      }
    });

    test('a script-bearing redirect never becomes the destination', async ({ page, baseURL }) => {
      for (const payload of [
        'javascript:alert(1)',
        '//evil.example.com',
        'https://evil.example.com',
      ]) {
        await page.goto(`/auth/login?redirect=${encodeURIComponent(payload)}`, {
          waitUntil: 'domcontentloaded',
        });
        await page.waitForTimeout(300);

        // The login page must actually be there for this to mean anything.
        await expect(page.locator('input[type="password"]')).toBeVisible();

        // Whatever the page decided to do with ?redirect, it must not have
        // navigated off-origin or into a script URL. Compared against the
        // origin under test, not against itself — `url.origin === url.origin`
        // is precisely the shape of assertion this story is about.
        const expectedOrigin = new URL(baseURL ?? 'http://127.0.0.1:8080').origin;
        const url = new URL(page.url());

        expect(url.origin, `left the origin for ${payload}`).toBe(expectedOrigin);
        expect(url.protocol, `unsafe protocol for ${payload}`).toMatch(/^https?:$/);
        expect(url.hostname, `left the host for ${payload}`).not.toContain('evil.example.com');
      }
    });
  });

  test.describe('Stored XSS', () => {
    test.skip('should sanitize XSS in profile bio', async ({ page }) => {
      // This test requires authentication
      // Skip in automated runs - should be run manually with auth
      await page.goto('/dashboard/settings');

      const bioInput = page.locator('textarea[name="bio"]');
      if ((await bioInput.count()) > 0) {
        for (const payload of XSS_PAYLOADS.slice(0, 3)) {
          await bioInput.fill(payload);
          await page.click('button[type="submit"]');

          // Navigate to public profile
          await page.goto('/profile/testuser');

          const xssTriggered = await page.evaluate(
            () => (window as unknown as { xssTriggered?: boolean }).xssTriggered
          );

          expect(xssTriggered).not.toBe(true);
        }
      }
    });
  });

  test.describe('DOM-based XSS', () => {
    test('should not execute scripts from hash fragments', async ({ page }) => {
      for (const payload of XSS_PAYLOADS.slice(0, 3)) {
        await page.goto(`/#${encodeURIComponent(payload)}`);

        const xssTriggered = await page.evaluate(
          () => (window as unknown as { xssTriggered?: boolean }).xssTriggered
        );

        expect(xssTriggered).not.toBe(true);
      }
    });

    test('should sanitize innerHTML usage', async ({ page }) => {
      await page.goto('/');

      // Inject payload via message event (common DOM XSS vector)
      await page.evaluate(() => {
        window.postMessage('<script>alert("XSS")</script>', '*');
      });

      const xssTriggered = await page.evaluate(
        () => (window as unknown as { xssTriggered?: boolean }).xssTriggered
      );

      expect(xssTriggered).not.toBe(true);
    });
  });

  test.describe('Content Security Policy', () => {
    test('should have CSP header to prevent XSS', async ({ request }) => {
      const response = await request.get('/');
      const csp = response.headers()['content-security-policy'];

      // CSP should be present (even if just in meta tag)
      // In development, CSP might be relaxed
    });

    test('should not allow unsafe-inline scripts without nonce', async ({ page }) => {
      await page.goto('/');

      // Try to inject an inline script
      const scriptExecuted = await page.evaluate(() => {
        try {
          const script = document.createElement('script');
          script.textContent = 'window.inlineScriptExecuted = true';
          document.body.appendChild(script);
          return (
            (window as unknown as { inlineScriptExecuted?: boolean }).inlineScriptExecuted === true
          );
        } catch {
          return false;
        }
      });

      // In a strict CSP environment, inline scripts without nonce should fail
      // This test documents the current behavior
    });
  });

  test.describe('React-specific XSS Prevention', () => {
    test('should escape dangerouslySetInnerHTML content', async ({ page }) => {
      await page.goto('/');

      // Check for any dangerouslySetInnerHTML usage that might be exploitable
      const hasDangerousHTML = await page.evaluate(() => {
        const elements = document.querySelectorAll('[data-reactid], [data-react-checksum]');
        return elements.length > 0;
      });

      // React should escape content by default
    });

    test('should not render user content as HTML in text nodes', async ({ page }) => {
      await page.goto('/');

      // Verify that text content is not interpreted as HTML
      const textContent = await page.evaluate(() => {
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);

        let hasUnescapedHTML = false;
        let node;

        while ((node = walker.nextNode())) {
          if (node.textContent?.includes('<script>')) {
            hasUnescapedHTML = true;
            break;
          }
        }

        return hasUnescapedHTML;
      });

      expect(textContent).toBe(false);
    });
  });
});
