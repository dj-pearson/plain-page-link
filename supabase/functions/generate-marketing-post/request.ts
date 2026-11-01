/**
 * Pure request/response helpers for generate-marketing-post (US-248).
 *
 * Kept free of Deno and esm.sh imports so vitest can load them.
 *
 * The function used to take `webhookUrl` from the body and POST to it with the
 * service role's network position, so any caller could make it reach
 * 169.254.169.254 or an internal service, and it returned whatever that target
 * answered. The caller now names a stored webhook (social_media_webhooks, which
 * only admins can write) by id, and the outcome is reported by status alone.
 */

export type MarketingPostRequest =
  | { ok: true; webhookId: string | null }
  | { ok: false; error: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function parseMarketingPostRequest(body: unknown): MarketingPostRequest {
  if (body === null || body === undefined) return { ok: true, webhookId: null };
  if (typeof body !== 'object' || Array.isArray(body)) {
    return { ok: false, error: 'Request body must be a JSON object' };
  }
  const record = body as Record<string, unknown>;
  if ('webhookUrl' in record) {
    return { ok: false, error: 'Send webhookId (a configured webhook), not a URL' };
  }
  const id = record.webhookId;
  if (id === undefined || id === null || id === '') return { ok: true, webhookId: null };
  if (typeof id !== 'string' || !UUID.test(id)) {
    return { ok: false, error: 'webhookId must be a webhook id' };
  }
  return { ok: true, webhookId: id };
}

/** Headers the stored webhook may not set: they describe the connection, not the request. */
const FORBIDDEN_HEADERS = new Set([
  'host',
  'content-length',
  'content-type',
  'connection',
  'transfer-encoding',
  'keep-alive',
  'upgrade',
  'te',
  'trailer',
  'proxy-authorization',
  'proxy-connection',
]);

/** The stored webhook's extra headers (jsonb), reduced to string values, plus JSON content type. */
export function webhookHeaders(stored: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  if (stored && typeof stored === 'object' && !Array.isArray(stored)) {
    for (const [name, value] of Object.entries(stored as Record<string, unknown>)) {
      if (typeof value !== 'string') continue;
      if (FORBIDDEN_HEADERS.has(name.toLowerCase())) continue;
      out[name] = value;
    }
  }
  out['Content-Type'] = 'application/json';
  return out;
}

export type DeliveryOutcome =
  | { delivered: true; status: number }
  | { delivered: false; status: number | null; error: string };

/**
 * What the caller is told about a delivery. Never the upstream body: the
 * target is the operator's own webhook, but a body can carry tokens, and an
 * endpoint that relays responses is an oracle for whatever it can reach.
 */
export function deliveryOutcome(result: { status: number; ok: boolean } | Error): DeliveryOutcome {
  if (result instanceof Error) {
    return { delivered: false, status: null, error: 'Webhook could not be reached' };
  }
  if (result.ok) return { delivered: true, status: result.status };
  return { delivered: false, status: result.status, error: `Webhook answered ${result.status}` };
}
