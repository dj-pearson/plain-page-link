import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import { createElement } from 'react';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { createTestQueryClient } from '@/test/test-utils';
import { createQueryBuilder, type MockQueryResult } from '@/test/mocks/supabase';
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

import { useListings } from './useListings';

const listingRow = {
  id: 'l1',
  user_id: mockAuthenticatedUser.id,
  address: '1 Main St',
  city: 'Town',
  price: '100000',
  beds: 3,
  baths: 2,
  status: 'active',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

const wrapper = ({ children }: { children: ReactNode }) =>
  createElement(QueryClientProvider, { client: createTestQueryClient() }, children);

describe('useListings', () => {
  beforeEach(() => {
    fromMock.mockClear();
    authUser = { id: mockAuthenticatedUser.id };
    queryResult = { data: [listingRow], error: null };
  });

  it('fetches listings for the authenticated user', async () => {
    const { result } = renderHook(() => useListings(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.listings).toHaveLength(1);
    expect(fromMock).toHaveBeenCalledWith('listings');
  });

  it('returns an empty list when unauthenticated', async () => {
    authUser = null;
    const { result } = renderHook(() => useListings(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.listings).toEqual([]);
    expect(fromMock).not.toHaveBeenCalled();
  });

  it('exposes CRUD mutations', async () => {
    const { result } = renderHook(() => useListings(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(typeof result.current.addListing.mutateAsync).toBe('function');
    expect(typeof result.current.updateListing.mutateAsync).toBe('function');
    expect(typeof result.current.deleteListing.mutateAsync).toBe('function');
  });

  it('addListing inserts and resolves with the new row', async () => {
    queryResult = { data: listingRow, error: null };
    const { result } = renderHook(() => useListings(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    let returned: unknown;
    await act(async () => {
      returned = await result.current.addListing.mutateAsync({
        address: '1 Main St',
      });
    });
    expect(returned).toEqual(listingRow);
  });
});
