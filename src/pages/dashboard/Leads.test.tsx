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
import { renderWithProviders, screen, waitFor } from '@/test/test-utils';
import { mockLead, mockLeadRow } from '@/test/fixtures/lead';
import type { LeadRow } from '@/types/lead';

const { fromMock } = vi.hoisted(() => ({ fromMock: vi.fn() }));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: fromMock },
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

vi.mock('@/hooks/useMLLeadScoring', () => ({
  useMLLeadScoring: () => ({
    scoreLeadObject: () => ({ score: 50, priority: 'warm', factors: [], confidence: 0.5 }),
  }),
}));

import Leads from './Leads';

/** A `leads` select that resolves to the given rows, and records the columns asked for. */
const stubLeadsQuery = (rows: LeadRow[], selected: string[]) => {
  const builder: Record<string, unknown> = {};
  builder.select = vi.fn((cols: string) => {
    selected.push(cols);
    return builder;
  });
  for (const m of ['eq', 'order', 'in', 'is', 'limit']) {
    builder[m] = vi.fn(() => builder);
  }
  builder.then = (resolve: (v: unknown) => unknown) =>
    Promise.resolve({ data: rows, error: null }).then(resolve);
  return builder;
};

describe('Leads page', () => {
  let selected: string[];

  beforeEach(() => {
    selected = [];
    fromMock.mockReset();
    fromMock.mockImplementation(() => stubLeadsQuery([mockLeadRow], selected));
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
});
