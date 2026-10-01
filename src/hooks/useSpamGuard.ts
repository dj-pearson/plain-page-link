import { useCallback, useRef } from 'react';

/**
 * Invisible bot signals for public lead forms (US-220). See
 * supabase/functions/_shared/spam-guard.ts for how submit-lead reads them.
 *
 * Spread `honeypotProps` on a <HoneypotField>; pass `signals()` to the
 * submission. The timer starts when the form mounts.
 */
export const useSpamGuard = () => {
  const mountedAt = useRef(Date.now());
  const honeypotRef = useRef<HTMLInputElement>(null);

  const signals = useCallback(
    () => ({
      _hp: honeypotRef.current?.value ?? '',
      _elapsed_ms: Date.now() - mountedAt.current,
    }),
    []
  );

  return { honeypotRef, signals };
};

export type SpamSignals = ReturnType<ReturnType<typeof useSpamGuard>['signals']>;
