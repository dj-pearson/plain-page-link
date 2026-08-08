/**
 * Login Security Edge Function
 * Handles brute force protection and login attempt tracking
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import { corsHeaders } from '../_shared/cors.ts';
import { getClientIP } from '../_shared/auth.ts';

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
    // Use service role for security operations
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const body: RequestBody = await req.json();
    const clientIP = getClientIP(req);
    const userAgent = req.headers.get('user-agent') || '';

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
            p_ip_address: clientIP,
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

        // Record the login attempt
        const { data, error } = await supabase
          .rpc('record_login_attempt', {
            p_email: email.toLowerCase().trim(),
            p_ip_address: clientIP,
            p_user_id: userId || null,
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
        const { userId, sessionTokenHash, expiresAt, deviceType, browser, os } = body as RegisterSessionRequest;

        if (!userId || !sessionTokenHash || !expiresAt) {
          return new Response(
            JSON.stringify({ error: 'userId, sessionTokenHash, and expiresAt are required' }),
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
            ip_address: clientIP,
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
          p_ip_address: clientIP,
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
