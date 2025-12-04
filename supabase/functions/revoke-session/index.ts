/**
 * Revoke Session Edge Function
 * Allows users to revoke specific sessions or all other sessions
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
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
