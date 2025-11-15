import { r as reactExports, j as jsxRuntimeExports } from "./react-vendor-MTOt5FFF.js";
import { c as cn, S as Select, a as SelectTrigger, b as SelectValue, d as SelectContent, e as SelectItem, I as Input, B as Badge, j as Button, D as Dialog, a7 as DialogTrigger, l as DialogContent, m as DialogHeader, n as DialogTitle, L as Label, T as Textarea, J as Tabs, K as TabsList, M as TabsTrigger, N as TabsContent } from "./ui-components-CbrOUI4e.js";
import { S as Search, M as Mail, P as Phone, p as MapPin, a8 as Clock, T as TrendingUp, q as MessageSquare, aw as Plus, b as Check, ae as Copy, aS as Pen, az as Trash2, aT as Flame, X, E as Eye, V as ChevronRight, e as Calendar, H as Home, h as ExternalLink, aU as Tag } from "./icons-CFSiufIk.js";
import { b as formatDistanceToNow, u as ue, a as format } from "./utils-DRaK7sdV.js";
import "./charts-BvRX79AF.js";
import "./supabase-eNUZs_JT.js";
function LeadInbox({
  leads,
  onLeadClick,
  onQuickReply,
  onMarkAsRead,
  className
}) {
  const [searchQuery, setSearchQuery] = reactExports.useState("");
  const [statusFilter, setStatusFilter] = reactExports.useState("all");
  const [priorityFilter, setPriorityFilter] = reactExports.useState("all");
  const [sourceFilter, setSourceFilter] = reactExports.useState("all");
  const [sortBy, setSortBy] = reactExports.useState("date");
  const filteredLeads = reactExports.useMemo(() => {
    let filtered = leads.filter((lead) => {
      const matchesSearch = searchQuery === "" || lead.name.toLowerCase().includes(searchQuery.toLowerCase()) || lead.email.toLowerCase().includes(searchQuery.toLowerCase()) || lead.message.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
      const matchesPriority = priorityFilter === "all" || lead.priority === priorityFilter;
      const matchesSource = sourceFilter === "all" || lead.source === sourceFilter;
      return matchesSearch && matchesStatus && matchesPriority && matchesSource;
    });
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "score":
          return b.score - a.score;
        case "priority":
          const priorityOrder = { hot: 3, warm: 2, cold: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        case "date":
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
    return filtered;
  }, [
    leads,
    searchQuery,
    statusFilter,
    priorityFilter,
    sourceFilter,
    sortBy
  ]);
  const stats = {
    total: leads.length,
    new: leads.filter((l) => l.status === "new").length,
    hot: leads.filter((l) => l.priority === "hot").length,
    avgScore: Math.round(
      leads.reduce((sum, l) => sum + l.score, 0) / leads.length
    )
  };
  const sources = Array.from(new Set(leads.map((l) => l.source)));
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: cn("space-y-4", className), children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-2xl font-bold", children: "Lead Inbox" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-gray-600 mt-1", children: [
          stats.new,
          " new leads • ",
          stats.hot,
          " hot • Avg score:",
          " ",
          stats.avgScore
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex gap-2", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Select,
        {
          value: sortBy,
          onValueChange: (v) => setSortBy(v),
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "w-32", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "date", children: "Latest" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "score", children: "Score" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "priority", children: "Priority" })
            ] })
          ]
        }
      ) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col md:flex-row gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative flex-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Input,
          {
            placeholder: "Search leads...",
            value: searchQuery,
            onChange: (e) => setSearchQuery(e.target.value),
            className: "pl-10"
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Select,
          {
            value: statusFilter,
            onValueChange: setStatusFilter,
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "w-32", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Status" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "all", children: "All Status" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "new", children: "New" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "contacted", children: "Contacted" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "qualified", children: "Qualified" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "converted", children: "Converted" })
              ] })
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Select,
          {
            value: priorityFilter,
            onValueChange: setPriorityFilter,
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "w-32", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Priority" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "all", children: "All Priority" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "hot", children: "Hot" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "warm", children: "Warm" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "cold", children: "Cold" })
              ] })
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Select,
          {
            value: sourceFilter,
            onValueChange: setSourceFilter,
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "w-32", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Source" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "all", children: "All Sources" }),
                sources.map((source) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: source, children: source }, source))
              ] })
            ]
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
      filteredLeads.map((lead) => /* @__PURE__ */ jsxRuntimeExports.jsx(
        LeadCard,
        {
          lead,
          onClick: () => onLeadClick(lead),
          onQuickReply: () => onQuickReply(lead.id),
          onMarkAsRead: () => onMarkAsRead(lead.id)
        },
        lead.id
      )),
      filteredLeads.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center py-12 text-gray-500", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Mail, { className: "w-12 h-12 mx-auto mb-3 opacity-50" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-lg font-medium", children: "No leads found" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm", children: "Try adjusting your filters" })
      ] })
    ] })
  ] });
}
function LeadCard({
  lead,
  onClick,
  onQuickReply,
  onMarkAsRead
}) {
  const priorityColors = {
    hot: "bg-red-100 text-red-800 border-red-300",
    warm: "bg-yellow-100 text-yellow-800 border-yellow-300",
    cold: "bg-blue-100 text-blue-800 border-blue-300"
  };
  const statusColors = {
    new: "bg-green-100 text-green-800",
    contacted: "bg-blue-100 text-blue-800",
    qualified: "bg-purple-100 text-purple-800",
    unqualified: "bg-gray-100 text-gray-800",
    converted: "bg-emerald-100 text-emerald-800"
  };
  const isUnread = lead.status === "new";
  const isHot = lead.priority === "hot";
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "div",
    {
      onClick,
      className: cn(
        "relative p-4 rounded-lg border-2 transition-all cursor-pointer",
        "hover:shadow-md hover:border-gray-300",
        isUnread && "bg-blue-50 border-blue-200",
        !isUnread && "bg-white border-gray-200",
        isHot && "border-l-4 border-l-red-500"
      ),
      children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mb-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "h3",
              {
                className: cn(
                  "font-semibold truncate",
                  isUnread && "text-primary"
                ),
                children: lead.name
              }
            ),
            isUnread && /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "bg-blue-100", children: "NEW" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Badge,
              {
                variant: "outline",
                className: priorityColors[lead.priority],
                children: lead.priority.toUpperCase()
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { className: statusColors[lead.status], children: lead.status })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4 text-sm text-gray-600 mb-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Mail, { className: "w-3 h-3" }),
              lead.email
            ] }),
            lead.phone && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Phone, { className: "w-3 h-3" }),
              lead.phone
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(MapPin, { className: "w-3 h-3" }),
              lead.source
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-700 line-clamp-2 mb-2", children: lead.message }),
          lead.listingTitle && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-gray-500", children: [
            "Interested in:",
            " ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium", children: lead.listingTitle })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 mt-2 text-xs text-gray-500", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "w-3 h-3" }),
              formatDistanceToNow(new Date(lead.createdAt), {
                addSuffix: true
              })
            ] }),
            lead.lastContactedAt && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
              "Last contacted:",
              " ",
              formatDistanceToNow(
                new Date(lead.lastContactedAt),
                {
                  addSuffix: true
                }
              )
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-end gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(TrendingUp, { className: "w-4 h-4 text-primary" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-lg font-bold text-primary", children: lead.score })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                size: "sm",
                variant: "outline",
                onClick: (e) => {
                  e.stopPropagation();
                  onQuickReply();
                },
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(MessageSquare, { className: "w-4 h-4" })
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                size: "sm",
                variant: "outline",
                onClick: (e) => {
                  e.stopPropagation();
                  onMarkAsRead();
                },
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(Mail, { className: "w-4 h-4" })
              }
            )
          ] })
        ] })
      ] })
    }
  );
}
function ResponseTemplates({
  templates,
  onSelectTemplate,
  onCreateTemplate,
  onUpdateTemplate,
  onDeleteTemplate,
  className
}) {
  const [selectedCategory, setSelectedCategory] = reactExports.useState("all");
  const [searchQuery, setSearchQuery] = reactExports.useState("");
  const [isCreating, setIsCreating] = reactExports.useState(false);
  const filteredTemplates = templates.filter((template) => {
    const matchesCategory = selectedCategory === "all" || template.category === selectedCategory;
    const matchesSearch = searchQuery === "" || template.name.toLowerCase().includes(searchQuery.toLowerCase()) || template.body.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });
  const categories = [
    { value: "all", label: "All Templates" },
    { value: "initial", label: "Initial Response" },
    { value: "followup", label: "Follow-up" },
    { value: "showing", label: "Property Showing" },
    { value: "offer", label: "Offer Discussion" },
    { value: "general", label: "General" }
  ];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: cn("space-y-4", className), children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-semibold", children: "Quick Response Templates" }),
      onCreateTemplate && /* @__PURE__ */ jsxRuntimeExports.jsxs(Dialog, { open: isCreating, onOpenChange: setIsCreating, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", className: "gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "w-4 h-4" }),
          "New Template"
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: "Create New Template" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            TemplateForm,
            {
              onSave: (template) => {
                onCreateTemplate(template);
                setIsCreating(false);
                ue.success("Template created");
              },
              onCancel: () => setIsCreating(false)
            }
          )
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex gap-2 overflow-x-auto pb-2", children: categories.map((cat) => /* @__PURE__ */ jsxRuntimeExports.jsx(
      Button,
      {
        variant: selectedCategory === cat.value ? "default" : "outline",
        size: "sm",
        onClick: () => setSelectedCategory(cat.value),
        children: cat.label
      },
      cat.value
    )) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-3", children: filteredTemplates.map((template) => /* @__PURE__ */ jsxRuntimeExports.jsx(
      TemplateCard,
      {
        template,
        onUse: () => onSelectTemplate(template),
        onEdit: onUpdateTemplate ? (updates) => onUpdateTemplate(template.id, updates) : void 0,
        onDelete: onDeleteTemplate ? () => onDeleteTemplate(template.id) : void 0
      },
      template.id
    )) }),
    filteredTemplates.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center py-8 text-gray-500", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(MessageSquare, { className: "w-12 h-12 mx-auto mb-3 opacity-50" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "No templates found" })
    ] })
  ] });
}
function TemplateCard({
  template,
  onUse,
  onEdit,
  onDelete
}) {
  const [isEditing, setIsEditing] = reactExports.useState(false);
  const [copied, setCopied] = reactExports.useState(false);
  const categoryColors = {
    initial: "bg-green-100 text-green-800",
    followup: "bg-blue-100 text-blue-800",
    showing: "bg-purple-100 text-purple-800",
    offer: "bg-orange-100 text-orange-800",
    general: "bg-gray-100 text-gray-800"
  };
  const handleCopy = () => {
    navigator.clipboard.writeText(template.body);
    setCopied(true);
    setTimeout(() => setCopied(false), 2e3);
    ue.success("Template copied to clipboard");
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 border rounded-lg hover:shadow-md transition-shadow", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between mb-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "font-semibold mb-1", children: template.name }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { className: categoryColors[template.category], children: template.category })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            size: "sm",
            variant: "ghost",
            onClick: handleCopy,
            className: "h-8 w-8 p-0",
            children: copied ? /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "w-4 h-4 text-green-600" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Copy, { className: "w-4 h-4" })
          }
        ),
        onEdit && /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            size: "sm",
            variant: "ghost",
            onClick: () => setIsEditing(true),
            className: "h-8 w-8 p-0",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(Pen, { className: "w-4 h-4" })
          }
        ),
        onDelete && /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            size: "sm",
            variant: "ghost",
            onClick: onDelete,
            className: "h-8 w-8 p-0 text-red-600",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "w-4 h-4" })
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-600 mb-1 font-medium", children: template.subject }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-700 line-clamp-3 mb-3", children: template.body }),
    template.variables.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap gap-1 mb-3", children: template.variables.map((variable) => /* @__PURE__ */ jsxRuntimeExports.jsx(
      Badge,
      {
        variant: "outline",
        className: "text-xs",
        children: "{".concat(variable, "}")
      },
      variable
    )) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", onClick: onUse, className: "w-full", children: "Use Template" }),
    isEditing && onEdit && /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: isEditing, onOpenChange: setIsEditing, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: "Edit Template" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        TemplateForm,
        {
          initialData: template,
          onSave: (updates) => {
            onEdit(updates);
            setIsEditing(false);
            ue.success("Template updated");
          },
          onCancel: () => setIsEditing(false)
        }
      )
    ] }) })
  ] });
}
function TemplateForm({ initialData, onSave, onCancel }) {
  const [name, setName] = reactExports.useState((initialData == null ? void 0 : initialData.name) || "");
  const [subject, setSubject] = reactExports.useState((initialData == null ? void 0 : initialData.subject) || "");
  const [body, setBody] = reactExports.useState((initialData == null ? void 0 : initialData.body) || "");
  const [category, setCategory] = reactExports.useState(
    (initialData == null ? void 0 : initialData.category) || "general"
  );
  const handleSave = () => {
    if (!name || !subject || !body) {
      ue.error("Please fill in all fields");
      return;
    }
    const variables = [...body.matchAll(/\{(\w+)\}/g)].map((m) => m[1]);
    onSave({
      name,
      subject,
      body,
      category,
      variables
    });
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Template Name" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Input,
        {
          value: name,
          onChange: (e) => setName(e.target.value),
          placeholder: "e.g., Initial Response - Listing Inquiry"
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Category" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "select",
        {
          value: category,
          onChange: (e) => setCategory(e.target.value),
          className: "w-full p-2 border rounded",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "initial", children: "Initial Response" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "followup", children: "Follow-up" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "showing", children: "Property Showing" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "offer", children: "Offer Discussion" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "general", children: "General" })
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Subject Line" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Input,
        {
          value: subject,
          onChange: (e) => setSubject(e.target.value),
          placeholder: "e.g., Re: {listingAddress}"
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Message Body" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Textarea,
        {
          value: body,
          onChange: (e) => setBody(e.target.value),
          placeholder: "Use {variable} for dynamic fields like {leadName}, {listingAddress}, etc.",
          rows: 8
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-gray-500 mt-1", children: [
        "Use curly braces for variables: ",
        "{leadName}",
        ",",
        " ",
        "{listingAddress}",
        ", ",
        "{price}"
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-end gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", onClick: onCancel, children: "Cancel" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: handleSave, children: "Save Template" })
    ] })
  ] });
}
const DEFAULT_TEMPLATES = [
  {
    id: "1",
    name: "Initial Response - Listing Inquiry",
    subject: "Re: {listingAddress}",
    body: "Hi {leadName},\n\nThank you for your interest in {listingAddress}! I'd love to help you learn more about this property.\n\nThis {bedrooms}-bedroom, {bathrooms}-bathroom home is priced at {price} and features:\n• {feature1}\n• {feature2}\n• {feature3}\n\nI'm available to schedule a showing at your convenience. What days/times work best for you this week?\n\nBest regards,\n{agentName}\n{agentPhone}",
    category: "initial",
    variables: [
      "leadName",
      "listingAddress",
      "bedrooms",
      "bathrooms",
      "price",
      "feature1",
      "feature2",
      "feature3",
      "agentName",
      "agentPhone"
    ]
  },
  {
    id: "2",
    name: "Follow-up - No Response",
    subject: "Following up on {listingAddress}",
    body: "Hi {leadName},\n\nI wanted to follow up on your interest in {listingAddress}. I know finding the right home can take time, and I'm here to help.\n\nAre you still interested in viewing this property? Or would you like me to send you similar listings that might fit your needs?\n\nFeel free to call/text me anytime at {agentPhone}.\n\nBest regards,\n{agentName}",
    category: "followup",
    variables: ["leadName", "listingAddress", "agentPhone", "agentName"]
  },
  {
    id: "3",
    name: "Showing Confirmation",
    subject: "Confirmed: Property Showing at {listingAddress}",
    body: "Hi {leadName},\n\nGreat news! Your showing for {listingAddress} is confirmed for {showingDate} at {showingTime}.\n\nProperty Address:\n{listingAddress}\n\nI'll meet you at the property. If you need to reschedule, please let me know as soon as possible.\n\nLooking forward to showing you this home!\n\nBest regards,\n{agentName}\n{agentPhone}",
    category: "showing",
    variables: [
      "leadName",
      "listingAddress",
      "showingDate",
      "showingTime",
      "agentName",
      "agentPhone"
    ]
  }
];
function HotLeadAlert({
  hotLeads,
  onView,
  onDismiss,
  onQuickCall,
  autoHide = false,
  autoHideDelay = 3e4,
  soundEnabled = true,
  className
}) {
  const [visibleLeads, setVisibleLeads] = reactExports.useState(/* @__PURE__ */ new Set());
  const [dismissedLeads, setDismissedLeads] = reactExports.useState(
    /* @__PURE__ */ new Set()
  );
  reactExports.useEffect(() => {
    const newLeadIds = hotLeads.map((l) => l.id);
    const currentVisible = new Set(visibleLeads);
    const newLeads = newLeadIds.filter(
      (id) => !currentVisible.has(id) && !dismissedLeads.has(id)
    );
    if (newLeads.length > 0) {
      ue.success("".concat(newLeads.length, " hot lead(s) just arrived!"), {
        icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Flame, { className: "w-4 h-4 text-orange-600" })
      });
      if (soundEnabled) {
        playNotificationSound();
      }
      newLeads.forEach((id) => currentVisible.add(id));
      setVisibleLeads(currentVisible);
      if (autoHide) {
        setTimeout(() => {
          newLeads.forEach((id) => handleDismiss(id));
        }, autoHideDelay);
      }
    }
  }, [hotLeads]);
  const handleDismiss = (leadId) => {
    setDismissedLeads((prev) => new Set(prev).add(leadId));
    onDismiss(leadId);
  };
  const activeLeads = hotLeads.filter((lead) => !dismissedLeads.has(lead.id));
  if (activeLeads.length === 0) return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: cn("space-y-2", className), children: activeLeads.map((lead) => /* @__PURE__ */ jsxRuntimeExports.jsx(
    HotLeadCard,
    {
      lead,
      onView: () => onView(lead.id),
      onDismiss: () => handleDismiss(lead.id),
      onQuickCall: onQuickCall ? () => onQuickCall(lead.id) : void 0
    },
    lead.id
  )) });
}
function HotLeadCard({
  lead,
  onView,
  onDismiss,
  onQuickCall
}) {
  const [isAnimating, setIsAnimating] = reactExports.useState(true);
  reactExports.useEffect(() => {
    const timer = setTimeout(() => setIsAnimating(false), 3e3);
    return () => clearTimeout(timer);
  }, []);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      className: cn(
        "relative p-4 rounded-lg border-2 border-orange-500 bg-orange-50 shadow-lg",
        "animate-in slide-in-from-top-5 duration-300",
        isAnimating && "animate-pulse"
      ),
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute -top-2 -right-2", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { className: "bg-orange-600 text-white gap-1 animate-bounce", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Flame, { className: "w-3 h-3" }),
          "HOT LEAD"
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mb-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "font-bold text-lg", children: lead.name }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Badge,
                {
                  variant: "outline",
                  className: "bg-red-100 text-red-800",
                  children: [
                    "Score: ",
                    lead.score
                  ]
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1 text-sm mb-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-gray-700", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Mail, { className: "w-3 h-3" }),
                lead.email
              ] }),
              lead.phone && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-gray-700", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Phone, { className: "w-3 h-3" }),
                lead.phone
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-gray-600", children: [
                "From: ",
                lead.source
              ] })
            ] }),
            lead.listingTitle && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm font-medium text-gray-900 mb-2", children: [
              "Interested in: ",
              lead.listingTitle
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-700 line-clamp-2 mb-2", children: lead.message }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-gray-500", children: [
              "Received",
              " ",
              formatDistanceToNow(new Date(lead.createdAt), {
                addSuffix: true
              })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-col gap-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              size: "sm",
              onClick: onDismiss,
              variant: "ghost",
              className: "h-8 w-8 p-0",
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "w-4 h-4" })
            }
          ) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2 mt-3", children: [
          onQuickCall && lead.phone && /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              size: "sm",
              onClick: onQuickCall,
              className: "flex-1 bg-green-600 hover:bg-green-700 gap-1",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Phone, { className: "w-4 h-4" }),
                "Call Now"
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              size: "sm",
              onClick: onView,
              className: "flex-1 bg-orange-600 hover:bg-orange-700 gap-1",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Eye, { className: "w-4 h-4" }),
                "View Details",
                /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: "w-4 h-4" })
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute bottom-0 left-0 right-0 h-1 bg-gray-200 rounded-b-lg overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            className: "h-full bg-orange-600 animate-pulse",
            style: { width: "".concat(lead.score, "%") }
          }
        ) })
      ]
    }
  );
}
function HotLeadIndicator({
  count,
  onClick
}) {
  if (count === 0) return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    Button,
    {
      variant: "outline",
      size: "sm",
      onClick,
      className: "relative gap-2 border-orange-500 bg-orange-50 hover:bg-orange-100 text-orange-900 animate-pulse",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Flame, { className: "w-4 h-4 text-orange-600" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-bold", children: [
          count,
          " Hot Lead",
          count > 1 ? "s" : ""
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping" })
      ]
    }
  );
}
function playNotificationSound() {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.frequency.value = 800;
    oscillator.type = "sine";
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      audioContext.currentTime + 0.5
    );
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  } catch (error) {
    console.warn("Could not play notification sound:", error);
  }
}
function LeadDetailView({
  lead,
  onClose,
  onUpdateStatus,
  onAddNote,
  onSendEmail,
  onScheduleCall,
  className
}) {
  const [activeTab, setActiveTab] = reactExports.useState("overview");
  const [newNote, setNewNote] = reactExports.useState("");
  const [isAddingNote, setIsAddingNote] = reactExports.useState(false);
  const priorityColors = {
    hot: "bg-red-100 text-red-800 border-red-300",
    warm: "bg-yellow-100 text-yellow-800 border-yellow-300",
    cold: "bg-blue-100 text-blue-800 border-blue-300"
  };
  const statusColors = {
    new: "bg-green-100 text-green-800",
    contacted: "bg-blue-100 text-blue-800",
    qualified: "bg-purple-100 text-purple-800",
    unqualified: "bg-gray-100 text-gray-800",
    converted: "bg-emerald-100 text-emerald-800"
  };
  const handleAddNote = async () => {
    if (!newNote.trim()) {
      ue.error("Please enter a note");
      return;
    }
    setIsAddingNote(true);
    try {
      await onAddNote(newNote);
      setNewNote("");
      ue.success("Note added");
    } catch (error) {
      ue.error("Failed to add note");
    } finally {
      setIsAddingNote(false);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "div",
    {
      className: cn(
        "fixed inset-0 bg-black/50 z-50 overflow-y-auto",
        className
      ),
      children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-screen flex items-center justify-center p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white rounded-lg shadow-xl w-full max-w-4xl", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-6 border-b", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 mb-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-2xl font-bold", children: lead.name }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Badge,
                  {
                    variant: "outline",
                    className: priorityColors[lead.priority],
                    children: lead.priority.toUpperCase()
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Badge,
                  {
                    className: statusColors[lead.status],
                    children: lead.status
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4 text-sm text-gray-600", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Mail, { className: "w-4 h-4" }),
                  lead.email
                ] }),
                lead.phone && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Phone, { className: "w-4 h-4" }),
                  lead.phone
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(MapPin, { className: "w-4 h-4" }),
                  lead.source
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "sm", onClick: onClose, children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "w-5 h-5" }) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 p-3 bg-gray-50 rounded-lg flex items-center justify-between", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(TrendingUp, { className: "w-5 h-5 text-primary" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium", children: "Lead Score:" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-2xl font-bold text-primary", children: lead.score }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-gray-600", children: "/100" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-sm text-gray-600", children: [
              "Created",
              " ",
              formatDistanceToNow(new Date(lead.createdAt), {
                addSuffix: true
              })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 flex gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Button,
              {
                className: "gap-2",
                onClick: () => window.open("mailto:".concat(lead.email)),
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Mail, { className: "w-4 h-4" }),
                  "Email"
                ]
              }
            ),
            lead.phone && /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Button,
              {
                variant: "outline",
                className: "gap-2",
                onClick: () => window.open("tel:".concat(lead.phone)),
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Phone, { className: "w-4 h-4" }),
                  "Call"
                ]
              }
            ),
            onScheduleCall && /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Button,
              {
                variant: "outline",
                className: "gap-2",
                onClick: onScheduleCall,
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Calendar, { className: "w-4 h-4" }),
                  "Schedule"
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Select,
              {
                value: lead.status,
                onValueChange: (v) => onUpdateStatus(v),
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "w-40", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "new", children: "New" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "contacted", children: "Contacted" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "qualified", children: "Qualified" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "unqualified", children: "Unqualified" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "converted", children: "Converted" })
                  ] })
                ]
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border-b", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex gap-4 px-6", children: ["overview", "timeline", "notes"].map((tab) => /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: () => setActiveTab(tab),
            className: cn(
              "py-3 px-1 border-b-2 font-medium text-sm capitalize transition-colors",
              activeTab === tab ? "border-primary text-primary" : "border-transparent text-gray-600 hover:text-gray-900"
            ),
            children: tab
          },
          tab
        )) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-6 max-h-[60vh] overflow-y-auto", children: [
          activeTab === "overview" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "font-semibold mb-2 flex items-center gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(MessageSquare, { className: "w-4 h-4" }),
                "Original Message"
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-4 bg-gray-50 rounded-lg", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-700", children: lead.message }) })
            ] }),
            lead.listingTitle && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "font-semibold mb-2 flex items-center gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Home, { className: "w-4 h-4" }),
                "Interested Property"
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 bg-gray-50 rounded-lg flex items-center gap-4", children: [
                lead.listingImage && /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "img",
                  {
                    src: lead.listingImage,
                    alt: lead.listingTitle,
                    className: "w-24 h-24 object-cover rounded"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium", children: lead.listingTitle }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    Button,
                    {
                      variant: "link",
                      size: "sm",
                      className: "gap-1 p-0 h-auto",
                      onClick: () => {
                      },
                      children: [
                        "View Listing",
                        /* @__PURE__ */ jsxRuntimeExports.jsx(ExternalLink, { className: "w-3 h-3" })
                      ]
                    }
                  )
                ] })
              ] })
            ] }),
            lead.tags && lead.tags.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "font-semibold mb-2 flex items-center gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Tag, { className: "w-4 h-4" }),
                "Tags"
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap gap-2", children: lead.tags.map((tag) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                Badge,
                {
                  variant: "outline",
                  children: tag
                },
                tag
              )) })
            ] })
          ] }),
          activeTab === "timeline" && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-4", children: lead.timeline && lead.timeline.length > 0 ? lead.timeline.map((event) => /* @__PURE__ */ jsxRuntimeExports.jsx(
            TimelineItem,
            {
              event
            },
            event.id
          )) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center py-8 text-gray-500", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "w-12 h-12 mx-auto mb-2 opacity-50" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "No timeline events yet" })
          ] }) }),
          activeTab === "notes" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Textarea,
                {
                  value: newNote,
                  onChange: (e) => setNewNote(e.target.value),
                  placeholder: "Add a note about this lead...",
                  rows: 3
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Button,
                {
                  onClick: handleAddNote,
                  disabled: isAddingNote || !newNote.trim(),
                  className: "w-full",
                  children: "Add Note"
                }
              )
            ] }),
            lead.notes && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-4 bg-gray-50 rounded-lg", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-700 whitespace-pre-wrap", children: lead.notes }) })
          ] })
        ] })
      ] }) })
    }
  );
}
function TimelineItem({ event }) {
  const getIcon = () => {
    switch (event.type) {
      case "email":
        return /* @__PURE__ */ jsxRuntimeExports.jsx(Mail, { className: "w-4 h-4" });
      case "call":
        return /* @__PURE__ */ jsxRuntimeExports.jsx(Phone, { className: "w-4 h-4" });
      case "meeting":
        return /* @__PURE__ */ jsxRuntimeExports.jsx(Calendar, { className: "w-4 h-4" });
      case "status_change":
        return /* @__PURE__ */ jsxRuntimeExports.jsx(TrendingUp, { className: "w-4 h-4" });
      case "note":
      default:
        return /* @__PURE__ */ jsxRuntimeExports.jsx(MessageSquare, { className: "w-4 h-4" });
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary", children: getIcon() }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-700", children: event.content }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-gray-500 mt-1", children: [
        format(
          new Date(event.timestamp),
          "MMM d, yyyy 'at' h:mm a"
        ),
        event.user && " • ".concat(event.user)
      ] })
    ] })
  ] });
}
const mockLeads = [
  {
    id: "1",
    name: "Sarah Johnson",
    email: "sarah.j@email.com",
    phone: "+1 (555) 123-4567",
    message: "Hi, I'm very interested in the 3BR house in Downtown. I'd like to schedule a viewing this week if possible. I'm pre-approved and ready to move quickly. Can you provide more details about the HOA fees and recent renovations?",
    listingTitle: "Modern 3BR House in Downtown",
    listingId: "listing-1",
    source: "zillow",
    score: 85,
    status: "new",
    priority: "hot",
    createdAt: new Date(Date.now() - 1e3 * 60 * 15).toISOString(),
    // 15 min ago
    tags: ["pre-approved", "quick-move"]
  },
  {
    id: "2",
    name: "Michael Chen",
    email: "mchen@email.com",
    phone: "+1 (555) 987-6543",
    message: "Looking for properties in the $400-500k range. Interested in your luxury condo listing.",
    listingTitle: "Luxury Condo with Ocean View",
    listingId: "listing-2",
    source: "realtor",
    score: 72,
    status: "new",
    priority: "hot",
    createdAt: new Date(Date.now() - 1e3 * 60 * 30).toISOString(),
    // 30 min ago
    tags: ["investor"]
  },
  {
    id: "3",
    name: "Emily Rodriguez",
    email: "emily.r@email.com",
    message: "What's the monthly HOA fee for the apartment near the park?",
    listingTitle: "Cozy 2BR Apartment Near Park",
    listingId: "listing-3",
    source: "facebook",
    score: 58,
    status: "contacted",
    priority: "warm",
    createdAt: new Date(Date.now() - 1e3 * 60 * 60 * 2).toISOString(),
    // 2 hours ago
    lastContactedAt: new Date(Date.now() - 1e3 * 60 * 30).toISOString(),
    tags: ["first-time-buyer"]
  },
  {
    id: "4",
    name: "David Kim",
    email: "dkim@email.com",
    phone: "+1 (555) 234-5678",
    message: "I saw your listing for the family home with pool. Is it still available?",
    listingTitle: "Spacious Family Home with Pool",
    listingId: "listing-4",
    source: "website",
    score: 45,
    status: "contacted",
    priority: "warm",
    createdAt: new Date(Date.now() - 1e3 * 60 * 60 * 5).toISOString(),
    // 5 hours ago
    lastContactedAt: new Date(
      Date.now() - 1e3 * 60 * 60 * 3
    ).toISOString()
  },
  {
    id: "5",
    name: "Lisa Anderson",
    email: "lisa.a@email.com",
    message: "Info please",
    listingTitle: "Renovated Townhouse in Suburbs",
    listingId: "listing-5",
    source: "instagram",
    score: 28,
    status: "new",
    priority: "cold",
    createdAt: new Date(Date.now() - 1e3 * 60 * 60 * 12).toISOString()
    // 12 hours ago
  }
];
function LeadManagementDashboard() {
  const [leads, setLeads] = reactExports.useState(mockLeads);
  const [templates, setTemplates] = reactExports.useState(DEFAULT_TEMPLATES);
  const [selectedLead, setSelectedLead] = reactExports.useState(null);
  const [showHotLeads, setShowHotLeads] = reactExports.useState(true);
  const hotLeads = leads.filter(
    (lead) => lead.score >= 70 && lead.status === "new"
  );
  const stats = {
    total: leads.length,
    new: leads.filter((l) => l.status === "new").length,
    hot: hotLeads.length,
    contacted: leads.filter((l) => l.status === "contacted").length,
    avgScore: Math.round(
      leads.reduce((sum, l) => sum + l.score, 0) / leads.length
    )
  };
  const handleLeadClick = (lead) => {
    setSelectedLead(lead);
  };
  const handleCloseDetail = () => {
    setSelectedLead(null);
  };
  const handleQuickReply = (leadId) => {
    const lead = leads.find((l) => l.id === leadId);
    if (lead) {
      setSelectedLead(lead);
      ue.info("Opening quick reply for " + lead.name);
    }
  };
  const handleMarkAsRead = async (leadId) => {
    setLeads(
      (prev) => prev.map(
        (lead) => lead.id === leadId ? { ...lead, status: "contacted" } : lead
      )
    );
    ue.success("Lead marked as contacted");
  };
  const handleUpdateStatus = async (status) => {
    if (!selectedLead) return;
    setLeads(
      (prev) => prev.map(
        (lead) => lead.id === selectedLead.id ? { ...lead, status } : lead
      )
    );
    setSelectedLead((prev) => prev ? { ...prev, status } : null);
    ue.success("Status updated to ".concat(status));
  };
  const handleAddNote = async (note) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    console.log("Adding note:", note);
  };
  const handleSendEmail = async (subject, body) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    console.log("Sending email:", { subject, body });
    ue.success("Email sent!");
  };
  const handleDismissHotLead = (leadId) => {
    console.log("Dismissed hot lead:", leadId);
  };
  const handleViewHotLead = (leadId) => {
    const lead = leads.find((l) => l.id === leadId);
    if (lead) {
      handleLeadClick(lead);
    }
  };
  const handleSelectTemplate = (template) => {
    if (!selectedLead) {
      ue.info("Please select a lead first");
      return;
    }
    let body = template.body;
    body = body.replace("{leadName}", selectedLead.name);
    body = body.replace(
      "{listingAddress}",
      selectedLead.listingTitle || "the property"
    );
    body = body.replace("{agentName}", "Your Name");
    body = body.replace("{agentPhone}", "(555) 123-4567");
    ue.success("Template loaded! Ready to send.");
    console.log("Using template:", { subject: template.subject, body });
  };
  const handleCreateTemplate = (template) => {
    const newTemplate = {
      ...template,
      id: "custom-".concat(Date.now())
    };
    setTemplates((prev) => [...prev, newTemplate]);
  };
  const handleUpdateTemplate = (id, updates) => {
    setTemplates(
      (prev) => prev.map((t) => t.id === id ? { ...t, ...updates } : t)
    );
  };
  const handleDeleteTemplate = (id) => {
    setTemplates((prev) => prev.filter((t) => t.id !== id));
    ue.success("Template deleted");
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "container mx-auto py-6 space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-3xl font-bold", children: "Lead Management" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-600 mt-1", children: "Manage your leads efficiently with smart scoring and quick responses" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex gap-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        HotLeadIndicator,
        {
          count: hotLeads.length,
          onClick: () => setShowHotLeads(!showHotLeads)
        }
      ) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 md:grid-cols-5 gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        StatCard,
        {
          label: "Total Leads",
          value: stats.total,
          icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Mail, { className: "w-5 h-5" })
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        StatCard,
        {
          label: "New",
          value: stats.new,
          icon: /* @__PURE__ */ jsxRuntimeExports.jsx(MessageSquare, { className: "w-5 h-5" }),
          color: "green"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        StatCard,
        {
          label: "Hot Leads",
          value: stats.hot,
          icon: /* @__PURE__ */ jsxRuntimeExports.jsx(TrendingUp, { className: "w-5 h-5" }),
          color: "red",
          pulse: stats.hot > 0
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        StatCard,
        {
          label: "Contacted",
          value: stats.contacted,
          icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Mail, { className: "w-5 h-5" }),
          color: "blue"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        StatCard,
        {
          label: "Avg Score",
          value: stats.avgScore,
          icon: /* @__PURE__ */ jsxRuntimeExports.jsx(TrendingUp, { className: "w-5 h-5" })
        }
      )
    ] }),
    showHotLeads && hotLeads.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(
      HotLeadAlert,
      {
        hotLeads,
        onView: handleViewHotLead,
        onDismiss: handleDismissHotLead,
        soundEnabled: true
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Tabs, { defaultValue: "inbox", className: "w-full", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsList, { className: "grid w-full grid-cols-2 max-w-md", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsTrigger, { value: "inbox", children: [
          "Lead Inbox",
          stats.new > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(
            Badge,
            {
              variant: "outline",
              className: "ml-2 bg-green-100",
              children: stats.new
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TabsTrigger, { value: "templates", children: "Response Templates" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "inbox", className: "mt-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        LeadInbox,
        {
          leads,
          onLeadClick: handleLeadClick,
          onQuickReply: handleQuickReply,
          onMarkAsRead: handleMarkAsRead
        }
      ) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "templates", className: "mt-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        ResponseTemplates,
        {
          templates,
          onSelectTemplate: handleSelectTemplate,
          onCreateTemplate: handleCreateTemplate,
          onUpdateTemplate: handleUpdateTemplate,
          onDeleteTemplate: handleDeleteTemplate
        }
      ) })
    ] }),
    selectedLead && /* @__PURE__ */ jsxRuntimeExports.jsx(
      LeadDetailView,
      {
        lead: selectedLead,
        onClose: handleCloseDetail,
        onUpdateStatus: handleUpdateStatus,
        onAddNote: handleAddNote,
        onSendEmail: handleSendEmail
      }
    )
  ] });
}
function StatCard({ label, value, icon, color, pulse }) {
  const colorClasses = {
    green: "bg-green-100 text-green-600",
    blue: "bg-blue-100 text-blue-600",
    red: "bg-red-100 text-red-600"
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 bg-white rounded-lg border hover:shadow-md transition-shadow", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "div",
        {
          className: "p-2 rounded ".concat(color ? colorClasses[color] : "bg-gray-100 text-gray-600"),
          children: icon
        }
      ),
      pulse && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-2 h-2 bg-red-500 rounded-full animate-pulse" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-2xl font-bold", children: value }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-gray-600", children: label })
  ] });
}
export {
  LeadManagementDashboard as default
};
