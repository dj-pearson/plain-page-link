import { r as reactExports, j as jsxRuntimeExports, L as Link } from "./react-vendor-MTOt5FFF.js";
import { k as SEOHead, w as Switch, C as Card, f as CardHeader, g as CardTitle, h as CardDescription, o as CardContent, i as CardFooter, j as Button } from "./ui-components-CbrOUI4e.js";
import { u as useSubscription } from "./useSubscription-ZIHUxbHZ.js";
import { s as supabase } from "./supabase-eNUZs_JT.js";
import { u as useToast, P as PublicHeader, a as PublicFooter } from "./index-CAwD2FR9.js";
import { B as Breadcrumbs } from "./Breadcrumbs-EhxiyXqZ.js";
import { Z as Zap, b as Check } from "./icons-CFSiufIk.js";
import "./charts-BvRX79AF.js";
import "./utils-DRaK7sdV.js";
import "./data-kszmrHwg.js";
import "./three-addons-w2uoJ2aN.js";
import "./three-D20jh1h6.js";
import "./state-stores-BzsyoW3J.js";
import "./forms-xSDtUvSX.js";
function Pricing() {
  const [isYearly, setIsYearly] = reactExports.useState(false);
  const { plans, subscription } = useSubscription();
  const { toast } = useToast();
  const generatePricingSchema = () => {
    const baseUrl = window.location.origin;
    return {
      "@context": "https://schema.org",
      "@graph": [
        // Main Product for the service
        {
          "@type": "Product",
          "@id": "".concat(baseUrl, "/pricing#product"),
          "name": "AgentBio - Real Estate Agent Portfolio Platform",
          "description": "Professional portfolio platform for real estate agents to showcase listings, capture leads, and grow their business online.",
          "brand": {
            "@type": "Brand",
            "name": "AgentBio"
          },
          "category": "Business Software",
          "offers": (plans == null ? void 0 : plans.map((plan) => ({
            "@type": "Offer",
            "@id": "".concat(baseUrl, "/pricing#offer-").concat(plan.name),
            "name": "".concat(plan.name.charAt(0).toUpperCase() + plan.name.slice(1), " Plan"),
            "description": "AgentBio ".concat(plan.name, " plan with ").concat(plan.limits.listings === -1 ? "unlimited" : plan.limits.listings, " listings and ").concat(plan.limits.links === -1 ? "unlimited" : plan.limits.links, " custom links"),
            "price": plan.price_monthly.toString(),
            "priceCurrency": "USD",
            "priceSpecification": {
              "@type": "UnitPriceSpecification",
              "price": plan.price_monthly,
              "priceCurrency": "USD",
              "unitText": "MONTH"
            },
            "availability": "https://schema.org/InStock",
            "url": "".concat(baseUrl, "/pricing"),
            "seller": {
              "@type": "Organization",
              "name": "AgentBio"
            },
            ...plan.price_yearly > 0 && {
              "priceValidUntil": new Date((/* @__PURE__ */ new Date()).setFullYear((/* @__PURE__ */ new Date()).getFullYear() + 1)).toISOString().split("T")[0]
            }
          }))) || []
        },
        // WebPage schema
        {
          "@type": "WebPage",
          "@id": "".concat(baseUrl, "/pricing#webpage"),
          "url": "".concat(baseUrl, "/pricing"),
          "name": "Pricing - AgentBio Professional Plans",
          "description": "Choose the perfect plan for your real estate business. Start free and scale as you grow with AgentBio.",
          "isPartOf": {
            "@id": "".concat(baseUrl, "/#website")
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
              "item": "".concat(baseUrl, "/pricing")
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
  const handleSubscribe = async (priceId) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Authentication required",
          description: "Please sign in to subscribe",
          variant: "destructive"
        });
        return;
      }
      const { data, error } = await supabase.functions.invoke("create-checkout-session", {
        body: {
          priceId: isYearly ? priceId.replace("monthly", "yearly") : priceId,
          successUrl: "".concat(window.location.origin, "/dashboard?subscription=success"),
          cancelUrl: "".concat(window.location.origin, "/pricing")
        }
      });
      if (error) throw error;
      if (data.url) window.location.href = data.url;
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create checkout session",
        variant: "destructive"
      });
    }
  };
  const getPrice = (plan) => {
    const price = isYearly ? plan.price_yearly : plan.price_monthly;
    return price === 0 ? "Free" : "$".concat(price);
  };
  const getPeriod = () => isYearly ? "/year" : "/month";
  const isCurrentPlan = (planName) => {
    return (subscription == null ? void 0 : subscription.plan_name) === planName;
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      SEOHead,
      {
        title: "Pricing - AgentBio Professional Plans",
        description: "Choose the perfect plan for your real estate business. Start free and scale as you grow with AgentBio.",
        keywords: ["real estate pricing", "agent subscriptions", "link in bio plans"],
        canonicalUrl: "".concat(window.location.origin, "/pricing"),
        schema
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen flex flex-col", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(PublicHeader, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-gradient-to-br from-background via-background to-primary/5 py-20 px-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-7xl mx-auto", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mb-8", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Breadcrumbs, { items: [{ name: "Pricing", href: "/pricing" }] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center mb-12", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent", children: "Choose Your Plan" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xl text-muted-foreground mb-8", children: "Start free and scale as you grow" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-center gap-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: !isYearly ? "font-semibold" : "text-muted-foreground", children: "Monthly" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Switch, { checked: isYearly, onCheckedChange: setIsYearly }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: isYearly ? "font-semibold" : "text-muted-foreground", children: [
              "Yearly ",
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-primary text-sm", children: "(Save 17%)" })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid md:grid-cols-2 lg:grid-cols-4 gap-8", children: plans == null ? void 0 : plans.map((plan) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Card,
          {
            className: "relative ".concat(plan.name === "professional" ? "border-primary shadow-lg shadow-primary/20 scale-105" : ""),
            children: [
              plan.name === "professional" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold flex items-center gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Zap, { className: "w-4 h-4" }),
                "Most Popular"
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-2xl capitalize", children: plan.name }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(CardDescription, { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-4xl font-bold text-foreground", children: getPrice(plan) }),
                  plan.price_monthly > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: getPeriod() }),
                  plan.name === "team" && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm mt-2", children: "per agent (5 minimum)" })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("ul", { className: "space-y-3", children: [
                plan.limits.listings !== void 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "flex items-start gap-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "w-5 h-5 text-primary shrink-0 mt-0.5" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-sm", children: [
                    plan.limits.listings === -1 ? "Unlimited" : plan.limits.listings,
                    " active listings"
                  ] })
                ] }),
                plan.limits.links !== void 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "flex items-start gap-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "w-5 h-5 text-primary shrink-0 mt-0.5" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-sm", children: [
                    plan.limits.links === -1 ? "Unlimited" : plan.limits.links,
                    " custom links"
                  ] })
                ] }),
                plan.limits.testimonials !== void 0 && plan.limits.testimonials > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "flex items-start gap-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "w-5 h-5 text-primary shrink-0 mt-0.5" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-sm", children: [
                    plan.limits.testimonials === -1 ? "Unlimited" : plan.limits.testimonials,
                    " testimonials"
                  ] })
                ] }),
                plan.limits.analytics_days && /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "flex items-start gap-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "w-5 h-5 text-primary shrink-0 mt-0.5" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-sm", children: [
                    plan.limits.analytics_days === -1 ? "Unlimited" : "".concat(plan.limits.analytics_days, "-day"),
                    " analytics"
                  ] })
                ] }),
                Object.entries(plan.features).map(
                  ([key, value]) => value && /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "flex items-start gap-2", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "w-5 h-5 text-primary shrink-0 mt-0.5" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm capitalize", children: key.replace(/_/g, " ") })
                  ] }, key)
                )
              ] }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(CardFooter, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                Button,
                {
                  className: "w-full",
                  variant: plan.name === "professional" ? "default" : "outline",
                  disabled: isCurrentPlan(plan.name) || plan.name === "enterprise" || !plan.stripe_price_id,
                  onClick: () => plan.stripe_price_id && handleSubscribe(plan.stripe_price_id),
                  asChild: plan.name === "free",
                  children: plan.name === "free" ? /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/register", children: "Get Started" }) : isCurrentPlan(plan.name) ? "Current Plan" : plan.name === "enterprise" ? "Contact Sales" : !plan.stripe_price_id ? "Coming Soon" : "Subscribe"
                }
              ) })
            ]
          },
          plan.id
        )) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-16 text-center", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-2xl font-bold mb-4", children: "Add-Ons Available" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid md:grid-cols-4 gap-4 max-w-4xl mx-auto", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "p-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-semibold", children: "Premium Themes" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "$15 one-time" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "p-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-semibold", children: "MLS Integration" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "$25/month" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "p-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-semibold", children: "CRM Connectors" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "$20/month each" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "p-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-semibold", children: "SMS Notifications" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "$15/month" })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-20", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-3xl font-bold text-center mb-8", children: "Pricing Questions" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-3xl mx-auto space-y-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              FAQItem,
              {
                question: "How much does AgentBio cost?",
                answer: "AgentBio offers four pricing tiers: Free ($0), Starter ($19/month), Professional ($39/month), and Team ($29/agent/month with 5 agent minimum). Annual plans save 17%."
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              FAQItem,
              {
                question: "Can I start with the free plan?",
                answer: "Yes! AgentBio offers a free plan with 3 active listings, 5 custom links, basic analytics, and lead capture forms. No credit card required to get started."
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              FAQItem,
              {
                question: "Can I upgrade or downgrade my plan?",
                answer: "Absolutely! You can upgrade or downgrade your AgentBio plan at any time from your dashboard settings. Changes take effect immediately, and billing is prorated."
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              FAQItem,
              {
                question: "Do you offer annual billing?",
                answer: "Yes, we offer annual billing with a 17% discount compared to monthly billing. Pay for 10 months and get 12 months of service."
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              FAQItem,
              {
                question: "What payment methods do you accept?",
                answer: "We accept all major credit cards (Visa, Mastercard, American Express, Discover) through our secure payment processor Stripe. All payments are encrypted and PCI compliant."
              }
            )
          ] })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(PublicFooter, {})
    ] })
  ] });
}
function FAQItem({ question, answer }) {
  const [isOpen, setIsOpen] = reactExports.useState(false);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "overflow-hidden", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "button",
      {
        onClick: () => setIsOpen(!isOpen),
        className: "w-full px-6 py-4 text-left flex items-center justify-between hover:bg-muted/50 transition-colors",
        "aria-expanded": isOpen,
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-semibold pr-4", children: question }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "svg",
            {
              className: "w-5 h-5 text-primary transition-transform flex-shrink-0 ".concat(isOpen ? "rotate-180" : ""),
              fill: "none",
              viewBox: "0 0 24 24",
              stroke: "currentColor",
              children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M19 9l-7 7-7-7" })
            }
          )
        ]
      }
    ),
    isOpen && /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "pt-0 pb-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground leading-relaxed", children: answer }) })
  ] });
}
export {
  Pricing as default
};
