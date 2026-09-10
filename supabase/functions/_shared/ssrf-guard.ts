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
 *
 * US-196: the IPv6 half of this was bypassable, and its test passed anyway.
 *
 * `new URL()` does not preserve the IPv4-mapped form a person writes. It
 * normalises it to hexadecimal:
 *
 *     new URL('http://[::ffff:127.0.0.1]/').hostname  ->  '[::ffff:7f00:1]'
 *     new URL('http://[::ffff:169.254.169.254]/').hostname -> '[::ffff:a9fe:a9fe]'
 *
 * The old check looked for `::ffff:` followed by a DOTTED quad, which is the
 * form the guard is never handed. So `http://[::ffff:127.0.0.1]/` was judged
 * public and fetched — from a process holding the service-role key, with the
 * response body returned to the caller. The exact hole US-077 exists to close,
 * one encoding away.
 *
 * The test asserted `isBlockedAddress('::ffff:127.0.0.1') === true` and was
 * right; that string just never reaches the function. A guard tested only on
 * input the code does not see has not been tested.
 *
 * The fix is to stop pattern-matching text and expand the address to its eight
 * groups, then read the embedded IPv4 out of every form that carries one:
 * mapped (::ffff:0:0/96), compatible (::/96), NAT64 (64:ff9b::/96) and
 * 6to4 (2002::/16).
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

/**
 * Expand an IPv6 address to its eight 16-bit groups.
 *
 * Handles `::` compression and a trailing dotted quad. Returns null for
 * anything that is not a well-formed address, so a caller can tell "not IPv6"
 * from "IPv6 that is fine" — the previous code could not, and answered
 * "not blocked" to both.
 */
export function expandIpv6(input: string): number[] | null {
  let addr = input.trim().replace(/^\[|\]$/g, '').toLowerCase();
  // A zone index (fe80::1%eth0) names an interface, and an interface is local
  // by definition. Strip it for parsing; the prefix check below catches it.
  const zone = addr.indexOf('%');
  if (zone !== -1) addr = addr.slice(0, zone);
  if (!addr.includes(':')) return null;
  if ((addr.match(/::/g) ?? []).length > 1) return null;

  // A trailing dotted quad occupies the last two groups.
  let tail: number[] = [];
  const dotted = addr.match(/(\d{1,3}(?:\.\d{1,3}){3})$/);
  if (dotted) {
    const v4 = v4ToInt(dotted[1]);
    if (v4 === null) return null;
    tail = [v4 >>> 16, v4 & 0xffff];
    addr = addr.slice(0, addr.length - dotted[1].length).replace(/:$/, '');
  }

  const [head, rest, extra] = addr.split('::');
  if (extra !== undefined) return null;

  const parse = (part: string): number[] | null => {
    if (part === '') return [];
    const out: number[] = [];
    for (const group of part.split(':')) {
      if (group === '' || !/^[0-9a-f]{1,4}$/.test(group)) return null;
      out.push(parseInt(group, 16));
    }
    return out;
  };

  const left = parse(head.replace(/:$/, ''));
  if (left === null) return null;

  if (rest === undefined) {
    const groups = [...left, ...tail];
    return groups.length === 8 ? groups : null;
  }

  const right = parse(rest.replace(/^:/, ''));
  if (right === null) return null;

  const groups = [...left, ...right, ...tail];
  if (groups.length > 8) return null;
  const zeros = new Array(8 - groups.length).fill(0);
  return [...left, ...zeros, ...right, ...tail];
}

/** The IPv4 address an IPv6 address embeds, in dotted form, or null. */
function embeddedV4(g: number[]): string | null {
  const dotted = (hi: number, lo: number) =>
    `${hi >>> 8}.${hi & 0xff}.${lo >>> 8}.${lo & 0xff}`;

  const zeroThrough = (n: number) => g.slice(0, n).every((x) => x === 0);

  // ::ffff:0:0/96 — IPv4-mapped. This is the one that was getting through.
  if (zeroThrough(5) && g[5] === 0xffff) return dotted(g[6], g[7]);
  // ::/96 — IPv4-compatible. Deprecated, still routed by some stacks.
  if (zeroThrough(6) && !(g[6] === 0 && (g[7] === 0 || g[7] === 1))) {
    return dotted(g[6], g[7]);
  }
  // 64:ff9b::/96 — NAT64. The whole point of the prefix is to reach an IPv4.
  if (g[0] === 0x0064 && g[1] === 0xff9b && g.slice(2, 6).every((x) => x === 0)) {
    return dotted(g[6], g[7]);
  }
  // 2002::/16 — 6to4 carries its IPv4 in the next 32 bits.
  if (g[0] === 0x2002) return dotted(g[1], g[2]);

  return null;
}

/** Is this IPv6 address one we refuse to fetch from? */
function isBlockedV6(input: string): boolean {
  const g = expandIpv6(input);
  // Unparseable is not "safe". Refusing something malformed costs nothing;
  // fetching something we could not read is how this goes wrong.
  if (g === null) return true;

  if (g.every((x) => x === 0)) return true; // ::
  if (g.slice(0, 7).every((x) => x === 0) && g[7] === 1) return true; // ::1

  if ((g[0] & 0xfe00) === 0xfc00) return true; // fc00::/7 unique-local
  if ((g[0] & 0xffc0) === 0xfe80) return true; // fe80::/10 link-local
  if (g[0] === 0x2001 && g[1] === 0x0000) return true; // 2001::/32 Teredo tunnel

  const v4 = embeddedV4(g);
  if (v4 !== null) return isBlockedAddress(v4);

  return false;
}

/** Is this literal IP address in a range we refuse to fetch from? */
export function isBlockedAddress(ip: string): boolean {
  const addr = ip.trim().replace(/^\[|\]$/g, '');

  if (addr.includes(':')) return isBlockedV6(addr);

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
