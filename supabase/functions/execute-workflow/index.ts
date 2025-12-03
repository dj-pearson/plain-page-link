import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import { getCorsHeaders } from '../_shared/cors.ts';
import { requireAuth, getClientIP } from '../_shared/auth.ts';

/**
 * Execute Workflow - Multi-Step Workflow Orchestration
 * Processes workflow nodes sequentially with state management
 */

interface WorkflowNode {
  id: string;
  type: string;
  subtype: string;
  label: string;
  config: Record<string, any>;
  outputs?: string[];
}

interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  label?: string;
}

interface ExecutionContext {
  variables: Record<string, any>;
  triggerData: Record<string, any>;
  results: Record<string, any>;
}

// Node Executors
const nodeExecutors: Record<string, (node: WorkflowNode, context: ExecutionContext, supabase: any) => Promise<any>> = {
  // Actions
  send_email: async (node, context, supabase) => {
    const { to, subject, body, template } = node.config;
    const resolvedTo = resolveVariables(to, context);
    const resolvedSubject = resolveVariables(subject, context);
    const resolvedBody = resolveVariables(body, context);

    console.log(`Sending email to ${resolvedTo}: ${resolvedSubject}`);

    // In production, this would integrate with an email service
    // For now, log the action
    return {
      success: true,
      to: resolvedTo,
      subject: resolvedSubject,
      sentAt: new Date().toISOString(),
    };
  },

  send_sms: async (node, context) => {
    const { to, message } = node.config;
    const resolvedTo = resolveVariables(to, context);
    const resolvedMessage = resolveVariables(message, context);

    console.log(`Sending SMS to ${resolvedTo}: ${resolvedMessage}`);

    return {
      success: true,
      to: resolvedTo,
      sentAt: new Date().toISOString(),
    };
  },

  update_lead: async (node, context, supabase) => {
    const { leadId, status, score, notes } = node.config;
    const resolvedLeadId = resolveVariables(leadId || '{{lead.id}}', context);

    const updates: Record<string, any> = {};
    if (status) updates.status = status;
    if (score) updates.score = score;
    if (notes) updates.notes = notes;

    if (resolvedLeadId && Object.keys(updates).length > 0) {
      const { error } = await supabase
        .from('leads')
        .update(updates)
        .eq('id', resolvedLeadId);

      if (error) throw error;
    }

    return { success: true, leadId: resolvedLeadId, updates };
  },

  create_task: async (node, context, supabase) => {
    const { title, dueDate, assignee } = node.config;
    const resolvedTitle = resolveVariables(title, context);

    console.log(`Creating task: ${resolvedTitle}`);

    return {
      success: true,
      taskId: crypto.randomUUID(),
      title: resolvedTitle,
      dueDate,
      assignee,
    };
  },

  webhook_call: async (node, context) => {
    const { url, method, headers, body } = node.config;
    const resolvedUrl = resolveVariables(url, context);
    const resolvedBody = body ? resolveVariables(JSON.stringify(body), context) : undefined;

    try {
      const response = await fetch(resolvedUrl, {
        method: method || 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: resolvedBody,
      });

      const responseData = await response.json().catch(() => null);

      return {
        success: response.ok,
        status: response.status,
        data: responseData,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Request failed',
      };
    }
  },

  add_tag: async (node, context, supabase) => {
    const { recordType, recordId, tag } = node.config;
    const resolvedRecordId = resolveVariables(recordId, context);
    const resolvedTag = resolveVariables(tag, context);

    console.log(`Adding tag "${resolvedTag}" to ${recordType} ${resolvedRecordId}`);

    return { success: true, recordId: resolvedRecordId, tag: resolvedTag };
  },

  // Delays
  wait: async (node) => {
    const { duration, unit } = node.config;

    const milliseconds = {
      minutes: duration * 60 * 1000,
      hours: duration * 60 * 60 * 1000,
      days: duration * 24 * 60 * 60 * 1000,
    }[unit] || duration * 1000;

    // For testing, we'll use a short delay
    // In production, this would schedule the next step
    const actualDelay = Math.min(milliseconds, 5000); // Max 5s for testing
    await new Promise(resolve => setTimeout(resolve, actualDelay));

    return { success: true, duration, unit, actualDelayMs: actualDelay };
  },

  // Conditions
  if_else: async (node, context) => {
    const { field, operator, value } = node.config;
    const fieldValue = resolveVariables(field, context);
    const compareValue = resolveVariables(value, context);

    let result = false;

    switch (operator) {
      case 'equals':
        result = fieldValue === compareValue;
        break;
      case 'not_equals':
        result = fieldValue !== compareValue;
        break;
      case 'greater_than':
        result = Number(fieldValue) > Number(compareValue);
        break;
      case 'less_than':
        result = Number(fieldValue) < Number(compareValue);
        break;
      case 'contains':
        result = String(fieldValue).includes(String(compareValue));
        break;
      case 'not_contains':
        result = !String(fieldValue).includes(String(compareValue));
        break;
    }

    return { result, field: fieldValue, operator, value: compareValue };
  },

  // Transform
  set_variable: async (node, context) => {
    const { name, value } = node.config;
    const resolvedValue = resolveVariables(value, context);
    context.variables[name] = resolvedValue;

    return { success: true, name, value: resolvedValue };
  },

  format_data: async (node, context) => {
    const { template } = node.config;
    const result = resolveVariables(template, context);

    return { success: true, result };
  },

  // Triggers (just return trigger data)
  manual: async (_, context) => context.triggerData,
  schedule: async (_, context) => context.triggerData,
  webhook: async (_, context) => context.triggerData,
  lead_created: async (_, context) => context.triggerData,
  lead_updated: async (_, context) => context.triggerData,
  listing_created: async (_, context) => context.triggerData,
  listing_updated: async (_, context) => context.triggerData,
};

// Resolve variables in template strings
function resolveVariables(template: string, context: ExecutionContext): any {
  if (typeof template !== 'string') return template;

  return template.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
    const parts = path.trim().split('.');
    let value: any = {
      ...context.variables,
      ...context.triggerData,
      results: context.results,
    };

    for (const part of parts) {
      if (value === undefined || value === null) return match;
      value = value[part];
    }

    return value !== undefined && value !== null ? String(value) : match;
  });
}

// Find next nodes to execute
function getNextNodes(
  currentNodeId: string,
  edges: WorkflowEdge[],
  conditionResult?: boolean
): string[] {
  return edges
    .filter((edge) => {
      if (edge.source !== currentNodeId) return false;

      // For condition nodes, filter by handle
      if (conditionResult !== undefined) {
        if (conditionResult && edge.sourceHandle === 'true') return true;
        if (!conditionResult && edge.sourceHandle === 'false') return true;
        if (!edge.sourceHandle) return true; // Default path
        return false;
      }

      return true;
    })
    .map((edge) => edge.target);
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get('origin'));

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') as string;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const user = await requireAuth(req, supabase);
    const { executionId } = await req.json();

    if (!executionId) {
      throw new Error('Execution ID is required');
    }

    // Get execution record
    const { data: execution, error: execError } = await supabase
      .from('workflow_executions')
      .select('*, workflows(*)')
      .eq('id', executionId)
      .single();

    if (execError || !execution) {
      throw new Error('Execution not found');
    }

    const workflow = execution.workflows;
    const nodes: WorkflowNode[] = workflow.nodes || [];
    const edges: WorkflowEdge[] = workflow.edges || [];

    // Initialize context
    const context: ExecutionContext = {
      variables: execution.variables || {},
      triggerData: execution.trigger_data || {},
      results: {},
    };

    // Find trigger node (starting point)
    const triggerNode = nodes.find((n) => n.type === 'trigger');
    if (!triggerNode) {
      throw new Error('Workflow has no trigger node');
    }

    // Update execution as running
    await supabase
      .from('workflow_executions')
      .update({
        status: 'running',
        started_at: new Date().toISOString(),
      })
      .eq('id', executionId);

    // Execute nodes in sequence
    const completedNodes: string[] = [];
    const nodeQueue: string[] = [triggerNode.id];

    while (nodeQueue.length > 0) {
      const currentNodeId = nodeQueue.shift()!;
      const currentNode = nodes.find((n) => n.id === currentNodeId);

      if (!currentNode || completedNodes.includes(currentNodeId)) {
        continue;
      }

      // Update current node
      await supabase
        .from('workflow_executions')
        .update({ current_node_id: currentNodeId })
        .eq('id', executionId);

      // Create step record
      const { data: step } = await supabase
        .from('workflow_execution_steps')
        .insert({
          execution_id: executionId,
          node_id: currentNodeId,
          node_type: currentNode.type,
          node_name: currentNode.label,
          status: 'running',
          input_data: currentNode.config,
          started_at: new Date().toISOString(),
        })
        .select()
        .single();

      try {
        // Execute node
        const executor = nodeExecutors[currentNode.subtype];
        let result: any;

        if (executor) {
          result = await executor(currentNode, context, supabase);
        } else {
          result = { warning: `No executor for ${currentNode.subtype}` };
        }

        // Store result
        context.results[currentNodeId] = result;

        // Update step as completed
        await supabase
          .from('workflow_execution_steps')
          .update({
            status: 'completed',
            output_data: result,
            completed_at: new Date().toISOString(),
            duration_ms: step ? Date.now() - new Date(step.started_at).getTime() : 0,
          })
          .eq('id', step?.id);

        completedNodes.push(currentNodeId);

        // Determine next nodes
        const conditionResult = currentNode.type === 'condition' ? result.result : undefined;
        const nextNodeIds = getNextNodes(currentNodeId, edges, conditionResult);

        for (const nextId of nextNodeIds) {
          if (!completedNodes.includes(nextId) && !nodeQueue.includes(nextId)) {
            nodeQueue.push(nextId);
          }
        }
      } catch (nodeError) {
        // Update step as failed
        await supabase
          .from('workflow_execution_steps')
          .update({
            status: 'failed',
            error_message: nodeError instanceof Error ? nodeError.message : 'Unknown error',
            completed_at: new Date().toISOString(),
          })
          .eq('id', step?.id);

        // Update execution as failed
        await supabase
          .from('workflow_executions')
          .update({
            status: 'failed',
            error_message: nodeError instanceof Error ? nodeError.message : 'Unknown error',
            error_node_id: currentNodeId,
            completed_at: new Date().toISOString(),
          })
          .eq('id', executionId);

        throw nodeError;
      }
    }

    // Update execution as completed
    const { error: completeError } = await supabase
      .from('workflow_executions')
      .update({
        status: 'completed',
        completed_nodes: completedNodes,
        context,
        result: context.results,
        completed_at: new Date().toISOString(),
      })
      .eq('id', executionId);

    if (completeError) {
      console.error('Error completing execution:', completeError);
    }

    // Update workflow stats
    await supabase.rpc('complete_workflow_execution', {
      p_execution_id: executionId,
      p_status: 'completed',
      p_result: context.results,
    });

    return new Response(
      JSON.stringify({
        success: true,
        executionId,
        status: 'completed',
        completedNodes: completedNodes.length,
        results: context.results,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An error occurred';
    console.error('Workflow Execution Error:', message);

    return new Response(
      JSON.stringify({ error: message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
