import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import { createElement } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { createTestQueryClient } from '@/test/test-utils';
import { createQueryBuilder, type MockQueryResult } from '@/test/mocks/supabase';
import { mockProfile } from '@/test/fixtures/profile';
import { mockAuthenticatedUser } from '@/test/mocks/auth';

let queryResult: MockQueryResult;
let authUser: { id: string } | null;
const fromMock = vi.fn(() => createQueryBuilder(queryResult));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: (...args: unknown[]) => fromMock(...args) },
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
    authUser = { id: mockAuthenticatedUser.id };
    queryResult = { data: mockProfile, error: null };
  });

  it('fetches the profile for the authenticated user', async () => {
    const { result } = renderHook(() => useProfile(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.profile).toEqual(mockProfile);
    expect(fromMock).toHaveBeenCalledWith('profiles');
  });

  it('does not fetch when there is no authenticated user', async () => {
    authUser = null;
    const { result } = renderHook(() => useProfile(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.profile).toBeUndefined();
    expect(fromMock).not.toHaveBeenCalled();
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
});
