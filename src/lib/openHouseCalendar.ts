/**
 * "Add to calendar" for an open house.
 *
 * Two forms, because visitors split between them: an .ics file (Apple
 * Calendar, Outlook, most phones) and a Google Calendar link. Both are built
 * here from the same fields so the two cannot disagree about the time.
 */

export interface CalendarEvent {
  /** Stable id, so re-importing updates the event instead of duplicating it. */
  uid: string;
  title: string;
  description?: string;
  location?: string;
  start: Date;
  end: Date;
  url?: string;
}

/** 20260923T180000Z */
function toIcsUtc(date: Date): string {
  return date
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '');
}

/** RFC 5545 §3.3.11: backslash, semicolon, comma and newline are escaped. */
export function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

/**
 * RFC 5545 §3.1: content lines longer than 75 octets are folded with CRLF and
 * a leading space. Counted in characters, which is safe for the ASCII-heavy
 * text here and errs short for multi-byte text.
 */
function fold(line: string): string {
  if (line.length <= 74) return line;
  const parts: string[] = [];
  let rest = line;
  parts.push(rest.slice(0, 74));
  rest = rest.slice(74);
  while (rest.length > 0) {
    parts.push(' ' + rest.slice(0, 73));
    rest = rest.slice(73);
  }
  return parts.join('\r\n');
}

export function buildIcs(event: CalendarEvent, now: Date = new Date()): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//AgentBio//Open House//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${event.uid}@agentbio.net`,
    `DTSTAMP:${toIcsUtc(now)}`,
    `DTSTART:${toIcsUtc(event.start)}`,
    `DTEND:${toIcsUtc(event.end)}`,
    `SUMMARY:${escapeIcsText(event.title)}`,
  ];
  if (event.location) lines.push(`LOCATION:${escapeIcsText(event.location)}`);
  if (event.description) lines.push(`DESCRIPTION:${escapeIcsText(event.description)}`);
  if (event.url) lines.push(`URL:${event.url}`);
  lines.push('END:VEVENT', 'END:VCALENDAR');
  return lines.map(fold).join('\r\n') + '\r\n';
}

export function googleCalendarUrl(event: CalendarEvent): string {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${toIcsUtc(event.start)}/${toIcsUtc(event.end)}`,
  });
  if (event.location) params.set('location', event.location);
  const details = [event.description, event.url].filter(Boolean).join('\n\n');
  if (details) params.set('details', details);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/** Triggers a download of the .ics file in the browser. */
export function downloadIcs(event: CalendarEvent, filename = 'open-house.ics'): void {
  const blob = new Blob([buildIcs(event)], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
