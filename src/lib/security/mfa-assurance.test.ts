import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * US-085: the MFA half of getSecurityContext.
 *
 * These cover the decision that used to be `let isMFAVerified = true` with the
 * comment "For now, assume verified if they got past login" — which made
 * SecureRoute's requireMFA prop a no-op for every user, enrolled or not.
 *
 * The enrol/challenge/verify round trip itself is not covered here: it needs a
 * real GoTrue, and there is none in this environment. What IS covered is every
 * branch of how the answer is derived from what GoTrue reports, including the
 * error path — because "fails closed" is a claim worth holding to a test.
 */

const getAuthenticatorAssuranceLevel = vi.fn();
const maybeSingle = vi.fn();
const getSession = vi.fn();
const getUser = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: () => getSession(),
      getUser: () => getUser(),
      mfa: {
        getAuthenticatorAssuranceLevel: () => getAuthenticatorAssuranceLevel(),
      },
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: () => maybeSingle(),
          order: () => ({ limit: () => ({ maybeSingle: () => maybeSingle() }) }),
        }),
      }),
    }),
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import { getSecurityContext, clearAuthCache } from './authentication';

const USER = { id: 'user-1', email: 'agent@example.test' };

const signedIn = () => {
  const session = {
    access_token: 'token',
    user: USER,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
  };
  getSession.mockResolvedValue({ data: { session }, error: null });
  getUser.mockResolvedValue({ data: { user: USER }, error: null });
};

describe('getSecurityContext MFA assurance (US-085)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // getAuthState caches the session for 30s at module scope, so without this
    // each test would read whatever the previous one signed in as.
    clearAuthCache();
    signedIn();
    maybeSingle.mockResolvedValue({ data: null, error: null });
  });

  it('treats a user with no second factor as verified', async () => {
    // nextLevel 'aal1' means there is no factor to challenge, so there is
    // nothing outstanding.
    getAuthenticatorAssuranceLevel.mockResolvedValue({
      data: { currentLevel: 'aal1', nextLevel: 'aal1' },
      error: null,
    });

    const context = await getSecurityContext();
    expect(context.isMFAVerified).toBe(true);
  });

  it('treats an enrolled user who has not completed the challenge as unverified', async () => {
    // This is the case the story is about: the session is real, but aal1.
    getAuthenticatorAssuranceLevel.mockResolvedValue({
      data: { currentLevel: 'aal1', nextLevel: 'aal2' },
      error: null,
    });

    const context = await getSecurityContext();
    expect(context.isMFAVerified).toBe(false);
  });

  it('treats an enrolled user who has completed the challenge as verified', async () => {
    getAuthenticatorAssuranceLevel.mockResolvedValue({
      data: { currentLevel: 'aal2', nextLevel: 'aal2' },
      error: null,
    });

    const context = await getSecurityContext();
    expect(context.isMFAVerified).toBe(true);
  });

  it('treats a legacy enrolment as outstanding until the session reaches aal2', async () => {
    // A pre-US-085 enrolment has no native factor, so the token reports aal1
    // and cannot express the requirement. Failing closed is the right side to
    // err on for someone who deliberately turned MFA on.
    getAuthenticatorAssuranceLevel.mockResolvedValue({
      data: { currentLevel: 'aal1', nextLevel: 'aal1' },
      error: null,
    });
    maybeSingle.mockResolvedValue({
      data: { mfa_enabled: true, verified_at: '2026-01-01T00:00:00Z' },
      error: null,
    });

    const context = await getSecurityContext();
    expect(context.isMFAVerified).toBe(false);
  });

  it('fails closed when the assurance level cannot be read', async () => {
    // The previous implementation defaulted to verified on any error. That is
    // the assumption this change exists to remove, so it is worth a test of
    // its own.
    getAuthenticatorAssuranceLevel.mockRejectedValue(new Error('network down'));

    const context = await getSecurityContext();
    expect(context.isMFAVerified).toBe(false);
  });

  it('reports an unauthenticated caller as unverified', async () => {
    getSession.mockResolvedValue({ data: { session: null }, error: null });
    getUser.mockResolvedValue({ data: { user: null }, error: null });

    const context = await getSecurityContext();
    expect(context.isAuthenticated).toBe(false);
    expect(context.isMFAVerified).toBe(false);
  });
});
