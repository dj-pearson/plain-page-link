import { j as jsxRuntimeExports, L as Link, l as useSearchParams, g as useNavigate, r as reactExports } from './react-vendor-a6jLNMWt.js';
import { u as useAnalytics } from './useAnalytics-BZpB1RIB.js';
import { u as useLinks } from './useLinks-CXNEVD9v.js';
import { u as useProfile } from './useProfile-ruvD7bQn.js';
import { u as useSubscription } from './useSubscription-D-aEUJ-C.js';
import { u as useToast } from './index-Dww_DGvO.js';
import { C as Card, f as CardHeader, g as CardTitle, h as CardDescription, v as Progress, o as CardContent, u as LoadingSpinner, D as Dialog, l as DialogContent, m as DialogHeader, n as DialogTitle, G as DialogDescription } from './ui-components-DLW4dShh.js';
import { u as useListings } from './useListings-B7uikdzX.js';
import { u as useTestimonials } from './useTestimonials-xCtl59Vo.js';
import { c as CircleAlert, at as Circle, J as CircleCheckBig, E as Eye, U as Users, au as MousePointerClick, T as TrendingUp, ae as Copy, h as ExternalLink, av as PartyPopper, b as Check } from './icons-Bf8A6sFa.js';
import './charts-DsEHo9_O.js';
import './utils-BhOeSegx.js';
import './data-zpsFEjqp.js';
import './supabase-D4RJa1Op.js';
import './state-stores-BQHzCYsU.js';
import './three-addons-aBd78e9L.js';
import './three-D7pws1Rl.js';
import './forms-DN8gFaqO.js';

function ProfileCompletionWidget() {
  const { data: profile } = useProfile();
  const { data: listings } = useListings();
  const { data: testimonials } = useTestimonials();
  const { data: links } = useLinks();
  if (!profile) return null;
  const steps = [
    {
      id: "avatar",
      label: "Add profile photo",
      description: "Upload a professional headshot",
      completed: !!profile.avatar_url,
      link: "/dashboard/profile",
      priority: "high"
    },
    {
      id: "bio",
      label: "Write your bio",
      description: "Tell visitors about your experience",
      completed: !!profile.bio && profile.bio.length > 50,
      link: "/dashboard/profile",
      priority: "high"
    },
    {
      id: "contact",
      label: "Add contact info",
      description: "Phone and email for leads",
      completed: !!profile.phone || !!profile.email_display,
      link: "/dashboard/profile",
      priority: "high"
    },
    {
      id: "listings",
      label: "Add your first listing",
      description: "Showcase properties you're selling",
      completed: (listings?.length || 0) > 0,
      link: "/dashboard/listings",
      priority: "medium"
    },
    {
      id: "testimonials",
      label: "Add testimonials",
      description: "Build trust with client reviews",
      completed: (testimonials?.length || 0) > 0,
      link: "/dashboard/testimonials",
      priority: "medium"
    },
    {
      id: "links",
      label: "Add custom links",
      description: "Link to your website and social",
      completed: (links?.length || 0) > 0,
      link: "/dashboard/links",
      priority: "low"
    },
    {
      id: "theme",
      label: "Customize theme",
      description: "Match your brand colors",
      completed: !!profile.theme,
      link: "/dashboard/theme",
      priority: "low"
    }
  ];
  const completedSteps = steps.filter((step) => step.completed).length;
  const totalSteps = steps.length;
  const completionPercentage = Math.round(completedSteps / totalSteps * 100);
  if (completionPercentage === 100) return null;
  const highPriorityIncomplete = steps.filter((s) => s.priority === "high" && !s.completed);
  const nextStep = highPriorityIncomplete[0] || steps.find((s) => !s.completed);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "border-blue-200 bg-blue-50/50", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-start justify-between", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "text-lg flex items-center gap-2", children: [
          completionPercentage < 50 ? /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { className: "w-5 h-5 text-orange-500" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Circle, { className: "w-5 h-5 text-blue-500" }),
          "Profile Completion"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardDescription, { children: [
          completionPercentage,
          "% complete - ",
          completedSteps,
          " of ",
          totalSteps,
          " steps done"
        ] })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Progress, { value: completionPercentage, className: "mt-4" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-4", children: [
      nextStep && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-white rounded-lg p-4 border border-blue-200", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-blue-600 font-semibold text-sm", children: completedSteps + 1 }) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("h4", { className: "font-semibold text-gray-900", children: [
            "Next: ",
            nextStep.label
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-600 mt-1", children: nextStep.description }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Link,
            {
              to: nextStep.link,
              className: "inline-block mt-2 text-sm font-medium text-blue-600 hover:text-blue-700",
              children: "Complete this step →"
            }
          )
        ] })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("details", { className: "group", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("summary", { className: "cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900 list-none flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "View all steps" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "group-open:rotate-180 transition-transform", children: "▼" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-3 space-y-2", children: steps.map((step) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Link,
          {
            to: step.link,
            className: "flex items-start gap-3 p-2 rounded-lg hover:bg-white transition-colors group/item",
            children: [
              step.completed ? /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheckBig, { className: "w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Circle, { className: "w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `text-sm font-medium ${step.completed ? "text-gray-500 line-through" : "text-gray-900"}`, children: step.label }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-gray-500", children: step.description })
              ] })
            ]
          },
          step.id
        )) })
      ] })
    ] })
  ] });
}

function Overview() {
  const { stats, recentLeads, isLoading } = useAnalytics();
  const { links } = useLinks();
  const { profile } = useProfile();
  const { subscription } = useSubscription();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [showSuccessModal, setShowSuccessModal] = reactExports.useState(false);
  const totalLinkClicks = links.reduce((sum, link) => sum + (link.click_count || 0), 0);
  const isNewUser = profile?.created_at ? (/* @__PURE__ */ new Date()).getTime() - new Date(profile.created_at).getTime() < 48 * 60 * 60 * 1e3 : false;
  const greeting = isNewUser ? "Welcome to AgentBio!" : "Welcome Back!";
  const subtitle = isNewUser ? "Let's get your profile set up and start attracting clients" : "Here's what's happening with your profile";
  reactExports.useEffect(() => {
    if (searchParams.get("subscription") === "success") {
      setShowSuccessModal(true);
      navigate("/dashboard", { replace: true });
    }
  }, [searchParams, navigate]);
  const getUnlockedFeatures = (planName) => {
    const features = {
      starter: [
        "20 active listings",
        "15 custom links",
        "10 testimonials",
        "90-day analytics",
        "Lead export to CSV"
      ],
      professional: [
        "Unlimited listings",
        "Unlimited custom links",
        "Unlimited testimonials",
        "Unlimited analytics history",
        "Custom domain support",
        "Premium themes with 3D effects",
        "Priority email support"
      ],
      team: [
        "Everything in Professional",
        "Multi-agent dashboard",
        "Team analytics",
        "White-label branding",
        "API access",
        "Dedicated account manager"
      ]
    };
    return features[planName?.toLowerCase() || "starter"] || [];
  };
  if (isLoading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-center h-64", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoadingSpinner, { size: "lg" }) });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4 sm:space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("h2", { className: "text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2", children: [
        greeting,
        profile?.full_name && !isNewUser && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-gray-600", children: [
          ", ",
          profile.full_name.split(" ")[0]
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm sm:text-base text-gray-600", children: subtitle })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(ProfileCompletionWidget, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        StatCard,
        {
          icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Eye, { className: "h-5 w-5 sm:h-6 sm:w-6 text-blue-600" }),
          label: "Profile Views",
          value: stats.totalViews.toLocaleString()
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        StatCard,
        {
          icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Users, { className: "h-5 w-5 sm:h-6 sm:w-6 text-green-600" }),
          label: "New Leads",
          value: stats.totalLeads.toString()
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        StatCard,
        {
          icon: /* @__PURE__ */ jsxRuntimeExports.jsx(MousePointerClick, { className: "h-5 w-5 sm:h-6 sm:w-6 text-purple-600" }),
          label: "Link Clicks",
          value: totalLinkClicks.toLocaleString()
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        StatCard,
        {
          icon: /* @__PURE__ */ jsxRuntimeExports.jsx(TrendingUp, { className: "h-5 w-5 sm:h-6 sm:w-6 text-orange-600" }),
          label: "Conversion Rate",
          value: `${stats.conversionRate}%`
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-3 sm:pb-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-base sm:text-lg", children: "Recent Leads" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: recentLeads.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2 sm:space-y-3", children: recentLeads.slice(0, 5).map((lead) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between py-2 sm:py-2.5 border-b border-border last:border-0 gap-2 min-h-[44px]", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium text-sm sm:text-base truncate", children: lead.name }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs sm:text-sm text-muted-foreground truncate", children: lead.email })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `px-2 py-1 text-xs rounded-full flex-shrink-0 font-medium ${lead.status === "new" ? "bg-blue-100 text-blue-700" : lead.status === "contacted" ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"}`, children: lead.status })
        ] }, lead.id)) }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center py-6 sm:py-8", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 mb-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Users, { className: "h-6 w-6 text-blue-600" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "font-semibold text-sm mb-1", children: "Start Capturing Leads" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mb-3 max-w-xs mx-auto", children: "Share your profile link to start receiving inquiries from potential clients" }),
          profile?.username && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-center gap-2 p-2 bg-muted rounded-lg max-w-xs mx-auto", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("code", { className: "text-xs truncate", children: [
              "agentbio.net/",
              profile.username
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                onClick: async () => {
                  await navigator.clipboard.writeText(`${window.location.origin}/${profile.username}`);
                  toast({ title: "Copied!", description: "Profile link copied to clipboard" });
                },
                className: "p-1 hover:bg-background rounded transition-colors",
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(Copy, { className: "h-3 w-3" })
              }
            )
          ] })
        ] }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-3 sm:pb-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-base sm:text-lg", children: "Top Links" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: links.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2 sm:space-y-3", children: links.sort((a, b) => (b.click_count || 0) - (a.click_count || 0)).slice(0, 5).map((link) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between py-2 sm:py-2.5 border-b border-border last:border-0 gap-2 min-h-[44px]", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium text-sm sm:text-base truncate", children: link.title }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs sm:text-sm text-muted-foreground truncate", children: link.url })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1 text-sm sm:text-base text-muted-foreground flex-shrink-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(MousePointerClick, { className: "h-3 w-3 sm:h-4 sm:w-4" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium", children: link.click_count || 0 })
          ] })
        ] }, link.id)) }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center py-6 sm:py-8", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-100 mb-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx(MousePointerClick, { className: "h-6 w-6 text-purple-600" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "font-semibold text-sm mb-1", children: "Add Your First Link" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mb-3 max-w-xs mx-auto", children: "Add links to your website, social media, and other profiles" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "a",
            {
              href: "/dashboard/links",
              className: "inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium",
              children: [
                "Manage Links ",
                /* @__PURE__ */ jsxRuntimeExports.jsx(ExternalLink, { className: "h-3 w-3" })
              ]
            }
          )
        ] }) })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: showSuccessModal, onOpenChange: setShowSuccessModal, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "sm:max-w-md", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mx-auto mb-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(PartyPopper, { className: "w-8 h-8 text-green-600" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogTitle, { className: "text-center text-2xl", children: [
          "🎉 Welcome to ",
          subscription?.plan_name,
          "!"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogDescription, { className: "text-center pt-2", children: "Your subscription is now active. Here's what you just unlocked:" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-muted/50 rounded-lg p-4 my-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h4", { className: "font-semibold mb-3 flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "w-5 h-5 text-green-600" }),
          "New Features Available:"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "space-y-2", children: getUnlockedFeatures(subscription?.plan_name).map((feature, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "flex items-start gap-2 text-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: feature })
        ] }, index)) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground mb-4", children: "A confirmation email with your receipt has been sent to your email address." }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: () => setShowSuccessModal(false),
            className: "w-full px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium",
            children: "Get Started"
          }
        )
      ] })
    ] }) })
  ] });
}
function StatCard({
  icon,
  label,
  value
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white rounded-lg border border-gray-200 p-3 sm:p-4 md:p-6 hover:shadow-md transition-shadow active:scale-[0.98] cursor-pointer", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center mb-2 sm:mb-3 md:mb-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-1.5 sm:p-2 bg-gray-50 rounded-lg", children: icon }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs sm:text-sm text-gray-600 mb-1", children: label }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xl sm:text-2xl font-bold text-gray-900 break-all", children: value })
    ] })
  ] });
}

export { Overview as default };
