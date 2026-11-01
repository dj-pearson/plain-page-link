import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import { createElement } from 'react';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClientProvider, type QueryClient } from '@tanstack/react-query';
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
  useAuthStore: <T>(select: (s: { user: typeof authUser }) => T) => select({ user: authUser }),
}));

vi.mock('@/lib/audit', () => ({ logAuditEvent: vi.fn() }));

import { useListings, type ListingUpdate, type NewListing } from './useListings';
import { logAuditEvent } from '@/lib/audit';

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
        bedrooms: 3,
        bathrooms: 2,
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

  /**
   * US-253: a drag called updateListing once per visible row — N requests, N
   * invalidations, N audit events — with positions numbered over the filtered
   * list. reorderListings takes only the changed rows.
   */
  describe('reorderListings', () => {
    const rows = [
      { ...listingRow, id: 'a', sort_order: 0 },
      { ...listingRow, id: 'b', sort_order: 1 },
      { ...listingRow, id: 'c', sort_order: 2 },
    ];
    let client: QueryClient;
    const clientWrapper = ({ children }: { children: ReactNode }) =>
      createElement(QueryClientProvider, { client }, children);
    const cachedIds = () =>
      (client.getQueryData<{ id: string }[]>(['listings', mockAuthenticatedUser.id]) ?? []).map(
        (l) => l.id
      );

    beforeEach(() => {
      client = createTestQueryClient();
      // Keep the cache alive between the fetch and the assertions.
      client.setDefaultOptions({ queries: { retry: false, gcTime: Infinity, staleTime: 0 } });
      queryResult = { data: rows, error: null };
      // The round-trip tests above leave a fixed builder installed.
      fromMock.mockImplementation(() => createQueryBuilder(queryResult));
      vi.mocked(logAuditEvent).mockClear();
    });

    it('writes one request per changed row, invalidates once and audits once', async () => {
      const { result } = renderHook(() => useListings(), { wrapper: clientWrapper });
      await waitFor(() => expect(result.current.listings).toHaveLength(3));

      const builder = createQueryBuilder({ data: null, error: null });
      fromMock.mockImplementation(() => builder);
      const invalidate = vi.spyOn(client, 'invalidateQueries');

      await act(async () => {
        await result.current.reorderListings.mutateAsync([
          { id: 'c', sort_order: 0 },
          { id: 'a', sort_order: 2 },
        ]);
      });

      const updates = (builder.update as ReturnType<typeof vi.fn>).mock.calls.map((c) => c[0]);
      expect(updates).toEqual([{ sort_order: 0 }, { sort_order: 2 }]);
      expect(invalidate).toHaveBeenCalledTimes(1);
      expect(logAuditEvent).toHaveBeenCalledTimes(1);
      expect(logAuditEvent).toHaveBeenCalledWith('listing_reorder', expect.anything());
      // Scoped to the owner, like every other write in the hook.
      expect(builder.eq).toHaveBeenCalledWith('user_id', mockAuthenticatedUser.id);
    });

    it('reorders the cache before the writes land', async () => {
      const { result } = renderHook(() => useListings(), { wrapper: clientWrapper });
      await waitFor(() => expect(result.current.listings).toHaveLength(3));

      let release: () => void = () => undefined;
      const pending = new Promise<void>((resolve) => (release = resolve));
      const builder = createQueryBuilder({ data: null, error: null });
      builder.then = (resolve: (v: MockQueryResult) => unknown) =>
        pending.then(() => resolve({ data: null, error: null }));
      fromMock.mockImplementation(() => builder);

      let done: Promise<void> = Promise.resolve();
      act(() => {
        done = result.current.reorderListings.mutateAsync([
          { id: 'c', sort_order: 0 },
          { id: 'a', sort_order: 1 },
          { id: 'b', sort_order: 2 },
        ]);
      });
      await waitFor(() => expect(cachedIds()).toEqual(['c', 'a', 'b']));
      release();
      await act(async () => {
        await done;
      });
    });

    it('restores the previous order when a write fails', async () => {
      const { result } = renderHook(() => useListings(), { wrapper: clientWrapper });
      await waitFor(() => expect(result.current.listings).toHaveLength(3));

      fromMock.mockImplementation(() =>
        createQueryBuilder({ data: null, error: { message: 'permission denied' } })
      );

      let caught: unknown;
      await act(async () => {
        try {
          await result.current.reorderListings.mutateAsync([
            { id: 'c', sort_order: 0 },
            { id: 'a', sort_order: 2 },
          ]);
        } catch (error) {
          caught = error;
        }
      });
      expect(caught).toBeTruthy();
      expect(cachedIds()).toEqual(['a', 'b', 'c']);
      expect(logAuditEvent).not.toHaveBeenCalled();
    });
  });

  /**
   * US-253: the generated columns are `?: never` in the Insert and Update
   * types, so a hook mutation naming one fails tsc rather than failing every
   * time at the database. These lines are checked by `tsc --noEmit`; if the
   * types ever accept the columns again, the @ts-expect-error lines break the
   * typecheck.
   */
  it('rejects the generated columns at the type level', () => {
    const insert: NewListing = {
      address: '1 Main St',
      city: 'Town',
      price: '1',
      // @ts-expect-error beds is GENERATED from bedrooms
      beds: 3,
    };
    // @ts-expect-error sqft is GENERATED from square_feet
    const update: ListingUpdate = { sqft: 1800 };
    expect(insert).toBeTruthy();
    expect(update).toBeTruthy();
  });
});
