/**
 * Cloudflare Pages Function for /:username/listing/:listingId (US-275).
 *
 * The listing page's crawler response: the listing's title, photo and
 * description in the share card, the same as functions/[username].ts gives the
 * legacy /:username?listing=<id> link. Humans get the SPA, its manifest link
 * pointed at the agent's (US-553).
 */
import { routeParam, serveProfileRoute, type PagesContext } from '../../_lib/profile-route';

export const onRequestGet = (context: PagesContext): Promise<Response> =>
  serveProfileRoute(
    context,
    routeParam(context.params.username),
    routeParam(context.params.listingId) ?? null,
    true
  );
