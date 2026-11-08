import { describe, it, expect } from 'vitest';
import { formatDistance, differenceInMonths as dfDifferenceInMonths } from 'date-fns';
import { formatDistanceWithSuffix, differenceInMonths } from './relativeTime';
import { formatRelativeTime } from './format';

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** Deterministic pseudo-random numbers, so a failure reproduces. */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

const reference = (date: Date, base: Date) => formatDistance(date, base, { addSuffix: true });

describe('formatDistanceWithSuffix (US-558)', () => {
  const base = new Date(2026, 10, 8, 14, 37, 12, 345);

  it('matches date-fns at every band boundary, past and future', () => {
    const offsets = [
      0,
      1,
      29 * SECOND,
      30 * SECOND,
      59 * SECOND,
      89 * SECOND,
      90 * SECOND,
      2 * MINUTE,
      44 * MINUTE + 29 * SECOND,
      44 * MINUTE + 30 * SECOND,
      45 * MINUTE,
      89 * MINUTE + 29 * SECOND,
      90 * MINUTE,
      23 * HOUR + 59 * MINUTE,
      DAY,
      41 * HOUR,
      42 * HOUR,
      2 * DAY,
      29 * DAY + 23 * HOUR,
      30 * DAY,
      45 * DAY,
      59 * DAY + 23 * HOUR,
      60 * DAY,
      200 * DAY,
      364 * DAY,
      365 * DAY,
      15 * 30 * DAY,
      21 * 30 * DAY,
      3 * 365 * DAY,
      10 * 365 * DAY + 100 * DAY,
    ];
    for (const offset of offsets) {
      for (const sign of [-1, 1]) {
        const date = new Date(base.getTime() + sign * offset);
        expect(formatDistanceWithSuffix(date, base), `offset ${sign * offset}`).toBe(
          reference(date, base)
        );
      }
    }
  });

  it('matches date-fns for thousands of random offsets up to twenty years', () => {
    const next = rng(558);
    for (let i = 0; i < 5000; i++) {
      // Spread across magnitudes: seconds, hours, days, months, years.
      const magnitude = 10 ** (next() * 11.8); // up to ~20 years in ms
      const sign = next() < 0.5 ? -1 : 1;
      const baseMs = Date.UTC(2020, 0, 1) + next() * 8 * 365 * DAY;
      const b = new Date(baseMs);
      const date = new Date(baseMs + sign * magnitude);
      expect(formatDistanceWithSuffix(date, b), `${b.toISOString()} -> ${date.toISOString()}`).toBe(
        reference(date, b)
      );
    }
  });

  it('matches date-fns month-end arithmetic', () => {
    const pairs: Array<[Date, Date]> = [
      [new Date(2026, 1, 28), new Date(2026, 0, 31)],
      [new Date(2026, 2, 31), new Date(2026, 1, 28)],
      [new Date(2024, 1, 29), new Date(2023, 1, 28)],
      [new Date(2027, 0, 31), new Date(2025, 11, 31)],
      [new Date(2026, 4, 30), new Date(2025, 7, 31)],
    ];
    for (const [a, b] of pairs) {
      expect(differenceInMonths(a, b)).toBe(dfDifferenceInMonths(a, b));
      expect(differenceInMonths(b, a)).toBe(dfDifferenceInMonths(b, a));
      expect(formatDistanceWithSuffix(a, b)).toBe(reference(a, b));
      expect(formatDistanceWithSuffix(b, a)).toBe(reference(b, a));
    }
  });

  it('throws on an invalid date, as date-fns does', () => {
    expect(() => formatDistanceWithSuffix(new Date('nope'), base)).toThrow(RangeError);
  });

  it('formatRelativeTime keeps its wording', () => {
    expect(formatRelativeTime(new Date(Date.now() - 3 * DAY))).toBe('3 days ago');
    expect(formatRelativeTime(new Date(Date.now() - 10 * SECOND).toISOString())).toBe(
      'less than a minute ago'
    );
  });
});
