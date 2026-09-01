/**
 * useLeadRouting — manage a team's lead auto-assignment rules.
 *
 * Rules are evaluated server-side (BEFORE INSERT trigger) by priority; this
 * hook is the CRUD surface for the management UI.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database, Json } from '@/integrations/supabase/types';

type RoutingRuleRow = Database['public']['Tables']['lead_routing_rules']['Row'];

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

/**
 * `criteria` is stored as jsonb, so the generated type is `Json`. Narrow it
 * here, at the one place rows enter the app, rather than casting the client:
 * lead_routing_rules is in the generated types, so the old
 * `supabase as unknown as {...}` shim was asserting a shape over a table
 * TypeScript could already describe — and silently disabling every check on
 * these queries (US-094).
 */
const toRule = (row: RoutingRuleRow): LeadRoutingRule => ({
  ...row,
  criteria: (row.criteria ?? {}) as RoutingCriteria,
});

export function useLeadRouting(teamId: string | undefined) {
  const queryClient = useQueryClient();

  const rules = useQuery({
    queryKey: ['lead-routing-rules', teamId],
    enabled: !!teamId,
    queryFn: async (): Promise<LeadRoutingRule[]> => {
      const { data, error } = await supabase
        .from('lead_routing_rules')
        .select('*')
        .eq('team_id', teamId!)
        .order('priority', { ascending: true });
      if (error) throw error;
      return (data ?? []).map(toRule);
    },
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['lead-routing-rules', teamId] });

  const createRule = useMutation({
    mutationFn: async (rule: NewRoutingRule) => {
      if (!teamId) throw new Error('No team selected');
      const { error } = await supabase
        .from('lead_routing_rules')
        .insert({ ...rule, team_id: teamId, criteria: rule.criteria as Json });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const toggleRule = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('lead_routing_rules')
        .update({ is_active })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const deleteRule = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('lead_routing_rules').delete().eq('id', id);
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
