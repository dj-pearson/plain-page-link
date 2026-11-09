import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

type Call = [string, ...unknown[]];
const calls: Call[] = [];

const ROWS = [
  {
    id: 'a1',
    user_id: '11111111-1111-1111-1111-111111111111',
    actor_id: null,
    action: 'profile_update',
    status: 'success',
    risk_level: 'low',
    resource_type: 'profile',
    resource_id: null,
    ip_address: null,
    user_agent: 'Mozilla/5.0',
    details: { fields: ['bio'], client_reported: true },
    created_at: '2026-11-08T10:00:00Z',
  },
  {
    id: 'a2',
    user_id: '11111111-1111-1111-1111-111111111111',
    actor_id: null,
    action: 'mfa_disable',
    status: 'success',
    risk_level: 'high',
    resource_type: null,
    resource_id: null,
    ip_address: null,
    user_agent: null,
    details: null,
    created_at: '2026-11-08T09:00:00Z',
  },
];

function chain(): unknown {
  const c: Record<string, unknown> = {};
  for (const m of ['order', 'range', 'ilike', 'eq', 'gte', 'lte', 'or']) {
    c[m] = (...args: unknown[]) => {
      calls.push([m, ...args]);
      return c;
    };
  }
  c.then = (resolve: (v: unknown) => unknown) =>
    Promise.resolve({ data: ROWS, count: ROWS.length, error: null }).then(resolve);
  return c;
}

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: () => ({ select: () => chain() }) },
}));
vi.mock('@/stores/useAuthStore', () => ({
  useAuthStore: () => ({ user: { id: 'admin' }, role: 'admin' }),
}));

import AuditLogPage from './AuditLogPage';

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <AuditLogPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('AuditLogPage source (US-675)', () => {
  beforeEach(() => {
    calls.length = 0;
  });

  it('marks the browser-reported row and not the server row', async () => {
    renderPage();
    await screen.findByText('profile_update');
    const markers = screen.getAllByText('Reported by browser');
    expect(markers).toHaveLength(1);
    expect(markers[0].closest('tr')).toBe(screen.getByText('profile_update').closest('tr'));
    expect(screen.getByText('mfa_disable').closest('tr')?.textContent).not.toContain(
      'Reported by browser'
    );
  });

  it('filters to server-written rows, keeping rows with no details', async () => {
    renderPage();
    await screen.findByText('profile_update');
    expect(calls.some(([m]) => m === 'or')).toBe(false);

    fireEvent.change(screen.getByLabelText('Source'), { target: { value: 'server' } });
    await waitFor(() =>
      expect(calls).toContainEqual([
        'or',
        'details.is.null,details->>client_reported.is.null,details->>client_reported.neq.true',
      ])
    );
    expect(screen.getByText(/still count as server-written/)).toBeInTheDocument();
  });

  it('filters to browser-reported rows', async () => {
    renderPage();
    await screen.findByText('profile_update');
    fireEvent.change(screen.getByLabelText('Source'), { target: { value: 'client' } });
    await waitFor(() => expect(calls).toContainEqual(['eq', 'details->>client_reported', 'true']));
  });
});
