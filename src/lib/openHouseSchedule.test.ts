import { describe, it, expect } from 'vitest';
import {
  PAST_START_GRACE_MS,
  defaultOpenHouseDate,
  formatOpenHouseWhen,
  isoToWallTime,
  pastStartError,
  wallTimeToIso,
} from './openHouseSchedule';

describe('wallTimeToIso (US-628)', () => {
  it('reads the wall time in the given zone, not the browser zone', () => {
    // 1 PM in Chicago in November is CST (UTC-6).
    expect(wallTimeToIso('2026-11-14', '13:00', 'America/Chicago')).toBe(
      '2026-11-14T19:00:00.000Z'
    );
    // The same wall time in Denver (MST, UTC-7) is a different instant.
    expect(wallTimeToIso('2026-11-14', '13:00', 'America/Denver')).toBe('2026-11-14T20:00:00.000Z');
    expect(wallTimeToIso('2026-07-04', '13:00', 'America/Chicago')).toBe(
      '2026-07-04T18:00:00.000Z'
    );
    expect(wallTimeToIso('2026-11-14', '13:00', 'UTC')).toBe('2026-11-14T13:00:00.000Z');
  });

  it('handles half-hour zones and positive offsets across the date line', () => {
    expect(wallTimeToIso('2026-11-14', '13:00', 'Asia/Kolkata')).toBe('2026-11-14T07:30:00.000Z');
    expect(wallTimeToIso('2026-11-14', '08:00', 'Pacific/Auckland')).toBe(
      '2026-11-13T19:00:00.000Z'
    );
  });

  it('moves a time skipped by spring-forward forward by the gap', () => {
    // 2026-03-08 02:30 does not exist in New York; it becomes 03:30 EDT.
    expect(wallTimeToIso('2026-03-08', '02:30', 'America/New_York')).toBe(
      '2026-03-08T07:30:00.000Z'
    );
  });

  it('resolves a time repeated by fall-back to its first occurrence', () => {
    // 2026-11-01 01:30 happens twice in New York; the first is EDT.
    expect(wallTimeToIso('2026-11-01', '01:30', 'America/New_York')).toBe(
      '2026-11-01T05:30:00.000Z'
    );
    // 2026-10-25 02:30 happens twice in Berlin; the first is CEST.
    expect(wallTimeToIso('2026-10-25', '02:30', 'Europe/Berlin')).toBe('2026-10-25T00:30:00.000Z');
  });

  it('round-trips through isoToWallTime in the same zone', () => {
    for (const zone of ['America/Chicago', 'Europe/London', 'Asia/Kolkata', 'Australia/Sydney']) {
      const iso = wallTimeToIso('2026-12-05', '14:45', zone);
      expect(isoToWallTime(iso, zone)).toEqual({ date: '2026-12-05', time: '14:45' });
    }
  });
});

describe('isoToWallTime', () => {
  it('shows the instant in the agent zone, including the date', () => {
    expect(isoToWallTime('2026-11-15T03:00:00.000Z', 'America/Los_Angeles')).toEqual({
      date: '2026-11-14',
      time: '19:00',
    });
    expect(isoToWallTime('2026-11-15T00:00:00.000Z', 'UTC')).toEqual({
      date: '2026-11-15',
      time: '00:00',
    });
  });
});

describe('defaultOpenHouseDate', () => {
  it('is the coming Saturday in the agent zone', () => {
    // Wednesday 2026-11-11 noon UTC.
    expect(defaultOpenHouseDate('UTC', new Date('2026-11-11T12:00:00Z'))).toBe('2026-11-14');
  });

  it('is today when it is already Saturday there', () => {
    expect(defaultOpenHouseDate('UTC', new Date('2026-11-14T09:00:00Z'))).toBe('2026-11-14');
  });

  it('uses the zone, not UTC, to decide what day it is', () => {
    // 02:00 UTC Saturday is still Friday evening in Los Angeles: Saturday is tomorrow.
    const at = new Date('2026-11-14T02:00:00Z');
    expect(defaultOpenHouseDate('America/Los_Angeles', at)).toBe('2026-11-14');
    // 23:00 UTC Saturday is already Sunday in Tokyo: the next Saturday is a week on.
    expect(defaultOpenHouseDate('Asia/Tokyo', new Date('2026-11-14T23:00:00Z'))).toBe('2026-11-21');
  });
});

describe('pastStartError', () => {
  const now = new Date('2026-11-14T18:00:00Z');

  it('allows a start in the future', () => {
    expect(pastStartError('2026-11-14T19:00:00Z', now)).toBeNull();
  });

  it('allows a start within the grace window (it is on right now)', () => {
    const recent = new Date(now.getTime() - PAST_START_GRACE_MS + 60_000).toISOString();
    expect(pastStartError(recent, now)).toBeNull();
  });

  it('refuses a start further in the past, with a clear message', () => {
    expect(pastStartError('2026-11-13T19:00:00Z', now)).toMatch(/already passed/);
    const justOut = new Date(now.getTime() - PAST_START_GRACE_MS - 60_000).toISOString();
    expect(pastStartError(justOut, now)).toMatch(/already passed/);
  });

  it('allows editing a past open house whose start has not moved', () => {
    expect(pastStartError('2026-11-01T19:00:00.000Z', now, '2026-11-01T19:00:00+00:00')).toBeNull();
  });

  it('refuses moving an existing open house into the past', () => {
    expect(pastStartError('2026-11-01T19:00:00Z', now, '2026-11-21T19:00:00Z')).toMatch(
      /already passed/
    );
  });
});

describe('formatOpenHouseWhen', () => {
  const now = new Date('2026-11-08T12:00:00Z');

  it('formats in the agent zone, sharing the period when both ends match', () => {
    expect(
      formatOpenHouseWhen('2026-11-14T19:00:00Z', '2026-11-14T21:00:00Z', 'America/Chicago', now)
    ).toBe('Sat, Nov 14 · 1:00–3:00 PM');
  });

  it('shows both periods across noon', () => {
    expect(
      formatOpenHouseWhen('2026-11-14T17:00:00Z', '2026-11-14T19:00:00Z', 'America/Chicago', now)
    ).toBe('Sat, Nov 14 · 11:00 AM–1:00 PM');
  });

  it('adds the year when it is not this year in that zone', () => {
    expect(
      formatOpenHouseWhen('2027-01-09T19:00:00Z', '2027-01-09T21:00:00Z', 'America/Chicago', now)
    ).toBe('Sat, Jan 9, 2027 · 1:00–3:00 PM');
  });
});
