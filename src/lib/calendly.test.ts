import { describe, it, expect } from 'vitest';
import { buildCalendlyUrl, isCalendlyBooking } from './calendly';

describe('buildCalendlyUrl (US-221)', () => {
  it('adds prefill, the listing and the campaign', () => {
    const url = new URL(
      buildCalendlyUrl('https://calendly.com/jane/showing', {
        name: 'Dana Rivers',
        email: 'dana@example.com',
        listingAddress: '12 Maple Ave',
        utm: { utm_source: 'instagram', utm_campaign: 'spring' },
      })
    );
    expect(url.searchParams.get('name')).toBe('Dana Rivers');
    expect(url.searchParams.get('email')).toBe('dana@example.com');
    expect(url.searchParams.get('a1')).toBe('12 Maple Ave');
    expect(url.searchParams.get('utm_source')).toBe('instagram');
    expect(url.searchParams.get('utm_campaign')).toBe('spring');
    expect(url.searchParams.has('utm_medium')).toBe(false);
  });

  it('leaves anything that is not a calendly.com link alone', () => {
    expect(buildCalendlyUrl('not a url', { name: 'x' })).toBe('not a url');
    expect(buildCalendlyUrl('https://evil.example/cal', { name: 'x' })).toBe('https://evil.example/cal');
  });
});

describe('isCalendlyBooking', () => {
  it('accepts event_scheduled from calendly.com only', () => {
    expect(isCalendlyBooking({ origin: 'https://calendly.com', data: { event: 'calendly.event_scheduled' } })).toBe(true);
    expect(isCalendlyBooking({ origin: 'https://evil.example', data: { event: 'calendly.event_scheduled' } })).toBe(false);
    expect(isCalendlyBooking({ origin: 'https://calendly.com', data: { event: 'calendly.page_height' } })).toBe(false);
    expect(isCalendlyBooking({ origin: 'https://calendly.com', data: 'x' })).toBe(false);
  });
});
