/**
 * US-448: bounces and spam complaints feed email_suppressions.
 *
 * These pin the two decisions resend-webhook makes: whether a request really
 * came from Resend (Svix signature over the raw body, inside the replay
 * window), and which events suppress which addresses.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  RESEND_WEBHOOK_TOLERANCE_SECONDS,
  signResendPayload,
  suppressionFromEvent,
  verifyResendWebhook,
} from './resend-webhook.ts';

// whsec_ + base64 of a 24-byte key, the shape Resend issues.
const SECRET = `whsec_${Buffer.from('0123456789abcdefghijklmn').toString('base64')}`;
const OTHER_SECRET = `whsec_${Buffer.from('nmlkjihgfedcba9876543210').toString('base64')}`;
const NOW = 1_762_600_000;
const BODY = JSON.stringify({
  type: 'email.bounced',
  created_at: '2026-11-08T10:00:00.000Z',
  data: { email_id: 'abc', to: ['buyer@example.com'], bounce: { type: 'Permanent', subType: 'General' } },
});

function headers(map: Record<string, string>) {
  return { get: (name: string) => map[name.toLowerCase()] ?? null };
}

async function signed(body = BODY, secret = SECRET, timestamp = String(NOW), id = 'msg_1') {
  const sig = await signResendPayload(secret, id, timestamp, body);
  return headers({ 'svix-id': id, 'svix-timestamp': timestamp, 'svix-signature': `v1,${sig}` });
}

describe('verifyResendWebhook', () => {
  it('accepts a payload signed with the endpoint secret', async () => {
    expect(await verifyResendWebhook(await signed(), BODY, SECRET, NOW)).toEqual({ ok: true });
  });

  it('matches the Svix reference construction (HMAC-SHA256 of id.timestamp.body, base64)', async () => {
    const { createHmac } = await import('node:crypto');
    const key = Buffer.from(SECRET.slice('whsec_'.length), 'base64');
    const reference = createHmac('sha256', key).update(`msg_1.${NOW}.${BODY}`).digest('base64');
    expect(await signResendPayload(SECRET, 'msg_1', String(NOW), BODY)).toBe(reference);
  });

  it('refuses another secret, a changed body, or a changed id', async () => {
    expect((await verifyResendWebhook(await signed(BODY, OTHER_SECRET), BODY, SECRET, NOW)).ok).toBe(false);
    expect((await verifyResendWebhook(await signed(), BODY.replace('buyer', 'other'), SECRET, NOW)).ok).toBe(false);
    const h = await signed();
    const moved = headers({
      'svix-id': 'msg_2',
      'svix-timestamp': h.get('svix-timestamp')!,
      'svix-signature': h.get('svix-signature')!,
    });
    expect(await verifyResendWebhook(moved, BODY, SECRET, NOW)).toEqual({ ok: false, reason: 'bad_signature' });
  });

  it('accepts any v1 signature in a rotated header', async () => {
    const good = (await signed()).get('svix-signature')!;
    const h = headers({ 'svix-id': 'msg_1', 'svix-timestamp': String(NOW), 'svix-signature': `v1,AAAA ${good}` });
    expect(await verifyResendWebhook(h, BODY, SECRET, NOW)).toEqual({ ok: true });
  });

  it('refuses a replay outside the five-minute window, either side', async () => {
    const old = await signed(BODY, SECRET, String(NOW - RESEND_WEBHOOK_TOLERANCE_SECONDS - 1));
    expect(await verifyResendWebhook(old, BODY, SECRET, NOW)).toEqual({ ok: false, reason: 'stale' });
    const future = await signed(BODY, SECRET, String(NOW + RESEND_WEBHOOK_TOLERANCE_SECONDS + 1));
    expect(await verifyResendWebhook(future, BODY, SECRET, NOW)).toEqual({ ok: false, reason: 'stale' });
    const edge = await signed(BODY, SECRET, String(NOW - RESEND_WEBHOOK_TOLERANCE_SECONDS));
    expect((await verifyResendWebhook(edge, BODY, SECRET, NOW)).ok).toBe(true);
  });

  it('refuses missing headers and a non-numeric timestamp', async () => {
    expect(await verifyResendWebhook(headers({}), BODY, SECRET, NOW)).toEqual({ ok: false, reason: 'missing_headers' });
    const h = headers({ 'svix-id': 'msg_1', 'svix-timestamp': 'yesterday', 'svix-signature': 'v1,x' });
    expect(await verifyResendWebhook(h, BODY, SECRET, NOW)).toEqual({ ok: false, reason: 'stale' });
  });

  it('reports a secret that is not base64 instead of throwing', async () => {
    expect(await verifyResendWebhook(await signed(), BODY, 'whsec_!!!not-base64', NOW)).toEqual({
      ok: false,
      reason: 'bad_secret',
    });
  });
});

describe('suppressionFromEvent', () => {
  const event = (type: string, data: Record<string, unknown>) => ({ type, data });

  it('suppresses the recipient of a permanent bounce', () => {
    expect(suppressionFromEvent(JSON.parse(BODY))).toEqual({ method: 'bounce', emails: ['buyer@example.com'] });
  });

  it('suppresses a bounce with no classification (Resend fires bounced once retries are over)', () => {
    expect(suppressionFromEvent(event('email.bounced', { to: ['a@example.com'] }))).toEqual({
      method: 'bounce',
      emails: ['a@example.com'],
    });
  });

  it('does not suppress a transient bounce', () => {
    const e = event('email.bounced', { to: ['a@example.com'], bounce: { type: 'Transient', subType: 'MailboxFull' } });
    expect(suppressionFromEvent(e)).toBeNull();
  });

  it('suppresses every recipient of a complaint, deduplicated, with display names stripped', () => {
    const e = event('email.complained', { to: ['Pat Buyer <Pat@Example.com>', 'pat@example.com', 'b@example.org'] });
    expect(suppressionFromEvent(e)).toEqual({ method: 'complaint', emails: ['Pat@Example.com', 'b@example.org'] });
  });

  it('accepts a single string recipient', () => {
    expect(suppressionFromEvent(event('email.complained', { to: 'c@example.com' }))?.emails).toEqual(['c@example.com']);
  });

  it('ignores other event types and malformed payloads', () => {
    for (const type of ['email.sent', 'email.delivered', 'email.opened', 'email.delivery_delayed', 'email.clicked']) {
      expect(suppressionFromEvent(event(type, { to: ['a@example.com'] }))).toBeNull();
    }
    expect(suppressionFromEvent(null)).toBeNull();
    expect(suppressionFromEvent({ type: 'email.bounced' })).toBeNull();
    expect(suppressionFromEvent(event('email.bounced', { to: ['not an address', 42] }))).toBeNull();
  });
});

describe('the webhook and the table agree', () => {
  const root = join(__dirname, '..', '..');
  const handler = readFileSync(join(root, 'functions', 'resend-webhook', 'index.ts'), 'utf8');
  const migration = readFileSync(join(root, 'migrations', '20261108000458_email_suppressions_bounces.sql'), 'utf8');

  it('verifies the signature before it parses the body or touches the database', () => {
    const verify = handler.indexOf('verifyResendWebhook(req.headers');
    expect(verify).toBeGreaterThan(-1);
    expect(verify).toBeLessThan(handler.indexOf('JSON.parse(rawBody)'));
    expect(verify).toBeLessThan(handler.indexOf('createClient('));
  });

  it('refuses an unsigned request with 401 before the secret check, so an unconfigured deploy is not a 5xx', () => {
    const unsigned = handler.indexOf("req.headers.get('svix-signature')");
    expect(unsigned).toBeGreaterThan(-1);
    expect(unsigned).toBeLessThan(handler.indexOf("Deno.env.get('RESEND_WEBHOOK_SECRET')"));
  });

  it('writes only source and method values the CHECK constraints allow', () => {
    expect(handler).toContain("source: 'resend'");
    expect(migration).toMatch(/CHECK \(source IN \('listing', 'bio', 'resend'\)\)/);
    expect(migration).toMatch(/CHECK \(method IN \('link', 'one_click', 'bounce', 'complaint'\)\)/);
  });

  it('stores the address by keyed hash, never in plaintext', () => {
    expect(handler).toContain('emailLookupHash(email, hashSecret)');
    expect(handler).not.toMatch(/email:\s*email/);
  });
});
