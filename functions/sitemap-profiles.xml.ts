/**
 * Cloudflare Pages Function for /sitemap-profiles.xml (US-262).
 *
 * Every published agent's page, listed for crawlers; robots.txt names this file
 * next to the build's sitemap.xml. A static route, so Pages matches it ahead of
 * the dynamic functions/[username].ts — which would skip it anyway, since a
 * segment with a dot is never a username (isReservedSegment). The logic lives
 * in _lib/profile-sitemap.ts, where it is unit tested.
 */
import { profileSitemapResponse, type ProfileSitemapEnv } from './_lib/profile-sitemap';
import { siteOrigin } from './_lib/site-origin';

interface PagesContext {
  request: Request;
  env: ProfileSitemapEnv;
}

/**
 * Every <loc> names the canonical origin, not the host that served the file
 * (US-595): the sitemap must list the addresses the pages canonicalise to.
 */
export const onRequestGet = async ({ env }: PagesContext): Promise<Response> =>
  profileSitemapResponse(env, siteOrigin(env), (input, init) => fetch(input, init));
