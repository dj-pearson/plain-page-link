/**
 * US-268: sanitizeUrl tested a lowercased, trimmed copy with
 * startsWith('javascript:') and returned anything it did not recognise
 * unchanged. The URL parser strips tabs/newlines inside a scheme and C0
 * control characters around it, so the deny-list was bypassable, and the
 * result is assigned to window.location.href by page-builder blocks on the
 * public profile.
 */
import { describe, it, expect } from 'vitest';
import { sanitizeUrl, sanitizeExternalUrl } from './sanitize';

describe('sanitizeUrl', () => {
  it.each([
    'javascript:alert(1)',
    'JavaScript:alert(1)',
    'java\tscript:alert(1)',
    'java\nscript:alert(1)',
    'jav\r\nascript:alert(1)',
    '\u0001javascript:alert(1)',
    '  \u0000javascript:alert(1)',
    'data:text/html,<script>alert(1)</script>',
    'vbscript:msgbox(1)',
    'file:///etc/passwd',
    'blob:https://agentbio.net/abc',
    'intent://scan/#Intent;scheme=zxing;end',
  ])('refuses %j', (input) => {
    expect(sanitizeUrl(input)).toBe('');
  });

  it('refuses protocol-relative URLs to another host', () => {
    expect(sanitizeUrl('//evil.example/phish')).toBe('');
    expect(sanitizeUrl('/\\evil.example/phish')).toBe('');
  });

  it('refuses values that are not URLs at all', () => {
    expect(sanitizeUrl('')).toBe('');
    expect(sanitizeUrl('   ')).toBe('');
    expect(sanitizeUrl('not a url')).toBe('');
    expect(sanitizeUrl('localhost:3000')).toBe('');
    expect(sanitizeUrl('https://')).toBe('');
    expect(sanitizeUrl(null)).toBe('');
    expect(sanitizeUrl(undefined)).toBe('');
  });

  it('keeps http(s), mailto and tel URLs', () => {
    expect(sanitizeUrl('https://zillow.com/profile/jane')).toBe('https://zillow.com/profile/jane');
    expect(sanitizeUrl('http://example.com')).toBe('http://example.com');
    expect(sanitizeUrl('HTTPS://Example.com/A')).toBe('HTTPS://Example.com/A');
    expect(sanitizeUrl('mailto:jane@example.com')).toBe('mailto:jane@example.com');
    expect(sanitizeUrl('tel:+18015550100')).toBe('tel:+18015550100');
  });

  it('keeps a same-site path', () => {
    expect(sanitizeUrl('/blog/first-home')).toBe('/blog/first-home');
  });

  it('trims surrounding whitespace', () => {
    expect(sanitizeUrl('  https://example.com/x  ')).toBe('https://example.com/x');
  });

  it('puts https:// in front of a bare host instead of making it a relative link', () => {
    expect(sanitizeUrl('zillow.com/profile/jane')).toBe('https://zillow.com/profile/jane');
    expect(sanitizeUrl('www.example.co.uk')).toBe('https://www.example.co.uk');
    expect(sanitizeUrl('example.com:8080/x')).toBe('https://example.com:8080/x');
  });
});

describe('sanitizeExternalUrl', () => {
  it('keeps only http(s)', () => {
    expect(sanitizeExternalUrl('https://instagram.com/jane')).toBe('https://instagram.com/jane');
    expect(sanitizeExternalUrl('instagram.com/jane')).toBe('https://instagram.com/jane');
    expect(sanitizeExternalUrl('mailto:jane@example.com')).toBe('');
    expect(sanitizeExternalUrl('/dashboard')).toBe('');
    expect(sanitizeExternalUrl('java\tscript:alert(1)')).toBe('');
  });
});
