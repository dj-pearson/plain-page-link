/**
 * Confirms a return from Stripe Checkout and waits for the plan to change
 * (US-258).
 *
 * Stripe redirects the agent back as soon as the payment succeeds; the plan
 * changes only when the webhook has been delivered and processed, which is
 * usually a second or two later. Read once, the page showed the old plan —
 * Free, for a first purchase — and nothing else. This re-reads the plan and
 * usage queries every ~2s for up to ~30s, then says either that the plan is
 * active or that Stripe is still processing.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { PLAN_USAGE_QUERY_KEY } from '@/hooks/usePlanUsage';
import {
  CHECKOUT_POLL_INTERVAL_MS,
  CHECKOUT_POLL_TIMEOUT_MS,
  planHasArrived,
  readCheckoutReturn,
  stripCheckoutReturn,
} from '@/lib/checkoutReturn';

export type CheckoutReturnPhase = 'idle' | 'waiting' | 'confirmed' | 'processing';

export interface CheckoutReturnState {
  phase: CheckoutReturnPhase;
  /** The plan bought, when known. */
  targetPlan: string | null;
  dismiss: () => void;
}

export function useCheckoutReturn(currentPlanName: string | null | undefined): CheckoutReturnState {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [phase, setPhase] = useState<CheckoutReturnPhase>('idle');
  const [targetPlan, setTargetPlan] = useState<string | null>(null);
  const started = useRef(false);

  // Landing with the success params starts the wait, once per arrival (an
  // in-place plan change sets them again later on the same page).
  useEffect(() => {
    const ret = readCheckoutReturn(searchParams);
    if (!ret) {
      started.current = false;
      return;
    }
    if (started.current) return;
    started.current = true;
    setTargetPlan(ret.planName);
    setPhase('waiting');
  }, [searchParams]);

  const refetchPlan = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ['user-subscription'] });
    void queryClient.invalidateQueries({ queryKey: PLAN_USAGE_QUERY_KEY });
  }, [queryClient]);

  // While waiting: re-read the plan on an interval, and give up after the
  // timeout.
  useEffect(() => {
    if (phase !== 'waiting') return;
    refetchPlan();
    const poll = window.setInterval(refetchPlan, CHECKOUT_POLL_INTERVAL_MS);
    const giveUp = window.setTimeout(() => setPhase('processing'), CHECKOUT_POLL_TIMEOUT_MS);
    return () => {
      window.clearInterval(poll);
      window.clearTimeout(giveUp);
    };
  }, [phase, refetchPlan]);

  // The plan arriving ends the wait — or, arriving late (a refetch on window
  // focus), replaces 'still processing'.
  useEffect(() => {
    if (
      (phase === 'waiting' || phase === 'processing') &&
      planHasArrived(currentPlanName, targetPlan)
    ) {
      setPhase('confirmed');
      // The billing history gains the first invoice at the same time.
      void queryClient.invalidateQueries({ queryKey: ['billing-invoices'] });
    }
  }, [phase, currentPlanName, targetPlan, queryClient]);

  // Once the wait is over either way, the URL stops saying "success", so a
  // reload or a shared link does not replay it.
  useEffect(() => {
    if (phase !== 'confirmed' && phase !== 'processing') return;
    if (!readCheckoutReturn(searchParams)) return;
    setSearchParams(stripCheckoutReturn(searchParams), { replace: true });
  }, [phase, searchParams, setSearchParams]);

  const dismiss = useCallback(() => setPhase('idle'), []);

  return { phase, targetPlan, dismiss };
}
