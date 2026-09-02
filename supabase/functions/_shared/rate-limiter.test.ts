/**
 * US-098: every one of these checks failed, and every one failed open.
 *
 * checkRateLimitDb called check_rate_limit with p_ip_address / p_endpoint —
 * the column names of an orphaned `rate_limits` table — while the function
 * takes p_identifier / p_limit_type. PostgREST resolves an RPC by its named
 * arguments, so that is a 404, the error branch returned allowed: true, and
 * thirteen edge functions believed they were rate limited when no check had
 * ever succeeded.
 *
 * Two things are worth holding to a test: the argument names sent, and what
 * happens when the call fails. Neither is visible to tsc.
 *
 * Runs under vitest via the supabase/functions/**\/*.test.ts include — the
 * module's only import is `import type`, which is erased, so nothing here
 * needs Deno.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkRateLimitDb, RATE_LIMITS } from './rate-limiter.ts';

type RpcResult = { data: unknown; error: { message: string } | null };

const clientReturning = (result: RpcResult | (() => Promise<RpcResult>)) => ({
  rpc: vi.fn(() => (typeof result === 'function' ? result() : Promise.resolve(result))),
});

const allowedRow = {
  data: [{ allowed: true, remaining: 4, reset_at: new Date(Date.now() + 60_000).toISOString() }],
  error: null,
};

describe('checkRateLimitDb', () => {
  beforeEach(() => vi.spyOn(console, 'error').mockImplementation(() => undefined));

  it('calls check_rate_limit with the parameter names the function actually has', async () => {
    const client = clientReturning(allowedRow);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await checkRateLimitDb(client as any, '198.51.100.7', 'submit-lead', RATE_LIMITS.submission);

    expect(client.rpc).toHaveBeenCalledWith('check_rate_limit', {
      p_identifier: '198.51.100.7',
      p_limit_type: 'submit-lead',
      p_max_requests: 5,
      p_window_seconds: 60,
    });
  });

  it('substitutes "unknown" for an empty identifier rather than sending an empty string', async () => {
    const client = clientReturning(allowedRow);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await checkRateLimitDb(client as any, '', 'submit-lead', RATE_LIMITS.submission);

    expect(client.rpc.mock.calls[0][1]).toMatchObject({ p_identifier: 'unknown' });
  });

  it('passes a refusal through', async () => {
    const client = clientReturning({
      data: [{ allowed: false, remaining: 0, reset_at: new Date(Date.now() + 30_000).toISOString() }],
      error: null,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = await checkRateLimitDb(client as any, 'ip', 'submit-lead', RATE_LIMITS.submission);

    expect(r.allowed).toBe(false);
    expect(r.remaining).toBe(0);
    expect(r.retryAfterSeconds).toBeGreaterThan(0);
  });

  describe('when the database call fails', () => {
    const notFound = { data: null, error: { message: 'Could not find the function' } };

    it.each([
      ['submission', RATE_LIMITS.submission],
      ['auth', RATE_LIMITS.auth],
    ])('refuses the request for the %s preset', async (_name, config) => {
      const client = clientReturning(notFound);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const r = await checkRateLimitDb(client as any, 'ip', 'submit-lead', config);

      expect(r.allowed).toBe(false);
      expect(r.remaining).toBe(0);
    });

    it('allows the request for the general preset, so a read endpoint stays up', async () => {
      const client = clientReturning(notFound);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const r = await checkRateLimitDb(client as any, 'ip', 'pii-crypto', RATE_LIMITS.general);

      expect(r.allowed).toBe(true);
    });

    it('logs the PostgREST message rather than swallowing it', async () => {
      const client = clientReturning(notFound);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await checkRateLimitDb(client as any, 'ip', 'submit-lead', RATE_LIMITS.submission);

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Could not find the function')
      );
      expect(console.error).toHaveBeenCalledWith(expect.stringContaining('failing closed'));
    });

    it('treats a thrown exception the same as a returned error', async () => {
      const client = clientReturning(() => Promise.reject(new Error('network down')));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const r = await checkRateLimitDb(client as any, 'ip', 'submit-lead', RATE_LIMITS.auth);

      expect(r.allowed).toBe(false);
      expect(console.error).toHaveBeenCalledWith(expect.stringContaining('network down'));
    });

    it('treats an empty result set as a failure, not as an allowance', async () => {
      const client = clientReturning({ data: [], error: null });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const r = await checkRateLimitDb(client as any, 'ip', 'submit-lead', RATE_LIMITS.submission);

      expect(r.allowed).toBe(false);
    });
  });
});
