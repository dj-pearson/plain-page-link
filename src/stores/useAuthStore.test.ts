/**
 * US-241: the auth store's profile after a username change and across
 * transient fetch errors.
 *
 *   - Settings saved a new username and invalidated ['profile'], but the
 *     dashboard header (copy / share / view page) reads the auth store, which
 *     nothing refreshed — it kept sharing the old, now-dead address.
 *   - The auth listener wrote toProfile(result.data) whatever the result, so a
 *     transient failure on SIGNED_IN / USER_UPDATED set profile to null.
 *   - INITIAL_SESSION, fired as soon as the listener subscribes, refetched the
 *     rows initialize() had just read.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';

type ProfileResult = {
  data: Record<string, unknown> | null;
  error: { code?: string; message?: string } | null;
};
type RolesResult = { data: { role: string }[] | null; error: { message: string } | null };

const h = vi.hoisted(() => ({
  fetchOwnProfile: vi.fn(),
  roles: vi.fn(),
  getSession: vi.fn(),
  listener: null as null | ((event: string, session: unknown) => void),
}));

vi.mock('@/lib/ownProfile', () => ({ fetchOwnProfile: () => h.fetchOwnProfile() }));
vi.mock('@/lib/audit', () => ({ logAuditEvent: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: () => h.getSession(),
      onAuthStateChange: (cb: (event: string, session: unknown) => void) => {
        h.listener = cb;
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      },
    },
    from: () => ({
      select: () => ({ eq: () => ({ order: () => h.roles() }) }),
    }),
  },
}));

const USER_A = { id: 'aaaaaaaa-0000-0000-0000-000000000000', email: 'a@example.test' };
const USER_B = { id: 'bbbbbbbb-0000-0000-0000-000000000000', email: 'b@example.test' };
const sessionFor = (user: { id: string; email: string }) => ({ user, access_token: 't' });

const row = (id: string, username: string) => ({
  id,
  username,
  full_name: 'Jane Doe',
  specialties: [],
  certifications: [],
  service_cities: [],
  service_zip_codes: [],
});

const ok = (data: Record<string, unknown>): ProfileResult => ({ data, error: null });
const transient: ProfileResult = {
  data: null,
  error: { code: '503', message: 'upstream timeout' },
};
const rolesOk: RolesResult = { data: [{ role: 'user' }], error: null };

/** A fresh store module per test: the listener guard is module state. */
async function loadStore() {
  vi.resetModules();
  h.listener = null;
  localStorage.clear();
  return (await import('./useAuthStore')).useAuthStore;
}

const fire = (event: AuthChangeEvent, session: unknown) => h.listener?.(event, session as Session);
const flush = () =>
  new Promise((r) => setTimeout(r, 0)).then(() => new Promise((r) => setTimeout(r, 0)));

beforeEach(() => {
  h.fetchOwnProfile.mockReset();
  h.roles.mockReset();
  h.getSession.mockReset();
  h.roles.mockResolvedValue(rolesOk);
});

describe('refreshProfile', () => {
  it('puts the saved username into the store, so header links use it', async () => {
    const store = await loadStore();
    h.getSession.mockResolvedValue({ data: { session: sessionFor(USER_A) } });
    h.fetchOwnProfile.mockResolvedValue(ok(row(USER_A.id, 'janedoe')));
    await store.getState().initialize();
    expect(store.getState().profile?.username).toBe('janedoe');

    h.fetchOwnProfile.mockResolvedValue(ok(row(USER_A.id, 'janerivers')));
    const profile = await store.getState().refreshProfile();

    expect(profile?.username).toBe('janerivers');
    expect(store.getState().profile?.username).toBe('janerivers');
  });

  it('keeps the profile when the read fails, and does not throw', async () => {
    const store = await loadStore();
    h.getSession.mockResolvedValue({ data: { session: sessionFor(USER_A) } });
    h.fetchOwnProfile.mockResolvedValue(ok(row(USER_A.id, 'janedoe')));
    await store.getState().initialize();

    h.fetchOwnProfile.mockResolvedValue(transient);
    await expect(store.getState().refreshProfile()).resolves.toMatchObject({ username: 'janedoe' });

    h.fetchOwnProfile.mockRejectedValue(new Error('offline'));
    await expect(store.getState().refreshProfile()).resolves.toMatchObject({ username: 'janedoe' });
    expect(store.getState().profile?.username).toBe('janedoe');
  });

  it('is a no-op when nobody is signed in', async () => {
    const store = await loadStore();
    await expect(store.getState().refreshProfile()).resolves.toBeNull();
    expect(h.fetchOwnProfile).not.toHaveBeenCalled();
  });
});

describe('auth listener', () => {
  async function signedInAsA() {
    const store = await loadStore();
    h.getSession.mockResolvedValue({ data: { session: sessionFor(USER_A) } });
    h.fetchOwnProfile.mockResolvedValue(ok(row(USER_A.id, 'janedoe')));
    await store.getState().initialize();
    expect(h.listener).not.toBeNull();
    h.fetchOwnProfile.mockClear();
    h.roles.mockClear();
    return store;
  }

  it.each(['SIGNED_IN', 'USER_UPDATED'] as const)(
    'keeps the profile on a transient fetch error after %s',
    async (event) => {
      const store = await signedInAsA();
      h.fetchOwnProfile.mockResolvedValue(transient);
      h.roles.mockResolvedValue({ data: null, error: { message: 'timeout' } });

      fire(event, sessionFor(USER_A));
      await flush();

      expect(h.fetchOwnProfile).toHaveBeenCalledTimes(1);
      expect(store.getState().profile?.username).toBe('janedoe');
      expect(store.getState().role).toBe('user');
    }
  );

  it('still clears the profile when the row is genuinely gone (PGRST116)', async () => {
    const store = await signedInAsA();
    h.fetchOwnProfile.mockResolvedValue({ data: null, error: { code: 'PGRST116' } });

    fire('USER_UPDATED', sessionFor(USER_A));
    await flush();

    expect(store.getState().profile).toBeNull();
  });

  it("does not keep one user's profile for another on a failed read", async () => {
    const store = await signedInAsA();
    h.fetchOwnProfile.mockResolvedValue(transient);

    fire('SIGNED_IN', sessionFor(USER_B));
    await flush();

    expect(store.getState().user?.id).toBe(USER_B.id);
    expect(store.getState().profile).toBeNull();
  });

  it('does not refetch on INITIAL_SESSION for the user initialize() loaded', async () => {
    const store = await signedInAsA();

    fire('INITIAL_SESSION', sessionFor(USER_A));
    await flush();

    expect(h.fetchOwnProfile).not.toHaveBeenCalled();
    expect(h.roles).not.toHaveBeenCalled();
    expect(store.getState().profile?.username).toBe('janedoe');
  });

  it('fetches on INITIAL_SESSION when initialize() loaded a different user', async () => {
    const store = await signedInAsA();
    h.fetchOwnProfile.mockResolvedValue(ok(row(USER_B.id, 'bob')));

    fire('INITIAL_SESSION', sessionFor(USER_B));
    await flush();

    expect(h.fetchOwnProfile).toHaveBeenCalledTimes(1);
    expect(store.getState().profile?.username).toBe('bob');
  });

  it("fetches on INITIAL_SESSION when initialize()'s profile read failed", async () => {
    const store = await loadStore();
    h.getSession.mockResolvedValue({ data: { session: sessionFor(USER_A) } });
    h.fetchOwnProfile.mockResolvedValue(transient);
    await store.getState().initialize();
    expect(store.getState().profile).toBeNull();

    h.fetchOwnProfile.mockResolvedValue(ok(row(USER_A.id, 'janedoe')));
    fire('INITIAL_SESSION', sessionFor(USER_A));
    await flush();

    expect(store.getState().profile?.username).toBe('janedoe');
  });

  it('fetches on INITIAL_SESSION when initialize() threw', async () => {
    const store = await loadStore();
    h.getSession
      .mockResolvedValueOnce({ data: { session: null } })
      .mockRejectedValueOnce(new Error('network'));
    await store.getState().initialize();

    h.fetchOwnProfile.mockResolvedValue(ok(row(USER_A.id, 'janedoe')));
    fire('INITIAL_SESSION', sessionFor(USER_A));
    await flush();

    expect(h.fetchOwnProfile).toHaveBeenCalledTimes(1);
    expect(store.getState().profile?.username).toBe('janedoe');
  });

  it('only skips the first INITIAL_SESSION: a later sign-in for the same user refetches', async () => {
    const store = await signedInAsA();
    fire('INITIAL_SESSION', sessionFor(USER_A));
    await flush();

    h.fetchOwnProfile.mockResolvedValue(ok(row(USER_A.id, 'janerivers')));
    fire('SIGNED_IN', sessionFor(USER_A));
    await flush();

    expect(h.fetchOwnProfile).toHaveBeenCalledTimes(1);
    expect(store.getState().profile?.username).toBe('janerivers');
  });
});
