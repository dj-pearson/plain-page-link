/**
 * Fire the Cloudflare Pages deploy hook so a published article reaches the
 * index without a manual deploy (US-148).
 *
 * The blog is prerendered at build time now: scripts/prerender.mts reads the
 * `articles` rows and writes dist/blog/<slug>/index.html with the body already
 * in it. That is what makes a post crawlable on the first visit instead of
 * after Google's render queue gets to it — but it also means a post published
 * after the last deploy exists only in the database. Without this, writing an
 * article and publishing it would change nothing a crawler could see until
 * somebody happened to redeploy.
 *
 * The hook URL is a secret: anyone holding it can spend the account's build
 * minutes. It lives in the function's environment as CLOUDFLARE_DEPLOY_HOOK_URL
 * and is never returned to the caller, not even in an error.
 *
 * Requires an admin. Publishing is an admin action (articles is writable only
 * by admins), and an open endpoint that starts a paid build on request is a
 * denial-of-wallet primitive.
 *
 * US-234: the check here used to be that the Authorization header began with
 * "Bearer " — any string at all, including the anon key that ships in the
 * bundle. It now verifies an admin, and rate-limits per admin so a loop or a
 * stolen session cannot burn the build quota either.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import { requireAdmin } from '../_shared/auth.ts';
import { handleCorsPreFlight } from '../_shared/cors.ts';
import { checkRateLimitDb, type RateLimitConfig } from '../_shared/rate-limiter.ts';
import {
  errorResponse,
  handleUnexpectedError,
  methodNotAllowedResponse,
  rateLimitResponse,
  successResponse,
} from '../_shared/response.ts';

const HOOK_TIMEOUT_MS = 10_000;

/**
 * Cloudflare coalesces queued builds, so more than a handful in ten minutes
 * buys nothing. Fails closed: a rebuild that is skipped costs nothing (the
 * next deploy carries the article), a limiter that waves everything through
 * when it cannot count is no limiter.
 */
const REBUILD_LIMIT: RateLimitConfig = { maxRequests: 6, windowSeconds: 600, failClosed: true };

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return handleCorsPreFlight(req.headers.get('origin'));
  }
  if (req.method !== 'POST') {
    return methodNotAllowedResponse(req, ['POST']);
  }

  try {
    // Supabase verifies the JWT before the function runs when verify_jwt is on,
    // but production runs it behind edge-functions-server.ts, which does not,
    // so check explicitly — and check for an admin, not for a "Bearer " prefix.
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    const admin = await requireAdmin(req, supabase);

    const rate = await checkRateLimitDb(supabase, `trigger-rebuild:${admin.id}`, 'trigger-rebuild', REBUILD_LIMIT);
    if (!rate.allowed) {
      return rateLimitResponse(rate.retryAfterSeconds, req, 'A rebuild was requested recently; try again shortly.');
    }

    const hookUrl = Deno.env.get('CLOUDFLARE_DEPLOY_HOOK_URL');
    if (!hookUrl) {
      // Not configured is not the caller's fault and not a reason to fail the
      // publish that triggered it. Say so plainly in the logs and move on.
      console.warn('[trigger-rebuild] CLOUDFLARE_DEPLOY_HOOK_URL is not set; no build started');
      return successResponse({ triggered: false, reason: 'deploy hook not configured' }, req);
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), HOOK_TIMEOUT_MS);
    let response: Response;
    try {
      response = await fetch(hookUrl, { method: 'POST', signal: controller.signal });
    } finally {
      clearTimeout(timer);
    }

    if (!response.ok) {
      // Deliberately does not echo hookUrl or the body, either of which can
      // carry the token.
      console.error(`[trigger-rebuild] deploy hook answered ${response.status}`);
      // US-203: this was `errorResponse('...', req, 502)` — req in the `code`
      // slot and 502 in the `req` slot, so the 502 path called
      // (502).headers.get('origin') and threw instead of answering.
      return errorResponse('Deploy hook rejected the request', 'DEPLOY_HOOK_FAILED', req, 502);
    }

    console.log('[trigger-rebuild] Cloudflare Pages build requested');
    return successResponse({ triggered: true }, req);
  } catch (error) {
    return handleUnexpectedError(error, req);
  }
});
