import { j as jsxRuntimeExports, L as Link, r as reactExports } from "./react-vendor-MTOt5FFF.js";
import { k as SEOHead } from "./ui-components-CbrOUI4e.js";
import { P as PublicHeader, H as HeroSection, a as PublicFooter } from "./index-CAwD2FR9.js";
import { H as Home, a9 as Image, K as DollarSign, p as MapPin, b as Check } from "./icons-CFSiufIk.js";
import "./charts-BvRX79AF.js";
import "./utils-DRaK7sdV.js";
import "./supabase-eNUZs_JT.js";
import "./data-kszmrHwg.js";
import "./three-addons-w2uoJ2aN.js";
import "./three-D20jh1h6.js";
import "./state-stores-BzsyoW3J.js";
import "./forms-xSDtUvSX.js";
function PropertyListings() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Property Listing Galleries - AgentBio Feature",
    "description": "Showcase your real estate listings with full photo galleries, pricing, and details. Display active and sold properties with MLS compliance built-in.",
    "mainEntity": {
      "@type": "SoftwareApplication",
      "name": "AgentBio Property Listings",
      "applicationCategory": "BusinessApplication",
      "featureList": [
        "Unlimited property listings with photo galleries",
        "Property details: price, beds/baths, square footage, MLS#",
        "Status badges: Active, Pending, Sold",
        "Virtual tour integration",
        "MLS compliance features",
        "Mobile-optimized property browsing"
      ]
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      SEOHead,
      {
        title: "Property Listing Galleries | Showcase Real Estate on Your Bio Page",
        description: "Showcase your real estate listings with full photo galleries, pricing, and details. Display active and sold properties with MLS compliance built-in.",
        keywords: [
          "property listing gallery",
          "showcase real estate listings",
          "link in bio with property listings",
          "real estate portfolio page",
          "MLS compliant listing display"
        ],
        canonicalUrl: "".concat(window.location.origin, "/features/property-listings"),
        schema
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("main", { className: "min-h-screen bg-background", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(PublicHeader, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx("section", { className: "py-8 bg-background/95 border-b border-glass-border", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "container mx-auto px-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "max-w-4xl mx-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-base md:text-lg glass-body leading-relaxed", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "AgentBio's property listing galleries let real estate agents showcase unlimited properties" }),
        " with full photo galleries, pricing, beds/baths, square footage, MLS numbers, and property descriptions directly on their bio page. Unlike generic link-in-bio tools, each listing includes status badges (active, pending, sold), virtual tour integration, and MLS compliance features—all optimized for mobile browsing from Instagram and social media."
      ] }) }) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        HeroSection,
        {
          title: "Property Listing Galleries",
          subtitle: "Showcase Your Real Estate Portfolio Like Never Before",
          description: "Display unlimited properties with full photo galleries, pricing, and details. Turn your Instagram bio into a mobile-optimized real estate showroom.",
          primaryCta: {
            text: "Start Showcasing Properties Free",
            href: "/auth/register"
          },
          secondaryCta: {
            text: "See Example Portfolios",
            href: "/#demo-profiles"
          },
          badge: {
            icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Home, { className: "h-4 w-4", "aria-hidden": "true" }),
            text: "Unlimited Listings on Pro Plan"
          },
          showStats: false
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx("section", { className: "py-20 bg-background/50", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "container mx-auto px-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "text-center mb-16", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-4xl md:text-5xl font-light tracking-tight text-foreground mb-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "glass-heading", children: "Everything Buyers Want to See" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xl glass-body max-w-3xl mx-auto", children: "Display all the property information buyers need to make a decision" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-5xl mx-auto grid md:grid-cols-2 gap-8", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            FeatureCard,
            {
              icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Image, {}),
              title: "Full Photo Galleries",
              description: "Upload unlimited photos per listing. Buyers can swipe through all property images without leaving your bio page. Support for both landscape and portrait photos."
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            FeatureCard,
            {
              icon: /* @__PURE__ */ jsxRuntimeExports.jsx(DollarSign, {}),
              title: "Complete Pricing Information",
              description: "Display asking price, price per square foot, estimated monthly payment. Show recent price reductions to attract buyer attention."
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            FeatureCard,
            {
              icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Home, {}),
              title: "Property Details",
              description: "Beds, baths, square footage, lot size, year built, HOA fees. Add custom details like pool, garage, school district, and more."
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            FeatureCard,
            {
              icon: /* @__PURE__ */ jsxRuntimeExports.jsx(MapPin, {}),
              title: "Location & MLS Info",
              description: "Full address or area display. MLS number for compliance. Neighborhood information and nearby amenities."
            }
          )
        ] })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("section", { className: "py-20 bg-background", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "container mx-auto px-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("header", { className: "text-center mb-16", children: /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-4xl md:text-5xl font-light tracking-tight text-foreground mb-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "glass-heading", children: "Active Listings + Sold Properties = Complete Portfolio" }) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-4xl mx-auto grid md:grid-cols-2 gap-8", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-8 rounded-xl bg-glass-background backdrop-blur-md border border-glass-border", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mb-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-full text-sm font-light mb-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-green-400", children: "Active Listings" }) }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-2xl font-light text-foreground mb-4", children: "Showcase What's Available" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("ul", { className: "space-y-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "flex items-start gap-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "glass-body", children: "Highlight your best listings first" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "flex items-start gap-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "glass-body", children: 'Mark as "Just Listed" or "Price Reduced"' })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "flex items-start gap-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "glass-body", children: "Add virtual tour links" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "flex items-start gap-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "glass-body", children: "Include open house dates" })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-8 rounded-xl bg-glass-background backdrop-blur-md border border-glass-border", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mb-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full text-sm font-light mb-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-blue-400", children: "Sold Properties" }) }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-2xl font-light text-foreground mb-4", children: "Prove Your Track Record" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("ul", { className: "space-y-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "flex items-start gap-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "glass-body", children: "Display sale prices and close dates" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "flex items-start gap-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "glass-body", children: "Show before/after photos" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "flex items-start gap-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "glass-body", children: "Add client success stories" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "flex items-start gap-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "glass-body", children: "Build credibility with volume" })
              ] })
            ] })
          ] })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("section", { className: "py-20 bg-background/50", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "container mx-auto px-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "text-center mb-16", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-4xl md:text-5xl font-light tracking-tight text-foreground mb-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "glass-heading", children: "MLS Compliance Built-In" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xl glass-body max-w-3xl mx-auto", children: "Stay compliant with MLS rules and Fair Housing requirements automatically" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "max-w-4xl mx-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid md:grid-cols-3 gap-6", children: [
          {
            title: "Equal Housing Logo",
            description: "Automatically included on all listing displays"
          },
          {
            title: "MLS Attribution",
            description: "Display MLS source and listing ID when required"
          },
          {
            title: "License Number",
            description: "Your license number appears on your profile"
          },
          {
            title: "Fair Housing Disclaimer",
            description: "Included in footer of all pages"
          },
          {
            title: "Status Accuracy",
            description: "Mark listings as Active, Pending, or Sold accurately"
          },
          {
            title: "Privacy Compliance",
            description: "GDPR and data protection standards met"
          }
        ].map((item, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-6 rounded-xl bg-glass-background backdrop-blur-md border border-glass-border", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-light text-foreground mb-2", children: item.title }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm glass-body text-muted-foreground", children: item.description })
        ] }, i)) }) })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("section", { className: "py-20 bg-background", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "container mx-auto px-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("header", { className: "text-center mb-16", children: /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-4xl md:text-5xl font-light tracking-tight text-foreground mb-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "glass-heading", children: "Add Listings in 3 Easy Steps" }) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-3xl mx-auto space-y-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            StepCard,
            {
              number: 1,
              title: "Upload Property Photos",
              description: "Drag and drop photos or upload from your device. Add as many photos as you want—unlimited on Pro plan."
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            StepCard,
            {
              number: 2,
              title: "Fill in Property Details",
              description: "Add price, beds/baths, square footage, address, MLS number, and description. Takes 2 minutes per listing."
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            StepCard,
            {
              number: 3,
              title: "Publish & Share",
              description: "Your listing appears instantly on your bio page. Share the link in Instagram Stories, posts, and DMs."
            }
          )
        ] })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("section", { className: "py-20 bg-background/50", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "container mx-auto px-4 text-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-4xl md:text-5xl font-light tracking-tight mb-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "glass-heading", children: "Ready to Showcase Your Listings?" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xl mb-8 glass-body max-w-2xl mx-auto", children: "Create your professional real estate portfolio with unlimited property listings" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Link,
          {
            to: "/auth/register",
            className: "inline-flex items-center gap-2 px-8 py-4 bg-glass-background backdrop-blur-md border border-glass-border rounded-xl font-light tracking-tight transition-all hover:border-[#80d0c7] hover:shadow-lg hover:shadow-[#80d0c7]/20",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "glass-accent", children: "Start Free Trial" })
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground font-light mt-4", children: "No credit card required • 3 free listings • Upgrade anytime" })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(PublicFooter, {})
    ] })
  ] });
}
function FeatureCard({ icon, title, description }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-6 p-6 rounded-xl bg-glass-background backdrop-blur-md border border-glass-border hover:border-[#80d0c7] transition-all", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-shrink-0 p-3 rounded-lg bg-gradient-to-br from-[#80d0c7]/10 to-[#a1c4fd]/10 text-[#80d0c7]", children: reactExports.cloneElement(icon, { className: "h-6 w-6" }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-xl font-light tracking-tight text-foreground mb-2", children: title }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "glass-body leading-relaxed", children: description })
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
  PropertyListings as default
};
