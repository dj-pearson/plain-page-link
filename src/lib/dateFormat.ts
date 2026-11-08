/**
 * Calendar formatting for the few patterns the dashboard uses, without
 * date-fns (US-574).
 *
 * date-fns' format() was the only reason date-vendor (6.2 KB gzip) loaded on
 * the dashboard Overview — the first screen after sign-in — and in the lead
 * detail dialog. This covers the tokens those screens use, in en-US, with the
 * same output as date-fns (dateFormat.test.ts holds it to date-fns):
 *
 *   EEE  Mon     MMM  Jan     d  1-31     dd  01-31
 *   h    1-12    hh   01-12   mm 00-59    a   AM/PM    yyyy  2026
 *
 * Anything else that is a letter is refused rather than guessed, so a new
 * pattern fails in its test instead of rendering nonsense. Punctuation, spaces
 * and other characters pass through. For anything richer, use Intl or keep
 * date-fns on a route that is already paying for it.
 */

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const TOKEN = /yyyy|EEE|MMM|dd|d|hh|h|mm|a|[A-Za-z]/g;

const pad = (n: number) => String(n).padStart(2, '0');

function token(date: Date, t: string): string {
  const hour12 = date.getHours() % 12 || 12;
  switch (t) {
    case 'yyyy':
      return String(date.getFullYear());
    case 'EEE':
      return WEEKDAYS[date.getDay()];
    case 'MMM':
      return MONTHS[date.getMonth()];
    case 'dd':
      return pad(date.getDate());
    case 'd':
      return String(date.getDate());
    case 'hh':
      return pad(hour12);
    case 'h':
      return String(hour12);
    case 'mm':
      return pad(date.getMinutes());
    case 'a':
      return date.getHours() < 12 ? 'AM' : 'PM';
    default:
      throw new RangeError(`formatDate: unsupported token "${t}"`);
  }
}

/** Format `date` (local time) with a date-fns-style pattern. */
export function formatDate(date: Date | number, pattern: string): string {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) throw new RangeError('Invalid time value');
  return pattern.replace(TOKEN, (t) => token(d, t));
}

/** date-fns isPast: is `date` before now. */
export function isPast(date: Date | number): boolean {
  return (date instanceof Date ? date.getTime() : date) < Date.now();
}
