import { describe, it, expect, vi, afterEach } from 'vitest';
import { format as dfFormat, isPast as dfIsPast } from 'date-fns';
import { formatDate, isPast } from './dateFormat';
import { formatDistanceToNowWithSuffix } from './relativeTime';

/** Every pattern the app passes to formatDate (US-574), plus the other tokens. */
const PATTERNS = [
  'EEE, MMM d · h:mm a',
  'h:mm a',
  'EEE, MMM d',
  'MMM d',
  'MMM d, h:mm a',
  'yyyy-dd hh:mm',
  'MMM d, yyyy',
];

/** Deterministic pseudo-random numbers, so a failure reproduces. */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

describe('formatDate (US-574)', () => {
  it('matches date-fns format for every supported pattern across many dates', () => {
    const next = rng(574);
    const start = new Date(2020, 0, 1).getTime();
    const span = 10 * 365 * 24 * 60 * 60 * 1000;
    for (let i = 0; i < 2000; i += 1) {
      const date = new Date(start + Math.floor(next() * span));
      for (const pattern of PATTERNS) {
        expect(formatDate(date, pattern), `${date.toISOString()} ${pattern}`).toBe(
          dfFormat(date, pattern)
        );
      }
    }
  });

  it('gets midnight and noon right (12 AM / 12 PM)', () => {
    expect(formatDate(new Date(2026, 10, 8, 0, 5), 'h:mm a')).toBe('12:05 AM');
    expect(formatDate(new Date(2026, 10, 8, 12, 0), 'h:mm a')).toBe('12:00 PM');
    expect(formatDate(new Date(2026, 10, 8, 23, 59), 'EEE, MMM d · h:mm a')).toBe(
      'Sun, Nov 8 · 11:59 PM'
    );
  });

  it('accepts a timestamp', () => {
    const date = new Date(2026, 1, 3, 9, 7);
    expect(formatDate(date.getTime(), 'MMM d, h:mm a')).toBe('Feb 3, 9:07 AM');
  });

  it('throws on an invalid date, as date-fns does', () => {
    expect(() => formatDate(new Date('nope'), 'MMM d')).toThrow(RangeError);
  });

  it('refuses a token it does not implement instead of printing it', () => {
    expect(() => formatDate(new Date(2026, 0, 1), 'MMMM d')).toThrow(/unsupported token/);
    expect(() => formatDate(new Date(2026, 0, 1), 'HH:mm')).toThrow(/unsupported token/);
    expect(() => formatDate(new Date(2026, 0, 1), 'Q')).toThrow(/unsupported token/);
  });
});

describe('isPast and formatDistanceToNowWithSuffix (US-574)', () => {
  afterEach(() => vi.useRealTimers());

  it('isPast agrees with date-fns', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 10, 8, 12, 0, 0));
    for (const offset of [-86_400_000, -1, 0, 1, 86_400_000]) {
      const date = new Date(Date.now() + offset);
      expect(isPast(date), String(offset)).toBe(dfIsPast(date));
      expect(isPast(date.getTime()), String(offset)).toBe(dfIsPast(date));
    }
  });

  it('measures from now', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 10, 8, 12, 0, 0));
    expect(formatDistanceToNowWithSuffix(new Date(2026, 10, 5, 12, 0, 0))).toBe('3 days ago');
    expect(formatDistanceToNowWithSuffix(new Date(2026, 10, 8, 14, 0, 0).getTime())).toBe(
      'in about 2 hours'
    );
  });
});
