/**
 * Revoke Session Edge Function
 * Allows users to revoke specific sessions or all other sessions
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import { corsHeaders } from '../_shared/cors.ts';
import { requireAuth, getClientIP } from '../_shared/auth.ts';

interface RevokeRequest {
  sessionId?: string;      // Revoke specific session
  revokeAll?: boolean;     // Revoke all other sessions
  currentSessionId?: string; // Preserve this session when revoking all
  reason?: string;
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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Require authentication
    const user = await requireAuth(req, supabase);

    const body: RevokeRequest = await req.json();
    const { sessionId, revokeAll, currentSessionId, reason } = body;

    const clientIP = getClientIP(req);
    const userAgent = req.headers.get('user-agent') ?? null;

    // Service-role client for writing audit logs (independent of the caller's RLS context).
    const serviceSupabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_ANON_KEY')!
    );

    let result: { success: boolean; message: string; revoked_count?: number };

    if (revokeAll) {
      // Revoke all other sessions
      const { data, error } = await supabase
        .rpc('revoke_all_other_sessions', {
          p_user_id: user.id,
          p_current_session_id: currentSessionId || null,
        });

      if (error) {
        throw new Error(`Failed to revoke sessions: ${error.message}`);
      }

      result = {
        success: true,
        message: `Successfully revoked ${data} session(s)`,
        revoked_count: data,
      };

      // Audit: bulk session revocation (fire-and-forget; never blocks the response).
      await serviceSupabase
        .rpc('log_audit_event', {
          p_user_id: user.id,
          p_action: 'session_revoke_all',
          p_status: 'success',
          p_resource_type: 'session',
          p_ip_address: clientIP,
          p_user_agent: userAgent,
          p_details: JSON.stringify({
            revoked_count: data,
            preserved_session_id: currentSessionId || null,
            reason: reason || 'revoke_all_by_user',
          }),
        })
        .then(undefined, () => undefined);
    } else if (sessionId) {
      // Revoke specific session
      const { data, error } = await supabase
        .rpc('revoke_user_session', {
          p_session_id: sessionId,
          p_user_id: user.id,
          p_reason: reason || 'user_revoked',
        });

      if (error) {
        throw new Error(`Failed to revoke session: ${error.message}`);
      }

      if (!data) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Session not found or already revoked',
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 404,
          }
        );
      }

      result = {
        success: true,
        message: 'Session revoked successfully',
        revoked_count: 1,
      };

      // Audit: single session revocation.
      await serviceSupabase
        .rpc('log_audit_event', {
          p_user_id: user.id,
          p_action: 'session_revoke',
          p_status: 'success',
          p_resource_type: 'session',
          p_resource_id: sessionId,
          p_ip_address: clientIP,
          p_user_agent: userAgent,
          p_details: JSON.stringify({ reason: reason || 'user_revoked' }),
        })
        .then(undefined, () => undefined);
    } else {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Either sessionId or revokeAll must be provided',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const status = errorMessage.includes('Unauthorized') ? 401 : 500;

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status,
      }
    );
  }
});
