import { describe, it, expect } from 'vitest';
import { stripLinks, safeHtmlText, safeNumber } from './public-email.ts';

describe('public email text (US-219)', () => {
  it('removes links and bare domains', () => {
    expect(stripLinks('Verify at https://evil.example/login now')).toBe('Verify at now');
    expect(stripLinks('go to www.evil.example')).toBe('go to');
    expect(stripLinks('visit agentbio-login.com/reset today')).toBe('visit today');
  });

  it('keeps ordinary listing prose', () => {
    const prose = 'Sun-drenched 3 bed, 2 bath home near the lake. Updated kitchen!';
    expect(stripLinks(prose)).toBe(prose);
  });

  it('escapes markup so it renders as text', () => {
    expect(safeHtmlText('<a href="x">Click</a>')).toBe('&lt;a href=&quot;x&quot;&gt;Click&lt;/a&gt;');
  });

  it('caps length', () => {
    expect(stripLinks('x'.repeat(5000), 100)).toHaveLength(100);
  });

  it('coerces numbers', () => {
    expect(safeNumber('450000')).toBe(450000);
    expect(safeNumber('<b>')).toBe(0);
  });
});
