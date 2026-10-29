import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import { createElement } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { createTestQueryClient } from '@/test/test-utils';
import { createQueryBuilder } from '@/test/mocks/supabase';

type RpcArgs = { p_since: string; p_until?: string; p_tz?: string };
type RpcResult = { data: unknown; error: { message: string } | null };

let current: RpcResult;
let previous: RpcResult;
const rpcMock = vi.fn(async (_fn: string, args: RpcArgs) => (args.p_until ? previous : current));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    rpc: (fn: string, args: RpcArgs) => rpcMock(fn, args),
    // The latest-leads page: empty here, so any total these tests see can only
    // have come from the aggregate.
    from: () => createQueryBuilder({ data: [], error: null }),
  },
}));

vi.mock('@/stores/useAuthStore', () => ({
  useAuthStore: () => ({ user: { id: 'agent-1' } }),
}));

vi.mock('@/lib/pii', () => ({
  decryptLeadContacts: vi.fn(async () => new Map()),
}));

import { useAnalytics, toAnalyticsSummary, formatDayLabel } from './useAnalytics';

const wrapper = ({ children }: { children: ReactNode }) =>
  createElement(QueryClientProvider, { client: createTestQueryClient() }, children);

/** 1,500 views over 30 days — past the 1,000-row page the totals used to be the length of. */
const byDay = Array.from({ length: 30 }, (_, i) => ({
  day: `2026-10-${String(i + 1).padStart(2, '0')}`,
  views: 50,
  visitors: 20,
}));

describe('useAnalytics (US-239)', () => {
  beforeEach(() => {
    rpcMock.mockClear();
    current = {
      data: {
        views: 1500,
        visitors: 600,
        leads: 600,
        conversions: 60,
        leads_by_type: { buyer: 400, '': 0, contact: 200 },
        avg_response_ms: 90 * 60000,
        by_day: byDay,
        events: [
          { type: 'link_click', label: 'Zillow', count: 1200 },
          { type: 'link_click', label: null, count: 3 },
          { type: 'contact_call', label: null, count: 1100 },
        ],
      },
      error: null,
    };
    previous = { data: { views: 1200, visitors: 500, leads: 520, conversions: 40 }, error: null };
  });

  it('1,500 views yields 1,500, and 600 leads yields 600', async () => {
    const { result } = renderHook(() => useAnalytics('30d'), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.stats.totalViews).toBe(1500);
    expect(result.current.stats.uniqueVisitors).toBe(600);
    expect(result.current.stats.totalLeads).toBe(600);
    expect(result.current.stats.conversionRate).toBeCloseTo(40);
    expect(result.current.stats.avgResponseMinutes).toBe(90);
  });

  it('charts every day the server bucketed, oldest first', async () => {
    const { result } = renderHook(() => useAnalytics('30d'), { wrapper });
    await waitFor(() => expect(result.current.viewsData).toHaveLength(30));
    expect(result.current.viewsData.reduce((n, d) => n + d.views, 0)).toBe(1500);
    expect(result.current.viewsData[0]).toEqual({ name: 'Oct 1', views: 50, visitors: 20 });
  });

  it('takes the lead and interaction breakdowns from the same counts', async () => {
    const { result } = renderHook(() => useAnalytics('30d'), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.leadsData).toContainEqual({ name: 'Buyer', value: 400 });
    expect(result.current.totalLinkClicks).toBe(1203);
    expect(result.current.linkClicks[0]).toEqual({ name: 'Zillow', value: 1200 });
    expect(result.current.contactTaps).toContainEqual({ name: 'Call', value: 1100 });
    expect(result.current.totalContactTaps).toBe(1100);
  });

  it('compares against the preceding window, asked for with an upper bound', async () => {
    const { result } = renderHook(() => useAnalytics('30d'), { wrapper });
    await waitFor(() => expect(result.current.hasPreviousPeriod).toBe(true));
    expect(result.current.previousStats).toEqual({
      views: 1200,
      visitors: 500,
      leads: 520,
      conversions: 40,
    });
    const prevCall = rpcMock.mock.calls.find(([, args]) => args.p_until);
    const curCall = rpcMock.mock.calls.find(([, args]) => !args.p_until);
    expect(prevCall?.[0]).toBe('analytics_summary');
    // The previous window ends where the current one starts.
    expect(prevCall?.[1].p_until).toBe(curCall?.[1].p_since);
  });

  it('a failed previous-period query shows no comparison rather than +100%', async () => {
    previous = { data: null, error: { message: 'boom' } };
    const { result } = renderHook(() => useAnalytics('30d'), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await waitFor(() => expect(rpcMock.mock.calls.some(([, a]) => a.p_until)).toBe(true));
    expect(result.current.hasPreviousPeriod).toBe(false);
    expect(result.current.stats.totalViews).toBe(1500);
  });

  it('surfaces a failed summary as an error, not as zero', async () => {
    current = { data: null, error: { message: 'boom' } };
    const { result } = renderHook(() => useAnalytics('30d'), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('toAnalyticsSummary', () => {
  it('reads a missing or malformed payload as zeros', () => {
    expect(toAnalyticsSummary(null).views).toBe(0);
    const s = toAnalyticsSummary({ views: '12', by_day: [null, { day: '2026-01-02', views: 3 }] });
    expect(s.views).toBe(12);
    expect(s.byDay).toEqual([{ day: '2026-01-02', views: 3, visitors: 0 }]);
    expect(s.avgResponseMs).toBeNull();
  });
});

describe('formatDayLabel', () => {
  it('reads the day as a local calendar date', () => {
    expect(formatDayLabel('2026-01-01')).toBe('Jan 1');
    expect(formatDayLabel('nonsense')).toBe('nonsense');
  });
});
