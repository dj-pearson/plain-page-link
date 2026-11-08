/**
 * Supabase Edge Function: resend-webhook (US-448)
 *
 * Receives Resend's email.bounced and email.complained webhooks and records
 * the recipient in email_suppressions (by keyed hash, like email-unsubscribe),
 * so a hard bounce or a spam complaint stops every later drip send: the drip
 * senders already ask isSuppressed() before each email.
 *
 * Set up: Resend > Webhooks > Add endpoint `<functions-url>/resend-webhook`,
 * events email.bounced and email.complained, then store the endpoint's signing
 * secret (whsec_...) as RESEND_WEBHOOK_SECRET.
 *
 * Every request must carry a valid Svix signature over the raw body, made
 * within the last five minutes; anything else gets 401 and touches nothing.
 * Events that suppress nobody (delivered, opened, a transient bounce) answer
 * 200 so Resend does not retry them.
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import { emailLookupHash } from '../_shared/spam-guard.ts';
import { unsubscribeSecret } from '../_shared/marketing-unsubscribe.ts';
import { suppressionFromEvent, verifyResendWebhook } from '../_shared/resend-webhook.ts';

const json = (status: number, body: unknown, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...extra } });

serve(async (req) => {
  // Server to server only: no CORS, no browser caller.
  if (req.method !== 'POST') {
    return json(405, { error: 'Method not allowed' }, { Allow: 'POST' });
  }

  // An unsigned request is refused before anything else, configured or not:
  // it cannot be Resend, so there is nothing to retry.
  if (!req.headers.get('svix-id') || !req.headers.get('svix-timestamp') || !req.headers.get('svix-signature')) {
    return json(401, { error: 'Invalid signature' });
  }

  const webhookSecret = Deno.env.get('RESEND_WEBHOOK_SECRET');
  const hashSecret = unsubscribeSecret();
  if (!webhookSecret || !webhookSecret.trim() || !hashSecret) {
    // 503 makes Resend retry, so events received before the secret is set are
    // not lost once it is.
    console.error('[resend-webhook] RESEND_WEBHOOK_SECRET or PII_ENCRYPTION_KEY is not set');
    return json(503, { error: 'Webhook not configured' });
  }

  try {
    const rawBody = await req.text();
    const verified = await verifyResendWebhook(req.headers, rawBody, webhookSecret.trim());
    if (!verified.ok) {
      if (verified.reason === 'bad_secret') {
        console.error('[resend-webhook] RESEND_WEBHOOK_SECRET is not a valid whsec_ secret');
        return json(503, { error: 'Webhook not configured' });
      }
      return json(401, { error: 'Invalid signature' });
    }

    let event: unknown;
    try {
      event = JSON.parse(rawBody);
    } catch {
      return json(400, { error: 'Invalid JSON' });
    }

    const decision = suppressionFromEvent(event);
    if (!decision) return json(200, { received: true, suppressed: 0 });

    const rows = await Promise.all(
      decision.emails.map(async (email) => ({
        email_hash: await emailLookupHash(email, hashSecret),
        source: 'resend',
        method: decision.method,
      }))
    );

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    // An address that already opted out keeps its original row.
    const { error } = await supabase
      .from('email_suppressions')
      .upsert(rows, { onConflict: 'email_hash', ignoreDuplicates: true });
    if (error) throw error;

    return json(200, { received: true, suppressed: rows.length });
  } catch (error) {
    // 500 so Resend retries: a lost complaint means mailing someone who asked us not to.
    console.error('[resend-webhook] failed:', error instanceof Error ? error.message : String(error));
    return json(500, { error: 'Could not record the event' });
  }
});
