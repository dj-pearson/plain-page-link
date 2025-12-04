/**
 * GDPR Account Deletion Edge Function
 * Handles account deletion requests with 30-day grace period
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { requireAuth, getClientIP } from '../_shared/auth.ts';

interface DeletionRequest {
  action: 'request' | 'cancel' | 'status';
  reason?: string;
  cancelReason?: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
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
    const clientIP = getClientIP(req);
    const userAgent = req.headers.get('user-agent') || '';

    // Use service role for deletion operations
    const serviceSupabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    if (req.method === 'GET') {
      // Get deletion status
      const { data: scheduled, error } = await supabase
        .from('account_deletion_scheduled')
        .select('*')
        .eq('user_id', user.id)
        .eq('cancelled', false)
        .eq('executed', false)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
        throw new Error(`Failed to fetch deletion status: ${error.message}`);
      }

      if (!scheduled) {
        return new Response(
          JSON.stringify({
            success: true,
            scheduled: false,
            message: 'No account deletion is scheduled',
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        );
      }

      const daysRemaining = Math.ceil(
        (new Date(scheduled.scheduled_for).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );

      return new Response(
        JSON.stringify({
          success: true,
          scheduled: true,
          scheduledFor: scheduled.scheduled_for,
          daysRemaining,
          reason: scheduled.reason,
          canCancel: true,
          requestedAt: scheduled.created_at,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 405 }
      );
    }

    const body: DeletionRequest = await req.json();

    switch (body.action) {
      case 'request': {
        // Request account deletion
        const { data: requestId, error } = await serviceSupabase
          .rpc('request_account_deletion', {
            p_user_id: user.id,
            p_reason: body.reason || null,
            p_ip_address: clientIP,
            p_user_agent: userAgent,
            p_grace_period_days: 30,
          });

        if (error) {
          throw new Error(error.message);
        }

        const scheduledFor = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

        return new Response(
          JSON.stringify({
            success: true,
            message: 'Account deletion scheduled',
            requestId,
            scheduledFor: scheduledFor.toISOString(),
            daysRemaining: 30,
            canCancel: true,
            cancelInstructions: 'You can cancel this request within the next 30 days by going to Settings > Privacy > Cancel Deletion',
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        );
      }

      case 'cancel': {
        // Cancel account deletion
        const { data: cancelled, error } = await serviceSupabase
          .rpc('cancel_account_deletion', {
            p_user_id: user.id,
            p_cancel_reason: body.cancelReason || 'User cancelled',
          });

        if (error) {
          throw new Error(`Failed to cancel deletion: ${error.message}`);
        }

        if (!cancelled) {
          return new Response(
            JSON.stringify({
              success: false,
              error: 'No pending deletion found to cancel',
            }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 404,
            }
          );
        }

        return new Response(
          JSON.stringify({
            success: true,
            message: 'Account deletion cancelled successfully',
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        );
      }

      case 'status': {
        // Same as GET - redirect
        const statusResponse = await fetch(req.url, {
          method: 'GET',
          headers: req.headers,
        });
        return statusResponse;
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action. Use: request, cancel, or status' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const status = errorMessage.includes('Unauthorized') ? 401 :
                   errorMessage.includes('already scheduled') ? 409 : 500;

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
