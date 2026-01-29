import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { getCorsHeaders } from '../_shared/cors.ts';
import { getAuthenticatedUser } from '../_shared/service-auth.ts';

// Timeout constants
const AI_API_TIMEOUT_MS = 120000; // 2 minutes for AI generation
const FUNCTION_INVOKE_TIMEOUT_MS = 30000; // 30 seconds for cascading functions

/**
 * Fetch with timeout using AbortController
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Invoke a Supabase function with timeout
 */
async function invokeFunctionWithTimeout(
  supabase: ReturnType<typeof createClient>,
  functionName: string,
  body: Record<string, unknown>,
  timeoutMs: number
): Promise<{ data: unknown; error: Error | null }> {
  return Promise.race([
    supabase.functions.invoke(functionName, { body }),
    new Promise<{ data: null; error: Error }>((_, reject) =>
      setTimeout(() => reject(new Error(`Function ${functionName} timed out after ${timeoutMs}ms`)), timeoutMs)
    ).catch(error => ({ data: null, error }))
  ]);
}

serve(async (req) => {
  console.log(`[generate-article] Request received: ${req.method} from ${req.headers.get('origin') || 'no-origin'}`);

  const corsHeaders = getCorsHeaders(req.headers.get('origin'));
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body with error handling
    let requestBody: Record<string, unknown>;
    try {
      const bodyText = await req.text();
      console.log(`[generate-article] Request body length: ${bodyText.length} chars`);
      requestBody = bodyText ? JSON.parse(bodyText) : {};
    } catch (parseError) {
      console.error('[generate-article] Failed to parse request body:', parseError);
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid JSON in request body' }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { topic, category, keywords, customInstructions, autoSelectKeyword = true } = requestBody;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    // Detailed environment variable validation for debugging
    const missingEnvVars: string[] = [];
    if (!LOVABLE_API_KEY) missingEnvVars.push('LOVABLE_API_KEY');
    if (!SUPABASE_URL) missingEnvVars.push('SUPABASE_URL');
    if (!SUPABASE_SERVICE_ROLE_KEY) missingEnvVars.push('SUPABASE_SERVICE_ROLE_KEY');

    if (missingEnvVars.length > 0) {
      console.error(`[generate-article] Missing environment variables: ${missingEnvVars.join(', ')}`);
      return new Response(
        JSON.stringify({ success: false, error: `Missing required environment variables: ${missingEnvVars.join(', ')}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[generate-article] Environment validated. SUPABASE_URL: ${SUPABASE_URL}`);

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Authenticate: Accept service role key (for Make.com) or JWT (for web app)
    let userId = null;
    try {
      userId = await getAuthenticatedUser(req, supabase);
      
      if (userId) {
        console.log('[generate-article] User authenticated with ID:', userId);
      } else {
        console.log('[generate-article] Authenticated via service role key (no user ID)');
      }
    } catch (e) {
      console.warn('[generate-article] Auth check failed (proceeding without user):', e instanceof Error ? e.message : e);
    }

    // Priority order: 1) Queued suggestions, 2) Unused keywords, 3) AI suggestions
    let selectedTopic = topic;
    let selectedKeywordId = null;
    let selectedKeywords = keywords || [];
    let selectedSuggestionId = null;
    let articleCategory = category;

    if (!selectedTopic && autoSelectKeyword) {
      // PRIORITY 1: Check for queued content suggestions
      const { data: queuedSuggestions, error: suggestionError } = await supabase
        .from('content_suggestions')
        .select('id, topic, category, keywords')
        .eq('status', 'queued')
        .order('priority', { ascending: false })
        .limit(1);

      if (!suggestionError && queuedSuggestions && queuedSuggestions.length > 0) {
        const suggestion = queuedSuggestions[0];
        selectedTopic = suggestion.topic;
        selectedKeywords = suggestion.keywords || [];
        selectedSuggestionId = suggestion.id;
        articleCategory = articleCategory || suggestion.category;
        console.log('[generate-article] Auto-selected queued suggestion:', suggestion.topic);

        // Mark suggestion as in progress
        await supabase
          .from('content_suggestions')
          .update({ status: 'in_progress' })
          .eq('id', suggestion.id);
      } else {
        // PRIORITY 2: Find unused or least-used keyword
        const { data: unusedKeywords, error: keywordError } = await supabase
          .from('keywords')
          .select('id, keyword, category')
          .eq('is_active', true)
          .order('usage_count', { ascending: true })
          .order('last_used_at', { ascending: true, nullsFirst: true })
          .limit(1);

        if (keywordError) {
          console.error('[generate-article] Error fetching keyword:', keywordError);
        } else if (unusedKeywords && unusedKeywords.length > 0) {
          const selectedKeyword = unusedKeywords[0];
          selectedTopic = selectedKeyword.keyword;
          selectedKeywordId = selectedKeyword.id;
          selectedKeywords = [selectedKeyword.keyword];
          console.log('[generate-article] Auto-selected keyword:', selectedKeyword.keyword);
        } else {
          // PRIORITY 3: No keywords or suggestions, generate AI suggestion on-the-fly
          console.log('[generate-article] No queued suggestions or keywords, generating AI suggestion...');

          const suggestResponse = await invokeFunctionWithTimeout(
            supabase,
            'generate-content-suggestions',
            { count: 1 },
            FUNCTION_INVOKE_TIMEOUT_MS
          );

          const suggestData = suggestResponse.data as { suggestions?: Array<{ topic: string; keywords?: string[]; id: string; category?: string }> } | null;
          if (!suggestResponse.error && suggestData?.suggestions?.[0]) {
            const aiSuggestion = suggestData.suggestions[0];
            selectedTopic = aiSuggestion.topic;
            selectedKeywords = aiSuggestion.keywords || [];
            selectedSuggestionId = aiSuggestion.id;
            articleCategory = articleCategory || aiSuggestion.category;
            console.log('[generate-article] Generated AI suggestion:', aiSuggestion.topic);

            // Mark as in progress
            await supabase
              .from('content_suggestions')
              .update({ status: 'in_progress' })
              .eq('id', aiSuggestion.id);
          }
        }
      }
    }

    if (!selectedTopic) {
      // Final fallback
      selectedTopic = "Professional real estate agent portfolio link";
      selectedKeywords = [selectedTopic];
      console.log("[generate-article] No content sources found; using fallback topic");
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
      console.error('[generate-article] Model not found:', defaultModelId, modelError);
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

    console.log("[generate-article] Generating article:", { topic: selectedTopic, category: articleCategory });

    // Build prompt for article generation
    let prompt = `Write a comprehensive, SEO-optimized blog article about: ${selectedTopic}`;

    if (articleCategory) {
      prompt += `\n\nCategory: ${articleCategory}`;
    }

    if (selectedKeywords && selectedKeywords.length > 0) {
      prompt += `\n\nTarget Keywords: ${selectedKeywords.join(', ')}`;
      prompt += `\n\nIMPORTANT: Focus the article specifically on the keyword "${selectedKeywords[0]}" and naturally incorporate related keywords throughout the content.`;
    }
    
    if (customInstructions) {
      prompt += `\n\nAdditional Instructions: ${customInstructions}`;
    }

    prompt += `\n\nYou are a real estate marketing content strategist writing for licensed real estate agents.

PRIMARY OBJECTIVES:
- Educate real estate agents on practical marketing tactics
- Position mobile-optimized link-in-bio profiles (AgentBio.net) as the solution
- Drive traffic to agents' bio pages and encourage profile creation
- Focus on lead generation, social media conversion, and portfolio showcase

TARGET AUDIENCE:
- Solo agents (2-15 years experience, $50K-150K income)
- Active on Instagram, Facebook, TikTok
- Managing own marketing on limited budget
- Need quick, mobile-first solutions

ARTICLE STRUCTURE:
- 1,200-1,800 words total
- Write in Markdown format with # for title, ## and ### for sections
- Hook: Start with a relatable pain point agents face (e.g., "losing leads from Instagram", "can't afford $5K website")
- Educational Value: Provide 3-5 actionable tactics/insights about the topic
- Natural Integration: Reference how a professional bio link solves problems (WITHOUT being overly promotional)
- Call-to-Action: End with specific next steps that benefit from a link-in-bio tool

CONTENT REQUIREMENTS:
- Conversational, practical tone (avoid jargon)
- Use specific examples (e.g., "when a buyer texts asking about the 3BR listing")
- Short paragraphs (2-4 sentences)
- Bullet points for scanability
- Bold key phrases for emphasis
- Section headers that answer questions agents google
- End with "Next Steps" action list (2-3 bullets)

KEY THEMES TO WEAVE IN:
✓ Mobile-first marketing (80% of traffic is mobile)
✓ Converting social followers to qualified leads
✓ Portfolio showcase importance
✓ Speed of updates vs. traditional websites
✓ Consolidating multiple tools into one profile
✓ Professional credibility markers
✓ Budget-friendly solutions for solo agents

TONE EXAMPLES:
✓ "Most agents lose leads at the handoff between Instagram and their website..."
✓ "Here's what top producers do differently with their bio links..."
✓ "You don't need a $10K website to look professional—you need the right setup..."

AVOID:
✗ Generic advice that applies to any business
✗ Heavy product pitching (let value speak for itself)
✗ Outdated tactics (newspaper ads, cold calling focus)
✗ Overuse of "game-changer," "revolutionary" hype language
✗ Writing for homebuyers/sellers (focus on AGENTS as the audience)

SEO KEYWORDS TO NATURALLY INCLUDE:
real estate link in bio, agent bio page, real estate Instagram marketing, 
property showcase, listing portfolio, real estate lead generation, agent profile,
mobile real estate marketing`;

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
    const systemMessage = "You are an expert real estate marketing content writer specializing in agent education and lead generation strategies. Write practical, actionable content that helps real estate agents grow their business through modern digital marketing tactics.";
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

    // Call AI to generate article with timeout
    console.log(`[generate-article] Calling AI API: ${modelData.api_endpoint}`);
    let aiResponse: Response;
    try {
      aiResponse = await fetchWithTimeout(
        modelData.api_endpoint,
        {
          method: "POST",
          headers,
          body: JSON.stringify(requestBody),
        },
        AI_API_TIMEOUT_MS
      );
    } catch (fetchError) {
      const errorMessage = fetchError instanceof Error ? fetchError.message : 'Unknown fetch error';
      console.error('[generate-article] AI API fetch failed:', errorMessage);

      // Check if it was a timeout (AbortError)
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        return new Response(
          JSON.stringify({ success: false, error: 'AI service timed out. Please try again.' }),
          { status: 504, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: false, error: `AI service unavailable: ${errorMessage}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("[generate-article] AI generation error:", aiResponse.status, errorText);
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

    let aiData: Record<string, unknown>;
    try {
      aiData = await aiResponse.json();
    } catch (jsonError) {
      console.error('[generate-article] Failed to parse AI response as JSON:', jsonError);
      return new Response(
        JSON.stringify({ success: false, error: 'AI service returned invalid response format' }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract content based on provider format
    let content = '';
    if (isAnthropic) {
      content = (aiData.content as Array<{ text?: string }>)?.[0]?.text || '';
    } else {
      content = (aiData.choices as Array<{ message?: { content?: string } }>)?.[0]?.message?.content || '';
    }

    // Validate that content was actually generated
    if (!content || content.trim().length < 100) {
      console.error('[generate-article] AI returned empty or too short content:', content?.length || 0);
      return new Response(
        JSON.stringify({ success: false, error: 'AI service returned insufficient content. Please try again.' }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[generate-article] AI returned ${content.length} chars of content`);

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
        category: articleCategory || 'General',
        tags: selectedKeywords || [],
        keyword_id: selectedKeywordId,
        generated_from_suggestion_id: selectedSuggestionId,
        author_id: userId,
        status: 'published',
        published_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      console.error("[generate-article] Error saving article:", insertError);
      return new Response(
        JSON.stringify({ success: false, error: `Failed to save article: ${insertError.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[generate-article] Article generated and saved successfully");

    // Update suggestion status if article was generated from a suggestion
    if (selectedSuggestionId) {
      await supabase
        .from('content_suggestions')
        .update({ 
          status: 'completed',
          generated_article_id: insertedArticle.id
        })
        .eq('id', selectedSuggestionId);
    }

    // Trigger social media post generation and webhook distribution (with timeout)
    try {
      console.log('[generate-article] Triggering social media post generation...');
      const socialResponse = await invokeFunctionWithTimeout(
        supabase,
        'publish-article-to-social',
        { articleId: insertedArticle.id },
        FUNCTION_INVOKE_TIMEOUT_MS
      );

      if (socialResponse.error) {
        console.error('[generate-article] Error triggering social post:', socialResponse.error);
      } else {
        console.log('[generate-article] Social post triggered successfully:', socialResponse.data);
      }
    } catch (socialError) {
      console.error('[generate-article] Failed to trigger social post (may have timed out):', socialError);
      // Don't fail the article generation if social posting fails
    }

    return new Response(
      JSON.stringify({
        success: true,
        article: insertedArticle
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[generate-article] Error generating article:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
