/**
 * US-497 (US-489): the lead's owner sees who holds a lead and can hand it to an
 * accepted teammate or clear it; anyone else sees it read-only.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, screen, waitFor } from '@/test/test-utils';

const { roster, auth, updates, updateResult, toast } = vi.hoisted(() => ({
  roster: {
    value: {
      teamId: 't1' as string | null,
      assignees: [{ userId: 'u2', label: 'jo@acme.test' }],
      isLoading: false,
      error: null as Error | null,
      refetch: vi.fn(),
    },
  },
  auth: { userId: 'owner-1' },
  updates: [] as { patch: unknown; filters: [string, unknown][] }[],
  updateResult: {
    value: { data: { id: 'l1' }, error: null } as { data: unknown; error: unknown },
  },
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('@/hooks/useLeadAssignees', () => ({ useLeadAssignees: () => roster.value }));
vi.mock('@/stores/useAuthStore', () => ({
  useAuthStore: (sel: (s: { user: { id: string } }) => unknown) =>
    sel({ user: { id: auth.userId } }),
}));
vi.mock('sonner', () => ({ toast }));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: () => ({
      update: (patch: unknown) => {
        const call = { patch, filters: [] as [string, unknown][] };
        updates.push(call);
        const chain = {
          eq: (col: string, val: unknown) => {
            call.filters.push([col, val]);
            return chain;
          },
          select: () => chain,
          single: async () => updateResult.value,
        };
        return chain;
      },
    }),
  },
}));

import { LeadAssigneeControl } from './LeadAssigneeControl';

const LEAD = {
  id: 'l1',
  name: 'Pat Buyer',
  user_id: 'owner-1',
  assigned_to: null as string | null,
};

const select = () => screen.getByLabelText('Assigned to') as HTMLSelectElement;

beforeEach(() => {
  updates.length = 0;
  auth.userId = 'owner-1';
  updateResult.value = { data: { id: 'l1' }, error: null };
  roster.value = {
    teamId: 't1',
    assignees: [{ userId: 'u2', label: 'jo@acme.test' }],
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  };
  toast.success.mockReset();
  toast.error.mockReset();
});

describe('LeadAssigneeControl', () => {
  it('shows Unassigned and offers Me and each accepted teammate', () => {
    renderWithProviders(<LeadAssigneeControl lead={LEAD} />);
    expect(select().value).toBe('');
    expect(Array.from(select().options).map((o) => o.textContent)).toEqual([
      'Unassigned',
      'Me',
      'jo@acme.test',
    ]);
  });

  it("assigns to a teammate, scoped to the owner's own lead, and reports it", async () => {
    const onAssigned = vi.fn();
    renderWithProviders(<LeadAssigneeControl lead={LEAD} onAssigned={onAssigned} />);
    await userEvent.selectOptions(select(), 'u2');

    await waitFor(() => expect(onAssigned).toHaveBeenCalled());
    expect(updates[0].patch).toEqual({ assigned_to: 'u2' });
    expect(updates[0].filters).toEqual([
      ['id', 'l1'],
      ['user_id', 'owner-1'],
    ]);
    expect(toast.success).toHaveBeenCalledWith('Pat Buyer is assigned to jo@acme.test');
    expect(select().value).toBe('u2');
  });

  it('clears the assignment with null', async () => {
    renderWithProviders(<LeadAssigneeControl lead={{ ...LEAD, assigned_to: 'u2' }} />);
    await userEvent.selectOptions(select(), '');
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Pat Buyer is unassigned'));
    expect(updates[0].patch).toEqual({ assigned_to: null });
  });

  it('keeps the real assignee when the server refuses, and says why', async () => {
    updateResult.value = {
      data: null,
      error: { code: '23514', details: 'lead_assignee_not_teammate', message: 'x' },
    };
    renderWithProviders(<LeadAssigneeControl lead={LEAD} />);
    await userEvent.selectOptions(select(), 'u2');

    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    expect(toast.error.mock.calls[0][0]).toMatch(/no longer an accepted member/);
    expect(roster.value.refetch).toHaveBeenCalled();
    expect(select().value).toBe('');
    expect(toast.success).not.toHaveBeenCalled();
  });

  it('reports any other failure without naming a cause', async () => {
    updateResult.value = { data: null, error: { code: 'PGRST116', message: '0 rows' } };
    renderWithProviders(<LeadAssigneeControl lead={LEAD} />);
    await userEvent.selectOptions(select(), 'u2');
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        'Couldn’t change who holds Pat Buyer. Please try again.'
      )
    );
    expect(select().value).toBe('');
  });

  it('shows an assignee who left the team as a disabled choice', () => {
    renderWithProviders(<LeadAssigneeControl lead={{ ...LEAD, assigned_to: 'gone' }} />);
    expect(select().value).toBe('gone');
    const stale = Array.from(select().options).find((o) => o.value === 'gone')!;
    expect(stale.textContent).toBe('Someone not on your team');
    expect(stale.disabled).toBe(true);
  });

  it('says so when nobody has accepted an invitation yet', () => {
    roster.value = { ...roster.value, assignees: [] };
    renderWithProviders(<LeadAssigneeControl lead={LEAD} />);
    expect(screen.getByText(/no teammate to assign to/)).toBeInTheDocument();
  });

  it('renders nothing for a solo agent', () => {
    roster.value = { ...roster.value, teamId: null, assignees: [] };
    const { container } = renderWithProviders(<LeadAssigneeControl lead={LEAD} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('offers a retry when the team fails to load', async () => {
    roster.value = { ...roster.value, error: new Error('down') };
    renderWithProviders(<LeadAssigneeControl lead={LEAD} />);
    expect(screen.getByRole('alert')).toHaveTextContent(/Couldn’t load your team/);
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(roster.value.refetch).toHaveBeenCalled();
  });

  it('shows the assignee read-only, with no control, to a teammate', () => {
    auth.userId = 'u2';
    renderWithProviders(<LeadAssigneeControl lead={{ ...LEAD, assigned_to: 'u2' }} />);
    expect(screen.getByText('Assigned to you')).toBeInTheDocument();
    expect(screen.queryByLabelText('Assigned to')).not.toBeInTheDocument();
  });
});
