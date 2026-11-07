/**
 * US-329 (slice of US-286): the public profile in one round trip.
 *
 * Measured as requests before the page can render, for an anonymous visit to
 * /:username:
 *   before — profiles, then listings/testimonials/links/user_settings/
 *            custom_pages + public_agent_response_hours + profile_shows_branding
 *            + list_public_open_houses: 9 requests over 2 serial round trips.
 *   after  — get_public_profile_page: 1 request, 1 round trip.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const h = vi.hoisted(() => ({
  /** Every request, in order: a table name, or `rpc:<name>`. */
  calls: [] as string[],
  rpcArgs: [] as unknown[],
  page: null as unknown,
  pageError: null as null | { code: string; message: string },
}));

vi.mock('@/integrations/supabase/client', () => {
  const table = (name: string) => {
    const chain: Record<string, unknown> = {};
    for (const m of ['select', 'eq', 'in', 'or', 'order', 'limit']) chain[m] = () => chain;
    chain.single = async () => {
      h.calls.push(name);
      return { data: { id: 'agent-1', username: 'janedoe', is_published: true }, error: null };
    };
    chain.maybeSingle = async () => {
      h.calls.push(name);
      return { data: null, error: null };
    };
    chain.then = (resolve: (v: unknown) => unknown) => {
      h.calls.push(name);
      return Promise.resolve(resolve({ data: [], error: null }));
    };
    return chain;
  };
  return {
    supabase: {
      from: table,
      rpc: async (name: string, args: unknown) => {
        h.calls.push(`rpc:${name}`);
        if (name === 'get_public_profile_page') {
          h.rpcArgs.push(args);
          return { data: h.pageError ? null : h.page, error: h.pageError };
        }
        return { data: null, error: null };
      },
    },
  };
});

vi.mock('@/lib/edgeFunctions', () => ({ callEdgeFunction: vi.fn() }));
vi.mock('@/lib/pii', () => ({ decryptLeadContacts: vi.fn() }));
vi.mock('@/stores/useAuthStore', async () => {
  const { create } = await import('zustand');
  return { useAuthStore: create(() => ({ user: null })) };
});

import { usePublicProfile } from './usePublicProfile';
import { useProfileShowsBranding } from './useProfileShowsBranding';
import { usePublicOpenHouses } from './useOpenHouses';

const PAGE = {
  profile: {
    id: 'agent-1',
    username: 'janedoe',
    full_name: 'Jane Doe',
    is_published: true,
    specialties: ['Luxury', 7],
    certifications: null,
    service_cities: ['Austin'],
    service_zip_codes: 'not-a-list',
  },
  listings: [{ id: 'l-1', address: '1 Main St', photos: ['a.jpg', null], bedrooms: 3 }],
  testimonials: [{ id: 't-1', review: 'Great', date: null, created_at: '2026-01-01' }],
  links: [{ id: 'k-1', title: 'Site', url: 'https://x.test', position: 0, is_active: true }],
  settings: null,
  responseHours: 1.5,
  customPage: null,
  showsBranding: false,
  openHouses: [{ id: 'oh-1' }],
};

let client: QueryClient;
const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={client}>{children}</QueryClientProvider>
);

beforeEach(() => {
  h.calls = [];
  h.rpcArgs = [];
  h.page = PAGE;
  h.pageError = null;
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
});

describe('usePublicProfile via get_public_profile_page (US-329)', () => {
  it('serves the whole page from one request, with the canonical username', async () => {
    const { result } = renderHook(() => usePublicProfile('  JaneDoe '), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(h.calls).toEqual(['rpc:get_public_profile_page']);
    expect(h.rpcArgs).toEqual([{ _username: 'janedoe' }]);

    const data = result.current.data!;
    // Same shaping as the table path: jsonb lists narrowed, defaults filled.
    expect(data.profile.specialties).toEqual(['Luxury']);
    expect(data.profile.certifications).toEqual([]);
    expect(data.profile.service_zip_codes).toEqual([]);
    expect(data.listings[0].photos).toEqual(['a.jpg']);
    expect(data.testimonials[0].date).toBe('2026-01-01');
    expect(data.links).toHaveLength(1);
    expect(data.responseHours).toBe(1.5);
    expect(data.customPage).toBeNull();
    expect(data.settings.show_listings).toBe(true);
  });

  it('hands branding and open houses to their hooks, which then send nothing', async () => {
    const profile = renderHook(() => usePublicProfile('janedoe'), { wrapper });
    await waitFor(() => expect(profile.result.current.isSuccess).toBe(true));

    const branding = renderHook(() => useProfileShowsBranding('agent-1'), { wrapper });
    const openHouses = renderHook(() => usePublicOpenHouses('agent-1'), { wrapper });

    await waitFor(() => expect(openHouses.result.current.data).toEqual([{ id: 'oh-1' }]));
    expect(branding.result.current).toBe(false);
    expect(h.calls).toEqual(['rpc:get_public_profile_page']);
  });

  it('does not seed open houses when the agent hides listings (the section never mounts)', async () => {
    h.page = { ...PAGE, settings: { show_listings: false }, openHouses: null };
    const { result } = renderHook(() => usePublicProfile('janedoe'), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(client.getQueryData(['public-open-houses', 'agent-1'])).toBeUndefined();
    expect(client.getQueryData(['profile-shows-branding', 'agent-1'])).toBe(false);
    expect(h.calls).toEqual(['rpc:get_public_profile_page']);
  });

  it('a null answer is a 404 the page recognises, with no fallback reads', async () => {
    h.page = null;
    const { result } = renderHook(() => usePublicProfile('nobody'), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));

    expect((result.current.error as { code?: string }).code).toBe('PGRST116');
    expect(result.current.error?.message).toMatch(/Profile not found/);
    expect(h.calls).toEqual(['rpc:get_public_profile_page']);
  });

  it('falls back to the table reads on a database without the function', async () => {
    h.pageError = { code: 'PGRST202', message: 'Could not find the function' };
    const { result } = renderHook(() => usePublicProfile('janedoe'), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(h.calls[0]).toBe('rpc:get_public_profile_page');
    expect(h.calls).toEqual(
      expect.arrayContaining([
        'profiles',
        'listings',
        'testimonials',
        'links',
        'user_settings',
        'custom_pages',
        'rpc:public_agent_response_hours',
      ])
    );
    expect(result.current.data?.profile.id).toBe('agent-1');
  });

  it('any other error is surfaced, not masked by a second attempt', async () => {
    h.pageError = { code: '57014', message: 'canceling statement due to statement timeout' };
    const { result } = renderHook(() => usePublicProfile('janedoe'), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(h.calls).toEqual(['rpc:get_public_profile_page']);
  });
});
