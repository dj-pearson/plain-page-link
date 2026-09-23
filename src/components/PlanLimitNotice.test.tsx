import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { limitStatus, type PlanLimitKey } from '@/lib/planLimits';

const usage: { plan_name: string; used: Partial<Record<PlanLimitKey, [number, number]>> } = {
  plan_name: 'free',
  used: {},
};

vi.mock('@/hooks/usePlanUsage', () => ({
  usePlanUsage: () => ({
    plan: { plan_name: usage.plan_name },
    planName: usage.plan_name,
    status: (key: PlanLimitKey) => {
      const [used, limit] = usage.used[key] ?? [0, -1];
      return limitStatus(used, limit);
    },
  }),
}));

import { PlanLimitNotice } from './PlanLimitNotice';
import { UpgradeModal } from './UpgradeModal';

const renderNotice = (key: PlanLimitKey) =>
  render(
    <MemoryRouter>
      <PlanLimitNotice limitKey={key} />
    </MemoryRouter>
  );

describe('PlanLimitNotice', () => {
  beforeEach(() => {
    usage.plan_name = 'free';
    usage.used = {};
  });

  it('stays quiet well inside the limit', () => {
    usage.used = { listings: [1, 3] };
    const { container } = renderNotice('listings');
    expect(container).toBeEmptyDOMElement();
  });

  it('at the limit, says so and names the plan that lifts it', () => {
    usage.used = { listings: [3, 3] };
    renderNotice('listings');
    expect(screen.getByText("You've used all 3 active listings")).toBeInTheDocument();
    expect(
      screen.getByText(/Starter \(\$29\/mo\) includes 10 active listings/)
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /See plans/ })).toHaveAttribute(
      'href',
      '/dashboard/subscription'
    );
  });

  it('tells an agent when a feature is not in their plan at all', () => {
    usage.used = { open_houses_per_month: [0, 0] };
    renderNotice('open_houses_per_month');
    expect(screen.getByText("Open houses aren't included in the Free plan")).toBeInTheDocument();
  });

  it('counts the one free open house a month', () => {
    usage.used = { open_houses_per_month: [1, 1] };
    renderNotice('open_houses_per_month');
    expect(screen.getByText("You've used your open house for this month")).toBeInTheDocument();
  });

  it('says the leads are saved and how many are locked', () => {
    usage.used = { leads_per_month: [14, 10] };
    renderNotice('leads_per_month');
    expect(
      screen.getByText(/Every lead is still saved, but the 4 past your allowance/)
    ).toBeInTheDocument();
  });

  it('has nothing to sell on the top tier', () => {
    usage.plan_name = 'enterprise';
    usage.used = { listings: [5, -1] };
    const { container } = renderNotice('listings');
    expect(container).toBeEmptyDOMElement();
  });
});

describe('UpgradeModal', () => {
  it('quotes the real next-tier numbers, not hand-written copy', () => {
    render(
      <MemoryRouter>
        <UpgradeModal open onOpenChange={() => {}} feature="contacts" currentPlan="free" />
      </MemoryRouter>
    );
    expect(screen.getByText("You've reached 50 clients")).toBeInTheDocument();
    expect(screen.getByText(/Starter raises it to 500 clients/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Upgrade to Starter' })).toBeInTheDocument();
  });
});
