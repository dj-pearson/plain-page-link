/**
 * US-328 (slice of US-284): a failed team load used to show "Create your team"
 * to an owner who already had one, a failed member load read as an empty
 * team, and members were removed by one click on an unnamed icon button with
 * no confirmation and no failure report.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, screen, waitFor } from '@/test/test-utils';

type Result = { data: unknown; error: { message: string } | null };

const { invoke, toast, results } = vi.hoisted(() => ({
  invoke: vi.fn(),
  toast: vi.fn(),
  results: {
    teams: [] as Result[],
    team_members: [] as Result[],
  },
}));

function next(table: 'teams' | 'team_members'): Result {
  const queue = results[table];
  return queue.length > 1 ? queue.shift()! : queue[0];
}

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (table: 'teams' | 'team_members') => {
      const chain = {
        select: () => chain,
        eq: () => chain,
        maybeSingle: async () => next(table),
        order: async () => next(table),
      };
      return chain;
    },
  },
}));
vi.mock('@/stores/useAuthStore', () => ({
  useAuthStore: () => ({ user: { id: 'owner-1' } }),
}));
vi.mock('@/lib/edgeFunctions', () => ({ edgeFunctions: { invoke } }));
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast }) }));
vi.mock('@/components/settings/LeadRoutingRules', () => ({ LeadRoutingRules: () => null }));

import TeamPage from './TeamPage';

const TEAM = { id: 't1', name: 'Acme Realty', owner_id: 'owner-1', max_seats: 5 };
const OWNER = {
  id: 'm0',
  user_id: 'owner-1',
  email: 'owner@acme.test',
  role: 'owner',
  accepted_at: '2026-10-01T00:00:00Z',
};
const AGENT = {
  id: 'm1',
  user_id: 'u2',
  email: 'jo@acme.test',
  role: 'member',
  accepted_at: '2026-10-02T00:00:00Z',
};

describe('TeamPage', () => {
  beforeEach(() => {
    invoke.mockReset();
    toast.mockReset();
    results.teams = [{ data: TEAM, error: null }];
    results.team_members = [{ data: [OWNER, AGENT], error: null }];
  });

  it('shows a retryable error, not the create prompt, when the team fails to load', async () => {
    results.teams = [
      { data: null, error: { message: 'network down' } },
      { data: TEAM, error: null },
    ];
    renderWithProviders(<TeamPage />);

    expect(await screen.findByText(/couldn’t load your team$/i)).toBeInTheDocument();
    expect(screen.queryByText(/create your team/i)).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /try again/i }));
    expect(await screen.findByRole('heading', { name: 'Acme Realty' })).toBeInTheDocument();
  });

  it('still offers to create a team when the owner genuinely has none', async () => {
    results.teams = [{ data: null, error: null }];
    renderWithProviders(<TeamPage />);
    expect(await screen.findByText(/create your team/i)).toBeInTheDocument();
  });

  it('shows a retryable error when members fail to load, without a seat count', async () => {
    results.team_members = [
      { data: null, error: { message: 'network down' } },
      { data: [OWNER, AGENT], error: null },
    ];
    renderWithProviders(<TeamPage />);

    expect(await screen.findByText(/couldn’t load your team members/i)).toBeInTheDocument();
    expect(screen.queryByText(/seats used/i)).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /try again/i }));
    expect(await screen.findByText('jo@acme.test')).toBeInTheDocument();
    expect(screen.getByText(/2\/5 seats used/)).toBeInTheDocument();
  });

  it('asks for confirmation, naming the member, before removing them', async () => {
    invoke.mockResolvedValue({ data: { removed: true }, error: null });
    renderWithProviders(<TeamPage />);

    expect(screen.queryByRole('button', { name: 'Remove owner@acme.test' })).toBeNull();
    await userEvent.click(await screen.findByRole('button', { name: 'Remove jo@acme.test' }));
    expect(invoke).not.toHaveBeenCalled();
    expect(await screen.findByText('Remove jo@acme.test?')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(invoke).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: 'Remove jo@acme.test' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Remove' }));
    await waitFor(() =>
      expect(invoke).toHaveBeenCalledWith('teams', {
        body: { action: 'remove', teamId: 't1', memberId: 'm1' },
      })
    );
    await waitFor(() =>
      expect(toast).toHaveBeenCalledWith({ title: 'jo@acme.test was removed from the team' })
    );
  });

  it('reports a failed removal', async () => {
    invoke.mockResolvedValue({ data: null, error: { message: 'Forbidden' } });
    renderWithProviders(<TeamPage />);

    await userEvent.click(await screen.findByRole('button', { name: 'Remove jo@acme.test' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Remove' }));
    await waitFor(() =>
      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Couldn’t remove jo@acme.test',
          description: 'Forbidden',
          variant: 'destructive',
        })
      )
    );
  });
});
