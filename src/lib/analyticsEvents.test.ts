/**
 * US-115: Call, Email and Text taps were logger.info'd on the visitor's own
 * console and nowhere else, so an agent never learned that thirty people
 * tapped Call this week.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const insertMock = vi.fn();
vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: (table: string) => ({ insert: (row: unknown) => insertMock(table, row) }) },
}));

import {
  getVisitorId,
  recordAnalyticsEvent,
  resetListingViewDedupeForTests,
  trackContactTap,
  trackListingView,
} from './analyticsEvents';

const AGENT = '11111111-1111-1111-1111-111111111111';

describe('getVisitorId', () => {
  beforeEach(() => localStorage.clear());

  it('generates once and then reuses it, so the rate limit has a bucket', () => {
    const first = getVisitorId();
    expect(first).toBeTruthy();
    expect(getVisitorId()).toBe(first);
    expect(localStorage.getItem('visitor_id')).toBe(first);
  });

  it('returns null rather than throwing when storage is unavailable', () => {
    const spy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('access denied');
    });
    expect(getVisitorId()).toBeNull();
    spy.mockRestore();
  });
});

describe('trackContactTap', () => {
  beforeEach(() => {
    insertMock.mockReset();
    insertMock.mockResolvedValue({ error: null });
    localStorage.clear();
  });

  it('records a Call tap against the agent whose page it happened on', async () => {
    await trackContactTap(AGENT, 'phone');

    expect(insertMock).toHaveBeenCalledTimes(1);
    const [table, row] = insertMock.mock.calls[0] as [string, Record<string, unknown>];
    expect(table).toBe('analytics_events');
    expect(row).toMatchObject({
      user_id: AGENT,
      event_type: 'contact_call',
      target_label: 'phone',
    });
    expect(row.visitor_id).toBeTruthy();
  });

  it('maps every method the contact surfaces emit', async () => {
    const cases: Array<[string, string]> = [
      ['call', 'contact_call'],
      ['phone', 'contact_call'],
      ['email', 'contact_email'],
      ['text', 'contact_text'],
      ['sms', 'contact_text'],
      ['SMS', 'contact_text'],
    ];
    for (const [method, expected] of cases) {
      insertMock.mockClear();
      await trackContactTap(AGENT, method);
      const [, row] = insertMock.mock.calls[0] as [string, Record<string, unknown>];
      expect(row.event_type, method).toBe(expected);
    }
  });

  it("records the sticky bar's other taps as calls to action (US-227)", async () => {
    // StickyActionBar routes 'schedule', 'valuation' and 'contact' through the
    // same handler. They open a modal rather than a phone or mail app, and were
    // dropped because the CHECK constraint had no type for them; cta_click is
    // that type now.
    for (const method of ['schedule', 'valuation', 'contact']) {
      await trackContactTap(AGENT, method);
    }
    expect(insertMock).toHaveBeenCalledTimes(3);
    for (const call of insertMock.mock.calls) {
      expect(call[1]).toMatchObject({ event_type: 'cta_click' });
    }
  });

  it('records nothing for an empty method', async () => {
    await trackContactTap(AGENT, '');
    expect(insertMock).not.toHaveBeenCalled();
  });

  it('records nothing when the profile has not loaded yet', async () => {
    await trackContactTap(undefined, 'call');
    expect(insertMock).not.toHaveBeenCalled();
  });
});

describe('recordAnalyticsEvent', () => {
  beforeEach(() => {
    insertMock.mockReset();
    localStorage.clear();
  });

  it('never throws — a tracking failure must not break the visitor tap', async () => {
    insertMock.mockRejectedValue(new Error('network down'));
    await expect(
      recordAnalyticsEvent({ userId: AGENT, eventType: 'link_click' })
    ).resolves.toBeUndefined();
  });

  it('carries the link id and title for the dashboard breakdown', async () => {
    insertMock.mockResolvedValue({ error: null });
    await recordAnalyticsEvent({
      userId: AGENT,
      eventType: 'link_click',
      targetId: '22222222-2222-2222-2222-222222222222',
      targetLabel: 'My listings',
    });
    const [, row] = insertMock.mock.calls[0] as [string, Record<string, unknown>];
    expect(row).toMatchObject({
      target_id: '22222222-2222-2222-2222-222222222222',
      target_label: 'My listings',
    });
  });
});

/**
 * US-274: the public profile fired listing_view on every open of the detail
 * modal, so opening, closing and reopening one property inflated its views on
 * the agent's dashboard. One view per visitor, listing and session.
 */
describe('trackListingView', () => {
  const LISTING_A = '33333333-3333-3333-3333-333333333333';
  const LISTING_B = '44444444-4444-4444-4444-444444444444';
  const OTHER_AGENT = '55555555-5555-5555-5555-555555555555';

  const listingViewRows = () =>
    insertMock.mock.calls
      .map(([, row]) => row as Record<string, unknown>)
      .filter((row) => row.event_type === 'listing_view');

  beforeEach(() => {
    insertMock.mockReset();
    insertMock.mockResolvedValue({ error: null });
    localStorage.clear();
    sessionStorage.clear();
    resetListingViewDedupeForTests();
  });

  it('records one view when the same listing is reopened in a session', async () => {
    await trackListingView(AGENT, LISTING_A, '12 Elm St');
    await trackListingView(AGENT, LISTING_A, '12 Elm St');
    await trackListingView(AGENT, LISTING_A, '12 Elm St');

    expect(listingViewRows()).toHaveLength(1);
    expect(listingViewRows()[0]).toMatchObject({
      user_id: AGENT,
      target_id: LISTING_A,
      target_label: '12 Elm St',
    });
  });

  it('still counts each different listing, and the same listing on another agent page', async () => {
    await trackListingView(AGENT, LISTING_A);
    await trackListingView(AGENT, LISTING_B);
    await trackListingView(OTHER_AGENT, LISTING_A);

    expect(listingViewRows().map((r) => [r.user_id, r.target_id])).toEqual([
      [AGENT, LISTING_A],
      [AGENT, LISTING_B],
      [OTHER_AGENT, LISTING_A],
    ]);
  });

  it('writes once when two opens race (the effect running twice)', async () => {
    let resolveInsert: (v: { error: null }) => void = () => {};
    insertMock.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveInsert = resolve;
        })
    );
    const first = trackListingView(AGENT, LISTING_A);
    const second = trackListingView(AGENT, LISTING_A);
    resolveInsert({ error: null });
    await Promise.all([first, second]);

    expect(listingViewRows()).toHaveLength(1);
  });

  it('survives a reload within the same session (sessionStorage)', async () => {
    await trackListingView(AGENT, LISTING_A);
    // A reload drops the module's memory but keeps the tab's sessionStorage.
    resetListingViewDedupeForTests();
    await trackListingView(AGENT, LISTING_A);

    expect(listingViewRows()).toHaveLength(1);
    expect(JSON.parse(sessionStorage.getItem('listing_views_seen') ?? '[]')).toEqual([
      `${AGENT}:${LISTING_A}`,
    ]);
  });

  it('counts the listing again in a new session', async () => {
    await trackListingView(AGENT, LISTING_A);
    sessionStorage.clear();
    resetListingViewDedupeForTests();
    await trackListingView(AGENT, LISTING_A);

    expect(listingViewRows()).toHaveLength(2);
  });

  it('retries on the next open when the insert was refused, so a lost view is not swallowed', async () => {
    insertMock.mockResolvedValueOnce({ error: { message: 'rate limited' } });
    await trackListingView(AGENT, LISTING_A);
    await trackListingView(AGENT, LISTING_A);
    await trackListingView(AGENT, LISTING_A);

    // Two attempts: the refused one and the stored one; the third is deduped.
    expect(listingViewRows()).toHaveLength(2);
  });

  it('retries after a network failure too', async () => {
    insertMock.mockRejectedValueOnce(new Error('network down'));
    await trackListingView(AGENT, LISTING_A);
    await trackListingView(AGENT, LISTING_A);

    expect(listingViewRows()).toHaveLength(2);
  });

  it('still dedupes within the page when sessionStorage throws (Safari private mode)', async () => {
    const getItem = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });
    try {
      await trackListingView(AGENT, LISTING_A);
      await trackListingView(AGENT, LISTING_A);
      expect(listingViewRows()).toHaveLength(1);
    } finally {
      getItem.mockRestore();
      setItem.mockRestore();
    }
  });

  it('ignores a corrupt stored entry rather than failing', async () => {
    sessionStorage.setItem('listing_views_seen', '{not json');
    await trackListingView(AGENT, LISTING_A);
    expect(listingViewRows()).toHaveLength(1);
  });

  it('caps the stored entry so a long-lived tab does not grow it forever', async () => {
    for (let i = 0; i < 205; i++) {
      await trackListingView(AGENT, `listing-${i}`);
    }
    const stored = JSON.parse(sessionStorage.getItem('listing_views_seen') ?? '[]') as string[];
    expect(stored).toHaveLength(200);
    expect(stored[stored.length - 1]).toBe(`${AGENT}:listing-204`);
  });

  it('records nothing without an agent id (the owner previewing an unpublished page)', async () => {
    await trackListingView(undefined, LISTING_A);
    expect(insertMock).not.toHaveBeenCalled();
  });
});
