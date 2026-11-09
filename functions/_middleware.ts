/**
 * Pages middleware for every request that reaches Functions (US-607).
 *
 * Marks responses on any host other than the configured origin (the production
 * `*.pages.dev` alias, previews, another bound hostname) noindex. The logic and
 * its reasons live in _lib/canonical-host.ts, where they are unit tested.
 *
 * A thrown error from next() is not caught here: it reaches Pages exactly as
 * it would without this middleware.
 */
import { markNonCanonicalHost } from './_lib/canonical-host';
import type { SiteOriginEnv } from './_lib/site-origin';

interface MiddlewareContext {
  request: Request;
  env: SiteOriginEnv;
  next: () => Promise<Response>;
}

export const onRequest = async ({ request, env, next }: MiddlewareContext): Promise<Response> =>
  markNonCanonicalHost(request.url, env, await next());
