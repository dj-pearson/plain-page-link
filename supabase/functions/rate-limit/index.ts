/**
 * Distributed Rate Limiting Edge Function
 * Supports both Redis (Upstash) and PostgreSQL fallback
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { getClientIP } from '../_shared/auth.ts';

interface RateLimitRequest {
  identifier?: string;  // Custom identifier (user_id, email, etc.)
  limitType: string;    // 'login', 'api', 'password_reset', 'mfa', etc.
  maxRequests?: number; // Default based on limit type
  windowSeconds?: number; // Default based on limit type
}

// Default rate limit configurations
const RATE_LIMIT_CONFIGS: Record<string, { maxRequests: number; windowSeconds: number }> = {
  login: { maxRequests: 5, windowSeconds: 900 },         // 5 per 15 min
  password_reset: { maxRequests: 3, windowSeconds: 3600 }, // 3 per hour
  mfa: { maxRequests: 5, windowSeconds: 300 },           // 5 per 5 min
  api: { maxRequests: 100, windowSeconds: 60 },          // 100 per min
  export: { maxRequests: 2, windowSeconds: 86400 },      // 2 per day
  signup: { maxRequests: 3, windowSeconds: 3600 },       // 3 per hour
  contact: { maxRequests: 10, windowSeconds: 3600 },     // 10 per hour
};

// Redis client for Upstash (if configured)
async function checkRedisRateLimit(
  identifier: string,
  limitType: string,
  maxRequests: number,
  windowSeconds: number
): Promise<{ allowed: boolean; remaining: number; resetAt: Date } | null> {
  const redisUrl = Deno.env.get('UPSTASH_REDIS_REST_URL');
  const redisToken = Deno.env.get('UPSTASH_REDIS_REST_TOKEN');

  if (!redisUrl || !redisToken) {
    return null; // Fall back to PostgreSQL
  }

  try {
    const key = `ratelimit:${limitType}:${identifier}`;
    const now = Math.floor(Date.now() / 1000);
    const windowStart = now - windowSeconds;

    // Use Redis sorted set for sliding window rate limiting
    const pipeline = [
      // Remove old entries
      ['ZREMRANGEBYSCORE', key, '0', windowStart.toString()],
      // Add current request
      ['ZADD', key, now.toString(), `${now}:${crypto.randomUUID()}`],
      // Count requests in window
      ['ZCARD', key],
      // Set expiry
      ['EXPIRE', key, windowSeconds.toString()],
    ];

    const response = await fetch(`${redisUrl}/pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${redisToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(pipeline),
    });

    if (!response.ok) {
      console.error('Redis rate limit error:', await response.text());
      return null;
    }

    const results = await response.json();
    const count = results[2]?.result || 0;
    const remaining = Math.max(0, maxRequests - count);
    const resetAt = new Date((now + windowSeconds) * 1000);

    return {
      allowed: count <= maxRequests,
      remaining,
      resetAt,
    };
  } catch (error) {
    console.error('Redis rate limit error:', error);
    return null;
  }
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 405 }
    );
  }

  try {
    const body: RateLimitRequest = await req.json();
    const { identifier, limitType, maxRequests, windowSeconds } = body;

    if (!limitType) {
      return new Response(
        JSON.stringify({ error: 'limitType is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Get config for this limit type
    const config = RATE_LIMIT_CONFIGS[limitType] || { maxRequests: 10, windowSeconds: 60 };
    const finalMaxRequests = maxRequests || config.maxRequests;
    const finalWindowSeconds = windowSeconds || config.windowSeconds;

    // Use IP address as default identifier
    const clientIP = getClientIP(req);
    const finalIdentifier = identifier || clientIP;

    // Try Redis first
    let result = await checkRedisRateLimit(
      finalIdentifier,
      limitType,
      finalMaxRequests,
      finalWindowSeconds
    );

    // Fall back to PostgreSQL if Redis unavailable
    if (!result) {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      );

      const { data, error } = await supabase
        .rpc('check_rate_limit', {
          p_identifier: finalIdentifier,
          p_limit_type: limitType,
          p_max_requests: finalMaxRequests,
          p_window_seconds: finalWindowSeconds,
        });

      if (error) {
        throw new Error(`Rate limit check failed: ${error.message}`);
      }

      const row = data?.[0];
      result = {
        allowed: row?.allowed ?? true,
        remaining: row?.remaining ?? finalMaxRequests,
        resetAt: row?.reset_at ? new Date(row.reset_at) : new Date(Date.now() + finalWindowSeconds * 1000),
      };
    }

    // Build response headers
    const responseHeaders = {
      ...corsHeaders,
      'Content-Type': 'application/json',
      'X-RateLimit-Limit': finalMaxRequests.toString(),
      'X-RateLimit-Remaining': result.remaining.toString(),
      'X-RateLimit-Reset': result.resetAt.toISOString(),
    };

    if (!result.allowed) {
      responseHeaders['Retry-After'] = Math.ceil((result.resetAt.getTime() - Date.now()) / 1000).toString();
    }

    return new Response(
      JSON.stringify({
        success: true,
        allowed: result.allowed,
        remaining: result.remaining,
        resetAt: result.resetAt.toISOString(),
        limitType,
        identifier: finalIdentifier,
      }),
      {
        headers: responseHeaders,
        status: result.allowed ? 200 : 429,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Rate limit error:', errorMessage);

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
