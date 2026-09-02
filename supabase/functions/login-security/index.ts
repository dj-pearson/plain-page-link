/**
 * Login Security Edge Function
 * Handles brute force protection and login attempt tracking
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import { getCorsHeaders, handleCorsPreFlight } from '../_shared/cors.ts';
import { getClientIP } from '../_shared/auth.ts';
import { checkRateLimitDb, RATE_LIMITS } from '../_shared/rate-limiter.ts';

interface ThrottleCheckRequest {
  action: 'check_throttle';
  email: string;
}

interface RecordAttemptRequest {
  action: 'record_attempt';
  email: string;
  userId?: string;
  success: boolean;
  failureReason?: string;
  deviceFingerprint?: string;
}

interface RegisterSessionRequest {
  action: 'register_session';
  userId: string;
  sessionTokenHash: string;
  expiresAt: string;
  deviceType?: string;
  browser?: string;
  os?: string;
}

type RequestBody = ThrottleCheckRequest | RecordAttemptRequest | RegisterSessionRequest;

serve(async (req: Request) => {
  // Per request, from the Origin header. This was the module-level static
  // `corsHeaders`, pinned to https://agentbio.net, so every visitor who
  // reached the site as www.agentbio.net failed CORS here (US-123).
  const corsHeaders = getCorsHeaders(req.headers.get('origin'), 'GET, POST, PUT, DELETE, OPTIONS');
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return handleCorsPreFlight(req.headers.get('origin'));
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 405 }
    );
  }

  try {
    // Use service role for security operations
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const body: RequestBody = await req.json();
    const clientIP = getClientIP(req);
    const userAgent = req.headers.get('user-agent') || '';

    /**
     * The address as the database wants it.
     *
     * ip_address is `inet`, and getClientIP can return the string 'unknown'
     * behind a proxy that sends no forwarded header — which is not a valid
     * inet and makes the RPC raise. NULL is the honest value for "we do not
     * know", and check_login_throttle falls back to its old email-wide count
     * for it, which over-blocks rather than under-blocks.
     */
    const clientInet = clientIP && clientIP !== 'unknown' ? clientIP : null;

    /**
     * Every action here is unauthenticated by necessity — there is no session
     * during a login — so the per-address limit is the only thing standing
     * between this endpoint and a script (US-119). Applied before any branch,
     * so it covers throttle probes as well as writes.
     */
    const rate = await checkRateLimitDb(
      supabase,
      clientIP,
      `login-security:${body?.action ?? 'unknown'}`,
      RATE_LIMITS.auth
    );
    if (!rate.allowed) {
      return new Response(
        JSON.stringify({ error: 'Too many requests', retryAfter: rate.retryAfterSeconds }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'Retry-After': String(rate.retryAfterSeconds),
          },
          status: 429,
        }
      );
    }

    /**
     * The user id from the caller's own JWT, or null.
     *
     * register_session used to take `userId` from the request body and insert a
     * user_sessions row for it — so anyone could write session rows against any
     * account, which is both a spoofed audit trail and a way to fill another
     * person's active-sessions list with entries they did not create.
     */
    const authHeader = req.headers.get('Authorization') ?? '';
    const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : null;
    const callerId = bearer
      ? ((await supabase.auth.getUser(bearer)).data.user?.id ?? null)
      : null;

    switch (body.action) {
      case 'check_throttle': {
        const { email } = body as ThrottleCheckRequest;

        if (!email) {
          return new Response(
            JSON.stringify({ error: 'Email is required' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          );
        }

        // Check login throttling
        const { data, error } = await supabase
          .rpc('check_login_throttle', {
            p_email: email.toLowerCase().trim(),
            p_ip_address: clientInet,
            p_window_minutes: 15,
            p_max_attempts: 5,
          });

        if (error) {
          throw new Error(`Throttle check failed: ${error.message}`);
        }

        const result = data?.[0] || { is_blocked: false, attempts_remaining: 5 };

        // US-079: this used to answer 429 when blocked. callEdgeFunction throws
        // on any non-2xx, so edgeFunctions.invoke returned { data: null, error }
        // and checkLoginThrottle's fail-open branch turned the block into
        // `blocked: false` — the one answer the throttle exists to produce was
        // the one answer it discarded, and Login.tsx's `if (blocked)` was
        // unreachable. A throttle verdict is a successful query about state,
        // not a transport failure, so it is now 200 with the verdict in the
        // body. Retry-After is kept for any caller that wants it.
        const throttleHeaders: Record<string, string> = {
          ...corsHeaders,
          'Content-Type': 'application/json',
        };
        if (result.is_blocked && result.blocked_until) {
          const seconds = Math.max(
            0,
            Math.ceil((new Date(result.blocked_until).getTime() - Date.now()) / 1000)
          );
          throttleHeaders['Retry-After'] = String(seconds);
        }

        return new Response(
          JSON.stringify({
            success: true,
            blocked: result.is_blocked,
            attemptsRemaining: result.attempts_remaining,
            blockedUntil: result.blocked_until,
            reason: result.reason,
          }),
          { headers: throttleHeaders, status: 200 }
        );
      }

      case 'record_attempt': {
        const { email, userId, success, failureReason, deviceFingerprint } = body as RecordAttemptRequest;

        if (!email) {
          return new Response(
            JSON.stringify({ error: 'Email is required' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          );
        }

        // Record the login attempt.
        //
        // This stays callable without a session, because a FAILED login has no
        // session to authenticate with and recording failures is the entire
        // point of the control. What made it dangerous was not that it was
        // open, but that check_login_throttle counted an email's failures
        // across every source address — so five posts locked any account out.
        // 20260902000016 scopes that counter to the caller's own address, so
        // this endpoint can now only lock out the machine using it (US-119).
        //
        // The user id is never taken from the body: an unauthenticated caller
        // must not be able to attribute an attempt to someone else's account.
        const { data, error } = await supabase
          .rpc('record_login_attempt', {
            p_email: email.toLowerCase().trim(),
            p_ip_address: clientInet,
            p_user_id: callerId,
            p_success: success,
            p_failure_reason: failureReason || null,
            p_user_agent: userAgent,
            p_device_fingerprint: deviceFingerprint || null,
          });

        if (error) {
          throw new Error(`Failed to record attempt: ${error.message}`);
        }

        return new Response(
          JSON.stringify({
            success: true,
            attemptId: data,
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        );
      }

      case 'register_session': {
        const { sessionTokenHash, expiresAt, deviceType, browser, os } = body as RegisterSessionRequest;

        // The session being registered belongs to the caller, full stop. The
        // body's `userId` is ignored — it used to be trusted, so anyone could
        // insert user_sessions rows against any account (US-119). A session has
        // just been created at this point, so there is always a JWT to read.
        if (!callerId) {
          return new Response(
            JSON.stringify({ error: 'Unauthorized' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
          );
        }
        const userId = callerId;

        if (!sessionTokenHash || !expiresAt) {
          return new Response(
            JSON.stringify({ error: 'sessionTokenHash and expiresAt are required' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          );
        }

        // Parse device info from user agent if not provided
        const parsedDeviceType = deviceType || parseDeviceType(userAgent);
        const parsedBrowser = browser || parseBrowser(userAgent);
        const parsedOS = os || parseOS(userAgent);

        // Register the session
        const { data, error } = await supabase
          .from('user_sessions')
          .insert({
            user_id: userId,
            session_token_hash: sessionTokenHash,
            ip_address: clientInet,
            user_agent: userAgent,
            device_type: parsedDeviceType,
            browser: parsedBrowser,
            os: parsedOS,
            expires_at: expiresAt,
            is_current: true,
          })
          .select('id')
          .single();

        if (error) {
          throw new Error(`Failed to register session: ${error.message}`);
        }

        // Log the audit event
        await supabase.rpc('log_audit_event', {
          p_user_id: userId,
          p_action: 'login',
          p_status: 'success',
          p_resource_type: 'session',
          p_resource_id: data.id,
          p_ip_address: clientInet,
          p_user_agent: userAgent,
          p_details: JSON.stringify({
            device_type: parsedDeviceType,
            browser: parsedBrowser,
            os: parsedOS,
          }),
          p_risk_level: 'low',
        });

        return new Response(
          JSON.stringify({
            success: true,
            sessionId: data.id,
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Login security error:', errorMessage);

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

// Helper functions to parse user agent
function parseDeviceType(userAgent: string): string {
  const ua = userAgent.toLowerCase();
  if (/mobile|android|iphone|ipad|phone/i.test(ua)) {
    if (/tablet|ipad/i.test(ua)) return 'tablet';
    return 'mobile';
  }
  return 'desktop';
}

function parseBrowser(userAgent: string): string {
  if (/edg\//i.test(userAgent)) return 'Edge';
  if (/chrome/i.test(userAgent) && !/edg\//i.test(userAgent)) return 'Chrome';
  if (/firefox/i.test(userAgent)) return 'Firefox';
  if (/safari/i.test(userAgent) && !/chrome/i.test(userAgent)) return 'Safari';
  if (/opera|opr\//i.test(userAgent)) return 'Opera';
  return 'Unknown';
}

function parseOS(userAgent: string): string {
  if (/windows/i.test(userAgent)) return 'Windows';
  if (/macintosh|mac os x/i.test(userAgent)) return 'macOS';
  if (/linux/i.test(userAgent) && !/android/i.test(userAgent)) return 'Linux';
  if (/android/i.test(userAgent)) return 'Android';
  if (/iphone|ipad|ipod/i.test(userAgent)) return 'iOS';
  return 'Unknown';
}
