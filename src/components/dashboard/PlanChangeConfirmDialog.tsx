/**
 * Asks an agent who already pays to confirm a plan change before it happens
 * (US-258).
 *
 * For a subscribed agent, create-checkout-session does not open Checkout: it
 * changes the live Stripe subscription in place and prorates (US-217). So the
 * Upgrade / Downgrade button was the whole transaction — one click, no
 * review, a charge or a cut in limits. This says what is about to happen and
 * waits for a yes.
 */
import type { SubscriptionPlan } from '@/hooks/useSubscription';
import { LIMIT_META, describeLimit, limitShips, type PlanLimitKey } from '@/lib/planLimits';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export interface PlanChangeConfirmDialogProps {
  /** The plan to change to; null closes the dialog. */
  plan: SubscriptionPlan | null;
  interval: 'month' | 'year';
  currentPlanName: string;
  isDowngrade: boolean;
  /** The subscription is set to end; changing plan withdraws that. */
  cancelAtPeriodEnd?: boolean;
  /** Current usage, to point out limits the agent is already over. */
  usage?: Partial<Record<PlanLimitKey, number>>;
  onConfirm: () => void;
  onCancel: () => void;
}

const capitalise = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * The plan's limits, in LIMIT_META order, with what the agent uses now. Only
 * limits on features that exist: a downgrade does not "cut" automated texts
 * or CMA reports that no plan delivers (US-297).
 */
export function limitsAfterChange(
  plan: Pick<SubscriptionPlan, 'limits'>,
  usage: Partial<Record<PlanLimitKey, number>> = {}
): { key: PlanLimitKey; text: string; over: boolean; used?: number }[] {
  const limits = (plan.limits ?? {}) as Partial<Record<PlanLimitKey, unknown>>;
  return (Object.keys(LIMIT_META) as PlanLimitKey[]).flatMap((key) => {
    const limit = limits[key];
    if (typeof limit !== 'number' || !limitShips(key)) return [];
    const used = usage[key];
    const over = limit !== -1 && typeof used === 'number' && used > limit;
    return [{ key, text: describeLimit(key, limit), over, used }];
  });
}

export function PlanChangeConfirmDialog({
  plan,
  interval,
  currentPlanName,
  isDowngrade,
  cancelAtPeriodEnd,
  usage,
  onConfirm,
  onCancel,
}: PlanChangeConfirmDialogProps) {
  const price = plan ? Number(interval === 'year' ? plan.price_yearly : plan.price_monthly) : 0;
  const per = interval === 'year' ? 'year' : 'month';
  const limits = plan && isDowngrade ? limitsAfterChange(plan, usage) : [];

  return (
    <AlertDialog open={plan !== null} onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent className="max-w-md">
        {plan && (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {isDowngrade ? 'Downgrade' : 'Upgrade'} to {capitalise(plan.name)}?
              </AlertDialogTitle>
              <AlertDialogDescription>
                You&rsquo;re moving from {capitalise(currentPlanName)} to {capitalise(plan.name)},
                billed {interval === 'year' ? 'yearly' : 'monthly'} at ${price}/{per}. The change
                takes effect immediately.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="space-y-3 text-sm text-foreground">
              <p>
                {isDowngrade
                  ? 'The unused part of your current plan is credited against your next invoice.'
                  : 'You’ll be charged the prorated difference for the rest of this billing period on your next invoice.'}
              </p>
              {cancelAtPeriodEnd && (
                <p>Your scheduled cancellation is withdrawn: the subscription will renew.</p>
              )}
              {isDowngrade && limits.length > 0 && (
                <div>
                  <p className="font-medium">These limits will apply:</p>
                  <ul className="mt-1.5 space-y-1 text-muted-foreground">
                    {limits.map((l) => (
                      <li key={l.key}>
                        {l.text}
                        {l.over && (
                          <span className="text-destructive">
                            {' '}
                            (you have {l.used?.toLocaleString()})
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel>Keep {capitalise(currentPlanName)}</AlertDialogCancel>
              <AlertDialogAction onClick={onConfirm}>
                {isDowngrade ? 'Downgrade' : 'Upgrade'} to {capitalise(plan.name)}
              </AlertDialogAction>
            </AlertDialogFooter>
          </>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}
