/**
 * US-373 (US-336): a logged meeting counts as first contact.
 *
 * logMeeting used to insert into lead_activities directly, so the meeting
 * reached the timeline but leads.contacted_at stayed NULL. It now goes through
 * log_lead_meeting, which sets contacted_at once, as log_lead_call and
 * log_lead_email do. The database side is proven by scripts/verify-schema.mjs
 * ("log_lead_meeting records the meeting and first contact") and held without
 * a database by src/lib/leadMeetingFirstContact.test.ts.
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

let builders: ReturnType<typeof createQueryBuilder>[] = [];
let client: ReturnType<typeof createTestQueryClient>;
const wrapper = ({ children }: { children: ReactNode }) =>
  createElement(QueryClientProvider, { client }, children);

beforeEach(() => {
  vi.clearAllMocks();
  client = createTestQueryClient();
  builders = [];
  fromMock.mockImplementation(() => {
    const b = createQueryBuilder({ data: [], error: null });
    builders.push(b);
    return b;
  });
});

describe('useLeadActivities logMeeting', () => {
  it('logs through log_lead_meeting, which sets first contact, not a direct insert', async () => {
    rpcMock.mockResolvedValue({ data: 'activity-1', error: null });
    const invalidate = vi.spyOn(client, 'invalidateQueries');
    const { result } = renderHook(() => useLeadActivities('lead-1'), { wrapper });

    const scheduledAt = new Date('2026-11-06T15:30:00Z');
    act(() => {
      result.current.logMeeting({
        leadId: 'lead-1',
        meetingType: 'in_person',
        location: '12 Oak St',
        scheduledAt,
        notes: 'Walked the house',
      });
    });

    await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith('Meeting logged'));
    expect(rpcMock).toHaveBeenCalledTimes(1);
    expect(rpcMock).toHaveBeenCalledWith('log_lead_meeting', {
      _lead_id: 'lead-1',
      _meeting_type: 'in_person',
      _location: '12 Oak St',
      _scheduled_at: '2026-11-06T15:30:00.000Z',
      _notes: 'Walked the house',
    });
    // Nothing writes lead_activities directly any more; the RPC does, under
    // auth.uid(), and sets leads.contacted_at in the same transaction.
    // (The timeline query still reads it; nothing inserts.)
    for (const b of builders) expect(b.insert).not.toHaveBeenCalled();

    // The lead list is refetched so the lead stops showing as uncontacted.
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['leads'] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['lead-activities', 'lead-1'] });
  });

  it('sends optional fields as undefined so the RPC defaults apply', async () => {
    rpcMock.mockResolvedValue({ data: 'activity-2', error: null });
    const { result } = renderHook(() => useLeadActivities('lead-1'), { wrapper });

    act(() => {
      result.current.logMeeting({ leadId: 'lead-1', meetingType: 'video' });
    });

    await waitFor(() => expect(rpcMock).toHaveBeenCalled());
    expect(rpcMock).toHaveBeenCalledWith('log_lead_meeting', {
      _lead_id: 'lead-1',
      _meeting_type: 'video',
      _location: undefined,
      _scheduled_at: undefined,
      _notes: undefined,
    });
  });

  it('reports a refusal (e.g. a reassigned lead) instead of claiming success', async () => {
    rpcMock.mockResolvedValue({
      data: null,
      error: { message: 'Lead not found or access denied', code: 'P0001' },
    });
    const { result } = renderHook(() => useLeadActivities('lead-1'), { wrapper });

    act(() => {
      result.current.logMeeting({ leadId: 'lead-1', meetingType: 'phone' });
    });

    await waitFor(() => expect(toastMock.error).toHaveBeenCalledWith('Failed to log meeting'));
    expect(toastMock.success).not.toHaveBeenCalled();
  });
});
