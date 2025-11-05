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
    let prompt = `You are a real estate marketing content strategist writing for licensed real estate agents and AgentBio.net.

Context about existing content:
- Target Keywords: ${keywordList || 'real estate link in bio, agent bio page, real estate Instagram marketing'}
- Content Categories: ${categories || 'Agent Marketing'}
${articleTopics ? `- Recent Articles:\n- ${articleTopics}` : ''}

${customInstructions ? `Additional Instructions: ${customInstructions}\n` : ''}

Generate ${count} article topic suggestions that:

TARGET AUDIENCE:
- Solo real estate agents (2-15 years experience, $50K-150K income)
- Active on Instagram, Facebook, TikTok
- Managing own marketing on limited budget
- Need quick, mobile-first solutions

CONTENT OBJECTIVES:
- Educate agents on marketing tactics and lead generation
- Position mobile-optimized link-in-bio profiles (AgentBio.net) as solutions
- Drive agents to create professional bio pages
- Focus on: lead generation, social media conversion, portfolio showcase

ARTICLE THEMES (prioritize these):
✓ Converting social followers to qualified leads
✓ Mobile-first real estate marketing (80% of traffic is mobile)
✓ Professional portfolio showcase importance
✓ Instagram/TikTok/Facebook marketing for agents
✓ Budget-friendly alternatives to expensive websites
✓ Quick listing updates and client communication
✓ Building credibility and trust online

PAIN POINTS TO ADDRESS:
- Losing leads from social media handoffs
- Can't afford $5K+ websites
- Need fast, mobile-optimized solutions
- Want to look professional without huge budgets
- Struggle to convert social followers to clients
- Need centralized place for all listings/links

KEYWORDS TO TARGET (use variations):
real estate link in bio, agent bio page, real estate Instagram marketing, property showcase, 
listing portfolio, real estate lead generation, agent profile page, real estate social media, 
mobile real estate marketing, agent branding, real estate landing page

EXAMPLE TOPICS (for inspiration - create NEW ones):
- "How to Turn Instagram Story Views Into Buyer Consultations"
- "5 Things Every Real Estate Agent Bio Should Include (That Most Don't)"
- "Why Your $5K Website Isn't Getting You Listings (And What Will)"
- "The 10-Minute Lead Generation System for Busy Agents"
- "How Top Producers Showcase Sold Listings to Win More Sellers"
- "Instagram Bio Link Mistakes Costing You Leads"
- "The Mobile-First Marketing System for Solo Agents"

AVOID:
✗ Generic business advice not specific to real estate agents
✗ Topics about traditional tactics (newspaper ads, cold calling)
✗ Content for homebuyers/sellers (focus on AGENTS as audience)
✗ Overly technical jargon

For EACH suggestion, provide:
- Topic: Compelling, specific article title addressing agent pain points
- Category: "Agent Marketing", "Social Media", "Lead Generation", "Branding", "Tools & Tech", or "Portfolio Management"
- Keywords: 3-5 target keywords focusing on agent marketing and bio link optimization
- Priority: 1-5 (5 = highest priority for driving agents to AgentBio.net)

Format your response as a JSON array:
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