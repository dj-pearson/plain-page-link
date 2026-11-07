/**
 * US-307 (slice of US-287): the branding and open-house RPCs travel with the
 * profile's related reads instead of waiting for the page to render, and the
 * hooks that own them do not issue a second request when they mount.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const h = vi.hoisted(() => ({
  /** Every request, in order: a table name, or `rpc:<name>`. */
  calls: [] as string[],
  /** Holds the related table reads open until released. */
  release: null as null | (() => void),
  gate: null as null | Promise<void>,
  openHouses: [] as unknown[],
  showsBranding: false as boolean,
}));

vi.mock('@/integrations/supabase/client', () => {
  const related = (table: string) => {
    const chain: Record<string, unknown> = {};
    for (const m of ['select', 'eq', 'in', 'order', 'limit']) chain[m] = () => chain;
    chain.maybeSingle = async () => {
      h.calls.push(table);
      await h.gate;
      return { data: null, error: null };
    };
    chain.then = (resolve: (v: unknown) => unknown, reject: (e: unknown) => unknown) => {
      h.calls.push(table);
      return (h.gate ?? Promise.resolve()).then(() => resolve({ data: [], error: null }), reject);
    };
    return chain;
  };
  const profiles = () => {
    const chain: Record<string, unknown> = {
      select: () => chain,
      eq: () => chain,
      or: () => chain,
      single: async () => {
        h.calls.push('profiles');
        return { data: { id: 'agent-1', username: 'janedoe', is_published: true }, error: null };
      },
    };
    return chain;
  };
  return {
    supabase: {
      from: (table: string) => (table === 'profiles' ? profiles() : related(table)),
      rpc: async (name: string) => {
        h.calls.push(`rpc:${name}`);
        if (name === 'profile_shows_branding') return { data: h.showsBranding, error: null };
        if (name === 'list_public_open_houses') return { data: h.openHouses, error: null };
        return { data: null, error: null };
      },
    },
  };
});

// useOpenHouses also carries the kiosk and agent-side helpers; none run here.
vi.mock('@/lib/edgeFunctions', () => ({ callEdgeFunction: vi.fn() }));
vi.mock('@/lib/pii', () => ({ decryptLeadContacts: vi.fn() }));

vi.mock('@/stores/useAuthStore', async () => {
  const { create } = await import('zustand');
  return { useAuthStore: create(() => ({ user: null })) };
});

import { usePublicProfile } from './usePublicProfile';
import { useProfileShowsBranding } from './useProfileShowsBranding';
import { usePublicOpenHouses } from './useOpenHouses';

const rpcCount = (name: string) => h.calls.filter((c) => c === `rpc:${name}`).length;

let client: QueryClient;
const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={client}>{children}</QueryClientProvider>
);

beforeEach(() => {
  h.calls = [];
  h.openHouses = [];
  h.showsBranding = false;
  h.gate = new Promise<void>((resolve) => {
    h.release = resolve;
  });
  // Production's gcTime, not the test default of 0: a prefetched answer has no
  // observer until the hook mounts, and 0 would collect it in between.
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
});

describe('public profile side reads (US-307)', () => {
  it('issues profile_shows_branding and list_public_open_houses in the same batch as the related reads', async () => {
    const { result } = renderHook(() => usePublicProfile('janedoe'), { wrapper });

    // The related reads are held open, so the profile query has not resolved
    // and nothing has rendered that could mount the branding/open-house hooks.
    await waitFor(() => expect(h.calls).toContain('listings'));
    await waitFor(() => expect(rpcCount('profile_shows_branding')).toBe(1));
    expect(rpcCount('list_public_open_houses')).toBe(1);
    expect(result.current.isPending).toBe(true);

    // Both come after the profile row (they need its id) and alongside the
    // six related reads, not after them.
    expect(h.calls[0]).toBe('profiles');

    h.release?.();
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it('the hooks find the answers already cached and do not call the RPCs again on mount', async () => {
    h.openHouses = [{ id: 'oh-1' }];
    h.showsBranding = true;
    h.release = null;
    h.gate = Promise.resolve();

    const profile = renderHook(() => usePublicProfile('janedoe'), { wrapper });
    await waitFor(() => expect(profile.result.current.isSuccess).toBe(true));
    await waitFor(() => expect(rpcCount('list_public_open_houses')).toBe(1));

    const branding = renderHook(() => useProfileShowsBranding('agent-1'), { wrapper });
    const openHouses = renderHook(() => usePublicOpenHouses('agent-1'), { wrapper });

    await waitFor(() => expect(branding.result.current).toBe(true));
    await waitFor(() => expect(openHouses.result.current.data).toEqual([{ id: 'oh-1' }]));
    expect(rpcCount('profile_shows_branding')).toBe(1);
    expect(rpcCount('list_public_open_houses')).toBe(1);
  });

  it('a hook that mounts while the prefetch is in flight joins it rather than issuing another', async () => {
    renderHook(() => usePublicProfile('janedoe'), { wrapper });
    await waitFor(() => expect(rpcCount('profile_shows_branding')).toBe(1));

    renderHook(() => useProfileShowsBranding('agent-1'), { wrapper });
    renderHook(() => usePublicOpenHouses('agent-1'), { wrapper });

    h.release?.();
    await waitFor(() => expect(h.calls).toContain('custom_pages'));
    expect(rpcCount('profile_shows_branding')).toBe(1);
    expect(rpcCount('list_public_open_houses')).toBe(1);
  });
});
