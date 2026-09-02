/**
 * The one place an Edge Function reads a deployment URL or a shared API key.
 *
 * Before US-123 the same value had four spellings. The site URL was read as
 * `SITE_URL` (20 uses), `APP_URL` (sso-initiate, sso-callback, and as a
 * fallback in sitemap and publish-article-to-social), `FRONTEND_URL`
 * (oauth-proxy) and `PUBLIC_SITE_URL` (schedule-seo-audit); the functions
 * origin was `FUNCTIONS_URL` in oauth-proxy and `EDGE_FUNCTIONS_URL` in
 * generate-article; the PageSpeed key was `PAGESPEED_API_KEY` in one function
 * and `PAGESPEED_INSIGHTS_API_KEY` in two others. Every one of them fell back
 * to the production host, so a staging deployment that set the name it knew
 * about kept sending agents links to production from the functions that used
 * one of the other three.
 *
 * Each helper reads its variable on every call rather than at module load, so
 * a test can set it and so an unset value is diagnosable at the call site
 * rather than at import time.
 */

const PRODUCTION_SITE_URL = 'https://agentbio.net';
const PRODUCTION_FUNCTIONS_URL = 'https://functions.agentbio.net';

function read(name: string): string | undefined {
  const value = Deno.env.get(name);
  const trimmed = (value ?? '').trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

/** Strip a trailing slash so `${getSiteUrl()}/dashboard` never doubles it. */
function normalizeOrigin(value: string): string {
  return value.replace(/\/+$/, '');
}

/**
 * The public origin of the web app — where an emailed or redirected link
 * should land. Set `SITE_URL` per deployment.
 */
export function getSiteUrl(): string {
  return normalizeOrigin(read('SITE_URL') ?? PRODUCTION_SITE_URL);
}

/**
 * The origin serving the Edge Functions themselves, for a function that has to
 * call another one over HTTP. Set `FUNCTIONS_URL` per deployment.
 */
export function getFunctionsUrl(): string {
  return normalizeOrigin(read('FUNCTIONS_URL') ?? PRODUCTION_FUNCTIONS_URL);
}

/**
 * The Google API key used for PageSpeed Insights and, unless CHROME_UX_API_KEY
 * is set separately, the CrUX API. Undefined when unset — the callers differ on
 * whether that is fatal.
 */
export function getPagespeedApiKey(): string | undefined {
  return read('PAGESPEED_API_KEY');
}
