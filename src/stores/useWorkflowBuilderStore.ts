/**
 * Workflow Builder Store
 * Zustand store for managing workflow builder state
 */

import { create } from "zustand";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type {
  Workflow,
  WorkflowNode,
  WorkflowEdge,
  WorkflowNodeType,
  WorkflowCategory,
  WorkflowViewport,
  WorkflowNodeTemplate,
} from "@/types/workflow";

interface WorkflowBuilderStore {
  // State
  workflow: Workflow | null;
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  isDragging: boolean;
  isConnecting: boolean;
  connectionStart: string | null;
  history: Workflow[];
  historyIndex: number;
  isSaving: boolean;
  isExecuting: boolean;
  nodeTemplates: WorkflowNodeTemplate[];

  // Actions
  setWorkflow: (workflow: Workflow) => void;
  loadWorkflow: (workflowId: string) => Promise<void>;
  loadUserWorkflows: () => Promise<Workflow[]>;
  loadNodeTemplates: () => Promise<void>;
  createNewWorkflow: (name: string, category?: WorkflowCategory) => void;

  // Node operations
  selectNode: (nodeId: string | null) => void;
  addNode: (
    type: WorkflowNodeType,
    subtype: string,
    position: { x: number; y: number },
    config?: Record<string, any>
  ) => void;
  updateNode: (nodeId: string, updates: Partial<WorkflowNode>) => void;
  removeNode: (nodeId: string) => void;
  duplicateNode: (nodeId: string) => void;

  // Edge operations
  selectEdge: (edgeId: string | null) => void;
  addEdge: (source: string, target: string, sourceHandle?: string, label?: string) => void;
  updateEdge: (edgeId: string, updates: Partial<WorkflowEdge>) => void;
  removeEdge: (edgeId: string) => void;

  // Connection handling
  startConnection: (nodeId: string) => void;
  completeConnection: (nodeId: string) => void;
  cancelConnection: () => void;

  // Viewport
  updateViewport: (viewport: Partial<WorkflowViewport>) => void;

  // Drag state
  setIsDragging: (isDragging: boolean) => void;

  // History
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  pushToHistory: () => void;

  // Persistence
  saveWorkflow: () => Promise<void>;
  publishWorkflow: () => Promise<void>;
  activateWorkflow: (active: boolean) => Promise<void>;

  // Execution
  executeWorkflow: (triggerData?: Record<string, any>) => Promise<string>;

  // Metadata
  updateWorkflowMeta: (meta: Partial<Workflow>) => void;

  // Reset
  resetBuilder: () => void;
}

const generateId = () => crypto.randomUUID();

const createDefaultWorkflow = (
  userId: string,
  name: string,
  category: WorkflowCategory = "general"
): Workflow => ({
  id: generateId(),
  userId,
  name,
  description: "",
  category,
  nodes: [],
  edges: [],
  viewport: { x: 0, y: 0, zoom: 1 },
  isPublished: false,
  isActive: false,
  version: 1,
  executionCount: 0,
  successCount: 0,
  failureCount: 0,
  tags: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

export const useWorkflowBuilderStore = create<WorkflowBuilderStore>((set, get) => ({
  // Initial state
  workflow: null,
  selectedNodeId: null,
  selectedEdgeId: null,
  isDragging: false,
  isConnecting: false,
  connectionStart: null,
  history: [],
  historyIndex: -1,
  isSaving: false,
  isExecuting: false,
  nodeTemplates: [],

  // Set workflow
  setWorkflow: (workflow) => {
    set({
      workflow,
      history: [workflow],
      historyIndex: 0,
      selectedNodeId: null,
      selectedEdgeId: null,
    });
  },

  // Load workflow from database
  loadWorkflow: async (workflowId) => {
    try {
      const { data, error } = await supabase
        .from("workflows")
        .select("*")
        .eq("id", workflowId)
        .single();

      if (error) throw error;
      if (!data) throw new Error("Workflow not found");

      const workflow: Workflow = {
        id: data.id,
        userId: data.user_id,
        name: data.name,
        description: data.description || "",
        category: data.category as WorkflowCategory,
        nodes: (data.nodes as WorkflowNode[]) || [],
        edges: (data.edges as WorkflowEdge[]) || [],
        viewport: (data.viewport as WorkflowViewport) || { x: 0, y: 0, zoom: 1 },
        isPublished: data.is_published,
        isActive: data.is_active,
        triggerConfig: data.trigger_config,
        version: data.version,
        executionCount: data.execution_count,
        successCount: data.success_count,
        failureCount: data.failure_count,
        lastExecutedAt: data.last_executed_at,
        tags: data.tags || [],
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      get().setWorkflow(workflow);
    } catch (error) {
      console.error("Failed to load workflow:", error);
      toast.error("Failed to load workflow");
      throw error;
    }
  },

  // Load all user workflows
  loadUserWorkflows: async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("workflows")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });

      if (error) throw error;

      return (data || []).map((d) => ({
        id: d.id,
        userId: d.user_id,
        name: d.name,
        description: d.description || "",
        category: d.category as WorkflowCategory,
        nodes: (d.nodes as WorkflowNode[]) || [],
        edges: (d.edges as WorkflowEdge[]) || [],
        viewport: (d.viewport as WorkflowViewport) || { x: 0, y: 0, zoom: 1 },
        isPublished: d.is_published,
        isActive: d.is_active,
        triggerConfig: d.trigger_config,
        version: d.version,
        executionCount: d.execution_count,
        successCount: d.success_count,
        failureCount: d.failure_count,
        lastExecutedAt: d.last_executed_at,
        tags: d.tags || [],
        createdAt: d.created_at,
        updatedAt: d.updated_at,
      }));
    } catch (error) {
      console.error("Failed to load workflows:", error);
      return [];
    }
  },

  // Load node templates
  loadNodeTemplates: async () => {
    try {
      const { data, error } = await supabase
        .from("workflow_node_templates")
        .select("*")
        .eq("is_active", true)
        .order("category");

      if (error) throw error;

      const templates: WorkflowNodeTemplate[] = (data || []).map((d) => ({
        id: d.id,
        type: d.type as WorkflowNodeType,
        subtype: d.subtype,
        name: d.name,
        description: d.description,
        icon: d.icon,
        category: d.category,
        configSchema: d.config_schema || {},
        defaultConfig: d.default_config || {},
        color: d.color,
        isPremium: d.is_premium,
      }));

      set({ nodeTemplates: templates });
    } catch (error) {
      console.error("Failed to load node templates:", error);
    }
  },

  // Create new workflow
  createNewWorkflow: async (name, category = "general") => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Not authenticated");
      return;
    }

    const workflow = createDefaultWorkflow(user.id, name, category);
    get().setWorkflow(workflow);
  },

  // Select node
  selectNode: (nodeId) => {
    set({ selectedNodeId: nodeId, selectedEdgeId: null });
  },

  // Add node
  addNode: (type, subtype, position, config = {}) => {
    const { workflow, nodeTemplates, pushToHistory } = get();
    if (!workflow) return;

    const template = nodeTemplates.find(
      (t) => t.type === type && t.subtype === subtype
    );

    const newNode: WorkflowNode = {
      id: generateId(),
      type,
      subtype,
      label: template?.name || subtype,
      description: template?.description,
      position,
      config: { ...template?.defaultConfig, ...config },
      outputs: type === "condition" ? ["true", "false"] : undefined,
    };

    const newWorkflow = {
      ...workflow,
      nodes: [...workflow.nodes, newNode],
      updatedAt: new Date().toISOString(),
    };

    pushToHistory();
    set({
      workflow: newWorkflow,
      selectedNodeId: newNode.id,
    });
  },

  // Update node
  updateNode: (nodeId, updates) => {
    const { workflow, pushToHistory } = get();
    if (!workflow) return;

    const newNodes = workflow.nodes.map((node) =>
      node.id === nodeId ? { ...node, ...updates } : node
    );

    pushToHistory();
    set({
      workflow: {
        ...workflow,
        nodes: newNodes,
        updatedAt: new Date().toISOString(),
      },
    });
  },

  // Remove node
  removeNode: (nodeId) => {
    const { workflow, pushToHistory } = get();
    if (!workflow) return;

    // Remove node and connected edges
    const newNodes = workflow.nodes.filter((n) => n.id !== nodeId);
    const newEdges = workflow.edges.filter(
      (e) => e.source !== nodeId && e.target !== nodeId
    );

    pushToHistory();
    set({
      workflow: {
        ...workflow,
        nodes: newNodes,
        edges: newEdges,
        updatedAt: new Date().toISOString(),
      },
      selectedNodeId: null,
    });
  },

  // Duplicate node
  duplicateNode: (nodeId) => {
    const { workflow, pushToHistory } = get();
    if (!workflow) return;

    const node = workflow.nodes.find((n) => n.id === nodeId);
    if (!node) return;

    const newNode: WorkflowNode = {
      ...node,
      id: generateId(),
      label: `${node.label} (copy)`,
      position: {
        x: node.position.x + 50,
        y: node.position.y + 50,
      },
    };

    pushToHistory();
    set({
      workflow: {
        ...workflow,
        nodes: [...workflow.nodes, newNode],
        updatedAt: new Date().toISOString(),
      },
      selectedNodeId: newNode.id,
    });
  },

  // Select edge
  selectEdge: (edgeId) => {
    set({ selectedEdgeId: edgeId, selectedNodeId: null });
  },

  // Add edge
  addEdge: (source, target, sourceHandle, label) => {
    const { workflow, pushToHistory } = get();
    if (!workflow) return;

    // Check if edge already exists
    const exists = workflow.edges.some(
      (e) =>
        e.source === source &&
        e.target === target &&
        e.sourceHandle === sourceHandle
    );
    if (exists) return;

    // Prevent self-loops
    if (source === target) return;

    const newEdge: WorkflowEdge = {
      id: generateId(),
      source,
      target,
      sourceHandle,
      label,
    };

    pushToHistory();
    set({
      workflow: {
        ...workflow,
        edges: [...workflow.edges, newEdge],
        updatedAt: new Date().toISOString(),
      },
    });
  },

  // Update edge
  updateEdge: (edgeId, updates) => {
    const { workflow, pushToHistory } = get();
    if (!workflow) return;

    const newEdges = workflow.edges.map((edge) =>
      edge.id === edgeId ? { ...edge, ...updates } : edge
    );

    pushToHistory();
    set({
      workflow: {
        ...workflow,
        edges: newEdges,
        updatedAt: new Date().toISOString(),
      },
    });
  },

  // Remove edge
  removeEdge: (edgeId) => {
    const { workflow, pushToHistory } = get();
    if (!workflow) return;

    const newEdges = workflow.edges.filter((e) => e.id !== edgeId);

    pushToHistory();
    set({
      workflow: {
        ...workflow,
        edges: newEdges,
        updatedAt: new Date().toISOString(),
      },
      selectedEdgeId: null,
    });
  },

  // Connection handling
  startConnection: (nodeId) => {
    set({ isConnecting: true, connectionStart: nodeId });
  },

  completeConnection: (nodeId) => {
    const { connectionStart, addEdge } = get();
    if (connectionStart && connectionStart !== nodeId) {
      addEdge(connectionStart, nodeId);
    }
    set({ isConnecting: false, connectionStart: null });
  },

  cancelConnection: () => {
    set({ isConnecting: false, connectionStart: null });
  },

  // Update viewport
  updateViewport: (viewport) => {
    const { workflow } = get();
    if (!workflow) return;

    set({
      workflow: {
        ...workflow,
        viewport: { ...workflow.viewport, ...viewport },
      },
    });
  },

  // Set dragging state
  setIsDragging: (isDragging) => {
    set({ isDragging });
  },

  // Push current state to history
  pushToHistory: () => {
    const { workflow, history, historyIndex } = get();
    if (!workflow) return;

    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(JSON.parse(JSON.stringify(workflow)));

    set({
      history: newHistory,
      historyIndex: newHistory.length - 1,
    });
  },

  // Undo
  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex > 0) {
      set({
        workflow: JSON.parse(JSON.stringify(history[historyIndex - 1])),
        historyIndex: historyIndex - 1,
        selectedNodeId: null,
        selectedEdgeId: null,
      });
    }
  },

  // Redo
  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex < history.length - 1) {
      set({
        workflow: JSON.parse(JSON.stringify(history[historyIndex + 1])),
        historyIndex: historyIndex + 1,
        selectedNodeId: null,
        selectedEdgeId: null,
      });
    }
  },

  // Can undo
  canUndo: () => {
    const { historyIndex } = get();
    return historyIndex > 0;
  },

  // Can redo
  canRedo: () => {
    const { history, historyIndex } = get();
    return historyIndex < history.length - 1;
  },

  // Save workflow
  saveWorkflow: async () => {
    const { workflow } = get();
    if (!workflow) return;

    set({ isSaving: true });

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const workflowData = {
        user_id: user.id,
        name: workflow.name,
        description: workflow.description,
        category: workflow.category,
        nodes: workflow.nodes,
        edges: workflow.edges,
        viewport: workflow.viewport,
        is_published: workflow.isPublished,
        is_active: workflow.isActive,
        trigger_config: workflow.triggerConfig,
        tags: workflow.tags,
      };

      // Check if workflow exists
      const { data: existing } = await supabase
        .from("workflows")
        .select("id")
        .eq("id", workflow.id)
        .single();

      if (existing) {
        // Update existing
        const { error } = await supabase
          .from("workflows")
          .update(workflowData)
          .eq("id", workflow.id);

        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from("workflows")
          .insert({ ...workflowData, id: workflow.id });

        if (error) throw error;
      }

      toast.success("Workflow saved");
    } catch (error) {
      console.error("Failed to save workflow:", error);
      toast.error("Failed to save workflow");
      throw error;
    } finally {
      set({ isSaving: false });
    }
  },

  // Publish workflow
  publishWorkflow: async () => {
    const { workflow, saveWorkflow } = get();
    if (!workflow) return;

    set({
      workflow: {
        ...workflow,
        isPublished: true,
        updatedAt: new Date().toISOString(),
      },
    });

    await saveWorkflow();
    toast.success("Workflow published");
  },

  // Activate/deactivate workflow
  activateWorkflow: async (active) => {
    const { workflow, saveWorkflow } = get();
    if (!workflow) return;

    set({
      workflow: {
        ...workflow,
        isActive: active,
        updatedAt: new Date().toISOString(),
      },
    });

    await saveWorkflow();
    toast.success(active ? "Workflow activated" : "Workflow deactivated");
  },

  // Execute workflow manually
  executeWorkflow: async (triggerData = {}) => {
    const { workflow } = get();
    if (!workflow) throw new Error("No workflow loaded");

    set({ isExecuting: true });

    try {
      const { data, error } = await supabase.rpc("start_workflow_execution", {
        p_workflow_id: workflow.id,
        p_trigger_type: "manual",
        p_trigger_data: triggerData,
      });

      if (error) throw error;

      toast.success("Workflow execution started");
      return data as string;
    } catch (error) {
      console.error("Failed to execute workflow:", error);
      toast.error("Failed to execute workflow");
      throw error;
    } finally {
      set({ isExecuting: false });
    }
  },

  // Update workflow metadata
  updateWorkflowMeta: (meta) => {
    const { workflow, pushToHistory } = get();
    if (!workflow) return;

    pushToHistory();
    set({
      workflow: {
        ...workflow,
        ...meta,
        updatedAt: new Date().toISOString(),
      },
    });
  },

  // Reset builder
  resetBuilder: () => {
    set({
      workflow: null,
      selectedNodeId: null,
      selectedEdgeId: null,
      isDragging: false,
      isConnecting: false,
      connectionStart: null,
      history: [],
      historyIndex: -1,
      isSaving: false,
      isExecuting: false,
    });
  },
}));
