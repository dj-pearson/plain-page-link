/**
 * US-392: a write refreshes the timeline of the lead it was FOR.
 *
 * useLeadContactAction serves both the Leads list and the detail modal, so it
 * opens useLeadActivities(undefined). Every log it made invalidated
 * ['lead-activities', undefined]: tapping Call, Email or Text, or sending a
 * quick response, in an open lead never appeared on that lead's timeline until
 * the modal was closed and reopened, and the list card's last-activity line
 * stayed stale.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import { createElement } from 'react';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { createTestQueryClient } from '@/test/test-utils';
import { createQueryBuilder } from '@/test/mocks/supabase';

const { rpcMock, fromMock, toastMock } = vi.hoisted(() => ({
  rpcMock: vi.fn(),
  fromMock: vi.fn(),
  toastMock: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    rpc: (fn: string, args: unknown) => rpcMock(fn, args),
    from: (table: string) => fromMock(table),
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'agent-1' } } }) },
  },
}));

vi.mock('@/stores/useAuthStore', () => ({
  useAuthStore: <T>(select: (s: { user: { id: string } }) => T) =>
    select({ user: { id: 'agent-1' } }),
}));

vi.mock('sonner', () => ({ toast: toastMock }));

import { useLeadActivities } from './useLeadActivities';

let client: ReturnType<typeof createTestQueryClient>;
const wrapper = ({ children }: { children: ReactNode }) =>
  createElement(QueryClientProvider, { client }, children);

const timelineReads = () => fromMock.mock.calls.filter(([t]) => t === 'lead_activities').length;

beforeEach(() => {
  vi.clearAllMocks();
  client = createTestQueryClient();
  fromMock.mockImplementation(() => createQueryBuilder({ data: [], error: null }));
  rpcMock.mockResolvedValue({ data: 'activity-1', error: null });
});

describe('useLeadActivities invalidation targets the written lead', () => {
  it('a call logged from an unkeyed instance refreshes that lead, not lead undefined', async () => {
    const invalidate = vi.spyOn(client, 'invalidateQueries');
    const { result } = renderHook(() => useLeadActivities(undefined), { wrapper });

    act(() => {
      result.current.logCall({ leadId: 'lead-7', outcome: 'initiated' });
    });

    await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith('Call logged'));
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['lead-activities', 'lead-7'] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['lead-activity-summary', 'lead-7'] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['lead-activity-summaries'] });
    expect(invalidate).not.toHaveBeenCalledWith({ queryKey: ['lead-activities', undefined] });
  });

  it('the open lead timeline refetches when another instance logs an email for it', async () => {
    // The detail modal's own instance, holding the timeline on screen.
    const modal = renderHook(() => useLeadActivities('lead-7'), { wrapper });
    await waitFor(() => expect(modal.result.current.isLoading).toBe(false));
    const before = timelineReads();

    // useLeadContactAction's instance.
    const contact = renderHook(() => useLeadActivities(undefined), { wrapper });
    act(() => {
      contact.result.current.logEmail({
        leadId: 'lead-7',
        subject: 'Re: 12 Oak St',
        recipient: 'buyer@example.com',
        body: 'Saturday works',
      });
    });

    await waitFor(() => expect(timelineReads()).toBeGreaterThan(before));
  });

  it('a text message refreshes the lead list, since it sets contacted_at', async () => {
    const invalidate = vi.spyOn(client, 'invalidateQueries');
    const { result } = renderHook(() => useLeadActivities(undefined), { wrapper });

    act(() => {
      result.current.logActivity({
        leadId: 'lead-7',
        activityType: 'sms',
        title: 'Text message',
        content: 'On my way',
      });
    });

    await waitFor(() =>
      expect(invalidate).toHaveBeenCalledWith({ queryKey: ['lead-activities', 'lead-7'] })
    );
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['leads'] });
  });

  it('a note does not refetch the lead list', async () => {
    const invalidate = vi.spyOn(client, 'invalidateQueries');
    const { result } = renderHook(() => useLeadActivities(undefined), { wrapper });

    act(() => {
      result.current.logActivity({ leadId: 'lead-7', activityType: 'note', content: 'x' });
    });

    await waitFor(() =>
      expect(invalidate).toHaveBeenCalledWith({ queryKey: ['lead-activities', 'lead-7'] })
    );
    expect(invalidate).not.toHaveBeenCalledWith({ queryKey: ['leads'] });
  });

  it('completing a follow-up still refreshes the hook lead', async () => {
    const invalidate = vi.spyOn(client, 'invalidateQueries');
    const { result } = renderHook(() => useLeadActivities('lead-3'), { wrapper });

    act(() => {
      result.current.completeTask('activity-9');
    });

    await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith('Follow-up completed'));
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['lead-activities', 'lead-3'] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['lead-tasks'] });
  });
});
