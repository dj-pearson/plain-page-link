/**
 * Keep the duplicate hosts of the Pages project out of search indexes (US-607).
 *
 * US-595 pointed every canonical, og:url and JSON-LD @id at the configured
 * origin, but the production `*.pages.dev` alias still answers the whole site
 * with 200s: the same prerendered pages and the same robots.txt. Cloudflare
 * marks branch previews noindex and does not mark the production alias, so a
 * canonical is the only thing telling a crawler that agentbio.pages.dev/jane
 * is a copy, and a canonical is a hint Google may ignore. An X-Robots-Tag
 * header is a directive: the alias drops out of the index instead of being
 * merely deduplicated.
 *
 * Why a header and not a 301 to the configured origin: preview deployments
 * (`<hash>.agentbio.pages.dev`, `<branch>.agentbio.pages.dev`) and
 * `wrangler pages dev` are served by the same Functions, and people open them
 * to check a change before it ships. A redirect would send every preview to
 * production. A header changes nothing a person sees.
 *
 * Every response on such a host is marked, assets included: an image on the
 * alias can be indexed by image search just like a page, and the header does
 * not stop a browser from loading it.
 *
 * Production is never marked, even if VITE_APP_URL is set to something else
 * by mistake. A wrong canonical is recoverable; a noindex on agentbio.net
 * would remove every agent's page from Google until someone noticed.
 */
import { FALLBACK_SITE_ORIGIN, siteOrigin, type SiteOriginEnv } from './site-origin';

const NOINDEX = 'noindex';

/** True when a response served for `requestUrl` must carry noindex. */
export function isNonCanonicalHost(requestUrl: string, env: SiteOriginEnv | undefined): boolean {
  let host: string;
  try {
    host = new URL(requestUrl).host.toLowerCase();
  } catch {
    return false;
  }
  const canonicalHosts = new Set([
    new URL(siteOrigin(env)).host.toLowerCase(),
    new URL(FALLBACK_SITE_ORIGIN).host.toLowerCase(),
  ]);
  return !canonicalHosts.has(host);
}

/**
 * The X-Robots-Tag a non-canonical host's response should carry, given the
 * one it already has. A rule from public/_headers (for example the
 * `noindex, nofollow` on /dashboard/*) is kept rather than weakened to a bare
 * noindex.
 */
export function withNoindex(existing: string | null): string {
  const current = (existing ?? '').trim();
  if (!current) return NOINDEX;
  const directives = current.split(',').map((d) => d.trim().toLowerCase());
  if (directives.includes(NOINDEX) || directives.includes('none')) return current;
  return `${current}, ${NOINDEX}`;
}

/**
 * The response to send: unchanged on the canonical host, otherwise a copy with
 * the noindex directive. Responses from the asset server and from fetch() have
 * immutable headers, so the marked one is rebuilt rather than edited.
 */
export function markNonCanonicalHost(
  requestUrl: string,
  env: SiteOriginEnv | undefined,
  response: Response
): Response {
  if (!isNonCanonicalHost(requestUrl, env)) return response;
  const marked = new Response(response.body, response);
  marked.headers.set('X-Robots-Tag', withNoindex(response.headers.get('X-Robots-Tag')));
  return marked;
}
