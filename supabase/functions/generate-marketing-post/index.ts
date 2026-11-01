/**
 * Generate an AgentBio marketing post with Claude, save it, and optionally
 * deliver it to one of the configured social webhooks. Admin only.
 *
 * US-248: this read a webhook URL from the body before checking anyone, used
 * the service-role client, called Claude for up to 8000 tokens, looked the
 * caller up with getUser() but never refused one, then POSTed to the URL with a
 * plain unguarded fetch and returned the upstream body. Anyone could spend the Claude
 * budget and make the server reach the private network and read the answer.
 *
 * Now: requireAdmin before the body is read, a per-admin rate limit before
 * Claude is called, the webhook named by id from social_media_webhooks (which
 * only admins can write), delivery through safeFetch, and the outcome reported
 * by status alone.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import { requireAdmin } from '../_shared/auth.ts';
import { getCorsHeaders, handleCorsPreFlight } from '../_shared/cors.ts';
import { checkRateLimitDb, type RateLimitConfig } from '../_shared/rate-limiter.ts';
import {
  errorResponse,
  handleUnexpectedError,
  methodNotAllowedResponse,
  rateLimitResponse,
} from '../_shared/response.ts';
import { safeFetch } from '../_shared/ssrf-guard.ts';
import { deliveryOutcome, parseMarketingPostRequest, webhookHeaders } from './request.ts';

/**
 * Each call is a large Claude completion. Fails closed: a skipped post costs
 * nothing, a limiter that waves everything through when it cannot count is no
 * limiter.
 */
const GENERATE_LIMIT: RateLimitConfig = { maxRequests: 10, windowSeconds: 3600, failClosed: true };

const WEBHOOK_TIMEOUT_MS = 15_000;

const PROMPT = `Create a compelling social media marketing post to drive real estate agents to sign up for AgentBio - a link-in-bio platform specifically built for real estate professionals.

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

interface SocialContent {
  longForm: string;
  shortForm: string;
  hashtags: string[];
}

function parseSocialContent(text: string): SocialContent {
  let cleaned = text.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/```json\s*/g, '').replace(/```\s*$/g, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/```\s*/g, '');
  }
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('No JSON found in AI response');
  return JSON.parse(match[0]) as SocialContent;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return handleCorsPreFlight(req.headers.get('origin'));
  }
  if (req.method !== 'POST') {
    return methodNotAllowedResponse(req, ['POST']);
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    // Before the body is read: the anon key is a valid project JWT, so only an
    // admin check separates "has the public key" from "may spend Claude credit".
    const admin = await requireAdmin(req, supabase);

    const rate = await checkRateLimitDb(
      supabase,
      `generate-marketing-post:${admin.id}`,
      'generate-marketing-post',
      GENERATE_LIMIT
    );
    if (!rate.allowed) {
      return rateLimitResponse(rate.retryAfterSeconds, req, 'Too many marketing posts generated recently; try again later.');
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return errorResponse('Request body must be JSON', 'REQUEST_VALIDATION_FAILED', req, 400);
    }
    const request = parseMarketingPostRequest(body);
    if (!request.ok) {
      return errorResponse(request.error, 'REQUEST_VALIDATION_FAILED', req, 400);
    }

    // Resolve the webhook before spending anything on Claude.
    let webhook: { id: string; name: string; webhook_url: string; headers: unknown } | null = null;
    if (request.webhookId) {
      const { data, error } = await supabase
        .from('social_media_webhooks')
        .select('id, name, webhook_url, headers, is_active')
        .eq('id', request.webhookId)
        .maybeSingle();
      if (error) throw new Error(`social_media_webhooks lookup failed: ${error.message}`);
      if (!data || !data.is_active) {
        return errorResponse('Webhook not found or not active', 'RESOURCE_NOT_FOUND', req, 404);
      }
      webhook = data;
    }

    const claudeApiKey = Deno.env.get('CLAUDE_API_KEY');
    if (!claudeApiKey) {
      throw new Error('CLAUDE_API_KEY not configured');
    }

    const { data: configData } = await supabase
      .from('ai_configuration')
      .select('setting_key, setting_value')
      .in('setting_key', ['default_model', 'temperature_creative', 'max_tokens_large']);

    const config: Record<string, unknown> = {};
    configData?.forEach((item: { setting_key: string; setting_value: string }) => {
      config[item.setting_key] = JSON.parse(item.setting_value);
    });

    const aiResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': claudeApiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.default_model || 'claude-sonnet-4-5-20250929',
        max_tokens: config.max_tokens_large || 8000,
        temperature: config.temperature_creative || 0.7,
        system:
          'You are a creative social media marketing expert specializing in real estate. Generate unique, engaging content that stands out. NEVER repeat the same angles or hooks. You MUST respond ONLY with valid JSON, no markdown formatting, no code blocks, just pure JSON.',
        messages: [{ role: 'user', content: PROMPT }],
      }),
    });

    if (!aiResponse.ok) {
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const socialContent = parseSocialContent(aiData.content[0].text);

    const payload = {
      postType: 'marketing',
      purpose: 'agent_signup',
      longFormPost: socialContent.longForm,
      shortFormPost: socialContent.shortForm,
      hashtags: socialContent.hashtags,
      targetUrl: 'https://agentbio.net',
      generatedAt: new Date().toISOString(),
    };

    // Saved as a draft; marked posted only once a webhook has accepted it.
    const { data: savedPost, error: saveError } = await supabase
      .from('social_media_posts')
      .insert({
        platform_type: 'multi_platform',
        content_type: 'marketing',
        subject_type: 'agent_signup',
        post_title: 'AgentBio Marketing Post',
        post_content: payload,
        status: 'draft',
        created_by: admin.id,
      })
      .select('id')
      .single();

    if (saveError) {
      console.error('[generate-marketing-post] failed to save post:', saveError.message);
    }

    const corsHeaders = getCorsHeaders(req.headers.get('origin'));
    const json = (data: unknown) =>
      new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    if (!webhook) {
      return json({ success: true, payload, postId: savedPost?.id, message: 'Content generated successfully' });
    }

    let result: { status: number; ok: boolean } | Error;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), WEBHOOK_TIMEOUT_MS);
    try {
      const response = await safeFetch(webhook.webhook_url, {
        method: 'POST',
        headers: webhookHeaders(webhook.headers),
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      // Release the connection without reading what the target said.
      await response.body?.cancel();
      result = { status: response.status, ok: response.ok };
    } catch (error) {
      result = error instanceof Error ? error : new Error(String(error));
      console.error(`[generate-marketing-post] webhook ${webhook.id} not delivered: ${result.message}`);
    } finally {
      clearTimeout(timer);
    }

    const outcome = deliveryOutcome(result);
    if (!outcome.delivered) {
      if (outcome.status !== null) {
        console.error(`[generate-marketing-post] webhook ${webhook.id} answered ${outcome.status}`);
      }
      // 200 so the generated content is still shown; success:false so the UI says it was not sent.
      return json({ success: false, error: outcome.error, status: outcome.status, payload, postId: savedPost?.id });
    }

    if (savedPost?.id) {
      const { error: updateError } = await supabase
        .from('social_media_posts')
        .update({ status: 'posted', posted_at: new Date().toISOString(), webhook_urls: [webhook.webhook_url] })
        .eq('id', savedPost.id);
      if (updateError) {
        console.error('[generate-marketing-post] failed to mark post posted:', updateError.message);
      }
    }

    return json({
      success: true,
      payload,
      postId: savedPost?.id,
      message: `Content generated and sent to ${webhook.name}`,
    });
  } catch (error) {
    return handleUnexpectedError(error, req);
  }
});
