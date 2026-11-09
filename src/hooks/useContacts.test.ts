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

const indexOwnContacts = vi.fn(async () => true);

vi.mock('@/lib/pii', () => ({
  encryptPIIBatch: vi.fn(async (values: (string | null)[]) => values),
  decryptContactDetails: vi.fn(async () => new Map()),
  indexOwnContacts: () => indexOwnContacts(),
}));

import { useContactInteractions, useContacts } from './useContacts';

describe('useContacts fingerprints contacts as they are written (US-640)', () => {
  beforeEach(() => {
    fromMock.mockClear();
    indexOwnContacts.mockClear();
    queryResult = { data: { id: 'contact-1' }, error: null };
  });

  function renderContacts() {
    const client = createTestQueryClient();
    const wrapper = ({ children }: { children: ReactNode }) =>
      createElement(QueryClientProvider, { client }, children);
    return renderHook(() => useContacts(), { wrapper });
  }

  it('indexes right after a contact is created', async () => {
    const { result } = renderContacts();
    await act(async () => {
      await result.current.createContact.mutateAsync({
        first_name: 'Dana',
        relationship: 'past_client',
        email: 'dana@example.com',
      });
    });
    expect(indexOwnContacts).toHaveBeenCalledTimes(1);
  });

  it('indexes after an edit that rewrites email or phone (the trigger cleared the hashes)', async () => {
    const { result } = renderContacts();
    await act(async () => {
      await result.current.updateContact.mutateAsync({
        id: 'contact-1',
        input: { phone: '(512) 555-0142' },
      });
    });
    expect(indexOwnContacts).toHaveBeenCalledTimes(1);
  });

  it('does not index after an edit that leaves email and phone alone', async () => {
    const { result } = renderContacts();
    await act(async () => {
      await result.current.updateContact.mutateAsync({
        id: 'contact-1',
        input: { lead_id: 'lead-1' },
      });
    });
    expect(indexOwnContacts).not.toHaveBeenCalled();
  });

  it('does not index when the write fails', async () => {
    queryResult = { data: null, error: { message: 'denied' } };
    const { result } = renderContacts();
    await act(async () => {
      await result.current.createContact
        .mutateAsync({ first_name: 'Dana', relationship: 'past_client' })
        .catch(() => undefined);
    });
    expect(indexOwnContacts).not.toHaveBeenCalled();
  });
});

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
