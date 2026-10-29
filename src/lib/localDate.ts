/**
 * Date-only values (`<input type="date">`, Postgres `date`) as local calendar
 * days (US-240).
 *
 * `new Date('2026-10-29')` is UTC midnight, which in Los Angeles is 5pm on the
 * 28th; `date.toISOString().slice(0, 10)` is the UTC date, which after 5pm in
 * Los Angeles is already tomorrow. Both put a US agent's dates a day out. Go
 * through these helpers instead.
 */
import { parseCalendarDate, toCalendarDate } from '@/lib/keyDates';

export { parseCalendarDate, toCalendarDate };

/** Today's local date as `YYYY-MM-DD` — the prefill for a date input. */
export function todayCalendarDate(now: Date = new Date()): string {
  return toCalendarDate(now);
}

/** The local date `days` from `from`, as `YYYY-MM-DD`. DST-safe. */
export function calendarDateInDays(days: number, from: Date = new Date()): string {
  return toCalendarDate(new Date(from.getFullYear(), from.getMonth(), from.getDate() + days));
}

/** The last instant of a local calendar day, or null if `value` is not `YYYY-MM-DD`. */
export function endOfCalendarDay(value: string): Date | null {
  const day = parseCalendarDate(value);
  if (!day) return null;
  return new Date(day.getFullYear(), day.getMonth(), day.getDate(), 23, 59, 59, 999);
}

/**
 * A due date picked as a calendar day, as the instant to store: the end of
 * that day where the agent is. A task due tomorrow is not overdue until
 * tomorrow is over.
 */
export function dueDateToIso(value: string): string | null {
  return endOfCalendarDay(value)?.toISOString() ?? null;
}

const UTC_MIDNIGHT = /^(\d{4}-\d{2}-\d{2})T00:00:00(?:\.0+)?(?:Z|\+00(?::?00)?)$/;

/**
 * When a stored task due date falls due, as a Date.
 *
 * Before US-240 the lead modal stored a picked day as `new Date(day)`, i.e.
 * UTC midnight, which west of Greenwich is the afternoon of the day before.
 * Nothing in the app sets a time on a task, so a stored value of exactly UTC
 * midnight is read as that calendar day, ending locally.
 */
export function taskDueAt(stored: string | null | undefined): Date | null {
  if (!stored) return null;
  const legacy = UTC_MIDNIGHT.exec(stored);
  if (legacy) return endOfCalendarDay(legacy[1]);
  const at = new Date(stored);
  return Number.isNaN(at.getTime()) ? null : at;
}
