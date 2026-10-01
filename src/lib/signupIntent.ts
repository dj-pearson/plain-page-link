/**
 * What a visitor meant to do when they signed up (US-232).
 *
 *  - The plan they picked. Subscribe on /pricing, logged out, used to show an
 *    "Authentication required" toast and stop — the most purchase-ready visitor
 *    on the site was dropped. The plan now rides through registration and
 *    onboarding to checkout.
 *  - Who sent them. Every free profile shows "Powered by AgentBio", and the
 *    link carried nothing, so signups from it could not be counted, let alone
 *    rewarded. ?ref=<username> is kept and written to profiles.referred_by.
 *
 * localStorage, not sessionStorage: email verification opens a new tab.
 * Every access is guarded; an intent that cannot be stored is simply lost.
 */

const PLAN_KEY = 'agentbio:plan-intent';
const REF_KEY = 'agentbio:referral';
const PLAN_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const REF_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export type BillingInterval = 'month' | 'year';
export interface PlanIntent {
  plan: string;
  interval: BillingInterval;
}
export interface Referral {
  ref: string;
  source?: string;
}

const PLAN_RE = /^[a-z][a-z0-9_-]{1,30}$/;
const REF_RE = /^[a-z0-9][a-z0-9_-]{0,39}$/;

function read<T>(key: string, ttl: number): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as T & { at?: number };
    if (typeof parsed.at !== 'number' || Date.now() - parsed.at > ttl) return null;
    return parsed;
  } catch {
    return null;
  }
}

function write(key: string, value: object): void {
  try {
    localStorage.setItem(key, JSON.stringify({ ...value, at: Date.now() }));
  } catch {
    /* storage unavailable */
  }
}

/** The register URL a logged-out Subscribe sends the visitor to. */
export function registerUrlForPlan(plan: string, interval: BillingInterval): string {
  return `/auth/register?plan=${encodeURIComponent(plan)}&interval=${interval}`;
}

/** Called on /auth/register: keep ?plan= and ?interval= if present. */
export function capturePlanIntent(search: string): PlanIntent | null {
  const params = new URLSearchParams(search);
  const plan = params.get('plan')?.toLowerCase() ?? '';
  if (!PLAN_RE.test(plan) || plan === 'free') return readPlanIntent();
  const intent: PlanIntent = { plan, interval: params.get('interval') === 'year' ? 'year' : 'month' };
  write(PLAN_KEY, intent);
  return intent;
}

export function readPlanIntent(): PlanIntent | null {
  const stored = read<PlanIntent>(PLAN_KEY, PLAN_TTL_MS);
  return stored && PLAN_RE.test(stored.plan) ? { plan: stored.plan, interval: stored.interval === 'year' ? 'year' : 'month' } : null;
}

export function clearPlanIntent(): void {
  try {
    localStorage.removeItem(PLAN_KEY);
  } catch {
    /* nothing to clear */
  }
}

/**
 * Called on every page load: keep ?ref= if present. First touch wins — a
 * later visit from somewhere else does not take the credit away.
 */
export function captureReferral(search: string): Referral | null {
  const existing = readReferral();
  if (existing) return existing;
  const params = new URLSearchParams(search);
  const ref = params.get('ref')?.trim().toLowerCase() ?? '';
  if (!REF_RE.test(ref)) return null;
  const source = params.get('utm_source')?.trim().slice(0, 100) || undefined;
  const referral: Referral = { ref, ...(source ? { source } : {}) };
  write(REF_KEY, referral);
  return referral;
}

export function readReferral(): Referral | null {
  const stored = read<Referral>(REF_KEY, REF_TTL_MS);
  return stored && REF_RE.test(stored.ref) ? { ref: stored.ref, ...(stored.source ? { source: stored.source } : {}) } : null;
}

/** The "Powered by" link on a free profile, attributed to its owner. */
export function poweredByUrl(username: string | null | undefined): string {
  const url = new URL('https://agentbio.net/');
  url.searchParams.set('utm_source', 'profile_badge');
  url.searchParams.set('utm_medium', 'referral');
  if (username && REF_RE.test(username.toLowerCase())) url.searchParams.set('ref', username.toLowerCase());
  return url.toString();
}
