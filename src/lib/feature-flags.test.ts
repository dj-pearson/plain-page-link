import { describe, it, expect } from 'vitest';
import { evaluateFlag, rolloutBucket, type FeatureFlag } from './feature-flags';

const base = (over: Partial<FeatureFlag> = {}): FeatureFlag => ({
  name: 'test_flag',
  enabled: true,
  rollout_percentage: 0,
  user_ids: [],
  ...over,
});

describe('evaluateFlag', () => {
  it('returns false when globally disabled regardless of targeting', () => {
    expect(evaluateFlag(base({ enabled: false, rollout_percentage: 100 }), 'u1')).toBe(false);
    expect(evaluateFlag(base({ enabled: false, user_ids: ['u1'] }), 'u1')).toBe(false);
  });

  it('returns true for explicitly targeted users', () => {
    expect(evaluateFlag(base({ rollout_percentage: 0, user_ids: ['u1'] }), 'u1')).toBe(true);
  });

  it('returns true at 100% and false at 0%', () => {
    expect(evaluateFlag(base({ rollout_percentage: 100 }), 'u1')).toBe(true);
    expect(evaluateFlag(base({ rollout_percentage: 0 }), 'u1')).toBe(false);
  });

  it('returns false for anonymous users on a partial rollout', () => {
    expect(evaluateFlag(base({ rollout_percentage: 50 }), undefined)).toBe(false);
  });

  it('is deterministic per (flag, user)', () => {
    const flag = base({ rollout_percentage: 50 });
    const first = evaluateFlag(flag, 'stable-user');
    for (let i = 0; i < 5; i++) {
      expect(evaluateFlag(flag, 'stable-user')).toBe(first);
    }
  });

  it('rollout is monotonic: enabled at X% stays enabled at higher %', () => {
    const userId = 'monotonic-user';
    const bucket = rolloutBucket('test_flag', userId);
    // At a percentage just above the user's bucket, they are enabled and remain so.
    expect(evaluateFlag(base({ rollout_percentage: bucket + 1 }), userId)).toBe(true);
    expect(evaluateFlag(base({ rollout_percentage: 100 }), userId)).toBe(true);
    // Below their bucket they are disabled.
    if (bucket > 0) {
      expect(evaluateFlag(base({ rollout_percentage: bucket }), userId)).toBe(false);
    }
  });

  it('rolloutBucket is in range 0..99', () => {
    for (const u of ['a', 'b', 'c', 'longer-user-id-123']) {
      const b = rolloutBucket('flag', u);
      expect(b).toBeGreaterThanOrEqual(0);
      expect(b).toBeLessThan(100);
    }
  });
});
