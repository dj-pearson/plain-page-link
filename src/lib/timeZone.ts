/**
 * The agent's time zone (US-433): profiles.timezone, an IANA name.
 *
 * The scheduled jobs use it to send the morning email at the agent's own
 * morning (US-343) and, next, to keep the overdue-lead chaser out of the night
 * (US-318). NULL means "not set": the jobs fall back to UTC. The database
 * validates the name against pg_timezone_names (validate_profile_timezone);
 * this file only picks and labels one.
 */

/** A short list for engines without Intl.supportedValuesOf (Safari < 15.4). */
const FALLBACK_ZONES = [
  'Pacific/Honolulu',
  'America/Anchorage',
  'America/Los_Angeles',
  'America/Phoenix',
  'America/Denver',
  'America/Chicago',
  'America/New_York',
  'America/Halifax',
  'America/St_Johns',
  'America/Puerto_Rico',
  'America/Mexico_City',
  'America/Toronto',
  'America/Vancouver',
  'America/Sao_Paulo',
  'Europe/London',
  'Europe/Dublin',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Madrid',
  'Europe/Athens',
  'Africa/Johannesburg',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Singapore',
  'Asia/Hong_Kong',
  'Asia/Tokyo',
  'Australia/Perth',
  'Australia/Brisbane',
  'Australia/Sydney',
  'Pacific/Auckland',
  'UTC',
];

/** True when this browser can compute with `value` as a time zone. */
export function isValidTimeZone(value: unknown): value is string {
  if (typeof value !== 'string' || value.trim() === '' || value.length > 64) return false;
  if (value.startsWith('posix/') || value.startsWith('right/')) return false;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

/** The zone this device is set to, or null when the browser will not say. */
export function detectBrowserTimeZone(): string | null {
  try {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return isValidTimeZone(zone) ? zone : null;
  } catch {
    return null;
  }
}

type IntlWithValues = typeof Intl & { supportedValuesOf?: (key: 'timeZone') => string[] };

/**
 * Every zone the browser knows, plus `include` (the stored or detected zone,
 * so the picker can always show the current value), sorted by name.
 */
export function listTimeZones(include: (string | null | undefined)[] = []): string[] {
  let zones: string[] = [];
  try {
    zones = (Intl as IntlWithValues).supportedValuesOf?.('timeZone') ?? [];
  } catch {
    zones = [];
  }
  if (zones.length === 0) zones = FALLBACK_ZONES;
  const all = new Set(zones);
  // supportedValuesOf leaves out UTC in some engines.
  all.add('UTC');
  for (const zone of include) if (isValidTimeZone(zone)) all.add(zone);
  return [...all].sort((a, b) => a.localeCompare(b));
}

/** "GMT-8", "GMT+5:30", "GMT" at `at`, or '' when the engine cannot say. */
export function timeZoneOffsetLabel(timeZone: string, at: Date = new Date()): string {
  try {
    const part = new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'shortOffset' })
      .formatToParts(at)
      .find((p) => p.type === 'timeZoneName');
    return part?.value ?? '';
  } catch {
    return '';
  }
}

/** "America/Los_Angeles" → "America / Los Angeles (GMT-8)". */
export function timeZoneLabel(timeZone: string, at: Date = new Date()): string {
  const name = timeZone.split('/').join(' / ').replace(/_/g, ' ');
  const offset = timeZoneOffsetLabel(timeZone, at);
  return offset ? `${name} (${offset})` : name;
}

/** The local time in `timeZone`, e.g. "7:05 AM", for "it is now … there". */
export function localTimeIn(timeZone: string, at: Date = new Date()): string {
  try {
    return new Intl.DateTimeFormat('en-US', {
      timeZone,
      hour: 'numeric',
      minute: '2-digit',
    }).format(at);
  } catch {
    return '';
  }
}
