/**
 * SSRF guard for the functions that fetch a caller-supplied URL (US-077).
 *
 * crawl-site, check-broken-links, check-security-headers, detect-redirect-chains,
 * analyze-images, check-core-web-vitals and check-mobile-first all took a URL
 * from the request body, passed it through `new URL()` — which parses, it does
 * not validate — and fetched it. From a process holding the service-role key,
 * with the response body returned to the caller. `http://169.254.169.254/` and
 * `http://127.0.0.1:<port>/` were both reachable.
 *
 * `_shared/url-validation.ts` does not cover this: it validates *redirect*
 * targets for the SSO flow against an allow-list of the app's own origins.
 *
 * Two things matter and only one is obvious:
 *   - the hostname must not be a private address, AND
 *   - the hostname must not RESOLVE to one. `internal.example.com` with an A
 *     record of 10.0.0.5 is the interesting case, and a string check misses it.
 *
 * Residual risk: DNS rebinding. The name is resolved here and resolved again by
 * fetch(), and a hostile resolver can answer differently. Closing that needs
 * connect-time pinning, which Deno's fetch does not expose. Documented rather
 * than pretended away.
 */

/** Blocked IPv4 ranges, as [network, prefix length]. */
const BLOCKED_V4: Array<[string, number]> = [
  ['0.0.0.0', 8], // "this" network
  ['10.0.0.0', 8], // RFC1918
  ['100.64.0.0', 10], // CGNAT
  ['127.0.0.0', 8], // loopback
  ['169.254.0.0', 16], // link-local — cloud metadata lives at 169.254.169.254
  ['172.16.0.0', 12], // RFC1918
  ['192.0.0.0', 24], // IETF protocol assignments
  ['192.168.0.0', 16], // RFC1918
  ['198.18.0.0', 15], // benchmarking
  ['224.0.0.0', 4], // multicast
  ['240.0.0.0', 4], // reserved
];

function v4ToInt(ip: string): number | null {
  const parts = ip.split('.');
  if (parts.length !== 4) return null;
  let out = 0;
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) return null;
    const n = Number(part);
    if (n > 255) return null;
    out = (out << 8) + n;
  }
  return out >>> 0;
}

/** Is this literal IP address in a range we refuse to fetch from? */
export function isBlockedAddress(ip: string): boolean {
  const addr = ip.trim().replace(/^\[|\]$/g, '');

  // IPv6, including the loopback and unique-local ranges, and any
  // IPv4-mapped form (::ffff:127.0.0.1).
  if (addr.includes(':')) {
    const lower = addr.toLowerCase();
    if (lower === '::1' || lower === '::') return true;
    if (/^f[cd][0-9a-f]{2}:/.test(lower)) return true; // fc00::/7 unique-local
    if (/^fe[89ab][0-9a-f]:/.test(lower)) return true; // fe80::/10 link-local
    const mapped = lower.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (mapped) return isBlockedAddress(mapped[1]);
    return false;
  }

  const value = v4ToInt(addr);
  if (value === null) return false;

  return BLOCKED_V4.some(([network, bits]) => {
    const net = v4ToInt(network);
    if (net === null) return false;
    const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
    return (value & mask) === (net & mask);
  });
}

export interface UrlGuardResult {
  ok: boolean;
  reason?: string;
  url?: URL;
}

/**
 * Check a caller-supplied URL before fetching it.
 *
 * Call this on EVERY hop, not just the first: crawl-site follows links and
 * detect-redirect-chains follows Location headers, so a public URL that
 * redirects to 127.0.0.1 defeats a single up-front check.
 */
export async function assertFetchableUrl(input: string): Promise<UrlGuardResult> {
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    return { ok: false, reason: 'Not a valid URL' };
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return { ok: false, reason: `Unsupported scheme: ${url.protocol}` };
  }

  const host = url.hostname.toLowerCase();

  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.internal')) {
    return { ok: false, reason: 'Host is not publicly routable' };
  }

  // A literal address needs no lookup.
  if (/^\d+\.\d+\.\d+\.\d+$/.test(host) || host.includes(':')) {
    return isBlockedAddress(host)
      ? { ok: false, reason: 'Address is in a private or reserved range' }
      : { ok: true, url };
  }

  // Otherwise resolve it: the hostname being public says nothing about where it
  // points.
  try {
    const records = await Promise.allSettled([
      Deno.resolveDns(host, 'A'),
      Deno.resolveDns(host, 'AAAA'),
    ]);
    const addresses = records.flatMap((r) => (r.status === 'fulfilled' ? r.value : []));

    if (addresses.length === 0) {
      return { ok: false, reason: 'Host does not resolve' };
    }
    if (addresses.some((a) => isBlockedAddress(a))) {
      return { ok: false, reason: 'Host resolves to a private or reserved address' };
    }
  } catch (error) {
    return {
      ok: false,
      reason: `Could not resolve host: ${error instanceof Error ? error.message : String(error)}`,
    };
  }

  return { ok: true, url };
}

/**
 * fetch() that refuses private targets and re-checks every redirect hop.
 * Use this instead of bare fetch() for any caller-supplied URL.
 *
 * A caller that passes `redirect: 'manual'` is following the chain itself
 * (detect-redirect-chains reports every hop, which is the whole point of that
 * function), so this guards the URL and returns the single response without
 * consuming the redirect. Per-hop safety still holds, because such a caller
 * comes back through here for the next hop.
 */
export async function safeFetch(
  input: string,
  init: RequestInit = {},
  maxRedirects = 5
): Promise<Response> {
  if (init.redirect === 'manual') {
    const guard = await assertFetchableUrl(input);
    if (!guard.ok) {
      throw new Error(`Refusing to fetch ${input}: ${guard.reason}`);
    }
    return fetch(input, init);
  }

  let current = input;

  for (let hop = 0; hop <= maxRedirects; hop++) {
    const guard = await assertFetchableUrl(current);
    if (!guard.ok) {
      throw new Error(`Refusing to fetch ${current}: ${guard.reason}`);
    }

    // manual: a 30x must come back here so the next hop is checked too.
    const response = await fetch(current, { ...init, redirect: 'manual' });

    if (response.status < 300 || response.status >= 400) return response;

    const location = response.headers.get('location');
    if (!location) return response;

    current = new URL(location, current).toString();
  }

  throw new Error(`Too many redirects starting from ${input}`);
}
