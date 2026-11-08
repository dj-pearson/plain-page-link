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
const removeMock = vi.fn(
  async (_paths: string[]): Promise<{ data: unknown; error: { message: string } | null }> => ({
    data: [],
    error: null,
  })
);
const storageFromMock = vi.fn((_bucket: string) => ({ remove: removeMock }));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (table: string) => fromMock(table),
    storage: { from: (bucket: string) => storageFromMock(bucket) },
  },
}));

vi.mock('@/stores/useAuthStore', () => ({
  useAuthStore: <T>(select: (s: { user: typeof authUser }) => T) => select({ user: authUser }),
}));

vi.mock('@/lib/audit', () => ({ logAuditEvent: vi.fn() }));

import { useListings, type ListingUpdate, type NewListing } from './useListings';
import { logAuditEvent } from '@/lib/audit';
import { OWNER_LISTING_COLUMNS } from '@/lib/listingColumns';

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

  it('reads named columns, not select("*") (US-342)', async () => {
    const { result } = renderHook(() => useListings(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    const builder = fromMock.mock.results[0].value as { select: ReturnType<typeof vi.fn> };
    expect(builder.select).toHaveBeenCalledWith(OWNER_LISTING_COLUMNS);
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
   * US-451: deleting a listing, or dropping a photo from one, only changed the
   * row, so the originals and their WebP variants stayed public in the bucket.
   */
  describe('photo cleanup', () => {
    const BASE = 'https://db.example.com/storage/v1/object/public/listing-photos';
    const uid = mockAuthenticatedUser.id;
    const photo = (name: string) => `${BASE}/${uid}/l1/${name}`;
    const rows = [
      {
        ...listingRow,
        id: 'l1',
        photos: [photo('a.jpg'), photo('b.jpg'), photo('shared.jpg')],
        image: photo('a.jpg'),
      },
      { ...listingRow, id: 'l2', photos: [photo('shared.jpg')], image: null },
    ];
    let client: QueryClient;
    const clientWrapper = ({ children }: { children: ReactNode }) =>
      createElement(QueryClientProvider, { client }, children);
    const variants = (name: string) => {
      const stem = `${uid}/l1/${name.replace(/\.jpg$/, '')}`;
      return [`${uid}/l1/${name}`, `${stem}-200.webp`, `${stem}-400.webp`, `${stem}-800.webp`];
    };

    beforeEach(() => {
      client = createTestQueryClient();
      client.setDefaultOptions({ queries: { retry: false, gcTime: Infinity, staleTime: 0 } });
      queryResult = { data: rows, error: null };
      fromMock.mockImplementation(() => createQueryBuilder(queryResult));
      removeMock.mockClear();
      storageFromMock.mockClear();
    });

    const loaded = async () => {
      const hook = renderHook(() => useListings(), { wrapper: clientWrapper });
      await waitFor(() => expect(hook.result.current.listings).toHaveLength(2));
      return hook;
    };

    it('removes a deleted listing photos and variants, keeping ones another listing uses', async () => {
      const { result } = await loaded();
      fromMock.mockImplementation(() => createQueryBuilder({ data: [{ id: 'l1' }], error: null }));

      await act(async () => {
        await result.current.deleteListing.mutateAsync('l1');
      });

      await waitFor(() => expect(removeMock).toHaveBeenCalledTimes(1));
      expect(storageFromMock).toHaveBeenCalledWith('listing-photos');
      const removed = removeMock.mock.calls[0][0];
      expect(removed).toEqual([...variants('a.jpg'), ...variants('b.jpg')]);
      expect(removed).not.toContain(`${uid}/l1/shared.jpg`);
    });

    it('leaves storage alone when the delete removed no row', async () => {
      const { result } = await loaded();
      fromMock.mockImplementation(() => createQueryBuilder({ data: [], error: null }));

      await act(async () => {
        await result.current.deleteListing.mutateAsync('l1');
      });
      expect(removeMock).not.toHaveBeenCalled();
    });

    it('leaves storage alone when the delete fails', async () => {
      const { result } = await loaded();
      fromMock.mockImplementation(() =>
        createQueryBuilder({ data: null, error: { message: 'permission denied' } })
      );

      await act(async () => {
        await result.current.deleteListing.mutateAsync('l1').catch(() => undefined);
      });
      expect(removeMock).not.toHaveBeenCalled();
    });

    it('removes only the photos an edit drops', async () => {
      const { result } = await loaded();
      fromMock.mockImplementation(() => createQueryBuilder({ data: rows[0], error: null }));

      await act(async () => {
        await result.current.updateListing.mutateAsync({
          id: 'l1',
          photos: [photo('b.jpg'), photo('shared.jpg')],
          image: photo('b.jpg'),
        });
      });

      await waitFor(() => expect(removeMock).toHaveBeenCalledTimes(1));
      expect(removeMock.mock.calls[0][0]).toEqual(variants('a.jpg'));
    });

    it('does not touch storage for an edit that leaves photos alone', async () => {
      const { result } = await loaded();
      fromMock.mockImplementation(() => createQueryBuilder({ data: rows[0], error: null }));

      await act(async () => {
        await result.current.updateListing.mutateAsync({ id: 'l1', price: '1' });
      });
      expect(removeMock).not.toHaveBeenCalled();
    });

    it('still resolves the delete when storage refuses the cleanup', async () => {
      const { result } = await loaded();
      fromMock.mockImplementation(() => createQueryBuilder({ data: [{ id: 'l1' }], error: null }));
      removeMock.mockResolvedValueOnce({ data: null, error: { message: 'storage down' } });

      let caught: unknown;
      await act(async () => {
        await result.current.deleteListing.mutateAsync('l1').catch((e: unknown) => (caught = e));
      });
      await waitFor(() => expect(removeMock).toHaveBeenCalledTimes(1));
      expect(caught).toBeUndefined();
    });

    describe('discardUnsavedPhotos (US-461)', () => {
      it('removes unsaved uploads and their variants', async () => {
        const { result } = await loaded();

        await act(async () => {
          await result.current.discardUnsavedPhotos([photo('new.jpg')]);
        });

        expect(removeMock).toHaveBeenCalledTimes(1);
        expect(removeMock.mock.calls[0][0]).toEqual(variants('new.jpg'));
      });

      it('re-reads the listings and keeps anything a stored row refers to', async () => {
        const { result } = await loaded();
        // The cache does not know new.jpg was saved; the database does.
        fromMock.mockImplementation(() =>
          createQueryBuilder({
            data: [{ photos: [photo('new.jpg')], image: null }],
            error: null,
          })
        );

        await act(async () => {
          await result.current.discardUnsavedPhotos([photo('new.jpg'), photo('gone.jpg')]);
        });

        expect(fromMock).toHaveBeenLastCalledWith('listings');
        expect(removeMock.mock.calls[0][0]).toEqual(variants('gone.jpg'));
      });

      it('removes nothing when the listings cannot be read', async () => {
        const { result } = await loaded();
        fromMock.mockImplementation(() =>
          createQueryBuilder({ data: null, error: { message: 'network down' } })
        );

        await act(async () => {
          await expect(
            result.current.discardUnsavedPhotos([photo('new.jpg')])
          ).resolves.toBeUndefined();
        });
        expect(removeMock).not.toHaveBeenCalled();
      });

      it('removes the photos of an add whose insert fails, and still rejects', async () => {
        const { result } = await loaded();
        // The insert fails; the follow-up read of stored listings finds none
        // referring to the new photos.
        fromMock.mockImplementationOnce(() =>
          createQueryBuilder({ data: null, error: { message: 'plan_limit:active_listings' } })
        );
        fromMock.mockImplementationOnce(() => createQueryBuilder({ data: [], error: null }));

        let caught: unknown;
        await act(async () => {
          await result.current.addListing
            .mutateAsync({
              address: '2 Second St',
              city: 'Town',
              price: '1',
              photos: [photo('new.jpg')],
              image: photo('new.jpg'),
            })
            .catch((e: unknown) => (caught = e));
        });

        expect(caught).toBeTruthy();
        await waitFor(() => expect(removeMock).toHaveBeenCalledTimes(1));
        expect(removeMock.mock.calls[0][0]).toEqual(variants('new.jpg'));
      });

      it('leaves storage alone when the add succeeds', async () => {
        const { result } = await loaded();
        fromMock.mockImplementation(() => createQueryBuilder({ data: { id: 'l3' }, error: null }));

        await act(async () => {
          await result.current.addListing.mutateAsync({
            address: '2 Second St',
            city: 'Town',
            price: '1',
            photos: [photo('new.jpg')],
            image: photo('new.jpg'),
          });
        });
        expect(removeMock).not.toHaveBeenCalled();
      });

      it('never removes another folder or a hot-linked URL, and skips an empty list', async () => {
        const { result } = await loaded();

        await act(async () => {
          await result.current.discardUnsavedPhotos([]);
          await result.current.discardUnsavedPhotos([
            `${BASE}/someone-else/l1/x.jpg`,
            'https://images.example.com/house.jpg',
          ]);
        });
        expect(removeMock).not.toHaveBeenCalled();
      });
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
