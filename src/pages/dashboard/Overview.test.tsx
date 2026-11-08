/**
 * US-246: when analytics failed, Overview fell through to the hook's defaults
 * and told the agent they had 0 views, 0 leads and a 0.00% conversion rate.
 * It now says the numbers did not load and offers Retry.
 *
 * The widgets below the stats each run their own queries; they are stubbed so
 * these tests are about what Overview does with useAnalytics.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithProviders, screen, userEvent, waitFor } from '@/test/test-utils';

const { analytics, refetchMock, linksState } = vi.hoisted(() => ({
  analytics: { current: {} as Record<string, unknown> },
  refetchMock: vi.fn(),
  linksState: { current: { links: [] as unknown[], isError: false, refetch: vi.fn() } },
}));

vi.mock('@/hooks/useAnalytics', () => ({ useAnalytics: () => analytics.current }));
vi.mock('@/hooks/useLinks', () => ({ useLinks: () => linksState.current }));
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
vi.mock('@/components/dashboard/TimeZonePrompt', () => ({ TimeZonePrompt: () => null }));

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
    linksState.current = { links: [], isError: false, refetch: vi.fn() };
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

  it('passes a pre-US-258 checkout return on to the subscription page, which waits for the plan', async () => {
    window.history.pushState({}, '', '/dashboard?subscription=success');
    renderWithProviders(<Overview />);

    await waitFor(() =>
      expect(window.location.pathname + window.location.search).toBe(
        '/dashboard/subscription?checkout_status=success'
      )
    );
    // No "Welcome to <plan>" modal built from a plan the webhook has not set yet.
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    window.history.pushState({}, '', '/');
  });

  // US-590
  it('says links did not load instead of offering "Add your first link" and 0 clicks', async () => {
    const refetch = vi.fn();
    linksState.current = { links: [], isError: true, refetch };
    renderWithProviders(<Overview />);

    expect(screen.getByText(/your links did not load/i)).toBeInTheDocument();
    expect(screen.queryByText(/add your first link/i)).not.toBeInTheDocument();
    expect(screen.getByText('Link Clicks').nextElementSibling).toHaveTextContent('—');

    await userEvent.click(screen.getByRole('button', { name: /retry loading links/i }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  // US-602
  it('opens the page behind each stat card', () => {
    renderWithProviders(<Overview />);

    const href = (label: string) => screen.getByText(label).closest('a')?.getAttribute('href');
    expect(href('Profile Views')).toBe('/dashboard/analytics');
    expect(href('Leads (30d)')).toBe('/dashboard/leads');
    expect(href('Link Clicks')).toBe('/dashboard/links');
    expect(href('Conversion Rate')).toBe('/dashboard/analytics');
  });

  it('labels and groups recent lead statuses instead of colouring a lost lead green', () => {
    analytics.current = {
      ...base,
      recentLeads: [
        {
          id: 'l1',
          name: 'Nora Nurture',
          email: 'n@example.com',
          phone: null,
          status: 'nurturing',
        },
        { id: 'l2', name: 'Lou Lost', email: 'l@example.com', phone: null, status: 'lost' },
      ],
    };
    renderWithProviders(<Overview />);

    expect(screen.getByText('Nurturing')).toHaveAttribute('data-tone', 'in_progress');
    expect(screen.queryByText('nurturing')).not.toBeInTheDocument();
    expect(screen.getByText('Lost')).toHaveAttribute('data-tone', 'lost');
  });
});
