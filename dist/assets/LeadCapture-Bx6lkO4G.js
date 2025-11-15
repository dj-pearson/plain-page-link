import { j as jsxRuntimeExports, L as Link, r as reactExports } from "./react-vendor-MTOt5FFF.js";
import { k as SEOHead } from "./ui-components-CbrOUI4e.js";
import { P as PublicHeader, H as HeroSection, a as PublicFooter } from "./index-CAwD2FR9.js";
import { U as Users, H as Home, T as TrendingUp, i as Star, b as Check } from "./icons-CFSiufIk.js";
import "./charts-BvRX79AF.js";
import "./utils-DRaK7sdV.js";
import "./supabase-eNUZs_JT.js";
import "./data-kszmrHwg.js";
import "./three-addons-w2uoJ2aN.js";
import "./three-D20jh1h6.js";
import "./state-stores-BzsyoW3J.js";
import "./forms-xSDtUvSX.js";
function LeadCapture() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Lead Capture Forms for Real Estate Agents - AgentBio",
    "description": "Capture qualified buyer and seller leads with pre-built forms. Buyer inquiries, seller leads, and home valuation requests—all optimized for real estate.",
    "mainEntity": {
      "@type": "SoftwareApplication",
      "name": "AgentBio Lead Capture",
      "featureList": [
        "Buyer inquiry forms with pre-qualification questions",
        "Seller lead forms with timeline and motivation tracking",
        "Home valuation request forms",
        "Email notifications for instant follow-up",
        "Lead scoring: Hot, Warm, Cold",
        "CRM integration ready"
      ]
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      SEOHead,
      {
        title: "Lead Capture Forms for Real Estate Agents | Qualify Buyers & Sellers",
        description: "Capture qualified buyer and seller leads with pre-built forms. Buyer inquiries, seller leads, and home valuation requests—all optimized for real estate.",
        keywords: [
          "real estate lead capture forms",
          "buyer inquiry form",
          "seller lead form",
          "home valuation request",
          "real estate lead generation"
        ],
        canonicalUrl: "".concat(window.location.origin, "/features/lead-capture"),
        schema
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("main", { className: "min-h-screen bg-background", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(PublicHeader, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx("section", { className: "py-8 bg-background/95 border-b border-glass-border", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "container mx-auto px-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "max-w-4xl mx-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-base md:text-lg glass-body leading-relaxed", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "AgentBio's lead capture forms help real estate agents qualify buyer and seller leads" }),
        " with pre-built forms for buyer inquiries, seller leads, and home valuation requests. Unlike generic contact forms, each form includes pre-qualification questions like budget, timeline, and motivation—giving you the information needed to prioritize hot leads and follow up effectively with instant email notifications."
      ] }) }) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        HeroSection,
        {
          title: "Lead Capture Forms Built for Real Estate",
          subtitle: "Stop Getting Generic 'Contact Me' Submissions—Get Qualified Leads",
          description: "Capture buyer budgets, seller timelines, and pre-qualification details automatically. Know which leads to call first.",
          primaryCta: {
            text: "Start Capturing Leads Free",
            href: "/auth/register"
          },
          secondaryCta: {
            text: "See How It Works",
            href: "#how-it-works"
          },
          badge: {
            icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Users, { className: "h-4 w-4", "aria-hidden": "true" }),
            text: "3 Form Types Included"
          },
          showStats: false
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx("section", { className: "py-20 bg-background/50", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "container mx-auto px-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("header", { className: "text-center mb-16", children: /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-4xl md:text-5xl font-light tracking-tight text-foreground mb-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "glass-heading", children: "3 Essential Forms Every Agent Needs" }) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-5xl mx-auto space-y-8", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            FormTypeCard,
            {
              icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Home, {}),
              title: "Buyer Inquiry Form",
              description: "Capture serious buyers with pre-qualification questions",
              fields: [
                "Budget range (prevents unqualified leads)",
                "Timeline to purchase (urgent vs browsing)",
                "Pre-approval status (ready to buy?)",
                "Property preferences (beds/baths/location)",
                "Contact info and best time to call"
              ],
              useCase: "When buyers click on a listing, they can immediately submit their interest with budget and timeline details—helping you prioritize hot leads."
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            FormTypeCard,
            {
              icon: /* @__PURE__ */ jsxRuntimeExports.jsx(TrendingUp, {}),
              title: "Seller Lead Form",
              description: "Qualify sellers by motivation and timeline",
              fields: [
                "Property address (for CMA preparation)",
                "Timeline to sell (ready now vs exploring)",
                "Motivation to sell (job, downsize, upgrade)",
                "Current home value estimate",
                "Contact preferences"
              ],
              useCase: "Sellers exploring their options can request a market analysis. You get their address and timeline—perfect for follow-up with a CMA."
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            FormTypeCard,
            {
              icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Star, {}),
              title: "Home Valuation Request",
              description: "Attract seller leads with free valuations",
              fields: [
                "Property address",
                "Beds/baths/square footage",
                "Reason for valuation request",
                "Timeline if considering selling",
                "Email for delivery"
              ],
              useCase: "The #1 lead magnet for seller leads. Homeowners request free valuations, you capture their info and deliver a CMA to start the relationship."
            }
          )
        ] })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("section", { className: "py-20 bg-background", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "container mx-auto px-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("header", { className: "text-center mb-16", children: /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-4xl md:text-5xl font-light tracking-tight text-foreground mb-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "glass-heading", children: "Why Pre-Qualification Questions Matter" }) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-4xl mx-auto", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid md:grid-cols-2 gap-8 mb-12", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-6 rounded-xl bg-red-500/5 border border-red-500/20", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-xl font-light text-red-400 mb-4", children: "❌ Generic Contact Forms Give You:" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("ul", { className: "space-y-2 text-sm glass-body text-muted-foreground", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "• Just a name and email" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "• No budget information" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "• No timeline context" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "• Can't prioritize leads" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "• Waste time on unqualified inquiries" })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-6 rounded-xl bg-green-500/5 border border-green-500/20", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-xl font-light text-green-400 mb-4", children: "✓ AgentBio Lead Forms Give You:" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("ul", { className: "space-y-2 text-sm glass-body", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "• Budget and pre-approval status" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "• Exact timeline (30, 60, 90+ days)" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "• Motivation and urgency level" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "• Property preferences" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "• Enough info to qualify before calling" })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-8 rounded-xl bg-glass-background backdrop-blur-md border border-glass-border text-center", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-2xl font-light text-foreground mb-2", children: "Result: Call the right leads first" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "glass-body text-muted-foreground", children: "Pre-approved buyer looking in 30 days? Call immediately. Browsing with no timeline? Nurture campaign." })
          ] })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("section", { className: "py-20 bg-background/50", id: "how-it-works", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "container mx-auto px-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("header", { className: "text-center mb-16", children: /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-4xl md:text-5xl font-light tracking-tight text-foreground mb-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "glass-heading", children: "Get Notified Instantly When Leads Submit" }) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-3xl mx-auto space-y-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            StepCard,
            {
              number: 1,
              title: "Lead Submits Form on Your Bio Page",
              description: "Visitor clicks 'Contact Me' or 'Request Home Valuation' and fills out the form with their details."
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            StepCard,
            {
              number: 2,
              title: "You Get Email Notification Immediately",
              description: "Email arrives within seconds with all lead details: name, budget, timeline, pre-approval status, and message."
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            StepCard,
            {
              number: 3,
              title: "Lead Appears in Your Dashboard",
              description: "Access all leads from your AgentBio dashboard. Sort by date, lead type, or status. Export to your CRM anytime."
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            StepCard,
            {
              number: 4,
              title: "Follow Up While They're Hot",
              description: "Call or text within minutes while they're still thinking about their search. Fast response = higher conversion."
            }
          )
        ] })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("section", { className: "py-20 bg-background", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "container mx-auto px-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "text-center mb-16", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-4xl md:text-5xl font-light tracking-tight text-foreground mb-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "glass-heading", children: "Automatic Lead Scoring: Hot, Warm, or Cold" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xl glass-body max-w-3xl mx-auto", children: "AgentBio automatically scores leads based on their responses" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-4xl mx-auto grid md:grid-cols-3 gap-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-6 rounded-xl bg-glass-background backdrop-blur-md border border-red-500/30", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mb-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "inline-flex items-center gap-2 px-3 py-1 bg-red-500/20 border border-red-500/30 rounded-full text-sm font-light text-red-400", children: "🔥 Hot Lead" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-xl font-light text-foreground mb-3", children: "Ready to Transact" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("ul", { className: "space-y-2 text-sm glass-body", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "• Pre-approved buyers" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "• 0-30 day timeline" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "• Specific property interest" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "• High motivation to sell" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-red-400 mt-4 font-light", children: "→ Call within 5 minutes" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-6 rounded-xl bg-glass-background backdrop-blur-md border border-yellow-500/30", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mb-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "inline-flex items-center gap-2 px-3 py-1 bg-yellow-500/20 border border-yellow-500/30 rounded-full text-sm font-light text-yellow-400", children: "⚡ Warm Lead" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-xl font-light text-foreground mb-3", children: "Actively Looking" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("ul", { className: "space-y-2 text-sm glass-body", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "• 30-90 day timeline" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "• Budget defined" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "• General area interest" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "• Considering selling" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-yellow-400 mt-4 font-light", children: "→ Call within 24 hours" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-6 rounded-xl bg-glass-background backdrop-blur-md border border-blue-500/30", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mb-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "inline-flex items-center gap-2 px-3 py-1 bg-blue-500/20 border border-blue-500/30 rounded-full text-sm font-light text-blue-400", children: "❄️ Cold Lead" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-xl font-light text-foreground mb-3", children: "Early Research" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("ul", { className: "space-y-2 text-sm glass-body", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "• 90+ day timeline" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "• Just browsing" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "• Budget undefined" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "• Information gathering" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-blue-400 mt-4 font-light", children: "→ Add to nurture campaign" })
          ] })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("section", { className: "py-20 bg-background/50", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "container mx-auto px-4 text-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-4xl md:text-5xl font-light tracking-tight mb-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "glass-heading", children: "Start Capturing Qualified Leads Today" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xl mb-8 glass-body max-w-2xl mx-auto", children: "Get buyer budgets, seller timelines, and pre-qualification details automatically" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Link,
          {
            to: "/auth/register",
            className: "inline-flex items-center gap-2 px-8 py-4 bg-glass-background backdrop-blur-md border border-glass-border rounded-xl font-light tracking-tight transition-all hover:border-[#80d0c7] hover:shadow-lg hover:shadow-[#80d0c7]/20",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "glass-accent", children: "Start Free Trial" })
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground font-light mt-4", children: "No credit card required • All 3 form types included • Instant notifications" })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(PublicFooter, {})
    ] })
  ] });
}
function FormTypeCard({
  icon,
  title,
  description,
  fields,
  useCase
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-8 rounded-xl bg-glass-background backdrop-blur-md border border-glass-border", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-6 mb-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-shrink-0 p-4 rounded-lg bg-gradient-to-br from-[#80d0c7]/10 to-[#a1c4fd]/10 text-[#80d0c7]", children: reactExports.cloneElement(icon, { className: "h-8 w-8" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-2xl font-light tracking-tight text-foreground mb-2", children: title }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "glass-body text-muted-foreground", children: description })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-sm font-light text-foreground mb-3 uppercase tracking-wide", children: "Fields Captured:" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "space-y-2", children: fields.map((field, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "flex items-start gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "h-4 w-4 text-[#80d0c7] flex-shrink-0 mt-0.5" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm glass-body", children: field })
      ] }, i)) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 bg-background/50 rounded-lg border border-glass-border/50", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-light text-foreground mb-1", children: "Use Case:" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm glass-body text-muted-foreground", children: useCase })
    ] })
  ] });
}
function StepCard({ number, title, description }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-6 p-6 rounded-xl bg-glass-background backdrop-blur-md border border-glass-border", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-[#80d0c7] to-[#a1c4fd] flex items-center justify-center text-white text-xl font-light", children: number }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-xl font-light tracking-tight text-foreground mb-2", children: title }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "glass-body leading-relaxed", children: description })
    ] })
  ] });
}
export {
  LeadCapture as default
};
