/**
 * US-118: a paid-up agent lost their plan the moment they clicked "cancel".
 *
 * stripe-webhook rewrote the status to 'canceled' as soon as
 * cancel_at_period_end was set, and get_user_plan joins on the status — so
 * scheduling a cancellation dropped the agent to free that day, weeks before
 * the period they had paid for ended. invoice.payment_failed wrote 'past_due'
 * with no grace, so an expired card cut off access the same day.
 */
import { describe, it, expect } from 'vitest';
import {
  isEntitled,
  statusToStore,
  PAST_DUE_GRACE_DAYS,
} from './subscription-entitlement.ts';

const NOW = new Date('2026-09-02T12:00:00.000Z');
const days = (n: number) => new Date(NOW.getTime() + n * 24 * 60 * 60 * 1000).toISOString();

describe('statusToStore', () => {
  it('does not turn a scheduled cancellation into a cancelled subscription', () => {
    expect(statusToStore({ status: 'active', cancel_at_period_end: true })).toBe('active');
  });

  it('passes Stripe’s status through unchanged', () => {
    for (const status of ['active', 'trialing', 'past_due', 'canceled', 'unpaid', 'incomplete']) {
      expect(statusToStore({ status }), status).toBe(status);
    }
  });
});

describe('isEntitled', () => {
  it('keeps the plan while an active subscription runs', () => {
    expect(isEntitled({ status: 'active', current_period_end: days(20) }, NOW)).toBe(true);
    // Even with no period end recorded.
    expect(isEntitled({ status: 'active', current_period_end: null }, NOW)).toBe(true);
    expect(isEntitled({ status: 'trialing', current_period_end: days(5) }, NOW)).toBe(true);
  });

  it('keeps the plan for a cancelled subscription that is paid through', () => {
    expect(isEntitled({ status: 'canceled', current_period_end: days(20) }, NOW)).toBe(true);
    expect(isEntitled({ status: 'canceled', current_period_end: days(0.5) }, NOW)).toBe(true);
  });

  it('ends the plan once the paid period is over', () => {
    expect(isEntitled({ status: 'canceled', current_period_end: days(-1) }, NOW)).toBe(false);
  });

  it(`keeps a past_due subscription for ${PAST_DUE_GRACE_DAYS} days past the period`, () => {
    expect(isEntitled({ status: 'past_due', current_period_end: days(-1) }, NOW)).toBe(true);
    expect(
      isEntitled({ status: 'past_due', current_period_end: days(-PAST_DUE_GRACE_DAYS + 0.5) }, NOW)
    ).toBe(true);
    expect(
      isEntitled({ status: 'past_due', current_period_end: days(-PAST_DUE_GRACE_DAYS - 1) }, NOW)
    ).toBe(false);
  });

  it('fails closed on anything it cannot reason about', () => {
    expect(isEntitled({ status: 'unpaid', current_period_end: days(20) }, NOW)).toBe(false);
    expect(isEntitled({ status: 'incomplete', current_period_end: days(20) }, NOW)).toBe(false);
    expect(isEntitled({ status: null, current_period_end: days(20) }, NOW)).toBe(false);
    // A cancelled subscription with no period end cannot be shown to be paid up.
    expect(isEntitled({ status: 'canceled', current_period_end: null }, NOW)).toBe(false);
    expect(isEntitled({ status: 'canceled', current_period_end: 'not a date' }, NOW)).toBe(false);
  });
});
