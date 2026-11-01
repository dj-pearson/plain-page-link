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

interface PagesContext {
  request: Request;
  env: ProfileSitemapEnv;
}

export const onRequestGet = async ({ request, env }: PagesContext): Promise<Response> => {
  const origin = new URL(request.url).origin;
  return profileSitemapResponse(env, origin, (input, init) => fetch(input, init));
};
