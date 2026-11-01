/**
 * US-258: the wait after returning from Stripe Checkout — re-read the plan
 * every ~2s, stop when it changes or after ~30s, then drop the param.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { ReactNode } from 'react';
import { act, renderHook } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { createTestQueryClient } from '@/test/test-utils';
import { useCheckoutReturn } from './useCheckoutReturn';
import {
  checkoutSuccessUrl,
  planHasArrived,
  readCheckoutReturn,
  stripCheckoutReturn,
} from '@/lib/checkoutReturn';

function setup(initialPath: string, plan: { current: string }) {
  const client = createTestQueryClient();
  const invalidate = vi.spyOn(client, 'invalidateQueries');
  const wrapper = ({ children }: { children: ReactNode }) => (
    <MemoryRouter initialEntries={[initialPath]}>
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    </MemoryRouter>
  );
  const hook = renderHook(
    () => ({ state: useCheckoutReturn(plan.current), location: useLocation() }),
    { wrapper }
  );
  const planPolls = () =>
    invalidate.mock.calls.filter(([f]) => JSON.stringify(f?.queryKey) === '["user-subscription"]')
      .length;
  return { ...hook, planPolls };
}

describe('useCheckoutReturn', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('does nothing without the success param', () => {
    const { result, planPolls } = setup('/dashboard/subscription', { current: 'free' });
    expect(result.current.state.phase).toBe('idle');
    act(() => {
      vi.advanceTimersByTime(10000);
    });
    expect(planPolls()).toBe(0);
  });

  it('polls every ~2s until the plan changes, then confirms and strips the param', () => {
    const plan = { current: 'free' };
    const { result, rerender, planPolls } = setup(
      '/dashboard/subscription?checkout_status=success&plan=starter&tab=x',
      plan
    );
    expect(result.current.state.phase).toBe('waiting');
    const first = planPolls();
    expect(first).toBeGreaterThanOrEqual(1);

    act(() => {
      vi.advanceTimersByTime(6000);
    });
    expect(planPolls()).toBe(first + 3);
    expect(result.current.location.search).toContain('checkout_status=success');

    plan.current = 'starter';
    rerender();
    expect(result.current.state.phase).toBe('confirmed');
    expect(result.current.location.search).toBe('?tab=x');

    // And polling stops.
    const after = planPolls();
    act(() => {
      vi.advanceTimersByTime(10000);
    });
    expect(planPolls()).toBe(after);
  });

  it("gives up after ~30s with 'still processing' and strips the param", () => {
    const { result, planPolls } = setup(
      '/dashboard/subscription?checkout_status=success&plan=professional',
      { current: 'free' }
    );
    act(() => {
      vi.advanceTimersByTime(29000);
    });
    expect(result.current.state.phase).toBe('waiting');
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.state.phase).toBe('processing');
    expect(result.current.location.search).toBe('');
    const after = planPolls();
    act(() => {
      vi.advanceTimersByTime(10000);
    });
    expect(planPolls()).toBe(after);
  });
});

describe('checkoutReturn helpers', () => {
  it('builds the one success URL both entry points use', () => {
    expect(checkoutSuccessUrl('https://agentbio.net', 'Professional')).toBe(
      'https://agentbio.net/dashboard/subscription?checkout_status=success&plan=professional'
    );
  });

  it('recognises the pre-US-258 status=success return too', () => {
    expect(readCheckoutReturn(new URLSearchParams('status=success'))).toEqual({ planName: null });
    expect(readCheckoutReturn(new URLSearchParams('checkout=starter'))).toBeNull();
    expect(stripCheckoutReturn(new URLSearchParams('status=success&a=1')).toString()).toBe('a=1');
  });

  it('without a target, any paid plan counts as arrived', () => {
    expect(planHasArrived('free', null)).toBe(false);
    expect(planHasArrived('starter', null)).toBe(true);
    expect(planHasArrived('starter', 'professional')).toBe(false);
    expect(planHasArrived('Professional', 'professional')).toBe(true);
  });
});
