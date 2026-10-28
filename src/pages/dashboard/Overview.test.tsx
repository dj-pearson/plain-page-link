/**
 * US-246: when analytics failed, Overview fell through to the hook's defaults
 * and told the agent they had 0 views, 0 leads and a 0.00% conversion rate.
 * It now says the numbers did not load and offers Retry.
 *
 * The widgets below the stats each run their own queries; they are stubbed so
 * these tests are about what Overview does with useAnalytics.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithProviders, screen, userEvent } from '@/test/test-utils';

const { analytics, refetchMock } = vi.hoisted(() => ({
  analytics: { current: {} as Record<string, unknown> },
  refetchMock: vi.fn(),
}));

vi.mock('@/hooks/useAnalytics', () => ({ useAnalytics: () => analytics.current }));
vi.mock('@/hooks/useLinks', () => ({ useLinks: () => ({ links: [] }) }));
vi.mock('@/hooks/useProfile', () => ({
  useProfile: () => ({
    profile: { username: 'jane', full_name: 'Jane Doe', created_at: '2025-01-01T00:00:00Z' },
  }),
}));
vi.mock('@/hooks/useSubscription', () => ({ useSubscription: () => ({ subscription: null }) }));
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: vi.fn() }) }));
vi.mock('@/components/dashboard/ProfileCompletionWidget', () => ({
  ProfileCompletionWidget: () => null,
}));
vi.mock('@/components/dashboard/QuickActionsWidget', () => ({ QuickActionsWidget: () => null }));
vi.mock('@/components/dashboard/ConversionFunnel', () => ({ ConversionFunnel: () => null }));
vi.mock('@/components/dashboard/DueFollowUps', () => ({ DueFollowUps: () => null }));
vi.mock('@/components/dashboard/ComingUp', () => ({ ComingUp: () => null }));
vi.mock('@/components/dashboard/PlanUsageCard', () => ({ PlanUsageCard: () => null }));

import Overview from './Overview';

const base = {
  stats: { totalViews: 0, totalLeads: 0, conversionRate: 0 },
  recentLeads: [],
  isLoading: false,
  isError: false,
  refetch: refetchMock,
};

describe('Overview', () => {
  beforeEach(() => {
    refetchMock.mockReset();
    analytics.current = { ...base };
  });

  it('shows an error card with Retry instead of zeros when analytics fail', async () => {
    analytics.current = { ...base, isError: true };
    renderWithProviders(<Overview />);

    expect(screen.getByText(/your numbers did not load/i)).toBeInTheDocument();
    expect(screen.queryByText('Profile Views')).not.toBeInTheDocument();
    expect(screen.queryByText('0.00%')).not.toBeInTheDocument();
    // Nor the "start capturing leads" empty state, which would read as fact.
    expect(screen.queryByText(/start capturing leads/i)).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /retry/i }));
    expect(refetchMock).toHaveBeenCalledTimes(1);
  });

  it('shows the stats when analytics load', () => {
    renderWithProviders(<Overview />);

    expect(screen.getByText('Profile Views')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /retry/i })).not.toBeInTheDocument();
  });

  it('shows a phone-only recent lead’s phone, not an empty email line', () => {
    analytics.current = {
      ...base,
      recentLeads: [
        { id: 'l1', name: 'Cleo Phone', email: null, phone: '+1-555-0199', status: 'new' },
      ],
    };
    renderWithProviders(<Overview />);

    expect(screen.getByText('Cleo Phone')).toBeInTheDocument();
    expect(screen.getByText('+1-555-0199')).toBeInTheDocument();
  });
});
