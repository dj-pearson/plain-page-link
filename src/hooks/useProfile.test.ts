import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import { createElement } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { createTestQueryClient } from '@/test/test-utils';
import { createQueryBuilder, type MockQueryResult } from '@/test/mocks/supabase';
import { mockProfile } from '@/test/fixtures/profile';
import { mockAuthenticatedUser } from '@/test/mocks/auth';

const CIPHERTEXT = 'enc:v1:eyJjaXBoZXJ0ZXh0IjoiYWJjIn0=';

interface InvokeOpts {
  body: { op: string; values?: string[] };
}

let queryResult: MockQueryResult;
let authUser: { id: string } | null;
let decryptReply: { data: { phone: string | null } | null; error: Error | null };
const updatePayloads: unknown[] = [];
const invokeOps: string[] = [];
const fromMock = vi.fn((_table: string) => {
  const builder = createQueryBuilder({ data: { id: mockAuthenticatedUser.id }, error: null });
  builder.update = vi.fn((payload: unknown) => {
    updatePayloads.push(payload);
    return builder;
  });
  return builder;
});
const rpcMock = vi.fn((_fn: string) => createQueryBuilder(queryResult));
const invokeMock = vi.fn(async (_name: string, opts: InvokeOpts) => {
  invokeOps.push(opts.body.op);
  if (opts.body.op === 'encrypt') {
    return { data: { values: (opts.body.values ?? []).map((v) => `enc:v1:${v}`) }, error: null };
  }
  return decryptReply;
});

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (table: string) => fromMock(table),
    rpc: (fn: string) => rpcMock(fn),
    functions: {
      invoke: (name: string, opts: InvokeOpts) => invokeMock(name, opts),
    },
  },
}));

vi.mock('@/stores/useAuthStore', () => ({
  useAuthStore: () => ({ user: authUser }),
}));

vi.mock('@/lib/audit', () => ({ logAuditEvent: vi.fn() }));

import { useProfile } from './useProfile';

const wrapper = ({ children }: { children: ReactNode }) =>
  createElement(QueryClientProvider, { client: createTestQueryClient() }, children);

describe('useProfile', () => {
  beforeEach(() => {
    fromMock.mockClear();
    rpcMock.mockClear();
    invokeMock.mockClear();
    updatePayloads.length = 0;
    invokeOps.length = 0;
    authUser = { id: mockAuthenticatedUser.id };
    // The row as get_own_profile returns it: phone is ciphertext at rest.
    queryResult = { data: { ...mockProfile, phone: CIPHERTEXT }, error: null };
    decryptReply = { data: { phone: mockProfile.phone }, error: null };
  });

  it('fetches the profile for the authenticated user, phone decrypted', async () => {
    const { result } = renderHook(() => useProfile(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.profile).toEqual({ ...mockProfile, phoneUnavailable: false });
    // US-235: the owner's private columns come through get_own_profile —
    // authenticated can select only the public columns of profiles.
    expect(rpcMock).toHaveBeenCalledWith('get_own_profile');
    expect(fromMock).not.toHaveBeenCalled();
    expect(invokeOps).toEqual(['decrypt_profile']);
  });

  it('does not fetch when there is no authenticated user', async () => {
    authUser = null;
    const { result } = renderHook(() => useProfile(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.profile).toBeUndefined();
    expect(fromMock).not.toHaveBeenCalled();
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it('surfaces an error state when the query fails', async () => {
    queryResult = { data: null, error: { message: 'db error' } };
    const { result } = renderHook(() => useProfile(), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.profile).toBeUndefined();
  });

  it('exposes an updateProfile mutation', async () => {
    const { result } = renderHook(() => useProfile(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(typeof result.current.updateProfile.mutateAsync).toBe('function');
  });

  // US-237: a failed decrypt used to fall back to the stored column, which is
  // ciphertext — the form showed it and a save encrypted it a second time.
  describe('when the phone cannot be decrypted', () => {
    it('loads the profile with no phone, flagged unavailable, never the ciphertext', async () => {
      decryptReply = { data: null, error: new Error('pii-crypto unreachable') };
      const { result } = renderHook(() => useProfile(), { wrapper });
      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(result.current.isError).toBe(false);
      expect(result.current.profile?.full_name).toBe(mockProfile.full_name);
      expect(result.current.profile?.phone).toBeNull();
      expect(result.current.profile?.phoneUnavailable).toBe(true);
    });

    it('treats a value handed back still encrypted as a failure too', async () => {
      decryptReply = { data: { phone: CIPHERTEXT }, error: null };
      const { result } = renderHook(() => useProfile(), { wrapper });
      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(result.current.profile?.phone).toBeNull();
      expect(result.current.profile?.phoneUnavailable).toBe(true);
    });
  });

  describe('updateProfile', () => {
    it('encrypts a plaintext phone before saving', async () => {
      const { result } = renderHook(() => useProfile(), { wrapper });
      await waitFor(() => expect(result.current.isLoading).toBe(false));
      await result.current.updateProfile.mutateAsync({ phone: '(555) 555-0199' });
      expect(updatePayloads).toEqual([{ phone: 'enc:v1:(555) 555-0199' }]);
    });

    it('never encrypts a ciphertext again — it leaves phone out of the save', async () => {
      const { result } = renderHook(() => useProfile(), { wrapper });
      await waitFor(() => expect(result.current.isLoading).toBe(false));
      invokeOps.length = 0;
      await result.current.updateProfile.mutateAsync({ bio: 'New bio', phone: CIPHERTEXT });
      expect(updatePayloads).toEqual([{ bio: 'New bio' }]);
      expect(invokeOps).not.toContain('encrypt');
    });
  });
});
