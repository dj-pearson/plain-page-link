import { describe, it, expect, beforeEach } from 'vitest';
import {
  capturePlanIntent,
  readPlanIntent,
  clearPlanIntent,
  captureReferral,
  readReferral,
  registerUrlForPlan,
  poweredByUrl,
  oauthAuthorizeUrl,
} from './signupIntent';

describe('signup intent (US-232)', () => {
  beforeEach(() => localStorage.clear());

  it('a logged-out Subscribe goes to register with the plan, and the plan survives', () => {
    const url = registerUrlForPlan('professional', 'year');
    expect(url).toBe('/auth/register?plan=professional&interval=year');
    capturePlanIntent(url.split('?')[1]);
    expect(readPlanIntent()).toEqual({ plan: 'professional', interval: 'year' });
    clearPlanIntent();
    expect(readPlanIntent()).toBeNull();
  });

  it('ignores the free plan and junk', () => {
    expect(capturePlanIntent('plan=free')).toBeNull();
    expect(capturePlanIntent('plan=<script>')).toBeNull();
  });

  it('keeps the first referral, not the last', () => {
    expect(captureReferral('ref=JaneDoe&utm_source=profile_badge')).toEqual({
      ref: 'janedoe',
      source: 'profile_badge',
    });
    captureReferral('ref=someoneelse');
    expect(readReferral()).toEqual({ ref: 'janedoe', source: 'profile_badge' });
  });

  it('the Powered by link is attributed to the profile owner', () => {
    const url = new URL(poweredByUrl('JaneDoe'));
    expect(url.searchParams.get('ref')).toBe('janedoe');
    expect(url.searchParams.get('utm_source')).toBe('profile_badge');
    expect(new URL(poweredByUrl(null)).searchParams.has('ref')).toBe(false);
  });
});

describe('social sign-in keeps the referral (US-594)', () => {
  it('sends ref and source to oauth-proxy', () => {
    const url = new URL(
      oauthAuthorizeUrl('https://functions.example/', 'google', '/dashboard', {
        ref: 'janedoe',
        source: 'profile_badge',
      })
    );
    expect(url.origin + url.pathname).toBe('https://functions.example/oauth-proxy');
    expect(url.searchParams.get('action')).toBe('authorize');
    expect(url.searchParams.get('provider')).toBe('google');
    expect(url.searchParams.get('redirect_to')).toBe('/dashboard');
    expect(url.searchParams.get('ref')).toBe('janedoe');
    expect(url.searchParams.get('signup_source')).toBe('profile_badge');
  });

  it('falls back to the first-touch utm_source and omits what it lacks', () => {
    const url = new URL(
      oauthAuthorizeUrl('https://f.example', 'apple', '/x?y=1', null, 'instagram')
    );
    expect(url.searchParams.get('ref')).toBeNull();
    expect(url.searchParams.get('signup_source')).toBe('instagram');
    expect(url.searchParams.get('redirect_to')).toBe('/x?y=1');
    const bare = new URL(oauthAuthorizeUrl('https://f.example', 'apple', '/dashboard', null));
    expect(bare.searchParams.has('signup_source')).toBe(false);
  });

  it('the auth store uses it for both providers', async () => {
    const { readFileSync } = await import('node:fs');
    const store = readFileSync('src/stores/useAuthStore.ts', 'utf8');
    expect(store).not.toMatch(/oauth-proxy\?action=authorize/);
    expect(store.match(/oauthAuthorizeUrl\(/g)?.length).toBe(2);
  });
});
