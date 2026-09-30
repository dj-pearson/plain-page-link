/**
 * Create Stripe Checkout Session Edge Function
 *
 * Starts a plan purchase: a Checkout session for a new subscriber, or an
 * in-place price change for an existing one (US-217, see plan-change.ts).
 *
 * Subscriptions only. One-time `payment` mode was still accepted here after
 * US-059 removed its handling from the webhook, so an add-on could be paid for
 * and never delivered; it is refused now.
 *
 * Security:
 * - Requires authentication
 * - Rate limited (5 requests per minute)
 * - Validates price IDs against allowed patterns
 * - User ID stored in session metadata for webhook correlation
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import { checkRateLimitDb, getRateLimitHeaders, RATE_LIMITS } from "../_shared/rate-limiter.ts";
import { getCorsHeaders } from '../_shared/cors.ts';
import { getClientIP } from '../_shared/client-ip.ts';
import { changePlanIfSubscribed, type StripeSubscriptionsApi } from './plan-change.ts';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') as string, {
  apiVersion: '2023-10-16',
});

const supabaseUrl = Deno.env.get('SUPABASE_URL') as string;
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') as string;

// Allowed price ID patterns for security validation
const ALLOWED_PRICE_PATTERNS = [
  /^price_/,  // All Stripe price IDs start with price_
];

const subscriptionsApi: StripeSubscriptionsApi = {
  list: (params) => stripe.subscriptions.list(params),
  update: (id, params) => stripe.subscriptions.update(id, params),
};

/**
 * Validate that the price ID is allowed
 */
function isValidPriceId(priceId: string): boolean {
  return ALLOWED_PRICE_PATTERNS.some(pattern => pattern.test(priceId));
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get('origin'));

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limiting
    const clientIp = getClientIP(req);
    // US-084: was _shared/rateLimit.ts, a module-level Map. Edge isolates are
    // ephemeral and horizontally scaled, so that limiter reset on every cold
    // start and never saw a sibling's counts — the money endpoints had the one
    // limiter that did not work. checkRateLimitDb is atomic in Postgres.
    const rateLimitClient = createClient(
      Deno.env.get('SUPABASE_URL') as string,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string
    );
    const rateLimit = await checkRateLimitDb(rateLimitClient, clientIp, 'create-checkout-session', RATE_LIMITS.auth);

    if (!rateLimit.allowed) {
      return new Response(
        JSON.stringify({ error: 'Too many requests. Please try again later.' }),
        {
          status: 429,
          headers: { ...corsHeaders, ...getRateLimitHeaders(rateLimit), 'Content-Type': 'application/json' },
        }
      );
    }

    // Parse request body
    const { priceId, successUrl, cancelUrl, mode = 'subscription' } = await req.json();

    if (mode !== 'subscription') {
      return new Response(
        JSON.stringify({ error: 'Only subscriptions can be purchased' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate required fields
    if (!priceId) {
      return new Response(
        JSON.stringify({ error: 'priceId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!successUrl || !cancelUrl) {
      return new Response(
        JSON.stringify({ error: 'successUrl and cancelUrl are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate price ID format
    if (!isValidPriceId(priceId)) {
      return new Response(
        JSON.stringify({ error: 'Invalid price ID format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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

    // Get user from auth header
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'User not authenticated' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build session metadata
    const metadata: Record<string, string> = {
      user_id: user.id,
    };

    // Check for existing Stripe customer
    const supabaseService = createClient(
      supabaseUrl,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string
    );

    let customerId: string | undefined;

    // Try to find existing customer
    const { data: stripeCustomer } = await supabaseService
      .from('stripe_customers')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (stripeCustomer) {
      customerId = stripeCustomer.stripe_customer_id;
    } else {
      // Also check user_subscriptions table
      const { data: subscription } = await supabaseService
        .from('user_subscriptions')
        .select('stripe_customer_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (subscription?.stripe_customer_id) {
        customerId = subscription.stripe_customer_id;
      }
    }

    // Already subscribed: change that subscription instead of opening a
    // second one. The webhook's customer.subscription.updated records it.
    const change = await changePlanIfSubscribed(subscriptionsApi, customerId, priceId);
    if (change.action !== 'checkout') {
      return new Response(
        JSON.stringify({ changed: change.action === 'updated', subscriptionId: change.subscriptionId }),
        {
          headers: { ...corsHeaders, ...getRateLimitHeaders(rateLimit), 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // Build checkout session options
    const sessionOptions: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata,
      mode: 'subscription',
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
    };

    // Use existing customer or customer_email
    if (customerId) {
      sessionOptions.customer = customerId;
    } else {
      sessionOptions.customer_email = user.email;
    }

    // Create the checkout session
    const session = await stripe.checkout.sessions.create(sessionOptions);

    return new Response(
      JSON.stringify({
        sessionId: session.id,
        url: session.url,
      }),
      {
        headers: {
          ...corsHeaders,
          ...getRateLimitHeaders(rateLimit),
          'Content-Type': 'application/json'
        },
        status: 200,
      }
    );
  } catch (error) {
    // Log detail server-side; don't return internal error strings to the caller.
    console.error('Checkout session error:', error instanceof Error ? error.message : error);
    return new Response(
      JSON.stringify({ error: 'Unable to start checkout. Please try again.' }),
      {
        headers: { ...getCorsHeaders(null), 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
