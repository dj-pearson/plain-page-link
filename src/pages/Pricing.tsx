import * as React from "react";
import { useState } from "react";
import { Check, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { SEOHead } from "@/components/SEOHead";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { Breadcrumbs } from "@/components/Breadcrumbs";

export default function Pricing() {
  const [isYearly, setIsYearly] = useState(false);
  const { plans, subscription } = useSubscription();
  const { toast } = useToast();

  // Generate comprehensive schema for pricing page
  const generatePricingSchema = () => {
    const baseUrl = window.location.origin;

    return {
      "@context": "https://schema.org",
      "@graph": [
        // Main Product for the service
        {
          "@type": "Product",
          "@id": `${baseUrl}/pricing#product`,
          "name": "AgentBio - Real Estate Agent Portfolio Platform",
          "description": "Professional portfolio platform for real estate agents to showcase listings, capture leads, and grow their business online.",
          "brand": {
            "@type": "Brand",
            "name": "AgentBio"
          },
          "category": "Business Software",
          "offers": plans?.map((plan) => ({
            "@type": "Offer",
            "@id": `${baseUrl}/pricing#offer-${plan.name}`,
            "name": `${plan.name.charAt(0).toUpperCase() + plan.name.slice(1)} Plan`,
            "description": `AgentBio ${plan.name} plan with ${
              plan.limits.listings === -1 ? 'unlimited' : plan.limits.listings
            } listings and ${
              plan.limits.links === -1 ? 'unlimited' : plan.limits.links
            } custom links`,
            "price": plan.price_monthly.toString(),
            "priceCurrency": "USD",
            "priceSpecification": {
              "@type": "UnitPriceSpecification",
              "price": plan.price_monthly,
              "priceCurrency": "USD",
              "unitText": "MONTH"
            },
            "availability": "https://schema.org/InStock",
            "url": `${baseUrl}/pricing`,
            "seller": {
              "@type": "Organization",
              "name": "AgentBio"
            },
            ...(plan.price_yearly > 0 && {
              "priceValidUntil": new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]
            })
          })) || []
        },
        // WebPage schema
        {
          "@type": "WebPage",
          "@id": `${baseUrl}/pricing#webpage`,
          "url": `${baseUrl}/pricing`,
          "name": "Pricing - AgentBio Professional Plans",
          "description": "Choose the perfect plan for your real estate business. Start free and scale as you grow with AgentBio.",
          "isPartOf": {
            "@id": `${baseUrl}/#website`
          }
        },
        // BreadcrumbList
        {
          "@type": "BreadcrumbList",
          "itemListElement": [
            {
              "@type": "ListItem",
              "position": 1,
              "name": "Home",
              "item": baseUrl
            },
            {
              "@type": "ListItem",
              "position": 2,
              "name": "Pricing",
              "item": `${baseUrl}/pricing`
            }
          ]
        },
        // FAQPage for common pricing questions
        {
          "@type": "FAQPage",
          "mainEntity": [
            {
              "@type": "Question",
              "name": "How much does AgentBio cost?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "AgentBio offers four pricing tiers: Free ($0), Starter ($19/month), Professional ($39/month), and Team ($29/agent/month with 5 agent minimum). Annual plans save 17%."
              }
            },
            {
              "@type": "Question",
              "name": "Can I start with the free plan?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Yes! AgentBio offers a free plan with 3 active listings, 5 custom links, basic analytics, and lead capture forms. No credit card required to get started."
              }
            },
            {
              "@type": "Question",
              "name": "Can I upgrade or downgrade my plan?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Absolutely! You can upgrade or downgrade your AgentBio plan at any time from your dashboard settings. Changes take effect immediately, and billing is prorated."
              }
            },
            {
              "@type": "Question",
              "name": "Do you offer annual billing?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Yes, we offer annual billing with a 17% discount compared to monthly billing. Pay for 10 months and get 12 months of service."
              }
            },
            {
              "@type": "Question",
              "name": "What payment methods do you accept?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "We accept all major credit cards (Visa, Mastercard, American Express, Discover) through our secure payment processor Stripe. All payments are encrypted and PCI compliant."
              }
            }
          ]
        }
      ]
    };
  };

  const schema = generatePricingSchema();

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
      <div className="min-h-screen flex flex-col">
      {/* Header */}
      <PublicHeader />
      <div className="bg-gradient-to-br from-background via-background to-primary/5 py-20 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumbs */}
        <div className="mb-8">
          <Breadcrumbs items={[{ name: "Pricing", href: "/pricing" }]} />
        </div>

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
                  disabled={
                    isCurrentPlan(plan.name) || 
                    plan.name === 'enterprise' || 
                    !plan.stripe_price_id
                  }
                  onClick={() => plan.stripe_price_id && handleSubscribe(plan.stripe_price_id)}
                  asChild={plan.name === 'free'}
                >
                  {plan.name === 'free' ? (
                    <Link to="/register">Get Started</Link>
                  ) : isCurrentPlan(plan.name) ? (
                    'Current Plan'
                  ) : plan.name === 'enterprise' ? (
                    'Contact Sales'
                  ) : !plan.stripe_price_id ? (
                    'Coming Soon'
                  ) : (
                    'Subscribe'
                  )}
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

        {/* FAQ Section */}
        <div className="mt-20">
          <h2 className="text-3xl font-bold text-center mb-8">Pricing Questions</h2>
          <div className="max-w-3xl mx-auto space-y-4">
            <FAQItem
              question="How much does AgentBio cost?"
              answer="AgentBio offers four pricing tiers: Free ($0), Starter ($19/month), Professional ($39/month), and Team ($29/agent/month with 5 agent minimum). Annual plans save 17%."
            />
            <FAQItem
              question="Can I start with the free plan?"
              answer="Yes! AgentBio offers a free plan with 3 active listings, 5 custom links, basic analytics, and lead capture forms. No credit card required to get started."
            />
            <FAQItem
              question="Can I upgrade or downgrade my plan?"
              answer="Absolutely! You can upgrade or downgrade your AgentBio plan at any time from your dashboard settings. Changes take effect immediately, and billing is prorated."
            />
            <FAQItem
              question="Do you offer annual billing?"
              answer="Yes, we offer annual billing with a 17% discount compared to monthly billing. Pay for 10 months and get 12 months of service."
            />
            <FAQItem
              question="What payment methods do you accept?"
              answer="We accept all major credit cards (Visa, Mastercard, American Express, Discover) through our secure payment processor Stripe. All payments are encrypted and PCI compliant."
            />
          </div>
        </div>
        </div>
      </div>

      {/* Footer */}
      <PublicFooter />
      </div>
    </>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <Card className="overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-muted/50 transition-colors"
        aria-expanded={isOpen}
      >
        <h3 className="text-lg font-semibold pr-4">{question}</h3>
        <svg
          className={`w-5 h-5 text-primary transition-transform flex-shrink-0 ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <CardContent className="pt-0 pb-4">
          <p className="text-muted-foreground leading-relaxed">{answer}</p>
        </CardContent>
      )}
    </Card>
  );
}
