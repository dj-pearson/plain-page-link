import { r as reactExports, j as jsxRuntimeExports, N as Navigate, L as Link } from './react-vendor-a6jLNMWt.js';
import { u as useAuthStore } from './state-stores-BQHzCYsU.js';
import { D as Dialog, a7 as DialogTrigger, j as Button, l as DialogContent, m as DialogHeader, n as DialogTitle, G as DialogDescription, L as Label, I as Input, S as Select, a as SelectTrigger, b as SelectValue, d as SelectContent, e as SelectItem, w as Switch, O as DialogFooter, C as Card, f as CardHeader, g as CardTitle, h as CardDescription, o as CardContent, B as Badge, T as Textarea, J as Tabs, K as TabsList, M as TabsTrigger, N as TabsContent } from './ui-components-DLW4dShh.js';
import { b as useQueryClient, u as useQuery, c as useMutation } from './data-zpsFEjqp.js';
import { s as supabase } from './supabase-D4RJa1Op.js';
import { u as ue, a as format } from './utils-BhOeSegx.js';
import { aw as Plus, L as LoaderCircle, k as Brain, aX as TestTube, g as Sparkles, e as Calendar, a5 as Send, E as Eye, ay as SquarePen, aY as Trash, aZ as Link2, a_ as ToggleRight, a$ as ToggleLeft, a6 as Upload, a1 as Download, ad as Lightbulb, b0 as Hash, Z as Zap, a8 as Clock, aD as CircleX, J as CircleCheckBig, T as TrendingUp, h as ExternalLink, an as Settings, a2 as ArrowLeft, b1 as BrainCircuit, u as Share2, aj as FileText, b2 as Database, S as Search, B as BarChart3, U as Users } from './icons-Bf8A6sFa.js';
import { S as SEOManager } from './SEOManager-BKwaJDAD.js';
import { S as SearchAnalyticsDashboard } from './SearchAnalyticsDashboard-BBUJCi_K.js';
import './charts-DsEHo9_O.js';
import './index-Dww_DGvO.js';
import './three-addons-aBd78e9L.js';
import './three-D7pws1Rl.js';
import './forms-DN8gFaqO.js';

function useAIConfiguration() {
  const queryClient = useQueryClient();
  const modelsQuery = useQuery({
    queryKey: ["ai-models"],
    queryFn: async () => {
      const { data, error } = await supabase.from("ai_models").select("*").order("provider", { ascending: true });
      if (error) throw error;
      return data;
    }
  });
  const configQuery = useQuery({
    queryKey: ["ai-configuration"],
    queryFn: async () => {
      const { data, error } = await supabase.from("ai_configuration").select("*");
      if (error) throw error;
      return data;
    }
  });
  const updateConfigMutation = useMutation({
    mutationFn: async ({ key, value }) => {
      const { error } = await supabase.from("ai_configuration").update({
        setting_value: value,
        updated_at: (/* @__PURE__ */ new Date()).toISOString(),
        updated_by: (await supabase.auth.getUser()).data.user?.id
      }).eq("setting_key", key);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-configuration"] });
      ue.success("Configuration updated");
    },
    onError: (error) => {
      ue.error("Failed to update: " + error.message);
    }
  });
  const toggleModelMutation = useMutation({
    mutationFn: async ({ id, isActive }) => {
      const { error } = await supabase.from("ai_models").update({ is_active: isActive }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-models"] });
      ue.success("Model status updated");
    },
    onError: (error) => {
      ue.error("Failed to update model: " + error.message);
    }
  });
  const addModelMutation = useMutation({
    mutationFn: async (model) => {
      const { error } = await supabase.from("ai_models").insert([model]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-models"] });
      ue.success("Model added successfully");
    },
    onError: (error) => {
      ue.error("Failed to add model: " + error.message);
    }
  });
  const testModelMutation = useMutation({
    mutationFn: async (model) => {
      const { data, error } = await supabase.functions.invoke("test-ai-model", {
        body: { model }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data.success) {
        ue.success(data.message);
      } else {
        ue.error(data.error);
      }
    },
    onError: (error) => {
      ue.error("Model test failed: " + error.message);
    }
  });
  const getConfigValue = (key) => {
    const item = configQuery.data?.find((c) => c.setting_key === key);
    if (!item) return "";
    try {
      return JSON.parse(item.setting_value);
    } catch {
      return item.setting_value;
    }
  };
  const handleUpdateConfig = (key, value) => {
    updateConfigMutation.mutate({ key, value: JSON.stringify(value) });
  };
  return {
    models: modelsQuery.data,
    config: configQuery.data,
    isLoading: modelsQuery.isLoading || configQuery.isLoading,
    getConfigValue,
    handleUpdateConfig,
    toggleModel: toggleModelMutation.mutate,
    addModel: addModelMutation.mutate,
    testModel: testModelMutation.mutate,
    isTestingModel: testModelMutation.isPending,
    isAddingModel: addModelMutation.isPending
  };
}

function AddModelDialog({ onAdd, isAdding }) {
  const [open, setOpen] = reactExports.useState(false);
  const [formData, setFormData] = reactExports.useState({
    provider: "",
    model_name: "",
    model_id: "",
    description: "",
    context_window: 2e5,
    max_output_tokens: 8192,
    supports_vision: true,
    is_active: true,
    auth_type: "bearer",
    secret_name: "",
    api_endpoint: ""
  });
  const handleSubmit = (e) => {
    e.preventDefault();
    onAdd(formData);
    setOpen(false);
    setFormData({
      provider: "",
      model_name: "",
      model_id: "",
      description: "",
      context_window: 2e5,
      max_output_tokens: 8192,
      supports_vision: true,
      is_active: true,
      auth_type: "bearer",
      secret_name: "",
      api_endpoint: ""
    });
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Dialog, { open, onOpenChange: setOpen, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { className: "gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-4 w-4" }),
      "Add New Model"
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(DialogContent, { className: "max-w-2xl max-h-[90vh] overflow-y-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleSubmit, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: "Add New AI Model" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogDescription, { children: "Configure a new AI model with authentication and endpoint details" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 py-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "provider", children: "Provider Name *" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              id: "provider",
              placeholder: "e.g., Anthropic",
              value: formData.provider,
              onChange: (e) => setFormData({ ...formData, provider: e.target.value }),
              required: true
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "model_name", children: "Display Name *" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              id: "model_name",
              placeholder: "e.g., Claude Sonnet 4.5",
              value: formData.model_name,
              onChange: (e) => setFormData({ ...formData, model_name: e.target.value }),
              required: true
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "model_id", children: "Model ID *" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              id: "model_id",
              placeholder: "e.g., claude-sonnet-4-5-20250929",
              value: formData.model_id,
              onChange: (e) => setFormData({ ...formData, model_id: e.target.value }),
              required: true
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "The exact model identifier for API calls" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "description", children: "Description" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              id: "description",
              placeholder: "Brief description of model capabilities",
              value: formData.description,
              onChange: (e) => setFormData({ ...formData, description: e.target.value })
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "auth_type", children: "Authentication Type *" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Select,
            {
              value: formData.auth_type,
              onValueChange: (value) => setFormData({ ...formData, auth_type: value }),
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { id: "auth_type", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "bearer", children: "Bearer Token" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "x-api-key", children: "X-API-Key Header" })
                ] })
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "How the API key is sent (Bearer for most, X-API-Key for Anthropic)" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "secret_name", children: "Supabase Secret Name *" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              id: "secret_name",
              placeholder: "e.g., CLAUDE_API_KEY",
              value: formData.secret_name,
              onChange: (e) => setFormData({ ...formData, secret_name: e.target.value }),
              required: true
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Name of the secret stored in Supabase (must be added to Supabase secrets)" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "api_endpoint", children: "API Endpoint *" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              id: "api_endpoint",
              placeholder: "e.g., https://api.anthropic.com/v1/messages",
              value: formData.api_endpoint,
              onChange: (e) => setFormData({ ...formData, api_endpoint: e.target.value }),
              required: true
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "context_window", children: "Context Window" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "context_window",
                type: "number",
                value: formData.context_window,
                onChange: (e) => setFormData({ ...formData, context_window: parseInt(e.target.value) })
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "max_output_tokens", children: "Max Output Tokens" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "max_output_tokens",
                type: "number",
                value: formData.max_output_tokens,
                onChange: (e) => setFormData({ ...formData, max_output_tokens: parseInt(e.target.value) })
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "supports_vision", children: "Supports Vision" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Switch,
            {
              id: "supports_vision",
              checked: formData.supports_vision,
              onCheckedChange: (checked) => setFormData({ ...formData, supports_vision: checked })
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "is_active", children: "Active" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Switch,
            {
              id: "is_active",
              checked: formData.is_active,
              onCheckedChange: (checked) => setFormData({ ...formData, is_active: checked })
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", variant: "outline", onClick: () => setOpen(false), children: "Cancel" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { type: "submit", disabled: isAdding, children: [
          isAdding && /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "mr-2 h-4 w-4 animate-spin" }),
          "Add Model"
        ] })
      ] })
    ] }) })
  ] });
}

function AIConfigurationManager() {
  const {
    models,
    isLoading,
    getConfigValue,
    handleUpdateConfig,
    toggleModel,
    addModel,
    testModel,
    isTestingModel,
    isAddingModel
  } = useAIConfiguration();
  if (isLoading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-center p-12", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-8 w-8 animate-spin text-primary" }) });
  }
  const defaultModel = getConfigValue("default_model");
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Brain, { className: "h-5 w-5" }),
          "AI Model Configuration"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: "Configure AI models and settings for content generation" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "default-model", children: "Default AI Model" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Select,
              {
                value: defaultModel,
                onValueChange: (value) => handleUpdateConfig("default_model", value),
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { id: "default-model", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Select a model" }) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: models?.map((model) => /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectItem, { value: model.model_id, children: [
                    model.model_name,
                    " (",
                    model.provider,
                    ")"
                  ] }, model.id)) })
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                variant: "outline",
                size: "icon",
                onClick: () => testModel(defaultModel),
                disabled: isTestingModel,
                title: "Test AI Model",
                children: isTestingModel ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(TestTube, { className: "h-4 w-4" })
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "temp-precise", children: "Precise Temperature" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "temp-precise",
                type: "number",
                step: "0.1",
                min: "0",
                max: "1",
                value: getConfigValue("temperature_precise"),
                onChange: (e) => handleUpdateConfig("temperature_precise", parseFloat(e.target.value))
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "For data extraction and precise tasks" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "temp-creative", children: "Creative Temperature" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "temp-creative",
                type: "number",
                step: "0.1",
                min: "0",
                max: "1",
                value: getConfigValue("temperature_creative"),
                onChange: (e) => handleUpdateConfig("temperature_creative", parseFloat(e.target.value))
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "For content generation and creative tasks" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "tokens-standard", children: "Standard Max Tokens" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "tokens-standard",
                type: "number",
                step: "100",
                value: getConfigValue("max_tokens_standard"),
                onChange: (e) => handleUpdateConfig("max_tokens_standard", parseInt(e.target.value))
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "tokens-large", children: "Large Content Max Tokens" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "tokens-large",
                type: "number",
                step: "100",
                value: getConfigValue("max_tokens_large"),
                onChange: (e) => handleUpdateConfig("max_tokens_large", parseInt(e.target.value))
              }
            )
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: "Available AI Models" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: "Manage which models are available for selection" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(AddModelDialog, { onAdd: addModel, isAdding: isAddingModel })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-4", children: models?.map((model) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between p-4 border rounded-lg gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "font-semibold", children: model.model_name }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "text-xs", children: model.provider })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground mt-1", children: model.description }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap gap-3 mt-3 text-xs text-muted-foreground", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
              "Context: ",
              model.context_window.toLocaleString(),
              " tokens"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
              "Max Output: ",
              model.max_output_tokens.toLocaleString(),
              " tokens"
            ] }),
            model.supports_vision && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "✓ Vision" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap gap-3 mt-2 text-xs", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "secondary", children: model.auth_type === "bearer" ? "Bearer Token" : "X-API-Key" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { variant: "secondary", children: [
              "Secret: ",
              model.secret_name
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mt-2 font-mono truncate", children: model.api_endpoint })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Switch,
          {
            checked: model.is_active,
            onCheckedChange: (checked) => toggleModel({ id: model.id, isActive: checked })
          }
        )
      ] }, model.id)) }) })
    ] })
  ] });
}

function useSocialMedia() {
  const queryClient = useQueryClient();
  const postsQuery = useQuery({
    queryKey: ["social-media-posts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("social_media_posts").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    }
  });
  const marketingPostsQuery = useQuery({
    queryKey: ["marketing-posts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("social_media_posts").select("*").eq("content_type", "marketing").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    }
  });
  const webhooksQuery = useQuery({
    queryKey: ["social-media-webhooks"],
    queryFn: async () => {
      const { data, error } = await supabase.from("social_media_webhooks").select("*").order("name", { ascending: true });
      if (error) throw error;
      return data;
    }
  });
  const generatePostMutation = useMutation({
    mutationFn: async (params) => {
      const { data, error } = await supabase.functions.invoke("generate-social-post", {
        body: params
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data.success) {
        ue.success("Content generated successfully!");
      } else {
        ue.error(data.error || "Generation failed");
      }
    },
    onError: (error) => {
      ue.error("Failed to generate content: " + error.message);
    }
  });
  const createPostMutation = useMutation({
    mutationFn: async (post) => {
      const { data: userData } = await supabase.auth.getUser();
      const { data, error } = await supabase.from("social_media_posts").insert({
        ...post,
        created_by: userData.user?.id
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["social-media-posts"] });
      ue.success("Post created successfully");
    },
    onError: (error) => {
      ue.error("Failed to create post: " + error.message);
    }
  });
  const updatePostMutation = useMutation({
    mutationFn: async ({ id, updates }) => {
      const { error } = await supabase.from("social_media_posts").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["social-media-posts"] });
      ue.success("Post updated successfully");
    },
    onError: (error) => {
      ue.error("Failed to update post: " + error.message);
    }
  });
  const deletePostMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from("social_media_posts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["social-media-posts"] });
      ue.success("Post deleted successfully");
    },
    onError: (error) => {
      ue.error("Failed to delete post: " + error.message);
    }
  });
  const createWebhookMutation = useMutation({
    mutationFn: async (webhook) => {
      const { data, error } = await supabase.from("social_media_webhooks").insert(webhook).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["social-media-webhooks"] });
      ue.success("Webhook created successfully");
    },
    onError: (error) => {
      ue.error("Failed to create webhook: " + error.message);
    }
  });
  const updateWebhookMutation = useMutation({
    mutationFn: async ({ id, updates }) => {
      const { error } = await supabase.from("social_media_webhooks").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["social-media-webhooks"] });
      ue.success("Webhook updated successfully");
    },
    onError: (error) => {
      ue.error("Failed to update webhook: " + error.message);
    }
  });
  const deleteWebhookMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from("social_media_webhooks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["social-media-webhooks"] });
      ue.success("Webhook deleted successfully");
    },
    onError: (error) => {
      ue.error("Failed to delete webhook: " + error.message);
    }
  });
  const testWebhookMutation = useMutation({
    mutationFn: async (webhookId) => {
      const { data, error } = await supabase.functions.invoke("test-social-webhook", {
        body: { webhookId }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data.success) {
        ue.success("Test webhook sent successfully!");
      } else {
        ue.error("Test webhook failed: " + (data.error || "Unknown error"));
      }
    },
    onError: (error) => {
      ue.error("Failed to test webhook: " + error.message);
    }
  });
  const generateMarketingPostMutation = useMutation({
    mutationFn: async (webhookUrl) => {
      const { data, error } = await supabase.functions.invoke("generate-marketing-post", {
        body: { webhookUrl }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["marketing-posts"] });
      if (data.success) {
        ue.success(data.message);
      } else {
        ue.error(data.error || "Failed to generate post");
      }
    },
    onError: (error) => {
      ue.error("Failed to generate post: " + error.message);
    }
  });
  const retryMarketingPostMutation = useMutation({
    mutationFn: async ({ postId, webhookUrl }) => {
      const { data: post } = await supabase.from("social_media_posts").select("post_content").eq("id", postId).single();
      if (!post) throw new Error("Post not found");
      const webhookResponse = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(post.post_content)
      });
      if (!webhookResponse.ok) {
        throw new Error("Webhook delivery failed");
      }
      await supabase.from("social_media_posts").update({
        status: "posted",
        posted_at: (/* @__PURE__ */ new Date()).toISOString(),
        webhook_urls: [webhookUrl]
      }).eq("id", postId);
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketing-posts"] });
      ue.success("Post resent successfully");
    },
    onError: (error) => {
      console.error("Failed to retry post:", error);
      ue.error("Failed to resend post");
    }
  });
  return {
    posts: postsQuery.data,
    marketingPosts: marketingPostsQuery.data,
    webhooks: webhooksQuery.data,
    isLoading: postsQuery.isLoading || webhooksQuery.isLoading || marketingPostsQuery.isLoading,
    generatePost: generatePostMutation.mutate,
    isGenerating: generatePostMutation.isPending,
    generatedContent: generatePostMutation.data,
    createPost: createPostMutation.mutate,
    updatePost: updatePostMutation.mutate,
    deletePost: deletePostMutation.mutate,
    createWebhook: createWebhookMutation.mutate,
    updateWebhook: updateWebhookMutation.mutate,
    deleteWebhook: deleteWebhookMutation.mutate,
    testWebhook: testWebhookMutation.mutate,
    isTestingWebhook: testWebhookMutation.isPending,
    generateMarketingPost: generateMarketingPostMutation.mutate,
    isGeneratingMarketingPost: generateMarketingPostMutation.isPending,
    marketingPostData: generateMarketingPostMutation.data,
    retryMarketingPost: retryMarketingPostMutation.mutate,
    isRetryingPost: retryMarketingPostMutation.isPending
  };
}

function CreateSocialPostDialog() {
  const [open, setOpen] = reactExports.useState(false);
  const [contentType, setContentType] = reactExports.useState("property_highlight");
  const [subjectType, setSubjectType] = reactExports.useState("listing_of_the_day");
  const [platformType, setPlatformType] = reactExports.useState("combined");
  const [listingId, setListingId] = reactExports.useState("");
  const [customPrompt, setCustomPrompt] = reactExports.useState("");
  const [postTitle, setPostTitle] = reactExports.useState("");
  const [generatedContent, setGeneratedContent] = reactExports.useState(null);
  const { generatePost, isGenerating, createPost } = useSocialMedia();
  const { data: listings } = useQuery({
    queryKey: ["listings-for-social"],
    queryFn: async () => {
      const { data, error } = await supabase.from("listings").select("id, address, price, status").eq("status", "active").order("created_at", { ascending: false }).limit(20);
      if (error) throw error;
      return data;
    }
  });
  const handleGenerate = () => {
    generatePost({
      contentType,
      subjectType,
      platformType,
      listingId: listingId || void 0,
      customPrompt: customPrompt || void 0
    }, {
      onSuccess: (data) => {
        if (data.success) {
          setGeneratedContent(data.content);
        }
      }
    });
  };
  const handleSave = () => {
    if (!generatedContent) return;
    createPost({
      content_type: contentType,
      subject_type: subjectType,
      platform_type: platformType,
      post_content: generatedContent,
      post_title: postTitle || `${contentType} - ${(/* @__PURE__ */ new Date()).toLocaleDateString()}`,
      listing_id: listingId || null,
      status: "draft",
      ai_prompt_used: customPrompt || void 0
    }, {
      onSuccess: () => {
        setOpen(false);
        setGeneratedContent(null);
        setPostTitle("");
        setCustomPrompt("");
      }
    });
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Dialog, { open, onOpenChange: setOpen, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { className: "gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-4 w-4" }),
      "Create Post"
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "max-w-3xl max-h-[90vh] overflow-y-auto", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: "Create Social Media Post" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogDescription, { children: "Generate AI-powered social media content for your real estate business" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4 mt-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "content-type", children: "Content Type" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: contentType, onValueChange: setContentType, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { id: "content-type", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "property_highlight", children: "Property Highlight" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "market_update", children: "Market Update" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "agent_tip", children: "Agent Tip" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "community_spotlight", children: "Community Spotlight" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "success_story", children: "Success Story" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "general", children: "General" })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "subject-type", children: "Subject Type" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: subjectType, onValueChange: setSubjectType, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { id: "subject-type", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "listing_of_the_day", children: "Listing of the Day" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "market_analysis", children: "Market Analysis" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "buyer_seller_tip", children: "Buyer/Seller Tip" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "neighborhood_feature", children: "Neighborhood Feature" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "testimonial_highlight", children: "Testimonial Highlight" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "special_announcement", children: "Special Announcement" })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "platform-type", children: "Platform" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: platformType, onValueChange: setPlatformType, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { id: "platform-type", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "combined", children: "All Platforms" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "twitter_threads", children: "Twitter/X Threads" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "facebook_linkedin", children: "Facebook/LinkedIn" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "instagram", children: "Instagram" })
            ] })
          ] })
        ] }),
        contentType === "property_highlight" && listings && listings.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "listing", children: "Select Property (Optional)" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: listingId, onValueChange: setListingId, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { id: "listing", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Choose a listing..." }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: listings.map((listing) => /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectItem, { value: listing.id, children: [
              listing.address,
              " - ",
              listing.price
            ] }, listing.id)) })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "custom-prompt", children: "Custom Instructions (Optional)" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Textarea,
            {
              id: "custom-prompt",
              placeholder: "Add any specific instructions for the AI...",
              value: customPrompt,
              onChange: (e) => setCustomPrompt(e.target.value),
              rows: 3
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            onClick: handleGenerate,
            disabled: isGenerating,
            className: "w-full gap-2",
            children: isGenerating ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-4 w-4 animate-spin" }),
              "Generating..."
            ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "h-4 w-4" }),
              "Generate with AI"
            ] })
          }
        ),
        generatedContent && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4 p-4 border rounded-lg bg-muted/50", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "post-title", children: "Post Title" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "post-title",
                placeholder: "Enter a title for this post...",
                value: postTitle,
                onChange: (e) => setPostTitle(e.target.value)
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Generated Content" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-4 bg-background border rounded-lg whitespace-pre-wrap text-sm", children: generatedContent[platformType] || generatedContent.raw })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: handleSave, className: "w-full", children: "Save as Draft" })
        ] })
      ] })
    ] })
  ] });
}

function SocialMediaWebhookDialog() {
  const [open, setOpen] = reactExports.useState(false);
  const [name, setName] = reactExports.useState("");
  const [platform, setPlatform] = reactExports.useState("");
  const [webhookUrl, setWebhookUrl] = reactExports.useState("");
  const [isActive, setIsActive] = reactExports.useState(true);
  const { createWebhook } = useSocialMedia();
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      ue.error("Please enter a webhook name");
      return;
    }
    if (!platform) {
      ue.error("Please select a platform");
      return;
    }
    if (!webhookUrl.trim()) {
      ue.error("Please enter a webhook URL");
      return;
    }
    createWebhook({
      name,
      platform,
      webhook_url: webhookUrl,
      is_active: isActive,
      headers: {}
    });
    setName("");
    setPlatform("");
    setWebhookUrl("");
    setIsActive(true);
    setOpen(false);
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Dialog, { open, onOpenChange: setOpen, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-4 w-4 mr-2" }),
      "Add Webhook"
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: "Add Social Media Webhook" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogDescription, { children: "Configure a webhook to automatically distribute posts to your platforms" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "name", children: "Webhook Name" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              id: "name",
              placeholder: "My Make.com Workflow",
              value: name,
              onChange: (e) => setName(e.target.value),
              required: true
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "platform", children: "Platform *" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: platform, onValueChange: setPlatform, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { id: "platform", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Select platform" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "make", children: "Make.com" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "zapier", children: "Zapier" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "n8n", children: "n8n" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "custom", children: "Custom" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "facebook", children: "Facebook" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "instagram", children: "Instagram" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "linkedin", children: "LinkedIn" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "twitter", children: "Twitter/X" })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "url", children: "Webhook URL" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              id: "url",
              type: "url",
              placeholder: "https://hook.example.com/webhook/social",
              value: webhookUrl,
              onChange: (e) => setWebhookUrl(e.target.value),
              required: true
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "active", children: "Active" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Switch,
            {
              id: "active",
              checked: isActive,
              onCheckedChange: setIsActive
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "submit", className: "w-full", children: "Create Webhook" })
      ] })
    ] })
  ] });
}

function SocialMediaManager() {
  const [activeTab, setActiveTab] = reactExports.useState("all");
  const {
    posts,
    marketingPosts,
    webhooks,
    isLoading,
    deletePost,
    updateWebhook,
    deleteWebhook,
    testWebhook,
    isTestingWebhook,
    generateMarketingPost,
    isGeneratingMarketingPost,
    marketingPostData,
    retryMarketingPost,
    isRetryingPost
  } = useSocialMedia();
  const getStatusColor = (status) => {
    switch (status) {
      case "posted":
        return "bg-green-500";
      case "scheduled":
        return "bg-blue-500";
      case "draft":
        return "bg-gray-500";
      case "archived":
        return "bg-orange-500";
      default:
        return "bg-gray-500";
    }
  };
  const getContentTypeLabel = (type) => {
    return type.split("_").map(
      (word) => word.charAt(0).toUpperCase() + word.slice(1)
    ).join(" ");
  };
  if (isLoading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-center p-12", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-8 w-8 animate-spin text-primary" }) });
  }
  const filteredPosts = activeTab === "all" ? posts : posts?.filter((p) => p.status === activeTab);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: "Social Media Content" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: "Manage and generate social media posts for your real estate business" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CreateSocialPostDialog, {})
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Tabs, { value: activeTab, onValueChange: setActiveTab, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsList, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(TabsTrigger, { value: "all", children: "All Posts" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TabsTrigger, { value: "draft", children: "Drafts" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TabsTrigger, { value: "scheduled", children: "Scheduled" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TabsTrigger, { value: "posted", children: "Posted" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: activeTab, className: "space-y-4 mt-6", children: filteredPosts && filteredPosts.length > 0 ? filteredPosts.map((post) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border rounded-lg p-4 hover:border-primary transition-colors", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mb-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "font-semibold", children: post.post_title || "Untitled Post" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { className: `${getStatusColor(post.status)} text-white`, children: post.status })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap gap-2 text-sm text-muted-foreground mb-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "inline-flex items-center gap-1", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", children: getContentTypeLabel(post.content_type) }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "inline-flex items-center gap-1", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", children: getContentTypeLabel(post.subject_type) }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "inline-flex items-center gap-1", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", children: getContentTypeLabel(post.platform_type) }) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4 text-xs text-muted-foreground", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                "Created: ",
                format(new Date(post.created_at), "MMM d, yyyy h:mm a")
              ] }),
              post.scheduled_for && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Calendar, { className: "h-3 w-3" }),
                "Scheduled: ",
                format(new Date(post.scheduled_for), "MMM d, yyyy h:mm a")
              ] }),
              post.posted_at && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Send, { className: "h-3 w-3" }),
                "Posted: ",
                format(new Date(post.posted_at), "MMM d, yyyy h:mm a")
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", size: "sm", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Eye, { className: "h-4 w-4" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", size: "sm", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SquarePen, { className: "h-4 w-4" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                variant: "outline",
                size: "sm",
                onClick: () => {
                  if (confirm("Are you sure you want to delete this post?")) {
                    deletePost(post.id);
                  }
                },
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash, { className: "h-4 w-4" })
              }
            )
          ] })
        ] }) }, post.id)) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center py-12", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground", children: "No posts found" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CreateSocialPostDialog, {})
        ] }) })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: "Webhook Configuration" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: "Configure webhooks for automatic post distribution" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(SocialMediaWebhookDialog, {})
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: webhooks && webhooks.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", children: webhooks.map((webhook) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between p-4 border rounded-lg", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Link2, { className: "h-5 w-5 text-muted-foreground" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium", children: webhook.name }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: webhook.platform }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mt-1 truncate max-w-md", children: webhook.webhook_url })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              variant: "ghost",
              size: "sm",
              onClick: () => testWebhook(webhook.id),
              disabled: isTestingWebhook,
              title: "Test webhook with sample post",
              children: isTestingWebhook ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Send, { className: "h-4 w-4" })
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              variant: "ghost",
              size: "sm",
              onClick: () => updateWebhook({
                id: webhook.id,
                updates: { is_active: !webhook.is_active }
              }),
              children: webhook.is_active ? /* @__PURE__ */ jsxRuntimeExports.jsx(ToggleRight, { className: "h-5 w-5 text-green-600" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(ToggleLeft, { className: "h-5 w-5 text-gray-400" })
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              variant: "ghost",
              size: "sm",
              onClick: () => {
                if (confirm("Are you sure you want to delete this webhook?")) {
                  deleteWebhook(webhook.id);
                }
              },
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash, { className: "h-4 w-4" })
            }
          )
        ] })
      ] }, webhook.id)) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-center py-8", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground mb-4", children: "No webhooks configured yet. Add a webhook to automatically distribute posts." }) }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: "Marketing Post Generator" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: "Generate unique, catchy social media posts to drive agent signups" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              onClick: () => generateMarketingPost(),
              disabled: isGeneratingMarketingPost,
              className: "flex-1",
              children: isGeneratingMarketingPost ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-4 w-4 mr-2 animate-spin" }),
                "Generating..."
              ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-4 w-4 mr-2" }),
                "Generate New Post"
              ] })
            }
          ),
          webhooks && webhooks.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              variant: "outline",
              onClick: () => {
                const activeWebhook = webhooks.find((w) => w.is_active);
                if (activeWebhook) {
                  generateMarketingPost(activeWebhook.webhook_url);
                }
              },
              disabled: isGeneratingMarketingPost || !webhooks.some((w) => w.is_active),
              children: "Generate & Send"
            }
          )
        ] }),
        marketingPostData && marketingPostData.payload && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4 mt-4 border-t pt-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "font-semibold mb-2", children: "Long Form (LinkedIn/Facebook):" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-muted p-4 rounded-lg text-sm whitespace-pre-wrap", children: marketingPostData.payload.longFormPost })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "font-semibold mb-2", children: "Short Form (Twitter/Threads):" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-muted p-4 rounded-lg text-sm", children: marketingPostData.payload.shortFormPost })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "font-semibold mb-2", children: "Hashtags:" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap gap-2", children: marketingPostData.payload.hashtags.map((tag, idx) => /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "secondary", children: tag }, idx)) })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: "Marketing Post History" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: "View and redeploy previously generated marketing posts" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: marketingPosts && marketingPosts.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-4", children: marketingPosts.map((post) => {
        const content = post.post_content;
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border rounded-lg p-4 space-y-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { className: `${getStatusColor(post.status)} text-white`, children: post.status }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-muted-foreground", children: format(new Date(post.created_at), "MMM d, yyyy h:mm a") })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
              webhooks && webhooks.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(
                Button,
                {
                  variant: "outline",
                  size: "sm",
                  onClick: () => {
                    const activeWebhook = webhooks.find((w) => w.is_active);
                    if (activeWebhook) {
                      retryMarketingPost({
                        postId: post.id,
                        webhookUrl: activeWebhook.webhook_url
                      });
                    }
                  },
                  disabled: isRetryingPost || !webhooks.some((w) => w.is_active),
                  children: isRetryingPost ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Send, { className: "h-4 w-4 mr-2" }),
                    "Resend"
                  ] })
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Button,
                {
                  variant: "outline",
                  size: "sm",
                  onClick: () => {
                    if (confirm("Are you sure you want to delete this post?")) {
                      deletePost(post.id);
                    }
                  },
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash, { className: "h-4 w-4" })
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-sm font-semibold mb-1", children: "Long Form:" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-muted p-3 rounded text-sm whitespace-pre-wrap", children: content.longFormPost })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-sm font-semibold mb-1", children: "Short Form:" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-muted p-3 rounded text-sm", children: content.shortFormPost })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap gap-1", children: content.hashtags?.map((tag, idx) => /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "secondary", className: "text-xs", children: tag }, idx)) })
          ] })
        ] }, post.id);
      }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-center py-8", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "No marketing posts generated yet. Create your first one above!" }) }) })
    ] })
  ] });
}

function useArticles() {
  const queryClient = useQueryClient();
  const articlesQuery = useQuery({
    queryKey: ["articles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("articles").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    }
  });
  const generateArticleMutation = useMutation({
    mutationFn: async (params) => {
      const { data, error } = await supabase.functions.invoke("generate-article", {
        body: params
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data.success) {
        ue.success("Article generated successfully!");
      } else {
        ue.error(data.error || "Generation failed");
      }
    },
    onError: (error) => {
      ue.error("Failed to generate article: " + error.message);
    }
  });
  const createArticleMutation = useMutation({
    mutationFn: async (article) => {
      const { data: userData } = await supabase.auth.getUser();
      const { data, error } = await supabase.from("articles").insert({
        ...article,
        author_id: userData.user?.id
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["articles"] });
      ue.success("Article created successfully");
    },
    onError: (error) => {
      ue.error("Failed to create article: " + error.message);
    }
  });
  const updateArticleMutation = useMutation({
    mutationFn: async ({ id, updates }) => {
      const { error } = await supabase.from("articles").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["articles"] });
      ue.success("Article updated successfully");
    },
    onError: (error) => {
      ue.error("Failed to update article: " + error.message);
    }
  });
  const publishArticleMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from("articles").update({
        status: "published",
        published_at: (/* @__PURE__ */ new Date()).toISOString()
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["articles"] });
      ue.success("Article published successfully");
    },
    onError: (error) => {
      ue.error("Failed to publish article: " + error.message);
    }
  });
  const republishArticleMutation = useMutation({
    mutationFn: async (id) => {
      const { data, error } = await supabase.functions.invoke("publish-article-to-social", {
        body: { articleId: id }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data?.success) {
        ue.success("Article distributed to social platforms successfully");
      } else {
        ue.error(data?.error || "Failed to distribute article");
      }
    },
    onError: (error) => {
      ue.error("Failed to distribute article: " + error.message);
    }
  });
  const deleteArticleMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from("articles").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["articles"] });
      ue.success("Article deleted successfully");
    },
    onError: (error) => {
      ue.error("Failed to delete article: " + error.message);
    }
  });
  return {
    articles: articlesQuery.data,
    isLoading: articlesQuery.isLoading,
    generateArticle: generateArticleMutation.mutate,
    isGenerating: generateArticleMutation.isPending,
    generatedArticle: generateArticleMutation.data,
    createArticle: createArticleMutation.mutate,
    updateArticle: updateArticleMutation.mutate,
    publishArticle: publishArticleMutation.mutate,
    republishArticle: republishArticleMutation.mutate,
    isRepublishing: republishArticleMutation.isPending,
    deleteArticle: deleteArticleMutation.mutate
  };
}

function useKeywords() {
  const queryClient = useQueryClient();
  const { data: keywords = [], isLoading } = useQuery({
    queryKey: ["keywords"],
    queryFn: async () => {
      const { data, error } = await supabase.from("keywords").select("*").order("usage_count", { ascending: true }).order("keyword", { ascending: true });
      if (error) throw error;
      return data;
    }
  });
  const { data: unusedKeywords = [] } = useQuery({
    queryKey: ["keywords", "unused"],
    queryFn: async () => {
      const { data, error } = await supabase.from("keywords").select("*").eq("is_active", true).order("usage_count", { ascending: true }).order("last_used_at", { ascending: true, nullsFirst: true }).limit(50);
      if (error) throw error;
      return data;
    }
  });
  const importKeywordsMutation = useMutation({
    mutationFn: async (keywords2) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");
      const response = await fetch(
        `${supabase.supabaseUrl}/functions/v1/import-keywords`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${session.access_token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ keywords: keywords2 })
        }
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to import keywords");
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["keywords"] });
      ue.success(data.message || "Keywords imported successfully");
    },
    onError: (error) => {
      ue.error(error.message || "Failed to import keywords");
    }
  });
  const updateKeywordMutation = useMutation({
    mutationFn: async ({ id, updates }) => {
      const { data, error } = await supabase.from("keywords").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["keywords"] });
      ue.success("Keyword updated successfully");
    },
    onError: (error) => {
      ue.error(error.message || "Failed to update keyword");
    }
  });
  const deleteKeywordMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from("keywords").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["keywords"] });
      ue.success("Keyword deleted successfully");
    },
    onError: (error) => {
      ue.error(error.message || "Failed to delete keyword");
    }
  });
  return {
    keywords,
    unusedKeywords,
    isLoading,
    importKeywords: (keywords2) => importKeywordsMutation.mutate(keywords2),
    isImporting: importKeywordsMutation.isPending,
    updateKeyword: (id, updates) => updateKeywordMutation.mutate({ id, updates }),
    deleteKeyword: (id) => deleteKeywordMutation.mutate(id)
  };
}

function useArticleWebhooks() {
  const queryClient = useQueryClient();
  const webhooksQuery = useQuery({
    queryKey: ["article-webhooks"],
    queryFn: async () => {
      const { data, error } = await supabase.from("article_webhooks").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    }
  });
  const createWebhookMutation = useMutation({
    mutationFn: async (webhook) => {
      const { data: userData } = await supabase.auth.getUser();
      const { data, error } = await supabase.from("article_webhooks").insert({
        ...webhook,
        user_id: userData.user?.id
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["article-webhooks"] });
      ue.success("Webhook created successfully");
    },
    onError: (error) => {
      ue.error("Failed to create webhook: " + error.message);
    }
  });
  const updateWebhookMutation = useMutation({
    mutationFn: async ({ id, updates }) => {
      const { error } = await supabase.from("article_webhooks").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["article-webhooks"] });
      ue.success("Webhook updated successfully");
    },
    onError: (error) => {
      ue.error("Failed to update webhook: " + error.message);
    }
  });
  const deleteWebhookMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from("article_webhooks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["article-webhooks"] });
      ue.success("Webhook deleted successfully");
    },
    onError: (error) => {
      ue.error("Failed to delete webhook: " + error.message);
    }
  });
  const testWebhookMutation = useMutation({
    mutationFn: async (webhookUrl) => {
      const { data, error } = await supabase.functions.invoke("test-article-webhook", {
        body: { webhookUrl }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data?.success) {
        ue.success("Test payload sent successfully! Check your Make.com scenario.");
      } else {
        ue.error(data?.error || "Test failed");
      }
    },
    onError: (error) => {
      ue.error("Failed to test webhook: " + error.message);
    }
  });
  return {
    webhooks: webhooksQuery.data,
    isLoading: webhooksQuery.isLoading,
    createWebhook: createWebhookMutation.mutate,
    updateWebhook: updateWebhookMutation.mutate,
    deleteWebhook: deleteWebhookMutation.mutate,
    testWebhook: testWebhookMutation.mutate,
    isTesting: testWebhookMutation.isPending,
    testResult: testWebhookMutation.data
  };
}

function CreateArticleDialog() {
  const [open, setOpen] = reactExports.useState(false);
  const [mode, setMode] = reactExports.useState("keyword");
  const [selectedKeywordId, setSelectedKeywordId] = reactExports.useState("");
  const [topic, setTopic] = reactExports.useState("");
  const [category, setCategory] = reactExports.useState("Real Estate Tips");
  const [keywords, setKeywords] = reactExports.useState("");
  const [customInstructions, setCustomInstructions] = reactExports.useState("");
  const [generatedArticle, setGeneratedArticle] = reactExports.useState(null);
  const { generateArticle, isGenerating, createArticle } = useArticles();
  const { unusedKeywords, isLoading: isLoadingKeywords } = useKeywords();
  const handleGenerate = () => {
    if (mode === "keyword") {
      const selectedKeyword = unusedKeywords.find((k) => k.id === selectedKeywordId);
      generateArticle({
        topic: selectedKeyword?.keyword,
        category,
        keywords: selectedKeyword ? [selectedKeyword.keyword] : void 0,
        customInstructions: customInstructions || void 0,
        autoSelectKeyword: !selectedKeywordId
      }, {
        onSuccess: (data) => {
          if (data.success) {
            setGeneratedArticle(data.article);
            if (data.article.keywordId) {
              setSelectedKeywordId(data.article.keywordId);
            }
          }
        }
      });
    } else {
      if (!topic) return;
      generateArticle({
        topic,
        category,
        keywords: keywords ? keywords.split(",").map((k) => k.trim()) : void 0,
        customInstructions: customInstructions || void 0,
        autoSelectKeyword: false
      }, {
        onSuccess: (data) => {
          if (data.success) {
            setGeneratedArticle(data.article);
          }
        }
      });
    }
  };
  const handleSave = () => {
    if (!generatedArticle) return;
    createArticle({
      title: generatedArticle.title,
      slug: generatedArticle.slug,
      content: generatedArticle.content,
      excerpt: generatedArticle.excerpt,
      category: generatedArticle.category,
      tags: generatedArticle.tags,
      seo_title: generatedArticle.seoTitle,
      seo_description: generatedArticle.seoDescription,
      seo_keywords: generatedArticle.tags,
      keyword_id: mode === "keyword" ? generatedArticle.keywordId || selectedKeywordId || null : null,
      status: "draft"
    }, {
      onSuccess: () => {
        setOpen(false);
        setGeneratedArticle(null);
        setTopic("");
        setKeywords("");
        setCustomInstructions("");
        setSelectedKeywordId("");
      }
    });
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Dialog, { open, onOpenChange: setOpen, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { className: "gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-4 w-4" }),
      "New Article"
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "max-w-4xl max-h-[90vh] overflow-y-auto", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: "Generate Blog Article" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogDescription, { children: "Create SEO-optimized real estate articles with AI assistance" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4 mt-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Tabs, { value: mode, onValueChange: (v) => setMode(v), children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsList, { className: "grid w-full grid-cols-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(TabsTrigger, { value: "keyword", children: "From Keyword" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(TabsTrigger, { value: "manual", children: "Manual Topic" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "keyword", className: "space-y-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "keyword-select", children: "Select Keyword (Optional - auto-selects if empty)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: selectedKeywordId, onValueChange: setSelectedKeywordId, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { id: "keyword-select", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Auto-select unused keyword..." }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: isLoadingKeywords ? /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "loading", disabled: true, children: "Loading keywords..." }) : unusedKeywords.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "none", disabled: true, children: "No keywords available" }) : unusedKeywords.map((kw) => /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectItem, { value: kw.id, children: [
                kw.keyword,
                " (used ",
                kw.usage_count,
                " times)"
              ] }, kw.id)) })
            ] })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsContent, { value: "manual", className: "space-y-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "topic", children: "Article Topic *" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  id: "topic",
                  placeholder: "e.g., First-Time Homebuyer Tips for 2025",
                  value: topic,
                  onChange: (e) => setTopic(e.target.value)
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "keywords", children: "Target Keywords (comma-separated)" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  id: "keywords",
                  placeholder: "e.g., real estate, home buying, mortgage tips",
                  value: keywords,
                  onChange: (e) => setKeywords(e.target.value)
                }
              )
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "category", children: "Category" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: category, onValueChange: setCategory, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { id: "category", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "Real Estate Tips", children: "Real Estate Tips" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "Market Insights", children: "Market Insights" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "Buying Guide", children: "Buying Guide" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "Selling Guide", children: "Selling Guide" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "Investment", children: "Investment" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "Neighborhood Guides", children: "Neighborhood Guides" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "Home Improvement", children: "Home Improvement" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "General", children: "General" })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "instructions", children: "Custom Instructions (Optional)" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Textarea,
            {
              id: "instructions",
              placeholder: "Add specific requirements, tone, or focus areas...",
              value: customInstructions,
              onChange: (e) => setCustomInstructions(e.target.value),
              rows: 3
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            onClick: handleGenerate,
            disabled: isGenerating || mode === "manual" && !topic,
            className: "w-full gap-2",
            children: isGenerating ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-4 w-4 animate-spin" }),
              "Generating Article..."
            ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "h-4 w-4" }),
              mode === "keyword" && !selectedKeywordId ? "Auto-Select Keyword & Generate" : "Generate Article with AI"
            ] })
          }
        ),
        generatedArticle && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4 p-4 border rounded-lg bg-muted/50", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-bold text-lg mb-2", children: generatedArticle.title }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-muted-foreground mb-2", children: [
              "Slug: ",
              generatedArticle.slug
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground mb-4", children: generatedArticle.excerpt })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Article Content (Markdown)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-4 bg-background border rounded-lg max-h-96 overflow-y-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsx("pre", { className: "whitespace-pre-wrap text-sm font-mono", children: generatedArticle.content }) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-4 text-sm", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-semibold", children: "SEO Title:" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground", children: generatedArticle.seoTitle })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-semibold", children: "SEO Description:" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground", children: generatedArticle.seoDescription })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: handleSave, className: "w-full", children: "Save as Draft" })
        ] })
      ] })
    ] })
  ] });
}

function ArticleWebhookDialog() {
  const [open, setOpen] = reactExports.useState(false);
  const [name, setName] = reactExports.useState("");
  const [webhookUrl, setWebhookUrl] = reactExports.useState("");
  const [isActive, setIsActive] = reactExports.useState(true);
  const { createWebhook } = useArticleWebhooks();
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !webhookUrl.trim()) {
      return;
    }
    createWebhook({
      name,
      webhook_url: webhookUrl,
      is_active: isActive
    });
    setName("");
    setWebhookUrl("");
    setIsActive(true);
    setOpen(false);
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Dialog, { open, onOpenChange: setOpen, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-4 w-4 mr-2" }),
      "Add Webhook"
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: "Add Article Webhook" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogDescription, { children: "Configure a webhook to receive article data when articles are published" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "name", children: "Webhook Name" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              id: "name",
              placeholder: "My Social Platform",
              value: name,
              onChange: (e) => setName(e.target.value),
              required: true
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "url", children: "Webhook URL" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              id: "url",
              type: "url",
              placeholder: "https://api.example.com/webhooks/article",
              value: webhookUrl,
              onChange: (e) => setWebhookUrl(e.target.value),
              required: true
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "active", children: "Active" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Switch,
            {
              id: "active",
              checked: isActive,
              onCheckedChange: setIsActive
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "submit", className: "w-full", children: "Create Webhook" })
      ] })
    ] })
  ] });
}

function KeywordImportDialog() {
  const [open, setOpen] = reactExports.useState(false);
  const { importKeywords, isImporting } = useKeywords();
  const fileInputRef = reactExports.useRef(null);
  const downloadTemplate = () => {
    const template = `keyword,category,difficulty,search_volume,notes
real estate agent portfolio,Real Estate,medium,1000,Example keyword
luxury home listings,Luxury Real Estate,hard,500,High-value properties
first time home buyer tips,Real Estate,easy,2000,Educational content`;
    const blob = new Blob([template], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "keywords-template.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    ue.success("Template downloaded");
  };
  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const lines = text.split("\n").filter((line) => line.trim());
      if (lines.length < 2) {
        ue.error("CSV file is empty or invalid");
        return;
      }
      const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
      const keywords = lines.slice(1).map((line) => {
        const values = line.split(",").map((v) => v.trim());
        const keyword = {};
        headers.forEach((header, index) => {
          if (values[index]) {
            keyword[header] = values[index];
          }
        });
        return keyword;
      }).filter((k) => k.keyword);
      if (keywords.length === 0) {
        ue.error("No valid keywords found in CSV");
        return;
      }
      await importKeywords(keywords);
      setOpen(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Error parsing CSV:", error);
      ue.error("Failed to parse CSV file");
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Dialog, { open, onOpenChange: setOpen, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Upload, { className: "h-4 w-4 mr-2" }),
      "Import Keywords"
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: "Import Keywords from CSV" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogDescription, { children: "Upload a CSV file with your keywords. New keywords will be added and existing ones will be skipped." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-2 border-dashed rounded-lg p-6 text-center", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              ref: fileInputRef,
              type: "file",
              accept: ".csv",
              onChange: handleFileUpload,
              disabled: isImporting,
              className: "hidden",
              id: "csv-upload"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { htmlFor: "csv-upload", className: "cursor-pointer", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center gap-2", children: [
            isImporting ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-8 w-8 animate-spin text-primary" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Upload, { className: "h-8 w-8 text-muted-foreground" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium", children: isImporting ? "Importing..." : "Click to upload CSV" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "CSV files only" })
          ] }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium", children: "CSV Format:" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-muted p-3 rounded-md text-xs font-mono", children: "keyword,category,difficulty,search_volume,notes" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("ul", { className: "text-xs text-muted-foreground space-y-1 ml-4 list-disc", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "keyword" }),
              " (required): The keyword phrase"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "category" }),
              ": Real Estate, Luxury Real Estate, etc."
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "difficulty" }),
              ": easy, medium, or hard"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "search_volume" }),
              ": Monthly search volume (number)"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "notes" }),
              ": Any additional notes"
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Button,
          {
            onClick: downloadTemplate,
            variant: "secondary",
            className: "w-full",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { className: "h-4 w-4 mr-2" }),
              "Download Template"
            ]
          }
        )
      ] })
    ] })
  ] });
}

function useContentSuggestions() {
  const queryClient = useQueryClient();
  const { data: suggestions = [], isLoading } = useQuery({
    queryKey: ["content-suggestions"],
    queryFn: async () => {
      const { data, error } = await supabase.from("content_suggestions").select("*").order("priority", { ascending: false }).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    }
  });
  const generateSuggestionsMutation = useMutation({
    mutationFn: async ({ customInstructions, count }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");
      const response = await supabase.functions.invoke("generate-content-suggestions", {
        body: { customInstructions, count }
      });
      if (response.error) {
        throw new Error(response.error.message || "Failed to generate suggestions");
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content-suggestions"] });
      ue.success("Content suggestions generated successfully");
    },
    onError: (error) => {
      ue.error(error.message || "Failed to generate suggestions");
    }
  });
  const updateSuggestionMutation = useMutation({
    mutationFn: async ({ id, updates }) => {
      const { data, error } = await supabase.from("content_suggestions").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content-suggestions"] });
    },
    onError: (error) => {
      ue.error(error.message || "Failed to update suggestion");
    }
  });
  const deleteSuggestionMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from("content_suggestions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content-suggestions"] });
      ue.success("Suggestion deleted");
    },
    onError: (error) => {
      ue.error(error.message || "Failed to delete suggestion");
    }
  });
  const addToKeywordsMutation = useMutation({
    mutationFn: async (suggestion) => {
      const keywordsToAdd = suggestion.keywords || [suggestion.topic];
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");
      const response = await supabase.functions.invoke("import-keywords", {
        body: {
          keywords: keywordsToAdd.map((kw) => ({
            keyword: kw,
            category: suggestion.category || "General"
          }))
        }
      });
      if (response.error) {
        throw new Error(response.error.message || "Failed to add to keywords");
      }
      await supabase.from("content_suggestions").update({ status: "completed" }).eq("id", suggestion.id);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content-suggestions"] });
      queryClient.invalidateQueries({ queryKey: ["keywords"] });
      ue.success("Added to keywords successfully");
    },
    onError: (error) => {
      ue.error(error.message || "Failed to add to keywords");
    }
  });
  const writeArticleMutation = useMutation({
    mutationFn: async (suggestion) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");
      await supabase.from("content_suggestions").update({ status: "queued" }).eq("id", suggestion.id);
      const response = await supabase.functions.invoke("generate-article", {
        body: {
          topic: suggestion.topic,
          category: suggestion.category,
          keywords: suggestion.keywords,
          autoSelectKeyword: false
        }
      });
      if (response.error) {
        throw new Error(response.error.message || "Failed to generate article");
      }
      await supabase.from("content_suggestions").update({ status: "completed", generated_article_id: response.data?.article?.id }).eq("id", suggestion.id);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content-suggestions"] });
      queryClient.invalidateQueries({ queryKey: ["articles"] });
      ue.success("Article generated successfully");
    },
    onError: (error) => {
      ue.error(error.message || "Failed to generate article");
    }
  });
  return {
    suggestions,
    isLoading,
    generateSuggestions: (customInstructions, count) => generateSuggestionsMutation.mutate({ customInstructions, count }),
    isGenerating: generateSuggestionsMutation.isPending,
    updateSuggestion: (id, updates) => updateSuggestionMutation.mutate({ id, updates }),
    deleteSuggestion: (id) => deleteSuggestionMutation.mutate(id),
    queueSuggestion: (id) => updateSuggestionMutation.mutate({ id, updates: { status: "queued" } }),
    rejectSuggestion: (id) => updateSuggestionMutation.mutate({ id, updates: { status: "rejected" } }),
    addToKeywords: (suggestion) => addToKeywordsMutation.mutate(suggestion),
    writeArticle: (suggestion) => writeArticleMutation.mutate(suggestion),
    isWritingArticle: writeArticleMutation.isPending
  };
}

function ContentSuggestionsCard() {
  const [isDialogOpen, setIsDialogOpen] = reactExports.useState(false);
  const [customInstructions, setCustomInstructions] = reactExports.useState("");
  const [suggestionCount, setSuggestionCount] = reactExports.useState("10");
  const {
    suggestions,
    isLoading,
    generateSuggestions,
    isGenerating,
    queueSuggestion,
    rejectSuggestion,
    deleteSuggestion,
    addToKeywords,
    writeArticle,
    isWritingArticle
  } = useContentSuggestions();
  const handleGenerate = () => {
    generateSuggestions(customInstructions, parseInt(suggestionCount) || 10);
    setIsDialogOpen(false);
    setCustomInstructions("");
  };
  const getStatusColor = (status) => {
    switch (status) {
      case "queued":
        return "bg-blue-500";
      case "in_progress":
        return "bg-yellow-500";
      case "completed":
        return "bg-green-500";
      case "rejected":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };
  const getPriorityIcon = (priority) => {
    const p = priority || 3;
    if (p >= 4) return /* @__PURE__ */ jsxRuntimeExports.jsx(TrendingUp, { className: "h-3 w-3 text-red-500" });
    if (p >= 3) return /* @__PURE__ */ jsxRuntimeExports.jsx(TrendingUp, { className: "h-3 w-3 text-orange-500" });
    return /* @__PURE__ */ jsxRuntimeExports.jsx(TrendingUp, { className: "h-3 w-3 text-gray-500" });
  };
  const pendingSuggestions = suggestions.filter((s) => s.status === "pending");
  const queuedSuggestions = suggestions.filter((s) => s.status === "queued");
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Lightbulb, { className: "h-5 w-5" }),
          "AI Content Suggestions"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: "Generate high-value article ideas based on SEO keywords and market trends" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Dialog, { open: isDialogOpen, onOpenChange: setIsDialogOpen, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-4 w-4 mr-2" }),
          "Generate Suggestions"
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: "Generate Content Suggestions" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(DialogDescription, { children: "AI will analyze your existing keywords and articles to suggest relevant topics" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-sm font-medium", children: "Number of Suggestions" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  type: "number",
                  min: "1",
                  max: "50",
                  value: suggestionCount,
                  onChange: (e) => setSuggestionCount(e.target.value),
                  placeholder: "10"
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-sm font-medium", children: "Custom Instructions (Optional)" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Textarea,
                {
                  value: customInstructions,
                  onChange: (e) => setCustomInstructions(e.target.value),
                  placeholder: "E.g., Focus on first-time homebuyers in urban areas...",
                  rows: 4
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", onClick: () => setIsDialogOpen(false), children: "Cancel" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: handleGenerate, disabled: isGenerating, children: [
              isGenerating && /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-4 w-4 mr-2 animate-spin" }),
              "Generate"
            ] })
          ] })
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-center p-8", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-8 w-8 animate-spin text-primary" }) }) : suggestions.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-4 gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border rounded-lg p-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Total" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-2xl font-bold", children: suggestions.length })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border rounded-lg p-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Pending" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-2xl font-bold text-gray-600", children: pendingSuggestions.length })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border rounded-lg p-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Queued" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-2xl font-bold text-blue-600", children: queuedSuggestions.length })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border rounded-lg p-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Completed" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-2xl font-bold text-green-600", children: suggestions.filter((s) => s.status === "completed").length })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", children: suggestions.map((suggestion) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border rounded-lg p-4 hover:border-primary transition-colors", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between mb-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mb-1", children: [
            getPriorityIcon(suggestion.priority),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "font-semibold", children: suggestion.topic }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { className: `${getStatusColor(suggestion.status)} text-white text-xs`, children: suggestion.status || "pending" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap gap-2 mt-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", children: suggestion.category || "General" }),
            suggestion.keywords?.slice(0, 3).map((keyword, idx) => /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { variant: "secondary", className: "gap-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Hash, { className: "h-3 w-3" }),
              keyword
            ] }, idx))
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2 ml-4", children: [
          suggestion.status === "pending" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                variant: "outline",
                size: "sm",
                onClick: () => writeArticle(suggestion),
                disabled: isWritingArticle,
                title: "Write Article Now",
                children: isWritingArticle ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Zap, { className: "h-4 w-4" })
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                variant: "outline",
                size: "sm",
                onClick: () => queueSuggestion(suggestion.id),
                title: "Add to Queue",
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "h-4 w-4" })
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                variant: "outline",
                size: "sm",
                onClick: () => addToKeywords(suggestion),
                title: "Add to Keywords",
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(Hash, { className: "h-4 w-4" })
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                variant: "outline",
                size: "sm",
                onClick: () => rejectSuggestion(suggestion.id),
                title: "Reject",
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(CircleX, { className: "h-4 w-4" })
              }
            )
          ] }),
          suggestion.status === "completed" && /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              variant: "outline",
              size: "sm",
              disabled: true,
              title: "Completed",
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheckBig, { className: "h-4 w-4" })
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              variant: "outline",
              size: "sm",
              onClick: () => {
                if (confirm("Delete this suggestion?")) {
                  deleteSuggestion(suggestion.id);
                }
              },
              title: "Delete",
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash, { className: "h-4 w-4" })
            }
          )
        ] })
      ] }) }, suggestion.id)) })
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center py-8", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Lightbulb, { className: "h-12 w-12 text-muted-foreground mx-auto mb-4" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground mb-4", children: "No content suggestions yet. Generate AI-powered topic ideas to get started." }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Dialog, { open: isDialogOpen, onOpenChange: setIsDialogOpen, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-4 w-4 mr-2" }),
          "Generate First Suggestions"
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: "Generate Content Suggestions" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(DialogDescription, { children: "AI will analyze your existing keywords and articles to suggest relevant topics" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-sm font-medium", children: "Number of Suggestions" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  type: "number",
                  min: "1",
                  max: "50",
                  value: suggestionCount,
                  onChange: (e) => setSuggestionCount(e.target.value),
                  placeholder: "10"
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-sm font-medium", children: "Custom Instructions (Optional)" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Textarea,
                {
                  value: customInstructions,
                  onChange: (e) => setCustomInstructions(e.target.value),
                  placeholder: "E.g., Focus on first-time homebuyers in urban areas...",
                  rows: 4
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", onClick: () => setIsDialogOpen(false), children: "Cancel" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: handleGenerate, disabled: isGenerating, children: [
              isGenerating && /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-4 w-4 mr-2 animate-spin" }),
              "Generate"
            ] })
          ] })
        ] })
      ] })
    ] }) })
  ] });
}

function ArticlesManager() {
  const [activeTab, setActiveTab] = reactExports.useState("all");
  const { articles, isLoading, deleteArticle, publishArticle, republishArticle, isRepublishing } = useArticles();
  const { keywords, isLoading: isLoadingKeywords } = useKeywords();
  const { webhooks, isLoading: isLoadingWebhooks, updateWebhook, deleteWebhook, testWebhook, isTesting } = useArticleWebhooks();
  const getStatusColor = (status) => {
    switch (status) {
      case "published":
        return "bg-green-500";
      case "scheduled":
        return "bg-blue-500";
      case "draft":
        return "bg-gray-500";
      case "archived":
        return "bg-orange-500";
      default:
        return "bg-gray-500";
    }
  };
  if (isLoading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-center p-12", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-8 w-8 animate-spin text-primary" }) });
  }
  const filteredArticles = activeTab === "all" ? articles : articles?.filter((a) => a.status === activeTab);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: "Blog Articles" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: "Manage your real estate blog content and articles" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CreateArticleDialog, {})
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Tabs, { value: activeTab, onValueChange: setActiveTab, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsList, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(TabsTrigger, { value: "all", children: "All Articles" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TabsTrigger, { value: "draft", children: "Drafts" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TabsTrigger, { value: "scheduled", children: "Scheduled" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TabsTrigger, { value: "published", children: "Published" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: activeTab, className: "space-y-4 mt-6", children: filteredArticles && filteredArticles.length > 0 ? filteredArticles.map((article) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border rounded-lg p-4 hover:border-primary transition-colors", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mb-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "font-semibold text-lg", children: article.title }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { className: `${getStatusColor(article.status)} text-white`, children: article.status })
            ] }),
            article.excerpt && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-muted-foreground mb-3", children: [
              article.excerpt.substring(0, 150),
              "..."
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap gap-2 mb-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", children: article.category }),
              article.keyword_id && /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { variant: "secondary", className: "gap-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Hash, { className: "h-3 w-3" }),
                keywords?.find((k) => k.id === article.keyword_id)?.keyword || "Keyword"
              ] }),
              article.tags?.slice(0, 2).map((tag, idx) => /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "secondary", children: tag }, idx))
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4 text-xs text-muted-foreground", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Eye, { className: "h-3 w-3" }),
                article.view_count,
                " views"
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                "Created: ",
                format(new Date(article.created_at), "MMM d, yyyy")
              ] }),
              article.published_at && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                "Published: ",
                format(new Date(article.published_at), "MMM d, yyyy")
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", size: "sm", title: "View", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Eye, { className: "h-4 w-4" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", size: "sm", title: "Edit", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SquarePen, { className: "h-4 w-4" }) }),
            article.status === "draft" && /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                variant: "outline",
                size: "sm",
                onClick: () => {
                  if (confirm("Publish this article?")) {
                    publishArticle(article.id);
                  }
                },
                title: "Publish",
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheckBig, { className: "h-4 w-4" })
              }
            ),
            article.status === "published" && /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                variant: "outline",
                size: "sm",
                onClick: () => {
                  if (confirm("Re-distribute this article to social platforms?")) {
                    republishArticle(article.id);
                  }
                },
                disabled: isRepublishing,
                title: "Re-publish to Social Media",
                children: isRepublishing ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Send, { className: "h-4 w-4" })
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                variant: "outline",
                size: "sm",
                onClick: () => {
                  if (confirm("Delete this article?")) {
                    deleteArticle(article.id);
                  }
                },
                title: "Delete",
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash, { className: "h-4 w-4" })
              }
            )
          ] })
        ] }) }, article.id)) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center py-12", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground", children: "No articles found" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CreateArticleDialog, {}) })
        ] }) })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: "Keyword Management" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: "Track SEO keyword usage across articles" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(KeywordImportDialog, {})
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: isLoadingKeywords ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-center p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-6 w-6 animate-spin text-primary" }) }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-3 gap-4 mb-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border rounded-lg p-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Total Keywords" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-2xl font-bold", children: keywords?.length || 0 })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border rounded-lg p-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Unused" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-2xl font-bold text-green-600", children: keywords?.filter((k) => k.usage_count === 0).length || 0 })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border rounded-lg p-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Most Used" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-2xl font-bold text-blue-600", children: Math.max(...keywords?.map((k) => k.usage_count) || [0]) })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Keywords are automatically tracked when articles are published. Import your keywords.csv to get started." })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(ContentSuggestionsCard, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: "Article Webhooks" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: "Configure webhooks for automatic article distribution" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(ArticleWebhookDialog, {})
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: isLoadingWebhooks ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-center p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-6 w-6 animate-spin text-primary" }) }) : webhooks && webhooks.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", children: webhooks.map((webhook) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border rounded-lg p-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mb-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "font-semibold", children: webhook.name }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: webhook.is_active ? "default" : "secondary", children: webhook.is_active ? "Active" : "Inactive" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "a",
              {
                href: webhook.webhook_url,
                target: "_blank",
                rel: "noopener noreferrer",
                className: "text-sm text-muted-foreground hover:text-primary flex items-center gap-1",
                children: [
                  webhook.webhook_url,
                  /* @__PURE__ */ jsxRuntimeExports.jsx(ExternalLink, { className: "h-3 w-3" })
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Switch,
              {
                checked: webhook.is_active,
                onCheckedChange: (checked) => {
                  updateWebhook({ id: webhook.id, updates: { is_active: checked } });
                }
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                variant: "outline",
                size: "sm",
                onClick: () => {
                  if (confirm("Delete this webhook?")) {
                    deleteWebhook(webhook.id);
                  }
                },
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash, { className: "h-4 w-4" })
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "pt-3 border-t", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            variant: "secondary",
            size: "sm",
            onClick: () => testWebhook(webhook.webhook_url),
            disabled: isTesting,
            className: "w-full",
            children: isTesting ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-4 w-4 mr-2 animate-spin" }),
              "Testing..."
            ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Zap, { className: "h-4 w-4 mr-2" }),
              "Send Test Payload to Make.com"
            ] })
          }
        ) })
      ] }, webhook.id)) }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center py-8", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground mb-4", children: "No webhooks configured. Add one to automatically send published articles to external platforms." }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(ArticleWebhookDialog, {})
      ] }) })
    ] })
  ] });
}

function AdminDashboard() {
  const { user, role } = useAuthStore();
  if (!user || role !== "admin") {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(Navigate, { to: "/", replace: true });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen bg-background", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border-b", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "container mx-auto px-4 py-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Settings, { className: "h-8 w-8 text-primary" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-3xl font-bold", children: "Admin Dashboard" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground", children: "Manage AI, content, and platform settings" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/dashboard", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", className: "gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "h-4 w-4" }),
        "Back to Dashboard"
      ] }) })
    ] }) }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "container mx-auto px-4 py-8", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Tabs, { defaultValue: "ai", className: "space-y-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsList, { className: "grid w-full grid-cols-8 lg:w-auto", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsTrigger, { value: "ai", className: "gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(BrainCircuit, { className: "h-4 w-4" }),
          "AI Settings"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsTrigger, { value: "social", className: "gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Share2, { className: "h-4 w-4" }),
          "Social Media"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsTrigger, { value: "articles", className: "gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { className: "h-4 w-4" }),
          "Articles"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsTrigger, { value: "keywords", className: "gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Database, { className: "h-4 w-4" }),
          "Keywords"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsTrigger, { value: "seo", className: "gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "h-4 w-4" }),
          "SEO"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsTrigger, { value: "analytics", className: "gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(BarChart3, { className: "h-4 w-4" }),
          "Search Analytics"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsTrigger, { value: "users", className: "gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Users, { className: "h-4 w-4" }),
          "User Roles"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsTrigger, { value: "settings", className: "gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Settings, { className: "h-4 w-4" }),
          "Platform"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "ai", className: "space-y-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx(AIConfigurationManager, {}) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "social", className: "space-y-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SocialMediaManager, {}) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "articles", className: "space-y-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ArticlesManager, {}) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "keywords", className: "space-y-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border p-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-2xl font-bold mb-2", children: "Keyword Management" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground", children: "Import and manage keywords from CSV files" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(KeywordImportDialog, {})
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Use the import button to bulk upload keywords from a CSV file. Keywords help improve content generation and SEO optimization." })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "seo", className: "space-y-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SEOManager, {}) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "analytics", className: "space-y-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SearchAnalyticsDashboard, {}) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "users", className: "space-y-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border p-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-2xl font-bold mb-4", children: "User Role Management" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground", children: "User role management interface coming soon..." })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "settings", className: "space-y-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border p-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-2xl font-bold mb-4", children: "Platform Settings" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground", children: "Additional platform configuration coming soon..." })
      ] }) })
    ] }) })
  ] });
}

export { AdminDashboard };
