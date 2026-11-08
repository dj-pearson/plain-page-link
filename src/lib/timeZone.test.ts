import { describe, it, expect, vi, afterEach } from 'vitest';
import { detectBrowserTimeZone, isValidTimeZone, listTimeZones, timeZoneLabel } from './timeZone';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('timeZone (US-433)', () => {
  it('validates names the way the browser will compute with them', () => {
    expect(isValidTimeZone('America/New_York')).toBe(true);
    expect(isValidTimeZone('Not/AZone')).toBe(false);
    // Postgres knows these trees; the job's Intl does not, so they are refused.
    expect(isValidTimeZone('posix/America/New_York')).toBe(false);
    expect(isValidTimeZone(undefined)).toBe(false);
  });

  it('detects the device zone, and null when the browser gives nothing usable', () => {
    expect(isValidTimeZone(detectBrowserTimeZone())).toBe(true);
    vi.spyOn(Intl.DateTimeFormat.prototype, 'resolvedOptions').mockReturnValue({
      timeZone: 'Bogus/Zone',
    } as Intl.ResolvedDateTimeFormatOptions);
    expect(detectBrowserTimeZone()).toBeNull();
  });

  it('lists every zone once, sorted, always including UTC and the current value', () => {
    const zones = listTimeZones(['America/Los_Angeles', null, 'Bogus/Zone']);
    expect(zones).toContain('UTC');
    expect(zones).toContain('America/Los_Angeles');
    expect(zones).not.toContain('Bogus/Zone');
    expect(new Set(zones).size).toBe(zones.length);
    expect([...zones].sort((a, b) => a.localeCompare(b))).toEqual(zones);
  });

  it('labels a zone readably with its offset', () => {
    expect(timeZoneLabel('America/Los_Angeles', new Date('2026-11-10T12:00:00Z'))).toBe(
      'America / Los Angeles (GMT-8)'
    );
    expect(timeZoneLabel('Asia/Kolkata', new Date('2026-11-10T12:00:00Z'))).toBe(
      'Asia / Kolkata (GMT+5:30)'
    );
  });
});
