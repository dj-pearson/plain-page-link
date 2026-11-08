/**
 * Bounces and spam complaints feed email_suppressions (US-448).
 *
 * email_suppressions (US-425) only learned about people who clicked
 * Unsubscribe. An address that hard-bounced kept getting the rest of its drip,
 * and so did someone who pressed "Report spam" in their mail client. Both hurt
 * the sending domain's reputation with Gmail and Outlook, which is the domain
 * every lead notification and welcome email also goes out on, and continuing
 * to mail a complainer is the opposite of what the privacy policy promises.
 *
 * Resend posts its webhooks signed the Svix way:
 *
 *   svix-id, svix-timestamp (unix seconds), svix-signature ("v1,<base64> ...")
 *   signature = base64(HMAC-SHA256(base64decode(secret without "whsec_"),
 *                                  `${id}.${timestamp}.${rawBody}`))
 *
 * This module holds the parts that decide what happens, free of Deno globals,
 * so they are unit tested: signature verification (with a replay window) and
 * which events suppress which addresses. resend-webhook/index.ts is the thin
 * handler around them.
 */

/** How far a webhook's timestamp may be from now before it is refused (replay). */
export const RESEND_WEBHOOK_TOLERANCE_SECONDS = 5 * 60;

export type SuppressionMethod = 'bounce' | 'complaint';

export interface WebhookHeaders {
  get(name: string): string | null;
}

function base64ToBytes(value: string): Uint8Array | null {
  try {
    const binary = atob(value);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  } catch {
    return null;
  }
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

/** Constant-time comparison of two strings of the same alphabet. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function signResendPayload(
  secret: string,
  id: string,
  timestamp: string,
  rawBody: string
): Promise<string | null> {
  const keyBytes = base64ToBytes(secret.startsWith('whsec_') ? secret.slice('whsec_'.length) : secret);
  if (!keyBytes || keyBytes.length === 0) return null;
  const key = await crypto.subtle.importKey('raw', keyBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${id}.${timestamp}.${rawBody}`));
  return bytesToBase64(new Uint8Array(sig));
}

export type VerifyResult = { ok: true } | { ok: false; reason: 'missing_headers' | 'stale' | 'bad_signature' | 'bad_secret' };

/**
 * Verifies a Resend (Svix) webhook against the raw request body. The body must
 * be the exact bytes received: re-serialised JSON will not match.
 */
export async function verifyResendWebhook(
  headers: WebhookHeaders,
  rawBody: string,
  secret: string,
  nowSeconds: number = Math.floor(Date.now() / 1000)
): Promise<VerifyResult> {
  const id = headers.get('svix-id');
  const timestamp = headers.get('svix-timestamp');
  const signatureHeader = headers.get('svix-signature');
  if (!id || !timestamp || !signatureHeader) return { ok: false, reason: 'missing_headers' };

  if (!/^\d{1,12}$/.test(timestamp)) return { ok: false, reason: 'stale' };
  if (Math.abs(nowSeconds - Number(timestamp)) > RESEND_WEBHOOK_TOLERANCE_SECONDS) {
    return { ok: false, reason: 'stale' };
  }

  const expected = await signResendPayload(secret, id, timestamp, rawBody);
  if (!expected) return { ok: false, reason: 'bad_secret' };

  // The header may carry several signatures (during a secret rotation); any
  // v1 match is enough.
  const matched = signatureHeader
    .split(' ')
    .map((part) => part.trim())
    .filter((part) => part.startsWith('v1,'))
    .some((part) => safeEqual(part.slice(3), expected));
  return matched ? { ok: true } : { ok: false, reason: 'bad_signature' };
}

const EMAIL_RE = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;

/** Accepts "a@b.co" and "Name <a@b.co>"; returns the bare address or null. */
function bareAddress(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const angle = value.match(/<([^<>]+)>\s*$/);
  const address = (angle ? angle[1] : value).trim();
  return EMAIL_RE.test(address) && address.length <= 320 ? address : null;
}

export interface SuppressionDecision {
  method: SuppressionMethod;
  /** Bare recipient addresses, deduplicated, case preserved (hashing lowercases). */
  emails: string[];
}

/**
 * Which addresses an event should suppress, or null when it suppresses none.
 *
 *   - email.complained: always. The person told their mail provider it is spam.
 *   - email.bounced: unless Resend marks the bounce Transient (mailbox full,
 *     greylisting). A Permanent or unclassified bounce means the address does
 *     not take mail; Resend only fires email.bounced once retries are over.
 *   - anything else (sent, delivered, opened, delivery_delayed...): no.
 */
export function suppressionFromEvent(event: unknown): SuppressionDecision | null {
  if (!event || typeof event !== 'object') return null;
  const { type, data } = event as { type?: unknown; data?: unknown };
  if (!data || typeof data !== 'object') return null;
  const d = data as { to?: unknown; bounce?: unknown };

  let method: SuppressionMethod;
  if (type === 'email.complained') {
    method = 'complaint';
  } else if (type === 'email.bounced') {
    const bounceType =
      d.bounce && typeof d.bounce === 'object' ? (d.bounce as { type?: unknown }).type : undefined;
    if (typeof bounceType === 'string' && bounceType.toLowerCase() === 'transient') return null;
    method = 'bounce';
  } else {
    return null;
  }

  const recipients = Array.isArray(d.to) ? d.to : [d.to];
  const seen = new Set<string>();
  const emails: string[] = [];
  for (const r of recipients) {
    const address = bareAddress(r);
    if (!address) continue;
    const key = address.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    emails.push(address);
  }
  return emails.length > 0 ? { method, emails } : null;
}
