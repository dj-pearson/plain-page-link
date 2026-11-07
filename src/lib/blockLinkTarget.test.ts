/**
 * US-327: a page-builder link button with no real destination is not
 * published.
 */
import { describe, it, expect } from 'vitest';
import { usableLinkUrl } from './blockLinkTarget';

describe('usableLinkUrl (US-327)', () => {
  it.each([
    ['', 'empty'],
    ['   ', 'whitespace'],
    ['#', 'a bare fragment'],
    [' # ', 'a padded bare fragment'],
    ['https://example.com', 'the old Link block default'],
    ['https://www.example.org/guide.pdf', 'a reserved documentation host'],
    ['example.net', 'a bare reserved host'],
    ['javascript:alert(1)', 'an unsafe scheme'],
    ['//evil.test', 'a protocol-relative URL'],
  ])('refuses %j (%s)', (url) => {
    expect(usableLinkUrl(url)).toBe('');
  });

  it('refuses null and undefined', () => {
    expect(usableLinkUrl(null)).toBe('');
    expect(usableLinkUrl(undefined)).toBe('');
  });

  it.each([
    ['https://agent.test/guide.pdf', 'https://agent.test/guide.pdf'],
    ['agent.test', 'https://agent.test'],
    ['#contact', '#contact'],
    ['/blog', '/blog'],
    ['mailto:me@agent.test', 'mailto:me@agent.test'],
    ['https://notexample.com', 'https://notexample.com'],
  ])('keeps %j', (url, expected) => {
    expect(usableLinkUrl(url)).toBe(expected);
  });
});
