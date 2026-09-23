/**
 * Plan limits, as the dashboard talks about them.
 *
 * The database decides (20260923000002: plan_limit / plan_usage, enforced by
 * triggers, read through get_plan_usage). This module only words and weighs
 * those numbers: how full a meter is, when to nudge, which plan lifts the
 * ceiling, and how to recognise the error a trigger raises.
 */
import { PRICING_PLANS, type PlanLimits, type PricingTier } from '@/config/pricing-plans';

/** Where an agent changes plan. */
export const UPGRADE_PATH = '/dashboard/subscription';

/** Every key get_plan_usage reports. */
export type PlanLimitKey =
  | 'listings'
  | 'sold_properties'
  | 'links'
  | 'testimonials'
  | 'contacts'
  | 'open_houses_per_month'
  | 'leads_per_month'
  | 'analytics_days';

interface LimitMeta {
  /** Plural noun: "active listings". */
  label: string;
  /** Resets each calendar month. */
  monthly: boolean;
  /** Blocked in the database at the limit, or only nudged. */
  enforced: boolean;
  /** The matching field in pricing-plans.ts, for "which plan has more". */
  configKey: keyof PlanLimits;
}

export const LIMIT_META: Record<PlanLimitKey, LimitMeta> = {
  listings: { label: 'active listings', monthly: false, enforced: true, configKey: 'listings' },
  sold_properties: {
    label: 'sold properties',
    monthly: false,
    enforced: true,
    configKey: 'soldProperties',
  },
  links: { label: 'links', monthly: false, enforced: true, configKey: 'links' },
  testimonials: {
    label: 'testimonials',
    monthly: false,
    enforced: true,
    configKey: 'testimonials',
  },
  contacts: { label: 'clients', monthly: false, enforced: true, configKey: 'contacts' },
  open_houses_per_month: {
    label: 'open houses',
    monthly: true,
    enforced: true,
    configKey: 'openHousesPerMonth',
  },
  // Leads are never refused — a visitor's enquiry always lands. The limit
  // drives a nudge, not a block.
  leads_per_month: { label: 'leads', monthly: true, enforced: false, configKey: 'leadsPerMonth' },
  analytics_days: {
    label: 'days of analytics',
    monthly: false,
    enforced: true,
    configKey: 'analyticsRetentionDays',
  },
};

/** Shown as meters on the dashboard, in this order. */
export const METERED_KEYS: PlanLimitKey[] = [
  'listings',
  'contacts',
  'open_houses_per_month',
  'leads_per_month',
  'links',
  'testimonials',
  'sold_properties',
];

/** The share of a limit at which the dashboard starts nudging. */
export const NEAR_LIMIT_RATIO = 0.8;

export type LimitLevel = 'unlimited' | 'ok' | 'near' | 'at' | 'over' | 'locked';

export interface LimitStatus {
  level: LimitLevel;
  used: number;
  /** -1 is unlimited. */
  limit: number;
  /** Infinity when unlimited. */
  remaining: number;
  /** 0–100, capped; 0 when unlimited. */
  percent: number;
  /** Whether one more may be added. */
  canAdd: boolean;
}

export function limitStatus(used: number, limit: number): LimitStatus {
  if (limit === -1) {
    return { level: 'unlimited', used, limit, remaining: Infinity, percent: 0, canAdd: true };
  }
  if (limit === 0) {
    return { level: 'locked', used, limit, remaining: 0, percent: 100, canAdd: false };
  }
  const remaining = Math.max(0, limit - used);
  const percent = Math.min(100, Math.round((used / limit) * 100));
  const level: LimitLevel =
    used > limit
      ? 'over'
      : used === limit
        ? 'at'
        : used / limit >= NEAR_LIMIT_RATIO
          ? 'near'
          : 'ok';
  return { level, used, limit, remaining, percent, canAdd: used < limit };
}

/** True when the dashboard should say something about this limit. */
export function shouldNudge(status: LimitStatus): boolean {
  return (
    status.level === 'near' ||
    status.level === 'at' ||
    status.level === 'over' ||
    status.level === 'locked'
  );
}

/** "10 active listings", "Unlimited clients", "5 open houses a month". */
export function describeLimit(key: PlanLimitKey, limit: number): string {
  const { label, monthly } = LIMIT_META[key];
  if (key === 'analytics_days') {
    return limit === -1 ? 'Unlimited analytics history' : `${limit} days of analytics`;
  }
  if (limit === -1) return `Unlimited ${label}`;
  return `${limit.toLocaleString()} ${label}${monthly ? ' a month' : ''}`;
}

/** The plan's own tier, from get_plan_usage's plan_name. Unknown → free. */
export function tierFor(planName: string | null | undefined): PricingTier {
  return PRICING_PLANS.find((p) => p.id === planName) ?? PRICING_PLANS[0];
}

/**
 * The cheapest plan above the current one that raises this limit, and what it
 * raises it to. Null when nothing does (the agent is on the top tier for it).
 */
export function nextPlanFor(
  key: PlanLimitKey,
  currentPlanName: string | null | undefined
): { plan: PricingTier; limit: number } | null {
  const current = tierFor(currentPlanName);
  const currentIndex = PRICING_PLANS.indexOf(current);
  const configKey = LIMIT_META[key].configKey;
  const currentLimit = current.limits[configKey];
  if (currentLimit === -1) return null;

  for (const plan of PRICING_PLANS.slice(currentIndex + 1)) {
    const limit = plan.limits[configKey];
    if (limit === -1 || limit > currentLimit) return { plan, limit };
  }
  return null;
}

/** "Starter ($29/mo) includes 10 active listings." */
export function upgradePitch(
  key: PlanLimitKey,
  currentPlanName: string | null | undefined
): string | null {
  const next = nextPlanFor(key, currentPlanName);
  if (!next) return null;
  return `${next.plan.name} ($${next.plan.price_monthly}/mo) includes ${describeLimit(key, next.limit).replace(/^Unlimited/, 'unlimited')}.`;
}

/**
 * The limit a database error is about, or null if it is not a plan limit.
 *
 * The triggers raise check_violation with DETAIL `plan_limit:<key>`; PostgREST
 * passes it through as `details`. The message is checked as a fallback for
 * callers that only kept the message.
 */
export function planLimitKeyFromError(error: unknown): PlanLimitKey | null {
  if (!error || typeof error !== 'object') return null;
  const e = error as { details?: unknown; message?: unknown };
  const text = [e.details, e.message].filter((v): v is string => typeof v === 'string').join(' ');
  const match = /plan_limit:([a-z_]+)/.exec(text);
  if (match && match[1] in LIMIT_META) return match[1] as PlanLimitKey;
  return null;
}
