/**
 * US-414 (US-403): useGDPR reads the subject's export requests without
 * file_url, queues an emailed export through gdpr-export's POST, and offers
 * that path when the immediate download fails in a way it would fix.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import { createElement } from 'react';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { createTestQueryClient } from '@/test/test-utils';
import { createQueryBuilder, type MockQueryResult } from '@/test/mocks/supabase';

const { callMock, toastMock, ErrorClass } = vi.hoisted(() => {
  class ErrorClass extends Error {
    status: number;
    constructor(message: string, init: { functionName: string; status: number }) {
      super(message);
      this.status = init.status;
    }
  }
  return { callMock: vi.fn(), toastMock: vi.fn(), ErrorClass };
});

let queryResult: MockQueryResult;
type Builder = ReturnType<typeof createQueryBuilder>;
let builders: Builder[] = [];
const fromMock = vi.fn((_table: string) => {
  const builder = createQueryBuilder(queryResult);
  builders.push(builder);
  return builder;
});

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: (table: string) => fromMock(table) },
}));
vi.mock('@/lib/edgeFunctions', () => ({
  callEdgeFunction: (...args: unknown[]) => callMock(...args),
  edgeFunctions: { invoke: vi.fn() },
  EdgeFunctionError: ErrorClass,
}));
vi.mock('@/stores/useAuthStore', () => ({
  useAuthStore: <T>(select: (s: { user: { id: string } }) => T) =>
    select({ user: { id: 'user-1' } }),
}));
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: toastMock }) }));

import { useGDPR } from './useGDPR';

const wrapper = ({ children }: { children: ReactNode }) =>
  createElement(QueryClientProvider, { client: createTestQueryClient() }, children);

beforeEach(() => {
  builders = [];
  fromMock.mockClear();
  callMock.mockReset();
  toastMock.mockReset();
  queryResult = { data: [], error: null };
  // gdpr-deletion status GET
  callMock.mockImplementation(async (name: string) =>
    name === 'gdpr-deletion' ? { scheduled: false } : {}
  );
});

describe('useGDPR export requests', () => {
  it("reads the subject's own export requests, never file_url", async () => {
    queryResult = {
      data: [{ id: 'r1', status: 'pending', created_at: '2026-11-01T00:00:00Z' }],
      error: null,
    };
    const { result } = renderHook(() => useGDPR(), { wrapper });
    await waitFor(() => expect(result.current.exportRequests).toHaveLength(1));

    expect(fromMock).toHaveBeenCalledWith('gdpr_data_requests');
    const b = builders[0];
    const columns = (b.select as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(columns).not.toMatch(/file_url/);
    expect(b.eq).toHaveBeenCalledWith('user_id', 'user-1');
    expect(b.eq).toHaveBeenCalledWith('request_type', 'export');
    expect(result.current.hasExportInFlight).toBe(true);
  });

  it('queues an export with a POST and tells the subject to expect an email', async () => {
    const { result } = renderHook(() => useGDPR(), { wrapper });
    callMock.mockResolvedValueOnce({ requestId: 'r2' });

    await act(async () => {
      result.current.queueExport();
    });

    await waitFor(() =>
      expect(toastMock).toHaveBeenCalledWith(expect.objectContaining({ title: 'Export requested' }))
    );
    expect(callMock).toHaveBeenCalledWith('gdpr-export', { method: 'POST', auth: true });
  });

  it("shows the 409 'already pending' as a friendly message", async () => {
    const { result } = renderHook(() => useGDPR(), { wrapper });
    callMock.mockRejectedValueOnce(
      new ErrorClass('already pending', { functionName: 'gdpr-export', status: 409 })
    );

    await act(async () => {
      result.current.queueExport();
    });

    await waitFor(() =>
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({ description: expect.stringMatching(/already on its way/) })
      )
    );
  });

  it('offers the queued path when the immediate download answers 503', async () => {
    const { result } = renderHook(() => useGDPR(), { wrapper });
    callMock.mockRejectedValueOnce(
      new ErrorClass('incomplete', { functionName: 'gdpr-export', status: 503 })
    );

    await act(async () => {
      result.current.exportData();
    });

    await waitFor(() => expect(result.current.offerQueuedExport).toBe(true));
    const getCall = callMock.mock.calls.find(
      (c) => c[0] === 'gdpr-export' && (c[1] as { method: string }).method === 'GET'
    );
    expect((getCall?.[1] as { signal?: AbortSignal }).signal).toBeInstanceOf(AbortSignal);
  });

  it('does not offer the queued path for a rate-limited download', async () => {
    const { result } = renderHook(() => useGDPR(), { wrapper });
    callMock.mockRejectedValueOnce(
      new ErrorClass('slow down', { functionName: 'gdpr-export', status: 429 })
    );

    await act(async () => {
      result.current.exportData();
    });

    await waitFor(() =>
      expect(toastMock).toHaveBeenCalledWith(expect.objectContaining({ title: 'Export Failed' }))
    );
    expect(result.current.offerQueuedExport).toBe(false);
  });
});
