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

  // US-605: Stripe advances the period before the renewal payment fails, so
  // current_period_end is the end of the UNPAID period. Grace counted from it
  // gave a monthly agent ~37 days of paid features without paying.
  it(`counts past_due grace from the end of the paid period, not the unpaid one`, () => {
    // Renewal failed 2 days ago: paid period ended at days(-2), unpaid one runs to days(28).
    expect(
      isEntitled({ status: 'past_due', current_period_start: days(-2), current_period_end: days(28) }, NOW)
    ).toBe(true);
    // Renewal failed 10 days ago and Stripe left it past_due: grace is over,
    // even though the unpaid period still has 20 days to run.
    expect(
      isEntitled({ status: 'past_due', current_period_start: days(-10), current_period_end: days(20) }, NOW)
    ).toBe(false);
    expect(
      isEntitled(
        {
          status: 'past_due',
          current_period_start: days(-PAST_DUE_GRACE_DAYS + 0.5),
          current_period_end: days(30 - PAST_DUE_GRACE_DAYS),
        },
        NOW
      )
    ).toBe(true);
    // An unreadable start falls back to the period end rather than throwing.
    expect(
      isEntitled({ status: 'past_due', current_period_start: 'not a date', current_period_end: days(-1) }, NOW)
    ).toBe(true);
  });

  // Review of US-615: current_period_start is the end of the paid period only
  // after the first failed renewal. A subscription Stripe leaves past_due keeps
  // rolling, so after the second unpaid renewal the start is the end of an
  // UNPAID period and a start-anchored grace reopened every month.
  it('does not reopen the grace when the period rolls again while past_due', () => {
    // Went past_due 31 days ago; Stripe rolled into a second unpaid period 1 day ago.
    expect(
      isEntitled(
        { status: 'past_due', past_due_since: days(-31), current_period_start: days(-1), current_period_end: days(29) },
        NOW
      )
    ).toBe(false);
    // past_due_since is the anchor whenever it is present.
    expect(
      isEntitled(
        { status: 'past_due', past_due_since: days(-2), current_period_start: days(-40), current_period_end: days(-10) },
        NOW
      )
    ).toBe(true);
    // An unreadable past_due_since falls back to the period start.
    expect(
      isEntitled(
        { status: 'past_due', past_due_since: 'not a date', current_period_start: days(-10), current_period_end: days(20) },
        NOW
      )
    ).toBe(false);
    // past_due with no readable anchor at all fails closed.
    expect(isEntitled({ status: 'past_due' }, NOW)).toBe(false);
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
