/**
 * US-590: a failed visitors count became 0 and a failed leads query drew five
 * zero bars; both now say the funnel did not load.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithProviders, screen } from '@/test/test-utils';

const { result } = vi.hoisted(() => ({
  result: {
    views: { count: 0 as number | null, error: null as { message: string } | null },
    leads: { data: [] as unknown[] | null, error: null as { message: string } | null },
  },
}));

function chain(final: () => unknown) {
  const c: Record<string, unknown> = {};
  c.select = () => c;
  c.eq = () => c;
  c.gte = () => c;
  c.then = (resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) =>
    Promise.resolve(final()).then(resolve, reject);
  return c;
}

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (table: string) =>
      chain(() => (table === 'analytics_views' ? result.views : result.leads)),
  },
}));
vi.mock('@/stores/useAuthStore', () => ({
  useAuthStore: () => ({ user: { id: 'agent-1' } }),
}));

import { ConversionFunnel } from './ConversionFunnel';

beforeEach(() => {
  result.views = { count: 12, error: null };
  result.leads = { data: [{ status: 'new' }, { status: 'contacted' }], error: null };
});

describe('ConversionFunnel (US-590)', () => {
  it('draws the stages when both queries succeed', async () => {
    renderWithProviders(<ConversionFunnel />);
    expect(await screen.findByText('12')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('says the funnel did not load when the visitors count fails', async () => {
    result.views = { count: null, error: { message: 'permission denied' } };
    renderWithProviders(<ConversionFunnel />);
    expect(await screen.findByRole('alert')).toHaveTextContent(/your funnel did not load/i);
    expect(screen.queryByText('Visitors')).not.toBeInTheDocument();
  });

  it('says the funnel did not load when the leads query fails', async () => {
    result.leads = { data: null, error: { message: 'timeout' } };
    renderWithProviders(<ConversionFunnel />);
    expect(await screen.findByRole('alert')).toHaveTextContent(/your funnel did not load/i);
    expect(
      screen.getByRole('button', { name: /retry loading the conversion funnel/i })
    ).toBeInTheDocument();
  });
});
