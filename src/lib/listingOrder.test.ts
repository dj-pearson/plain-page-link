import { describe, it, expect } from 'vitest';
import {
  applySortOrderChanges,
  compareListingOrder,
  reorderWithinView,
  sortOrderChanges,
  type OrderedListing,
} from './listingOrder';

const row = (
  id: string,
  sort_order: number | null = 0,
  created_at = '2026-01-01'
): OrderedListing => ({
  id,
  sort_order,
  created_at,
});

const ids = (list: readonly { id: string }[]) => list.map((l) => l.id);

describe('reorderWithinView (US-253)', () => {
  it('moves the dragged listing to the target position when nothing is filtered', () => {
    const all = [row('a'), row('b'), row('c'), row('d')];
    const next = reorderWithinView(all, ids(all), 'd', 'b');
    expect(next && ids(next)).toEqual(['a', 'd', 'b', 'c']);
  });

  it("keeps hidden listings' slots and relative order when dragging in a filtered view", () => {
    // a, c, e are sold and hidden by an "Active" filter; b, d, f are visible.
    const all = [row('a'), row('b'), row('c'), row('d'), row('e'), row('f')];
    const next = reorderWithinView(all, ['b', 'd', 'f'], 'f', 'b');
    expect(next && ids(next)).toEqual(['a', 'f', 'c', 'b', 'e', 'd']);
    // The hidden ones are exactly where they were.
    expect(next && ids(next.filter((l) => ['a', 'c', 'e'].includes(l.id)))).toEqual([
      'a',
      'c',
      'e',
    ]);
  });

  it('is a no-op for a drop on itself or on a listing the filter hides', () => {
    const all = [row('a'), row('b'), row('c')];
    expect(reorderWithinView(all, ['a', 'b'], 'a', 'a')).toBeNull();
    expect(reorderWithinView(all, ['a', 'b'], 'a', 'c')).toBeNull();
    expect(reorderWithinView(all, ['a', 'b'], 'zz', 'b')).toBeNull();
  });

  it('does not mutate its input', () => {
    const all = [row('a'), row('b'), row('c')];
    const snapshot = ids(all);
    reorderWithinView(all, ids(all), 'c', 'a');
    expect(ids(all)).toEqual(snapshot);
  });
});

describe('sortOrderChanges (US-253)', () => {
  it('assigns dense unique positions over the full list, writing only changed rows', () => {
    const all = [row('a', 0), row('b', 1), row('c', 2), row('d', 3), row('e', 4), row('f', 5)];
    const next = reorderWithinView(all, ['b', 'd', 'f'], 'f', 'b')!;
    const changes = sortOrderChanges(next);
    // a, c, e keep 0, 2, 4; only the three permuted rows are written.
    expect(changes).toEqual([
      { id: 'f', sort_order: 1 },
      { id: 'b', sort_order: 3 },
      { id: 'd', sort_order: 5 },
    ]);

    const stored = applySortOrderChanges(all, changes);
    expect(ids(stored)).toEqual(ids(next));
    const positions = stored.map((l) => l.sort_order);
    expect(positions).toEqual([0, 1, 2, 3, 4, 5]);
  });

  it('a filtered drag never gives a visible listing a position a hidden one holds', () => {
    // The old code numbered the filtered list 0..n, so b/d/f got 0/1/2 and
    // collided with a (0) and c (2).
    const all = [row('a', 0), row('b', 1), row('c', 2), row('d', 3), row('e', 4), row('f', 5)];
    const next = reorderWithinView(all, ['b', 'd', 'f'], 'd', 'b')!;
    const stored = applySortOrderChanges(all, sortOrderChanges(next));
    const values = stored.map((l) => l.sort_order);
    expect(new Set(values).size).toBe(values.length);
  });

  it('normalises legacy rows that all sit at 0 or null', () => {
    const changes = sortOrderChanges([row('a', 0), row('b', 0), row('c', null)]);
    expect(changes).toEqual([
      { id: 'b', sort_order: 1 },
      { id: 'c', sort_order: 2 },
    ]);
  });

  it('writes nothing when the order is unchanged', () => {
    expect(sortOrderChanges([row('a', 0), row('b', 1)])).toEqual([]);
  });
});

describe('compareListingOrder (US-253)', () => {
  it('orders by sort_order (nulls last), then newest first, then id', () => {
    const list = [
      row('n', null, '2026-03-01'),
      row('z', 1, '2026-01-01'),
      row('y', 1, '2026-01-01'),
      row('old', 0, '2025-01-01'),
      row('new', 0, '2026-05-01'),
    ];
    expect(ids([...list].sort(compareListingOrder))).toEqual(['new', 'old', 'y', 'z', 'n']);
  });
});
