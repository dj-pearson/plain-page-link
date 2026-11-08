import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import { createElement } from 'react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { createTestQueryClient } from '@/test/test-utils';
import { createQueryBuilder, type MockQueryResult } from '@/test/mocks/supabase';

let queryResult: MockQueryResult;
const fromMock = vi.fn((_table: string) => createQueryBuilder(queryResult));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: (table: string) => fromMock(table) },
}));

vi.mock('@/stores/useAuthStore', () => ({
  useAuthStore: <T>(select: (s: { user: { id: string } }) => T) =>
    select({ user: { id: 'agent-1' } }),
}));

vi.mock('@/lib/pii', () => ({
  encryptPIIBatch: vi.fn(async (values: (string | null)[]) => values),
  decryptContactDetails: vi.fn(async () => new Map()),
}));

import { useContactInteractions } from './useContacts';

describe('useContactInteractions.deleteInteraction (US-610)', () => {
  beforeEach(() => {
    fromMock.mockClear();
    queryResult = { data: [], error: null };
  });

  it('refreshes the contact and the due lists, since deleting the latest touch rolls the cadence back', async () => {
    const client = createTestQueryClient();
    const invalidate = vi.spyOn(client, 'invalidateQueries');
    const wrapper = ({ children }: { children: ReactNode }) =>
      createElement(QueryClientProvider, { client }, children);

    const { result } = renderHook(() => useContactInteractions('contact-1'), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    invalidate.mockClear();

    await act(async () => {
      await result.current.deleteInteraction.mutateAsync('interaction-1');
    });

    expect(fromMock).toHaveBeenCalledWith('contact_interactions');
    const keys = invalidate.mock.calls.map(([filters]) => filters?.queryKey?.[0]);
    expect(keys).toEqual(
      expect.arrayContaining(['contacts', 'contact', 'contacts-due', 'contact-interactions'])
    );
  });
});

describe('contact touch trigger migration (US-610)', () => {
  const sql = readFileSync(
    join(
      process.cwd(),
      'supabase/migrations/20261108000610_contact_touch_follows_deleted_interactions.sql'
    ),
    'utf8'
  );

  it('fires on delete and on a change of date, kind or contact, not only on insert', () => {
    expect(sql).toMatch(
      /AFTER INSERT OR UPDATE OF kind, occurred_at, contact_id OR DELETE ON public\.contact_interactions/
    );
  });

  it('rolls back only when the removed entry was the latest touch, and never counts notes', () => {
    expect(sql).toMatch(/c\.last_contacted_at <= OLD\.occurred_at/);
    expect(sql).toMatch(/i\.kind <> 'note'/);
  });

  it('keeps the pinned search_path and stays SECURITY INVOKER', () => {
    expect(sql).toMatch(/SET search_path = public, extensions, pg_temp/);
    expect(sql).not.toMatch(/SECURITY DEFINER/);
  });
});
