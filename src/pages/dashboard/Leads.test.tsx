/**
 * US-094: the page could not load at all.
 *
 * Leads.tsx ran its own query beside useLeads, selecting `email` and `phone` —
 * the plaintext columns US-086 dropped — behind an `as unknown as` cast that
 * hid the mismatch from tsc. PostgREST rejected the select and every agent got
 * the "Failed to load leads" card.
 *
 * These tests mount the page against a mocked client that returns rows in the
 * shape the database actually stores (ciphertext only, no plaintext columns).
 * A reader that goes back to reading `email` off the raw row renders nothing
 * for the contact details, so the regression cannot return silently.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithProviders, screen, userEvent, waitFor } from '@/test/test-utils';
import { mockLead, mockLeadRow } from '@/test/fixtures/lead';
import type { LeadRow } from '@/types/lead';

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
  useAuthStore: () => ({ user: { id: mockLeadRow.user_id } }),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock('@/hooks/useSubscriptionLimits', () => ({
  useSubscriptionLimits: () => ({ subscription: { plan_name: 'pro' } }),
}));

const { exportToCSVMock } = vi.hoisted(() => ({ exportToCSVMock: vi.fn() }));
vi.mock('@/lib/exportUtils', () => ({ exportToCSV: exportToCSVMock }));

vi.mock('@/hooks/useMLLeadScoring', () => ({
  useMLLeadScoring: () => ({
    scoreLeadObject: () => ({ score: 50, priority: 'warm', factors: [], confidence: 0.5 }),
  }),
}));

import Leads from './Leads';

/** A `leads` select that resolves to the given rows, and records the columns asked for. */
const eqCalls: [string, unknown][] = [];

const stubLeadsQuery = (
  rows: LeadRow[],
  selected: string[],
  updates: Record<string, unknown>[] = []
) => {
  const builder: Record<string, unknown> = {};
  builder.select = vi.fn((cols: string) => {
    selected.push(cols);
    return builder;
  });
  builder.update = vi.fn((values: Record<string, unknown>) => {
    updates.push(values);
    return builder;
  });
  builder.eq = vi.fn((col: string, value: unknown) => {
    eqCalls.push([col, value]);
    return builder;
  });
  // `range` is what useLeads pages with since US-104; without it the chain
  // returns undefined and the page renders its error card.
  for (const m of ['order', 'in', 'is', 'limit', 'range', 'ilike']) {
    builder[m] = vi.fn(() => builder);
  }
  builder.then = (resolve: (v: unknown) => unknown) =>
    Promise.resolve({ data: rows, error: null }).then(resolve);
  return builder;
};

describe('Leads page', () => {
  let selected: string[];
  let updates: Record<string, unknown>[];

  beforeEach(() => {
    selected = [];
    updates = [];
    eqCalls.length = 0;
    fromMock.mockReset();
    rpcMock.mockReset();
    exportToCSVMock.mockReset();
    rpcMock.mockResolvedValue({ data: 'activity-1', error: null });
    fromMock.mockImplementation(() => stubLeadsQuery([mockLeadRow], selected, updates));
  });

  it('renders the agent’s leads with decrypted contact details', async () => {
    renderWithProviders(<Leads />);

    expect(await screen.findByText(mockLead.name)).toBeInTheDocument();
    expect(screen.getByText(mockLead.email!)).toBeInTheDocument();
    expect(screen.getByText(mockLead.phone!)).toBeInTheDocument();
  });

  it('links the contact details with mailto: and tel: on the decrypted values', async () => {
    renderWithProviders(<Leads />);

    const email = await screen.findByRole('link', { name: mockLead.email! });
    expect(email).toHaveAttribute('href', `mailto:${mockLead.email}`);
    expect(screen.getByRole('link', { name: mockLead.phone! })).toHaveAttribute(
      'href',
      `tel:${mockLead.phone}`
    );
  });

  it('never asks PostgREST for the dropped plaintext columns', async () => {
    renderWithProviders(<Leads />);
    await screen.findByText(mockLead.name);

    expect(selected.length).toBeGreaterThan(0);
    for (const cols of selected) {
      // '*' is fine — the columns are gone from the table, so it cannot
      // return them. Naming them explicitly is what made the select fail.
      expect(cols).not.toMatch(/\bemail\b/);
      expect(cols).not.toMatch(/\bphone\b/);
    }
  });

  it('shows the error card when the query fails', async () => {
    fromMock.mockImplementation(() => {
      const builder: Record<string, unknown> = {};
      builder.select = vi.fn(() => builder);
      for (const m of ['eq', 'order']) builder[m] = vi.fn(() => builder);
      builder.then = (resolve: (v: unknown) => unknown) =>
        Promise.resolve({
          data: null,
          error: { message: 'column leads.email does not exist' },
        }).then(resolve);
      return builder;
    });

    renderWithProviders(<Leads />);
    await waitFor(() => expect(screen.getByText(/failed to load leads/i)).toBeInTheDocument());
  });

  // US-101: the card's contact links were plain anchors, so an agent who
  // phoned a lead from the list still showed as never having responded.
  it('records the response when the agent taps a phone number on the card', async () => {
    renderWithProviders(<Leads />);
    await screen.findByText(mockLead.name);

    await userEvent.click(screen.getByRole('link', { name: mockLead.phone! }));

    await waitFor(() => expect(updates.length).toBeGreaterThan(0));
    expect(updates[0]).toMatchObject({ status: 'contacted' });
    expect(rpcMock).toHaveBeenCalledWith(
      'log_lead_call',
      expect.objectContaining({ _outcome: 'initiated' })
    );
  });

  it('does not open the detail modal when a contact link is tapped', async () => {
    renderWithProviders(<Leads />);
    await screen.findByText(mockLead.name);

    await userEvent.click(screen.getByRole('link', { name: mockLead.phone! }));

    // The modal renders the lead's message in a Message section; the card
    // shows it clamped. A dialog role appearing means the click bubbled.
    await waitFor(() => expect(updates.length).toBeGreaterThan(0));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  // US-104: the page hand-rolled a CSV that quoted only `message`, so a lead
  // named "Smith, John" split into two columns in Excel and shifted every
  // field after it. It also exported every lead rather than the filtered set.
  describe('CSV export', () => {
    it('hands every cell to exportToCSV, which quotes what needs quoting', async () => {
      renderWithProviders(<Leads />);
      await screen.findByText(mockLead.name);

      await userEvent.click(screen.getByRole('button', { name: /export/i }));

      expect(exportToCSVMock).toHaveBeenCalledTimes(1);
      const payload = exportToCSVMock.mock.calls[0][0];
      expect(payload.headers).toEqual(
        expect.arrayContaining(['Phone', 'Source', 'First Responded At'])
      );
      expect(payload.rows).toHaveLength(1);
      // The row is passed as an array of raw values — escaping is exportToCSV's
      // job, and it quotes any cell containing a comma, quote or newline.
      expect(payload.rows[0]).toEqual(expect.arrayContaining([mockLead.name, mockLead.email]));
    });
  });

  // US-104: status was not a filter at all, and nothing about the view was
  // reflected in the URL, so a filtered list could not be linked to.
  describe('filters', () => {
    it('pushes the status filter into the query rather than filtering in JS', async () => {
      renderWithProviders(<Leads />);
      await screen.findByText(mockLead.name);
      fromMock.mockClear();
      eqCalls.length = 0;

      await userEvent.click(screen.getByRole('button', { name: /contacted/i }));

      await waitFor(() => expect(eqCalls).toContainEqual(['status', 'contacted']));
    });
  });
});
