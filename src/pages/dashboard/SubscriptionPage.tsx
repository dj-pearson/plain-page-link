/**
 * Subscription Management Page
 *
 * Shows the agent's current plan, renewal date, a plan comparison table, and
 * actions to upgrade (Stripe Checkout) or manage billing (Stripe Customer
 * Portal). Recent invoices are shown when available.
 */

import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { clearPlanIntent } from '@/lib/signupIntent';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Loader2, ExternalLink, CreditCard, CircleCheck, Clock, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useSubscription, stripePriceIdFor, type SubscriptionPlan } from '@/hooks/useSubscription';
import { useAuthStore } from '@/stores/useAuthStore';
import { useToast } from '@/hooks/use-toast';
import { edgeFunctions } from '@/lib/edgeFunctions';
import { usePlanUsage } from '@/hooks/usePlanUsage';
import { useCheckoutReturn } from '@/hooks/useCheckoutReturn';
import {
  CHECKOUT_PLAN_PARAM,
  CHECKOUT_STATUS_PARAM,
  CHECKOUT_RETURN_PATH,
  checkoutSuccessUrl,
} from '@/lib/checkoutReturn';
import { PlanChangeConfirmDialog } from '@/components/dashboard/PlanChangeConfirmDialog';
// The feature keys the comparison table shows. Names only — the values come
// from subscription_plans.features, which is the source of truth (US-118).
type PlanFeatureKey =
  | 'analytics'
  | 'customThemes'
  | 'leadScoring'
  | 'aiListingDescriptions'
  | 'customDomain'
  | 'removeBranding'
  | 'prioritySupport';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface InvoiceRow {
  stripe_invoice_id: string;
  amount: number;
  currency: string | null;
  status: string;
  paid_at: string | null;
  hosted_invoice_url: string | null;
}

// Representative features shown in the comparison table.
const FEATURE_ROWS: { key: PlanFeatureKey; label: string }[] = [
  { key: 'analytics', label: 'Analytics dashboard' },
  { key: 'customThemes', label: 'Custom themes' },
  { key: 'removeBranding', label: 'Remove AgentBio branding' },
  { key: 'customDomain', label: 'Custom domain' },
  { key: 'aiListingDescriptions', label: 'AI listing descriptions' },
  { key: 'leadScoring', label: 'Lead scoring' },
  { key: 'prioritySupport', label: 'Priority support' },
];

function renderFeatureValue(value: boolean) {
  return value ? (
    <Check className="mx-auto h-4 w-4 text-green-600" />
  ) : (
    <span className="text-gray-300">—</span>
  );
}

export default function SubscriptionPage() {
  const { subscription, plans = [], isLoading } = useSubscription();
  const [interval, setInterval] = useState<'month' | 'year'>('month');
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [actionPlan, setActionPlan] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  const queryClient = useQueryClient();
  // US-232: arriving from onboarding with ?checkout=<plan> — the plan chosen
  // on /pricing before signing up — opens checkout for it, once (see below).
  const [searchParams, setSearchParams] = useSearchParams();
  const currentPlanId = (subscription?.plan_name ?? 'free').toLowerCase();
  const currentPlan = plans.find((p) => p.name === currentPlanId);
  /** Upgrade or downgrade, by list price against the plan the agent is on. */
  const isDowngrade = (plan: SubscriptionPlan) =>
    Number(plan.price_monthly) < Number(currentPlan?.price_monthly ?? 0);
  const changeLabel = (plan: SubscriptionPlan) => (isDowngrade(plan) ? 'Downgrade' : 'Upgrade');
  // Already paying: a change is applied to the live subscription at once, so
  // it waits for a yes in PlanChangeConfirmDialog (US-258).
  const [pendingChange, setPendingChange] = useState<{
    plan: SubscriptionPlan;
    interval: 'month' | 'year';
  } | null>(null);
  const { plan: planUsage } = usePlanUsage();
  const checkoutReturn = useCheckoutReturn(subscription?.plan_name);

  const { data: invoices } = useQuery({
    queryKey: ['billing-invoices', user?.id],
    enabled: !!user?.id,
    queryFn: async (): Promise<InvoiceRow[]> => {
      // The invoices table isn't in the (out-of-sync) generated types and may
      // not exist in every environment — cast is isolated here and errors are
      // tolerated (returns []).
      const client = supabase as unknown as {
        from: (t: string) => {
          select: (c: string) => {
            order: (
              c: string,
              o: { ascending: boolean }
            ) => { limit: (n: number) => Promise<{ data: InvoiceRow[] | null; error: unknown }> };
          };
        };
      };
      const { data, error } = await client
        .from('invoices')
        .select('stripe_invoice_id, amount, currency, status, paid_at, hosted_invoice_url')
        .order('paid_at', { ascending: false })
        .limit(5);
      if (error) return [];
      return data ?? [];
    },
  });

  const handleUpgrade = async (
    plan: SubscriptionPlan,
    chosenInterval: 'month' | 'year' = interval
  ) => {
    // From the plan row, at the interval the agent chose. This read
    // plan.stripe_price_id_monthly off src/config/pricing-plans.ts, whose
    // values were the literals 'price_starter_monthly' and friends — not price
    // ids that exist in any Stripe account. create-checkout-session only checks
    // /^price_/, so they passed validation and Stripe answered "No such price",
    // which reached the agent as "Could not start checkout" (US-118).
    const priceId = stripePriceIdFor(plan, chosenInterval);
    if (!priceId) {
      toast({
        title: 'Not available yet',
        description: `${plan.name} has no ${chosenInterval === 'year' ? 'annual' : 'monthly'} price configured. Please contact support.`,
      });
      return;
    }
    setActionPlan(plan.name);
    try {
      const { data, error } = await edgeFunctions.invoke('create-checkout-session', {
        body: {
          priceId,
          successUrl: checkoutSuccessUrl(window.location.origin, plan.name),
          cancelUrl: `${window.location.origin}${CHECKOUT_RETURN_PATH}`,
        },
      });
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
        return;
      }
      // Already subscribed: Stripe changed the existing subscription in place
      // (prorated) instead of opening a second one (US-217). The webhook
      // records it; the same wait a Checkout return gets shows it arriving.
      if (data && 'changed' in data) {
        if (data.changed) {
          const next = new URLSearchParams(searchParams);
          next.set(CHECKOUT_STATUS_PARAM, 'success');
          next.set(CHECKOUT_PLAN_PARAM, plan.name);
          setSearchParams(next, { replace: true });
        } else {
          toast({ title: `You're already on ${plan.name}` });
          void queryClient.invalidateQueries({ queryKey: ['user-subscription'] });
        }
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Could not change your plan. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setActionPlan(null);
    }
  };

  const handleManageBilling = async () => {
    setPortalLoading(true);
    try {
      const { data, error } = await edgeFunctions.invoke('create-portal-session', {
        body: { returnUrl: `${window.location.origin}/dashboard/subscription` },
      });
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Could not open the billing portal. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setPortalLoading(false);
    }
  };

  /** Free agents go straight to Checkout; paying agents confirm first. */
  const requestChange = (plan: SubscriptionPlan, chosenInterval: 'month' | 'year' = interval) => {
    if (currentPlanId === 'free') {
      void handleUpgrade(plan, chosenInterval);
    } else {
      setPendingChange({ plan, interval: chosenInterval });
    }
  };

  const confirmChange = () => {
    if (!pendingChange) return;
    const { plan, interval: chosen } = pendingChange;
    setPendingChange(null);
    void handleUpgrade(plan, chosen);
  };
  const autoCheckout = useRef(false);
  useEffect(() => {
    const wanted = searchParams.get('checkout');
    if (!wanted || autoCheckout.current || isLoading || plans.length === 0) return;
    autoCheckout.current = true;
    clearPlanIntent();
    const chosen: 'month' | 'year' = searchParams.get('interval') === 'year' ? 'year' : 'month';
    const next = new URLSearchParams(searchParams);
    next.delete('checkout');
    next.delete('interval');
    setSearchParams(next, { replace: true });
    const plan = plans.find((p) => p.name === wanted.toLowerCase());
    if (plan && plan.name !== currentPlanId) {
      setInterval(chosen);
      requestChange(plan, chosen);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, isLoading, plans]);

  const formatDate = (iso?: string) =>
    iso
      ? new Date(iso).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : '—';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Subscription &amp; Billing</h1>
        <p className="text-muted-foreground">Manage your plan, billing, and invoices</p>
      </div>

      {checkoutReturn.phase !== 'idle' && (
        <CheckoutReturnBanner
          phase={checkoutReturn.phase}
          planName={checkoutReturn.targetPlan ?? subscription?.plan_name ?? null}
          onDismiss={checkoutReturn.dismiss}
        />
      )}

      {/* Current plan */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>Current Plan</CardTitle>
              <CardDescription>Your active AgentBio subscription</CardDescription>
            </div>
            <Button variant="outline" onClick={handleManageBilling} disabled={portalLoading}>
              {portalLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CreditCard className="mr-2 h-4 w-4" />
              )}
              Manage Billing
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading…
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <div className="text-sm text-muted-foreground">Plan</div>
                <div className="text-lg font-semibold capitalize text-foreground">
                  {subscription?.plan_name ?? 'Free'}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Status</div>
                <div className="text-lg font-semibold capitalize text-foreground">
                  {subscription?.status ?? 'active'}
                </div>
              </div>
              <div>
                {/* A subscription set to cancel does not renew: it ends. */}
                <div className="text-sm text-muted-foreground">
                  {subscription?.cancel_at_period_end ? 'Ends' : 'Renews'}
                </div>
                <div className="text-lg font-semibold text-foreground">
                  {formatDate(subscription?.current_period_end)}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Plan comparison */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>Compare Plans</CardTitle>
              <CardDescription>
                Change plan any time — Stripe prorates the difference
              </CardDescription>
            </div>
            {/* Annual prices existed in the plan rows and there was no way to
                buy one: the upgrade button always sent the monthly id. */}
            <div
              className="inline-flex rounded-lg border border-border p-0.5"
              role="group"
              aria-label="Billing interval"
            >
              {(['month', 'year'] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setInterval(value)}
                  aria-pressed={interval === value}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                    interval === value
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {value === 'month' ? 'Monthly' : 'Yearly'}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr>
                <th className="p-3 text-left font-medium text-muted-foreground">Feature</th>
                {plans.map((plan) => {
                  const price = interval === 'year' ? plan.price_yearly : plan.price_monthly;
                  const purchasable = Number(price) > 0 && !!stripePriceIdFor(plan, interval);
                  return (
                    <th key={plan.name} className="p-3 text-center">
                      <div className="font-semibold capitalize text-foreground">{plan.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {Number(price) === 0
                          ? 'Free'
                          : `$${Number(price)}/${interval === 'year' ? 'yr' : 'mo'}`}
                      </div>
                      {currentPlanId === plan.name ? (
                        <span className="mt-2 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                          Current
                        </span>
                      ) : Number(price) > 0 ? (
                        <Button
                          size="sm"
                          className="mt-2"
                          onClick={() => requestChange(plan)}
                          disabled={actionPlan === plan.name || !purchasable}
                          // A plan with no Stripe price is not purchasable. It
                          // used to send a placeholder id and fail at Stripe.
                          title={purchasable ? undefined : 'Not available for purchase yet'}
                        >
                          {actionPlan === plan.name ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : currentPlanId === 'free' ? (
                            'Upgrade'
                          ) : (
                            changeLabel(plan)
                          )}
                        </Button>
                      ) : null}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {FEATURE_ROWS.map((row) => (
                <tr key={row.key} className="border-t border-border">
                  <td className="p-3 text-foreground">{row.label}</td>
                  {plans.map((plan) => (
                    <td key={plan.name} className="p-3 text-center">
                      {renderFeatureValue(plan.features?.[row.key] === true)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <PlanChangeConfirmDialog
        plan={pendingChange?.plan ?? null}
        interval={pendingChange?.interval ?? interval}
        currentPlanName={currentPlanId}
        isDowngrade={pendingChange ? isDowngrade(pendingChange.plan) : false}
        cancelAtPeriodEnd={subscription?.cancel_at_period_end === true}
        usage={planUsage?.usage}
        onConfirm={confirmChange}
        onCancel={() => setPendingChange(null)}
      />

      {/* Billing history */}
      {invoices && invoices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Invoices</CardTitle>
            <CardDescription>Your most recent payments</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-border">
              {invoices.map((inv) => (
                <li
                  key={inv.stripe_invoice_id}
                  className="flex items-center justify-between py-3 text-sm"
                >
                  <span className="text-foreground">{formatDate(inv.paid_at ?? undefined)}</span>
                  <span className="text-foreground">
                    {inv.currency ? `${inv.currency.toUpperCase()} ` : '$'}
                    {Number(inv.amount).toFixed(2)}
                  </span>
                  <span className="capitalize text-muted-foreground">{inv.status}</span>
                  {inv.hosted_invoice_url ? (
                    <a
                      href={inv.hosted_invoice_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-primary underline hover:no-underline"
                    >
                      View <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <span />
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

const capitalise = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** What the agent sees on returning from Checkout, or after a plan change. */
function CheckoutReturnBanner({
  phase,
  planName,
  onDismiss,
}: {
  phase: 'waiting' | 'confirmed' | 'processing';
  planName: string | null;
  onDismiss: () => void;
}) {
  const plan = planName ? capitalise(planName) : 'your new plan';
  const content = {
    waiting: {
      icon: <Loader2 className="h-5 w-5 animate-spin text-primary" aria-hidden="true" />,
      title: 'Confirming your plan',
      body: `Stripe has accepted it; activating ${plan} here usually takes a few seconds.`,
    },
    confirmed: {
      icon: <CircleCheck className="h-5 w-5 text-green-600" aria-hidden="true" />,
      title: `You're on ${plan}`,
      body: 'Your new limits and features are active now.',
    },
    processing: {
      icon: <Clock className="h-5 w-5 text-primary" aria-hidden="true" />,
      title: 'Still processing',
      body: `Stripe accepted it but has not confirmed ${plan} to us yet. Refresh this page in a minute; if it still shows your old plan, contact support.`,
    },
  }[phase];

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-start gap-3 rounded-xl border border-border bg-primary/5 p-4"
    >
      <div className="mt-0.5 shrink-0">{content.icon}</div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-foreground">{content.title}</p>
        <p className="text-sm text-foreground/80">{content.body}</p>
      </div>
      {phase !== 'waiting' && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="-m-1.5 shrink-0 rounded-md p-2.5 text-foreground/70 hover:bg-primary/10 hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
