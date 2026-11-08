/**
 * US-290: the Profile page's link fields are checked before they are saved.
 */
import { describe, it, expect } from 'vitest';
import {
  httpsOnlyUrl,
  normalizeProfileUrl,
  normalizeProfileUrls,
  PROFILE_URL_FIELD_NAMES,
} from './profileUrls';

const blank = Object.fromEntries(PROFILE_URL_FIELD_NAMES.map((f) => [f, ''])) as Record<
  (typeof PROFILE_URL_FIELD_NAMES)[number],
  string
>;

describe('normalizeProfileUrl', () => {
  it('adds https:// to a bare host', () => {
    expect(normalizeProfileUrl('zillow_url', 'zillow.com/profile/jane')).toEqual({
      value: 'https://zillow.com/profile/jane',
    });
    expect(normalizeProfileUrl('instagram_url', '  www.instagram.com/jane  ')).toEqual({
      value: 'https://www.instagram.com/jane',
    });
  });

  it('keeps a full http(s) address', () => {
    expect(normalizeProfileUrl('website_url', 'https://jane.example/')).toEqual({
      value: 'https://jane.example/',
    });
    expect(normalizeProfileUrl('website_url', 'http://jane.example')).toEqual({
      value: 'http://jane.example',
    });
  });

  it('treats an empty field as cleared', () => {
    expect(normalizeProfileUrl('facebook_url', '   ')).toEqual({ value: '' });
    expect(normalizeProfileUrl('facebook_url', null)).toEqual({ value: '' });
  });

  it.each([
    'javascript:alert(1)',
    'java\tscript:alert(1)',
    'data:text/html,<script>alert(1)</script>',
    'mailto:jane@example.com',
    '//evil.example',
    '@janedoe',
    'my website',
  ])('refuses %s with the field named', (raw) => {
    expect(normalizeProfileUrl('instagram_url', raw)).toEqual({
      error: 'Your Instagram link must be a full web address starting with https://.',
    });
  });

  it('refuses a Calendly link that is not https', () => {
    expect(normalizeProfileUrl('calendly_url', 'http://calendly.com/jane')).toEqual({
      error: 'Your Calendly link must be a full web address starting with https://.',
    });
    expect(normalizeProfileUrl('calendly_url', 'calendly.com/jane/30min')).toEqual({
      value: 'https://calendly.com/jane/30min',
    });
  });
});

describe('normalizeProfileUrls', () => {
  it('returns cleaned values and an error per refused field', () => {
    const { values, errors } = normalizeProfileUrls({
      ...blank,
      zillow_url: 'zillow.com/me',
      tiktok_url: 'javascript:x',
    });
    expect(values.zillow_url).toBe('https://zillow.com/me');
    expect(values.website_url).toBe('');
    expect(Object.keys(errors)).toEqual(['tiktok_url']);
    expect(errors.tiktok_url).toMatch(/^Your TikTok link must be/);
  });

  it('has no errors for an all-empty form', () => {
    expect(normalizeProfileUrls(blank).errors).toEqual({});
  });
});

describe('httpsOnlyUrl', () => {
  it('keeps https and refuses everything else', () => {
    expect(httpsOnlyUrl('https://calendly.com/jane')).toBe('https://calendly.com/jane');
    expect(httpsOnlyUrl('http://calendly.com/jane')).toBe('');
    expect(httpsOnlyUrl('javascript:alert(1)')).toBe('');
    expect(httpsOnlyUrl(undefined)).toBe('');
  });
});
