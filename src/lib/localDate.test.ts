/**
 * US-240: a task due tomorrow was due at 5pm today in Los Angeles.
 *
 * Every assertion here runs in America/Los_Angeles, where the old
 * `new Date('YYYY-MM-DD')` / `toISOString().slice(0, 10)` round-trips are a
 * day out. Under TZ=UTC (CI's default) they would all pass on the old code.
 */
process.env.TZ = 'America/Los_Angeles';

import { describe, it, expect, afterEach, vi } from 'vitest';
import { isPast } from 'date-fns';
import {
  calendarDateInDays,
  dueDateToIso,
  endOfCalendarDay,
  taskDueAt,
  todayCalendarDate,
} from './localDate';

// 6pm on Wednesday 28 October 2026 in Los Angeles (PDT, UTC-7) — already the
// 29th in UTC.
const SIX_PM_LA = new Date('2026-10-29T01:00:00.000Z');

afterEach(() => {
  vi.useRealTimers();
});

describe('the test really runs west of UTC', () => {
  it('is in Los Angeles', () => {
    expect(SIX_PM_LA.getTimezoneOffset()).toBe(420);
    // What the pre-US-240 code did, to show it is wrong here.
    expect(SIX_PM_LA.toISOString().slice(0, 10)).toBe('2026-10-29');
    expect(new Date('2026-10-29').getDate()).toBe(28);
  });
});

describe('todayCalendarDate / calendarDateInDays', () => {
  it('is the local date, not the UTC one, in the evening', () => {
    expect(todayCalendarDate(SIX_PM_LA)).toBe('2026-10-28');
    expect(calendarDateInDays(0, SIX_PM_LA)).toBe('2026-10-28');
    expect(calendarDateInDays(1, SIX_PM_LA)).toBe('2026-10-29');
  });

  it('a week ahead crosses the DST change (Nov 1) without slipping', () => {
    expect(calendarDateInDays(7, SIX_PM_LA)).toBe('2026-11-04');
    expect(calendarDateInDays(-30, SIX_PM_LA)).toBe('2026-09-28');
  });

  it('defaults to now', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(SIX_PM_LA);
    expect(todayCalendarDate()).toBe('2026-10-28');
  });
});

describe('dueDateToIso', () => {
  it('stores the end of the local due day', () => {
    expect(dueDateToIso('2026-10-29')).toBe('2026-10-30T06:59:59.999Z');
    expect(endOfCalendarDay('2026-10-29')?.getDate()).toBe(29);
  });

  it('a task due tomorrow is not overdue this evening, nor tomorrow evening', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(SIX_PM_LA);
    expect(isPast(new Date(dueDateToIso('2026-10-29')!))).toBe(false);
    vi.setSystemTime(new Date('2026-10-30T01:00:00.000Z')); // 6pm on the 29th
    expect(isPast(new Date(dueDateToIso('2026-10-29')!))).toBe(false);
    vi.setSystemTime(new Date('2026-10-30T08:00:00.000Z')); // 1am on the 30th
    expect(isPast(new Date(dueDateToIso('2026-10-29')!))).toBe(true);
  });

  it('rejects anything that is not a calendar date', () => {
    expect(dueDateToIso('')).toBeNull();
    expect(dueDateToIso('2026-02-31')).toBeNull();
    expect(dueDateToIso('tomorrow')).toBeNull();
  });
});

describe('taskDueAt', () => {
  it('reads a pre-US-240 UTC-midnight value as that calendar day, ending locally', () => {
    expect(taskDueAt('2026-10-29T00:00:00+00:00')?.toISOString()).toBe('2026-10-30T06:59:59.999Z');
    expect(taskDueAt('2026-10-29T00:00:00.000Z')?.toISOString()).toBe('2026-10-30T06:59:59.999Z');
  });

  it('passes any other instant through', () => {
    expect(taskDueAt('2026-10-30T06:59:59.999+00:00')?.toISOString()).toBe(
      '2026-10-30T06:59:59.999Z'
    );
    expect(taskDueAt('2026-10-29T15:30:00Z')?.toISOString()).toBe('2026-10-29T15:30:00.000Z');
  });

  it('is null for nothing', () => {
    expect(taskDueAt(null)).toBeNull();
    expect(taskDueAt(undefined)).toBeNull();
    expect(taskDueAt('garbage')).toBeNull();
  });
});
