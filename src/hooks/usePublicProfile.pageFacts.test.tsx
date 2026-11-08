/**
 * US-316: on /:username the page builder's Stats and Testimonial blocks read
 * their figures from the public-profile payload that is already loaded,
 * instead of four requests of their own (profiles, two listing counts,
 * testimonials). The editor's preview and the owner's own view still fetch.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const h = vi.hoisted(() => ({
  calls: [] as string[],
  page: null as unknown,
  pageError: null as null | { code: string; message: string },
  user: null as null | { id: string },
}));

vi.mock('@/integrations/supabase/client', () => {
  const table = (name: string) => {
    const chain: Record<string, unknown> = {};
    for (const m of ['select', 'eq', 'in', 'or', 'order', 'limit']) chain[m] = () => chain;
    chain.single = async () => {
      h.calls.push(name);
      return {
        data: { id: 'agent-1', username: 'janedoe', is_published: true, years_experience: 4 },
        error: null,
      };
    };
    chain.maybeSingle = async () => {
      h.calls.push(name);
      if (name === 'custom_pages') {
        return { data: { id: 'cp-1', slug: 'home', title: 'Home', blocks: [] }, error: null };
      }
      return { data: null, error: null };
    };
    chain.then = (resolve: (v: unknown) => unknown) => {
      h.calls.push(name);
      if (name === 'listings') {
        return Promise.resolve(
          resolve({ data: [{ status: 'sold' }, { status: 'active' }], count: 0, error: null })
        );
      }
      return Promise.resolve(resolve({ data: [], count: 0, error: null }));
    };
    return chain;
  };
  return {
    supabase: {
      from: table,
      rpc: async (name: string) => {
        h.calls.push(`rpc:${name}`);
        if (name === 'get_public_profile_page') {
          return { data: h.pageError ? null : h.page, error: h.pageError };
        }
        return { data: null, error: null };
      },
    },
  };
});

vi.mock('@/stores/useAuthStore', async () => {
  const { create } = await import('zustand');
  const store = create(() => ({ user: null as null | { id: string } }));
  return { useAuthStore: store };
});

import { useAuthStore } from '@/stores/useAuthStore';
import { usePublicProfile } from './usePublicProfile';
import { useAgentPageFacts } from './useAgentPageFacts';
import { agentFactRowsFromPublicPage } from '@/lib/publicProfileSideQueries';

const PAGE = {
  profile: { id: 'agent-1', username: 'janedoe', is_published: true, years_experience: 12 },
  listings: [
    { id: 'l-1', status: 'sold' },
    { id: 'l-2', status: 'sold' },
    { id: 'l-3', status: 'active' },
    { id: 'l-4', status: 'pending' },
    { id: 'l-5', status: 'under_contract' },
  ],
  testimonials: [
    {
      id: 't-1',
      client_name: 'Ana',
      client_title: 'Buyer',
      client_photo: null,
      review: 'Found us the house.',
      rating: 5,
      date: null,
      created_at: '2026-01-01',
    },
    {
      id: 't-2',
      client_name: 'Ben',
      client_title: null,
      client_photo: 'b.jpg',
      review: 'Sold fast.',
      rating: 4,
      date: null,
      created_at: '2026-02-01',
    },
  ],
  links: [],
  settings: null,
  responseHours: null,
  customPage: { id: 'cp-1', slug: 'home', title: 'Home', blocks: [] },
  showsBranding: true,
  openHouses: [],
};

let client: QueryClient;
const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={client}>{children}</QueryClientProvider>
);

beforeEach(() => {
  h.calls = [];
  h.page = PAGE;
  h.pageError = null;
  (useAuthStore as unknown as { setState: (s: unknown) => void }).setState({ user: null });
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
});

describe('page-builder facts from the public profile payload (US-316)', () => {
  it('a visitor: the blocks read the payload and send no request of their own', async () => {
    const profile = renderHook(() => usePublicProfile('janedoe'), { wrapper });
    await waitFor(() => expect(profile.result.current.isSuccess).toBe(true));

    const facts = renderHook(() => useAgentPageFacts('agent-1'), { wrapper });
    await waitFor(() => expect(facts.result.current.data).toBeDefined());

    expect(facts.result.current.data!.facts).toEqual({
      soldListings: 2,
      activeListings: 1,
      yearsExperience: 12,
      reviewCount: 2,
      averageRating: 4.5,
    });
    expect(facts.result.current.data!.testimonials.map((t) => t.name)).toEqual(['Ana', 'Ben']);
    expect(h.calls).toEqual(['rpc:get_public_profile_page']);
  });

  it('seeds from the table-read fallback as well', async () => {
    h.pageError = { code: 'PGRST202', message: 'Could not find the function' };
    const profile = renderHook(() => usePublicProfile('janedoe'), { wrapper });
    await waitFor(() => expect(profile.result.current.isSuccess).toBe(true));
    const before = h.calls.length;

    const facts = renderHook(() => useAgentPageFacts('agent-1'), { wrapper });
    await waitFor(() => expect(facts.result.current.data).toBeDefined());

    expect(facts.result.current.data!.facts.soldListings).toBe(1);
    expect(facts.result.current.data!.facts.activeListings).toBe(1);
    expect(facts.result.current.data!.facts.yearsExperience).toBe(4);
    expect(h.calls.length).toBe(before);
  });

  it('no page-builder page: nothing is seeded', async () => {
    h.page = { ...PAGE, customPage: null };
    const profile = renderHook(() => usePublicProfile('janedoe'), { wrapper });
    await waitFor(() => expect(profile.result.current.isSuccess).toBe(true));
    expect(client.getQueryData(['agent-page-facts', 'agent-1'])).toBeUndefined();
  });

  it('the owner viewing their own page: not seeded (their view can include samples), so the blocks fetch', async () => {
    (useAuthStore as unknown as { setState: (s: unknown) => void }).setState({
      user: { id: 'agent-1' },
    });
    const profile = renderHook(() => usePublicProfile('janedoe'), { wrapper });
    await waitFor(() => expect(profile.result.current.isSuccess).toBe(true));
    expect(client.getQueryData(['agent-page-facts', 'agent-1'])).toBeUndefined();

    const facts = renderHook(() => useAgentPageFacts('agent-1'), { wrapper });
    await waitFor(() => expect(facts.result.current.isSuccess).toBe(true));
    expect(h.calls).toEqual(
      expect.arrayContaining(['profiles', 'listings', 'listings', 'testimonials'])
    );
  });

  it('the editor preview, with nothing seeded, fetches on its own', async () => {
    const facts = renderHook(() => useAgentPageFacts('agent-1'), { wrapper });
    await waitFor(() => expect(facts.result.current.isSuccess).toBe(true));
    expect(h.calls.sort()).toEqual(['listings', 'listings', 'profiles', 'testimonials']);
  });
});

describe('agentFactRowsFromPublicPage', () => {
  it('counts only active and sold, keeps years and testimonials, and declines for the owner', () => {
    const page = {
      profile: { id: 'agent-1', years_experience: null },
      listings: [{ status: 'active' }, { status: 'pending' }, { status: null }],
      testimonials: null,
    };
    expect(agentFactRowsFromPublicPage(page, null)).toEqual({
      yearsExperience: null,
      soldListings: 0,
      activeListings: 1,
      testimonials: [],
    });
    expect(agentFactRowsFromPublicPage(page, 'someone-else')).not.toBeNull();
    expect(agentFactRowsFromPublicPage(page, 'agent-1')).toBeNull();
  });
});
