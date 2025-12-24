import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { getCorsHeaders } from '../_shared/cors.ts';
import { requireAuth } from '../_shared/auth.ts';

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get('origin'));
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

    // Securely authenticate user with JWT verification
    let userId = null;
    try {
      const user = await requireAuth(req, supabase);
      userId = user.id;
      console.log('User ID from JWT:', userId);
    } catch (e) {
      console.error('Failed to authenticate user:', e);
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
        console.log('Auto-selected queued suggestion:', suggestion.topic);

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
          console.error('Error fetching keyword:', keywordError);
        } else if (unusedKeywords && unusedKeywords.length > 0) {
          const selectedKeyword = unusedKeywords[0];
          selectedTopic = selectedKeyword.keyword;
          selectedKeywordId = selectedKeyword.id;
          selectedKeywords = [selectedKeyword.keyword];
          console.log('Auto-selected keyword:', selectedKeyword.keyword);
        } else {
          // PRIORITY 3: No keywords or suggestions, generate AI suggestion on-the-fly
          console.log('No queued suggestions or keywords, generating AI suggestion...');
          
          const suggestResponse = await supabase.functions.invoke('generate-content-suggestions', {
            body: { count: 1 }
          });

          if (!suggestResponse.error && suggestResponse.data?.suggestions?.[0]) {
            const aiSuggestion = suggestResponse.data.suggestions[0];
            selectedTopic = aiSuggestion.topic;
            selectedKeywords = aiSuggestion.keywords || [];
            selectedSuggestionId = aiSuggestion.id;
            articleCategory = articleCategory || aiSuggestion.category;
            console.log('Generated AI suggestion:', aiSuggestion.topic);

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
      console.log("No content sources found; using fallback topic");
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
      console.error("Error saving article:", insertError);
      return new Response(
        JSON.stringify({ success: false, error: `Failed to save article: ${insertError.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Article generated and saved successfully");

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

    // Trigger social media post generation and webhook distribution
    try {
      console.log('Triggering social media post generation...');
      const socialResponse = await supabase.functions.invoke('publish-article-to-social', {
        body: { articleId: insertedArticle.id }
      });

      if (socialResponse.error) {
        console.error('Error triggering social post:', socialResponse.error);
      } else {
        console.log('Social post triggered successfully:', socialResponse.data);
      }
    } catch (socialError) {
      console.error('Failed to trigger social post:', socialError);
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
