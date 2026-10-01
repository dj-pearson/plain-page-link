/**
 * Cheap, invisible bot signals for the public lead forms (US-220).
 *
 * submit-lead's only defence used to be 5 requests a minute per IP. Every
 * accepted POST stored a lead — spending the agent's monthly allowance, past
 * which real leads are locked — and emailed an auto-reply to whatever address
 * it was given. So a bot filled agents' CRMs with junk and used our domain to
 * mail strangers.
 *
 * Two signals, both invisible to a person:
 *   - a honeypot field hidden off-screen that a human never fills;
 *   - how long the form was open before it was sent (people take seconds).
 * A request that trips either gets the normal success response and nothing is
 * stored or sent, so a bot learns nothing from the answer.
 *
 * A client that sends neither signal (an older page, a direct POST) is not
 * refused on that basis alone; the duplicate check and the per-agent
 * auto-reply cap in submit-lead bound what it can do. Turnstile is the next
 * step if that proves not to be enough.
 */

/** Names the forms send. Deliberately bland so autofill does not touch them. */
export const HONEYPOT_FIELD = '_hp';
export const ELAPSED_FIELD = '_elapsed_ms';

/** People do not read, fill and send a form in under this. */
export const MIN_FILL_MS = 3000;

export interface SpamSignals {
  honeypot: string;
  elapsedMs: number | null;
}

export function readSpamSignals(raw: Record<string, unknown> | null | undefined): SpamSignals {
  const hp = raw?.[HONEYPOT_FIELD];
  const elapsed = raw?.[ELAPSED_FIELD];
  return {
    honeypot: typeof hp === 'string' ? hp.trim() : '',
    elapsedMs: typeof elapsed === 'number' && Number.isFinite(elapsed) ? elapsed : null,
  };
}

/** Why a submission looks automated, or null. */
export function botReason(signals: SpamSignals, minFillMs = MIN_FILL_MS): string | null {
  if (signals.honeypot) return 'honeypot';
  if (signals.elapsedMs !== null && signals.elapsedMs < minFillMs) return 'too_fast';
  return null;
}

/**
 * A keyed, deterministic fingerprint of an email address, for finding the
 * same person's earlier lead without decrypting anything. HMAC rather than a
 * bare hash so the column cannot be reversed with a dictionary of addresses.
 */
export async function emailLookupHash(email: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(`lead-email-lookup:v1:${secret}`),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(email.trim().toLowerCase()));
  return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, '0')).join('');
}
