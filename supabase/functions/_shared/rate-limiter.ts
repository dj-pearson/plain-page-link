// Database-backed rate limiter.
//
// Unlike the in-memory limiter in rateLimit.ts (which only protects a
// single function instance), this uses the rate_limit_entries table + the
// check_rate_limit() SQL function so limits are enforced consistently
// across every edge function instance. (It said "rate_limits" — a different,
// orphaned table — and that is where the wrong argument names came from.)
//
// Usage:
//   const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
//   const rl = await checkRateLimitDb(supabase, clientIP, 'submit-lead', RATE_LIMITS.submission);
//   if (!rl.allowed) return rateLimitResponse(rl.retryAfterSeconds, req);

import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

export interface RateLimitConfig {
  maxRequests: number;
  windowSeconds: number;
  /**
   * What to do when the rate-limit check itself fails. Defaults to false
   * (allow the request) so an ad-hoc config keeps the old behaviour; the
   * submission and auth presets set it true.
   */
  failClosed?: boolean;
}

// Sensible presets. Tune per endpoint as needed.
//
// `failClosed` decides what happens when the database call itself fails. For a
// general read endpoint, letting the request through beats taking the endpoint
// down over a transient DB error. For form submission and for auth-sensitive
// work — MFA verification, checkout sessions, username enumeration — an
// unavailable limiter means the only control on abuse is unavailable, and the
// safe answer is to refuse. That choice was moot until now: the RPC was called
// with argument names no function has, so every check errored and every preset
// failed open, silently (US-098).
export const RATE_LIMITS = {
  // General public endpoints
  general: { maxRequests: 60, windowSeconds: 60, failClosed: false } as RateLimitConfig,
  // Form submissions / lead capture
  submission: { maxRequests: 5, windowSeconds: 60, failClosed: true } as RateLimitConfig,
  // Auth-sensitive endpoints (login, username checks, MFA)
  auth: { maxRequests: 5, windowSeconds: 60, failClosed: true } as RateLimitConfig,
};

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: string;
  retryAfterSeconds: number;
}

/**
 * Checks (and atomically increments) the rate limit for an identifier +
 * endpoint.
 *
 * On a database error the outcome depends on config.failClosed: general
 * endpoints allow the request rather than go down over a transient DB fault,
 * while submission and auth endpoints refuse it, because for those an
 * unavailable limiter means no control on abuse at all. Either way the
 * PostgREST message is logged at error level — the previous version logged
 * `error?.message` and returned allowed:true for everything, which is how a
 * call that never once succeeded went unnoticed across thirteen functions.
 */
export async function checkRateLimitDb(
  supabase: SupabaseClient,
  identifier: string,
  endpoint: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const onError = (reason: string): RateLimitResult => {
    const allowed = !config.failClosed;
    console.error(
      `[rate-limiter] check_rate_limit failed for ${endpoint}: ${reason} — ` +
        `${allowed ? 'failing open' : 'failing closed'}`
    );
    return {
      allowed,
      remaining: allowed ? config.maxRequests : 0,
      resetAt: new Date(Date.now() + config.windowSeconds * 1000).toISOString(),
      retryAfterSeconds: config.windowSeconds,
    };
  };

  try {
    // These argument names must match check_rate_limit(p_identifier text,
    // p_limit_type text, p_max_requests integer, p_window_seconds integer).
    // PostgREST resolves an RPC by its named arguments, so a mismatch is a 404,
    // not a type error — nothing in tsc, deno check or the unit tests sees it.
    // verify:schema now compares these names against pg_proc.proargnames.
    const { data, error } = await supabase.rpc('check_rate_limit', {
      p_identifier: identifier || 'unknown',
      p_limit_type: endpoint,
      p_max_requests: config.maxRequests,
      p_window_seconds: config.windowSeconds,
    });

    if (error) return onError(error.message);
    if (!data || !data[0]) return onError('no row returned');

    const row = data[0] as {
      allowed: boolean;
      remaining: number;
      reset_at: string;
    };
    const resetMs = new Date(row.reset_at).getTime() - Date.now();

    return {
      allowed: row.allowed,
      remaining: row.remaining,
      resetAt: row.reset_at,
      retryAfterSeconds: Math.max(1, Math.ceil(resetMs / 1000)),
    };
  } catch (e) {
    return onError(e instanceof Error ? e.message : String(e));
  }
}

export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': result.resetAt,
  };
}
