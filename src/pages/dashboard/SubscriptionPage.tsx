/**
 * Subscription Management Page
 *
 * Shows the agent's current plan, renewal date, a plan comparison table, and
 * actions to upgrade (Stripe Checkout) or manage billing (Stripe Customer
 * Portal). Recent invoices are shown when available.
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Check, Loader2, ExternalLink, CreditCard } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useSubscription } from '@/hooks/useSubscription';
import { useAuthStore } from '@/stores/useAuthStore';
import { useToast } from '@/hooks/use-toast';
import { edgeFunctions } from '@/lib/edgeFunctions';
import { PRICING_PLANS, type PricingTier } from '@/config/pricing-plans';
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
const FEATURE_ROWS: { key: keyof PricingTier['features']; label: string }[] = [
  { key: 'analytics', label: 'Analytics dashboard' },
  { key: 'customThemes', label: 'Custom themes' },
  { key: 'removeBranding', label: 'Remove AgentBio branding' },
  { key: 'customDomain', label: 'Custom domain' },
  { key: 'aiListingDescriptions', label: 'AI listing descriptions' },
  { key: 'leadScoring', label: 'Lead scoring' },
  { key: 'followUpSequences', label: 'Follow-up sequences' },
  { key: 'predictiveAnalytics', label: 'Predictive analytics' },
  { key: 'prioritySupport', label: 'Priority support' },
];

function renderFeatureValue(value: boolean | 'limited') {
  if (value === 'limited') return <span className="text-xs text-amber-600">Limited</span>;
  return value ? (
    <Check className="mx-auto h-4 w-4 text-green-600" />
  ) : (
    <span className="text-gray-300">—</span>
  );
}

export default function SubscriptionPage() {
  const { subscription, isLoading } = useSubscription();
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [actionPlan, setActionPlan] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  const currentPlanId = (subscription?.plan_name ?? 'free').toLowerCase();

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

  const handleUpgrade = async (plan: PricingTier) => {
    const priceId = plan.stripe_price_id_monthly;
    if (!priceId) {
      toast({ title: 'Unavailable', description: 'This plan is not purchasable yet.' });
      return;
    }
    setActionPlan(plan.id);
    try {
      const { data, error } = await edgeFunctions.invoke('create-checkout-session', {
        body: {
          priceId,
          successUrl: `${window.location.origin}/dashboard/subscription?status=success`,
          cancelUrl: `${window.location.origin}/dashboard/subscription`,
        },
      });
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Could not start checkout. Please try again.',
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
                <div className="text-sm text-muted-foreground">Renews</div>
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
          <CardTitle>Compare Plans</CardTitle>
          <CardDescription>Upgrade any time — changes are prorated by Stripe</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr>
                <th className="p-3 text-left font-medium text-muted-foreground">Feature</th>
                {PRICING_PLANS.map((plan) => (
                  <th key={plan.id} className="p-3 text-center">
                    <div className="font-semibold text-foreground">{plan.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {plan.price_monthly === 0 ? 'Free' : `$${plan.price_monthly}/mo`}
                    </div>
                    {currentPlanId === plan.id ? (
                      <span className="mt-2 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        Current
                      </span>
                    ) : plan.price_monthly > 0 ? (
                      <Button
                        size="sm"
                        className="mt-2"
                        onClick={() => handleUpgrade(plan)}
                        disabled={actionPlan === plan.id}
                      >
                        {actionPlan === plan.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          'Upgrade'
                        )}
                      </Button>
                    ) : null}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FEATURE_ROWS.map((row) => (
                <tr key={row.key} className="border-t border-border">
                  <td className="p-3 text-foreground">{row.label}</td>
                  {PRICING_PLANS.map((plan) => (
                    <td key={plan.id} className="p-3 text-center">
                      {renderFeatureValue(plan.features[row.key])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

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
                      className="inline-flex items-center gap-1 text-primary hover:underline"
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
