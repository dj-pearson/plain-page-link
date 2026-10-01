/**
 * US-099: sendEmail returned void and swallowed every failure — a missing
 * RESEND_API_KEY, a 4xx from Resend, a network error. notify-lead therefore
 * logged 'lead_notification_sent' with status 'success' without knowing
 * whether anything had been sent.
 *
 * These assert the reported outcome, which is the part a caller can act on.
 *
 * Runs under vitest via the supabase/functions/**\/*.test.ts include. The
 * module reads Deno.env inside the function rather than at module scope, so a
 * stubbed global is enough — no Deno runtime needed.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { sendEmail, escapeHtml, createLeadAutoReply } from './email.ts';

const env: Record<string, string> = {};

beforeEach(() => {
  for (const k of Object.keys(env)) delete env[k];
  (globalThis as Record<string, unknown>).Deno = { env: { get: (k: string) => env[k] } };
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
  vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  vi.spyOn(console, 'log').mockImplementation(() => undefined);
});

afterEach(() => {
  delete (globalThis as Record<string, unknown>).Deno;
  vi.restoreAllMocks();
});

const message = { to: 'agent@example.com', subject: 'New lead', body: 'Name: Dana' };

describe('sendEmail', () => {
  it('reports failure, not success, when RESEND_API_KEY is missing', async () => {
    const result = await sendEmail(message);

    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/RESEND_API_KEY/);
  });

  it('logs a missing key at error level in production', async () => {
    env.ENVIRONMENT = 'production';
    await sendEmail(message);

    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('RESEND_API_KEY'));
    expect(console.warn).not.toHaveBeenCalled();
  });

  it('keeps a missing key a warning outside production, so local dev needs no key', async () => {
    await sendEmail(message);

    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('non-production'));
    expect(console.error).not.toHaveBeenCalled();
  });

  it('returns the provider id on a successful send', async () => {
    env.RESEND_API_KEY = 'test-key';
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({ id: 're_123' }) }))
    );

    const result = await sendEmail(message);

    expect(result).toEqual({ ok: true, providerId: 're_123' });
  });

  it('reports the provider error rather than swallowing it', async () => {
    env.RESEND_API_KEY = 'test-key';
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({ ok: false, status: 422, text: () => Promise.resolve('invalid to field') })
      )
    );

    const result = await sendEmail(message);

    expect(result.ok).toBe(false);
    expect(result.error).toContain('422');
    expect(result.error).toContain('invalid to field');
  });

  it('never throws on a network error, but does report one', async () => {
    env.RESEND_API_KEY = 'test-key';
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('ECONNRESET'))));

    const result = await sendEmail(message);

    expect(result).toEqual({ ok: false, error: 'ECONNRESET' });
  });
});

describe('escapeHtml', () => {
  it('neutralises markup from a public intake form', () => {
    expect(escapeHtml('<script>alert(1)</script>')).toBe(
      '&lt;script&gt;alert(1)&lt;/script&gt;'
    );
  });

  it('returns an empty string for null and undefined', () => {
    expect(escapeHtml(null)).toBe('');
    expect(escapeHtml(undefined)).toBe('');
  });
});

describe('createLeadAutoReply (US-229)', () => {
  const base = {
    to: 'dana@example.com',
    leadName: 'Dana',
    leadType: 'buyer',
    agent: { name: 'Jane Agent', replyTo: 'jane@realty.example', phone: '(555) 123-4567' },
  };

  it('replies reach the agent, and the agent can be called', () => {
    const mail = createLeadAutoReply(base);
    expect(mail.replyTo).toBe('jane@realty.example');
    expect(mail.body).toContain('(555) 123-4567');
    expect(mail.html).toContain('tel:5551234567');
  });

  it('carries the booking link and the listing when there are some', () => {
    const mail = createLeadAutoReply({
      ...base,
      agent: { ...base.agent, calendlyUrl: 'https://calendly.com/jane', profileUrl: 'https://agentbio.net/jane' },
      listing: { address: '12 Maple Ave', url: 'https://agentbio.net/jane?listing=abc' },
    });
    expect(mail.body).toContain('https://calendly.com/jane');
    expect(mail.html).toContain('12 Maple Ave');
    expect(mail.html).toContain('https://agentbio.net/jane?listing=abc');
  });

  it('works without optional fields, and never promises a phone it does not have', () => {
    const mail = createLeadAutoReply({ ...base, agent: { name: 'Jane Agent' } });
    expect(mail.replyTo).toBeUndefined();
    expect(mail.body).not.toMatch(/call or text/i);
    expect(mail.html).not.toContain('calendly');
  });

  it('escapes visitor and agent text, and drops non-http links', () => {
    const mail = createLeadAutoReply({
      ...base,
      leadName: '<script>x</script>',
      agent: { name: 'Jane', calendlyUrl: 'javascript:alert(1)' },
    });
    expect(mail.html).not.toContain('<script>');
    expect(mail.html).not.toContain('javascript:');
  });
});

describe('sendEmail reply-to (US-229)', () => {
  it('passes replyTo to Resend as reply_to', async () => {
    env.RESEND_API_KEY = 're_test';
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ id: 'm1' }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    await sendEmail({ ...message, replyTo: 'jane@realty.example' });
    const body = JSON.parse((fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1].body as string);
    expect(body.reply_to).toBe('jane@realty.example');
    vi.unstubAllGlobals();
  });
});
