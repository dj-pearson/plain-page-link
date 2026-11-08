/**
 * US-497: who the owner can hand a lead to — accepted members of the team
 * they own, never themselves twice, and nobody when they own no team.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

type Result = { data: unknown; error: unknown };

const { results, filters } = vi.hoisted(() => ({
  results: {
    teams: { data: { id: 't1' }, error: null } as Result,
    team_members: { data: [], error: null } as Result,
  },
  filters: [] as string[],
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (table: 'teams' | 'team_members') => {
      const record = (...args: unknown[]) => {
        filters.push(`${table}:${args.map(String).join(',')}`);
        return chain;
      };
      const chain = {
        select: () => chain,
        eq: (col: string, val: unknown) => record('eq', col, val),
        not: (col: string, op: string, val: unknown) => record('not', col, op, val),
        order: () => chain,
        maybeSingle: async () => results.teams,
        then: (resolve: (r: Result) => unknown, reject: (e: unknown) => unknown) =>
          Promise.resolve(results.team_members).then(resolve, reject),
      };
      return chain;
    },
  },
}));
vi.mock('@/stores/useAuthStore', () => ({
  useAuthStore: (sel: (s: { user: { id: string } }) => unknown) => sel({ user: { id: 'owner-1' } }),
}));

import { useLeadAssignees } from './useLeadAssignees';

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  filters.length = 0;
  results.teams = { data: { id: 't1' }, error: null };
  results.team_members = { data: [], error: null };
});

describe('useLeadAssignees', () => {
  it("lists accepted teammates of the owner's team, excluding the owner", async () => {
    results.team_members = {
      data: [
        { user_id: 'owner-1', email: 'me@acme.test' },
        { user_id: 'u2', email: 'jo@acme.test' },
        { user_id: 'u3', email: null },
      ],
      error: null,
    };
    const { result } = renderHook(() => useLeadAssignees(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.teamId).toBe('t1');
    expect(result.current.assignees).toEqual([
      { userId: 'u2', label: 'jo@acme.test' },
      { userId: 'u3', label: 'Teammate' },
    ]);
    expect(filters).toContain('teams:eq,owner_id,owner-1');
    expect(filters).toContain('team_members:eq,team_id,t1');
    expect(filters).toContain('team_members:not,accepted_at,is,null');
  });

  it('returns no team and nobody for an agent who owns no team', async () => {
    results.teams = { data: null, error: null };
    const { result } = renderHook(() => useLeadAssignees(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.teamId).toBeNull();
    expect(result.current.assignees).toEqual([]);
    expect(filters.some((f) => f.startsWith('team_members:'))).toBe(false);
  });

  it('surfaces a failed roster read as an error', async () => {
    results.team_members = { data: null, error: new Error('denied') };
    const { result } = renderHook(() => useLeadAssignees(), { wrapper });
    await waitFor(() => expect(result.current.error).toBeTruthy());
    expect(result.current.assignees).toEqual([]);
  });
});
