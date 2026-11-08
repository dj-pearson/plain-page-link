/**
 * Cloudflare Pages Function for /:username/manifest.json (US-460).
 *
 * The web app manifest an agent's public page links, so a visitor who adds the
 * page to the home screen gets an icon that opens that page rather than the
 * AgentBio dashboard. The logic lives in _lib/profile-manifest.ts.
 */
import { profileManifestResponse, type ProfileManifestEnv } from '../_lib/profile-manifest';
import { routeParam } from '../_lib/profile-route';

interface PagesContext {
  env: ProfileManifestEnv;
  params: { username?: string | string[] };
}

export const onRequestGet = ({ env, params }: PagesContext): Promise<Response> =>
  profileManifestResponse(routeParam(params.username), env, (input, init) => fetch(input, init));
