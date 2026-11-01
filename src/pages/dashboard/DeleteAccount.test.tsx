/**
 * US-250: deleting an account used to leave the Stripe subscription charging.
 * The page now says what happens to the subscription, before and after the
 * request.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithProviders, screen } from '@/test/test-utils';

const { status } = vi.hoisted(() => ({
  status: { current: { scheduled: false } as Record<string, unknown> },
}));

vi.mock('@/lib/edgeFunctions', () => ({
  callEdgeFunction: vi.fn(async () => status.current),
  edgeFunctions: { invoke: vi.fn(async () => ({ data: {}, error: null })) },
}));
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: vi.fn() }) }));

import DeleteAccount from './DeleteAccount';

describe('DeleteAccount', () => {
  beforeEach(() => {
    status.current = { scheduled: false };
  });

  it('says the subscription will be cancelled before the request', async () => {
    renderWithProviders(<DeleteAccount />);
    expect(
      await screen.findByText(/stops renewing as soon as you request deletion/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/cancelled when the account is deleted/i)).toBeInTheDocument();
  });

  it('says the subscription will be cancelled while a deletion is scheduled', async () => {
    status.current = { scheduled: true, scheduledFor: '2026-12-01T00:00:00Z', daysRemaining: 30 };
    renderWithProviders(<DeleteAccount />);
    expect(await screen.findByText(/subscription will not renew/i)).toBeInTheDocument();
    expect(screen.getByText(/turns renewal back on/i)).toBeInTheDocument();
  });
});
