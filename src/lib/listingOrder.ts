/**
 * Display order for an agent's listings (US-253).
 *
 * The dashboard lets an agent drag one card onto another, and the public
 * gallery shows listings by `sort_order`. Reordering used to rewrite
 * `sort_order` 0..n over the *filtered* list only — so dragging while a status
 * filter or search was active gave the visible listings the same low numbers
 * the hidden ones already held, and the public page interleaved them in an
 * order the agent never chose. It also wrote every visible row, one request
 * each, whether its position changed or not.
 *
 * Everything here is pure, so the rules are unit tested rather than inferred
 * from a drag-and-drop UI.
 */

export interface OrderedListing {
  id: string;
  sort_order: number | null;
  created_at: string | null;
}

export interface SortOrderChange {
  id: string;
  sort_order: number;
}

/**
 * The one ordering, shared by the dashboard query, the public profile query
 * and the optimistic cache update: `sort_order` ascending (nulls last, as
 * Postgres sorts them), then newest first, then `id` so ties can never come
 * back in a different order from one request to the next.
 */
export function compareListingOrder(a: OrderedListing, b: OrderedListing): number {
  const sa = a.sort_order;
  const sb = b.sort_order;
  if (sa !== sb) {
    if (sa === null) return 1;
    if (sb === null) return -1;
    return sa - sb;
  }
  const ca = a.created_at;
  const cb = b.created_at;
  if (ca !== cb) {
    if (ca === null) return 1;
    if (cb === null) return -1;
    return ca < cb ? 1 : -1;
  }
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

/**
 * Move `draggedId` to `targetId`'s place among the listings the agent can see,
 * and return the *full* list in its new order.
 *
 * `all` is every listing in current display order; `visibleIds` is the subset
 * the current filter shows. Hidden listings keep the slots they occupy, so
 * their order relative to each other (and to the public page) is unchanged;
 * only the visible listings are permuted among the visible slots.
 *
 * Returns null when the drop is a no-op or either id is not visible.
 */
export function reorderWithinView<T extends { id: string }>(
  all: readonly T[],
  visibleIds: readonly string[],
  draggedId: string,
  targetId: string
): T[] | null {
  if (draggedId === targetId) return null;
  const visible = new Set(visibleIds);
  const shown = all.filter((l) => visible.has(l.id));
  const from = shown.findIndex((l) => l.id === draggedId);
  const to = shown.findIndex((l) => l.id === targetId);
  if (from === -1 || to === -1) return null;

  const [moved] = shown.splice(from, 1);
  shown.splice(to, 0, moved);

  let next = 0;
  return all.map((l) => (visible.has(l.id) ? shown[next++] : l));
}

/**
 * The writes that make `ordered` the stored order: dense, unique `sort_order`
 * 0..n-1 by position, and only for the rows whose value actually changes.
 */
export function sortOrderChanges(ordered: readonly OrderedListing[]): SortOrderChange[] {
  const changes: SortOrderChange[] = [];
  ordered.forEach((l, index) => {
    if (l.sort_order !== index) changes.push({ id: l.id, sort_order: index });
  });
  return changes;
}

/** `listings` with `changes` applied, in display order. */
export function applySortOrderChanges<T extends OrderedListing>(
  listings: readonly T[],
  changes: readonly SortOrderChange[]
): T[] {
  const next = new Map(changes.map((c) => [c.id, c.sort_order]));
  return listings
    .map((l) => {
      const sortOrder = next.get(l.id);
      return sortOrder === undefined ? l : { ...l, sort_order: sortOrder };
    })
    .sort(compareListingOrder);
}
