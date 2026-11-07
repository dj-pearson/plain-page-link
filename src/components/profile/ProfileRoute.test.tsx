import { describe, it, expect, vi, beforeEach } from 'vitest';
import { lazy } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

/**
 * US-267: the /:slug route starts the profile read before the lazy profile
 * chunk has arrived, and the page that then mounts reuses that read.
 */

const calls: { table: string; filters: [string, unknown][] }[] = [];

const ROWS: Record<string, unknown> = {
  profiles: { id: 'agent-1', username: 'janedoe', full_name: 'Jane Doe' },
  listings: [],
  testimonials: [],
  links: [],
  user_settings: null,
  custom_pages: null,
};

function builder(table: string) {
  const entry = { table, filters: [] as [string, unknown][] };
  calls.push(entry);
  const result = () => Promise.resolve({ data: ROWS[table] ?? null, error: null });
  const b: Record<string, unknown> = {};
  for (const m of ['select', 'neq', 'in', 'order', 'limit']) b[m] = () => b;
  b.eq = (col: string, val: unknown) => {
    entry.filters.push([col, val]);
    return b;
  };
  b.single = result;
  b.maybeSingle = result;
  b.then = (ok: (v: unknown) => unknown, ko?: (e: unknown) => unknown) => result().then(ok, ko);
  return b;
}

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (table: string) => builder(table),
    rpc: () => Promise.resolve({ data: null, error: null }),
  },
}));

import { ProfileRoute } from './ProfileRoute';
import { usePublicProfile } from '@/hooks/usePublicProfile';

function renderAt(path: string, page: React.ComponentType) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/:slug" element={<ProfileRoute page={page} />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
  return client;
}

/** A lazy chunk that never arrives: anything fetched happened without it. */
const neverLoads = () => lazy(() => new Promise<{ default: React.ComponentType }>(() => undefined));

const profileReads = () => calls.filter((c) => c.table === 'profiles');

describe('ProfileRoute', () => {
  beforeEach(() => {
    calls.length = 0;
  });

  it('reads the profile while the page chunk is still loading', async () => {
    const NeverLoads = neverLoads();
    const client = renderAt('/JaneDoe', NeverLoads);

    await waitFor(() => expect(profileReads()).toHaveLength(1));
    // Canonical username, the same key the page's own hook uses.
    expect(profileReads()[0].filters).toContainEqual(['username', 'janedoe']);
    // The related reads follow without waiting for the page either.
    await waitFor(() =>
      expect(calls.map((c) => c.table)).toEqual(
        expect.arrayContaining(['listings', 'testimonials', 'links', 'user_settings'])
      )
    );
    await waitFor(() => expect(client.getQueryData(['public-profile', 'janedoe'])).toBeDefined());
  });

  it('shows the profile skeleton, not a generic spinner, while the chunk loads', () => {
    const NeverLoads = neverLoads();
    const { container } = render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter initialEntries={['/janedoe']}>
          <Routes>
            <Route path="/:slug" element={<ProfileRoute page={NeverLoads} />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );
    expect(container.querySelector('.animate-pulse')).not.toBeNull();
    expect(screen.queryByText(/loading page/i)).toBeNull();
  });

  it('does not read the profile twice when the page mounts and asks for it', async () => {
    let release: ((m: { default: React.ComponentType }) => void) | undefined;
    function Page() {
      const { data } = usePublicProfile('janedoe');
      return <p>{data ? data.profile.full_name : 'pending'}</p>;
    }
    const SlowChunk = lazy(
      () => new Promise<{ default: React.ComponentType }>((resolve) => (release = resolve))
    );
    renderAt('/janedoe', SlowChunk);

    await waitFor(() => expect(profileReads()).toHaveLength(1));
    release?.({ default: Page });

    expect(await screen.findByText('Jane Doe')).toBeInTheDocument();
    expect(profileReads()).toHaveLength(1);
  });

  it('does nothing for an empty slug', async () => {
    const NeverLoads = neverLoads();
    renderAt('/%20', NeverLoads);
    await new Promise((r) => setTimeout(r, 20));
    expect(profileReads()).toHaveLength(0);
  });
});
