/**
 * IANA time-zone arithmetic for the scheduled jobs (US-433), with Intl only:
 * no Deno globals and no dependency, so it runs under vitest too.
 *
 * profiles.timezone is validated by the database against pg_timezone_names,
 * but the runtime's Intl is the judge here: a name it does not accept is
 * treated as unset, and the caller falls back to UTC rather than throwing.
 */

const formatters = new Map<string, Intl.DateTimeFormat>();

function formatter(timeZone: string): Intl.DateTimeFormat {
  let f = formatters.get(timeZone);
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    formatters.set(timeZone, f);
  }
  return f;
}

/** True when `value` is a zone name this runtime can compute with. */
export function isValidTimeZone(value: unknown): value is string {
  if (typeof value !== 'string' || value.trim() === '' || value.length > 64) return false;
  try {
    formatter(value);
    return true;
  } catch {
    return false;
  }
}

/** The zone name when usable, otherwise null (the caller's UTC fallback). */
export function normalizeTimeZone(value: unknown): string | null {
  return isValidTimeZone(value) ? value : null;
}

export interface ZonedParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

/** The wall-clock reading of `date` in `timeZone`. */
export function zonedParts(date: Date, timeZone: string): ZonedParts {
  const parts: Record<string, number> = {};
  for (const p of formatter(timeZone).formatToParts(date)) {
    if (p.type !== 'literal') parts[p.type] = Number(p.value);
  }
  return {
    year: parts.year,
    month: parts.month,
    day: parts.day,
    // Some engines print midnight as 24 even with h23.
    hour: parts.hour === 24 ? 0 : parts.hour,
    minute: parts.minute,
    second: parts.second,
  };
}

const pad = (n: number) => String(n).padStart(2, '0');

/** `date`'s calendar date in `timeZone`, as `YYYY-MM-DD`. */
export function localDateIn(date: Date, timeZone: string): string {
  const p = zonedParts(date, timeZone);
  return `${p.year}-${pad(p.month)}-${pad(p.day)}`;
}

/** Milliseconds `timeZone` is ahead of UTC at `date`. */
function offsetMs(date: Date, timeZone: string): number {
  const p = zonedParts(date, timeZone);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return asUtc - Math.floor(date.getTime() / 1000) * 1000;
}

/**
 * The instant at which the wall clock in `timeZone` reads `hour`:00 on `day`
 * (`YYYY-MM-DD`). In a spring-forward gap the hour does not exist and the
 * result is the first instant after it; in a fall-back overlap it is the
 * earlier of the two.
 */
export function zonedTimeToUtc(day: string, hour: number, timeZone: string): Date {
  const [y, m, d] = day.split('-').map(Number);
  const wall = Date.UTC(y, m - 1, d, hour);
  // Two passes settle every real zone, including across a DST change.
  let guess = wall - offsetMs(new Date(wall), timeZone);
  guess = wall - offsetMs(new Date(guess), timeZone);
  return new Date(guess);
}

/** `day` plus `n` calendar days, as `YYYY-MM-DD`. */
export function addDays(day: string, n: number): string {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}
