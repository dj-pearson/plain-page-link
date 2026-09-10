import { describe, expect, it } from 'vitest';
import {
  STALE_AFTER_DAYS,
  daysSinceUpdate,
  isListingStale,
  staleExplanation,
} from './listingStaleness';

const NOW = new Date('2026-09-10T12:00:00Z').getTime();
const daysAgo = (n: number) => new Date(NOW - n * 24 * 60 * 60 * 1000).toISOString();

describe('isListingStale', () => {
  it('is true at the threshold, which is where the two components disagreed', () => {
    // QuickStatusDashboard said >= 7, MobileListingCard said > 7, so a listing
    // untouched for exactly a week was stale on the desktop and fresh on the
    // phone.
    const listing = { updatedAt: daysAgo(STALE_AFTER_DAYS), status: 'active' };
    expect(isListingStale(listing, NOW)).toBe(true);
  });

  it('is false one day short of the threshold', () => {
    expect(
      isListingStale({ updatedAt: daysAgo(STALE_AFTER_DAYS - 1), status: 'active' }, NOW)
    ).toBe(false);
  });

  it('never nags about a listing that has sold', () => {
    // The mobile card had no status test, so an agent who closed a deal and
    // stopped editing was told the listing was going stale.
    expect(isListingStale({ updatedAt: daysAgo(90), status: 'sold' }, NOW)).toBe(false);
    expect(isListingStale({ updatedAt: daysAgo(90), status: 'pending' }, NOW)).toBe(false);
    expect(isListingStale({ updatedAt: daysAgo(90), status: 'draft' }, NOW)).toBe(false);
  });

  it('does not call a listing fresh because its timestamp is unreadable', () => {
    expect(isListingStale({ updatedAt: 'not a date', status: 'active' }, NOW)).toBe(false);
    expect(daysSinceUpdate('not a date', NOW)).toBeNull();
    expect(daysSinceUpdate(null, NOW)).toBeNull();
  });
});

describe('staleExplanation', () => {
  it('states the rule, so the badge is not asking the agent to guess it', () => {
    const text = staleExplanation({ updatedAt: daysAgo(11), status: 'active' }, NOW);
    expect(text).toContain('11 days');
    expect(text).toContain(`${STALE_AFTER_DAYS} days`);
  });

  it('says so plainly when the age is unknown', () => {
    expect(staleExplanation({ updatedAt: '', status: 'active' }, NOW)).toContain(
      'an unknown length of time'
    );
  });
});
