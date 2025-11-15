import { r as reactExports, j as jsxRuntimeExports } from "./react-vendor-MTOt5FFF.js";
import { j as Button, C as Card, f as CardHeader, g as CardTitle, o as CardContent, J as Tabs, K as TabsList, M as TabsTrigger, N as TabsContent, h as CardDescription, B as Badge, D as Dialog, a7 as DialogTrigger, l as DialogContent, m as DialogHeader, n as DialogTitle, G as DialogDescription, L as Label, I as Input, T as Textarea, S as Select, a as SelectTrigger, b as SelectValue, d as SelectContent, e as SelectItem, w as Switch, O as DialogFooter, Z as Table, _ as TableHeader, $ as TableRow, a0 as TableHead, a1 as TableBody, a2 as TableCell } from "./ui-components-CbrOUI4e.js";
import { s as supabase } from "./supabase-eNUZs_JT.js";
import { u as useToast } from "./index-CAwD2FR9.js";
import { aM as RefreshCw, c as CircleAlert, aB as TriangleAlert, T as TrendingUp, n as CircleCheck, aN as Bell, X, b3 as WandSparkles, aw as Plus, as as Play, b4 as Pause, az as Trash2, aD as CircleX, a8 as Clock, S as Search, ac as TrendingDown, aL as Minus, U as Users, h as ExternalLink, B as BarChart3, aj as FileText, b5 as FileCode, b6 as Bot, b7 as Map, b2 as Database, Z as Zap, a7 as Link, G as Globe, a9 as Image, b8 as Repeat, ae as Copy, ao as Shield, aI as Smartphone, b9 as Activity } from "./icons-CFSiufIk.js";
import { b as formatDistanceToNow } from "./utils-DRaK7sdV.js";
import { R as ResponsiveContainer, L as LineChart, X as XAxis, Y as YAxis, T as Tooltip, b as Line } from "./charts-BvRX79AF.js";
const AlertsDashboard = () => {
  var _a, _b;
  const { toast } = useToast();
  const [loading, setLoading] = reactExports.useState(false);
  const [notifications, setNotifications] = reactExports.useState([]);
  const [recentAudits, setRecentAudits] = reactExports.useState([]);
  const [criticalCount, setCriticalCount] = reactExports.useState(0);
  const [warningCount, setWarningCount] = reactExports.useState(0);
  const [opportunityCount, setOpportunityCount] = reactExports.useState(0);
  reactExports.useEffect(() => {
    loadAlerts();
    loadRecentAudits();
    const subscription = supabase.channel("seo_notifications").on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "seo_notification_queue"
      },
      (payload) => {
        setNotifications((prev) => [payload.new, ...prev]);
        updateCounts([payload.new, ...notifications]);
      }
    ).subscribe();
    return () => {
      subscription.unsubscribe();
    };
  }, []);
  const loadAlerts = async () => {
    try {
      const { data, error } = await supabase.from("seo_notification_queue").select("*").order("created_at", { ascending: false }).limit(50);
      if (error) throw error;
      setNotifications(data || []);
      updateCounts(data || []);
    } catch (error) {
      console.error("Error loading alerts:", error);
    }
  };
  const loadRecentAudits = async () => {
    try {
      const { data, error } = await supabase.from("seo_audit_schedules").select("*").not("last_run_at", "is", null).order("last_run_at", { ascending: false }).limit(5);
      if (error) throw error;
      setRecentAudits(data || []);
    } catch (error) {
      console.error("Error loading recent audits:", error);
    }
  };
  const updateCounts = (notifs) => {
    const critical = notifs.filter((n) => n.severity === "critical" && n.status === "pending").length;
    const warnings2 = notifs.filter((n) => n.severity === "medium" && n.status === "pending").length;
    const opportunities2 = notifs.filter((n) => n.notification_type === "opportunity" && n.status === "pending").length;
    setCriticalCount(critical);
    setWarningCount(warnings2);
    setOpportunityCount(opportunities2);
  };
  const dismissNotification = async (id) => {
    try {
      const { error } = await supabase.from("seo_notification_queue").update({ status: "sent" }).eq("id", id);
      if (error) throw error;
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      updateCounts(notifications.filter((n) => n.id !== id));
      toast({
        title: "Notification dismissed",
        description: "The notification has been marked as read"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };
  const refreshAlerts = async () => {
    setLoading(true);
    await loadAlerts();
    await loadRecentAudits();
    setLoading(false);
    toast({
      title: "Alerts refreshed",
      description: "Latest alerts and audit results loaded"
    });
  };
  const getSeverityIcon = (severity) => {
    switch (severity) {
      case "critical":
        return /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { className: "h-5 w-5 text-red-500" });
      case "high":
      case "medium":
        return /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { className: "h-5 w-5 text-yellow-500" });
      case "low":
        return /* @__PURE__ */ jsxRuntimeExports.jsx(TrendingUp, { className: "h-5 w-5 text-blue-500" });
      default:
        return /* @__PURE__ */ jsxRuntimeExports.jsx(Bell, { className: "h-5 w-5 text-gray-500" });
    }
  };
  const getSeverityBadge = (severity) => {
    const variants = {
      critical: "destructive",
      high: "destructive",
      medium: "default",
      low: "secondary"
    };
    return /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: variants[severity] || "default", children: severity });
  };
  const criticalIssues = notifications.filter(
    (n) => (n.severity === "critical" || n.severity === "high") && n.notification_type === "critical_issue" && n.status === "pending"
  );
  const warnings = notifications.filter(
    (n) => n.severity === "medium" && n.notification_type === "warning" && n.status === "pending"
  );
  const opportunities = notifications.filter(
    (n) => n.notification_type === "opportunity" && n.status === "pending"
  );
  const competitorAlerts = notifications.filter(
    (n) => n.notification_type === "competitor_alert" && n.status === "pending"
  );
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-2xl font-bold", children: "SEO Alerts Dashboard" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground", children: "Real-time monitoring of SEO issues, warnings, and opportunities" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: refreshAlerts, disabled: loading, variant: "outline", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { className: "h-4 w-4 mr-2 ".concat(loading ? "animate-spin" : "") }),
        "Refresh"
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 md:grid-cols-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "border-red-500", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "text-sm flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { className: "h-4 w-4 text-red-500" }),
          "Critical Issues"
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-3xl font-bold text-red-600", children: criticalCount }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mt-1", children: "Require immediate attention" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "border-yellow-500", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "text-sm flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { className: "h-4 w-4 text-yellow-500" }),
          "Warnings"
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-3xl font-bold text-yellow-600", children: warningCount }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mt-1", children: "Should be addressed soon" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "border-blue-500", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "text-sm flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(TrendingUp, { className: "h-4 w-4 text-blue-500" }),
          "Opportunities"
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-3xl font-bold text-blue-600", children: opportunityCount }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mt-1", children: "Potential improvements" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "border-green-500", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "text-sm flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "h-4 w-4 text-green-500" }),
          "Health Score"
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-3xl font-bold text-green-600", children: ((_b = (_a = recentAudits[0]) == null ? void 0 : _a.last_run_results) == null ? void 0 : _b.overall_score) || "N/A" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mt-1", children: "Latest audit score" })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Tabs, { defaultValue: "critical", className: "w-full", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsList, { className: "grid w-full grid-cols-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsTrigger, { value: "critical", children: [
          "Critical (",
          criticalIssues.length,
          ")"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsTrigger, { value: "warnings", children: [
          "Warnings (",
          warnings.length,
          ")"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsTrigger, { value: "opportunities", children: [
          "Opportunities (",
          opportunities.length,
          ")"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsTrigger, { value: "competitor", children: [
          "Competitors (",
          competitorAlerts.length,
          ")"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "critical", className: "space-y-4", children: criticalIssues.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "pt-6 text-center text-muted-foreground", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "h-12 w-12 mx-auto mb-2 text-green-500" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "No critical issues detected" })
      ] }) }) : criticalIssues.map((notification) => /* @__PURE__ */ jsxRuntimeExports.jsx(
        NotificationCard,
        {
          notification,
          onDismiss: dismissNotification,
          getSeverityIcon,
          getSeverityBadge
        },
        notification.id
      )) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "warnings", className: "space-y-4", children: warnings.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "pt-6 text-center text-muted-foreground", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "h-12 w-12 mx-auto mb-2 text-green-500" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "No warnings at this time" })
      ] }) }) : warnings.map((notification) => /* @__PURE__ */ jsxRuntimeExports.jsx(
        NotificationCard,
        {
          notification,
          onDismiss: dismissNotification,
          getSeverityIcon,
          getSeverityBadge
        },
        notification.id
      )) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "opportunities", className: "space-y-4", children: opportunities.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "pt-6 text-center text-muted-foreground", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(TrendingUp, { className: "h-12 w-12 mx-auto mb-2 text-blue-500" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "No new opportunities identified" })
      ] }) }) : opportunities.map((notification) => /* @__PURE__ */ jsxRuntimeExports.jsx(
        NotificationCard,
        {
          notification,
          onDismiss: dismissNotification,
          getSeverityIcon,
          getSeverityBadge
        },
        notification.id
      )) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "competitor", className: "space-y-4", children: competitorAlerts.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "pt-6 text-center text-muted-foreground", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Bell, { className: "h-12 w-12 mx-auto mb-2 text-gray-400" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "No competitor alerts" })
      ] }) }) : competitorAlerts.map((notification) => /* @__PURE__ */ jsxRuntimeExports.jsx(
        NotificationCard,
        {
          notification,
          onDismiss: dismissNotification,
          getSeverityIcon,
          getSeverityBadge
        },
        notification.id
      )) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: "Recent Audits" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: "Latest automated audit results" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: recentAudits.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-center text-muted-foreground py-4", children: "No recent audits found" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-4", children: recentAudits.map((audit) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "div",
        {
          className: "flex items-center justify-between p-4 border rounded-lg",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "font-semibold", children: audit.name }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: audit.last_run_at && "Ran ".concat(formatDistanceToNow(new Date(audit.last_run_at), {
                addSuffix: true
              })) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4", children: [
              audit.last_run_results && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-2xl font-bold", children: audit.last_run_results.overall_score || "N/A" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: "Score" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Badge,
                {
                  variant: audit.last_run_status === "success" ? "default" : "destructive",
                  children: audit.last_run_status
                }
              )
            ] })
          ]
        },
        audit.id
      )) }) })
    ] })
  ] });
};
const NotificationCard = ({
  notification,
  onDismiss,
  getSeverityIcon,
  getSeverityBadge
}) => {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        getSeverityIcon(notification.severity),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-lg", children: notification.title }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: formatDistanceToNow(new Date(notification.created_at), {
            addSuffix: true
          }) })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        getSeverityBadge(notification.severity),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            variant: "ghost",
            size: "icon",
            onClick: () => onDismiss(notification.id),
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-4 w-4" })
          }
        )
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm mb-4", children: notification.message }),
      notification.data && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
        notification.data.critical_issues && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h5", { className: "font-semibold text-sm mb-1", children: "Critical Issues:" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "list-disc list-inside text-sm text-muted-foreground", children: notification.data.critical_issues.slice(0, 3).map((issue, idx) => /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: issue }, idx)) })
        ] }),
        notification.data.warnings && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h5", { className: "font-semibold text-sm mb-1", children: "Warnings:" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "list-disc list-inside text-sm text-muted-foreground", children: notification.data.warnings.slice(0, 3).map((warning, idx) => /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: warning }, idx)) })
        ] }),
        notification.data.overall_score && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mt-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-semibold", children: "Overall Score:" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-lg font-bold", children: [
            notification.data.overall_score,
            "/100"
          ] })
        ] })
      ] })
    ] })
  ] });
};
const ISSUE_TYPES = [
  { value: "missing_meta_description", label: "Missing Meta Description" },
  { value: "missing_alt_text", label: "Missing Alt Text" },
  { value: "broken_link", label: "Broken Link" },
  { value: "missing_h1", label: "Missing H1" },
  { value: "duplicate_title", label: "Duplicate Title" },
  { value: "thin_content", label: "Thin Content" },
  { value: "slow_page", label: "Slow Page Speed" },
  { value: "missing_schema", label: "Missing Schema Markup" }
];
const FIX_ACTIONS = [
  { value: "generate_meta_description", label: "Generate Meta Description (AI)" },
  { value: "generate_alt_text", label: "Generate Alt Text (AI)" },
  { value: "update_link", label: "Update Link" },
  { value: "add_schema_markup", label: "Add Schema Markup" },
  { value: "optimize_image", label: "Optimize Image" },
  { value: "fix_heading_structure", label: "Fix Heading Structure" }
];
const AutoFixEngine = () => {
  const { toast } = useToast();
  const [rules, setRules] = reactExports.useState([]);
  const [history, setHistory] = reactExports.useState([]);
  const [pendingApprovals, setPendingApprovals] = reactExports.useState([]);
  const [loading, setLoading] = reactExports.useState(false);
  const [isDialogOpen, setIsDialogOpen] = reactExports.useState(false);
  const [formData, setFormData] = reactExports.useState({
    name: "",
    description: "",
    issue_type: "",
    fix_action: "",
    requires_approval: true,
    auto_apply: false,
    priority: 50
  });
  reactExports.useEffect(() => {
    loadRules();
    loadHistory();
    loadPendingApprovals();
  }, []);
  const loadRules = async () => {
    try {
      const { data, error } = await supabase.from("seo_autofix_rules").select("*").order("priority", { ascending: false });
      if (error) throw error;
      setRules(data || []);
    } catch (error) {
      console.error("Error loading rules:", error);
    }
  };
  const loadHistory = async () => {
    try {
      const { data, error } = await supabase.from("seo_autofix_history").select("*").order("applied_at", { ascending: false }).limit(50);
      if (error) throw error;
      setHistory(data || []);
    } catch (error) {
      console.error("Error loading history:", error);
    }
  };
  const loadPendingApprovals = async () => {
    try {
      const { data, error } = await supabase.from("seo_autofix_history").select("*").eq("result", "pending_approval").order("applied_at", { ascending: false });
      if (error) throw error;
      setPendingApprovals(data || []);
    } catch (error) {
      console.error("Error loading pending approvals:", error);
    }
  };
  const createRule = async () => {
    if (!formData.name || !formData.issue_type || !formData.fix_action) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.from("seo_autofix_rules").insert([
        {
          name: formData.name,
          description: formData.description,
          issue_type: formData.issue_type,
          conditions: {},
          fix_action: { action: formData.fix_action },
          requires_approval: formData.requires_approval,
          auto_apply: formData.auto_apply,
          priority: formData.priority
        }
      ]).select();
      if (error) throw error;
      toast({
        title: "Rule Created",
        description: "Auto-fix rule has been created successfully"
      });
      setIsDialogOpen(false);
      setFormData({
        name: "",
        description: "",
        issue_type: "",
        fix_action: "",
        requires_approval: true,
        auto_apply: false,
        priority: 50
      });
      await loadRules();
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const toggleRuleActive = async (ruleId, currentActive) => {
    try {
      const { error } = await supabase.from("seo_autofix_rules").update({ active: !currentActive }).eq("id", ruleId);
      if (error) throw error;
      toast({
        title: currentActive ? "Rule Disabled" : "Rule Enabled",
        description: "Auto-fix rule has been ".concat(currentActive ? "disabled" : "enabled")
      });
      await loadRules();
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };
  const deleteRule = async (ruleId) => {
    if (!confirm("Are you sure you want to delete this rule?")) return;
    try {
      const { error } = await supabase.from("seo_autofix_rules").delete().eq("id", ruleId);
      if (error) throw error;
      toast({
        title: "Rule Deleted",
        description: "Auto-fix rule has been deleted"
      });
      await loadRules();
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };
  const rejectFix = async (historyId) => {
    try {
      const { error } = await supabase.from("seo_autofix_history").update({ result: "failed", error_message: "Rejected by admin" }).eq("id", historyId);
      if (error) throw error;
      toast({
        title: "Fix Rejected",
        description: "The fix has been rejected"
      });
      loadPendingApprovals();
      loadHistory();
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };
  const getResultIcon = (result) => {
    switch (result) {
      case "success":
        return /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "h-5 w-5 text-green-500" });
      case "failed":
        return /* @__PURE__ */ jsxRuntimeExports.jsx(CircleX, { className: "h-5 w-5 text-red-500" });
      case "pending_approval":
        return /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "h-5 w-5 text-yellow-500" });
      default:
        return /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "h-5 w-5 text-gray-500" });
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h2", { className: "text-2xl font-bold flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(WandSparkles, { className: "h-6 w-6" }),
          "Auto-Fix Engine"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground", children: "Automatically detect and fix common SEO issues" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Dialog, { open: isDialogOpen, onOpenChange: setIsDialogOpen, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-4 w-4 mr-2" }),
          "Create Rule"
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "max-w-2xl", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: "Create Auto-Fix Rule" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(DialogDescription, { children: "Define a rule to automatically fix SEO issues" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4 py-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "rule-name", children: "Rule Name *" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  id: "rule-name",
                  placeholder: "e.g., Auto-generate missing alt text",
                  value: formData.name,
                  onChange: (e) => setFormData({ ...formData, name: e.target.value })
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "rule-description", children: "Description" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Textarea,
                {
                  id: "rule-description",
                  placeholder: "Describe what this rule does...",
                  value: formData.description,
                  onChange: (e) => setFormData({ ...formData, description: e.target.value })
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "issue-type", children: "Issue Type *" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  Select,
                  {
                    value: formData.issue_type,
                    onValueChange: (value) => setFormData({ ...formData, issue_type: value }),
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Select issue type" }) }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: ISSUE_TYPES.map((type) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: type.value, children: type.label }, type.value)) })
                    ]
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "fix-action", children: "Fix Action *" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  Select,
                  {
                    value: formData.fix_action,
                    onValueChange: (value) => setFormData({ ...formData, fix_action: value }),
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Select fix action" }) }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: FIX_ACTIONS.map((action) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: action.value, children: action.label }, action.value)) })
                    ]
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "priority", children: "Priority (0-100)" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  id: "priority",
                  type: "number",
                  min: "0",
                  max: "100",
                  value: formData.priority,
                  onChange: (e) => setFormData({
                    ...formData,
                    priority: parseInt(e.target.value) || 50
                  })
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Higher priority rules are executed first" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center space-x-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Switch,
                  {
                    id: "requires-approval",
                    checked: formData.requires_approval,
                    onCheckedChange: (checked) => setFormData({ ...formData, requires_approval: checked })
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "requires-approval", children: "Requires Approval" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center space-x-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Switch,
                  {
                    id: "auto-apply",
                    checked: formData.auto_apply,
                    onCheckedChange: (checked) => setFormData({ ...formData, auto_apply: checked }),
                    disabled: formData.requires_approval
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "auto-apply", children: "Auto Apply" })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", onClick: () => setIsDialogOpen(false), children: "Cancel" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: createRule, disabled: loading, children: loading ? "Creating..." : "Create Rule" })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 md:grid-cols-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-sm", children: "Active Rules" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-3xl font-bold", children: rules.filter((r) => r.active).length }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-sm", children: "Pending Approvals" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-3xl font-bold text-yellow-600", children: pendingApprovals.length }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-sm", children: "Total Fixes Applied" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-3xl font-bold text-blue-600", children: rules.reduce((sum, r) => sum + r.applied_count, 0) }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-sm", children: "Success Rate" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-3xl font-bold text-green-600", children: [
          rules.reduce((sum, r) => sum + r.applied_count, 0) > 0 ? Math.round(
            rules.reduce((sum, r) => sum + r.success_count, 0) / rules.reduce((sum, r) => sum + r.applied_count, 0) * 100
          ) : 0,
          "%"
        ] }) })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Tabs, { defaultValue: "rules", className: "w-full", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsList, { className: "grid w-full grid-cols-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsTrigger, { value: "rules", children: [
          "Rules (",
          rules.length,
          ")"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsTrigger, { value: "approvals", children: [
          "Pending Approvals (",
          pendingApprovals.length,
          ")"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsTrigger, { value: "history", children: [
          "History (",
          history.length,
          ")"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "rules", className: "space-y-4", children: rules.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "pt-6 text-center text-muted-foreground", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(WandSparkles, { className: "h-12 w-12 mx-auto mb-2 text-gray-400" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "No auto-fix rules created yet" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { className: "mt-4", onClick: () => setIsDialogOpen(true), children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-4 w-4 mr-2" }),
          "Create Your First Rule"
        ] })
      ] }) }) : rules.map((rule) => {
        var _a;
        return /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "flex items-center gap-2", children: [
                rule.name,
                /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { variant: rule.active ? "default" : "secondary", children: [
                  rule.active ? /* @__PURE__ */ jsxRuntimeExports.jsx(Play, { className: "h-3 w-3 mr-1" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Pause, { className: "h-3 w-3 mr-1" }),
                  rule.active ? "Active" : "Inactive"
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { variant: "outline", children: [
                  "Priority: ",
                  rule.priority
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: rule.description })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Button,
                {
                  variant: "ghost",
                  size: "icon",
                  onClick: () => toggleRuleActive(rule.id, rule.active),
                  children: rule.active ? /* @__PURE__ */ jsxRuntimeExports.jsx(Pause, { className: "h-4 w-4" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Play, { className: "h-4 w-4" })
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Button,
                {
                  variant: "ghost",
                  size: "icon",
                  onClick: () => deleteRule(rule.id),
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-4 w-4" })
                }
              )
            ] })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-4 text-sm", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground", children: "Issue Type" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-semibold", children: ((_a = ISSUE_TYPES.find((t) => t.value === rule.issue_type)) == null ? void 0 : _a.label) || rule.issue_type })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground", children: "Applied" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-semibold", children: rule.applied_count })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground", children: "Success" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-semibold text-green-600", children: rule.success_count })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground", children: "Failed" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-semibold text-red-600", children: rule.failure_count })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 flex gap-2", children: [
              rule.requires_approval && /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", children: "Requires Approval" }),
              rule.auto_apply && /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", children: "Auto Apply" })
            ] })
          ] })
        ] }, rule.id);
      }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "approvals", className: "space-y-4", children: pendingApprovals.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "pt-6 text-center text-muted-foreground", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "h-12 w-12 mx-auto mb-2 text-green-500" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "No pending approvals" })
      ] }) }) : pendingApprovals.map((approval) => /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "flex items-center gap-2", children: [
              getResultIcon(approval.result),
              "Pending Fix Approval"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: formatDistanceToNow(new Date(approval.applied_at), {
              addSuffix: true
            }) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Button,
              {
                size: "sm",
                variant: "outline",
                onClick: () => approveFiximestamp(approval.id),
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "h-4 w-4 mr-1" }),
                  "Approve"
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Button,
              {
                size: "sm",
                variant: "destructive",
                onClick: () => rejectFix(approval.id),
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(CircleX, { className: "h-4 w-4 mr-1" }),
                  "Reject"
                ]
              }
            )
          ] })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-semibold", children: "Issue Type:" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: approval.issue_type })
          ] }),
          approval.fix_applied && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-semibold", children: "Proposed Fix:" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("pre", { className: "text-xs bg-muted p-2 rounded-md mt-1 overflow-auto", children: JSON.stringify(approval.fix_applied, null, 2) })
          ] })
        ] }) })
      ] }, approval.id)) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "history", className: "space-y-4", children: history.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "pt-6 text-center text-muted-foreground", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "h-12 w-12 mx-auto mb-2 text-gray-400" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "No fix history yet" })
      ] }) }) : history.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "flex items-center gap-2", children: [
              getResultIcon(item.result),
              item.issue_type
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: formatDistanceToNow(new Date(item.applied_at), {
              addSuffix: true
            }) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Badge,
            {
              variant: item.result === "success" ? "default" : item.result === "failed" ? "destructive" : "secondary",
              children: item.result
            }
          )
        ] }) }),
        item.error_message && /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-red-600", children: item.error_message }) })
      ] }, item.id)) })
    ] })
  ] });
};
const KeywordsTracker = () => {
  const { toast } = useToast();
  const [keywords, setKeywords] = reactExports.useState([]);
  const [loading, setLoading] = reactExports.useState(false);
  const [searchTerm, setSearchTerm] = reactExports.useState("");
  const [selectedKeyword, setSelectedKeyword] = reactExports.useState(null);
  const [keywordHistory, setKeywordHistory] = reactExports.useState([]);
  reactExports.useEffect(() => {
    loadKeywords();
  }, []);
  const loadKeywords = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from("seo_keywords").select("*").order("current_position", { ascending: true });
      if (error) throw error;
      setKeywords(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const loadKeywordHistory = async (keyword) => {
    try {
      const { data, error } = await supabase.from("seo_keyword_history").select("keyword, position, checked_at").eq("keyword", keyword).order("checked_at", { ascending: true }).limit(30);
      if (error) throw error;
      setKeywordHistory(data || []);
    } catch (error) {
      console.error("Error loading keyword history:", error);
    }
  };
  const checkKeywordPositions = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke("check-keyword-positions", {
        body: {}
      });
      if (error) throw error;
      toast({
        title: "Positions Updated",
        description: "Keyword positions have been refreshed"
      });
      await loadKeywords();
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const getTrendIcon = (current, previous) => {
    if (current < previous) {
      return /* @__PURE__ */ jsxRuntimeExports.jsx(TrendingUp, { className: "h-4 w-4 text-green-500" });
    } else if (current > previous) {
      return /* @__PURE__ */ jsxRuntimeExports.jsx(TrendingDown, { className: "h-4 w-4 text-red-500" });
    } else {
      return /* @__PURE__ */ jsxRuntimeExports.jsx(Minus, { className: "h-4 w-4 text-gray-500" });
    }
  };
  const getPositionChange = (current, previous) => {
    const change = previous - current;
    if (change > 0) {
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-green-600", children: [
        "+",
        change
      ] });
    } else if (change < 0) {
      return /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-red-600", children: change });
    } else {
      return /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-gray-500", children: "0" });
    }
  };
  const getDifficultyBadge = (difficulty) => {
    if (difficulty >= 70) return /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "destructive", children: "Hard" });
    if (difficulty >= 40) return /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "default", children: "Medium" });
    return /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "secondary", children: "Easy" });
  };
  const filteredKeywords = keywords.filter(
    (kw) => kw.keyword.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const topMovers = keywords.filter((kw) => kw.previous_position && kw.current_position !== kw.previous_position).sort((a, b) => b.previous_position - b.current_position - (a.previous_position - a.current_position)).slice(0, 5);
  const topRanked = keywords.filter((kw) => kw.current_position <= 10);
  const needsAttention = keywords.filter((kw) => kw.current_position > 20 && kw.search_volume > 100);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-2xl font-bold", children: "Keywords Tracker" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground", children: "Monitor keyword rankings and track position changes" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: checkKeywordPositions, disabled: loading, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { className: "h-4 w-4 mr-2 ".concat(loading ? "animate-spin" : "") }),
        "Check Positions"
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 md:grid-cols-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-sm", children: "Total Keywords" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-3xl font-bold", children: keywords.length }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mt-1", children: "Being tracked" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-sm", children: "Top 10 Rankings" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-3xl font-bold text-green-600", children: topRanked.length }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mt-1", children: "Keywords in top 10" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-sm", children: "Biggest Gain" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: topMovers.length > 0 && topMovers[0].current_position < topMovers[0].previous_position ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-3xl font-bold text-green-600", children: [
            "+",
            topMovers[0].previous_position - topMovers[0].current_position
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mt-1", children: topMovers[0].keyword })
        ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-3xl font-bold text-gray-400", children: "-" }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "text-sm flex items-center gap-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { className: "h-4 w-4" }),
          "Needs Attention"
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-3xl font-bold text-yellow-600", children: needsAttention.length }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mt-1", children: "Keywords to optimize" })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex gap-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative flex-1", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "absolute left-3 top-3 h-4 w-4 text-muted-foreground" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Input,
        {
          placeholder: "Search keywords...",
          value: searchTerm,
          onChange: (e) => setSearchTerm(e.target.value),
          className: "pl-9"
        }
      )
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: "All Keywords" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardDescription, { children: [
          filteredKeywords.length,
          " keywords found"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Table, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(TableHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { children: "Keyword" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { children: "Position" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { children: "Change" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { children: "Search Volume" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { children: "Difficulty" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { children: "URL" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { children: "Last Checked" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { children: "Actions" })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TableBody, { children: filteredKeywords.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(TableRow, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { colSpan: 8, className: "text-center text-muted-foreground", children: "No keywords found" }) }) : filteredKeywords.map((keyword) => {
          var _a;
          return /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "font-medium", children: keyword.keyword }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { variant: keyword.current_position <= 10 ? "default" : "outline", children: [
              "#",
              keyword.current_position
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1", children: [
              getTrendIcon(keyword.current_position, keyword.previous_position || keyword.current_position),
              getPositionChange(keyword.current_position, keyword.previous_position || keyword.current_position)
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: ((_a = keyword.search_volume) == null ? void 0 : _a.toLocaleString()) || "N/A" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: getDifficultyBadge(keyword.difficulty || 0) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "max-w-xs truncate", children: keyword.url || "-" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: keyword.last_checked ? new Date(keyword.last_checked).toLocaleDateString() : "Never" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                variant: "ghost",
                size: "sm",
                onClick: () => {
                  setSelectedKeyword(keyword);
                  loadKeywordHistory(keyword.keyword);
                },
                children: "View History"
              }
            ) })
          ] }, keyword.id);
        }) })
      ] }) }) })
    ] }),
    selectedKeyword && /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { children: [
          "Position History: ",
          selectedKeyword.keyword
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: "Ranking positions over the last 30 checks" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { children: [
        keywordHistory.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(ResponsiveContainer, { width: "100%", height: 300, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(LineChart, { data: keywordHistory, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            XAxis,
            {
              dataKey: "checked_at",
              tickFormatter: (date) => new Date(date).toLocaleDateString()
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(YAxis, { reversed: true, domain: [0, 100] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Tooltip,
            {
              labelFormatter: (date) => new Date(date).toLocaleDateString(),
              formatter: (value) => ["Position ".concat(value), "Rank"]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Line,
            {
              type: "monotone",
              dataKey: "position",
              stroke: "#2563eb",
              strokeWidth: 2,
              dot: { r: 4 }
            }
          )
        ] }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-center text-muted-foreground py-8", children: "No history available for this keyword" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", onClick: () => setSelectedKeyword(null), children: "Close" }) })
      ] })
    ] }),
    topMovers.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: "Top Movers" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: "Keywords with the biggest position changes" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-4", children: topMovers.map((keyword) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "div",
        {
          className: "flex items-center justify-between p-3 border rounded-lg",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "font-semibold", children: keyword.keyword }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-muted-foreground", children: [
                "Position: #",
                keyword.current_position
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
              getTrendIcon(keyword.current_position, keyword.previous_position),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-right", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-bold", children: getPositionChange(keyword.current_position, keyword.previous_position) }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-muted-foreground", children: [
                  keyword.previous_position,
                  " → ",
                  keyword.current_position
                ] })
              ] })
            ] })
          ]
        },
        keyword.id
      )) }) })
    ] })
  ] });
};
const CompetitorMatrix = () => {
  const { toast } = useToast();
  const [competitors, setCompetitors] = reactExports.useState([]);
  const [analysis, setAnalysis] = reactExports.useState([]);
  const [loading, setLoading] = reactExports.useState(false);
  const [isDialogOpen, setIsDialogOpen] = reactExports.useState(false);
  const [formData, setFormData] = reactExports.useState({
    competitor_domain: "",
    competitor_name: "",
    keywords: "",
    check_frequency: "weekly",
    alert_on_rank_change: true,
    alert_on_new_backlinks: true,
    rank_change_threshold: 5
  });
  reactExports.useEffect(() => {
    loadCompetitors();
    loadAnalysis();
  }, []);
  const loadCompetitors = async () => {
    try {
      const { data, error } = await supabase.from("seo_competitor_tracking").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      setCompetitors(data || []);
    } catch (error) {
      console.error("Error loading competitors:", error);
    }
  };
  const loadAnalysis = async () => {
    try {
      const { data, error } = await supabase.from("seo_competitor_analysis").select("*").order("analyzed_at", { ascending: false }).limit(100);
      if (error) throw error;
      setAnalysis(data || []);
    } catch (error) {
      console.error("Error loading analysis:", error);
    }
  };
  const addCompetitor = async () => {
    if (!formData.competitor_domain) {
      toast({
        title: "Domain Required",
        description: "Please enter a competitor domain",
        variant: "destructive"
      });
      return;
    }
    setLoading(true);
    try {
      const keywordsArray = formData.keywords.split(",").map((k) => k.trim()).filter((k) => k.length > 0);
      const { error } = await supabase.from("seo_competitor_tracking").insert([
        {
          competitor_domain: formData.competitor_domain,
          competitor_name: formData.competitor_name || formData.competitor_domain,
          keywords: keywordsArray,
          check_frequency: formData.check_frequency,
          alert_on_rank_change: formData.alert_on_rank_change,
          alert_on_new_backlinks: formData.alert_on_new_backlinks,
          rank_change_threshold: formData.rank_change_threshold
        }
      ]);
      if (error) throw error;
      toast({
        title: "Competitor Added",
        description: "Competitor tracking has been configured"
      });
      setIsDialogOpen(false);
      setFormData({
        competitor_domain: "",
        competitor_name: "",
        keywords: "",
        check_frequency: "weekly",
        alert_on_rank_change: true,
        alert_on_new_backlinks: true,
        rank_change_threshold: 5
      });
      await loadCompetitors();
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const deleteCompetitor = async (id) => {
    if (!confirm("Are you sure you want to stop tracking this competitor?")) return;
    try {
      const { error } = await supabase.from("seo_competitor_tracking").delete().eq("id", id);
      if (error) throw error;
      toast({
        title: "Competitor Removed",
        description: "Competitor tracking has been stopped"
      });
      await loadCompetitors();
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };
  const refreshAnalysis = async () => {
    setLoading(true);
    try {
      toast({
        title: "Analysis Refreshing",
        description: "Competitor analysis is being updated..."
      });
      await new Promise((resolve) => setTimeout(resolve, 2e3));
      await loadAnalysis();
      toast({
        title: "Analysis Complete",
        description: "Competitor data has been refreshed"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const keywordGaps = analysis.filter((a) => a.gap < 0 && Math.abs(a.gap) <= 10);
  const winningKeywords = analysis.filter((a) => a.gap > 0 && a.our_position <= 10);
  const opportunityKeywords = analysis.filter(
    (a) => a.their_position <= 10 && a.our_position > 10 && a.search_volume > 100
  );
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "text-2xl font-bold flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Users, { className: "h-6 w-6" }),
          "Competitor Matrix"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground", children: "Monitor competitor rankings and identify opportunities" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", onClick: refreshAnalysis, disabled: loading, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { className: "h-4 w-4 mr-2 ".concat(loading ? "animate-spin" : "") }),
          "Refresh"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Dialog, { open: isDialogOpen, onOpenChange: setIsDialogOpen, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-4 w-4 mr-2" }),
            "Add Competitor"
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: "Add Competitor" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(DialogDescription, { children: "Configure automated competitor tracking" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4 py-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "domain", children: "Competitor Domain *" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Input,
                  {
                    id: "domain",
                    placeholder: "competitor.com",
                    value: formData.competitor_domain,
                    onChange: (e) => setFormData({ ...formData, competitor_domain: e.target.value })
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "name", children: "Competitor Name" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Input,
                  {
                    id: "name",
                    placeholder: "Competitor Inc.",
                    value: formData.competitor_name,
                    onChange: (e) => setFormData({ ...formData, competitor_name: e.target.value })
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "keywords", children: "Keywords to Track" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Input,
                  {
                    id: "keywords",
                    placeholder: "keyword1, keyword2, keyword3",
                    value: formData.keywords,
                    onChange: (e) => setFormData({ ...formData, keywords: e.target.value })
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Comma-separated list of keywords" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "threshold", children: "Rank Change Alert Threshold" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Input,
                  {
                    id: "threshold",
                    type: "number",
                    value: formData.rank_change_threshold,
                    onChange: (e) => setFormData({
                      ...formData,
                      rank_change_threshold: parseInt(e.target.value) || 5
                    })
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Alert when position changes by more than this number" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "rank-alert", children: "Alert on Rank Changes" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Switch,
                  {
                    id: "rank-alert",
                    checked: formData.alert_on_rank_change,
                    onCheckedChange: (checked) => setFormData({ ...formData, alert_on_rank_change: checked })
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "backlink-alert", children: "Alert on New Backlinks" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Switch,
                  {
                    id: "backlink-alert",
                    checked: formData.alert_on_new_backlinks,
                    onCheckedChange: (checked) => setFormData({ ...formData, alert_on_new_backlinks: checked })
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", onClick: () => setIsDialogOpen(false), children: "Cancel" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: addCompetitor, disabled: loading, children: loading ? "Adding..." : "Add Competitor" })
            ] })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 md:grid-cols-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-sm", children: "Tracked Competitors" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-3xl font-bold", children: competitors.length }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mt-1", children: "Being monitored" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-sm", children: "Keyword Gaps" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-3xl font-bold text-yellow-600", children: keywordGaps.length }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mt-1", children: "Close to outranking" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-sm", children: "Winning Keywords" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-3xl font-bold text-green-600", children: winningKeywords.length }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mt-1", children: "Outranking competitors" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "text-sm flex items-center gap-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(TrendingUp, { className: "h-4 w-4" }),
          "Opportunities"
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-3xl font-bold text-blue-600", children: opportunityKeywords.length }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mt-1", children: "High-value targets" })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: "Tracked Competitors" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardDescription, { children: [
          competitors.length,
          " competitors being monitored"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: competitors.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center text-muted-foreground py-8", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Users, { className: "h-12 w-12 mx-auto mb-2 text-gray-400" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "No competitors tracked yet" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { className: "mt-4", onClick: () => setIsDialogOpen(true), children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-4 w-4 mr-2" }),
          "Add Your First Competitor"
        ] })
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-4", children: competitors.map((competitor) => {
        var _a;
        return /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            className: "flex items-center justify-between p-4 border rounded-lg",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "font-semibold", children: competitor.competitor_name }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "a",
                    {
                      href: "https://".concat(competitor.competitor_domain),
                      target: "_blank",
                      rel: "noopener noreferrer",
                      className: "text-muted-foreground hover:text-foreground",
                      children: /* @__PURE__ */ jsxRuntimeExports.jsx(ExternalLink, { className: "h-4 w-4" })
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: competitor.active ? "default" : "secondary", children: competitor.active ? "Active" : "Paused" })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground mt-1", children: competitor.competitor_domain }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2 mt-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { variant: "outline", children: [
                    ((_a = competitor.keywords) == null ? void 0 : _a.length) || 0,
                    " keywords"
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { variant: "outline", children: [
                    "Check ",
                    competitor.check_frequency
                  ] }),
                  competitor.alert_on_rank_change && /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { variant: "outline", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { className: "h-3 w-3 mr-1" }),
                    "Rank alerts"
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-right mr-4", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Last checked" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-semibold", children: competitor.last_checked_at ? new Date(competitor.last_checked_at).toLocaleDateString() : "Never" })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Button,
                  {
                    variant: "ghost",
                    size: "icon",
                    onClick: () => deleteCompetitor(competitor.id),
                    children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-4 w-4" })
                  }
                )
              ] })
            ]
          },
          competitor.id
        );
      }) }) })
    ] }),
    opportunityKeywords.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: "Top Opportunities" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: "High-value keywords where competitors rank well and you don't" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Table, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(TableHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { children: "Keyword" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { children: "Competitor" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { children: "Their Position" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { children: "Your Position" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { children: "Gap" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { children: "Search Volume" })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TableBody, { children: opportunityKeywords.slice(0, 10).map((item) => {
          var _a;
          return /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "font-medium", children: item.keyword }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: item.competitor_domain }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { variant: "default", children: [
              "#",
              item.their_position
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { variant: "outline", children: [
              "#",
              item.our_position
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1 text-red-600", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(TrendingDown, { className: "h-4 w-4" }),
              item.gap
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: ((_a = item.search_volume) == null ? void 0 : _a.toLocaleString()) || "N/A" })
          ] }, item.id);
        }) })
      ] }) })
    ] }),
    keywordGaps.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: "Close Keyword Gaps" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: "Keywords where you're close to outranking competitors" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-4", children: keywordGaps.slice(0, 5).map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "div",
        {
          className: "flex items-center justify-between p-3 border rounded-lg",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "font-semibold", children: item.keyword }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-muted-foreground", children: [
                "vs ",
                item.competitor_domain
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-muted-foreground", children: "You" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { variant: "outline", children: [
                  "#",
                  item.our_position
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-yellow-600 font-bold", children: [
                Math.abs(item.gap),
                " positions"
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-muted-foreground", children: "Them" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { variant: "default", children: [
                  "#",
                  item.their_position
                ] })
              ] })
            ] })
          ]
        },
        item.id
      )) }) })
    ] })
  ] });
};
const SEOManager = () => {
  const { toast } = useToast();
  const [loading, setLoading] = reactExports.useState(false);
  const [auditUrl, setAuditUrl] = reactExports.useState("");
  const [auditResults, setAuditResults] = reactExports.useState(null);
  const runSEOAudit = async () => {
    if (!auditUrl) {
      toast({
        title: "URL Required",
        description: "Please enter a URL to audit",
        variant: "destructive"
      });
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("seo-audit", {
        body: { url: auditUrl, auditType: "full", saveResults: true }
      });
      if (error) throw error;
      setAuditResults(data.audit);
      toast({
        title: "Audit Complete",
        description: "Overall score: ".concat(data.audit.overallScore, "/100")
      });
    } catch (error) {
      toast({
        title: "Audit Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "container mx-auto p-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-3xl font-bold mb-2", children: "SEO Management" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground", children: "Comprehensive SEO tools and analytics for your website" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Tabs, { defaultValue: "alerts", className: "w-full", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsList, { className: "grid grid-cols-4 lg:grid-cols-4 gap-2 h-auto mb-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsTrigger, { value: "alerts", className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Bell, { className: "w-4 h-4" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hidden sm:inline", children: "Alerts" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsTrigger, { value: "autofix", className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(WandSparkles, { className: "w-4 h-4" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hidden sm:inline", children: "Auto-Fix" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsTrigger, { value: "keywords", className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(BarChart3, { className: "w-4 h-4" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hidden sm:inline", children: "Keywords" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsTrigger, { value: "competitors", className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Users, { className: "w-4 h-4" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hidden sm:inline", children: "Competitors" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsList, { className: "grid grid-cols-6 lg:grid-cols-11 gap-2 h-auto", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsTrigger, { value: "audit", className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "w-4 h-4" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hidden sm:inline", children: "Audit" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsTrigger, { value: "pages", className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { className: "w-4 h-4" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hidden sm:inline", children: "Pages" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsTrigger, { value: "monitoring", className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Bell, { className: "w-4 h-4" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hidden sm:inline", children: "Monitoring" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsTrigger, { value: "meta", className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(FileCode, { className: "w-4 h-4" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hidden sm:inline", children: "Meta Tags" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsTrigger, { value: "robots", className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Bot, { className: "w-4 h-4" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hidden sm:inline", children: "robots.txt" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsTrigger, { value: "sitemap", className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Map, { className: "w-4 h-4" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hidden sm:inline", children: "Sitemap" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsTrigger, { value: "structured", className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Database, { className: "w-4 h-4" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hidden sm:inline", children: "Schema" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsTrigger, { value: "performance", className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Zap, { className: "w-4 h-4" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hidden sm:inline", children: "Performance" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsTrigger, { value: "backlinks", className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(TrendingUp, { className: "w-4 h-4" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hidden sm:inline", children: "Backlinks" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsList, { className: "grid grid-cols-6 lg:grid-cols-11 gap-2 h-auto mt-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsTrigger, { value: "broken-links", className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(ExternalLink, { className: "w-4 h-4" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hidden sm:inline", children: "Broken Links" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsTrigger, { value: "link-structure", className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { className: "w-4 h-4" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hidden sm:inline", children: "Links" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsTrigger, { value: "content", className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { className: "w-4 h-4" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hidden sm:inline", children: "Content" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsTrigger, { value: "crawler", className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Globe, { className: "w-4 h-4" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hidden sm:inline", children: "Crawler" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsTrigger, { value: "images", className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Image, { className: "w-4 h-4" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hidden sm:inline", children: "Images" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsTrigger, { value: "redirects", className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Repeat, { className: "w-4 h-4" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hidden sm:inline", children: "Redirects" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsTrigger, { value: "duplicate", className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Copy, { className: "w-4 h-4" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hidden sm:inline", children: "Duplicates" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsTrigger, { value: "security", className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Shield, { className: "w-4 h-4" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hidden sm:inline", children: "Security" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsTrigger, { value: "mobile", className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Smartphone, { className: "w-4 h-4" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hidden sm:inline", children: "Mobile" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsTrigger, { value: "budget", className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "w-4 h-4" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hidden sm:inline", children: "Budget" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsTrigger, { value: "semantic", className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Activity, { className: "w-4 h-4" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hidden sm:inline", children: "Semantic" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "audit", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: "SEO Audit" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: "Run a comprehensive SEO audit on any URL" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "audit-url", children: "URL to Audit" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  id: "audit-url",
                  placeholder: "https://example.com",
                  value: auditUrl,
                  onChange: (e) => setAuditUrl(e.target.value)
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-end", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: runSEOAudit, disabled: loading, children: loading ? "Running..." : "Run Audit" }) })
          ] }),
          auditResults && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6 grid gap-4 md:grid-cols-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-sm", children: "Overall Score" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-3xl font-bold", children: [
                auditResults.overallScore,
                "/100"
              ] }) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-sm", children: "SEO Score" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-3xl font-bold", children: [
                auditResults.seoScore,
                "/100"
              ] }) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-sm", children: "Performance" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-3xl font-bold", children: [
                auditResults.performanceScore,
                "/100"
              ] }) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-sm", children: "Accessibility" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-3xl font-bold", children: [
                auditResults.accessibilityScore,
                "/100"
              ] }) })
            ] })
          ] }),
          auditResults && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6 space-y-4", children: [
            auditResults.criticalIssues.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "border-red-500", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "text-red-600", children: [
                "Critical Issues (",
                auditResults.criticalIssues.length,
                ")"
              ] }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "list-disc pl-5 space-y-1", children: auditResults.criticalIssues.map((issue, i) => /* @__PURE__ */ jsxRuntimeExports.jsx("li", { className: "text-red-600", children: issue }, i)) }) })
            ] }),
            auditResults.warnings.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "border-yellow-500", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "text-yellow-600", children: [
                "Warnings (",
                auditResults.warnings.length,
                ")"
              ] }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "list-disc pl-5 space-y-1", children: auditResults.warnings.map((warning, i) => /* @__PURE__ */ jsxRuntimeExports.jsx("li", { className: "text-yellow-600", children: warning }, i)) }) })
            ] }),
            auditResults.recommendations.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "border-blue-500", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "text-blue-600", children: [
                "Recommendations (",
                auditResults.recommendations.length,
                ")"
              ] }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "list-disc pl-5 space-y-1", children: auditResults.recommendations.map((rec, i) => /* @__PURE__ */ jsxRuntimeExports.jsx("li", { className: "text-blue-600", children: rec }, i)) }) })
            ] })
          ] })
        ] }) })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "alerts", children: /* @__PURE__ */ jsxRuntimeExports.jsx(AlertsDashboard, {}) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "autofix", children: /* @__PURE__ */ jsxRuntimeExports.jsx(AutoFixEngine, {}) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "keywords", children: /* @__PURE__ */ jsxRuntimeExports.jsx(KeywordsTracker, {}) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "competitors", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CompetitorMatrix, {}) }),
      ["pages", "monitoring", "meta", "robots", "sitemap", "structured", "performance", "backlinks", "broken-links", "link-structure", "content", "crawler", "images", "redirects", "duplicate", "security", "mobile", "budget", "semantic"].map((tab) => /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: tab, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "capitalize", children: tab.replace("-", " ") }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CardDescription, { children: [
            tab.charAt(0).toUpperCase() + tab.slice(1).replace("-", " "),
            " management and analysis"
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center py-8 text-muted-foreground", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "This feature is under development." }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm mt-2", children: "The backend functions are ready. UI coming soon!" })
        ] }) })
      ] }) }, tab))
    ] })
  ] });
};
export {
  SEOManager as S
};
