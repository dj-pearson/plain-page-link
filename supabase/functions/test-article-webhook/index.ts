import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { webhookUrl } = await req.json();
    console.log('Testing webhook URL:', webhookUrl);

    if (!webhookUrl) {
      throw new Error('Webhook URL is required');
    }

    // Create sample payload that matches exactly what will be sent
    const samplePayload = {
      articleTitle: "Sample Article: Top 10 Home Buying Tips for 2025",
      articleUrl: "https://yourdomain.com/articles/sample-article-slug",
      longFormPost: `🏡 Exciting News! Check out our latest article on home buying tips for 2025!

In today's real estate market, being prepared is more important than ever. Our comprehensive guide covers everything from financing options to negotiation strategies that can save you thousands.

Whether you're a first-time buyer or looking to upgrade, these insights will help you make informed decisions and avoid common pitfalls. From understanding market trends to working with the right professionals, we've got you covered.

Don't miss out on these valuable tips that could make all the difference in your home buying journey!

Read the full article here: https://yourdomain.com/articles/sample-article-slug

#RealEstate #HomeBuying #RealEstateTips #PropertyInvestment #HomeOwnership`,
      shortFormPost: `🏡 New article alert! Discover the top 10 home buying tips for 2025. Essential reading for every home buyer! https://yourdomain.com/articles/sample-article-slug`,
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

    console.log('Sending test payload to webhook...');

    // Send the test payload to the webhook URL
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'RealEstate-Article-Webhook/1.0',
      },
      body: JSON.stringify(samplePayload),
    });

    const responseText = await response.text();
    
    console.log('Webhook response status:', response.status);
    console.log('Webhook response body:', responseText);

    if (!response.ok) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Webhook returned status ${response.status}`,
          responseBody: responseText,
          samplePayload,
        }),
        { 
          status: 200, // Return 200 so frontend can display the error
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Test payload sent successfully',
        webhookResponse: {
          status: response.status,
          body: responseText,
        },
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
