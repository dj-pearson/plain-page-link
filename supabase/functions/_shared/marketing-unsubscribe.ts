/**
 * Unsubscribing from the free-tool drips (US-425).
 *
 * The listing-generator drip linked `${SITE_URL}/unsubscribe`, a route the app
 * never had: the link rendered the profile 404. The bio-analyzer drip had no
 * link at all, neither drip sent a List-Unsubscribe header, and nothing checked
 * for an opt-out before sending. For marketing email that is a CAN-SPAM and
 * GDPR gap, and the privacy policy promised otherwise.
 *
 * How it works now:
 *
 *   - Every drip email carries a link to /unsubscribe?l=<list>&c=<capture>&t=<token>
 *     and RFC 8058 List-Unsubscribe / List-Unsubscribe-Post headers pointing at
 *     the email-unsubscribe function with the same three parameters, so a mail
 *     client's own "Unsubscribe" button works with one click.
 *   - The token is an HMAC of the list and capture id, so a link cannot be
 *     forged for someone else's capture and carries no email address.
 *   - email-unsubscribe records the address in email_suppressions by its keyed
 *     hash (the same emailLookupHash as leads.email_hash), never in plaintext,
 *     and ends that capture's sequence.
 *   - Every drip send asks isSuppressed() first. The suppression is per
 *     address, so it also covers that person's later captures and the other
 *     tool's drip.
 *   - resend-webhook (US-448) adds hard bounces and spam complaints to the
 *     same table, so isSuppressed() stops those addresses too.
 *
 * The /unsubscribe page asks for a click before it posts: link scanners and
 * prefetchers follow GET links, and an opt-out they trigger is one the person
 * never made.
 */
import { emailLookupHash } from './spam-guard.ts';

export const UNSUBSCRIBE_LISTS = ['listing', 'bio'] as const;
export type UnsubscribeList = (typeof UNSUBSCRIBE_LISTS)[number];

/** The capture table each list's drip reads. */
export const CAPTURE_TABLE: Record<UnsubscribeList, 'listing_email_captures' | 'instagram_bio_email_captures'> = {
  listing: 'listing_email_captures',
  bio: 'instagram_bio_email_captures',
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TOKEN_RE = /^[0-9a-f]{64}$/;

export function isUnsubscribeList(value: unknown): value is UnsubscribeList {
  return typeof value === 'string' && (UNSUBSCRIBE_LISTS as readonly string[]).includes(value);
}

/**
 * The key the tokens and the suppression hashes are made with: the PII key
 * submit-lead already uses for leads.email_hash. Undefined when unset — the
 * drips then cannot offer a working opt-out and must not send (see callers).
 */
export function unsubscribeSecret(): string | undefined {
  const value = Deno.env.get('PII_ENCRYPTION_KEY') ?? Deno.env.get('ENCRYPTION_KEY');
  return value && value.trim() ? value : undefined;
}

function hex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer), (b) => b.toString(16).padStart(2, '0')).join('');
}

export async function signUnsubscribe(list: UnsubscribeList, captureId: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    // Domain-separated from every other use of the same key.
    enc.encode(`marketing-unsubscribe:v1:${secret}`),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(`${list}:${captureId.toLowerCase()}`));
  return hex(sig);
}

/** Constant-time comparison of two equal-format hex strings. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function verifyUnsubscribe(
  list: UnsubscribeList,
  captureId: string,
  token: string,
  secret: string
): Promise<boolean> {
  if (!UUID_RE.test(captureId) || !TOKEN_RE.test(token)) return false;
  return safeEqual(await signUnsubscribe(list, captureId, secret), token);
}

export interface UnsubscribeRequest {
  list: UnsubscribeList;
  captureId: string;
  token: string;
}

/**
 * Reads the three parameters from the query string (a mail client's one-click
 * POST, which sends only `List-Unsubscribe=One-Click` as its body) or from a
 * JSON body (the /unsubscribe page). Null when anything is missing or malformed.
 */
export function parseUnsubscribeRequest(url: URL, body: unknown): UnsubscribeRequest | null {
  const b = body && typeof body === 'object' ? (body as Record<string, unknown>) : {};
  const list = url.searchParams.get('l') ?? b.list;
  const captureId = url.searchParams.get('c') ?? b.captureId;
  const token = url.searchParams.get('t') ?? b.token;
  if (!isUnsubscribeList(list)) return null;
  if (typeof captureId !== 'string' || !UUID_RE.test(captureId)) return null;
  if (typeof token !== 'string' || !TOKEN_RE.test(token.toLowerCase())) return null;
  return { list, captureId: captureId.toLowerCase(), token: token.toLowerCase() };
}

export interface UnsubscribeLinks {
  /** The /unsubscribe page, for the link in the email body. */
  pageUrl: string;
  /** The function a mail client POSTs to (RFC 8058). */
  oneClickUrl: string;
}

export async function unsubscribeLinks(
  list: UnsubscribeList,
  captureId: string,
  secret: string,
  origins: { siteUrl: string; functionsUrl: string }
): Promise<UnsubscribeLinks> {
  const token = await signUnsubscribe(list, captureId, secret);
  const query = new URLSearchParams({ l: list, c: captureId.toLowerCase(), t: token }).toString();
  return {
    pageUrl: `${origins.siteUrl}/unsubscribe?${query}`,
    oneClickUrl: `${origins.functionsUrl}/email-unsubscribe?${query}`,
  };
}

/** RFC 2369 / RFC 8058 headers: the mail client's own Unsubscribe button. */
export function unsubscribeHeaders(links: UnsubscribeLinks): Record<string, string> {
  return {
    'List-Unsubscribe': `<${links.oneClickUrl}>`,
    'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
  };
}

/**
 * CAN-SPAM (15 U.S.C. 7704(a)(5)) requires a commercial email to carry the
 * sender's valid physical postal address (US-447). None of the drips did. The
 * address is one config value, COMPANY_POSTAL_ADDRESS on the edge-functions
 * deployment (a street address, or a registered PO box / private mailbox), so
 * every drip footer prints the same thing and changing it is one setting.
 * Lines may be separated by newlines; they are joined with commas.
 *
 * Undefined while the owner has not set it: the footer then omits the line
 * rather than printing a placeholder that would look like an address.
 */
export function postalAddress(): string | undefined {
  // typeof guard: the footer builders are also exercised outside Deno (vitest).
  const value = typeof Deno === 'undefined' ? undefined : Deno.env.get('COMPANY_POSTAL_ADDRESS');
  if (!value) return undefined;
  const lines = value
    .split(/\r?\n/)
    .map((line) => line.trim().replace(/,$/, ''))
    .filter(Boolean);
  return lines.length ? lines.join(', ') : undefined;
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/**
 * The footer for the HTML body: why they got it, the unsubscribe link and the
 * postal address. Every free-tool drip email ends with this, so the CAN-SPAM
 * parts are written once. The URL is ours (hex, uuid, fixed list); `reason` is
 * a constant from the caller, never visitor text.
 */
export function unsubscribeFooterHtml(
  links: UnsubscribeLinks,
  reason: string,
  address: string | undefined = postalAddress()
): string {
  const href = links.pageUrl.replace(/&/g, '&amp;');
  const addressLine = address ? `<br>AgentBio, ${escapeHtml(address)}` : '';
  return `<p style="margin:24px 0 0;padding-top:16px;border-top:1px solid #e5e7eb;color:#52606d;font-size:12px;line-height:1.5;">${reason} <a href="${href}" style="color:#52606d;">Unsubscribe</a> and we will not email you again.${addressLine}</p>`;
}

export function unsubscribeFooterText(
  links: UnsubscribeLinks,
  reason: string,
  address: string | undefined = postalAddress()
): string {
  const line = `${reason} Unsubscribe: ${links.pageUrl}`;
  return address ? `${line}\nAgentBio, ${address}` : line;
}

/** The slice of the Supabase client isSuppressed needs, so tests can fake it. */
export interface SuppressionClient {
  from(table: 'email_suppressions'): {
    select(columns: string): {
      eq(column: string, value: string): {
        maybeSingle(): PromiseLike<{ data: unknown; error: { message: string } | null }>;
      };
    };
  };
}

/**
 * Whether this address has opted out. Throws on a database error: a caller
 * that cannot tell must not send.
 */
export async function isSuppressed(client: SuppressionClient, email: string, secret: string): Promise<boolean> {
  const hash = await emailLookupHash(email, secret);
  const { data, error } = await client.from('email_suppressions').select('email_hash').eq('email_hash', hash).maybeSingle();
  if (error) throw new Error(`email_suppressions lookup failed: ${error.message}`);
  return data !== null && data !== undefined;
}
