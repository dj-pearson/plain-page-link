import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import { createElement } from 'react';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { createTestQueryClient } from '@/test/test-utils';
import { createQueryBuilder, type MockQueryResult } from '@/test/mocks/supabase';
import { mockLead, mockLeadRow } from '@/test/fixtures/lead';
import { mockAuthenticatedUser } from '@/test/mocks/auth';

let queryResult: MockQueryResult;
let authUser: { id: string } | null;
const fromMock = vi.fn((_table: string) => createQueryBuilder(queryResult));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: (table: string) => fromMock(table) },
}));

vi.mock('@/stores/useAuthStore', () => ({
  useAuthStore: () => ({ user: authUser }),
}));

// Decryption is an Edge Function call, addressed by lead id since US-119. The
// hook's job is to zip the result back onto the rows; the crypto has its own
// tests in src/lib/pii.test.ts.
vi.mock('@/lib/pii', async () => {
  const { mockLead } = await import('@/test/fixtures/lead');
  return {
    encryptPIIBatch: vi.fn(async (values: (string | null)[]) => values),
    decryptLeadContacts: vi.fn(
      async (ids: string[]) =>
        new Map(ids.map((id) => [id, { id, email: mockLead.email, phone: mockLead.phone }]))
    ),
  };
});

import { useLeads } from './useLeads';

const wrapper = ({ children }: { children: ReactNode }) =>
  createElement(QueryClientProvider, { client: createTestQueryClient() }, children);

describe('useLeads', () => {
  beforeEach(() => {
    fromMock.mockClear();
    authUser = { id: mockAuthenticatedUser.id };
    // A stored row, not the decrypted app shape — see mockLeadRow.
    queryResult = { data: [mockLeadRow], error: null };
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
