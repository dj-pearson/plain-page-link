/**
 * The agent's plan on the dashboard: every limit, how much of it is used, and
 * — when something is close — the plan that lifts it.
 *
 * The numbers are get_plan_usage's, the same ones the database enforces, so a
 * meter that says "2 of 3" means the third will save.
 */
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { usePlanUsage } from '@/hooks/usePlanUsage';
import {
  LIMIT_META,
  METERED_KEYS,
  UPGRADE_PATH,
  nextPlanFor,
  shouldNudge,
  tierFor,
} from '@/lib/planLimits';
import { cn } from '@/lib/utils';

export function PlanUsageCard() {
  const { plan, status, isLoading } = usePlanUsage();
  if (isLoading || !plan) return null;

  const tier = tierFor(plan.plan_name);
  const rows = METERED_KEYS.map((key) => ({ key, s: status(key) }));
  const pressing = rows.filter((r) => shouldNudge(r.s));

  // The one plan that relieves the most pressing limits: the next tier up
  // for the first limit that is under pressure.
  const next = pressing.length > 0 ? nextPlanFor(pressing[0].key, plan.plan_name) : null;
  const relieves = next
    ? pressing
        .filter(({ key, s }) => {
          const limit = next.plan.limits[LIMIT_META[key].configKey];
          return limit === -1 || limit > s.limit;
        })
        .map(({ key }) => key)
    : [];

  const endsOn =
    plan.cancel_at_period_end && plan.current_period_end
      ? format(new Date(plan.current_period_end), 'MMM d')
      : null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-baseline justify-between gap-3 pb-3 sm:pb-4">
        <CardTitle className="text-base sm:text-lg">
          Your plan: <span className="font-semibold">{tier.name}</span>
        </CardTitle>
        <Link to={UPGRADE_PATH} className="text-sm font-medium text-primary hover:underline">
          Manage
        </Link>
      </CardHeader>
      <CardContent className="space-y-4">
        {endsOn && (
          <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
            {tier.name} ends on {endsOn}. After that your account moves to the Free limits —
            anything over them stays, but you won't be able to add more.
          </p>
        )}

        <ul className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
          {rows.map(({ key, s }) => {
            const { label, monthly } = LIMIT_META[key];
            const alarm = s.level === 'at' || s.level === 'over' || s.level === 'locked';
            return (
              <li key={key} className="space-y-1.5">
                <div className="flex items-baseline justify-between gap-2 text-sm">
                  <span className="capitalize">
                    {label}
                    {monthly && <span className="text-muted-foreground"> this month</span>}
                  </span>
                  <span
                    className={cn(
                      'tabular-nums',
                      alarm ? 'font-semibold text-amber-700' : 'text-muted-foreground'
                    )}
                  >
                    {s.level === 'unlimited'
                      ? `${s.used} · Unlimited`
                      : s.level === 'locked'
                        ? 'Not included'
                        : `${s.used} of ${s.limit}`}
                  </span>
                </div>
                {s.level !== 'unlimited' && s.level !== 'locked' && (
                  <Progress
                    value={s.percent}
                    className="h-1.5"
                    aria-label={`${s.used} of ${s.limit} ${label} used`}
                  />
                )}
              </li>
            );
          })}
        </ul>

        {next && (
          <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">
                {next.plan.name} (${next.plan.price_monthly}/mo)
              </span>{' '}
              raises your {relieves.map((key) => LIMIT_META[key].label).join(', ')}
              {relieves.length > 0 ? ' limit' : ''}
              {relieves.length > 1 ? 's' : ''}.
            </p>
            <Button asChild size="sm" className="min-h-[44px] flex-shrink-0 sm:min-h-0">
              <Link to={UPGRADE_PATH}>Upgrade to {next.plan.name}</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
