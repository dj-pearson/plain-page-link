/**
 * US-258: after paying, the agent landed on a page that read nothing from the
 * success URL and still said Free; and for an agent already paying, one click
 * on Upgrade / Downgrade changed the Stripe subscription with no confirm.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderWithProviders, screen, userEvent, waitFor, within } from '@/test/test-utils';

const { sub, invokeMock, usage } = vi.hoisted(() => ({
  sub: { current: {} as Record<string, unknown> },
  invokeMock: vi.fn(),
  usage: { current: {} as Record<string, number> },
}));

const plans = [
  {
    name: 'free',
    price_monthly: 0,
    price_yearly: 0,
    stripe_price_id: null,
    stripe_price_id_monthly: null,
    stripe_price_id_yearly: null,
    features: {},
    limits: { listings: 3, links: 5 },
  },
  {
    name: 'starter',
    price_monthly: 29,
    price_yearly: 290,
    stripe_price_id: null,
    stripe_price_id_monthly: 'price_starter_m',
    stripe_price_id_yearly: 'price_starter_y',
    features: {},
    limits: { listings: 10, links: 15, contacts: 100 },
  },
  {
    name: 'professional',
    price_monthly: 49,
    price_yearly: 490,
    stripe_price_id: null,
    stripe_price_id_monthly: 'price_pro_m',
    stripe_price_id_yearly: 'price_pro_y',
    features: {},
    limits: { listings: -1, links: -1, contacts: -1 },
  },
];

vi.mock('@/hooks/useSubscription', async (orig) => {
  const actual = await orig<typeof import('@/hooks/useSubscription')>();
  return { ...actual, useSubscription: () => sub.current };
});
vi.mock('@/hooks/usePlanUsage', async (orig) => {
  const actual = await orig<typeof import('@/hooks/usePlanUsage')>();
  return { ...actual, usePlanUsage: () => ({ plan: { usage: usage.current } }) };
});
vi.mock('@/stores/useAuthStore', () => ({ useAuthStore: () => ({ user: { id: 'u1' } }) }));
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: vi.fn() }) }));
vi.mock('@/lib/edgeFunctions', () => ({ edgeFunctions: { invoke: invokeMock } }));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        order: () => ({ limit: () => Promise.resolve({ data: [], error: null }) }),
      }),
    }),
  },
}));

import SubscriptionPage from './SubscriptionPage';

const on = (plan_name: string, extra: Record<string, unknown> = {}) => {
  sub.current = {
    subscription: {
      plan_name,
      status: 'active',
      current_period_end: '2026-12-15T00:00:00Z',
      limits: {},
      features: {},
      ...extra,
    },
    plans,
    isLoading: false,
  };
};

describe('SubscriptionPage plan changes', () => {
  beforeEach(() => {
    invokeMock.mockReset();
    invokeMock.mockResolvedValue({ data: { changed: true, subscriptionId: 'sub_1' }, error: null });
    usage.current = {};
    window.history.pushState({}, '', '/dashboard/subscription');
  });

  it('asks a paying agent to confirm a downgrade, stating the limits, before calling checkout', async () => {
    on('professional');
    usage.current = { listings: 14 };
    renderWithProviders(<SubscriptionPage />);

    await userEvent.click(screen.getByRole('button', { name: 'Downgrade' }));

    const dialog = await screen.findByRole('alertdialog');
    expect(within(dialog).getByText(/downgrade to starter\?/i)).toBeInTheDocument();
    expect(within(dialog).getByText(/billed monthly at \$29\/month/i)).toBeInTheDocument();
    expect(within(dialog).getByText(/credited against your next invoice/i)).toBeInTheDocument();
    expect(within(dialog).getByText(/10 active listings/i)).toBeInTheDocument();
    expect(within(dialog).getByText(/you have 14/i)).toBeInTheDocument();
    expect(invokeMock).not.toHaveBeenCalled();

    await userEvent.click(within(dialog).getByRole('button', { name: /downgrade to starter/i }));
    await waitFor(() => expect(invokeMock).toHaveBeenCalledTimes(1));
    expect(invokeMock.mock.calls[0][0]).toBe('create-checkout-session');
    expect(invokeMock.mock.calls[0][1].body.priceId).toBe('price_starter_m');
  });

  it('does nothing when the paying agent backs out of the dialog', async () => {
    on('starter');
    renderWithProviders(<SubscriptionPage />);

    await userEvent.click(screen.getByRole('button', { name: 'Upgrade' }));
    const dialog = await screen.findByRole('alertdialog');
    expect(within(dialog).getByText(/prorated difference/i)).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole('button', { name: /keep starter/i }));

    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
    expect(invokeMock).not.toHaveBeenCalled();
  });

  it('sends a free agent straight to checkout, returning to the handled success URL', async () => {
    on('free');
    invokeMock.mockResolvedValue({ data: {}, error: null });
    renderWithProviders(<SubscriptionPage />);

    await userEvent.click(screen.getAllByRole('button', { name: 'Upgrade' })[0]);

    await waitFor(() => expect(invokeMock).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(invokeMock.mock.calls[0][1].body.successUrl).toBe(
      `${window.location.origin}/dashboard/subscription?checkout_status=success&plan=starter`
    );
  });

  it("says 'Ends' rather than 'Renews' when the subscription is set to cancel", () => {
    on('starter', { cancel_at_period_end: true });
    renderWithProviders(<SubscriptionPage />);

    expect(screen.getByText('Ends')).toBeInTheDocument();
    expect(screen.queryByText('Renews')).not.toBeInTheDocument();
  });

  it("says 'Renews' for a subscription that renews", () => {
    on('starter');
    renderWithProviders(<SubscriptionPage />);
    expect(screen.getByText('Renews')).toBeInTheDocument();
  });
});

describe('SubscriptionPage checkout return', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('confirms the purchase and strips the param once the new plan shows', async () => {
    on('professional');
    window.history.pushState(
      {},
      '',
      '/dashboard/subscription?checkout_status=success&plan=professional'
    );
    renderWithProviders(<SubscriptionPage />);

    expect(await screen.findByText(/you're on professional/i)).toBeInTheDocument();
    await waitFor(() => expect(window.location.search).toBe(''));
  });

  it('says it is confirming while the plan has not changed yet', async () => {
    on('free');
    window.history.pushState(
      {},
      '',
      '/dashboard/subscription?checkout_status=success&plan=starter'
    );
    renderWithProviders(<SubscriptionPage />);

    expect(await screen.findByText(/confirming your plan/i)).toBeInTheDocument();
    // The param stays until the wait is over.
    expect(window.location.search).toContain('checkout_status=success');
  });
});
