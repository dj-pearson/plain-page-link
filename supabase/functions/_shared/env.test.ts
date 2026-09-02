/**
 * US-123: SITE_URL had four spellings across the function tree (SITE_URL,
 * APP_URL, FRONTEND_URL, PUBLIC_SITE_URL) and FUNCTIONS_URL two
 * (FUNCTIONS_URL, EDGE_FUNCTIONS_URL), each with its own fallback to the
 * production host. A staging deployment that set one name kept emailing
 * production links from every function that read one of the others.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getSiteUrl, getFunctionsUrl, getPagespeedApiKey } from './env.ts';

const env: Record<string, string> = {};

beforeEach(() => {
  for (const k of Object.keys(env)) delete env[k];
  (globalThis as Record<string, unknown>).Deno = { env: { get: (k: string) => env[k] } };
});

afterEach(() => {
  delete (globalThis as Record<string, unknown>).Deno;
});

describe('getSiteUrl', () => {
  it('falls back to production when SITE_URL is unset', () => {
    expect(getSiteUrl()).toBe('https://agentbio.net');
  });

  it('uses SITE_URL when it is set', () => {
    env.SITE_URL = 'https://staging.agentbio.net';
    expect(getSiteUrl()).toBe('https://staging.agentbio.net');
  });

  it('ignores the retired aliases, so a stale APP_URL cannot win', () => {
    env.APP_URL = 'https://app.example';
    env.FRONTEND_URL = 'https://frontend.example';
    env.PUBLIC_SITE_URL = 'https://public.example';
    expect(getSiteUrl()).toBe('https://agentbio.net');
  });

  it('treats blank and whitespace as unset', () => {
    env.SITE_URL = '   ';
    expect(getSiteUrl()).toBe('https://agentbio.net');
  });

  it('strips a trailing slash so paths do not double up', () => {
    env.SITE_URL = 'https://staging.agentbio.net/';
    expect(`${getSiteUrl()}/dashboard`).toBe('https://staging.agentbio.net/dashboard');
  });
});

describe('getFunctionsUrl', () => {
  it('falls back to the production functions host', () => {
    expect(getFunctionsUrl()).toBe('https://functions.agentbio.net');
  });

  it('uses FUNCTIONS_URL and ignores EDGE_FUNCTIONS_URL', () => {
    env.EDGE_FUNCTIONS_URL = 'https://edge.example';
    expect(getFunctionsUrl()).toBe('https://functions.agentbio.net');
    env.FUNCTIONS_URL = 'https://fn.staging.example';
    expect(getFunctionsUrl()).toBe('https://fn.staging.example');
  });
});

describe('getPagespeedApiKey', () => {
  it('is undefined when unset rather than an empty string', () => {
    expect(getPagespeedApiKey()).toBeUndefined();
    env.PAGESPEED_API_KEY = '';
    expect(getPagespeedApiKey()).toBeUndefined();
  });

  it('ignores the retired PAGESPEED_INSIGHTS_API_KEY spelling', () => {
    env.PAGESPEED_INSIGHTS_API_KEY = 'stale';
    expect(getPagespeedApiKey()).toBeUndefined();
    env.PAGESPEED_API_KEY = 'current';
    expect(getPagespeedApiKey()).toBe('current');
  });
});
