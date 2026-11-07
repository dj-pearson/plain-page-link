/**
 * US-327: a page-builder link button with no real destination is not
 * published.
 */
import { describe, it, expect } from 'vitest';
import { blockHasDestination, usableLinkUrl } from './blockLinkTarget';

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

describe('blockHasDestination (US-350)', () => {
  it('drops link and CTA blocks with no real destination', () => {
    expect(blockHasDestination({ type: 'link', config: { url: '#' } })).toBe(false);
    expect(blockHasDestination({ type: 'cta', config: { buttonUrl: 'https://example.com' } })).toBe(
      false
    );
  });

  it('keeps link and CTA blocks that go somewhere', () => {
    expect(blockHasDestination({ type: 'link', config: { url: 'https://agent.test' } })).toBe(true);
    expect(blockHasDestination({ type: 'cta', config: { buttonUrl: '#contact' } })).toBe(true);
  });

  it('survives malformed jsonb', () => {
    expect(blockHasDestination({ type: 'cta', config: null })).toBe(false);
    expect(blockHasDestination({ type: 'cta', config: { buttonUrl: 42 } })).toBe(false);
    expect(blockHasDestination({ type: 'link' })).toBe(false);
  });

  it('never drops other block types, including a hero with a dead button', () => {
    expect(blockHasDestination({ type: 'hero', config: { ctaUrl: '#' } })).toBe(true);
    expect(blockHasDestination({ type: 'text', config: {} })).toBe(true);
  });
});
