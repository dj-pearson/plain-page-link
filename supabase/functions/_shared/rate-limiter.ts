// Database-backed rate limiter.
//
// Unlike the in-memory limiter in rateLimit.ts (which only protects a
// single function instance), this uses the rate_limits table + the
// check_rate_limit() SQL function so limits are enforced consistently
// across every edge function instance.
//
// Usage:
//   const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
//   const rl = await checkRateLimitDb(supabase, clientIP, 'submit-lead', RATE_LIMITS.auth);
//   if (!rl.allowed) return rateLimitResponse(rl.retryAfterSeconds, req);

import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

export interface RateLimitConfig {
  maxRequests: number;
  windowSeconds: number;
}

// Sensible presets. Tune per endpoint as needed.
export const RATE_LIMITS = {
  // General public endpoints
  general: { maxRequests: 60, windowSeconds: 60 } as RateLimitConfig,
  // Form submissions / lead capture
  submission: { maxRequests: 5, windowSeconds: 60 } as RateLimitConfig,
  // Auth-sensitive endpoints (login, username checks, MFA)
  auth: { maxRequests: 5, windowSeconds: 60 } as RateLimitConfig,
};

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: string;
  retryAfterSeconds: number;
}

/**
 * Checks (and atomically increments) the rate limit for an IP + endpoint.
 *
 * Fails OPEN: if the database call errors, the request is allowed so a
 * transient DB issue does not take down public endpoints. The error is
 * logged for monitoring.
 */
export async function checkRateLimitDb(
  supabase: SupabaseClient,
  ipAddress: string,
  endpoint: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  try {
    const { data, error } = await supabase.rpc('check_rate_limit', {
      p_ip_address: ipAddress || 'unknown',
      p_endpoint: endpoint,
      p_max_requests: config.maxRequests,
      p_window_seconds: config.windowSeconds,
    });

    if (error || !data || !data[0]) {
      console.error('Rate limiter DB error, failing open:', error?.message);
      return {
        allowed: true,
        remaining: config.maxRequests,
        resetAt: new Date(Date.now() + config.windowSeconds * 1000).toISOString(),
        retryAfterSeconds: config.windowSeconds,
      };
    }

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
    console.error('Rate limiter exception, failing open:', e);
    return {
      allowed: true,
      remaining: config.maxRequests,
      resetAt: new Date(Date.now() + config.windowSeconds * 1000).toISOString(),
      retryAfterSeconds: config.windowSeconds,
    };
  }
}

export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': result.resetAt,
  };
}
