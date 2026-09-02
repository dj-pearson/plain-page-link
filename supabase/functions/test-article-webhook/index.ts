import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import { getCorsHeaders } from '../_shared/cors.ts';
import { requireAdmin } from '../_shared/auth.ts';
import { safeFetch } from '../_shared/ssrf-guard.ts';
import { isValidWebhookUrl } from '../_shared/validation.ts';

/**
 * Send a sample article payload to a webhook, to check it is wired up.
 *
 * US-119: this was an unauthenticated request proxy. It took a URL from the
 * request body, POSTed to it, and returned the response status AND body to the
 * caller. On self-hosted Supabase the edge runtime shares a Docker network with
 * postgres-meta, Kong and GoTrue, so anyone who could reach this function could
 * read those services — a full unauthenticated internal read, with the answer
 * echoed back.
 *
 * Three things close it, and all three are needed:
 *   - admin only. This is an operator tool; it was never meant to be public.
 *   - the URL goes through the SSRF guard, which resolves the host and refuses
 *     private and reserved ranges, and re-checks every redirect hop — a public
 *     hostname that redirects to 127.0.0.1 defeats a single up-front check.
 *   - the response body is NOT returned. Even for an admin, echoing an
 *     arbitrary body turns the function back into a read primitive; the status
 *     is what "did the webhook accept it?" actually needs.
 */

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get('origin'));
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    try {
      await requireAdmin(req, supabase);
    } catch (authError) {
      const message = authError instanceof Error ? authError.message : 'Unauthorized';
      return new Response(JSON.stringify({ success: false, error: message }), {
        status: message.startsWith('Forbidden') ? 403 : 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { webhookUrl } = await req.json();

    if (!webhookUrl || typeof webhookUrl !== 'string') {
      throw new Error('Webhook URL is required');
    }

    // The allow-list first, so an obviously wrong target is refused without a
    // DNS lookup; the guard below is what stops the clever ones.
    if (!isValidWebhookUrl(webhookUrl)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'That URL is not an accepted webhook destination',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create sample payload that matches exactly what will be sent
    const samplePayload = {
      articleTitle: "Sample Article: Top 10 Home Buying Tips for 2025",
      articleUrl: "https://agentbio.net/blog/sample-article-slug",
      longFormPost: `🏡 Exciting News! Check out our latest article on home buying tips for 2025!

In today's real estate market, being prepared is more important than ever. Our comprehensive guide covers everything from financing options to negotiation strategies that can save you thousands.

Whether you're a first-time buyer or looking to upgrade, these insights will help you make informed decisions and avoid common pitfalls. From understanding market trends to working with the right professionals, we've got you covered.

Don't miss out on these valuable tips that could make all the difference in your home buying journey!

Read the full article here: https://agentbio.net/blog/sample-article-slug

#RealEstate #HomeBuying #RealEstateTips #PropertyInvestment #HomeOwnership`,
      shortFormPost: `🏡 New article alert! Discover the top 10 home buying tips for 2025. Essential reading for every home buyer! https://agentbio.net/blog/sample-article-slug`,
      hashtags: [
        "RealEstate",
        "HomeBuying",
        "RealEstateTips",
        "PropertyInvestment",
        "HomeOwnership",
        "HouseHunting",
        "RealEstateAdvice",
        "NewHomeOwner"
      ],
      category: "Buying Guide",
      publishedAt: new Date().toISOString(),
      _metadata: {
        note: "This is a test payload. Real articles will have actual content.",
        payloadVersion: "1.0",
        timestamp: new Date().toISOString()
      }
    };

    // safeFetch, not fetch: it refuses private and reserved targets and
    // re-checks every redirect hop.
    const response = await safeFetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'RealEstate-Article-Webhook/1.0',
      },
      body: JSON.stringify(samplePayload),
    });

    // The body is read and discarded. Returning it is what made this a read
    // primitive; the status answers the question the operator is asking.
    console.log(`[test-article-webhook] responded ${response.status}`);

    if (!response.ok) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Webhook returned status ${response.status}`,
          samplePayload,
        }),
        {
          status: 200, // Return 200 so frontend can display the error
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Test payload sent successfully',
        webhookResponse: { status: response.status },
        samplePayload,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in test-article-webhook:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ 
        success: false,
        error: errorMessage 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
