import { describe, it, expect } from 'vitest';
import { digestKindFor, dueCutoffDay } from './digests.ts';

describe('digestKindFor (US-230)', () => {
  const monday = new Date('2026-10-05T13:00:00Z');
  const tuesday = new Date('2026-10-06T13:00:00Z');
  it('daily by default, and the weekly edition on Mondays', () => {
    expect(digestKindFor(undefined, tuesday)).toBe('daily');
    expect(digestKindFor(undefined, monday)).toBe('weekly');
  });
  it('weekly subscribers hear only on Mondays', () => {
    expect(digestKindFor('weekly', tuesday)).toBeNull();
    expect(digestKindFor('weekly', monday)).toBe('weekly');
  });
  it('off is off', () => {
    expect(digestKindFor('off', monday)).toBeNull();
  });
});

describe('dueCutoffDay (US-240)', () => {
  it('is the UTC day after the digest runs', () => {
    expect(dueCutoffDay(new Date('2026-10-28T13:00:00Z'))).toBe('2026-10-29');
    expect(dueCutoffDay(new Date('2026-12-31T13:00:00Z'))).toBe('2027-01-01');
  });

  it('takes in a task due today in Los Angeles, stored as the end of the local day', () => {
    const cutoff = `${dueCutoffDay(new Date('2026-10-28T13:00:00Z'))}T11:59:59.999Z`;
    // Due 28 Oct in LA → 2026-10-29T06:59:59.999Z; due 29 Oct in London → 23:59:59.999Z.
    expect('2026-10-29T06:59:59.999Z' <= cutoff).toBe(true);
    expect('2026-10-29T23:59:59.999Z' <= cutoff).toBe(false);
  });
});
