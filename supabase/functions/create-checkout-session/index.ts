/**
 * Create Stripe Checkout Session Edge Function
 *
 * Creates Stripe checkout sessions for both subscriptions and one-time purchases.
 *
 * Supports:
 * - Subscription mode: Recurring billing for plans
 * - Payment mode: One-time purchases for add-ons
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
import { checkRateLimit, getRateLimitHeaders } from "../_shared/rateLimit.ts";
import { getCorsHeaders } from '../_shared/cors.ts';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') as string, {
  apiVersion: '2023-10-16',
});

const supabaseUrl = Deno.env.get('SUPABASE_URL') as string;
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') as string;

// Allowed price ID patterns for security validation
const ALLOWED_PRICE_PATTERNS = [
  /^price_/,  // All Stripe price IDs start with price_
];

// One-time purchase product types (add-ons)
const ONE_TIME_PRODUCTS: Record<string, { name: string; description: string }> = {
  'premium_theme': { name: 'Premium Theme', description: 'Unlock premium portfolio themes' },
  'extra_listings': { name: 'Extra Listings Pack', description: '10 additional listing slots' },
  'sms_pack': { name: 'SMS Credits Pack', description: '500 SMS message credits' },
  'virtual_staging': { name: 'Virtual Staging Credits', description: '10 virtual staging credits' },
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
    const clientIp = req.headers.get('x-forwarded-for') || 'unknown';
    const rateLimit = checkRateLimit(`checkout:${clientIp}`, {
      maxRequests: 5,
      windowMs: 60000, // 5 requests per minute
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

    // Parse request body
    const {
      priceId,
      successUrl,
      cancelUrl,
      mode = 'subscription', // 'subscription' or 'payment'
      productType,           // For one-time purchases
      quantity = 1,          // For one-time purchases
    } = await req.json();

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

    if (mode === 'payment' && productType) {
      metadata.product_type = productType;
    }

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
      .single();

    if (stripeCustomer) {
      customerId = stripeCustomer.stripe_customer_id;
    } else {
      // Also check user_subscriptions table
      const { data: subscription } = await supabaseService
        .from('user_subscriptions')
        .select('stripe_customer_id')
        .eq('user_id', user.id)
        .single();

      if (subscription?.stripe_customer_id) {
        customerId = subscription.stripe_customer_id;
      }
    }

    // Build checkout session options
    const sessionOptions: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: mode === 'payment' ? quantity : 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata,
      mode: mode as 'subscription' | 'payment',
    };

    // Use existing customer or customer_email
    if (customerId) {
      sessionOptions.customer = customerId;
    } else {
      sessionOptions.customer_email = user.email;
    }

    // For subscriptions, allow promotion codes
    if (mode === 'subscription') {
      sessionOptions.allow_promotion_codes = true;
      sessionOptions.billing_address_collection = 'auto';
    }

    // For one-time payments, add product info to metadata
    if (mode === 'payment' && productType && ONE_TIME_PRODUCTS[productType]) {
      sessionOptions.metadata!.product_name = ONE_TIME_PRODUCTS[productType].name;
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
    console.error('Checkout session error:', error);
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
