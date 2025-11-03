import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    console.log('Generating marketing post for webhook:', webhookUrl);

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get AI configuration from database
    const { data: configData } = await supabase
      .from('ai_configuration')
      .select('setting_key, setting_value')
      .in('setting_key', ['default_model', 'temperature_creative', 'max_tokens_large']);
    
    const config: Record<string, any> = {};
    configData?.forEach(item => {
      config[item.setting_key] = JSON.parse(item.setting_value);
    });

    console.log('Using AI config:', config);

    // Generate unique, catchy marketing content
    const prompt = `Create a compelling social media marketing post to drive real estate agents to sign up for AgentBio - a link-in-bio platform specifically built for real estate professionals.

Make it UNIQUE and CATCHY. Focus on pain points agents face:
- Converting social media traffic to leads
- Showcasing listings professionally
- Managing their online presence
- Standing out from competition
- Getting more qualified leads

Generate:
1. A long-form post (200-280 words) for LinkedIn/Facebook that:
   - Starts with a hook (question, surprising stat, or relatable pain point)
   - Explains the solution/benefit
   - Includes a clear call-to-action
   - Feels authentic, not salesy

2. A short-form post (120-150 characters) for Twitter/Threads that:
   - Is punchy and memorable
   - Creates urgency or curiosity
   - Includes a subtle CTA

3. 5-8 relevant hashtags for real estate agents

Return ONLY valid JSON with this exact structure:
{
  "longForm": "your long post here",
  "shortForm": "your short post here",
  "hashtags": ["hashtag1", "hashtag2", ...]
}`;

    console.log('Calling AI to generate marketing content...');

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.default_model || 'google/gemini-2.5-flash',
        messages: [
          { 
            role: 'system', 
            content: 'You are a creative social media marketing expert specializing in real estate. Generate unique, engaging content that stands out. NEVER repeat the same angles or hooks. You MUST respond ONLY with valid JSON, no markdown formatting, no code blocks, just pure JSON.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: config.temperature_creative || 0.7,
        max_tokens: config.max_tokens_large || 8000,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const generatedContent = aiData.choices[0].message.content;
    
    console.log('AI Raw response:', generatedContent);

    // Parse the AI response
    let socialContent;
    try {
      // Remove markdown code blocks if present
      let cleanedContent = generatedContent.trim();
      if (cleanedContent.startsWith('```json')) {
        cleanedContent = cleanedContent.replace(/```json\s*/g, '').replace(/```\s*$/g, '');
      } else if (cleanedContent.startsWith('```')) {
        cleanedContent = cleanedContent.replace(/```\s*/g, '');
      }
      
      // Try to extract JSON from the response
      const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        socialContent = JSON.parse(jsonMatch[0]);
        console.log('Parsed social content:', JSON.stringify(socialContent, null, 2));
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      throw new Error('Failed to generate valid content');
    }

    // Create the webhook payload
    const payload = {
      postType: 'marketing',
      purpose: 'agent_signup',
      longFormPost: socialContent.longForm,
      shortFormPost: socialContent.shortForm,
      hashtags: socialContent.hashtags,
      targetUrl: 'https://agentbio.net',
      generatedAt: new Date().toISOString(),
    };

    console.log('Generated payload:', JSON.stringify(payload, null, 2));

    // Send to webhook if URL provided
    if (webhookUrl) {
      console.log('Sending to webhook:', webhookUrl);
      
      const webhookResponse = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!webhookResponse.ok) {
        const errorText = await webhookResponse.text();
        console.error('Webhook failed:', webhookResponse.status, errorText);
        return new Response(
          JSON.stringify({ 
            error: 'Webhook delivery failed', 
            status: webhookResponse.status,
            details: errorText,
            payload // Still return the payload so user can see it
          }),
          { 
            status: 200, // Return 200 so the content is still visible
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      console.log('Webhook delivered successfully');
    }

    return new Response(
      JSON.stringify({
        success: true,
        payload,
        message: webhookUrl ? 'Content generated and sent to webhook' : 'Content generated successfully',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-marketing-post:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
