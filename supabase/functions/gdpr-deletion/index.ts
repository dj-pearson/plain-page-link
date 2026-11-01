/**
 * GDPR Account Deletion Edge Function
 * Handles account deletion requests with 30-day grace period
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import { getCorsHeaders, handleCorsPreFlight } from '../_shared/cors.ts';
import { requireAuth, getClientIP } from '../_shared/auth.ts';
import {
  pauseBillingForDeletion,
  restoreBillingAfterCancel,
  supabaseDeletionStore,
  type DeletionDeps,
} from '../_shared/account-deletion.ts';
import { createSubscriptionApi } from '../_shared/stripe-subscriptions.ts';

function billingDeps(db: SupabaseClient): DeletionDeps {
  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
  return {
    store: supabaseDeletionStore(db),
    stripe: stripeKey ? createSubscriptionApi(stripeKey) : null,
  };
}

interface DeletionRequest {
  action: 'request' | 'cancel' | 'status';
  reason?: string;
  cancelReason?: string;
}

serve(async (req: Request) => {
  // Per request, from the Origin header. This was the module-level static
  // `corsHeaders`, pinned to https://agentbio.net, so every visitor who
  // reached the site as www.agentbio.net failed CORS here (US-123).
  const corsHeaders = getCorsHeaders(req.headers.get('origin'), 'GET, POST, PUT, DELETE, OPTIONS');
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return handleCorsPreFlight(req.headers.get('origin'));
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

        // US-250: stop the subscription renewing. The deletion is already
        // scheduled; if Stripe fails here the erasure cancels it outright.
        const billing = await pauseBillingForDeletion(billingDeps(serviceSupabase), user.id);

        const scheduledFor = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

        return new Response(
          JSON.stringify({
            success: true,
            message: 'Account deletion scheduled',
            requestId,
            subscription: billing.subscription,
            subscriptionEndsAt: billing.subscription === 'ends_at_period_end' ? billing.periodEnd : null,
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
        // Read what the request changed at Stripe before the row is cancelled.
        const deps = billingDeps(serviceSupabase);
        const pending = await deps.store.pendingDeletion(user.id).catch((pendingError: unknown) => {
          console.error('[gdpr-deletion] could not read pending deletion:', pendingError);
          return null;
        });

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

        // US-250: put the subscription's renewal back as it was.
        const billing = await restoreBillingAfterCancel(deps, user.id, pending);

        return new Response(
          JSON.stringify({
            success: true,
            message: 'Account deletion cancelled successfully',
            subscription: billing.subscription,
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
