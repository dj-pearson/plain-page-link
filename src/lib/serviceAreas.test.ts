import { describe, it, expect } from 'vitest';
import { areaServedSchema, cleanServiceCities, formatServiceCities } from './serviceAreas';

describe('service areas (US-281)', () => {
  it('joins 1, 2 and 3+ cities in natural language', () => {
    expect(formatServiceCities(['Austin'])).toBe('Austin');
    expect(formatServiceCities(['Austin', 'Round Rock'])).toBe('Austin and Round Rock');
    expect(formatServiceCities(['Austin', 'Round Rock', 'Cedar Park'])).toBe(
      'Austin, Round Rock and Cedar Park'
    );
    expect(formatServiceCities(['Austin', 'Round Rock', 'Cedar Park', 'Pflugerville'])).toBe(
      'Austin, Round Rock, Cedar Park and Pflugerville'
    );
  });

  it('returns an empty string when there is nothing to show', () => {
    expect(formatServiceCities([])).toBe('');
    expect(formatServiceCities(null)).toBe('');
    expect(formatServiceCities('Austin')).toBe('');
    expect(formatServiceCities(['', '   '])).toBe('');
  });

  it('trims, drops blanks and non-strings, and de-duplicates case-insensitively', () => {
    expect(
      cleanServiceCities([' Austin ', '', 'austin', 42, null, 'Round   Rock', 'Cedar Park'])
    ).toEqual(['Austin', 'Round Rock', 'Cedar Park']);
  });

  it('lists every city in areaServed, and omits it when there are none', () => {
    expect(areaServedSchema(['Austin', 'Round Rock', 'Cedar Park'])).toEqual([
      { '@type': 'City', name: 'Austin' },
      { '@type': 'City', name: 'Round Rock' },
      { '@type': 'City', name: 'Cedar Park' },
    ]);
    expect(areaServedSchema([])).toBeUndefined();
    expect(areaServedSchema(undefined)).toBeUndefined();
  });
});
