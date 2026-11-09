/**
 * "3 days ago", "in 2 hours", "yesterday": a relative time from the
 * platform's Intl.RelativeTimeFormat, with no date library.
 *
 * date-fns' formatDistanceToNow did this on the Leads list, and it was the
 * only reason date-vendor (6.3 KB gzip) loaded with that route (US-476).
 * Use this where a list only needs "how long ago"; keep date-fns for real
 * calendar formatting.
 */
const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 365 * 24 * 60 * 60 * 1000],
  ['month', 30 * 24 * 60 * 60 * 1000],
  ['week', 7 * 24 * 60 * 60 * 1000],
  ['day', 24 * 60 * 60 * 1000],
  ['hour', 60 * 60 * 1000],
  ['minute', 60 * 1000],
];

let formatter: Intl.RelativeTimeFormat | null = null;

export function timeAgo(date: string | number | Date, now: Date = new Date()): string {
  const then = date instanceof Date ? date : new Date(date);
  const diff = then.getTime() - now.getTime();
  if (!Number.isFinite(diff)) return '';
  formatter ??= new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  for (const [unit, ms] of UNITS) {
    if (Math.abs(diff) >= ms) return formatter.format(Math.round(diff / ms), unit);
  }
  return 'just now';
}
