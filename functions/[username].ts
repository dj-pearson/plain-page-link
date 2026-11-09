/**
 * Cloudflare Pages Function for /:username (US-114).
 *
 * public/_redirects is `/* /index.html 200` with nothing prerendering, so a
 * crawler that fetched agentbio.net/jane received index.html's marketing tags
 * and Cover.png. Agents share this link from business cards and Instagram
 * bios; the unfurl was a pitch for the platform, with no trace of the agent.
 *
 * Only crawlers are served the rewritten document. A human still gets the SPA
 * from the asset server with one change: its manifest link names the agent's
 * manifest (US-553), so install prompts see the right app before any script
 * runs. Nothing about the app's behaviour, caching or hydration changes, and
 * no database read is made for a person.
 *
 * Everything that can fail — a missing binding, an unreachable database, an
 * unknown username, a five-second timeout — falls through to next(). A social
 * card is worth having; it is not worth risking the page itself for.
 */

import { routeParam, serveProfileRoute, type PagesContext } from './_lib/profile-route';

export const onRequestGet = (context: PagesContext): Promise<Response> =>
  serveProfileRoute(
    context,
    routeParam(context.params.username),
    new URL(context.request.url).searchParams.get('listing'),
    false
  );
