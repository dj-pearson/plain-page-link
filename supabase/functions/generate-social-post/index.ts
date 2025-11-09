import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { getCorsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get('origin'));
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { contentType, subjectType, platformType, listingId, customPrompt } = await req.json();
    
    // Get environment variables
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!LOVABLE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing required environment variables");
    }

    // Create Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get AI configuration
    const { data: configData } = await supabase
      .from('ai_configuration')
      .select('setting_key, setting_value')
      .in('setting_key', ['default_model', 'temperature_creative', 'max_tokens_standard']);
    
    const config: Record<string, any> = {};
    configData?.forEach(item => {
      config[item.setting_key] = JSON.parse(item.setting_value);
    });

    console.log("Generating social post:", { contentType, subjectType, platformType });

    // Build prompt based on content type
    let prompt = customPrompt || buildPrompt(contentType, subjectType, platformType);

    // If listingId provided, fetch listing details
    if (listingId) {
      const { data: listing } = await supabase
        .from('listings')
        .select('*')
        .eq('id', listingId)
        .single();
      
      if (listing) {
        prompt += `\n\nProperty Details:\n- Address: ${listing.address}\n- Price: ${listing.price}\n- Beds: ${listing.beds}\n- Baths: ${listing.baths}\n- Description: ${listing.description}`;
      }
    }

    // Call AI to generate content
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: config.default_model || "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "You are an expert real estate social media content creator. Create engaging, professional posts that drive engagement and leads."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: config.temperature_creative || 0.7,
        max_tokens: config.max_tokens_standard || 2000,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI generation error:", aiResponse.status, errorText);
      throw new Error(`AI generation failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const generatedContent = aiData.choices?.[0]?.message?.content || '';

    // Parse the generated content into different formats
    const postContent = parseGeneratedContent(generatedContent, platformType);

    console.log("Content generated successfully");

    return new Response(
      JSON.stringify({
        success: true,
        content: postContent,
        prompt: prompt
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error generating social post:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function buildPrompt(contentType: string, subjectType: string, platformType: string): string {
  const prompts: Record<string, string> = {
    property_highlight: "Create an engaging social media post highlighting a featured property. Focus on unique features, lifestyle benefits, and call-to-action.",
    market_update: "Create a professional market update post with current trends, statistics, and insights for homebuyers and sellers.",
    agent_tip: "Create a helpful tip for homebuyers or sellers. Make it actionable and valuable.",
    community_spotlight: "Create a post highlighting a local community feature, amenity, or event.",
    success_story: "Create a compelling success story post about a recent sale or happy client.",
  };

  let basePrompt = prompts[contentType] || "Create an engaging real estate social media post.";

  if (platformType === 'twitter_threads') {
    basePrompt += "\n\nFormat: Create a Twitter thread with 3-5 tweets. Each tweet should be under 280 characters. Use emojis and hashtags appropriately.";
  } else if (platformType === 'facebook_linkedin') {
    basePrompt += "\n\nFormat: Create a longer-form post (200-300 words) suitable for Facebook and LinkedIn. Use professional tone with engaging storytelling.";
  } else if (platformType === 'instagram') {
    basePrompt += "\n\nFormat: Create an Instagram caption with emojis, 2-3 paragraphs, and relevant hashtags at the end.";
  }

  return basePrompt;
}

function parseGeneratedContent(content: string, platformType: string): Record<string, string> {
  // Simple parsing - in production you might want more sophisticated parsing
  return {
    [platformType]: content,
    raw: content
  };
}
