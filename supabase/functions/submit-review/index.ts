import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import { getCorsHeaders } from '../_shared/cors.ts';
import { checkRateLimitDb, RATE_LIMITS } from '../_shared/rate-limiter.ts';
import { validateReviewData, sanitizeString, getClientIP } from '../_shared/validation.ts';
import { getAgentContact } from '../_shared/agent-contact.ts';
import { sendEmail, createTestimonialNotificationEmail } from '../_shared/email.ts';
import {
  successResponse,
  validationError,
  errorResponse,
  rateLimitResponse,
  methodNotAllowedResponse,
  handleUnexpectedError,
} from '../_shared/response.ts';

/**
 * Submit Review (US-113)
 *
 * The public review page at /:username/review inserted straight into
 * `testimonials` as anon. That worked — 20260808000004 added the policy — but
 * two of the page's promises had nothing behind them: the required email
 * "for verification only" that no column stores and nothing verifies, and the
 * success screen's "{agent} will be notified", when the only trigger on the
 * table is track_testimonials_usage.
 *
 * This is the submit-lead shape applied to reviews: rate limited, validated,
 * inserted with the service role, and followed by an actual notification. The
 * anon INSERT policy stays in place as the backstop for the direct path.
 *
 * The client's email is not collected at all. Storing an unverified address
 * that nothing reads is the worst of both options, and the notification goes
 * to the agent's own account address, which does not need it.
 */

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get('origin'));

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return methodNotAllowedResponse(req);
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const raw = await req.json().catch(() => null);
    if (!raw || typeof raw !== 'object') {
      return validationError(['A JSON body is required'], req);
    }

    // Same bucketing as submit-lead: by IP where we have one, otherwise by the
    // agent being reviewed, so requests without an IP do not collapse into a
    // single global bucket that unrelated profiles' visitors would exhaust.
    const clientIP = getClientIP(req);
    const rateIdentifier = clientIP !== 'unknown' ? clientIP : `target:${raw.user_id ?? 'anon'}`;
    const rateLimit = await checkRateLimitDb(
      supabase,
      rateIdentifier,
      'submit-review',
      RATE_LIMITS.submission
    );
    if (!rateLimit.allowed) {
      return rateLimitResponse(
        rateLimit.retryAfterSeconds,
        req,
        'Too many review submissions. Please try again in a minute.'
      );
    }

    const validation = validateReviewData(raw);
    if (!validation.valid) {
      return validationError(validation.errors, req);
    }

    // The service role bypasses RLS, so the "profile must be published" half of
    // the INSERT policy has to be re-checked here rather than assumed.
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, is_published')
      .eq('id', raw.user_id)
      .maybeSingle();

    if (profileError) {
      console.error(`[submit-review] profile lookup failed: ${profileError.message}`);
      return errorResponse('Could not verify the agent profile', 'PROFILE_LOOKUP_FAILED', req, 502);
    }
    if (!profile || profile.is_published !== true) {
      // Same answer for "no such agent" and "not published": a review form must
      // not be usable to probe which accounts exist.
      return errorResponse('This agent is not accepting reviews', 'PROFILE_NOT_AVAILABLE', req, 404);
    }

    const clientName = sanitizeString(String(raw.client_name));
    const review = sanitizeString(String(raw.review));
    const clientTitle = raw.client_title ? sanitizeString(String(raw.client_title)) : null;
    const propertyType = raw.property_type ? sanitizeString(String(raw.property_type)) : null;
    const transactionType = (raw.transaction_type as string | undefined) ?? 'buyer';

    // sanitizeString strips markup, so a review that was nothing but markup is
    // empty by the time it would be stored. Re-check rather than insert a blank.
    if (!clientName || !review) {
      return validationError(['Name and review must contain readable text'], req);
    }

    const { data: inserted, error: insertError } = await supabase
      .from('testimonials')
      .insert({
        user_id: profile.id,
        client_name: clientName,
        client_title: clientTitle,
        rating: raw.rating,
        review,
        property_type: propertyType,
        transaction_type: transactionType,
        date: new Date().toISOString(),
        // Explicit, not left to the column default: a review submitted by a
        // stranger is never published without the agent seeing it.
        is_published: false,
      })
      .select('id')
      .single();

    if (insertError) {
      console.error(`[submit-review] insert failed: ${insertError.message}`);
      return errorResponse('The review could not be saved', 'REVIEW_INSERT_FAILED', req, 502);
    }

    // Notification is best-effort: a review that was stored must not be
    // reported as a failure because the email provider was down. The response
    // says whether the agent was actually told.
    let notified = false;
    const contact = await getAgentContact(supabase, profile.id);
    if (!contact?.email) {
      console.error(`[submit-review] no account email for agent ${profile.id}; review ${inserted.id} stored unnotified`);
    } else {
      const siteUrl = Deno.env.get('SITE_URL') || 'https://agentbio.net';
      const sent = await sendEmail(
        createTestimonialNotificationEmail({
          agentEmail: contact.email,
          clientName,
          clientTitle,
          rating: raw.rating,
          review,
          transactionType,
          propertyType,
          dashboardUrl: `${siteUrl}/dashboard/testimonials`,
        })
      );
      notified = sent.ok;
      if (!sent.ok) {
        console.error(`[submit-review] notification for ${inserted.id} failed: ${sent.error}`);
      }

      await supabase
        .rpc('log_audit_event', {
          p_user_id: profile.id,
          p_action: 'testimonial_notification_sent',
          p_status: sent.ok ? 'success' : 'failure',
          p_resource_type: 'testimonial',
          p_resource_id: inserted.id,
          p_details: JSON.stringify({
            channel: 'email',
            recipient: contact.email,
            provider_id: sent.providerId ?? null,
            error: sent.error ?? null,
          }),
        })
        .then(undefined, () => undefined);
    }

    return successResponse({ id: inserted.id, pendingApproval: true, notified }, req);
  } catch (error) {
    console.error('Submit Review Error:', error instanceof Error ? error.message : error);
    return handleUnexpectedError(error, req);
  }
});
