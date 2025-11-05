import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { customInstructions, count = 10 } = await req.json();

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing required environment variables");
    }

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

    // Get the selected model's details
    const defaultModelId = config.default_model || "google/gemini-2.5-flash";
    const { data: modelData, error: modelError } = await supabase
      .from('ai_models')
      .select('*')
      .eq('model_id', defaultModelId)
      .eq('is_active', true)
      .single();

    if (modelError || !modelData) {
      console.error('Model not found:', defaultModelId, modelError);
      return new Response(
        JSON.stringify({ success: false, error: `Model ${defaultModelId} not configured` }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiKey = Deno.env.get(modelData.secret_name || 'LOVABLE_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, error: `API key ${modelData.secret_name} not configured` }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch existing keywords to understand content themes
    const { data: keywords } = await supabase
      .from('keywords')
      .select('keyword, category')
      .eq('is_active', true)
      .limit(50);

    // Fetch recent articles to understand content patterns
    const { data: recentArticles } = await supabase
      .from('articles')
      .select('title, category, seo_keywords')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(20);

    // Build context from existing content
    const keywordList = keywords?.map(k => k.keyword).join(', ') || '';
    const categories = [...new Set(keywords?.map(k => k.category) || [])].join(', ');
    const articleTopics = recentArticles?.map(a => a.title).slice(0, 10).join('\n- ') || '';

    // Build prompt for generating suggestions
    let prompt = `You are a real estate SEO content strategist. Generate ${count} high-value blog article topic suggestions for a real estate website.

Context about existing content:
- Target Keywords: ${keywordList || 'real estate, home buying, selling homes'}
- Content Categories: ${categories || 'General'}
${articleTopics ? `- Recent Articles:\n- ${articleTopics}` : ''}

${customInstructions ? `Additional Instructions: ${customInstructions}\n` : ''}

Generate article suggestions that:
1. Target high-ranking, relevant keywords that drive traffic
2. Address real pain points of homebuyers, sellers, and investors
3. Are SEO-optimized and have search demand
4. Complement (not duplicate) existing content
5. Focus on evergreen topics that remain relevant

For EACH suggestion, provide:
- Topic: A compelling article title
- Category: The content category (e.g., "Buying Guide", "Selling Tips", "Market Trends", "Investment", "General")
- Keywords: 3-5 target keywords (comma-separated, focusing on high-value SEO terms)
- Priority: 1-5 (5 = highest priority based on SEO value and relevance)

Format your response as a JSON array of objects with this structure:
[
  {
    "topic": "Article title here",
    "category": "Category name",
    "keywords": ["keyword1", "keyword2", "keyword3"],
    "priority": 4
  }
]

IMPORTANT: Return ONLY the JSON array, no additional text or explanation.`;

    console.log("Generating content suggestions...");

    // Determine provider helpers and build headers
    const isAnthropic = (modelData.provider?.toLowerCase?.() === 'anthropic') || (modelData.api_endpoint?.includes('anthropic.com'));

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (modelData.auth_type === 'x-api-key') {
      headers['x-api-key'] = apiKey;
      if (isAnthropic) headers['anthropic-version'] = '2023-06-01';
    } else {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    // Build request body based on provider
    const systemMessage = "You are an expert real estate SEO content strategist. Generate actionable, high-value content suggestions.";
    let requestBody: any;

    if (isAnthropic) {
      requestBody = {
        model: modelData.model_name,
        max_tokens: config.max_tokens_standard || 4000,
        messages: [
          { role: "user", content: prompt }
        ],
        system: systemMessage,
      };
    } else {
      requestBody = {
        model: modelData.model_name,
        messages: [
          { role: "system", content: systemMessage },
          { role: "user", content: prompt }
        ],
        temperature: config.temperature_creative || 0.7,
        max_tokens: config.max_tokens_standard || 4000,
      };
    }

    // Call AI to generate suggestions
    const aiResponse = await fetch(modelData.api_endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI generation error:", aiResponse.status, errorText);
      return new Response(
        JSON.stringify({ success: false, error: `AI generation failed: ${aiResponse.status}` }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    
    // Extract content based on provider format
    let content = '';
    if (isAnthropic) {
      content = aiData.content?.[0]?.text || '';
    } else {
      content = aiData.choices?.[0]?.message?.content || '';
    }

    // Parse JSON response
    let suggestions = [];
    try {
      // Extract JSON from response (might be wrapped in markdown code blocks)
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        suggestions = JSON.parse(jsonMatch[0]);
      } else {
        suggestions = JSON.parse(content);
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError, content);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to parse AI suggestions" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Save suggestions to database
    const insertData = suggestions.map((s: any) => ({
      topic: s.topic,
      category: s.category || 'General',
      keywords: s.keywords || [],
      priority: s.priority || 3,
      status: 'pending',
      suggested_by: null // AI-generated
    }));

    const { data: insertedSuggestions, error: insertError } = await supabase
      .from('content_suggestions')
      .insert(insertData)
      .select();

    if (insertError) {
      console.error("Error saving suggestions:", insertError);
      return new Response(
        JSON.stringify({ success: false, error: `Failed to save suggestions: ${insertError.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Generated and saved ${insertedSuggestions.length} content suggestions`);

    return new Response(
      JSON.stringify({
        success: true,
        suggestions: insertedSuggestions
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error generating suggestions:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});