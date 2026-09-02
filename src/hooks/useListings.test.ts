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
const fromMock = vi.fn((_table: string) => createQueryBuilder(queryResult));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: (table: string) => fromMock(table) },
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
  bedrooms: 3,
  bathrooms: 2,
  square_feet: 1800,
  // Derived from the three above since US-106; present on a row, never written.
  beds: 3,
  baths: 2,
  sqft: 1800,
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
      // NewListing is the table's Insert type, so the NOT NULL columns are
      // required here rather than discovered at the database.
      returned = await result.current.addListing.mutateAsync({
        address: '1 Main St',
        city: 'Town',
        price: '100000',
        beds: 3,
        baths: 2,
      });
    });
    expect(returned).toEqual(listingRow);
  });

  /**
   * US-106: create wrote beds/baths/sqft AND bedrooms/bathrooms/square_feet,
   * while edit wrote only the integers. The public read normalised with
   * `bedrooms ?? beds`, so the STALE value won — an agent changed 3 beds to 4,
   * saved, and their clients went on seeing 3.
   *
   * beds/baths/sqft are GENERATED columns now, so naming them in a write is a
   * database error rather than a silent divergence. These assert the payload.
   */
  describe('the beds/bedrooms round trip', () => {
    const writesFrom = (call: unknown[]) => call[0] as Record<string, unknown>;

    it('edits the canonical columns and never the derived ones', async () => {
      const builder = createQueryBuilder({ data: [listingRow], error: null });
      fromMock.mockImplementation(() => builder);

      const { result } = renderHook(() => useListings(), { wrapper });
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.updateListing.mutateAsync({
          id: 'l1',
          bedrooms: 4,
          bathrooms: 2.5,
          square_feet: 2400,
        });
      });

      const update = writesFrom((builder.update as ReturnType<typeof vi.fn>).mock.calls[0]);
      expect(update).toMatchObject({ bedrooms: 4, bathrooms: 2.5, square_feet: 2400 });
      // Writing these would raise: they can only be updated to DEFAULT.
      expect(update).not.toHaveProperty('beds');
      expect(update).not.toHaveProperty('baths');
      expect(update).not.toHaveProperty('sqft');
    });

    it('creates with the canonical columns only', async () => {
      const builder = createQueryBuilder({ data: listingRow, error: null });
      fromMock.mockImplementation(() => builder);

      const { result } = renderHook(() => useListings(), { wrapper });
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.addListing.mutateAsync({
          address: '2 Oak St',
          city: 'Town',
          price: '200000',
          bedrooms: 4,
          bathrooms: 2.5,
          square_feet: 2400,
        });
      });

      const insert = writesFrom((builder.insert as ReturnType<typeof vi.fn>).mock.calls[0]);
      expect(insert).toMatchObject({ bedrooms: 4, bathrooms: 2.5 });
      expect(insert).not.toHaveProperty('beds');
      expect(insert).not.toHaveProperty('baths');
      expect(insert).not.toHaveProperty('sqft');
    });
  });
});
