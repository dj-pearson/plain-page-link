/**
 * US-612: when get_plan_usage fails the card says so, with a retry, instead
 * of vanishing the way it does while loading.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithProviders, screen, userEvent } from '@/test/test-utils';

const { state } = vi.hoisted(() => ({
  state: { isLoading: false, isError: false, refetch: vi.fn() },
}));

vi.mock('@/hooks/usePlanUsage', () => ({
  usePlanUsage: () => ({
    plan: null,
    planName: 'free',
    isLoading: state.isLoading,
    isError: state.isError,
    refetch: state.refetch,
    status: () => ({ used: 0, limit: -1, canAdd: true }),
    canAdd: () => true,
    hasFeature: () => false,
  }),
}));

import { PlanUsageCard } from './PlanUsageCard';

describe('PlanUsageCard (US-612)', () => {
  beforeEach(() => {
    state.isLoading = false;
    state.isError = false;
    state.refetch.mockClear();
  });

  it('renders nothing while the plan is loading', () => {
    state.isLoading = true;
    const { container } = renderWithProviders(<PlanUsageCard />);
    expect(container).toBeEmptyDOMElement();
  });

  it('says the plan did not load, and retries, when the read failed', async () => {
    state.isError = true;
    renderWithProviders(<PlanUsageCard />);
    expect(screen.getByRole('alert')).toHaveTextContent('Your plan and usage did not load.');
    await userEvent.click(screen.getByRole('button', { name: 'Retry loading your plan' }));
    expect(state.refetch).toHaveBeenCalledTimes(1);
  });
});
