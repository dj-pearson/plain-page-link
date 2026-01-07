/**
 * URL Validation Utilities - Frontend
 * Prevents open redirect vulnerabilities by validating redirect URLs
 */

/**
 * Validate that a redirect URL is safe (same origin or whitelisted)
 * @param redirectUrl - The URL to validate
 * @param allowedDomains - Additional allowed domains (optional)
 * @returns boolean - true if URL is safe, false otherwise
 */
export function isValidRedirectUrl(
  redirectUrl: string,
  allowedDomains: string[] = []
): boolean {
  try {
    const appUrl = import.meta.env.VITE_APP_URL || window.location.origin;

    // Parse both URLs
    const redirect = new URL(redirectUrl, window.location.origin);
    const app = new URL(appUrl);

    // Allow relative URLs (they start with /)
    if (redirectUrl.startsWith('/') && !redirectUrl.startsWith('//')) {
      return true;
    }

    // Check if same origin (protocol + hostname + port)
    if (redirect.origin === app.origin || redirect.origin === window.location.origin) {
      return true;
    }

    // Check against whitelist
    const redirectHost = redirect.hostname.toLowerCase();
    const allowedHosts = [
      app.hostname.toLowerCase(),
      window.location.hostname.toLowerCase(),
      ...allowedDomains.map(d => d.toLowerCase()),
    ];

    return allowedHosts.some(allowed => {
      // Exact match
      if (redirectHost === allowed) return true;

      // Subdomain match (e.g., allow "*.agentbio.net")
      if (allowed.startsWith('*.')) {
        const baseDomain = allowed.substring(2);
        return redirectHost.endsWith('.' + baseDomain) || redirectHost === baseDomain;
      }

      return false;
    });
  } catch (error) {
    // Invalid URL format
    console.error('Invalid redirect URL format:', error);
    return false;
  }
}

/**
 * Sanitize a redirect URL, returning a safe default if invalid
 * @param redirectUrl - The URL to sanitize
 * @param defaultPath - Default path to use if URL is invalid
 * @param allowedDomains - Additional allowed domains (optional)
 * @returns string - Safe redirect URL
 */
export function sanitizeRedirectUrl(
  redirectUrl: string | null | undefined,
  defaultPath: string = '/dashboard',
  allowedDomains: string[] = []
): string {
  // If no URL provided, use default
  if (!redirectUrl) {
    return defaultPath;
  }

  // Validate the URL
  if (isValidRedirectUrl(redirectUrl, allowedDomains)) {
    return redirectUrl;
  }

  // Invalid URL, return default
  console.warn(`[Security] Invalid redirect URL blocked: ${redirectUrl}`);
  return defaultPath;
}
