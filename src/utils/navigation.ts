/**
 * Navigation Security Utilities
 * Security: Prevents open redirect vulnerabilities
 */

/**
 * List of allowed internal redirect paths
 * Only paths in this list (or starting with these paths) are allowed
 */
const ALLOWED_REDIRECT_PATHS = [
  '/dashboard',
  '/profile',
  '/listings',
  '/leads',
  '/testimonials',
  '/analytics',
  '/links',
  '/settings',
  '/theme',
  '/seo',
  '/admin',
  '/blog',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/legal/privacy',
  '/legal/terms',
  '/legal/dmca',
  '/legal/acceptable-use',
  '/pricing',
  '/submit-review',
];

/**
 * Validate and sanitize a redirect path
 * Prevents open redirect attacks by only allowing internal paths
 * PRESERVES query parameters and hash fragments for better UX
 *
 * @param path - Untrusted redirect path (e.g., from localStorage or URL params)
 * @param defaultPath - Default safe path to use if validation fails
 * @returns Safe redirect path with preserved query params and hash
 */
export function validateRedirectPath(
  path: string | null | undefined,
  defaultPath: string = '/dashboard'
): string {
  // Return default if path is empty
  if (!path || typeof path !== 'string') {
    return defaultPath;
  }

  // Extract path, query params, and hash
  const [pathWithQuery, hash] = path.split('#');
  const [cleanPath, queryString] = pathWithQuery.split('?');

  // Must start with / and not with //
  if (!cleanPath.startsWith('/') || cleanPath.startsWith('//')) {
    console.warn('Invalid redirect path blocked:', path);
    return defaultPath;
  }

  // Check against whitelist
  const isAllowed = ALLOWED_REDIRECT_PATHS.some(allowed =>
    cleanPath === allowed || cleanPath.startsWith(allowed + '/')
  );

  if (!isAllowed) {
    console.warn('Redirect path not in whitelist:', path);
    return defaultPath;
  }

  // Reconstruct path with preserved query params and hash
  let result = cleanPath;
  if (queryString) {
    result += '?' + queryString;
  }
  if (hash) {
    result += '#' + hash;
  }

  return result;
}

/**
 * Validate external URL (for links, social media, etc.)
 * Ensures URL uses safe protocols
 *
 * @param url - URL to validate
 * @returns true if URL is safe, false otherwise
 */
export function isValidExternalUrl(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }

  const trimmed = url.trim().toLowerCase();

  // Block dangerous protocols
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
  if (dangerousProtocols.some(protocol => trimmed.startsWith(protocol))) {
    return false;
  }

  // Allow http, https, mailto, tel
  const safeProtocols = ['http://', 'https://', 'mailto:', 'tel:'];
  return safeProtocols.some(protocol => trimmed.startsWith(protocol));
}

/**
 * Get safe return URL from query params
 * Common usage: ?returnTo=/dashboard/analytics
 *
 * @param searchParams - URLSearchParams object
 * @param paramName - Name of the query parameter (default: 'returnTo')
 * @param defaultPath - Default path if validation fails
 * @returns Safe redirect path
 */
export function getSafeReturnUrl(
  searchParams: URLSearchParams,
  paramName: string = 'returnTo',
  defaultPath: string = '/dashboard'
): string {
  const returnTo = searchParams.get(paramName);
  return validateRedirectPath(returnTo, defaultPath);
}
