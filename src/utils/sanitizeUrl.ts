/**
 * URL sanitization for agent-supplied links.
 *
 * US-455: this lived in sanitize.ts, which imports DOMPurify at module scope
 * and registers a hook on it. Every importer of sanitizeUrl therefore loaded
 * the HTML sanitizer (purify.es, ~10.8 KB gzip) without using it — on the
 * Links and Page Builder dashboard routes, and on the public profile and
 * listing pages every visitor opens. Nothing here touches the DOM, so it is
 * its own module, and it must stay free of DOMPurify (sanitizeUrl.test.ts
 * enforces this). Import it from '@/utils/sanitizeUrl', not '@/utils/sanitize'.
 */

/**
 * Schemes an agent-supplied URL may use. Everything else — javascript:,
 * data:, vbscript:, file:, blob:, intent:, … — is refused by omission rather
 * than by a deny-list, because a deny-list only blocks the spellings someone
 * thought of.
 */
const SAFE_URL_PROTOCOLS = new Set(['http:', 'https:', 'mailto:', 'tel:']);

/**
 * What the WHATWG URL parser silently discards before it reads a scheme:
 * leading/trailing C0 control characters and spaces, and every ASCII tab or
 * newline anywhere in the string. We strip the same characters first, so the
 * string we inspect is the string the browser will navigate to.
 */
// eslint-disable-next-line no-control-regex
const C0_OR_SPACE_EDGES = /^[\u0000- ]+|[\u0000- ]+$/g;
const TAB_OR_NEWLINE = /[\t\n\r]/g;

/** "zillow.com/me" or "www.example.com:8080/x" — a host with no scheme. */
const BARE_HOST =
  /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)*\.[a-z]{2,}(?::\d{1,5})?(?:[/?#]|$)/i;

/**
 * Sanitize an untrusted URL for use as an href or a navigation target.
 *
 * US-268: this used to lowercase and trim the input and test it with
 * startsWith('javascript:'). The URL parser strips tabs and newlines inside
 * the scheme and C0 control characters around it, so "java\tscript:alert(1)"
 * and "\u0001javascript:alert(1)" sailed through and came back unchanged —
 * and the page builder's LinkBlock and CTABlock assign the result to
 * window.location.href on the agent's public profile. Anything unrecognised
 * was also returned as-is, so "zillow.com/me" became a relative link to
 * agentbio.net/zillow.com/me, and "//evil.example" passed the "starts with /"
 * test as a protocol-relative URL to another host.
 *
 * Now the value is cleaned the way the browser cleans it, then parsed, and
 * only http(s), mailto and tel survive. A same-site path ("/blog") and a
 * same-page fragment ("#contact") are kept; a bare host gets https:// in front.
 *
 * @param url - Untrusted URL string
 * @returns A safe URL, or an empty string when the input must not be used
 */
export const sanitizeUrl = (url: string | null | undefined): string => {
  if (typeof url !== 'string') return '';
  const cleaned = url.replace(C0_OR_SPACE_EDGES, '').replace(TAB_OR_NEWLINE, '');
  if (!cleaned) return '';

  // A same-site path. "//host" and "/\host" are protocol-relative URLs to
  // another origin (browsers read a backslash as a slash), so not paths.
  if (cleaned.startsWith('/')) {
    return /^\/[/\\]/.test(cleaned) ? '' : cleaned;
  }

  // A same-page fragment ("#contact", the page-builder CTA default). It
  // cannot change the scheme or the origin, so it is kept as-is.
  if (cleaned.startsWith('#')) return cleaned;

  let candidate = '';
  if (/^[a-z][a-z0-9+.-]*:/i.test(cleaned) && !BARE_HOST.test(cleaned)) {
    candidate = cleaned;
  } else if (BARE_HOST.test(cleaned)) {
    candidate = `https://${cleaned}`;
  }
  if (!candidate) return '';

  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    return '';
  }
  if (!SAFE_URL_PROTOCOLS.has(parsed.protocol)) return '';
  if ((parsed.protocol === 'http:' || parsed.protocol === 'https:') && !parsed.hostname) {
    return '';
  }
  return candidate;
};

/**
 * sanitizeUrl, restricted to links that leave the site: http(s) only. For the
 * agent's link-in-bio rows, social profiles and virtual tours, where a path on
 * agentbio.net or a mailto: is not what the field holds.
 */
export const sanitizeExternalUrl = (url: string | null | undefined): string => {
  const safe = sanitizeUrl(url);
  return /^https?:\/\//i.test(safe) ? safe : '';
};
