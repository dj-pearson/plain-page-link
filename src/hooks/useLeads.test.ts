import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import { createElement } from 'react';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { createTestQueryClient } from '@/test/test-utils';
import { createQueryBuilder, type MockQueryResult } from '@/test/mocks/supabase';
import { mockLead } from '@/test/fixtures/lead';
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

import { useLeads } from './useLeads';

const wrapper = ({ children }: { children: ReactNode }) =>
  createElement(QueryClientProvider, { client: createTestQueryClient() }, children);

describe('useLeads', () => {
  beforeEach(() => {
    fromMock.mockClear();
    authUser = { id: mockAuthenticatedUser.id };
    queryResult = { data: [mockLead], error: null };
  });

  it('fetches leads for the authenticated user', async () => {
    const { result } = renderHook(() => useLeads(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.leads).toHaveLength(1);
    expect(result.current.leads[0].email).toBe(mockLead.email);
    expect(fromMock).toHaveBeenCalledWith('leads');
  });

  it('returns an empty list when unauthenticated', async () => {
    authUser = null;
    const { result } = renderHook(() => useLeads(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.leads).toEqual([]);
  });

  it('surfaces an error state when the query fails', async () => {
    queryResult = { data: null, error: { message: 'boom' } };
    const { result } = renderHook(() => useLeads(), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it('updateLead resolves with the updated row', async () => {
    const updated = { ...mockLead, status: 'contacted' };
    queryResult = { data: updated, error: null };
    const { result } = renderHook(() => useLeads(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    let returned: unknown;
    await act(async () => {
      returned = await result.current.updateLead.mutateAsync({
        id: mockLead.id,
        status: 'contacted',
      });
    });
    expect(returned).toEqual(updated);
  });
});
