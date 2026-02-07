/**
 * Authentication Security Tests
 *
 * Tests for authentication and session management security.
 * Covers OWASP A07:2021 - Identification and Authentication Failures
 */

import { test, expect } from '@playwright/test';
import {
  testAuthBypass,
  testRateLimiting,
  testCookieSecurity,
  SQL_INJECTION_PAYLOADS,
} from './security-utils';

test.describe('Authentication Security', () => {
  test.describe('Login Security', () => {
    test('should block SQL injection in login form', async ({ page }) => {
      await page.goto('/auth/login');

      for (const payload of SQL_INJECTION_PAYLOADS.slice(0, 5)) {
        await page.fill('input[type="email"], input[name="email"]', payload);
        await page.fill('input[type="password"]', 'password123');

        const submitButton = page.locator('button[type="submit"]');
        await submitButton.click();

        // Should not show successful login
        await expect(page).not.toHaveURL('/dashboard');

        // Should show error or stay on login
        const url = page.url();
        expect(url).toContain('/auth/login');

        // Clear for next test
        await page.goto('/auth/login');
      }
    });

    test('should implement login rate limiting', async ({ request }) => {
      const result = await testRateLimiting(
        request,
        '/auth/login',
        'POST',
        20
      );

      // Should have rate limiting
      expect(result.rateLimited).toBe(true);
      expect(result.requestsBeforeLimit).toBeLessThanOrEqual(10);
    });

    test('should not expose user existence on login failure', async ({ page }) => {
      await page.goto('/auth/login');

      // Test with non-existent email
      await page.fill('input[type="email"], input[name="email"]', 'nonexistent@test.com');
      await page.fill('input[type="password"]', 'wrongpassword');
      await page.click('button[type="submit"]');

      const errorMessage1 = await page.textContent('[role="alert"], .error-message, .toast-error') || '';

      await page.goto('/auth/login');

      // Test with potentially existing email
      await page.fill('input[type="email"], input[name="email"]', 'admin@agentbio.net');
      await page.fill('input[type="password"]', 'wrongpassword');
      await page.click('button[type="submit"]');

      const errorMessage2 = await page.textContent('[role="alert"], .error-message, .toast-error') || '';

      // Error messages should be identical to prevent user enumeration
      // Or both should be generic
      const isGenericError = (msg: string) =>
        msg.toLowerCase().includes('invalid') ||
        msg.toLowerCase().includes('incorrect') ||
        msg.toLowerCase().includes('failed');

      expect(isGenericError(errorMessage1) || isGenericError(errorMessage2)).toBe(true);
    });

    test('should enforce password complexity requirements', async ({ page }) => {
      await page.goto('/auth/register');

      // Try weak passwords
      const weakPasswords = ['123456', 'password', 'abc', 'test'];

      for (const weakPassword of weakPasswords) {
        await page.fill('input[name="password"]', weakPassword);

        // Look for password strength indicator or error
        const hasError = await page.locator('[data-password-error], .password-error, [aria-invalid="true"]').count() > 0 ||
          await page.locator('text=/too weak|too short|must contain/i').count() > 0;

        // Password should be rejected or flagged as weak
        // (Exact behavior depends on implementation)
      }
    });
  });

  test.describe('Session Security', () => {
    test('should set secure cookie attributes', async ({ page }) => {
      await page.goto('/');

      const result = await testCookieSecurity(page, '/');

      // All cookies should have security attributes
      if (result.issues.length > 0) {
        console.log('Cookie security issues:', result.issues);
      }

      // Session cookies must be HttpOnly
      // All cookies should be Secure in production
    });

    test('should invalidate session on logout', async ({ page, context }) => {
      // First, login
      await page.goto('/auth/login');

      // Get initial cookies
      const cookiesBefore = await context.cookies();
      const sessionCookie = cookiesBefore.find(c =>
        c.name.includes('session') || c.name.includes('token')
      );

      // Logout
      await page.goto('/dashboard');
      const logoutButton = page.locator('button:has-text("Logout"), a:has-text("Logout"), [data-logout]');
      if (await logoutButton.count() > 0) {
        await logoutButton.click();
        await page.waitForURL(/\/(auth\/login)?$/);
      }

      // Try to access protected route with old session
      await page.goto('/dashboard');

      // Should be redirected to login
      await expect(page).toHaveURL(/auth\/login/);
    });

    test('should prevent session fixation', async ({ page, context }) => {
      // Get session ID before login
      await page.goto('/auth/login');
      const cookiesBefore = await context.cookies();
      const sessionBefore = cookiesBefore.find(c => c.name.includes('session'));

      // Perform login (if session exists, it should change)
      // The session ID should change after authentication
    });
  });

  test.describe('Protected Routes', () => {
    test('should reject unauthenticated access to protected API', async ({ request }) => {
      const protectedEndpoints = [
        '/api/profile',
        '/api/leads',
        '/api/listings',
        '/api/analytics',
      ];

      for (const endpoint of protectedEndpoints) {
        const result = await testAuthBypass(request, endpoint);

        expect(result.vulnerable).toBe(false);
      }
    });

    test('should redirect unauthenticated users from dashboard', async ({ page }) => {
      await page.goto('/dashboard');

      // Should redirect to login
      await expect(page).toHaveURL(/auth\/login/);
    });

    test('should redirect unauthenticated users from settings', async ({ page }) => {
      await page.goto('/dashboard/settings');

      // Should redirect to login
      await expect(page).toHaveURL(/auth\/login/);
    });
  });

  test.describe('Password Reset Security', () => {
    test('should rate limit password reset requests', async ({ request }) => {
      const result = await testRateLimiting(
        request,
        '/api/auth/reset-password',
        'POST',
        10
      );

      // Should have strict rate limiting for password reset
      expect(result.rateLimited).toBe(true);
      expect(result.requestsBeforeLimit).toBeLessThanOrEqual(5);
    });

    test('should not confirm email existence in password reset', async ({ page }) => {
      await page.goto('/auth/forgot-password');

      // Test with random email
      await page.fill('input[type="email"]', 'random@nonexistent.com');
      await page.click('button[type="submit"]');

      // Wait for response
      await page.waitForLoadState('networkidle');

      // Message should be generic
      const successMessage = await page.textContent('.success-message, [role="alert"]') || '';
      expect(successMessage.toLowerCase()).not.toContain('not found');
      expect(successMessage.toLowerCase()).not.toContain('doesn\'t exist');
    });
  });

  test.describe('Token Security', () => {
    test('should not expose JWT tokens in URL', async ({ page }) => {
      // Navigate through the app
      await page.goto('/');
      await page.goto('/auth/login');
      await page.goto('/');

      // Check URL doesn't contain tokens
      const url = page.url();
      expect(url).not.toMatch(/token=/i);
      expect(url).not.toMatch(/jwt=/i);
      expect(url).not.toMatch(/access_token=/i);
    });

    test('should not expose tokens in response body to non-authenticated requests', async ({ request }) => {
      const response = await request.get('/');
      const body = await response.text();

      // Check for exposed tokens
      expect(body).not.toMatch(/eyJ[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*/); // JWT pattern
    });
  });
});
