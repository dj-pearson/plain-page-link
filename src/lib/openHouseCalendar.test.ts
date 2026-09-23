import { describe, it, expect } from 'vitest';
import {
  buildIcs,
  escapeIcsText,
  googleCalendarUrl,
  type CalendarEvent,
} from './openHouseCalendar';

const event: CalendarEvent = {
  uid: 'oh-123',
  title: 'Open House: 12 Elm St, Springfield',
  description: 'Hosted by Jane Agent; refreshments served',
  location: '12 Elm St, Springfield, IL 62701',
  start: new Date('2026-10-04T18:00:00Z'),
  end: new Date('2026-10-04T20:00:00Z'),
  url: 'https://agentbio.net/jane',
};

describe('buildIcs', () => {
  const ics = buildIcs(event, new Date('2026-09-23T12:00:00Z'));

  it('writes a VEVENT with UTC times and CRLF line endings', () => {
    expect(ics).toContain('BEGIN:VEVENT\r\n');
    expect(ics).toContain('DTSTART:20261004T180000Z\r\n');
    expect(ics).toContain('DTEND:20261004T200000Z\r\n');
    expect(ics).toContain('DTSTAMP:20260923T120000Z\r\n');
    expect(ics).toContain('UID:oh-123@agentbio.net\r\n');
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true);
  });

  it('escapes the characters RFC 5545 reserves', () => {
    expect(ics).toContain('LOCATION:12 Elm St\\, Springfield\\, IL 62701');
    expect(ics).toContain('Hosted by Jane Agent\\; refreshments served');
  });

  it('folds lines longer than 75 octets', () => {
    const long = buildIcs({ ...event, description: 'x'.repeat(200) });
    for (const line of long.split('\r\n')) expect(line.length).toBeLessThanOrEqual(75);
    expect(long).toContain('\r\n x');
  });
});

describe('escapeIcsText', () => {
  it('escapes backslashes before anything else', () => {
    expect(escapeIcsText('a\\b,c;d\ne')).toBe('a\\\\b\\,c\\;d\\ne');
  });
});

describe('googleCalendarUrl', () => {
  it('carries the same times as the .ics file', () => {
    const url = new URL(googleCalendarUrl(event));
    expect(url.searchParams.get('dates')).toBe('20261004T180000Z/20261004T200000Z');
    expect(url.searchParams.get('text')).toBe(event.title);
    expect(url.searchParams.get('location')).toBe(event.location);
    expect(url.searchParams.get('details')).toContain('https://agentbio.net/jane');
  });
});
