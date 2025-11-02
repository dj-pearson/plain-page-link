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
    const { articleId } = await req.json();
    console.log('Publishing article to social:', articleId);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch the article
    const { data: article, error: articleError } = await supabase
      .from('articles')
      .select('*')
      .eq('id', articleId)
      .single();

    if (articleError || !article) {
      throw new Error('Article not found: ' + articleError?.message);
    }

    console.log('Article fetched:', article.title);
    console.log('Article author_id:', article.author_id);

    // Fetch active webhooks
    // If article has author_id, fetch user's webhooks, otherwise fetch all active webhooks
    let webhooksQuery = supabase
      .from('article_webhooks')
      .select('*')
      .eq('is_active', true);

    // Only filter by user_id if author_id is not null
    if (article.author_id && article.author_id !== '00000000-0000-0000-0000-000000000000') {
      webhooksQuery = webhooksQuery.eq('user_id', article.author_id);
    }

    const { data: webhooks, error: webhookError } = await webhooksQuery;

    if (webhookError) {
      console.error('Error fetching webhooks:', webhookError);
    }

    console.log('Found webhooks:', webhooks?.length || 0);

    if (!webhooks || webhooks.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Article published, but no active webhooks configured' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate social media content using AI
    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log('Generating social media content...');

    const articleUrl = `https://yourdomain.com/articles/${article.slug}`;
    
    const prompt = `Create social media posts to promote this article:
Title: ${article.title}
Excerpt: ${article.excerpt || ''}
Category: ${article.category}

Generate:
1. A long-form post (200-300 words) suitable for LinkedIn and Facebook
2. A short-form post (100-150 characters) suitable for Twitter and Threads
3. 5-8 relevant hashtags

Format the response as JSON with keys: longForm, shortForm, hashtags (array)`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are a social media marketing expert. Always respond with valid JSON.' },
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const generatedContent = aiData.choices[0].message.content;
    
    console.log('Generated content:', generatedContent);

    // Parse the AI response
    let socialContent;
    try {
      // Try to extract JSON from the response
      const jsonMatch = generatedContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        socialContent = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      // Fallback content
      socialContent = {
        longForm: `Check out our latest article: "${article.title}"\n\n${article.excerpt || ''}\n\nRead more: ${articleUrl}`,
        shortForm: `New article: "${article.title}" ${articleUrl}`,
        hashtags: ['realestate', 'property', 'homes']
      };
    }

    // Send to all active webhooks
    const webhookResults = await Promise.allSettled(
      webhooks.map(async (webhook) => {
        const payload = {
          articleTitle: article.title,
          articleUrl: articleUrl,
          longFormPost: socialContent.longForm,
          shortFormPost: socialContent.shortForm,
          hashtags: socialContent.hashtags,
          category: article.category,
          publishedAt: article.published_at,
        };

        console.log(`Sending to webhook: ${webhook.name}`);

        const response = await fetch(webhook.webhook_url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Webhook ${webhook.name} failed:`, response.status, errorText);
          throw new Error(`Webhook failed: ${response.status}`);
        }

        console.log(`Webhook ${webhook.name} succeeded`);
        return { webhook: webhook.name, success: true };
      })
    );

    const results = webhookResults.map((result, index) => ({
      webhook: webhooks[index].name,
      success: result.status === 'fulfilled',
      error: result.status === 'rejected' ? String(result.reason) : undefined,
    }));

    console.log('Webhook results:', results);

    return new Response(
      JSON.stringify({
        success: true,
        socialContent,
        webhookResults: results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in publish-article-to-social:', error);
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
