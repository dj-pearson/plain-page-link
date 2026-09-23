import { describe, it, expect } from 'vitest';
import {
  daysBetween,
  describeOccasion,
  isReminderDue,
  isTouchDue,
  nextOccurrence,
  ordinal,
  parseCalendarDate,
  toCalendarDate,
  upcomingKeyDates,
  type KeyDateLike,
} from './keyDates';

const day = (y: number, m: number, d: number) => new Date(y, m - 1, d);

const keyDate = (overrides: Partial<KeyDateLike> & { event_date: string }): KeyDateLike => ({
  kind: 'birthday',
  year_known: true,
  recurs_annually: true,
  remind_days_before: 7,
  ...overrides,
});

describe('parseCalendarDate', () => {
  it('reads YYYY-MM-DD as a local day, not UTC midnight', () => {
    const d = parseCalendarDate('2026-03-14');
    expect(d?.getFullYear()).toBe(2026);
    expect(d?.getMonth()).toBe(2);
    expect(d?.getDate()).toBe(14);
  });

  it('rejects impossible dates instead of rolling them over', () => {
    expect(parseCalendarDate('2026-02-31')).toBeNull();
    expect(parseCalendarDate('not a date')).toBeNull();
  });

  it('round-trips through toCalendarDate', () => {
    expect(toCalendarDate(parseCalendarDate('2024-02-29')!)).toBe('2024-02-29');
  });
});

describe('nextOccurrence', () => {
  it('returns this year when the day is still ahead', () => {
    expect(nextOccurrence('1990-10-01', true, day(2026, 9, 23))).toEqual(day(2026, 10, 1));
  });

  it('counts today as upcoming', () => {
    expect(nextOccurrence('1990-09-23', true, day(2026, 9, 23))).toEqual(day(2026, 9, 23));
  });

  it('rolls into next year once the day has passed', () => {
    expect(nextOccurrence('1990-01-05', true, day(2026, 9, 23))).toEqual(day(2027, 1, 5));
  });

  it('puts a Feb 29 birthday on Feb 28 in a common year', () => {
    expect(nextOccurrence('2000-02-29', true, day(2026, 1, 1))).toEqual(day(2026, 2, 28));
    expect(nextOccurrence('2000-02-29', true, day(2028, 1, 1))).toEqual(day(2028, 2, 29));
  });

  it('gives a one-off date no next occurrence once it has passed', () => {
    expect(nextOccurrence('2026-09-01', false, day(2026, 9, 23))).toBeNull();
    expect(nextOccurrence('2026-10-15', false, day(2026, 9, 23))).toEqual(day(2026, 10, 15));
  });
});

describe('daysBetween', () => {
  it('counts calendar days across a DST change', () => {
    expect(daysBetween(day(2026, 3, 7), day(2026, 3, 9))).toBe(2);
    expect(daysBetween(day(2026, 10, 31), day(2026, 11, 2))).toBe(2);
  });
});

describe('upcomingKeyDates', () => {
  const today = day(2026, 9, 23);

  it('keeps dates inside the window, soonest first, with the age they reach', () => {
    const emma = keyDate({ event_date: '2019-10-01' });
    const wedding = keyDate({ kind: 'anniversary', event_date: '2014-09-25' });
    const farAway = keyDate({ event_date: '1980-12-25' });

    const result = upcomingKeyDates([emma, wedding, farAway], today, 30);

    expect(result.map((r) => r.keyDate)).toEqual([wedding, emma]);
    expect(result[0]).toMatchObject({ daysAway: 2, years: 12 });
    expect(result[1]).toMatchObject({ daysAway: 8, years: 7 });
  });

  it('computes no age when the year is a placeholder', () => {
    const [item] = upcomingKeyDates(
      [keyDate({ event_date: '2000-09-30', year_known: false })],
      today
    );
    expect(item.years).toBeNull();
  });

  it('wraps across the new year', () => {
    const [item] = upcomingKeyDates([keyDate({ event_date: '1985-01-02' })], day(2026, 12, 28));
    expect(item.daysAway).toBe(5);
    expect(item.years).toBe(42);
  });

  it('includes a one-off move-in date but not once it has passed', () => {
    const moveIn = keyDate({ kind: 'move_in', event_date: '2026-10-10', recurs_annually: false });
    expect(upcomingKeyDates([moveIn], today)).toHaveLength(1);
    expect(upcomingKeyDates([moveIn], day(2026, 10, 11))).toHaveLength(0);
  });
});

describe('isReminderDue', () => {
  it('fires inside the lead time the agent chose', () => {
    const [soon] = upcomingKeyDates(
      [keyDate({ event_date: '1990-09-28', remind_days_before: 7 })],
      day(2026, 9, 23)
    );
    const [later] = upcomingKeyDates(
      [keyDate({ event_date: '1990-10-10', remind_days_before: 7 })],
      day(2026, 9, 23)
    );
    expect(isReminderDue(soon)).toBe(true);
    expect(isReminderDue(later)).toBe(false);
  });
});

describe('describeOccasion', () => {
  it('speaks the way a card would', () => {
    expect(describeOccasion('birthday', 7)).toBe('turns 7');
    expect(describeOccasion('anniversary', 12)).toBe('12th anniversary');
    expect(describeOccasion('home_anniversary', 1)).toBe('1 year in their home');
    expect(describeOccasion('home_anniversary', 3)).toBe('3 years in their home');
    expect(describeOccasion('birthday', null)).toBeNull();
  });

  it('gets the awkward ordinals right', () => {
    expect([1, 2, 3, 4, 11, 12, 13, 21, 22, 101, 111].map(ordinal)).toEqual([
      '1st',
      '2nd',
      '3rd',
      '4th',
      '11th',
      '12th',
      '13th',
      '21st',
      '22nd',
      '101st',
      '111th',
    ]);
  });
});

describe('isTouchDue', () => {
  const now = new Date(2026, 8, 23, 15, 0);

  it('is due on the day and after', () => {
    expect(isTouchDue(new Date(2026, 8, 23, 9, 0).toISOString(), now)).toBe(true);
    expect(isTouchDue(new Date(2026, 8, 1).toISOString(), now)).toBe(true);
  });

  it('is not due before the day, or without a cadence', () => {
    expect(isTouchDue(new Date(2026, 8, 24, 9, 0).toISOString(), now)).toBe(false);
    expect(isTouchDue(null, now)).toBe(false);
  });
});
