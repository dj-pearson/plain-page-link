/**
 * useLeadRouting — manage a team's lead auto-assignment rules.
 *
 * Rules are evaluated server-side (BEFORE INSERT trigger) by priority; this
 * hook is the CRUD surface for the management UI.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface RoutingCriteria {
  lead_type?: string;
  source?: string;
  zip?: string;
  price_min?: number;
  price_max?: number;
}

export interface LeadRoutingRule {
  id: string;
  team_id: string;
  name: string;
  criteria: RoutingCriteria;
  assigned_to: string | null;
  is_active: boolean;
  priority: number;
  created_at: string;
}

export interface NewRoutingRule {
  name: string;
  criteria: RoutingCriteria;
  assigned_to: string | null;
  priority: number;
}

// lead_routing_rules isn't in the generated types — isolated cast.
const routingDb = supabase as unknown as {
  from: (t: string) => {
    select: (c: string) => {
      eq: (
        c: string,
        v: string
      ) => {
        order: (
          c: string,
          o: { ascending: boolean }
        ) => Promise<{ data: LeadRoutingRule[] | null; error: unknown }>;
      };
    };
    insert: (v: Record<string, unknown>) => Promise<{ error: unknown }>;
    update: (v: Record<string, unknown>) => {
      eq: (c: string, v: string) => Promise<{ error: unknown }>;
    };
    delete: () => { eq: (c: string, v: string) => Promise<{ error: unknown }> };
  };
};

export function useLeadRouting(teamId: string | undefined) {
  const queryClient = useQueryClient();

  const rules = useQuery({
    queryKey: ['lead-routing-rules', teamId],
    enabled: !!teamId,
    queryFn: async (): Promise<LeadRoutingRule[]> => {
      const { data, error } = await routingDb
        .from('lead_routing_rules')
        .select('*')
        .eq('team_id', teamId!)
        .order('priority', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['lead-routing-rules', teamId] });

  const createRule = useMutation({
    mutationFn: async (rule: NewRoutingRule) => {
      const { error } = await routingDb
        .from('lead_routing_rules')
        .insert({ ...rule, team_id: teamId });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const toggleRule = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await routingDb
        .from('lead_routing_rules')
        .update({ is_active })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const deleteRule = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await routingDb.from('lead_routing_rules').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return {
    rules: rules.data ?? [],
    isLoading: rules.isLoading,
    createRule,
    toggleRule,
    deleteRule,
  };
}
