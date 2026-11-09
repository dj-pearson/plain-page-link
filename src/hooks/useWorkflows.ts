/**
 * The agent's workflow list, and the two actions the list offers on a row.
 *
 * US-266: the list used to live in the builder store, which logged a failed
 * load and returned [] — so a network blip read as "No workflows yet" and
 * invited the agent to rebuild what they already had. Its Duplicate and Delete
 * menu items had no handler at all. The list now throws on failure (the page
 * shows a retry), and both actions write to the database.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { toastSaveError } from '@/lib/planLimitToast';
import { useAuthStore } from '@/stores/useAuthStore';
import { rowToWorkflow } from '@/stores/useWorkflowBuilderStore';
import { PLAN_USAGE_QUERY_KEY } from '@/hooks/usePlanUsage';
import type { Database } from '@/integrations/supabase/types';
import type { Workflow } from '@/types/workflow';

type WorkflowRow = Database['public']['Tables']['workflows']['Row'];
type WorkflowInsert = Database['public']['Tables']['workflows']['Insert'];

export const WORKFLOWS_QUERY_KEY = ['workflows'] as const;

/**
 * The insert for a copy of a workflow.
 *
 * A copy is a draft: never active (switching one on is metered against the
 * plan, and a second live copy of a sequence would double every step) and
 * never published. Run counters, version and timestamps start fresh; the id is
 * left to the database.
 */
export function buildWorkflowCopy(row: WorkflowRow): WorkflowInsert {
  return {
    user_id: row.user_id,
    name: `${row.name} (copy)`,
    description: row.description,
    category: row.category,
    nodes: row.nodes,
    edges: row.edges,
    viewport: row.viewport,
    trigger_config: row.trigger_config,
    tags: row.tags,
    is_active: false,
    is_published: false,
  };
}

export function useWorkflows() {
  const userId = useAuthStore((s) => s.user?.id);
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [...WORKFLOWS_QUERY_KEY, userId],
    enabled: !!userId,
    queryFn: async (): Promise<Workflow[]> => {
      const { data, error } = await supabase
        .from('workflows')
        .select('*')
        .eq('user_id', userId!)
        .order('updated_at', { ascending: false });
      if (error) {
        logger.error('Failed to load workflows', error);
        throw error;
      }
      return (data ?? []).map(rowToWorkflow);
    },
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: WORKFLOWS_QUERY_KEY });
    // Deleting an active workflow frees a slot in the plan's allowance.
    queryClient.invalidateQueries({ queryKey: PLAN_USAGE_QUERY_KEY });
  };

  const deleteWorkflow = useMutation({
    mutationFn: async (workflowId: string) => {
      const { data, error } = await supabase
        .from('workflows')
        .delete()
        .eq('id', workflowId)
        .select('id');
      if (error) throw error;
      // RLS filters rather than refuses: zero rows back means nothing went.
      if (!data || data.length === 0) throw new Error('Workflow not found');
    },
    onSuccess: () => {
      invalidate();
      toast.success('Workflow deleted');
    },
    onError: (error) => {
      logger.error('Failed to delete workflow', error);
      toast.error('Could not delete the workflow. Please try again.');
    },
  });

  const duplicateWorkflow = useMutation({
    mutationFn: async (workflowId: string): Promise<string> => {
      const { data: source, error: readError } = await supabase
        .from('workflows')
        .select('*')
        .eq('id', workflowId)
        .single();
      if (readError) throw readError;

      const { data, error } = await supabase
        .from('workflows')
        .insert(buildWorkflowCopy(source))
        .select('id')
        .single();
      if (error) throw error;
      return data.id;
    },
    onSuccess: () => {
      invalidate();
      toast.success('Copy created as a draft');
    },
    onError: (error) => {
      logger.error('Failed to duplicate workflow', error);
      toastSaveError(error, 'Could not duplicate the workflow. Please try again.');
    },
  });

  return {
    workflows: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    isRefetching: query.isRefetching,
    deleteWorkflow,
    duplicateWorkflow,
  };
}
