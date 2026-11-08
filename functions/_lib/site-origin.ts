/**
 * The origin an agent's page canonically lives at, whatever host served the
 * request (US-595).
 *
 * The crawler HTML for /:username and /:username/listing/:id, and the URLs in
 * /sitemap-profiles.xml, were built from `new URL(request.url).origin`. The
 * same Pages project also answers on its production `*.pages.dev` alias (which
 * Cloudflare does not mark noindex, unlike branch previews) and on any other
 * hostname bound to it. On every one of those hosts each agent's page told
 * Googlebot it was the original — a self-referencing canonical, og:url and
 * JSON-LD @id on a host that is not the site — so every agent and every
 * listing could be indexed twice, splitting the signals that should have
 * ranked agentbio.net/<name>.
 *
 * The marketing pages fixed this in US-172 with getBaseUrl(); the agent pages
 * were left on the visitor's host for custom domains (US-389). Nothing serves a
 * profile from a custom domain: no Pages Function or SPA route maps a hostname
 * to an agent, so a custom domain bound to the project would serve the AgentBio
 * homepage at `/` and agentbio.net's pages under its own name. Until host
 * routing exists, the configured origin is the only canonical address an
 * agent's page has. When custom domains are routed, this is the one function
 * that needs to learn about them.
 *
 * VITE_APP_URL is the variable the SPA build and scripts/prerender.mts read;
 * Pages exposes the project's variables to Functions as `env` too. Anything
 * that is not an absolute http(s) URL falls back to production, the same
 * fallback src/lib/utils.ts uses.
 */

export const FALLBACK_SITE_ORIGIN = 'https://agentbio.net';

export interface SiteOriginEnv {
  VITE_APP_URL?: string;
}

export function siteOrigin(env: SiteOriginEnv | undefined): string {
  const configured = (env?.VITE_APP_URL ?? '').trim();
  if (!configured) return FALLBACK_SITE_ORIGIN;
  try {
    const url = new URL(configured);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return FALLBACK_SITE_ORIGIN;
    return url.origin;
  } catch {
    return FALLBACK_SITE_ORIGIN;
  }
}
