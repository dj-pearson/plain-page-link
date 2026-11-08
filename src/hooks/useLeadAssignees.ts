import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/useAuthStore';
import { assigneeLabel, type TeamAssignee } from '@/lib/leadAssignee';

export interface LeadAssigneeRoster {
  /** The team the viewer owns, or null when they own none. */
  teamId: string | null;
  /** Its accepted members other than the owner: who a lead can be handed to. */
  assignees: TeamAssignee[];
}

/**
 * The people the signed-in owner can assign a lead to (US-497).
 *
 * Only a team the viewer OWNS counts: leads belong to the owner (leads.user_id),
 * and an admin or member of someone else's team has no leads of that team to
 * hand out. Pending invitations are left out — guard_lead_assignee
 * (20261108000497) refuses anyone who has not accepted, and so does routing.
 * The owner reads their own teams row and roster under the existing policies
 * ("Team members read team", "Members read roster" via is_team_admin).
 */
export function useLeadAssignees() {
  const userId = useAuthStore((s) => s.user?.id ?? null);

  const query = useQuery({
    queryKey: ['lead-assignees', userId],
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<LeadAssigneeRoster> => {
      const { data: team, error } = await supabase
        .from('teams')
        .select('id')
        .eq('owner_id', userId!)
        .maybeSingle();
      if (error) throw error;
      if (!team) return { teamId: null, assignees: [] };

      const { data: members, error: membersError } = await supabase
        .from('team_members')
        .select('user_id, email')
        .eq('team_id', team.id)
        .not('accepted_at', 'is', null)
        .not('user_id', 'is', null)
        .order('accepted_at', { ascending: true });
      if (membersError) throw membersError;

      const assignees = (members ?? [])
        .filter((m): m is { user_id: string; email: string | null } => !!m.user_id)
        .filter((m) => m.user_id !== userId)
        .map((m) => ({ userId: m.user_id, label: assigneeLabel(m) }));
      return { teamId: team.id, assignees };
    },
  });

  return {
    teamId: query.data?.teamId ?? null,
    assignees: query.data?.assignees ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
