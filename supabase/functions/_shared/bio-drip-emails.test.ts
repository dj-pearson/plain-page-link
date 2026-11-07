import { describe, expect, it } from 'vitest';
import {
  BIO_DRIP_DAY,
  BIO_DRIP_SEQUENCE_NUMBERS,
  bioDripEmail,
  bioDripSubject,
  isBioDripSequenceNumber,
} from './bio-drip-emails';

const opts = { firstName: 'Dana', market: 'Austin', score: 62, siteUrl: 'https://agentbio.net' };

describe('bio drip emails (US-415)', () => {
  it('covers emails 2-7, due in order', () => {
    expect([...BIO_DRIP_SEQUENCE_NUMBERS]).toEqual([2, 3, 4, 5, 6, 7]);
    const days = BIO_DRIP_SEQUENCE_NUMBERS.map((n) => BIO_DRIP_DAY[n]);
    expect(days).toEqual([...days].sort((a, b) => a - b));
    expect(isBioDripSequenceNumber(1)).toBe(false);
    expect(isBioDripSequenceNumber(7)).toBe(true);
  });

  it('sends the subject that send-bio-analyzer-email records', () => {
    for (const n of BIO_DRIP_SEQUENCE_NUMBERS) {
      expect(bioDripEmail(n, opts).subject).toBe(bioDripSubject(n, opts.firstName));
    }
  });

  it('links only to routes that exist', () => {
    for (const n of BIO_DRIP_SEQUENCE_NUMBERS) {
      const { body, html } = bioDripEmail(n, opts);
      const hrefs = [...html.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
      expect(hrefs.length).toBeGreaterThan(0);
      for (const href of hrefs) {
        expect(['https://agentbio.net/auth/register', 'https://agentbio.net/pricing']).toContain(href);
      }
      expect(body).toContain(hrefs[0]);
    }
  });

  it('carries no coupon, deadline or invented statistic', () => {
    for (const n of BIO_DRIP_SEQUENCE_NUMBERS) {
      const { subject, body, html } = bioDripEmail(n, opts);
      for (const text of [subject, body, html]) {
        expect(text).not.toMatch(/coupon|expires|% off|leads\/month|\d+%/i);
      }
    }
  });

  it('uses the visitor score and market it was given, and nothing else numeric about them', () => {
    expect(bioDripEmail(2, opts).body).toContain('62/100');
    expect(bioDripEmail(2, opts).body).toContain('Austin');
    expect(bioDripEmail(7, opts).body).toContain('62/100');
  });

  it('renders the html body as paragraphs, not one blob', () => {
    const { html } = bioDripEmail(3, opts);
    expect(html.match(/<p>/g)?.length).toBeGreaterThan(3);
    expect(html).toContain('<br>');
  });
});
