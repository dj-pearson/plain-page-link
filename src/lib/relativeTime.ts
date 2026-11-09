/**
 * "3 days ago" / "in about 2 hours", without date-fns (US-558).
 *
 * src/lib/format.ts used date-fns' formatDistance for formatRelativeTime, and
 * because format.ts is one shared chunk, every route that only wanted
 * formatPrice or parsePrice (Listings, the public profile, the listing page,
 * Analytics) also downloaded date-vendor (6.3 KB gzip). This is a port of
 * formatDistance(date, base, { addSuffix: true }) for the en-US locale, the
 * only way the app calls it. relativeTime.test.ts holds it to date-fns
 * output across thousands of offsets, so the wording agents see is unchanged.
 */

const MINUTES_IN_DAY = 1440;
const MINUTES_IN_ALMOST_TWO_DAYS = 2520;
const MINUTES_IN_MONTH = 43200;

function plural(count: number, one: string, other: string): string {
  return count === 1 ? one : other.replace('{n}', String(count));
}

function isLastDayOfMonth(date: Date): boolean {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate() === date.getDate();
}

function compareAsc(a: Date, b: Date): number {
  const diff = a.getTime() - b.getTime();
  return diff < 0 ? -1 : diff > 0 ? 1 : 0;
}

/** date-fns differenceInMonths: full months between two dates, signed. */
export function differenceInMonths(left: Date, right: Date): number {
  const shifted = new Date(left.getTime());
  const sign = compareAsc(shifted, right);
  const difference = Math.abs(
    (left.getFullYear() - right.getFullYear()) * 12 + (left.getMonth() - right.getMonth())
  );
  if (difference < 1) return 0;

  if (shifted.getMonth() === 1 && shifted.getDate() > 27) shifted.setDate(30);
  shifted.setMonth(shifted.getMonth() - sign * difference);

  let isLastMonthNotFull = compareAsc(shifted, right) === -sign;
  if (isLastDayOfMonth(left) && difference === 1 && compareAsc(left, right) === 1) {
    isLastMonthNotFull = false;
  }
  const result = sign * (difference - Number(isLastMonthNotFull));
  return result === 0 ? 0 : result;
}

/**
 * date-fns formatDistance(date, base) without a suffix: "3 days", "about 1
 * hour". The direction is not stated. Used where the caller writes its own
 * "ago" (US-655).
 */
export function formatDistanceWords(date: Date, base: Date): string {
  return distance(date, base).words;
}

function distance(date: Date, base: Date): { words: string; comparison: number } {
  const comparison = compareAsc(date, base);
  if (Number.isNaN(date.getTime()) || Number.isNaN(base.getTime())) {
    throw new RangeError('Invalid time value');
  }
  const [earlier, later] = comparison > 0 ? [base, date] : [date, base];

  const seconds = Math.trunc((later.getTime() - earlier.getTime()) / 1000);
  // Daylight-saving shifts between the two dates do not count as elapsed time.
  const offsetInSeconds = (later.getTimezoneOffset() - earlier.getTimezoneOffset()) * 60;
  const minutes = Math.round((seconds - offsetInSeconds) / 60);

  let words: string;
  if (minutes < 2) {
    words = minutes === 0 ? 'less than a minute' : plural(minutes, '1 minute', '{n} minutes');
  } else if (minutes < 45) {
    words = plural(minutes, '1 minute', '{n} minutes');
  } else if (minutes < 90) {
    words = 'about 1 hour';
  } else if (minutes < MINUTES_IN_DAY) {
    words = plural(Math.round(minutes / 60), 'about 1 hour', 'about {n} hours');
  } else if (minutes < MINUTES_IN_ALMOST_TWO_DAYS) {
    words = '1 day';
  } else if (minutes < MINUTES_IN_MONTH) {
    words = plural(Math.round(minutes / MINUTES_IN_DAY), '1 day', '{n} days');
  } else if (minutes < MINUTES_IN_MONTH * 2) {
    words = plural(Math.round(minutes / MINUTES_IN_MONTH), 'about 1 month', 'about {n} months');
  } else {
    const months = differenceInMonths(later, earlier);
    if (months < 12) {
      words = plural(Math.round(minutes / MINUTES_IN_MONTH), '1 month', '{n} months');
    } else {
      const monthsSinceStartOfYear = months % 12;
      const years = Math.trunc(months / 12);
      if (monthsSinceStartOfYear < 3) {
        words = plural(years, 'about 1 year', 'about {n} years');
      } else if (monthsSinceStartOfYear < 9) {
        words = plural(years, 'over 1 year', 'over {n} years');
      } else {
        words = plural(years + 1, 'almost 1 year', 'almost {n} years');
      }
    }
  }

  return { words, comparison };
}

/** The distance from `base` to `date` in words, with "ago" or "in". */
export function formatDistanceWithSuffix(date: Date, base: Date): string {
  const { words, comparison } = distance(date, base);
  return comparison > 0 ? `in ${words}` : `${words} ago`;
}

/**
 * date-fns formatDistanceToNow(date, { addSuffix: true }): the distance from
 * now, with "ago" or "in". Throws RangeError on an invalid date, as date-fns
 * does.
 */
export function formatDistanceToNowWithSuffix(date: Date | number): string {
  return formatDistanceWithSuffix(date instanceof Date ? date : new Date(date), new Date());
}

/**
 * date-fns formatDistanceToNow(date) without a suffix: the distance from now,
 * in words, either direction. Throws RangeError on an invalid date.
 */
export function formatDistanceToNowWords(date: Date | number): string {
  return formatDistanceWords(date instanceof Date ? date : new Date(date), new Date());
}
