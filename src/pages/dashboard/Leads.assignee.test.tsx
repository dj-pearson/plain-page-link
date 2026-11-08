/**
 * US-515: a team owner can filter the Leads list by who holds each lead
 * (Unassigned, or one teammate), the choice is kept in the URL, and the CSV
 * export follows it. Solo agents do not see the filter.
 */
import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import { renderWithProviders, screen, userEvent, waitFor } from '@/test/test-utils';
import { mockLeadRow } from '@/test/fixtures/lead';

const { fromMock, rpcMock } = vi.hoisted(() => ({ fromMock: vi.fn(), rpcMock: vi.fn() }));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: fromMock, rpc: rpcMock },
  supabaseConfig: {
    url: 'http://localhost:54321',
    anonKey: 'test-anon-key',
    functionsUrl: 'http://localhost:54321/functions/v1',
  },
}));

vi.mock('@/stores/useAuthStore', () => ({
  useAuthStore: <T,>(select: (s: { user: { id: string } }) => T) =>
    select({ user: { id: mockLeadRow.user_id } }),
}));

vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: vi.fn() }) }));

vi.mock('@/hooks/useSubscriptionLimits', () => ({
  useSubscriptionLimits: () => ({ subscription: { plan_name: 'pro' } }),
}));

const { exportToCSVMock } = vi.hoisted(() => ({ exportToCSVMock: vi.fn() }));
vi.mock('@/lib/exportUtils', () => ({ exportToCSV: exportToCSVMock }));

vi.mock('@/lib/pii', () => ({
  encryptPIIBatch: vi.fn(async (values: (string | null)[]) => values),
  decryptLeadContacts: vi.fn(
    async (ids: string[]) => new Map(ids.map((id) => [id, { id, email: null, phone: null }]))
  ),
}));

vi.mock('@/hooks/useMLLeadScoring', () => ({
  useMLLeadScoring: () => ({
    scoreLeadObject: () => ({ score: 50, priority: 'warm', factors: [], confidence: 0.5 }),
  }),
}));

import Leads from './Leads';

const TEAMMATE = '22222222-2222-4222-8222-222222222222';

// Radix Select uses pointer capture and scrollIntoView, which jsdom lacks.
beforeAll(() => {
  Element.prototype.hasPointerCapture = vi.fn(() => false);
  Element.prototype.setPointerCapture = vi.fn();
  Element.prototype.releasePointerCapture = vi.fn();
  Element.prototype.scrollIntoView = vi.fn();
});

/** Calls on the leads query, as [method, column, value]. */
const leadCalls: [string, string, unknown][] = [];

const builderFor = (table: string, opts: { ownsTeam: boolean; leadRows: unknown[] }) => {
  const b: Record<string, unknown> = {};
  const record =
    (method: string) =>
    (col: string, value: unknown): unknown => {
      if (table === 'leads') leadCalls.push([method, col, value]);
      return b;
    };
  b.eq = vi.fn(record('eq'));
  b.is = vi.fn(record('is'));
  b.in = vi.fn(record('in'));
  for (const m of ['select', 'not', 'order', 'limit', 'range', 'ilike', 'or', 'update']) {
    b[m] = vi.fn(() => b);
  }
  b.maybeSingle = vi.fn(async () => ({
    data: table === 'teams' && opts.ownsTeam ? { id: 'team-1' } : null,
    error: null,
  }));
  const rows =
    table === 'team_members'
      ? [{ user_id: TEAMMATE, email: 'sam@team.example' }]
      : table === 'leads'
        ? opts.leadRows
        : [];
  b.then = (resolve: (v: unknown) => unknown) =>
    Promise.resolve({ data: rows, error: null }).then(resolve);
  return b;
};

const setup = (opts: { ownsTeam: boolean; leadRows?: unknown[] }) => {
  fromMock.mockImplementation((table: string) =>
    builderFor(table, { ownsTeam: opts.ownsTeam, leadRows: opts.leadRows ?? [mockLeadRow] })
  );
};

describe('Leads assignee filter (US-515)', () => {
  beforeEach(() => {
    leadCalls.length = 0;
    window.history.replaceState(null, '', '/');
    fromMock.mockReset();
    rpcMock.mockReset();
    exportToCSVMock.mockReset();
    rpcMock.mockResolvedValue({ data: null, error: null });
  });

  it('lets a team owner filter to one teammate, and keeps it in the URL', async () => {
    setup({ ownsTeam: true });
    renderWithProviders(<Leads />);
    await screen.findByText(mockLeadRow.name);

    await userEvent.click(await screen.findByRole('combobox', { name: /filter by assignee/i }));
    await userEvent.click(await screen.findByRole('option', { name: 'sam@team.example' }));

    await waitFor(() => expect(leadCalls).toContainEqual(['eq', 'assigned_to', TEAMMATE]));
    expect(new URLSearchParams(window.location.search).get('assignee')).toBe(TEAMMATE);
  });

  it('reads Unassigned from a link and asks for assigned_to IS NULL', async () => {
    window.history.replaceState(null, '', '/?assignee=unassigned');
    setup({ ownsTeam: true });
    renderWithProviders(<Leads />);
    await screen.findByText(mockLeadRow.name);

    expect(leadCalls).toContainEqual(['is', 'assigned_to', null]);
    expect(await screen.findByRole('combobox', { name: /filter by assignee/i })).toHaveTextContent(
      'Unassigned'
    );
  });

  it('ignores a malformed assignee in the URL rather than showing nothing', async () => {
    window.history.replaceState(null, '', '/?assignee=not-a-uuid');
    setup({ ownsTeam: true });
    renderWithProviders(<Leads />);
    await screen.findByText(mockLeadRow.name);

    // The "Assigned to me" count asks for the viewer's own id; nothing else
    // may narrow assigned_to.
    expect(
      leadCalls.some(([, col, value]) => col === 'assigned_to' && value !== mockLeadRow.user_id)
    ).toBe(false);
  });

  it('exports only the filtered leads', async () => {
    window.history.replaceState(null, '', `/?assignee=${TEAMMATE}`);
    setup({ ownsTeam: true });
    renderWithProviders(<Leads />);
    await screen.findByText(mockLeadRow.name);
    leadCalls.length = 0;

    await userEvent.click(screen.getByRole('button', { name: /export/i }));

    await waitFor(() => expect(exportToCSVMock).toHaveBeenCalledTimes(1));
    expect(leadCalls).toContainEqual(['eq', 'assigned_to', TEAMMATE]);
  });

  it('does not show the filter to a solo agent', async () => {
    setup({ ownsTeam: false });
    renderWithProviders(<Leads />);
    await screen.findByText(mockLeadRow.name);

    expect(screen.queryByRole('combobox', { name: /filter by assignee/i })).toBeNull();
  });

  it('says the filters match nothing, and clears them, instead of "No leads yet"', async () => {
    window.history.replaceState(null, '', `/?assignee=${TEAMMATE}`);
    setup({ ownsTeam: true, leadRows: [] });
    renderWithProviders(<Leads />);

    expect(await screen.findByText('No leads match these filters')).toBeInTheDocument();
    expect(screen.queryByText('No leads yet')).toBeNull();

    await userEvent.click(screen.getByRole('button', { name: 'Clear filters' }));
    await waitFor(() => expect(window.location.search).toBe(''));
  });
});
