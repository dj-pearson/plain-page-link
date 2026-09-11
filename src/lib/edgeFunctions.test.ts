/**
 * US-197: the failure a visitor is shown when an edge function rejects them.
 *
 * Every fixture below is produced by `supabase/functions/_shared/response.ts`
 * verbatim — the same helpers the 23 functions that import it call. The old
 * client read `errorJson.error`, which is an OBJECT in all of them, assigned it
 * to a string and threw `new Error(object)`. `.message` was "[object Object]",
 * and that is what BuyerInquiryForm, SellerInquiryForm, HomeValuationForm and
 * ContactForm put in their destructive toast.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { auth: { getSession: vi.fn().mockResolvedValue({ data: { session: null } }) } },
  supabaseConfig: { functionsUrl: 'https://functions.example.test' },
}));

import { EdgeFunctionError, callEdgeFunction } from './edgeFunctions';

/** What `rateLimitResponse(90, req)` puts on the wire. */
const rateLimited = () =>
  new Response(
    JSON.stringify({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests. Please try again later.',
        details: { retryAfter: 90 },
      },
    }),
    { status: 429, headers: { 'Content-Type': 'application/json', 'Retry-After': '90' } }
  );

/** What `validationError({ email: '...' }, req)` puts on the wire. */
const invalid = () =>
  new Response(
    JSON.stringify({
      success: false,
      error: {
        code: 'REQUEST_VALIDATION_FAILED',
        message: 'Validation failed',
        details: { email: 'Invalid email address' },
      },
    }),
    { status: 400, headers: { 'Content-Type': 'application/json' } }
  );

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const call = () => callEdgeFunction('submit-lead', { body: {}, auth: false });

describe('callEdgeFunction error handling', () => {
  it('shows the rate limit message, not "[object Object]"', async () => {
    fetchMock.mockResolvedValue(rateLimited());
    await expect(call()).rejects.toThrow('Too many requests. Please try again later.');
  });

  it('never lets an object reach Error(), whatever the shape', async () => {
    for (const make of [rateLimited, invalid]) {
      fetchMock.mockResolvedValue(make());
      await expect(call()).rejects.not.toThrow('[object Object]');
    }
  });

  it('carries the code, status and retry window the response sent', async () => {
    fetchMock.mockResolvedValue(rateLimited());
    const error = await call().catch((e) => e);
    expect(error).toBeInstanceOf(EdgeFunctionError);
    expect(error.code).toBe('RATE_LIMIT_EXCEEDED');
    expect(error.status).toBe(429);
    expect(error.retryAfterSeconds).toBe(90);
    expect(error.functionName).toBe('submit-lead');
  });

  it('reads the retry window from details when a proxy strips Retry-After', async () => {
    const body = await rateLimited().text();
    fetchMock.mockResolvedValue(new Response(body, { status: 429 }));
    const error = await call().catch((e) => e);
    expect(error.retryAfterSeconds).toBe(90);
  });

  it('names the field a validation failure is about', async () => {
    fetchMock.mockResolvedValue(invalid());
    // "Validation failed" alone does not tell the visitor which of eight
    // fields to correct.
    await expect(call()).rejects.toThrow(/email: Invalid email address/);
  });

  it('bounds the fields it lists so a toast stays a toast', async () => {
    const details = Object.fromEntries(
      Array.from({ length: 12 }, (_, i) => [`field${i}`, `is required`])
    );
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          success: false,
          error: { code: 'REQUEST_VALIDATION_FAILED', message: 'Validation failed', details },
        }),
        { status: 400 }
      )
    );
    const error = await call().catch((e) => e);
    expect(error.message.split('; ')).toHaveLength(5);
  });

  it('still reads the older { error: "message" } shape', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ error: 'Username is already taken' }), { status: 409 })
    );
    await expect(call()).rejects.toThrow('Username is already taken');
  });

  it('does not paste a proxy HTML error page into the message', async () => {
    fetchMock.mockResolvedValue(
      new Response('<html><head><title>502 Bad Gateway</title></head><body>...</body></html>', {
        status: 502,
        statusText: 'Bad Gateway',
      })
    );
    const error = await call().catch((e) => e);
    expect(error.message).not.toContain('<html>');
    expect(error.message).toContain('502');
  });

  it('keeps a short plain-text failure body', async () => {
    fetchMock.mockResolvedValue(new Response('Function not found', { status: 404 }));
    await expect(call()).rejects.toThrow('Function not found');
  });

  it('falls back to the status line for an empty body', async () => {
    fetchMock.mockResolvedValue(new Response('', { status: 500, statusText: 'Internal Error' }));
    await expect(call()).rejects.toThrow(/submit-lead.*500/);
  });

  it('unwraps { success, data } on the happy path', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ success: true, data: { lead_id: 'abc' } }), { status: 200 })
    );
    await expect(call()).resolves.toEqual({ lead_id: 'abc' });
  });
});
