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
import { sendEmail, escapeHtml } from './email.ts';

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
