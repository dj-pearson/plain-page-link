import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import { getCorsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get('origin'));
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { webhookId } = await req.json();
    console.log('Testing webhook:', webhookId);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch the webhook
    const { data: webhook, error: webhookError } = await supabase
      .from('social_media_webhooks')
      .select('*')
      .eq('id', webhookId)
      .single();

    if (webhookError || !webhook) {
      throw new Error('Webhook not found: ' + webhookError?.message);
    }

    console.log('Found webhook:', webhook.name);

    // Create a sample marketing post payload
    const testPayload = {
      postType: 'marketing',
      purpose: 'agent_signup',
      longFormPost: `🏡 Are your social media followers slipping through the cracks?

You're posting consistently. Engaging with clients. Sharing stunning property photos. But here's the hard truth: 95% of your social traffic leaves without taking action.

Why? Because social platforms aren't built to convert—they're built to keep people scrolling.

That's where AgentBio changes the game. It's a link-in-bio platform designed specifically for real estate agents who want to turn social media impressions into qualified leads.

Here's what you get:
✅ One powerful link to showcase ALL your listings
✅ A professional portfolio that builds instant credibility
✅ Lead capture forms that actually convert
✅ Analytics to see which listings drive the most interest
✅ Mobile-optimized design (because 80% of your audience is on their phone)

Stop losing leads to a messy social media profile. Your competition isn't—and they're already using platforms like AgentBio to stay ahead.

👉 Join 1,000+ agents who've transformed their social presence. Start your free trial today at agentbio.net

#RealEstateMarketing #AgentSuccess #LeadGeneration #RealEstateTech`,
      shortFormPost: `95% of your social traffic vanishes. AgentBio turns followers into leads. Try it free → agentbio.net 🏡 #RealEstate`,
      hashtags: [
        '#RealEstateMarketing',
        '#AgentSuccess',
        '#LeadGeneration',
        '#RealEstateTech',
        '#RealEstateAgent',
        '#PropertyMarketing',
        '#SocialMediaMarketing',
        '#RealEstateBusiness'
      ],
      targetUrl: 'https://agentbio.net',
      generatedAt: new Date().toISOString(),
      testMode: true,
    };

    console.log('Sending test payload:', JSON.stringify(testPayload, null, 2));

    // Send to webhook
    const webhookResponse = await fetch(webhook.webhook_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(webhook.headers || {}),
      },
      body: JSON.stringify(testPayload),
    });

    const responseText = await webhookResponse.text();
    
    console.log('Webhook response status:', webhookResponse.status);
    console.log('Webhook response:', responseText);

    if (!webhookResponse.ok) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Webhook returned error',
          status: webhookResponse.status,
          response: responseText,
          payload: testPayload,
        }),
        { 
          status: 200, // Return 200 so the content is still visible
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Test webhook sent successfully',
        payload: testPayload,
        response: {
          status: webhookResponse.status,
          body: responseText,
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in test-social-webhook:', error);
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
