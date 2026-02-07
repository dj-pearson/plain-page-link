import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from '../_shared/cors.ts';

export default async (req: Request) => {
  console.log('[publish-article-to-social] Function invoked');
  
  const corsHeaders = getCorsHeaders(req.headers.get('origin'));
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const bodyText = await req.text();
    console.log('[publish-article-to-social] Request body:', bodyText);
    
    const { articleId } = JSON.parse(bodyText || '{}');
    console.log('[publish-article-to-social] Publishing article to social:', articleId);
    
    if (!articleId) {
      throw new Error('articleId is required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const claudeApiKey = Deno.env.get('CLAUDE_API_KEY');

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      }
    });

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
    if (!claudeApiKey) {
      throw new Error('CLAUDE_API_KEY not configured');
    }

    console.log('Generating social media content...');

    const siteUrl = Deno.env.get('SITE_URL') || Deno.env.get('APP_URL') || 'https://agentbio.net';
    const articleUrl = `${siteUrl}/blog/${article.slug}`;
    
    const prompt = `Create social media posts to promote this article:
Title: ${article.title}
Excerpt: ${article.excerpt || ''}
Category: ${article.category}

Generate:
1. A long-form post (200-300 words) suitable for LinkedIn and Facebook
2. A short-form post (100-150 characters) suitable for Twitter and Threads
3. 5-8 relevant hashtags

Return ONLY valid JSON with this exact structure:
{
  "longForm": "your long post here",
  "shortForm": "your short post here",
  "hashtags": ["hashtag1", "hashtag2", ...]
}`;

    const aiResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': claudeApiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 1024,
        system: 'You are a social media marketing expert. You MUST respond ONLY with valid JSON, no markdown formatting, no code blocks, just pure JSON.',
        messages: [
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const generatedContent = (aiData.content as Array<{ text?: string }>)?.[0]?.text || '';
    
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
      console.error('Raw content was:', generatedContent);
      // Fallback content
      socialContent = {
        longForm: `🏡 Check out our latest article: "${article.title}"\n\n${article.excerpt || ''}\n\nRead more: ${articleUrl}\n\n#RealEstate #Property #Homes`,
        shortForm: `📰 New article: "${article.title}" ${articleUrl}`,
        hashtags: ['RealEstate', 'Property', 'Homes', 'RealEstateAgent']
      };
      console.log('Using fallback content:', JSON.stringify(socialContent, null, 2));
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
    console.error('[publish-article-to-social] Error:', error);
    console.error('[publish-article-to-social] Error stack:', error instanceof Error ? error.stack : 'No stack');
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
};
