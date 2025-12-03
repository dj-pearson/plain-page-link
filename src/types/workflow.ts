/**
 * Workflow Builder Types
 * Type definitions for the visual workflow builder
 */

export type WorkflowNodeType =
  | 'trigger'
  | 'action'
  | 'condition'
  | 'delay'
  | 'loop'
  | 'transform';

export type WorkflowTriggerSubtype =
  | 'manual'
  | 'schedule'
  | 'webhook'
  | 'lead_created'
  | 'lead_updated'
  | 'lead_status_changed'
  | 'listing_created'
  | 'listing_updated'
  | 'listing_sold'
  | 'form_submitted'
  | 'page_viewed'
  | 'link_clicked'
  | 'email_opened'
  | 'email_clicked';

export type WorkflowActionSubtype =
  | 'send_email'
  | 'send_sms'
  | 'update_lead'
  | 'create_task'
  | 'webhook_call'
  | 'add_tag'
  | 'remove_tag'
  | 'assign_lead'
  | 'update_listing';

export type WorkflowConditionSubtype =
  | 'if_else'
  | 'switch'
  | 'filter';

export type WorkflowDelaySubtype =
  | 'wait'
  | 'wait_until';

export type WorkflowLoopSubtype =
  | 'for_each';

export type WorkflowTransformSubtype =
  | 'set_variable'
  | 'format_data';

export interface WorkflowNodePosition {
  x: number;
  y: number;
}

export interface WorkflowNode {
  id: string;
  type: WorkflowNodeType;
  subtype: string;
  label: string;
  description?: string;
  position: WorkflowNodePosition;
  config: Record<string, any>;
  outputs?: string[]; // For conditions with multiple outputs
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string; // For conditions: 'true' | 'false'
  label?: string;
}

export interface WorkflowViewport {
  x: number;
  y: number;
  zoom: number;
}

export interface WorkflowTriggerConfig {
  type: WorkflowTriggerSubtype;
  config: Record<string, any>;
}

export interface Workflow {
  id: string;
  userId: string;
  name: string;
  description?: string;
  category: WorkflowCategory;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  viewport: WorkflowViewport;
  isPublished: boolean;
  isActive: boolean;
  triggerConfig?: WorkflowTriggerConfig;
  version: number;
  executionCount: number;
  successCount: number;
  failureCount: number;
  lastExecutedAt?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export type WorkflowCategory =
  | 'lead_management'
  | 'listing_automation'
  | 'marketing'
  | 'notifications'
  | 'integrations'
  | 'general';

export interface WorkflowNodeTemplate {
  id: string;
  type: WorkflowNodeType;
  subtype: string;
  name: string;
  description?: string;
  icon: string;
  category: string;
  configSchema: Record<string, any>;
  defaultConfig: Record<string, any>;
  color: string;
  isPremium?: boolean;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  userId: string;
  workflowVersion: number;
  status: WorkflowExecutionStatus;
  triggerType: string;
  triggerData: Record<string, any>;
  context: Record<string, any>;
  variables: Record<string, any>;
  currentNodeId?: string;
  completedNodes: string[];
  startedAt?: string;
  completedAt?: string;
  timeoutAt?: string;
  result?: Record<string, any>;
  errorMessage?: string;
  errorNodeId?: string;
  createdAt: string;
}

export type WorkflowExecutionStatus =
  | 'pending'
  | 'running'
  | 'paused'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'timeout';

export interface WorkflowExecutionStep {
  id: string;
  executionId: string;
  nodeId: string;
  nodeType: string;
  nodeName?: string;
  status: WorkflowStepStatus;
  inputData: Record<string, any>;
  outputData: Record<string, any>;
  startedAt?: string;
  completedAt?: string;
  durationMs?: number;
  errorMessage?: string;
  errorDetails?: Record<string, any>;
  retryCount: number;
  maxRetries: number;
  createdAt: string;
}

export type WorkflowStepStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'skipped'
  | 'waiting';

export interface WorkflowTemplate {
  id: string;
  name: string;
  description?: string;
  category: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  triggerConfig?: WorkflowTriggerConfig;
  icon?: string;
  previewImageUrl?: string;
  useCount: number;
  rating: number;
  ratingCount: number;
  isPublic: boolean;
  isPremium: boolean;
  tags: string[];
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

// UI-specific types
export interface DraggedNodeData {
  type: WorkflowNodeType;
  subtype: string;
  template: WorkflowNodeTemplate;
}

export interface WorkflowBuilderState {
  workflow: Workflow | null;
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  isDragging: boolean;
  isPanningEnabled: boolean;
  isConnecting: boolean;
  connectionStart: string | null;
  history: Workflow[];
  historyIndex: number;
  isSaving: boolean;
  isExecuting: boolean;
}

// Node configuration schemas (for form generation)
export const NODE_CONFIG_SCHEMAS: Record<string, Record<string, any>> = {
  send_email: {
    to: { type: 'string', label: 'To', required: true, placeholder: '{{lead.email}}' },
    subject: { type: 'string', label: 'Subject', required: true },
    body: { type: 'textarea', label: 'Body', required: true },
    template: { type: 'select', label: 'Template', options: [] },
  },
  send_sms: {
    to: { type: 'string', label: 'To', required: true, placeholder: '{{lead.phone}}' },
    message: { type: 'textarea', label: 'Message', required: true, maxLength: 160 },
  },
  update_lead: {
    status: { type: 'select', label: 'Status', options: ['new', 'contacted', 'qualified', 'converted', 'lost'] },
    score: { type: 'number', label: 'Score Adjustment' },
    notes: { type: 'textarea', label: 'Add Note' },
  },
  wait: {
    duration: { type: 'number', label: 'Duration', required: true, min: 1 },
    unit: { type: 'select', label: 'Unit', options: ['minutes', 'hours', 'days'], default: 'hours' },
  },
  if_else: {
    field: { type: 'string', label: 'Field', required: true, placeholder: '{{lead.score}}' },
    operator: { type: 'select', label: 'Operator', options: ['equals', 'not_equals', 'greater_than', 'less_than', 'contains', 'not_contains'] },
    value: { type: 'string', label: 'Value', required: true },
  },
  schedule: {
    cron: { type: 'string', label: 'Cron Expression', required: true, placeholder: '0 9 * * *' },
    timezone: { type: 'select', label: 'Timezone', options: [], default: 'America/New_York' },
  },
  webhook_call: {
    url: { type: 'string', label: 'URL', required: true },
    method: { type: 'select', label: 'Method', options: ['GET', 'POST', 'PUT', 'DELETE'], default: 'POST' },
    headers: { type: 'json', label: 'Headers' },
    body: { type: 'json', label: 'Body' },
  },
};
