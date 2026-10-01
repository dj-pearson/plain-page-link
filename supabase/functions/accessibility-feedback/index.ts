/**
 * Accessibility feedback form endpoint (US-239). Public: no sign-in, since the
 * person reporting a barrier may be unable to get past it to sign in.
 *
 * Spam: honeypot + fill-time signals (spam-guard) and the submission rate
 * limit, which fails closed. The message goes to ACCESSIBILITY_INBOX
 * (default accessibility@agentbio.net) with the reporter as Reply-To.
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import { getCorsHeaders } from '../_shared/cors.ts';
import { sendEmail } from '../_shared/email.ts';
import { readSpamSignals, botReason } from '../_shared/spam-guard.ts';
import { checkRateLimitDb, RATE_LIMITS } from '../_shared/rate-limiter.ts';
import { getClientIP } from '../_shared/validation.ts';
import { validateFeedback, buildFeedbackEmail } from '../_shared/accessibility-feedback.ts';

serve(async (req) => {
  const cors = getCorsHeaders(req.headers.get('origin'));
  const json = (status: number, body: unknown) =>
    new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
  if (req.method !== 'POST') return json(405, { error: 'Method not allowed' });

  let raw: Record<string, unknown>;
  try {
    raw = await req.json();
  } catch {
    return json(400, { error: 'Invalid request' });
  }

  // A bot gets a 200 and nothing is sent, so it learns nothing.
  if (botReason(readSpamSignals(raw))) return json(200, { ok: true });

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const limit = await checkRateLimitDb(supabase, getClientIP(req), 'accessibility-feedback', RATE_LIMITS.submission);
  if (!limit.allowed) {
    return json(429, { error: 'Too many messages in a short time. Please wait a minute, or email accessibility@agentbio.net.' });
  }

  const checked = validateFeedback(raw);
  if (!checked.ok) return json(400, { error: 'Please check the form.', fields: checked.errors });

  const inbox = Deno.env.get('ACCESSIBILITY_INBOX') || 'accessibility@agentbio.net';
  const sent = await sendEmail(buildFeedbackEmail(checked.value, inbox));
  if (!sent.ok) {
    console.error('[accessibility-feedback] send failed:', sent.error);
    return json(502, { error: 'We could not send your message. Please email accessibility@agentbio.net.' });
  }
  return json(200, { ok: true });
});
