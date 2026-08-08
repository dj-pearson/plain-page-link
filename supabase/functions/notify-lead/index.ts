import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import { getCorsHeaders } from '../_shared/cors.ts';
import { sendEmail, createLeadNotificationEmail } from '../_shared/email.ts';
import { successResponse, errorResponse, handleUnexpectedError } from '../_shared/response.ts';
import { getAgentContact } from '../_shared/agent-contact.ts';

/**
 * Notify Lead
 *
 * Sends the agent an email when a new lead is captured. Designed to be called
 * by the leads-INSERT database trigger (pg_net) with a `{ record }` payload,
 * but also accepts `{ lead_id }` for manual/testing invocation.
 *
 * Respects the agent's profiles.notification_preferences.leads setting:
 *   - 'instant'      → send the email now
 *   - 'daily_digest' → skip (a separate digest job handles these)
 *   - 'off'          → skip
 *
 * Authenticated via the service-role key (the trigger sends it as a Bearer
 * token); this is server-to-server, not a user session.
 */

interface LeadRecord {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone?: string | null;
  message?: string | null;
  lead_type?: string | null;
  listing_id?: string | null;
  score?: number | null;
  lead_score?: number | null;
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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const payload = await req.json();
    let lead: LeadRecord | null = payload.record ?? null;

    // Allow lookup by id (manual invocation path).
    if (!lead && payload.lead_id) {
      const { data } = await supabase.from('leads').select('*').eq('id', payload.lead_id).single();
      lead = data as LeadRecord | null;
    }

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

    const leadPref = (contact?.notificationPreferences?.leads as string | undefined) ?? 'instant';
    if (leadPref !== 'instant') {
      return successResponse({ notified: false, reason: `preference_${leadPref}` }, req);
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

    const email = createLeadNotificationEmail({
      agentEmail,
      name: lead.name,
      email: lead.email,
      phone: lead.phone ?? undefined,
      message: lead.message ?? undefined,
      listing: listingLabel,
      sourcePage: lead.referrer_url ?? undefined,
      leadScore: lead.score ?? lead.lead_score ?? null,
      dashboardUrl: `${siteUrl}/dashboard/leads`,
    });

    // sendEmail never throws (logs + swallows), so capture happens regardless.
    await sendEmail(email);

    await supabase
      .rpc('log_audit_event', {
        p_user_id: lead.user_id,
        p_action: 'lead_notification_sent',
        p_status: 'success',
        p_resource_type: 'lead',
        p_resource_id: lead.id,
        p_details: JSON.stringify({ channel: 'email' }),
      })
      .then(undefined, () => undefined);

    return successResponse({ notified: true }, req);
  } catch (error) {
    console.error('Notify Lead Error:', error instanceof Error ? error.message : error);
    return handleUnexpectedError(error, req);
  }
});
