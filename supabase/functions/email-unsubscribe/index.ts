/**
 * Supabase Edge Function: email-unsubscribe (US-425)
 *
 * Opts an address out of the free-tool drips. Two callers:
 *
 *   - the /unsubscribe page, after the person clicks the button, with a JSON
 *     body { list, captureId, token };
 *   - a mail client's own Unsubscribe button (RFC 8058), which POSTs
 *     `List-Unsubscribe=One-Click` to the URL in the List-Unsubscribe header,
 *     with l, c and t in the query string.
 *
 * The token is an HMAC of list and capture id (marketing-unsubscribe.ts), so
 * nobody can unsubscribe a capture they were not emailed about. The address
 * goes into email_suppressions by keyed hash only. Repeating the request is
 * harmless, and a capture that has since been deleted still answers success:
 * there is nothing left to email.
 *
 * POST only. A GET would let link scanners and prefetchers opt people out.
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import { getCorsHeaders, handleCorsPreFlight } from '../_shared/cors.ts';
import { checkRateLimitDb, RATE_LIMITS } from '../_shared/rate-limiter.ts';
import { getClientIP } from '../_shared/client-ip.ts';
import { emailLookupHash } from '../_shared/spam-guard.ts';
import {
  CAPTURE_TABLE,
  parseUnsubscribeRequest,
  unsubscribeSecret,
  verifyUnsubscribe,
} from '../_shared/marketing-unsubscribe.ts';

serve(async (req) => {
  const origin = req.headers.get('origin');
  if (req.method === 'OPTIONS') return handleCorsPreFlight(origin);

  const json = (status: number, body: unknown, extra: Record<string, string> = {}) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin, 'POST, OPTIONS'), ...extra },
    });

  if (req.method !== 'POST') {
    return json(405, { error: 'Method not allowed' }, { Allow: 'POST, OPTIONS' });
  }

  try {
    const url = new URL(req.url);
    const contentType = req.headers.get('content-type') ?? '';
    const isOneClick = !contentType.includes('application/json');
    const body = isOneClick ? null : await req.json().catch(() => null);

    const request = parseUnsubscribeRequest(url, body);
    if (!request) {
      return json(400, { error: 'This unsubscribe link is incomplete.', code: 'REQUEST_VALIDATION_FAILED' });
    }

    const secret = unsubscribeSecret();
    if (!secret) {
      console.error('[email-unsubscribe] PII_ENCRYPTION_KEY is not set; cannot verify unsubscribe links');
      return json(503, { error: 'Unsubscribe is temporarily unavailable. Please reply to the email instead.' });
    }

    if (!(await verifyUnsubscribe(request.list, request.captureId, request.token, secret))) {
      return json(403, { error: 'This unsubscribe link is not valid.', code: 'FORBIDDEN' });
    }

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    // The page path is rate limited per IP. The one-click path is not: those
    // POSTs come from a handful of mail-provider servers on behalf of many
    // people, and the HMAC already means only a real link does anything.
    const rate = isOneClick
      ? { allowed: true, retryAfterSeconds: 0 }
      : await checkRateLimitDb(supabase, getClientIP(req), 'email-unsubscribe', RATE_LIMITS.submission);
    if (!rate.allowed) {
      return json(
        429,
        { error: 'Too many requests. Please try again shortly.' },
        { 'Retry-After': String(rate.retryAfterSeconds) }
      );
    }

    const table = CAPTURE_TABLE[request.list];
    const { data: capture, error: captureError } = await supabase
      .from(table)
      .select('email')
      .eq('id', request.captureId)
      .maybeSingle();
    if (captureError) throw captureError;

    if (capture?.email) {
      const emailHash = await emailLookupHash(String(capture.email), secret);
      const { error: suppressError } = await supabase
        .from('email_suppressions')
        .upsert(
          { email_hash: emailHash, source: request.list, method: isOneClick ? 'one_click' : 'link' },
          { onConflict: 'email_hash', ignoreDuplicates: true }
        );
      if (suppressError) throw suppressError;

      // End this capture's sequence too, so the schedulers stop picking it up.
      const { error: endError } = await supabase
        .from(table)
        .update({ email_sequence_completed: true })
        .eq('id', request.captureId);
      if (endError) throw endError;
    }

    return json(200, { success: true });
  } catch (error) {
    console.error('[email-unsubscribe] failed:', error instanceof Error ? error.message : String(error));
    return json(500, { error: 'We could not unsubscribe you just now. Please try again.' });
  }
});
