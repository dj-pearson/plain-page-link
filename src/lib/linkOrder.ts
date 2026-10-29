/**
 * Moving a link up or down, as the position writes it takes.
 *
 * The dashboard used to swap the two links' stored positions. That is only a
 * move when the positions differ: two links that already shared a number (one
 * failed half of an earlier swap was enough) swapped a value for itself, so the
 * arrow did nothing, and a second failed write made another duplicate (US-247).
 *
 * Instead the whole list is renumbered 0..n-1 in its new order, and only the
 * rows whose number changes are written. On a clean list that is the same two
 * writes as before; on a damaged one it repairs every duplicate and gap, so a
 * write that fails is undone by the next move rather than compounded by it.
 */
export interface PositionedItem {
  id: string;
  position: number;
}

export interface PositionWrite {
  id: string;
  position: number;
}

/**
 * The writes that move `id` to where `targetId` is, by swapping the two in the
 * list's current order (`items` sorted by position, ties in the order given).
 * Empty when either id is missing or they are the same.
 */
export function moveAndRenumber(
  items: readonly PositionedItem[],
  id: string,
  targetId: string
): PositionWrite[] {
  if (id === targetId) return [];
  const ordered = items
    .map((item, index) => ({ item, index }))
    .sort((a, b) => a.item.position - b.item.position || a.index - b.index)
    .map(({ item }) => item);

  const from = ordered.findIndex((item) => item.id === id);
  const to = ordered.findIndex((item) => item.id === targetId);
  if (from === -1 || to === -1) return [];

  [ordered[from], ordered[to]] = [ordered[to], ordered[from]];

  return ordered
    .map((item, position) => ({ id: item.id, position, changed: item.position !== position }))
    .filter((write) => write.changed)
    .map(({ id: writeId, position }) => ({ id: writeId, position }));
}
