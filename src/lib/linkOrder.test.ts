import { describe, it, expect } from 'vitest';
import { byPosition, moveAndRenumber, topByClicks } from './linkOrder';

const links = (...positions: number[]) =>
  positions.map((position, i) => ({ id: String.fromCharCode(97 + i), position }));

describe('moveAndRenumber (US-247)', () => {
  it('on a clean list writes only the two rows that swap', () => {
    expect(moveAndRenumber(links(0, 1, 2, 3), 'c', 'b')).toEqual([
      { id: 'c', position: 1 },
      { id: 'b', position: 2 },
    ]);
  });

  it('moves a link that shares its position with its neighbour', () => {
    // The old swap wrote 1 over 1 and 1 over 1: the arrow did nothing.
    const writes = moveAndRenumber(links(0, 1, 1, 2), 'c', 'b');
    // c already holds 1, so only b (now after it) and d (pushed along) move.
    expect(writes).toEqual([
      { id: 'b', position: 2 },
      { id: 'd', position: 3 },
    ]);
  });

  it('leaves the list dense and duplicate-free whatever it started as', () => {
    const start = links(5, 5, 9, 9, 40);
    const writes = moveAndRenumber(start, 'b', 'a');
    const after = start.map((l) => writes.find((w) => w.id === l.id)?.position ?? l.position);
    expect([...after].sort((x, y) => x - y)).toEqual([0, 1, 2, 3, 4]);
    expect(after[1]).toBe(0);
    expect(after[0]).toBe(1);
  });

  it('orders by position, not by the array it was handed', () => {
    const shuffled = [
      { id: 'x', position: 2 },
      { id: 'y', position: 0 },
      { id: 'z', position: 1 },
    ];
    expect(moveAndRenumber(shuffled, 'x', 'z')).toEqual([
      { id: 'x', position: 1 },
      { id: 'z', position: 2 },
    ]);
  });

  it('does nothing for an unknown id or a move onto itself', () => {
    expect(moveAndRenumber(links(0, 1), 'a', 'a')).toEqual([]);
    expect(moveAndRenumber(links(0, 1), 'a', 'nope')).toEqual([]);
  });
});

describe('display order (US-252)', () => {
  it('byPosition sorts a copy and leaves the input untouched', () => {
    const input = [
      { id: 'c', position: 2 },
      { id: 'a', position: 0 },
      { id: 'b', position: 1 },
    ];
    expect(byPosition(input).map((l) => l.id)).toEqual(['a', 'b', 'c']);
    expect(input.map((l) => l.id)).toEqual(['c', 'a', 'b']);
  });

  it('byPosition keeps ties in the order given', () => {
    expect(byPosition(links(1, 0, 1)).map((l) => l.id)).toEqual(['b', 'a', 'c']);
  });

  it('topByClicks does not reorder the array it is given (the TanStack cache)', () => {
    // Overview sorted the cached links array in place, so the Links page
    // listed them by clicks and its up/down arrows moved the wrong rows.
    const cached = [
      { id: 'a', position: 0, click_count: 1 },
      { id: 'b', position: 1, click_count: 9 },
      { id: 'c', position: 2, click_count: null },
      { id: 'd', position: 3, click_count: 5 },
    ];
    expect(topByClicks(cached, 2).map((l) => l.id)).toEqual(['b', 'd']);
    expect(cached.map((l) => l.id)).toEqual(['a', 'b', 'c', 'd']);
  });
});
