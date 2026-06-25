/**
 * Team / Organization management page.
 *
 * Shows the user's team (creating one if none), its members and roles, an
 * invite form, and aggregate team stats. Owners/admins can invite, remove,
 * and change roles.
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, UserPlus, Trash2, Users, Crown, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/useAuthStore';
import { edgeFunctions } from '@/lib/edgeFunctions';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LeadRoutingRules } from '@/components/settings/LeadRoutingRules';

interface Team {
  id: string;
  name: string;
  owner_id: string;
  max_seats: number;
}
interface TeamMember {
  id: string;
  user_id: string | null;
  email: string | null;
  role: 'owner' | 'admin' | 'member';
  accepted_at: string | null;
}

// teams/team_members aren't in the generated types — isolated cast.
const db = supabase as unknown as {
  from: (t: string) => {
    select: (c: string) => {
      eq: (
        c: string,
        v: string
      ) => {
        order?: (c: string, o: { ascending: boolean }) => Promise<{ data: TeamMember[] | null }>;
        maybeSingle: () => Promise<{ data: Team | null }>;
      };
    };
  };
};

export default function TeamPage() {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [teamName, setTeamName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');

  const { data: team, isLoading: teamLoading } = useQuery({
    queryKey: ['my-team', user?.id],
    enabled: !!user?.id,
    queryFn: async (): Promise<Team | null> => {
      const { data } = await db.from('teams').select('*').eq('owner_id', user!.id).maybeSingle();
      return data;
    },
  });

  const { data: members } = useQuery({
    queryKey: ['team-members', team?.id],
    enabled: !!team?.id,
    queryFn: async (): Promise<TeamMember[]> => {
      const res = await db
        .from('team_members')
        .select('id, user_id, email, role, accepted_at')
        .eq('team_id', team!.id);
      // order() is optional in our cast; call when present.
      const out = res.order ? await res.order('invited_at', { ascending: true }) : { data: [] };
      return out.data ?? [];
    },
  });

  const createTeam = useMutation({
    mutationFn: async (name: string) => {
      const { error } = await edgeFunctions.invoke('teams', { body: { action: 'create', name } });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-team', user?.id] });
      toast({ title: 'Team created' });
    },
    onError: (e) => toast({ title: 'Error', description: String(e), variant: 'destructive' }),
  });

  const invite = useMutation({
    mutationFn: async (email: string) => {
      const { error } = await edgeFunctions.invoke('teams', {
        body: { action: 'invite', teamId: team!.id, email },
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      setInviteEmail('');
      queryClient.invalidateQueries({ queryKey: ['team-members', team?.id] });
      toast({ title: 'Invitation sent' });
    },
    onError: (e) =>
      toast({
        title: 'Error',
        description: e instanceof Error ? e.message : String(e),
        variant: 'destructive',
      }),
  });

  const removeMember = useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await edgeFunctions.invoke('teams', {
        body: { action: 'remove', teamId: team!.id, memberId },
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members', team?.id] });
      toast({ title: 'Member removed' });
    },
  });

  if (teamLoading) {
    return (
      <div className="flex items-center justify-center p-12 text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading…
      </div>
    );
  }

  // No team yet → creation prompt.
  if (!team) {
    return (
      <div className="mx-auto max-w-lg space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Team</h1>
          <p className="text-muted-foreground">
            Create a team to collaborate and manage multi-seat billing.
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Create your team</CardTitle>
            <CardDescription>You'll be the owner and can invite agents.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 sm:flex-row">
            <Input
              placeholder="Team name (e.g. Acme Realty)"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
            />
            <Button
              onClick={() => createTeam.mutate(teamName.trim())}
              disabled={!teamName.trim() || createTeam.isPending}
            >
              {createTeam.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Team'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const memberList = members ?? [];
  const acceptedCount = memberList.filter((m) => m.accepted_at).length;

  const roleIcon = (role: string) =>
    role === 'owner' ? (
      <Crown className="h-4 w-4 text-amber-500" />
    ) : role === 'admin' ? (
      <Shield className="h-4 w-4 text-blue-500" />
    ) : (
      <Users className="h-4 w-4 text-muted-foreground" />
    );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{team.name}</h1>
        <p className="text-muted-foreground">
          {acceptedCount} active · {memberList.length}/{team.max_seats} seats used
        </p>
      </div>

      {/* Invite */}
      <Card>
        <CardHeader>
          <CardTitle>Invite a member</CardTitle>
          <CardDescription>They'll join your team once they accept.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 sm:flex-row">
          <Input
            type="email"
            placeholder="agent@example.com"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
          />
          <Button
            onClick={() => invite.mutate(inviteEmail.trim())}
            disabled={!inviteEmail.trim() || invite.isPending}
          >
            {invite.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <UserPlus className="mr-2 h-4 w-4" />
            )}
            Invite
          </Button>
        </CardContent>
      </Card>

      {/* Members */}
      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="divide-y divide-border">
            {memberList.map((m) => (
              <li key={m.id} className="flex items-center justify-between gap-3 py-3">
                <div className="flex items-center gap-3">
                  {roleIcon(m.role)}
                  <div>
                    <div className="font-medium text-foreground">{m.email ?? m.user_id}</div>
                    <div className="text-xs capitalize text-muted-foreground">
                      {m.role}
                      {!m.accepted_at && ' · pending'}
                    </div>
                  </div>
                </div>
                {m.role !== 'owner' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:bg-red-50"
                    onClick={() => removeMember.mutate(m.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Lead routing rules */}
      <LeadRoutingRules teamId={team.id} members={memberList} />
    </div>
  );
}
