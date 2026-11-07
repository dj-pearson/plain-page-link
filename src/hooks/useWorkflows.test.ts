/**
 * US-266: the workflow list surfaces a failed load instead of an empty list,
 * a delete that RLS filtered to zero rows is reported as a failure, and a
 * duplicate is always an inactive, unpublished draft.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import { createElement } from 'react';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { createTestQueryClient } from '@/test/test-utils';
import { createQueryBuilder, type MockQueryResult } from '@/test/mocks/supabase';
import type { Database } from '@/integrations/supabase/types';

type WorkflowRow = Database['public']['Tables']['workflows']['Row'];

let queryResult: MockQueryResult;
type Builder = ReturnType<typeof createQueryBuilder>;
let builders: Builder[] = [];
const fromMock = vi.fn((_table: string) => {
  const builder = createQueryBuilder(queryResult);
  builders.push(builder);
  return builder;
});
/** The builders that called `method` (invalidation refetches add more). */
const calledWith = (method: string) =>
  builders.filter((b) => (b[method] as ReturnType<typeof vi.fn>).mock.calls.length > 0);

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: (table: string) => fromMock(table) },
}));

vi.mock('@/stores/useAuthStore', () => ({
  useAuthStore: <T>(select: (s: { user: { id: string } }) => T) =>
    select({ user: { id: 'user-1' } }),
}));

const { toastMock } = vi.hoisted(() => ({
  toastMock: { success: vi.fn(), error: vi.fn() },
}));
vi.mock('sonner', () => ({ toast: toastMock }));

import { buildWorkflowCopy, useWorkflows } from './useWorkflows';

const row: WorkflowRow = {
  id: 'wf-1',
  user_id: 'user-1',
  name: 'New buyer follow-up',
  description: 'Three touches in a week',
  category: 'lead_management',
  nodes: [{ id: 'n1' }],
  edges: [],
  viewport: { x: 0, y: 0, zoom: 1 },
  trigger_config: null,
  tags: ['buyers'],
  is_active: true,
  is_published: true,
  execution_count: 12,
  success_count: 10,
  failure_count: 2,
  version: 4,
  published_version: 3,
  last_executed_at: '2026-10-01T00:00:00Z',
  last_published_at: '2026-09-01T00:00:00Z',
  created_at: '2026-08-01T00:00:00Z',
  updated_at: '2026-10-01T00:00:00Z',
};

const wrapper = ({ children }: { children: ReactNode }) =>
  createElement(QueryClientProvider, { client: createTestQueryClient() }, children);

describe('buildWorkflowCopy', () => {
  it('copies the steps but starts as an inactive, unpublished draft with fresh counters', () => {
    const copy = buildWorkflowCopy(row);
    expect(copy).toMatchObject({
      user_id: 'user-1',
      name: 'New buyer follow-up (copy)',
      nodes: row.nodes,
      edges: row.edges,
      category: 'lead_management',
      tags: ['buyers'],
      is_active: false,
      is_published: false,
    });
    expect(copy).not.toHaveProperty('id');
    expect(copy).not.toHaveProperty('execution_count');
    expect(copy).not.toHaveProperty('version');
    expect(copy).not.toHaveProperty('created_at');
  });
});

describe('useWorkflows', () => {
  beforeEach(() => {
    fromMock.mockClear();
    builders = [];
    toastMock.success.mockClear();
    toastMock.error.mockClear();
    queryResult = { data: [row], error: null };
  });

  it("lists the agent's workflows", async () => {
    const { result } = renderHook(() => useWorkflows(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.workflows).toHaveLength(1);
    expect(result.current.workflows[0].name).toBe('New buyer follow-up');
    expect(builders[0].eq).toHaveBeenCalledWith('user_id', 'user-1');
  });

  it('reports a failed load as an error, not an empty list', async () => {
    queryResult = { data: null, error: { message: 'network down' } };
    const { result } = renderHook(() => useWorkflows(), { wrapper });
    await waitFor(() => expect(result.current.error).toBeTruthy());
    expect(result.current.workflows).toEqual([]);
  });

  it('treats a delete that removed no rows as a failure', async () => {
    const { result } = renderHook(() => useWorkflows(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    queryResult = { data: [], error: null };
    await act(async () => {
      await result.current.deleteWorkflow.mutateAsync('wf-1').catch(() => undefined);
    });
    expect(toastMock.error).toHaveBeenCalled();
    expect(toastMock.success).not.toHaveBeenCalled();
  });

  it('deletes by id and confirms', async () => {
    const { result } = renderHook(() => useWorkflows(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    queryResult = { data: [{ id: 'wf-1' }], error: null };
    await act(async () => {
      await result.current.deleteWorkflow.mutateAsync('wf-1');
    });
    const [deleted] = calledWith('delete');
    expect(deleted).toBeDefined();
    expect(deleted.eq).toHaveBeenCalledWith('id', 'wf-1');
    expect(toastMock.success).toHaveBeenCalledWith('Workflow deleted');
  });

  it('duplicates by reading the source row and inserting a draft copy', async () => {
    const { result } = renderHook(() => useWorkflows(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // Both the read (.single()) and the insert (.select('id').single()) resolve
    // to this row in the mock; the insert payload is what matters.
    queryResult = { data: row, error: null };
    await act(async () => {
      await result.current.duplicateWorkflow.mutateAsync('wf-1');
    });
    const [inserted] = calledWith('insert');
    expect(inserted.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'New buyer follow-up (copy)',
        is_active: false,
        is_published: false,
      })
    );
    expect(toastMock.success).toHaveBeenCalledWith('Copy created as a draft');
  });
});
