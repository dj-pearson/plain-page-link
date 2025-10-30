import { useState } from "react";
import { Check, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { SEOHead } from "@/components/SEOHead";

export default function Pricing() {
  const [isYearly, setIsYearly] = useState(false);
  const { plans, subscription } = useSubscription();
  const { toast } = useToast();

  const schema = {
    "@context": "https://schema.org",
    "@type": "ProductGroup",
    "name": "AgentBio Subscription Plans",
    "description": "Choose the perfect plan for your real estate business"
  };

  const handleSubscribe = async (priceId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Authentication required",
          description: "Please sign in to subscribe",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          priceId: isYearly ? priceId.replace('monthly', 'yearly') : priceId,
          successUrl: `${window.location.origin}/dashboard?subscription=success`,
          cancelUrl: `${window.location.origin}/pricing`,
        },
      });

      if (error) throw error;
      if (data.url) window.location.href = data.url;
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create checkout session",
        variant: "destructive",
      });
    }
  };

  const getPrice = (plan: any) => {
    const price = isYearly ? plan.price_yearly : plan.price_monthly;
    return price === 0 ? "Free" : `$${price}`;
  };

  const getPeriod = () => isYearly ? "/year" : "/month";

  const isCurrentPlan = (planName: string) => {
    return subscription?.plan_name === planName;
  };

  return (
    <>
      <SEOHead
        title="Pricing - AgentBio Professional Plans"
        description="Choose the perfect plan for your real estate business. Start free and scale as you grow with AgentBio."
        keywords={["real estate pricing", "agent subscriptions", "link in bio plans"]}
        canonicalUrl={`${window.location.origin}/pricing`}
        schema={schema}
      />
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Choose Your Plan
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Start free and scale as you grow
          </p>
          
          <div className="flex items-center justify-center gap-4">
            <span className={!isYearly ? "font-semibold" : "text-muted-foreground"}>Monthly</span>
            <Switch checked={isYearly} onCheckedChange={setIsYearly} />
            <span className={isYearly ? "font-semibold" : "text-muted-foreground"}>
              Yearly <span className="text-primary text-sm">(Save 17%)</span>
            </span>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {plans?.map((plan) => (
            <Card 
              key={plan.id}
              className={`relative ${
                plan.name === 'professional' 
                  ? 'border-primary shadow-lg shadow-primary/20 scale-105' 
                  : ''
              }`}
            >
              {plan.name === 'professional' && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Most Popular
                </div>
              )}

              <CardHeader>
                <CardTitle className="text-2xl capitalize">{plan.name}</CardTitle>
                <CardDescription>
                  <span className="text-4xl font-bold text-foreground">
                    {getPrice(plan)}
                  </span>
                  {plan.price_monthly > 0 && (
                    <span className="text-muted-foreground">{getPeriod()}</span>
                  )}
                  {plan.name === 'team' && (
                    <div className="text-sm mt-2">per agent (5 minimum)</div>
                  )}
                </CardDescription>
              </CardHeader>

              <CardContent>
                <ul className="space-y-3">
                  {plan.limits.listings !== undefined && (
                    <li className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">
                        {plan.limits.listings === -1 ? 'Unlimited' : plan.limits.listings} active listings
                      </span>
                    </li>
                  )}
                  {plan.limits.links !== undefined && (
                    <li className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">
                        {plan.limits.links === -1 ? 'Unlimited' : plan.limits.links} custom links
                      </span>
                    </li>
                  )}
                  {plan.limits.testimonials !== undefined && plan.limits.testimonials > 0 && (
                    <li className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">
                        {plan.limits.testimonials === -1 ? 'Unlimited' : plan.limits.testimonials} testimonials
                      </span>
                    </li>
                  )}
                  {plan.limits.analytics_days && (
                    <li className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">
                        {plan.limits.analytics_days === -1 ? 'Unlimited' : `${plan.limits.analytics_days}-day`} analytics
                      </span>
                    </li>
                  )}
                  {Object.entries(plan.features).map(([key, value]) => 
                    value && (
                      <li key={key} className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                        <span className="text-sm capitalize">
                          {key.replace(/_/g, ' ')}
                        </span>
                      </li>
                    )
                  )}
                </ul>
              </CardContent>

              <CardFooter>
                <Button
                  className="w-full"
                  variant={plan.name === 'professional' ? 'default' : 'outline'}
                  disabled={isCurrentPlan(plan.name) || plan.name === 'enterprise'}
                  onClick={() => plan.stripe_price_id && handleSubscribe(plan.stripe_price_id)}
                >
                  {isCurrentPlan(plan.name) 
                    ? 'Current Plan' 
                    : plan.name === 'free' 
                    ? 'Get Started' 
                    : plan.name === 'enterprise'
                    ? 'Contact Sales'
                    : 'Subscribe'}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        <div className="mt-16 text-center">
          <h3 className="text-2xl font-bold mb-4">Add-Ons Available</h3>
          <div className="grid md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <Card className="p-4">
              <p className="font-semibold">Premium Themes</p>
              <p className="text-sm text-muted-foreground">$15 one-time</p>
            </Card>
            <Card className="p-4">
              <p className="font-semibold">MLS Integration</p>
              <p className="text-sm text-muted-foreground">$25/month</p>
            </Card>
            <Card className="p-4">
              <p className="font-semibold">CRM Connectors</p>
              <p className="text-sm text-muted-foreground">$20/month each</p>
            </Card>
            <Card className="p-4">
              <p className="font-semibold">SMS Notifications</p>
              <p className="text-sm text-muted-foreground">$15/month</p>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}