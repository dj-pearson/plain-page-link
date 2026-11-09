import { describe, it, expect } from 'vitest';
import { addDays, isValidTimeZone, localDateIn, normalizeTimeZone, zonedParts, zonedTimeToUtc } from './timeZone.ts';

describe('timeZone helpers (US-433)', () => {
  it('accepts IANA names and refuses anything else', () => {
    expect(isValidTimeZone('America/Los_Angeles')).toBe(true);
    expect(isValidTimeZone('UTC')).toBe(true);
    expect(isValidTimeZone('Mars/Olympus_Mons')).toBe(false);
    expect(isValidTimeZone('')).toBe(false);
    expect(isValidTimeZone(null)).toBe(false);
    expect(normalizeTimeZone('nope')).toBeNull();
    expect(normalizeTimeZone('Europe/London')).toBe('Europe/London');
  });

  it('reads the local calendar date', () => {
    const at = new Date('2026-11-10T20:00:00Z');
    expect(localDateIn(at, 'Australia/Sydney')).toBe('2026-11-11');
    expect(localDateIn(at, 'America/Los_Angeles')).toBe('2026-11-10');
    expect(zonedParts(new Date('2026-11-10T08:00:00Z'), 'America/Los_Angeles').hour).toBe(0);
  });

  it('converts a local wall-clock hour to the instant, across DST', () => {
    expect(zonedTimeToUtc('2026-11-10', 7, 'America/Los_Angeles').toISOString()).toBe('2026-11-10T15:00:00.000Z');
    expect(zonedTimeToUtc('2026-07-01', 7, 'America/Los_Angeles').toISOString()).toBe('2026-07-01T14:00:00.000Z');
    expect(zonedTimeToUtc('2026-11-11', 0, 'Australia/Sydney').toISOString()).toBe('2026-11-10T13:00:00.000Z');
    expect(zonedTimeToUtc('2026-11-10', 7, 'Asia/Kolkata').toISOString()).toBe('2026-11-10T01:30:00.000Z');
    // The day DST ends in Los Angeles (1 Nov 2026): 07:00 is PST.
    expect(zonedTimeToUtc('2026-11-01', 7, 'America/Los_Angeles').toISOString()).toBe('2026-11-01T15:00:00.000Z');
    // The day it starts (8 Mar 2026): 07:00 is PDT.
    expect(zonedTimeToUtc('2026-03-08', 7, 'America/Los_Angeles').toISOString()).toBe('2026-03-08T14:00:00.000Z');
  });

  it('adds calendar days across month and year ends', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });
});
