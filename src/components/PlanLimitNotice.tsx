/**
 * The nudge above a list when its plan limit is close or reached.
 *
 * Silent until 80% of the limit, so it means something when it appears. It
 * says what the next plan includes and what it costs, rather than a bare
 * "Upgrade", because "Starter gives you 10" is the sentence that sells it.
 */
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { usePlanUsage } from '@/hooks/usePlanUsage';
import {
  LIMIT_META,
  describeLimit,
  shouldNudge,
  tierFor,
  upgradePitch,
  UPGRADE_PATH,
  type PlanLimitKey,
} from '@/lib/planLimits';
import { cn } from '@/lib/utils';

interface PlanLimitNoticeProps {
  limitKey: PlanLimitKey;
  className?: string;
}

export function PlanLimitNotice({ limitKey, className }: PlanLimitNoticeProps) {
  const { plan, status } = usePlanUsage();
  if (!plan) return null;

  const s = status(limitKey);
  if (!shouldNudge(s)) return null;

  const { label, monthly, enforced } = LIMIT_META[limitKey];
  const planLabel = tierFor(plan.plan_name).name;
  const pitch = upgradePitch(limitKey, plan.plan_name);
  const blocking = s.level === 'at' || s.level === 'over' || s.level === 'locked';

  const headline =
    s.level === 'locked'
      ? `${label[0].toUpperCase()}${label.slice(1)} aren't included in the ${planLabel} plan`
      : !enforced && s.level === 'over'
        ? `${s.used} ${label} this month — more than the ${s.limit} your plan includes`
        : blocking
          ? s.limit === 1
            ? `You've used your ${LIMIT_META[limitKey].singular ?? label}${monthly ? ' for this month' : ''}`
            : `You've used all ${s.limit} ${label}${monthly ? ' for this month' : ''}`
          : `${s.used} of ${describeLimit(limitKey, s.limit)} used`;

  const detail = !enforced
    ? s.level === 'over'
      ? `Every lead is still saved, but the ${s.used - s.limit} past your allowance show their contact details only after you upgrade.`
      : 'Every lead is still saved. Past the allowance, contact details stay locked until you upgrade or the month turns.'
    : blocking
      ? monthly
        ? 'You can add more next month, or upgrade now.'
        : 'Remove one or upgrade to add more.'
      : null;

  return (
    <div
      role="status"
      className={cn(
        'flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center',
        blocking ? 'border-amber-300 bg-amber-50' : 'bg-card',
        className
      )}
    >
      <div className="min-w-0 flex-1 space-y-2">
        <p className={cn('text-sm font-semibold', blocking ? 'text-amber-900' : 'text-foreground')}>
          {headline}
        </p>
        {s.level !== 'locked' && (
          <Progress
            value={s.percent}
            className="h-1.5"
            aria-label={`${s.used} of ${s.limit} ${label} used`}
          />
        )}
        {(detail || pitch) && (
          <p className={cn('text-sm', blocking ? 'text-amber-800' : 'text-muted-foreground')}>
            {[detail, pitch].filter(Boolean).join(' ')}
          </p>
        )}
      </div>
      {pitch && (
        <Button
          asChild
          size="sm"
          variant={blocking ? 'default' : 'outline'}
          className="min-h-[44px] flex-shrink-0 sm:min-h-0"
        >
          <Link to={UPGRADE_PATH}>
            See plans
            <ArrowUpRight className="ml-1 h-4 w-4" aria-hidden="true" />
          </Link>
        </Button>
      )}
    </div>
  );
}
