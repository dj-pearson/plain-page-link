/**
 * URL Validation Utilities
 * Prevents open redirect vulnerabilities by validating redirect URLs
 */

/**
 * Validate that a redirect URL is safe (same origin or whitelisted)
 * @param redirectUrl - The URL to validate
 * @param appUrl - The application's base URL
 * @param allowedDomains - Additional allowed domains (optional)
 * @returns boolean - true if URL is safe, false otherwise
 */
export function isValidRedirectUrl(
  redirectUrl: string,
  appUrl: string,
  allowedDomains: string[] = []
): boolean {
  try {
    // Parse both URLs
    const redirect = new URL(redirectUrl);
    const app = new URL(appUrl);

    // Allow relative URLs (they start with /)
    if (redirectUrl.startsWith('/') && !redirectUrl.startsWith('//')) {
      return true;
    }

    // Check if same origin (protocol + hostname + port)
    if (redirect.origin === app.origin) {
      return true;
    }

    // Check against whitelist
    const redirectHost = redirect.hostname.toLowerCase();
    const allowedHosts = [
      app.hostname.toLowerCase(),
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
 * @param appUrl - The application's base URL
 * @param defaultPath - Default path to use if URL is invalid
 * @param allowedDomains - Additional allowed domains (optional)
 * @returns string - Safe redirect URL
 */
export function sanitizeRedirectUrl(
  redirectUrl: string | null | undefined,
  appUrl: string,
  defaultPath: string = '/dashboard',
  allowedDomains: string[] = []
): string {
  // If no URL provided, use default
  if (!redirectUrl) {
    return `${appUrl}${defaultPath}`;
  }

  // Validate the URL
  if (isValidRedirectUrl(redirectUrl, appUrl, allowedDomains)) {
    // If it's a relative URL, make it absolute
    if (redirectUrl.startsWith('/')) {
      return `${appUrl}${redirectUrl}`;
    }
    return redirectUrl;
  }

  // Invalid URL, return default
  console.warn(`Invalid redirect URL blocked: ${redirectUrl}`);
  return `${appUrl}${defaultPath}`;
}
