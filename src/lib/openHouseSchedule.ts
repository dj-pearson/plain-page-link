/**
 * Open-house wall times in the agent's own time zone (US-628, from US-627).
 *
 * An open house is "Saturday, 1 to 3" at the property, not in whatever zone
 * the agent's laptop happens to be in. The form used `new Date('…T13:00')`,
 * which is browser-local, so an agent in Denver scheduling a Chicago listing
 * from a hotel saved the wrong instant, and the dashboard showed it in the
 * hotel's zone. These helpers convert between a wall-clock date/time in an
 * IANA zone (profiles.timezone, US-433) and an ISO instant, using only Intl —
 * no date-fns-tz.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * How far in the past a start may be and still be saved: an open house that
 * began a few minutes ago ("I forgot to schedule it, it's on now") is real;
 * one that began yesterday only burns the month's allowance and opens the
 * kiosk for a house nobody is standing in.
 */
export const PAST_START_GRACE_MS = 30 * 60 * 1000;

interface WallParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}

const formatterCache = new Map<string, Intl.DateTimeFormat>();

function formatterFor(timeZone: string): Intl.DateTimeFormat {
  let f = formatterCache.get(timeZone);
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
    formatterCache.set(timeZone, f);
  }
  return f;
}

/** The wall-clock fields of `at` as seen in `timeZone`. */
function wallParts(at: Date, timeZone: string): WallParts {
  const parts = formatterFor(timeZone).formatToParts(at);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value ?? '0');
  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    // Some engines still print midnight as 24 under h23.
    hour: get('hour') % 24,
    minute: get('minute'),
  };
}

/** Milliseconds `timeZone` is ahead of UTC at `at`. */
function offsetMs(at: Date, timeZone: string): number {
  const p = wallParts(at, timeZone);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute);
  // Drop seconds/ms from `at` so they do not leak into the offset.
  const floored = Math.floor(at.getTime() / 60000) * 60000;
  return asUtc - floored;
}

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * "2026-11-14" + "13:00" in "America/Chicago" → the ISO instant.
 *
 * A time skipped by a spring-forward gap moves forward by the gap (2:30 on
 * the night clocks jump from 2:00 to 3:00 becomes 3:30); a time repeated by a
 * fall-back resolves to its first occurrence.
 */
export function wallTimeToIso(date: string, time: string, timeZone: string): string {
  const [y, mo, d] = date.split('-').map(Number);
  const [h, mi] = time.split(':').map(Number);
  const guess = Date.UTC(y, mo - 1, d, h, mi);
  // Two passes settle every zone, including across a DST change between the
  // guess and the answer.
  const first = guess - offsetMs(new Date(guess), timeZone);
  const second = guess - offsetMs(new Date(first), timeZone);
  if (first === second) {
    // Fall-back overlap: an hour earlier may show the same wall time; prefer it.
    const earlier = first - 60 * 60 * 1000;
    const p = wallParts(new Date(earlier), timeZone);
    if (p.hour === h && p.minute === mi && p.day === d) return new Date(earlier).toISOString();
    return new Date(first).toISOString();
  }
  // Spring-forward gap: neither candidate shows the asked wall time; the later
  // one is the asked time moved forward by the gap.
  return new Date(Math.max(first, second)).toISOString();
}

/** An ISO instant → its date ("yyyy-MM-dd") and time ("HH:mm") in `timeZone`. */
export function isoToWallTime(iso: string, timeZone: string): { date: string; time: string } {
  const p = wallParts(new Date(iso), timeZone);
  return {
    date: `${p.year}-${pad(p.month)}-${pad(p.day)}`,
    time: `${pad(p.hour)}:${pad(p.minute)}`,
  };
}

/** The date an open house defaults to: today if it is Saturday there, else next Saturday. */
export function defaultOpenHouseDate(timeZone: string, now: Date = new Date()): string {
  const p = wallParts(now, timeZone);
  const today = Date.UTC(p.year, p.month - 1, p.day);
  const weekday = new Date(today).getUTCDay(); // 0 = Sunday … 6 = Saturday
  const saturday = new Date(today + ((6 - weekday + 7) % 7) * DAY_MS);
  return `${saturday.getUTCFullYear()}-${pad(saturday.getUTCMonth() + 1)}-${pad(saturday.getUTCDate())}`;
}

/**
 * Why this start cannot be saved, or null when it can.
 *
 * Editing an open house whose start has not moved is always allowed, so the
 * agent can fix the notes on one that already happened.
 */
export function pastStartError(
  startsAtIso: string,
  now: Date = new Date(),
  originalStartsAtIso?: string | null
): string | null {
  const start = new Date(startsAtIso).getTime();
  if (originalStartsAtIso && new Date(originalStartsAtIso).getTime() === start) return null;
  if (start < now.getTime() - PAST_START_GRACE_MS) {
    return 'That start time has already passed. Choose a date and time that is still ahead.';
  }
  return null;
}

/** "Sat, Nov 14 · 1:00–3:00 PM" in `timeZone`, the year added when it is not this year. */
export function formatOpenHouseWhen(
  startsAt: string,
  endsAt: string,
  timeZone: string,
  now: Date = new Date()
): string {
  const s = new Date(startsAt);
  const e = new Date(endsAt);
  const sameYear = wallParts(s, timeZone).year === wallParts(now, timeZone).year;
  const day = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    ...(sameYear ? {} : { year: 'numeric' }),
  }).format(s);
  const timeFmt = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour: 'numeric',
    minute: '2-digit',
  });
  const partsOf = (d: Date) => {
    const parts = timeFmt.formatToParts(d);
    const clock = parts
      .filter((p) => p.type === 'hour' || p.type === 'minute' || p.type === 'literal')
      .map((p) => p.value)
      .join('')
      .trim();
    const period = parts.find((p) => p.type === 'dayPeriod')?.value ?? '';
    return { clock, period };
  };
  const a = partsOf(s);
  const b = partsOf(e);
  const range =
    a.period === b.period
      ? `${a.clock}–${b.clock} ${b.period}`
      : `${a.clock} ${a.period}–${b.clock} ${b.period}`;
  return `${day} · ${range.trim()}`;
}
