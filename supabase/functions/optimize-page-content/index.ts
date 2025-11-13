import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts";
import { getCorsHeaders } from '../_shared/cors.ts';
import { getErrorMessage } from '../_shared/errorHelpers.ts';

/**
 * Optimize Page Content with AI
 * Uses AI to provide actionable content optimization suggestions
 */

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get('origin'));

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, content: providedContent, targetKeyword, saveResults = true } = await req.json();

    if (!url && !providedContent) {
      return new Response(
        JSON.stringify({ error: 'Either URL or content is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Optimizing content for: ${url || 'provided content'}`);

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    const authHeader = req.headers.get('authorization');
    let userId = null;
    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const payload = JSON.parse(atob(token.split('.')[1]));
        userId = payload.sub;
      } catch (e) {
        console.error('Failed to decode JWT:', e);
      }
    }

    // Fetch content if URL provided
    let html = providedContent || '';
    let pageTitle = '';
    let metaDescription = '';

    if (url) {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch URL: ${response.status}`);
      }
      html = await response.text();
    }

    // Parse HTML
    const doc = new DOMParser().parseFromString(html, 'text/html');
    if (!doc) {
      throw new Error('Failed to parse HTML');
    }

    const titleElement = doc.querySelector('title');
    pageTitle = titleElement?.textContent || '';

    const metaDesc = doc.querySelector('meta[name="description"]');
    metaDescription = metaDesc?.getAttribute('content') || '';

    // Extract content
    const elementsToRemove = ['script', 'style', 'nav', 'footer', 'header'];
    elementsToRemove.forEach(tag => {
      doc.querySelectorAll(tag).forEach(el => el.remove());
    });

    const bodyText = doc.querySelector('body')?.textContent || '';
    const cleanText = bodyText.replace(/\s+/g, ' ').trim();

    // Get AI configuration (model to use)
    const { data: aiConfig } = await supabase
      .from('ai_models')
      .select('*')
      .eq('is_active', true)
      .eq('model_type', 'content_generation')
      .limit(1)
      .maybeSingle();

    if (!aiConfig) {
      return new Response(
        JSON.stringify({
          error: 'No AI model configured',
          message: 'Please configure an AI model in the admin panel'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prepare prompt for AI
    const prompt = `You are an SEO content optimization expert. Analyze the following content and provide actionable suggestions to improve its SEO performance.

Page Title: ${pageTitle}
Meta Description: ${metaDescription}
Target Keyword: ${targetKeyword || 'Not specified'}

Content (first 2000 characters):
${cleanText.substring(0, 2000)}

Provide optimization suggestions in the following categories:
1. Title Tag Optimization (1-2 suggestions)
2. Meta Description Optimization (1-2 suggestions)
3. Content Structure Improvements (2-3 suggestions)
4. Keyword Usage (2-3 suggestions)
5. Readability Improvements (1-2 suggestions)
6. Additional SEO Opportunities (1-2 suggestions)

Format your response as JSON with this structure:
{
  "titleOptimization": ["suggestion 1", "suggestion 2"],
  "metaDescriptionOptimization": ["suggestion 1", "suggestion 2"],
  "contentStructure": ["suggestion 1", "suggestion 2", "suggestion 3"],
  "keywordUsage": ["suggestion 1", "suggestion 2", "suggestion 3"],
  "readability": ["suggestion 1", "suggestion 2"],
  "additionalOpportunities": ["suggestion 1", "suggestion 2"],
  "overallScore": 75,
  "priorityActions": ["top priority 1", "top priority 2", "top priority 3"]
}`;

    // Call AI API (OpenAI or Anthropic)
    const API_KEY = Deno.env.get(aiConfig.api_key_id || "OPENAI_API_KEY");
    if (!API_KEY) {
      throw new Error('AI API key not configured');
    }

    let aiResponse;
    if (aiConfig.provider === 'openai') {
      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: aiConfig.name || 'gpt-4-turbo-preview',
          messages: [
            { role: 'system', content: 'You are an SEO expert providing content optimization suggestions. Always respond with valid JSON.' },
            { role: 'user', content: prompt }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.7,
          max_tokens: 1500,
        }),
      });

      if (!openaiResponse.ok) {
        const errorText = await openaiResponse.text();
        throw new Error(`OpenAI API error: ${errorText}`);
      }

      const openaiData = await openaiResponse.json();
      const content = openaiData.choices[0].message.content;
      aiResponse = JSON.parse(content);
    } else if (aiConfig.provider === 'anthropic') {
      const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': API_KEY,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: aiConfig.name || 'claude-3-sonnet-20240229',
          max_tokens: 1500,
          messages: [{
            role: 'user',
            content: prompt + '\n\nRespond with valid JSON only, no other text.'
          }],
        }),
      });

      if (!anthropicResponse.ok) {
        const errorText = await anthropicResponse.text();
        throw new Error(`Anthropic API error: ${errorText}`);
      }

      const anthropicData = await anthropicResponse.json();
      const content = anthropicData.content[0].text;
      // Extract JSON from response (might be wrapped in markdown code blocks)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        aiResponse = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Failed to parse AI response as JSON');
      }
    } else {
      throw new Error(`Unsupported AI provider: ${aiConfig.provider}`);
    }

    const result = {
      url,
      pageTitle,
      metaDescription,
      targetKeyword,
      suggestions: aiResponse,
    };

    // Save to database
    if (saveResults && userId) {
      const { error: insertError } = await supabase
        .from('seo_content_optimization')
        .insert({
          url,
          keyword: targetKeyword,
          title: pageTitle,
          meta_description: metaDescription,
          ai_suggestions: aiResponse,
          overall_score: aiResponse.overallScore || 0,
          analyzed_by: userId,
        });

      if (insertError) {
        console.error('Error saving optimization results:', insertError);
      }
    }

    return new Response(
      JSON.stringify({ success: true, result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error optimizing content:', error);
    return new Response(
      JSON.stringify({ error: getErrorMessage(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
