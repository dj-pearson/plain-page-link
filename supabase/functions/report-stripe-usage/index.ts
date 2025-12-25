/**
 * Report Stripe Usage Edge Function
 *
 * Reports metered usage to Stripe for billing.
 * Used for usage-based pricing features like AI generations.
 *
 * Security:
 * - Requires authentication
 * - Rate limited
 * - Validates subscription item ownership
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import { checkRateLimit, getRateLimitHeaders } from "../_shared/rateLimit.ts";
import { getCorsHeaders } from '../_shared/cors.ts';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') as string, {
  apiVersion: '2023-10-16',
});

const supabaseUrl = Deno.env.get('SUPABASE_URL') as string;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string;

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get('origin'));

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limiting - higher limit for usage reporting
    const clientIp = req.headers.get('x-forwarded-for') || 'unknown';
    const rateLimit = checkRateLimit(`report-usage:${clientIp}`, {
      maxRequests: 100,
      windowMs: 60000, // 100 requests per minute
    });

    if (!rateLimit.allowed) {
      return new Response(
        JSON.stringify({ error: 'Too many requests. Please try again later.' }),
        {
          status: 429,
          headers: { ...corsHeaders, ...getRateLimitHeaders(rateLimit), 'Content-Type': 'application/json' },
        }
      );
    }

    // Get auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user
    const supabaseAnon = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY') as string, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await supabaseAnon.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'User not authenticated' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { subscription_item_id, quantity, timestamp, action = 'increment' } = await req.json();

    if (!subscription_item_id || !quantity) {
      return new Response(
        JSON.stringify({ error: 'subscription_item_id and quantity are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Service role client for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Validate that this subscription item belongs to the user
    const { data: userSubscription } = await supabase
      .from('user_subscriptions')
      .select('stripe_subscription_id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (!userSubscription) {
      return new Response(
        JSON.stringify({ error: 'No active subscription found' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify subscription item belongs to user's subscription
    const subscriptionItem = await stripe.subscriptionItems.retrieve(subscription_item_id);
    if (subscriptionItem.subscription !== userSubscription.stripe_subscription_id) {
      return new Response(
        JSON.stringify({ error: 'Subscription item does not belong to user' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Report usage to Stripe
    const usageRecord = await stripe.subscriptionItems.createUsageRecord(
      subscription_item_id,
      {
        quantity: quantity,
        timestamp: timestamp || Math.floor(Date.now() / 1000),
        action: action as 'increment' | 'set',
      }
    );

    return new Response(
      JSON.stringify({
        id: usageRecord.id,
        quantity: usageRecord.quantity,
        timestamp: usageRecord.timestamp,
        subscription_item: usageRecord.subscription_item,
      }),
      {
        headers: { ...corsHeaders, ...getRateLimitHeaders(rateLimit), 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error reporting usage:', error);
    const message = error instanceof Error ? error.message : 'An error occurred';
    return new Response(
      JSON.stringify({ error: message }),
      {
        headers: { ...getCorsHeaders(null), 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
