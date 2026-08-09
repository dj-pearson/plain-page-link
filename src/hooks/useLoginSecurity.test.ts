import { describe, it, expect, vi, beforeEach } from 'vitest';

const invoke = vi.fn();

vi.mock('@/lib/edgeFunctions', () => ({
  edgeFunctions: { invoke: (...args: unknown[]) => invoke(...args) },
}));
vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

const { checkLoginThrottle } = await import('./useLoginSecurity');

describe('checkLoginThrottle (US-079)', () => {
  // Block body, not a concise one: `() => invoke.mockReset()` returns the mock
  // itself, and vitest treats a function returned from a hook as a teardown
  // callback — so it would CALL the mock after each test, which surfaces the
  // throwing implementation below as an unhandled rejection.
  beforeEach(() => {
    invoke.mockReset();
  });

  it('reports a block when the function returns one', async () => {
    // The regression this guards: login-security used to answer HTTP 429 when
    // an account was throttled. callEdgeFunction throws on any non-2xx, so the
    // caller saw { data: null, error } and the fail-open branch below turned
    // the block into blocked: false — the one verdict the throttle exists to
    // produce was the one it discarded, and Login.tsx's `if (blocked)` was
    // unreachable. The verdict now comes back 200 with the state in the body.
    const blockedUntil = new Date(Date.now() + 15 * 60_000).toISOString();
    invoke.mockResolvedValue({
      data: {
        success: true,
        blocked: true,
        attemptsRemaining: 0,
        blockedUntil,
        reason: 'too_many_attempts',
      },
      error: null,
    });

    const result = await checkLoginThrottle('Person@Example.com ');

    expect(result.blocked).toBe(true);
    expect(result.attemptsRemaining).toBe(0);
    expect(result.blockedUntil).toBe(blockedUntil);
  });

  it('normalises the email before asking', async () => {
    invoke.mockResolvedValue({ data: { blocked: false, attemptsRemaining: 4 }, error: null });

    await checkLoginThrottle('  Person@Example.COM  ');

    expect(invoke).toHaveBeenCalledWith(
      'login-security',
      expect.objectContaining({
        body: expect.objectContaining({ action: 'check_throttle', email: 'person@example.com' }),
      })
    );
  });

  it('lets the attempt through when the check itself fails', async () => {
    // Deliberate: a throttle that cannot be reached must not lock every user
    // out of the product. This is the branch that used to swallow the 429 —
    // it is correct for a genuine transport failure and only for that.
    invoke.mockResolvedValue({ data: null, error: new Error('network down') });

    const result = await checkLoginThrottle('person@example.com');

    expect(result.blocked).toBe(false);
    expect(result.success).toBe(false);
  });

  it('lets the attempt through when the call throws', async () => {
    invoke.mockImplementation(async () => {
      throw new Error('boom');
    });

    const result = await checkLoginThrottle('person@example.com');

    expect(result.blocked).toBe(false);
  });
});
