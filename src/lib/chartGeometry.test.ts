import { describe, it, expect } from 'vitest';
import {
  areaPath,
  bandX,
  innerSize,
  labelIndices,
  linePath,
  nearestIndex,
  niceTicks,
  pointX,
  yScale,
  type ChartBox,
} from './chartGeometry';

const box: ChartBox = { width: 440, height: 236, top: 8, right: 16, bottom: 28, left: 24 };

describe('niceTicks', () => {
  it('uses whole-number steps for small counts', () => {
    expect(niceTicks(3)).toEqual([0, 1, 2, 3]);
  });

  it('rounds the top up to a nice step', () => {
    expect(niceTicks(7)).toEqual([0, 2, 4, 6, 8]);
    expect(niceTicks(1000)).toEqual([0, 250, 500, 750, 1000]);
    expect(niceTicks(1234)).toEqual([0, 500, 1000, 1500]);
  });

  it('gives an empty or invalid series an axis instead of collapsing', () => {
    expect(niceTicks(0)).toEqual([0, 1]);
    expect(niceTicks(Number.NaN)).toEqual([0, 1]);
    expect(niceTicks(-5)).toEqual([0, 1]);
  });

  it('always covers the maximum', () => {
    for (const max of [1, 9, 11, 49, 51, 99, 101, 333, 9999, 123456]) {
      const ticks = niceTicks(max);
      expect(ticks[0]).toBe(0);
      expect(ticks[ticks.length - 1]).toBeGreaterThanOrEqual(max);
      expect(ticks.length).toBeLessThanOrEqual(7);
    }
  });
});

describe('scales', () => {
  it('measures the inner plot and never goes negative', () => {
    expect(innerSize(box)).toEqual({ width: 400, height: 200 });
    expect(innerSize({ ...box, width: 10 }).width).toBe(0);
  });

  it('maps 0 to the baseline and max to the top', () => {
    const y = yScale(box, 100);
    expect(y(0)).toBe(208);
    expect(y(100)).toBe(8);
    expect(y(50)).toBe(108);
    expect(y(-3)).toBe(208);
  });

  it('spreads points edge to edge and centres a single point', () => {
    expect(pointX(box, 0, 5)).toBe(24);
    expect(pointX(box, 4, 5)).toBe(424);
    expect(pointX(box, 0, 1)).toBe(224);
  });

  it('centres bars in their band', () => {
    expect(bandX(box, 0, 4)).toBe(74);
    expect(bandX(box, 3, 4)).toBe(374);
  });
});

describe('paths', () => {
  it('draws a line through the points', () => {
    expect(
      linePath([
        [0, 10],
        [5.555, 20],
      ])
    ).toBe('M0 10 L5.56 20');
    expect(linePath([])).toBe('');
  });

  it('closes an area down to the baseline', () => {
    expect(
      areaPath(
        [
          [0, 10],
          [10, 5],
        ],
        50
      )
    ).toBe('M0 10 L10 5 L10 50 L0 50 Z');
    expect(areaPath([], 50)).toBe('');
  });
});

describe('labelIndices', () => {
  it('prints every label when they fit', () => {
    expect(labelIndices(5, 400)).toEqual([0, 1, 2, 3, 4]);
  });

  it('thins 90 daily labels and keeps the first and last', () => {
    const idx = labelIndices(90, 400);
    expect(idx[0]).toBe(0);
    expect(idx[idx.length - 1]).toBe(89);
    expect(idx.length).toBeLessThanOrEqual(6);
    for (let i = 1; i < idx.length; i++) expect(idx[i]).toBeGreaterThan(idx[i - 1]);
  });

  it('handles no data', () => {
    expect(labelIndices(0, 400)).toEqual([]);
  });
});

describe('nearestIndex', () => {
  it('snaps to the nearest point', () => {
    expect(nearestIndex(box, 24, 5, 'point')).toBe(0);
    expect(nearestIndex(box, 130, 5, 'point')).toBe(1);
    expect(nearestIndex(box, 1000, 5, 'point')).toBe(4);
    expect(nearestIndex(box, -50, 5, 'point')).toBe(0);
  });

  it('picks the band under the pointer for bars', () => {
    expect(nearestIndex(box, 123, 4, 'band')).toBe(0);
    expect(nearestIndex(box, 125, 4, 'band')).toBe(1);
    expect(nearestIndex(box, 424, 4, 'band')).toBe(3);
  });
});
