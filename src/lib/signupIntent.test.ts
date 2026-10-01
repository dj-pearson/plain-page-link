import { describe, it, expect, beforeEach } from 'vitest';
import {
  capturePlanIntent,
  readPlanIntent,
  clearPlanIntent,
  captureReferral,
  readReferral,
  registerUrlForPlan,
  poweredByUrl,
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
    expect(captureReferral('ref=JaneDoe&utm_source=profile_badge')).toEqual({ ref: 'janedoe', source: 'profile_badge' });
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
