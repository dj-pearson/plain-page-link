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
import { detectBrowserTimeZone, isValidTimeZone } from '@/lib/timeZone';

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
  const shows = (at: number) => {
    const p = wallParts(new Date(at), timeZone);
    return p.year === y && p.month === mo && p.day === d && p.hour === h && p.minute === mi;
  };
  // Either pass can be the right one: in a zone behind UTC, a valid time on
  // the spring-forward day whose naive UTC guess falls before the transition
  // is answered by the second pass, not the first. Keep whichever reads back
  // as the asked wall time. An hour earlier is also tried, so a time repeated
  // by a fall-back resolves to its first occurrence.
  const hour = 60 * 60 * 1000;
  const matches = [first, second, first - hour, second - hour].filter(shows);
  if (matches.length > 0) return new Date(Math.min(...matches)).toISOString();
  // Spring-forward gap: no instant shows the asked wall time; the later
  // candidate is the asked time moved forward by the gap.
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

export interface OpenHouseWhenOptions {
  /** "Saturday, November 14" rather than "Sat, Nov 14" (the kiosk). */
  long?: boolean;
  /**
   * Append the zone's short name ("CST"), for a visitor whose own zone is not
   * the agent's — see needsZoneLabel.
   */
  zoneLabel?: boolean;
}

/**
 * "Sat, Nov 14 · 1:00–3:00 PM" in `timeZone`, the year added when it is not
 * this year. With `zoneLabel`, "… 1:00–3:00 PM CST".
 */
export function formatOpenHouseWhen(
  startsAt: string,
  endsAt: string,
  timeZone: string,
  now: Date = new Date(),
  options: OpenHouseWhenOptions = {}
): string {
  const s = new Date(startsAt);
  const e = new Date(endsAt);
  const sameYear = wallParts(s, timeZone).year === wallParts(now, timeZone).year;
  const day = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: options.long ? 'long' : 'short',
    month: options.long ? 'long' : 'short',
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
  const zone = options.zoneLabel ? zoneShortName(timeZone, s) : '';
  return `${day} · ${[range.trim(), zone].filter(Boolean).join(' ')}`;
}

/** "CST", "PDT", or "GMT+1" where en-US has no abbreviation; '' if unknown. */
function zoneShortName(timeZone: string, at: Date): string {
  try {
    return (
      new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'short' })
        .formatToParts(at)
        .find((p) => p.type === 'timeZoneName')?.value ?? ''
    );
  } catch {
    return '';
  }
}

/**
 * The zone a visitor-facing open-house time is shown in (US-669): the agent's
 * (list_public_open_houses / get_public_open_house return it as time_zone),
 * else the visitor's own zone — what every visitor saw before — else UTC.
 */
export function visitorOpenHouseTimeZone(agentZone: unknown): string {
  if (isValidTimeZone(agentZone)) return agentZone;
  return detectBrowserTimeZone() ?? 'UTC';
}

/**
 * True when the times should carry the zone's name: the visitor's clock reads
 * differently from the agent's at that instant, so "1:00 PM" alone would be
 * read as the visitor's 1:00 PM.
 */
export function needsZoneLabel(
  timeZone: string,
  at: Date,
  viewerZone: string | null = detectBrowserTimeZone()
): boolean {
  if (!viewerZone || viewerZone === timeZone) return false;
  return offsetMs(at, timeZone) !== offsetMs(at, viewerZone);
}

/** "2026-11-14": the open house's date where it happens, for a file name. */
export function openHouseLocalDate(startsAt: string, timeZone: string): string {
  return isoToWallTime(startsAt, timeZone).date;
}

/**
 * The agent-facing words for an open-house save the database refused for its
 * times, or null when the refusal is about something else.
 *
 * check_open_house_start (20261108000651) refuses a start more than
 * PAST_START_GRACE_MS in the past with DETAIL `open_house:past_start` — the
 * form checks first, but its clock can drift from the server's, or the dialog
 * can sit open past the grace. The open_houses_ends_after_start CHECK refuses
 * an end at or before the start.
 */
export function openHouseSaveErrorMessage(error: unknown): string | null {
  if (!error || typeof error !== 'object') return null;
  const e = error as { details?: unknown; message?: unknown };
  const text = [e.details, e.message].filter((v): v is string => typeof v === 'string').join(' ');
  if (text.includes('open_house:past_start')) {
    return 'That start time has already passed. Choose a date and time that is still ahead.';
  }
  if (text.includes('open_houses_ends_after_start')) {
    return 'End time must be after the start time.';
  }
  return null;
}
