/**
 * US-265: the public profile lookup asks for "published, or mine", so an agent
 * can preview their own unpublished page and a visitor never sees one.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import type { User } from '@supabase/supabase-js';
import { createTestQueryClient } from '@/test/test-utils';

const h = vi.hoisted(() => ({ orFilters: [] as string[] }));

vi.mock('@/integrations/supabase/client', () => {
  const related = () => {
    const chain: Record<string, unknown> = {};
    for (const m of ['select', 'eq', 'in', 'order', 'limit']) chain[m] = () => chain;
    chain.maybeSingle = async () => ({ data: null, error: null });
    chain.then = (resolve: (v: unknown) => unknown) => resolve({ data: [], error: null });
    return chain;
  };
  const profiles = () => {
    const chain: Record<string, unknown> = {
      select: () => chain,
      eq: () => chain,
      or: (filter: string) => {
        h.orFilters.push(filter);
        return chain;
      },
      single: async () => ({
        data: { id: 'agent', username: 'janedoe', is_published: false },
        error: null,
      }),
    };
    return chain;
  };
  return {
    supabase: {
      from: (table: string) => (table === 'profiles' ? profiles() : related()),
      rpc: async () => ({ data: null, error: null }),
    },
  };
});

vi.mock('@/stores/useAuthStore', async () => {
  const { create } = await import('zustand');
  return { useAuthStore: create<{ user: User | null }>(() => ({ user: null })) };
});

import { usePublicProfile } from './usePublicProfile';
import { useAuthStore } from '@/stores/useAuthStore';

const OWNER = '11111111-2222-3333-4444-555555555555';

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={createTestQueryClient()}>{children}</QueryClientProvider>
);

beforeEach(() => {
  h.orFilters = [];
  useAuthStore.setState({ user: null });
});

describe('usePublicProfile', () => {
  it('asks an anonymous visitor for published profiles only', async () => {
    const { result } = renderHook(() => usePublicProfile('JaneDoe'), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(h.orFilters).toEqual(['is_published.eq.true']);
  });

  it('lets the signed-in owner read their own row, and refetches when the viewer changes', async () => {
    const { result } = renderHook(() => usePublicProfile('janedoe'), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    act(() => {
      useAuthStore.setState({ user: { id: OWNER } as User });
    });
    await waitFor(() =>
      expect(h.orFilters).toEqual(['is_published.eq.true', `is_published.eq.true,id.eq.${OWNER}`])
    );
  });
});
