import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { isServiceRoleRequest } from '../_shared/service-auth.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import { getCorsHeaders } from '../_shared/cors.ts';
import { sendEmail, createLeadNotificationEmail } from '../_shared/email.ts';
import { successResponse, errorResponse, handleUnexpectedError } from '../_shared/response.ts';
import { getAgentContact } from '../_shared/agent-contact.ts';
import { decryptSecret } from '../_shared/encryption.ts';

/**
 * Notify Lead
 *
 * Sends the agent an email when a new lead is captured. The only notification
 * path: submit-lead calls it explicitly after inserting, and useLeads calls it
 * for a lead an agent adds by hand. It used to be called by a leads-INSERT
 * trigger as well, which is why submit-lead ALSO emailed the agent itself —
 * two emails per lead whenever both worked. The trigger never fired in
 * practice (it read GUCs no live migration sets) and is dropped in
 * 20260902000003 along with the notion of putting the service-role key in a
 * plaintext database GUC (US-099).
 *
 * Respects the agent's profiles.notification_preferences.leads setting:
 *   - 'instant'      → send the email now
 *   - 'daily_digest' → send now, because no digest job exists. Skipping meant
 *                      agents on this setting were never emailed at all. The
 *                      settings UI says so.
 *   - 'off'          → send nothing
 *
 * Authenticated via the service-role key; this is server-to-server, not a user
 * session.
 */

interface LeadRecord {
  id: string;
  user_id: string;
  name: string;
  /** Ciphertext. US-086 dropped the plaintext email/phone columns. */
  encrypted_email?: string | null;
  encrypted_phone?: string | null;
  message?: string | null;
  lead_type?: string | null;
  listing_id?: string | null;
  referrer_url?: string | null;
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get('origin'));

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return errorResponse('Method not allowed', 'METHOD_NOT_ALLOWED', req, 405);
  }

  try {
    // US-078: destructive-adjacent and unauthenticated — anyone could drive
    // email sends. It is invoked by the leads-INSERT trigger via pg_net with
    // the service-role key, so that is the only caller it needs to accept.
    if (!isServiceRoleRequest(req)) {
      return errorResponse('Unauthorized', 'UNAUTHORIZED', req, 401);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const payload = await req.json();

    // US-078: the lead is always re-read from the database. This used to accept
    // `payload.record` verbatim, so an unauthenticated caller could POST an
    // arbitrary record and drive an email with contents of their choosing. The
    // trigger sends `{ record }`, so its id is used as the lookup key rather
    // than its body.
    const leadId = payload.lead_id ?? payload.record?.id ?? null;

    if (!leadId) {
      return errorResponse('A lead_id is required', 'REQUEST_VALIDATION_FAILED', req);
    }

    const { data: leadRow } = await supabase.from('leads').select('*').eq('id', leadId).single();
    const lead = leadRow as LeadRecord | null;

    if (!lead || !lead.user_id) {
      return errorResponse('A lead record or lead_id is required', 'REQUEST_VALIDATION_FAILED', req);
    }

    // Resolve the agent + their notification preference. The account address
    // is in auth.users, not on the profile — see _shared/agent-contact.ts.
    const contact = await getAgentContact(supabase, lead.user_id);

    const agentEmail = contact?.email;
    if (!agentEmail) {
      // US-070: this used to return 200 with reason 'no_agent_email' because
      // the profiles query named a column that does not exist, so EVERY lead
      // notification landed here and looked like a no-op by choice. An agent
      // we cannot reach is a failure, and it must be reported as one.
      console.error(`No account email for agent ${lead.user_id}; cannot notify for lead ${lead.id ?? 'unknown'}`);
      return errorResponse(
        'Could not resolve the agent notification address',
        'AGENT_EMAIL_UNRESOLVED',
        req
      );
    }

    // 'off' is the only setting that suppresses the email. 'daily_digest' used
    // to skip here "because a separate digest job handles these" — no such job
    // exists, so every agent who chose it silently received nothing at all.
    // Until one is built, a digest subscriber gets instant mail, which is the
    // failure mode that loses no leads.
    const leadPref = (contact?.notificationPreferences?.leads as string | undefined) ?? 'instant';
    if (leadPref === 'off') {
      return successResponse({ notified: false, reason: 'preference_off' }, req);
    }

    const siteUrl = Deno.env.get('SITE_URL') || 'https://agentbio.net';
    const listingLabel =
      lead.lead_type === 'valuation'
        ? 'a home valuation'
        : lead.lead_type === 'seller'
          ? 'selling a property'
          : lead.lead_type === 'buyer'
            ? 'buying a home'
            : undefined;

    // The contact details are the point of the email. They live only as
    // ciphertext since US-086, and this function passed lead.email / lead.phone
    // — columns that no longer exist — so the agent received a New Lead alert
    // reading "Email: undefined" with no way to reply (US-099).
    const [leadEmail, leadPhone] = await Promise.all([
      decryptSecret(lead.encrypted_email),
      decryptSecret(lead.encrypted_phone),
    ]);

    // The score badge read lead.score ?? lead.lead_score. `leads` has neither
    // column — scores live in lead_scores, one row per lead — so the badge
    // never rendered (US-100). A missing row is normal (scoring may not have
    // run yet) and renders no badge, which is why this does not fail on it.
    const { data: scoreRow } = await supabase
      .from('lead_scores')
      .select('score')
      .eq('lead_id', lead.id)
      .maybeSingle();
    const leadScore = (scoreRow as { score?: number } | null)?.score ?? null;

    const email = createLeadNotificationEmail({
      agentEmail,
      name: lead.name,
      email: leadEmail ?? '',
      phone: leadPhone ?? undefined,
      message: lead.message ?? undefined,
      listing: listingLabel,
      sourcePage: lead.referrer_url ?? undefined,
      leadScore: leadScore,
      dashboardUrl: `${siteUrl}/dashboard/leads`,
    });

    // sendEmail never throws, but it now reports what happened. This used to
    // log status 'success' unconditionally, without knowing whether anything
    // had been sent.
    const sent = await sendEmail(email);

    await supabase
      .rpc('log_audit_event', {
        p_user_id: lead.user_id,
        p_action: 'lead_notification_sent',
        p_status: sent.ok ? 'success' : 'failure',
        p_resource_type: 'lead',
        p_resource_id: lead.id,
        p_details: JSON.stringify({
          channel: 'email',
          recipient: agentEmail,
          provider_id: sent.providerId ?? null,
          error: sent.error ?? null,
        }),
      })
      .then(undefined, () => undefined);

    // Record the send on the lead's own timeline. Without this the agent can
    // see a lead and see nothing about whether they were told about it.
    // Best-effort: a failure here must not turn a delivered email into a 500.
    const { error: activityError } = await supabase.from('lead_activities').insert({
      lead_id: lead.id,
      user_id: lead.user_id,
      activity_type: 'email',
      title: sent.ok ? 'New lead notification sent' : 'New lead notification failed',
      content: sent.ok ? null : sent.error ?? 'Unknown error',
      email_subject: email.subject,
      email_recipient: agentEmail,
      is_internal: true,
      metadata: { source: 'notify-lead', provider_id: sent.providerId ?? null },
    });
    if (activityError) {
      console.error(`[notify-lead] could not log activity for ${lead.id}: ${activityError.message}`);
    }

    if (!sent.ok) {
      console.error(`[notify-lead] email to ${agentEmail} for lead ${lead.id} failed: ${sent.error}`);
      return errorResponse('The notification email could not be sent', 'EMAIL_SEND_FAILED', req, 502);
    }

    return successResponse({ notified: true, providerId: sent.providerId ?? null }, req);
  } catch (error) {
    console.error('Notify Lead Error:', error instanceof Error ? error.message : error);
    return handleUnexpectedError(error, req);
  }
});
