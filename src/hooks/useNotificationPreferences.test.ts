/**
 * US-433: the first notification save fills profiles.timezone from the
 * browser, so the morning email moves to the agent's own morning.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import { createElement } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { createTestQueryClient } from '@/test/test-utils';
import { createQueryBuilder, type MockQueryResult } from '@/test/mocks/supabase';

const USER_ID = '00000000-0000-0000-0000-000000000001';

let ownRow: MockQueryResult;
let updateResults: MockQueryResult[];
const updatePayloads: Record<string, unknown>[] = [];

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: () => {
      const builder = createQueryBuilder({ data: null, error: null });
      builder.update = vi.fn((payload: Record<string, unknown>) => {
        updatePayloads.push(payload);
        return createQueryBuilder(updateResults.shift() ?? { data: null, error: null });
      });
      return builder;
    },
    rpc: () => createQueryBuilder(ownRow),
  },
}));

vi.mock('@/stores/useAuthStore', () => ({
  useAuthStore: <T>(select: (s: { user: { id: string } }) => T) =>
    select({ user: { id: USER_ID } }),
}));

vi.mock('@/lib/timeZone', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/timeZone')>()),
  detectBrowserTimeZone: () => 'America/Denver',
}));

import { useNotificationPreferences } from './useNotificationPreferences';

const wrapper = ({ children }: { children: ReactNode }) =>
  createElement(QueryClientProvider, { client: createTestQueryClient() }, children);

async function saveDigest() {
  const { result } = renderHook(() => useNotificationPreferences(), { wrapper });
  await waitFor(() => expect(result.current.isLoading).toBe(false));
  // Wait for the time-zone read to settle too.
  await waitFor(() => expect(result.current.preferences).toBeDefined());
  await act(async () => {
    await new Promise((r) => setTimeout(r, 0));
  });
  await act(async () => {
    await result.current.update.mutateAsync({ digest: 'weekly' });
  });
}

describe('useNotificationPreferences time-zone default (US-433)', () => {
  beforeEach(() => {
    updatePayloads.length = 0;
    updateResults = [];
  });

  it('writes the device zone with the first save when none is stored', async () => {
    ownRow = { data: { id: USER_ID, notification_preferences: {}, timezone: null }, error: null };
    await saveDigest();
    expect(updatePayloads).toHaveLength(1);
    expect(updatePayloads[0].timezone).toBe('America/Denver');
    expect(updatePayloads[0].notification_preferences).toMatchObject({ digest: 'weekly' });
  });

  it('leaves a stored zone alone', async () => {
    ownRow = {
      data: { id: USER_ID, notification_preferences: {}, timezone: 'Europe/London' },
      error: null,
    };
    await saveDigest();
    expect(updatePayloads).toHaveLength(1);
    expect(updatePayloads[0]).not.toHaveProperty('timezone');
  });

  it('a refused zone does not lose the setting the agent changed', async () => {
    ownRow = { data: { id: USER_ID, notification_preferences: {}, timezone: null }, error: null };
    updateResults = [
      { data: null, error: { message: 'column "timezone" does not exist', code: '42703' } },
    ];
    await saveDigest();
    expect(updatePayloads).toHaveLength(2);
    expect(updatePayloads[1]).not.toHaveProperty('timezone');
    expect(updatePayloads[1].notification_preferences).toMatchObject({ digest: 'weekly' });
  });
});

describe('useNotificationPreferences failed read (US-612)', () => {
  beforeEach(() => {
    updatePayloads.length = 0;
    updateResults = [];
  });

  it('refuses to save rather than writing the defaults over what is stored', async () => {
    ownRow = { data: null, error: { message: 'network down', code: '' } };
    const { result } = renderHook(() => useNotificationPreferences(), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
    await act(async () => {
      await expect(result.current.update.mutateAsync({ sla_hours: 24 })).rejects.toThrow(
        /have not loaded/
      );
    });
    expect(updatePayloads).toHaveLength(0);
  });
});
