import { j as jsxRuntimeExports, r as reactExports } from './react-vendor-a6jLNMWt.js';
import { C as Card, f as CardHeader, g as CardTitle, c as cn, o as CardContent, h as CardDescription, Z as Table, _ as TableHeader, $ as TableRow, a0 as TableHead, j as Button, a1 as TableBody, a2 as TableCell, B as Badge, J as Tabs, K as TabsList, M as TabsTrigger, N as TabsContent } from './ui-components-DLW4dShh.js';
import { R as ResponsiveContainer, L as LineChart, b as Line, B as BarChart, d as Bar, A as AreaChart, e as Area, C as CartesianGrid, X as XAxis, Y as YAxis, T as Tooltip, f as Legend } from './charts-DsEHo9_O.js';
import { f as formatRelativeTime } from './index-Dww_DGvO.js';
import { a0 as User, M as Mail, P as Phone, a as ChevronUp, C as ChevronDown, e as Calendar, a1 as Download, B as BarChart3, S as Search, E as Eye, U as Users, aK as UserPlus, T as TrendingUp } from './icons-Bf8A6sFa.js';
import { S as SearchAnalyticsDashboard } from './SearchAnalyticsDashboard-BBUJCi_K.js';
import { u as useAnalytics } from './useAnalytics-BZpB1RIB.js';
import './utils-BhOeSegx.js';
import './supabase-D4RJa1Op.js';
import './data-zpsFEjqp.js';
import './three-addons-aBd78e9L.js';
import './three-D7pws1Rl.js';
import './state-stores-BQHzCYsU.js';
import './forms-DN8gFaqO.js';

function StatsCard({
  title,
  value,
  change,
  changeLabel = "vs last period",
  icon: Icon,
  iconColor = "text-blue-600",
  iconBgColor = "bg-blue-100",
  trend = "neutral"
}) {
  const trendColor = trend === "up" ? "text-green-600" : trend === "down" ? "text-red-600" : "text-gray-600";
  const trendSymbol = trend === "up" ? "↑" : trend === "down" ? "↓" : "•";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-sm font-medium text-muted-foreground", children: title }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: cn("rounded-full p-2", iconBgColor), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: cn("h-4 w-4", iconColor) }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-2xl font-bold", children: value }),
      change !== void 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: cn("text-xs font-medium mt-1", trendColor), children: [
        trendSymbol,
        " ",
        Math.abs(change),
        "% ",
        changeLabel
      ] })
    ] })
  ] });
}

function AnalyticsChart({
  title,
  description,
  data,
  series,
  type = "line",
  height = 300,
  showLegend = true,
  yAxisLabel
}) {
  const renderChart = () => {
    const commonProps = {
      data,
      margin: { top: 5, right: 20, left: 0, bottom: 5 }
    };
    const chartElements = /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CartesianGrid, { strokeDasharray: "3 3", className: "stroke-muted" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        XAxis,
        {
          dataKey: "name",
          tick: { fontSize: 12 },
          tickLine: false,
          axisLine: false
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        YAxis,
        {
          tick: { fontSize: 12 },
          tickLine: false,
          axisLine: false,
          label: yAxisLabel ? {
            value: yAxisLabel,
            angle: -90,
            position: "insideLeft"
          } : void 0
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Tooltip,
        {
          contentStyle: {
            backgroundColor: "white",
            border: "1px solid #e5e7eb",
            borderRadius: "8px"
          }
        }
      ),
      showLegend && /* @__PURE__ */ jsxRuntimeExports.jsx(Legend, {})
    ] });
    switch (type) {
      case "area":
        return /* @__PURE__ */ jsxRuntimeExports.jsxs(AreaChart, { ...commonProps, children: [
          chartElements,
          series.map((s) => /* @__PURE__ */ jsxRuntimeExports.jsx(
            Area,
            {
              type: "monotone",
              dataKey: s.dataKey,
              name: s.name,
              stroke: s.color,
              fill: s.color,
              fillOpacity: 0.2,
              strokeWidth: 2
            },
            s.dataKey
          ))
        ] });
      case "bar":
        return /* @__PURE__ */ jsxRuntimeExports.jsxs(BarChart, { ...commonProps, children: [
          chartElements,
          series.map((s) => /* @__PURE__ */ jsxRuntimeExports.jsx(
            Bar,
            {
              dataKey: s.dataKey,
              name: s.name,
              fill: s.color,
              radius: [4, 4, 0, 0]
            },
            s.dataKey
          ))
        ] });
      case "line":
      default:
        return /* @__PURE__ */ jsxRuntimeExports.jsxs(LineChart, { ...commonProps, children: [
          chartElements,
          series.map((s) => /* @__PURE__ */ jsxRuntimeExports.jsx(
            Line,
            {
              type: "monotone",
              dataKey: s.dataKey,
              name: s.name,
              stroke: s.color,
              strokeWidth: 2,
              dot: { r: 4 },
              activeDot: { r: 6 }
            },
            s.dataKey
          ))
        ] });
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: title }),
      description && /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: description })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(ResponsiveContainer, { width: "100%", height, children: renderChart() }) })
  ] });
}

function LeadsTable({ leads, onLeadClick }) {
  const [sortField, setSortField] = reactExports.useState("created_at");
  const [sortOrder, setSortOrder] = reactExports.useState("desc");
  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };
  const sortedLeads = [...leads].sort((a, b) => {
    let comparison = 0;
    switch (sortField) {
      case "created_at":
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        break;
      case "name":
        comparison = a.name.localeCompare(b.name);
        break;
      case "lead_type":
        comparison = a.lead_type.localeCompare(b.lead_type);
        break;
      case "status":
        comparison = a.status.localeCompare(b.status);
        break;
    }
    return sortOrder === "asc" ? comparison : -comparison;
  });
  const SortIcon = ({ field }) => {
    if (sortField !== field) return null;
    return sortOrder === "asc" ? /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronUp, { className: "inline w-4 h-4 ml-1" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronDown, { className: "inline w-4 h-4 ml-1" });
  };
  const getStatusColor = (status) => {
    switch (status) {
      case "new":
        return "bg-blue-100 text-blue-800";
      case "contacted":
        return "bg-yellow-100 text-yellow-800";
      case "qualified":
        return "bg-green-100 text-green-800";
      case "converted":
        return "bg-purple-100 text-purple-800";
      case "lost":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  const getLeadTypeLabel = (type) => {
    switch (type) {
      case "buyer":
        return "Buyer";
      case "seller":
        return "Seller";
      case "valuation":
        return "Valuation";
      case "contact":
        return "Contact";
      default:
        return type;
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: "Recent Leads" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardDescription, { children: [
        "Your latest lead submissions (",
        leads.length,
        " total)"
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-md border", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Table, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(TableHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Button,
          {
            variant: "ghost",
            size: "sm",
            onClick: () => handleSort("name"),
            className: "hover:bg-transparent",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(User, { className: "w-4 h-4 mr-2" }),
              "Name",
              /* @__PURE__ */ jsxRuntimeExports.jsx(SortIcon, { field: "name" })
            ]
          }
        ) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { children: "Contact" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Button,
          {
            variant: "ghost",
            size: "sm",
            onClick: () => handleSort("lead_type"),
            className: "hover:bg-transparent",
            children: [
              "Type",
              /* @__PURE__ */ jsxRuntimeExports.jsx(SortIcon, { field: "lead_type" })
            ]
          }
        ) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Button,
          {
            variant: "ghost",
            size: "sm",
            onClick: () => handleSort("status"),
            className: "hover:bg-transparent",
            children: [
              "Status",
              /* @__PURE__ */ jsxRuntimeExports.jsx(SortIcon, { field: "status" })
            ]
          }
        ) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Button,
          {
            variant: "ghost",
            size: "sm",
            onClick: () => handleSort("created_at"),
            className: "hover:bg-transparent",
            children: [
              "Date",
              /* @__PURE__ */ jsxRuntimeExports.jsx(SortIcon, { field: "created_at" })
            ]
          }
        ) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-right", children: "Actions" })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TableBody, { children: sortedLeads.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(TableRow, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        TableCell,
        {
          colSpan: 6,
          className: "text-center text-muted-foreground py-8",
          children: "No leads yet. They'll appear here when visitors submit forms."
        }
      ) }) : sortedLeads.map((lead) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
        TableRow,
        {
          className: "cursor-pointer hover:bg-muted/50",
          onClick: () => onLeadClick?.(lead),
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "font-medium", children: lead.name }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-1 text-sm", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "a",
                {
                  href: `mailto:${lead.email}`,
                  className: "flex items-center text-blue-600 hover:underline",
                  onClick: (e) => e.stopPropagation(),
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Mail, { className: "w-3 h-3 mr-1" }),
                    lead.email
                  ]
                }
              ),
              lead.phone && /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "a",
                {
                  href: `tel:${lead.phone}`,
                  className: "flex items-center text-blue-600 hover:underline",
                  onClick: (e) => e.stopPropagation(),
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Phone, { className: "w-3 h-3 mr-1" }),
                    lead.phone
                  ]
                }
              )
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", children: getLeadTypeLabel(
              lead.lead_type
            ) }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              Badge,
              {
                className: getStatusColor(
                  lead.status
                ),
                children: lead.status
              }
            ) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "text-sm text-muted-foreground", children: formatRelativeTime(
              lead.created_at
            ) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "text-right", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                variant: "ghost",
                size: "sm",
                onClick: (e) => {
                  e.stopPropagation();
                  onLeadClick?.(lead);
                },
                children: "View"
              }
            ) })
          ]
        },
        lead.id
      )) })
    ] }) }) })
  ] });
}

function Analytics() {
  const [dateRange, setDateRange] = reactExports.useState("30d");
  const { stats, viewsData, leadsData, recentLeads, isLoading } = useAnalytics();
  if (isLoading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-center h-64", children: "Loading..." });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4 sm:space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl sm:text-3xl font-bold", children: "Analytics" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm sm:text-base text-muted-foreground mt-0.5 sm:mt-1", children: "Track your profile performance, lead generation, and search visibility" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2 flex-wrap", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", size: "sm", className: "flex-1 sm:flex-none", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Calendar, { className: "w-4 h-4 mr-2" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs sm:text-sm", children: dateRange === "7d" ? "Last 7 days" : dateRange === "30d" ? "Last 30 days" : "Last 90 days" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", size: "sm", className: "flex-1 sm:flex-none", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { className: "w-4 h-4 mr-2" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs sm:text-sm", children: "Export" })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Tabs, { defaultValue: "overview", className: "space-y-4 sm:space-y-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsList, { className: "grid w-full grid-cols-2 sm:w-auto", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsTrigger, { value: "overview", className: "gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(BarChart3, { className: "h-4 w-4" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hidden sm:inline", children: "Profile Analytics" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "sm:hidden", children: "Overview" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsTrigger, { value: "search", className: "gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "h-4 w-4" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hidden sm:inline", children: "Search Analytics" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "sm:hidden", children: "Search" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsContent, { value: "overview", className: "space-y-4 sm:space-y-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            StatsCard,
            {
              title: "Total Views",
              value: stats.totalViews.toLocaleString(),
              icon: Eye,
              iconColor: "text-blue-600",
              iconBgColor: "bg-blue-100"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            StatsCard,
            {
              title: "Unique Visitors",
              value: stats.uniqueVisitors.toLocaleString(),
              icon: Users,
              iconColor: "text-green-600",
              iconBgColor: "bg-green-100"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            StatsCard,
            {
              title: "Total Leads",
              value: stats.totalLeads,
              icon: UserPlus,
              iconColor: "text-purple-600",
              iconBgColor: "bg-purple-100"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            StatsCard,
            {
              title: "Conversion Rate",
              value: `${stats.conversionRate}%`,
              icon: TrendingUp,
              iconColor: "text-orange-600",
              iconBgColor: "bg-orange-100"
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          AnalyticsChart,
          {
            title: "Profile Views",
            description: "Views and unique visitors over time",
            data: viewsData.length > 0 ? viewsData : [{ name: "No data", views: 0, visitors: 0 }],
            series: [
              { dataKey: "views", name: "Total Views", color: "#3B82F6" },
              {
                dataKey: "visitors",
                name: "Unique Visitors",
                color: "#10B981"
              }
            ],
            type: "area",
            height: window.innerWidth < 640 ? 200 : 300
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { className: "pb-3 sm:pb-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-base sm:text-lg", children: "Leads by Type" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { className: "text-xs sm:text-sm", children: "Distribution of lead inquiries" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: leadsData.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2 sm:space-y-3", children: leadsData.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "div",
              {
                className: "flex items-center justify-between py-2 min-h-[44px]",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 sm:gap-3", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-3 h-3 rounded-full bg-primary flex-shrink-0" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs sm:text-sm font-medium", children: item.name })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 sm:gap-3", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs sm:text-sm text-muted-foreground whitespace-nowrap", children: [
                      item.value,
                      " leads"
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs sm:text-sm font-semibold min-w-[35px] text-right", children: [
                      stats.totalLeads > 0 ? (item.value / stats.totalLeads * 100).toFixed(0) : 0,
                      "%"
                    ] })
                  ] })
                ]
              },
              item.name
            )) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs sm:text-sm text-muted-foreground text-center py-6 sm:py-8", children: "No leads yet" }) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { className: "pb-3 sm:pb-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-base sm:text-lg", children: "Recent Activity" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { className: "text-xs sm:text-sm", children: "Latest profile interactions" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs sm:text-sm text-muted-foreground text-center py-6 sm:py-8", children: stats.totalViews > 0 ? `${stats.totalViews} profile views` : "No activity yet" }) })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          LeadsTable,
          {
            leads: recentLeads,
            onLeadClick: (lead) => console.log("Lead clicked:", lead)
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "search", className: "space-y-4 sm:space-y-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SearchAnalyticsDashboard, {}) })
    ] })
  ] });
}

export { Analytics as default };
