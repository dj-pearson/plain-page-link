/**
 * Key dates in a client's life, and when they next come round.
 *
 * The point of recording that a past client's daughter turns seven on the 14th
 * is being told on the 7th. Everything here is pure date arithmetic so the
 * dashboard, the client page and the tests agree on what "upcoming" means.
 *
 * Dates arrive as `YYYY-MM-DD` strings (Postgres `date`) and are handled as
 * local calendar days, never through `new Date(string)`, which parses a bare
 * date as UTC midnight and so shifts it a day west of Greenwich.
 */

export type KeyDateKind =
  | 'birthday'
  | 'anniversary'
  | 'home_anniversary'
  | 'closing'
  | 'move_in'
  | 'lease_end'
  | 'party'
  | 'custom';

export const KEY_DATE_KINDS: { value: KeyDateKind; label: string; recurs: boolean }[] = [
  { value: 'birthday', label: 'Birthday', recurs: true },
  { value: 'anniversary', label: 'Wedding anniversary', recurs: true },
  { value: 'home_anniversary', label: 'Home anniversary', recurs: true },
  { value: 'closing', label: 'Closing date', recurs: false },
  { value: 'move_in', label: 'Move-in date', recurs: false },
  { value: 'lease_end', label: 'Lease ends', recurs: false },
  { value: 'party', label: 'Party / event', recurs: false },
  { value: 'custom', label: 'Other', recurs: false },
];

export function keyDateKindLabel(kind: string): string {
  return KEY_DATE_KINDS.find((k) => k.value === kind)?.label ?? 'Date';
}

/** The fields of a contact_key_dates row this module reads. */
export interface KeyDateLike {
  kind: string;
  event_date: string;
  year_known: boolean;
  recurs_annually: boolean;
  remind_days_before: number;
}

export interface UpcomingKeyDate<T extends KeyDateLike> {
  keyDate: T;
  /** The next day it falls on, at local midnight. */
  occursOn: Date;
  /** 0 is today. */
  daysAway: number;
  /** Age or anniversary number on that day, when the year is known. */
  years: number | null;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Parses `YYYY-MM-DD` as a local calendar day. Returns null for anything else. */
export function parseCalendarDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return null;
  const [, y, m, d] = match;
  const date = new Date(Number(y), Number(m) - 1, Number(d));
  // Reject rollovers such as 2026-02-31 → March 3rd.
  if (date.getMonth() !== Number(m) - 1 || date.getDate() !== Number(d)) return null;
  return date;
}

/** Formats a Date as `YYYY-MM-DD` in local time. */
export function toCalendarDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/** month/day in a given year; Feb 29 falls on Feb 28 in a common year. */
function inYear(month: number, day: number, year: number): Date {
  if (month === 1 && day === 29 && !isLeapYear(year)) return new Date(year, 1, 28);
  return new Date(year, month, day);
}

/**
 * The next day on or after `today` the date falls on. A one-off date that has
 * passed has no next occurrence.
 */
export function nextOccurrence(
  eventDate: string,
  recursAnnually: boolean,
  today: Date = new Date()
): Date | null {
  const date = parseCalendarDate(eventDate);
  if (!date) return null;
  const day0 = startOfDay(today);

  if (!recursAnnually) return date >= day0 ? date : null;

  const thisYear = inYear(date.getMonth(), date.getDate(), day0.getFullYear());
  if (thisYear >= day0) return thisYear;
  return inYear(date.getMonth(), date.getDate(), day0.getFullYear() + 1);
}

/** Whole calendar days from `today` to `date`; DST-safe. */
export function daysBetween(today: Date, date: Date): number {
  const a = startOfDay(today);
  const b = startOfDay(date);
  const utcA = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const utcB = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((utcB - utcA) / MS_PER_DAY);
}

/**
 * Every key date that falls within `windowDays` of today, soonest first.
 * Today counts (daysAway 0).
 */
export function upcomingKeyDates<T extends KeyDateLike>(
  dates: T[],
  today: Date = new Date(),
  windowDays = 30
): UpcomingKeyDate<T>[] {
  const out: UpcomingKeyDate<T>[] = [];
  for (const keyDate of dates) {
    const occursOn = nextOccurrence(keyDate.event_date, keyDate.recurs_annually, today);
    if (!occursOn) continue;
    const daysAway = daysBetween(today, occursOn);
    if (daysAway < 0 || daysAway > windowDays) continue;

    let years: number | null = null;
    const original = parseCalendarDate(keyDate.event_date);
    if (keyDate.recurs_annually && keyDate.year_known && original) {
      const n = occursOn.getFullYear() - original.getFullYear();
      years = n > 0 ? n : null;
    }
    out.push({ keyDate, occursOn, daysAway, years });
  }
  return out.sort((a, b) => a.daysAway - b.daysAway);
}

/** True once the date is inside the reminder lead time the agent chose for it. */
export function isReminderDue(item: UpcomingKeyDate<KeyDateLike>): boolean {
  return item.daysAway <= item.keyDate.remind_days_before;
}

export function ordinal(n: number): string {
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`;
  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}

/**
 * What the occasion is, in the words an agent would use on a card:
 * "turns 7", "12th anniversary", "3 years in their home".
 */
export function describeOccasion(kind: string, years: number | null): string | null {
  if (years === null) return null;
  switch (kind) {
    case 'birthday':
      return `turns ${years}`;
    case 'anniversary':
      return `${ordinal(years)} anniversary`;
    case 'home_anniversary':
      return years === 1 ? '1 year in their home' : `${years} years in their home`;
    default:
      return `${ordinal(years)} year`;
  }
}

/** "Today", "Tomorrow", "In 5 days". */
export function describeDaysAway(daysAway: number): string {
  if (daysAway === 0) return 'Today';
  if (daysAway === 1) return 'Tomorrow';
  return `In ${daysAway} days`;
}

/** A contact is due for a touch once next_touch_at is today or earlier. */
export function isTouchDue(nextTouchAt: string | null, now: Date = new Date()): boolean {
  if (!nextTouchAt) return false;
  const due = new Date(nextTouchAt);
  if (Number.isNaN(due.getTime())) return false;
  return daysBetween(now, due) <= 0;
}

/** Common stay-in-touch cadences, for the contact form's select. */
export const TOUCH_FREQUENCIES: { value: number; label: string }[] = [
  { value: 7, label: 'Weekly' },
  { value: 14, label: 'Every 2 weeks' },
  { value: 30, label: 'Monthly' },
  { value: 60, label: 'Every 2 months' },
  { value: 90, label: 'Quarterly' },
  { value: 180, label: 'Twice a year' },
  { value: 365, label: 'Yearly' },
];
