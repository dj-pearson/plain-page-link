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
  return keyedLookupHash(`lead-email-lookup:v1:${secret}`, email.trim().toLowerCase());
}

/**
 * A phone number in E.164 digits (no '+'), or null when it is too short or
 * too long to be one, for matching the same number however it was typed.
 *
 * '+44 20 7946 0958' and '0044 20 7946 0958' carry their country code. A
 * number written without one is read as North American, which is where
 * AgentBio's agents are: '(512) 555-0142', '512.555.0142' and
 * '1-512-555-0142' all become 15125550142. Any other national format is kept
 * as its digits; it still matches itself, just not its international spelling.
 */
export function normalisePhoneForLookup(phone: string): string | null {
  const trimmed = phone.trim();
  let digits = trimmed.replace(/\D/g, '');
  if (!trimmed.startsWith('+')) {
    if (digits.startsWith('00')) digits = digits.slice(2);
    else if (digits.length === 10) digits = `1${digits}`;
  }
  // E.164 allows at most 15 digits; fewer than 7 is not a reachable number.
  if (digits.length < 7 || digits.length > 15) return null;
  return digits;
}

/**
 * The phone counterpart of emailLookupHash (US-522), so a phone-only lead
 * (US-228) that submits twice folds like an email lead does. Null when the
 * number does not normalise. A separate key label from the email hash, so the
 * two columns can never be compared with each other.
 */
export async function phoneLookupHash(phone: string, secret: string): Promise<string | null> {
  const normalised = normalisePhoneForLookup(phone);
  if (!normalised) return null;
  return keyedLookupHash(`lead-phone-lookup:v1:${secret}`, normalised);
}

async function keyedLookupHash(keyMaterial: string, value: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(keyMaterial),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(value));
  return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, '0')).join('');
}

/** Which stored fingerprint a new enquiry is matched against for the fold. */
export interface RepeatLookup {
  column: 'email_hash' | 'phone_hash';
  value: string;
}

export interface LeadLookupHashes {
  email_hash: string | null;
  phone_hash: string | null;
  /** Null when there is nothing to match on: no key, or neither detail hashes. */
  fold: RepeatLookup | null;
}

/**
 * Both fingerprints submit-lead stores on a new lead, and the one the repeat
 * fold looks up (US-220, US-522): the email when there is one, otherwise the
 * phone. An enquiry that gives an email is never folded by phone alone, so
 * two people sharing a household number but writing from their own addresses
 * stay two leads.
 */
export async function leadLookupHashes(
  contact: { email?: string | null; phone?: string | null },
  secret: string | null | undefined
): Promise<LeadLookupHashes> {
  if (!secret) return { email_hash: null, phone_hash: null, fold: null };
  const [emailHash, phoneHash] = await Promise.all([
    contact.email ? emailLookupHash(contact.email, secret) : Promise.resolve(null),
    contact.phone ? phoneLookupHash(contact.phone, secret) : Promise.resolve(null),
  ]);
  const fold: RepeatLookup | null = emailHash
    ? { column: 'email_hash', value: emailHash }
    : phoneHash
      ? { column: 'phone_hash', value: phoneHash }
      : null;
  return { email_hash: emailHash, phone_hash: phoneHash, fold };
}
