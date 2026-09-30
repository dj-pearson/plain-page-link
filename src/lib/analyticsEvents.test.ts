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

import { getVisitorId, recordAnalyticsEvent, trackContactTap } from './analyticsEvents';

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

  it('records the sticky bar\'s other taps as calls to action (US-227)', async () => {
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
