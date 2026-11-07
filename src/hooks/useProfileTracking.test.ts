/**
 * US-115: increment_link_clicks had no throttle at all, so click_count was as
 * inflatable as view_count. It takes a visitor id now, and the caller has to
 * pass one or the rate limit has nothing to bucket by.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

const rpcMock = vi.fn();
const insertMock = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    rpc: (fn: string, args: unknown) => rpcMock(fn, args),
    from: (table: string) => ({ insert: (row: unknown) => insertMock(table, row) }),
  },
}));

import {
  resetProfileViewDedupeForTests,
  trackLinkClick,
  useProfileTracking,
} from './useProfileTracking';

const AGENT = '11111111-1111-1111-1111-111111111111';
const LINK = '22222222-2222-2222-2222-222222222222';

describe('trackLinkClick', () => {
  beforeEach(() => {
    rpcMock.mockReset().mockResolvedValue({ error: null });
    insertMock.mockReset().mockResolvedValue({ error: null });
    localStorage.clear();
  });

  it('passes a visitor id, which is what the throttle buckets on', async () => {
    await trackLinkClick(LINK, AGENT, 'My listings');

    expect(rpcMock).toHaveBeenCalledTimes(1);
    const [fn, args] = rpcMock.mock.calls[0] as [string, Record<string, unknown>];
    expect(fn).toBe('increment_link_clicks');
    expect(args.link_id).toBe(LINK);
    expect(args.visitor_id).toBeTruthy();
  });

  it('also records a dated event, since click_count is a lifetime total', async () => {
    await trackLinkClick(LINK, AGENT, 'My listings');

    const [table, row] = insertMock.mock.calls[0] as [string, Record<string, unknown>];
    expect(table).toBe('analytics_events');
    expect(row).toMatchObject({
      user_id: AGENT,
      event_type: 'link_click',
      target_id: LINK,
      target_label: 'My listings',
    });
  });

  it('still counts the click when the profile id is not to hand', async () => {
    await trackLinkClick(LINK);
    expect(rpcMock).toHaveBeenCalledTimes(1);
    expect(insertMock).not.toHaveBeenCalled();
  });

  it('does not let a failed count stop the visitor following the link', async () => {
    rpcMock.mockRejectedValue(new Error('offline'));
    await expect(trackLinkClick(LINK, AGENT, 'My listings')).resolves.toBeUndefined();
  });
});

describe('useProfileTracking (US-275)', () => {
  beforeEach(() => {
    insertMock.mockReset().mockResolvedValue({ error: null });
    resetProfileViewDedupeForTests();
  });

  const views = () => insertMock.mock.calls.filter(([table]) => table === 'analytics_views');

  it('counts one view when the visitor comes Back to the profile from a listing page', async () => {
    const first = renderHook(() => useProfileTracking(AGENT, 'jane'));
    first.unmount(); // profile -> /jane/listing/x
    renderHook(() => useProfileTracking(AGENT, 'jane')); // Back
    await vi.waitFor(() => expect(views()).toHaveLength(1));
  });

  it('still counts a different profile', async () => {
    renderHook(() => useProfileTracking(AGENT, 'jane'));
    renderHook(() => useProfileTracking(LINK, 'sam'));
    await vi.waitFor(() => expect(views()).toHaveLength(2));
  });

  it('does not count the owner preview (no id)', async () => {
    renderHook(() => useProfileTracking(undefined, 'jane'));
    await new Promise((r) => setTimeout(r, 0));
    expect(views()).toHaveLength(0);
  });
});
