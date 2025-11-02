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
    const { topic, category, keywords, customInstructions, autoSelectKeyword = true } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing required environment variables");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Auto-select unused keyword if no topic provided
    let selectedTopic = topic;
    let selectedKeywordId = null;
    let selectedKeywords = keywords || [];

    if (!selectedTopic && autoSelectKeyword) {
      // Find unused or least-used keyword, prioritizing never-used keywords
      const { data: unusedKeywords, error: keywordError } = await supabase
        .from('keywords')
        .select('id, keyword, category')
        .eq('is_active', true)
        .order('usage_count', { ascending: true })
        .order('last_used_at', { ascending: true, nullsFirst: true })
        .limit(1);

      if (keywordError) {
        console.error('Error fetching keyword:', keywordError);
      } else if (unusedKeywords && unusedKeywords.length > 0) {
        const selectedKeyword = unusedKeywords[0];
        selectedTopic = selectedKeyword.keyword;
        selectedKeywordId = selectedKeyword.id;
        selectedKeywords = [selectedKeyword.keyword];
        console.log('Auto-selected keyword:', selectedKeyword.keyword);
      }
    }

    if (!selectedTopic) {
      // Fallback to a sensible default so auto-select still works without seeded keywords
      selectedTopic = "Professional real estate agent portfolio link";
      selectedKeywords = [selectedTopic];
      console.log("No keywords found; using fallback topic");
    }

    // Get AI configuration
    const { data: configData } = await supabase
      .from('ai_configuration')
      .select('setting_key, setting_value')
      .in('setting_key', ['default_model', 'temperature_creative', 'max_tokens_large']);
    
    const config: Record<string, any> = {};
    configData?.forEach(item => {
      config[item.setting_key] = JSON.parse(item.setting_value);
    });

    // Get the selected model's details from ai_models table
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

    console.log("Generating article:", { topic: selectedTopic, category });

    // Build prompt for article generation
    let prompt = `Write a comprehensive, SEO-optimized blog article about: ${selectedTopic}`;

    if (category) {
      prompt += `\n\nCategory: ${category}`;
    }

    if (selectedKeywords && selectedKeywords.length > 0) {
      prompt += `\n\nTarget Keywords: ${selectedKeywords.join(', ')}`;
      prompt += `\n\nIMPORTANT: Focus the article specifically on the keyword "${selectedKeywords[0]}" and naturally incorporate related keywords throughout the content.`;
    }
    
    if (customInstructions) {
      prompt += `\n\nAdditional Instructions: ${customInstructions}`;
    }

    prompt += `\n\nRequirements:
- Write in Markdown format
- Include an engaging title (use # heading)
- Write 1000-1500 words
- Include subheadings (use ## and ### headings)
- Add a compelling introduction and conclusion
- Use bullet points or numbered lists where appropriate
- Make it SEO-friendly and easy to read
- Target audience: homebuyers, sellers, and real estate investors
- Tone: Professional yet approachable`;

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
    const systemMessage = "You are an expert real estate content writer and SEO specialist. Create high-quality, informative articles that provide value to readers.";
    let requestBody: any;

    if (isAnthropic) {
      requestBody = {
        model: modelData.model_name,
        max_tokens: config.max_tokens_large || 8000,
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
        max_tokens: config.max_tokens_large || 8000,
      };
    }

    // Call AI to generate article
    const aiResponse = await fetch(modelData.api_endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI generation error:", aiResponse.status, errorText);
      let friendly = "AI gateway error";
      const status = aiResponse.status;
      if (status === 402) {
        friendly = "Payment required, please add Lovable AI credits.";
      } else if (status === 429) {
        friendly = "Rate limit exceeded, please try again shortly.";
      } else if (status === 400) {
        friendly = "Invalid AI request. Please try a simpler topic or fewer instructions.";
      }
      return new Response(
        JSON.stringify({ success: false, error: `${friendly}: ${status}` }),
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

    // Extract title from content (first # heading)
    const titleMatch = content.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1] : selectedTopic;

    // Generate slug from title
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    // Extract excerpt (first paragraph after title)
    const excerptMatch = content.match(/^#.+?\n\n(.+?)(?:\n\n|$)/s);
    const excerpt = excerptMatch ? excerptMatch[1].substring(0, 200) + '...' : '';

    // Generate SEO title and description
    const seoTitle = title.length > 60 ? title.substring(0, 57) + '...' : title;
    const seoDescription = excerpt.length > 160 ? excerpt.substring(0, 157) + '...' : excerpt;

    // Save article to database and auto-publish
    const { data: insertedArticle, error: insertError } = await supabase
      .from('articles')
      .insert({
        title,
        slug,
        content,
        excerpt,
        seo_title: seoTitle,
        seo_description: seoDescription,
        seo_keywords: selectedKeywords,
        category: category || 'General',
        tags: selectedKeywords || [],
        keyword_id: selectedKeywordId,
        status: 'published',
        published_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error saving article:", insertError);
      return new Response(
        JSON.stringify({ success: false, error: `Failed to save article: ${insertError.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Article generated and saved successfully");

    return new Response(
      JSON.stringify({
        success: true,
        article: insertedArticle
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error generating article:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
