import { describe, expect, it } from 'vitest';
import { timeAgo } from './timeAgo';

const NOW = new Date('2026-11-08T12:00:00Z');
const ago = (ms: number) => new Date(NOW.getTime() - ms);
const MIN = 60 * 1000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

describe('timeAgo', () => {
  it('says "just now" under a minute', () => {
    expect(timeAgo(ago(20 * 1000), NOW)).toBe('just now');
  });

  it('counts minutes, hours and days in the past', () => {
    expect(timeAgo(ago(5 * MIN), NOW)).toBe('5 minutes ago');
    expect(timeAgo(ago(3 * HOUR), NOW)).toBe('3 hours ago');
    expect(timeAgo(ago(3 * DAY), NOW)).toBe('3 days ago');
  });

  it('uses natural words for one unit', () => {
    expect(timeAgo(ago(DAY), NOW)).toBe('yesterday');
    expect(timeAgo(ago(8 * DAY), NOW)).toBe('last week');
  });

  it('handles weeks, months and years', () => {
    expect(timeAgo(ago(15 * DAY), NOW)).toBe('2 weeks ago');
    expect(timeAgo(ago(65 * DAY), NOW)).toBe('2 months ago');
    expect(timeAgo(ago(800 * DAY), NOW)).toBe('2 years ago');
  });

  it('handles future dates', () => {
    expect(timeAgo(new Date(NOW.getTime() + 2 * HOUR), NOW)).toBe('in 2 hours');
  });

  it('accepts ISO strings and returns empty for invalid input', () => {
    expect(timeAgo(ago(2 * DAY).toISOString(), NOW)).toBe('2 days ago');
    expect(timeAgo('not a date', NOW)).toBe('');
  });
});
