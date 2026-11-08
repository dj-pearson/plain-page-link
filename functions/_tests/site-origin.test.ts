import { describe, expect, it } from 'vitest';
import { FALLBACK_SITE_ORIGIN, siteOrigin } from '../_lib/site-origin';

describe('siteOrigin (US-595)', () => {
  it('falls back to production when nothing is configured', () => {
    expect(siteOrigin(undefined)).toBe(FALLBACK_SITE_ORIGIN);
    expect(siteOrigin({})).toBe('https://agentbio.net');
    expect(siteOrigin({ VITE_APP_URL: '   ' })).toBe('https://agentbio.net');
  });

  it('reduces the configured URL to its origin', () => {
    expect(siteOrigin({ VITE_APP_URL: 'https://agentbio.net/' })).toBe('https://agentbio.net');
    expect(siteOrigin({ VITE_APP_URL: ' https://staging.example.test/app ' })).toBe(
      'https://staging.example.test'
    );
    expect(siteOrigin({ VITE_APP_URL: 'http://localhost:8080' })).toBe('http://localhost:8080');
  });

  it('ignores a value that is not an absolute http(s) URL', () => {
    expect(siteOrigin({ VITE_APP_URL: 'agentbio.net' })).toBe('https://agentbio.net');
    expect(siteOrigin({ VITE_APP_URL: 'javascript:alert(1)' })).toBe('https://agentbio.net');
    expect(siteOrigin({ VITE_APP_URL: 'ftp://agentbio.net' })).toBe('https://agentbio.net');
  });
});
