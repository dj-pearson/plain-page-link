/**
 * Shown when an action is refused by the agent's plan.
 *
 * It names the plan that lifts the limit, what that plan includes and what it
 * costs, from the same config the pricing page renders — so it cannot promise
 * "up to 20 listings" on a plan that includes 10, which the hand-written copy
 * here used to.
 */
import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PRICING_PLANS, type PricingTier } from '@/config/pricing-plans';
import {
  LIMIT_META,
  describeLimit,
  nextPlanFor,
  tierFor,
  UPGRADE_PATH,
  type PlanLimitKey,
} from '@/lib/planLimits';

/** Features that are a yes/no on a plan rather than a count. */
const FEATURE_UNLOCKS: Record<string, { title: string; planId: string; points: string[] }> = {
  lead_export: {
    title: 'Export your leads',
    planId: 'starter',
    points: ['Download every lead as CSV', 'Take your pipeline to any CRM'],
  },
  premium_themes: {
    title: 'Premium themes',
    planId: 'starter',
    points: ['Every premium theme and layout', 'Custom colours and fonts'],
  },
  custom_domain: {
    title: 'Your own domain',
    planId: 'professional',
    points: ['Serve your page from your own domain', 'Remove AgentBio branding'],
  },
  analytics: {
    title: 'Longer analytics history',
    planId: 'starter',
    points: ['90 days of analytics on Starter', 'A full year on Professional'],
  },
};

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** A plan limit key, or one of the FEATURE_UNLOCKS keys. */
  feature: string;
  /** The agent's plan name, e.g. 'free'. */
  currentPlan?: string;
  /** Overrides the plan the modal recommends. */
  requiredPlan?: string;
}

function highlights(plan: PricingTier): string[] {
  return (
    ['listings', 'contacts', 'open_houses_per_month', 'leads_per_month'] as PlanLimitKey[]
  ).map((key) => describeLimit(key, plan.limits[LIMIT_META[key].configKey]));
}

export function UpgradeModal({
  open,
  onOpenChange,
  feature,
  currentPlan = 'free',
  requiredPlan,
}: UpgradeModalProps) {
  const current = tierFor(currentPlan.toLowerCase());
  const limitKey = feature in LIMIT_META ? (feature as PlanLimitKey) : null;
  const unlock = FEATURE_UNLOCKS[feature];

  const recommended =
    PRICING_PLANS.find((p) => p.id === requiredPlan?.toLowerCase()) ??
    (limitKey ? nextPlanFor(limitKey, current.id)?.plan : undefined) ??
    PRICING_PLANS.find((p) => p.id === unlock?.planId) ??
    PRICING_PLANS[1];

  let title: string;
  let description: string;
  if (limitKey) {
    const { label } = LIMIT_META[limitKey];
    const currentLimit = current.limits[LIMIT_META[limitKey].configKey];
    const nextLimit = recommended.limits[LIMIT_META[limitKey].configKey];
    title =
      currentLimit === 0
        ? `${label[0].toUpperCase()}${label.slice(1)} start on ${recommended.name}`
        : `You've reached ${describeLimit(limitKey, currentLimit)}`;
    description =
      currentLimit === 0
        ? `The ${current.name} plan doesn't include ${label}. ${recommended.name} includes ${describeLimit(limitKey, nextLimit).toLowerCase()}.`
        : `That's the most the ${current.name} plan includes. ${recommended.name} raises it to ${describeLimit(limitKey, nextLimit).toLowerCase()}.`;
  } else {
    title = unlock?.title ?? 'Upgrade your plan';
    description = `This is part of the ${recommended.name} plan.`;
  }

  const points = unlock && !limitKey ? unlock.points : highlights(recommended);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">{title}</DialogTitle>
          <DialogDescription className="pt-1">{description}</DialogDescription>
        </DialogHeader>

        <div className="rounded-xl border p-4">
          <p className="mb-3 flex items-baseline justify-between gap-2">
            <span className="font-semibold">{recommended.name}</span>
            <span className="text-sm text-muted-foreground">
              <span className="text-lg font-semibold text-foreground">
                ${recommended.price_monthly}
              </span>
              /month
            </span>
          </p>
          <ul className="space-y-2 text-sm">
            {points.map((point) => (
              <li key={point} className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" aria-hidden="true" />
                {point}
              </li>
            ))}
          </ul>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="min-h-[44px] sm:min-h-0"
          >
            Not now
          </Button>
          <Button asChild className="min-h-[44px] sm:min-h-0">
            <Link to={UPGRADE_PATH}>Upgrade to {recommended.name}</Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
