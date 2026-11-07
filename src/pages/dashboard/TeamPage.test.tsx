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

type Queue = 'teams' | 'team_members' | 'membership';

const { invoke, toast, results, auth, filters } = vi.hoisted(() => ({
  invoke: vi.fn(),
  toast: vi.fn(),
  // teams: owned-team and joined-team lookups (maybeSingle on teams).
  // team_members: the roster list. membership: the caller's own accepted row.
  results: {
    teams: [] as Result[],
    team_members: [] as Result[],
    membership: [] as Result[],
  },
  auth: { userId: 'owner-1' },
  filters: [] as string[],
}));

function next(queue: Queue): Result {
  const q = results[queue];
  return q.length > 1 ? q.shift()! : q[0];
}

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
        limit: () => chain,
        // A single-row read on team_members is the caller's own membership.
        maybeSingle: async () => next(table === 'teams' ? 'teams' : 'membership'),
        then: (resolve: (r: Result) => unknown, reject: (e: unknown) => unknown) =>
          Promise.resolve(next('team_members')).then(resolve, reject),
      };
      return chain;
    },
  },
}));
vi.mock('@/stores/useAuthStore', () => ({
  useAuthStore: () => ({ user: { id: auth.userId } }),
}));
vi.mock('@/lib/edgeFunctions', () => ({ edgeFunctions: { invoke } }));
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast }) }));
vi.mock('@/components/settings/LeadRoutingRules', () => ({ LeadRoutingRules: () => null }));

import TeamPage, { canManageTeam } from './TeamPage';

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
    results.membership = [{ data: null, error: null }];
    auth.userId = 'owner-1';
    filters.length = 0;
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

  it('still offers to create a team when the user owns none and belongs to none', async () => {
    results.teams = [{ data: null, error: null }];
    renderWithProviders(<TeamPage />);
    expect(await screen.findByText(/create your team/i)).toBeInTheDocument();
    // The membership lookup asked only for this user's accepted rows.
    expect(filters).toContain('team_members:eq,user_id,owner-1');
    expect(filters).toContain('team_members:not,accepted_at,is,null');
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
  // US-394: there was no control for the teams updateRole action.
  it('changes a member to admin through updateRole and says so', async () => {
    invoke.mockResolvedValue({ data: { updated: true }, error: null });
    renderWithProviders(<TeamPage />);

    expect(screen.queryByRole('combobox', { name: 'Role for owner@acme.test' })).toBeNull();
    const select = await screen.findByRole('combobox', { name: 'Role for jo@acme.test' });
    expect(select).toHaveValue('member');

    await userEvent.selectOptions(select, 'admin');
    await waitFor(() =>
      expect(invoke).toHaveBeenCalledWith('teams', {
        body: { action: 'updateRole', teamId: 't1', memberId: 'm1', role: 'admin' },
      })
    );
    await waitFor(() =>
      expect(toast).toHaveBeenCalledWith({ title: 'jo@acme.test is now an admin' })
    );
  });

  it('reports a failed role change and leaves the shown role as the server has it', async () => {
    invoke.mockResolvedValue({ data: null, error: { message: 'Forbidden' } });
    renderWithProviders(<TeamPage />);

    const select = await screen.findByRole('combobox', { name: 'Role for jo@acme.test' });
    await userEvent.selectOptions(select, 'admin');
    await waitFor(() =>
      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Couldn’t change jo@acme.test’s role',
          description: 'Forbidden',
          variant: 'destructive',
        })
      )
    );
    expect(select).toHaveValue('member');
  });

  it('sends the chosen role with an invite', async () => {
    invoke.mockResolvedValue({ data: { data: { emailed: true } }, error: null });
    renderWithProviders(<TeamPage />);

    await userEvent.type(
      await screen.findByRole('textbox', { name: 'Email address to invite' }),
      'new@acme.test'
    );
    await userEvent.selectOptions(
      screen.getByRole('combobox', { name: 'Role for the new member' }),
      'admin'
    );
    await userEvent.click(screen.getByRole('button', { name: /invite$/i }));
    await waitFor(() =>
      expect(invoke).toHaveBeenCalledWith('teams', {
        body: { action: 'invite', teamId: 't1', email: 'new@acme.test', role: 'admin' },
      })
    );
    expect(screen.getByRole('combobox', { name: 'Role for the new member' })).toHaveValue('member');
  });

  // US-411 (US-338): an accepted member was offered "Create your team",
  // which would have made them the owner of a second team.
  describe('for a user who joined someone else’s team', () => {
    const ME_MEMBER = { ...AGENT, user_id: 'me', email: 'me@acme.test', id: 'm2' };

    beforeEach(() => {
      auth.userId = 'me';
      results.teams = [
        { data: null, error: null }, // owns no team
        { data: TEAM, error: null }, // the joined team
      ];
    });

    it('shows a member the team and roster read-only, with no create prompt', async () => {
      results.membership = [{ data: { team_id: 't1', role: 'member' }, error: null }];
      results.team_members = [{ data: [OWNER, AGENT, ME_MEMBER], error: null }];
      renderWithProviders(<TeamPage />);

      expect(await screen.findByRole('heading', { name: 'Acme Realty' })).toBeInTheDocument();
      expect(await screen.findByText('jo@acme.test')).toBeInTheDocument();
      expect(screen.getByText('owner@acme.test')).toBeInTheDocument();
      expect(screen.getByText(/you’re a member of this team/i)).toBeInTheDocument();
      expect(screen.queryByText(/create your team/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/invite a member/i)).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /^remove /i })).toBeNull();
      expect(screen.queryByRole('combobox')).toBeNull();
      expect(filters).toContain('teams:eq,id,t1');
    });

    it('gives an admin the invite, role and remove controls, but not on their own row', async () => {
      const ME_ADMIN = { ...ME_MEMBER, role: 'admin' };
      results.membership = [{ data: { team_id: 't1', role: 'admin' }, error: null }];
      results.team_members = [{ data: [OWNER, AGENT, ME_ADMIN], error: null }];
      invoke.mockResolvedValue({ data: { removed: true }, error: null });
      renderWithProviders(<TeamPage />);

      expect(await screen.findByText(/invite a member/i)).toBeInTheDocument();
      expect(screen.queryByText(/you’re a member of this team/i)).not.toBeInTheDocument();
      expect(
        await screen.findByRole('combobox', { name: 'Role for jo@acme.test' })
      ).toBeInTheDocument();
      expect(screen.queryByRole('combobox', { name: 'Role for me@acme.test' })).toBeNull();
      expect(screen.queryByRole('button', { name: 'Remove me@acme.test' })).toBeNull();
      expect(screen.queryByRole('button', { name: 'Remove owner@acme.test' })).toBeNull();

      await userEvent.click(screen.getByRole('button', { name: 'Remove jo@acme.test' }));
      await userEvent.click(await screen.findByRole('button', { name: 'Remove' }));
      await waitFor(() =>
        expect(invoke).toHaveBeenCalledWith('teams', {
          body: { action: 'remove', teamId: 't1', memberId: 'm1' },
        })
      );
    });

    it('shows a retryable error, not the create prompt, when the membership lookup fails', async () => {
      results.membership = [
        { data: null, error: { message: 'network down' } },
        { data: { team_id: 't1', role: 'member' }, error: null },
      ];
      renderWithProviders(<TeamPage />);

      expect(await screen.findByText(/couldn’t load your team$/i)).toBeInTheDocument();
      expect(screen.queryByText(/create your team/i)).not.toBeInTheDocument();
    });

    it('treats a membership whose team cannot be read as an error, not as no team', async () => {
      results.teams = [{ data: null, error: null }];
      results.membership = [{ data: { team_id: 't1', role: 'member' }, error: null }];
      renderWithProviders(<TeamPage />);

      expect(await screen.findByText(/couldn’t load your team$/i)).toBeInTheDocument();
      expect(screen.queryByText(/create your team/i)).not.toBeInTheDocument();
    });
  });

  it('canManageTeam matches is_team_admin: owner and admin, not member', () => {
    expect(canManageTeam('owner')).toBe(true);
    expect(canManageTeam('admin')).toBe(true);
    expect(canManageTeam('member')).toBe(false);
  });
});
