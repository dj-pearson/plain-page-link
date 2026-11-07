/**
 * US-322: the browser may UPDATE notifications.read_at and nothing else
 * (migration 20261107000330 grants authenticated UPDATE (read_at) only). Any
 * other column in the payload is now a permission error for the whole update,
 * so marking read must keep sending read_at alone.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import { createElement } from 'react';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { createTestQueryClient } from '@/test/test-utils';
import { createQueryBuilder } from '@/test/mocks/supabase';

type Builder = ReturnType<typeof createQueryBuilder>;
let builders: Builder[] = [];
const fromMock = vi.fn((_table: string) => {
  const builder = createQueryBuilder({ data: [], error: null });
  builders.push(builder);
  return builder;
});
const channel = { on: vi.fn(), subscribe: vi.fn() };
channel.on.mockReturnValue(channel);
channel.subscribe.mockReturnValue(channel);

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (table: string) => fromMock(table),
    channel: () => channel,
    removeChannel: vi.fn(),
  },
}));

vi.mock('@/stores/useAuthStore', () => ({
  useAuthStore: <T>(select: (s: { user: { id: string } }) => T) =>
    select({ user: { id: 'user-1' } }),
}));

import { useNotifications } from './useNotifications';

const wrapper = ({ children }: { children: ReactNode }) =>
  createElement(QueryClientProvider, { client: createTestQueryClient() }, children);

/** Every payload passed to .update() on the notifications table. */
const updatePayloads = () =>
  builders.flatMap((b) =>
    (b.update as ReturnType<typeof vi.fn>).mock.calls.map((c) => c[0] as object)
  );

describe('useNotifications writes', () => {
  beforeEach(() => {
    builders = [];
    fromMock.mockClear();
  });

  it('marking one notification read sends read_at only', async () => {
    const { result } = renderHook(() => useNotifications(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.markAsRead('n-1'));
    await waitFor(() => expect(updatePayloads()).toHaveLength(1));

    expect(fromMock).toHaveBeenCalledWith('notifications');
    expect(Object.keys(updatePayloads()[0])).toEqual(['read_at']);
  });

  it('marking all read sends read_at only, scoped to the signed-in user', async () => {
    const { result } = renderHook(() => useNotifications(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.markAllAsRead());
    await waitFor(() => expect(updatePayloads()).toHaveLength(1));

    expect(Object.keys(updatePayloads()[0])).toEqual(['read_at']);
    const writer = builders.find(
      (b) => (b.update as ReturnType<typeof vi.fn>).mock.calls.length > 0
    )!;
    expect(writer.eq).toHaveBeenCalledWith('user_id', 'user-1');
  });
});
