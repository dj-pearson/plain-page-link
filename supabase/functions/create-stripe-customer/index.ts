/**
 * Create Stripe Customer Edge Function
 *
 * Creates a Stripe customer for a user if one doesn't exist.
 * This is called when a user needs to be billed for usage-based features.
 *
 * Security:
 * - Requires authentication
 * - Rate limited
 * - Only creates customer for authenticated user
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import { checkRateLimitDb, getRateLimitHeaders, RATE_LIMITS } from "../_shared/rate-limiter.ts";
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
    // Rate limiting
    const clientIp = req.headers.get('x-forwarded-for') || 'unknown';
    // US-084: was _shared/rateLimit.ts, a module-level Map. Edge isolates are
    // ephemeral and horizontally scaled, so that limiter reset on every cold
    // start and never saw a sibling's counts — the money endpoints had the one
    // limiter that did not work. checkRateLimitDb is atomic in Postgres.
    const rateLimitClient = createClient(
      Deno.env.get('SUPABASE_URL') as string,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string
    );
    const rateLimit = await checkRateLimitDb(rateLimitClient, clientIp, 'create-stripe-customer', RATE_LIMITS.auth);

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

    // Service role client for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if customer already exists
    const { data: existingCustomer } = await supabase
      .from('stripe_customers')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (existingCustomer) {
      return new Response(
        JSON.stringify({
          id: existingCustomer.stripe_customer_id,
          email: existingCustomer.email,
          exists: true,
        }),
        {
          headers: { ...corsHeaders, ...getRateLimitHeaders(rateLimit), 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // Get user profile for additional details
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, username')
      .eq('id', user.id)
      .single();

    // Create Stripe customer
    const customer = await stripe.customers.create({
      email: user.email,
      name: profile?.full_name || profile?.username || undefined,
      metadata: {
        user_id: user.id,
        platform: 'agentbio',
      },
    });

    // Store in database
    const { error: insertError } = await supabase
      .from('stripe_customers')
      .insert({
        user_id: user.id,
        stripe_customer_id: customer.id,
        email: user.email,
        name: profile?.full_name || profile?.username,
        is_active: true,
      });

    if (insertError) {
      console.error('Error storing customer:', insertError);
      // Don't fail - customer was created in Stripe
    }

    return new Response(
      JSON.stringify({
        id: customer.id,
        email: customer.email,
        exists: false,
      }),
      {
        headers: { ...corsHeaders, ...getRateLimitHeaders(rateLimit), 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error creating Stripe customer:', error);
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
