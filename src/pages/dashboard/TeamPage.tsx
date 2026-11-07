/**
 * Team / Organization management page.
 *
 * Shows the user's team (creating one if none), its members and roles, an
 * invite form, and aggregate team stats. Owners/admins can invite, remove,
 * and change roles.
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  Loader2,
  RefreshCw,
  UserPlus,
  Trash2,
  Users,
  Crown,
  Shield,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/useAuthStore';
import { edgeFunctions } from '@/lib/edgeFunctions';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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

/** How a member is named in the list, the remove button and the confirmation. */
export function memberLabel(m: Pick<TeamMember, 'email' | 'user_id'>): string {
  return m.email ?? m.user_id ?? 'this member';
}

function LoadError({
  title,
  body,
  onRetry,
  retrying,
}: {
  title: string;
  body: string;
  onRetry: () => void;
  retrying: boolean;
}) {
  return (
    <div role="alert" className="py-6 text-center">
      <AlertCircle className="mx-auto h-8 w-8 text-destructive" aria-hidden="true" />
      <p className="mt-3 font-semibold text-foreground">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{body}</p>
      <Button variant="outline" className="mt-4 gap-2" onClick={onRetry} disabled={retrying}>
        <RefreshCw className={`h-4 w-4${retrying ? ' animate-spin' : ''}`} aria-hidden="true" />
        Try again
      </Button>
    </div>
  );
}

export default function TeamPage() {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [teamName, setTeamName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [removeTarget, setRemoveTarget] = useState<TeamMember | null>(null);

  // US-328: a failed load used to fall through to "Create your team", which
  // invited an owner to make a second team. Errors are now thrown and shown.
  const {
    data: team,
    isLoading: teamLoading,
    error: teamError,
    refetch: refetchTeam,
    isFetching: teamFetching,
  } = useQuery({
    queryKey: ['my-team', user?.id],
    enabled: !!user?.id,
    queryFn: async (): Promise<Team | null> => {
      const { data, error } = await supabase
        .from('teams')
        .select('id, name, owner_id, max_seats')
        .eq('owner_id', user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const {
    data: members,
    isLoading: membersLoading,
    error: membersError,
    refetch: refetchMembers,
    isFetching: membersFetching,
  } = useQuery({
    queryKey: ['team-members', team?.id],
    enabled: !!team?.id,
    queryFn: async (): Promise<TeamMember[]> => {
      const { data, error } = await supabase
        .from('team_members')
        .select('id, user_id, email, role, accepted_at')
        .eq('team_id', team!.id)
        .order('invited_at', { ascending: true });
      if (error) throw error;
      return (data ?? []) as TeamMember[];
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
      const { data, error } = await edgeFunctions.invoke('teams', {
        body: { action: 'invite', teamId: team!.id, email },
      });
      if (error) throw new Error(error.message);
      // US-226: the invite is emailed with an accept link now; say if it failed.
      return (data as { data?: { emailed?: boolean } } | null)?.data?.emailed !== false;
    },
    onSuccess: (emailed) => {
      setInviteEmail('');
      queryClient.invalidateQueries({ queryKey: ['team-members', team?.id] });
      toast(
        emailed
          ? {
              title: 'Invitation emailed',
              description: 'They join once they open the link and sign in.',
            }
          : {
              title: 'Invite saved, but the email did not send',
              description: 'Remove and re-invite them in a moment.',
              variant: 'destructive',
            }
      );
    },
    onError: (e) =>
      toast({
        title: 'Error',
        description: e instanceof Error ? e.message : String(e),
        variant: 'destructive',
      }),
  });

  const removeMember = useMutation({
    mutationFn: async (member: TeamMember) => {
      const { error } = await edgeFunctions.invoke('teams', {
        body: { action: 'remove', teamId: team!.id, memberId: member.id },
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: (_data, member) => {
      queryClient.invalidateQueries({ queryKey: ['team-members', team?.id] });
      toast({ title: `${memberLabel(member)} was removed from the team` });
    },
    onError: (e, member) =>
      toast({
        title: `Couldn’t remove ${memberLabel(member)}`,
        description: e instanceof Error ? e.message : 'Please try again.',
        variant: 'destructive',
      }),
  });

  if (teamLoading) {
    return (
      <div className="flex items-center justify-center p-12 text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading…
      </div>
    );
  }

  if (teamError) {
    return (
      <div className="mx-auto max-w-lg space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Team</h1>
        <Card>
          <CardContent>
            <LoadError
              title="Couldn’t load your team"
              body="Your team and its members are unaffected. Check your connection and try again."
              onRetry={() => refetchTeam()}
              retrying={teamFetching}
            />
          </CardContent>
        </Card>
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
              aria-label="Team name"
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
        {members && (
          <p className="text-muted-foreground">
            {acceptedCount} active · {memberList.length}/{team.max_seats} seats used
          </p>
        )}
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
            aria-label="Email address to invite"
            autoComplete="off"
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
          {membersLoading ? (
            <div className="flex items-center text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> Loading…
            </div>
          ) : membersError ? (
            <LoadError
              title="Couldn’t load your team members"
              body="Nobody has been removed. Check your connection and try again."
              onRetry={() => refetchMembers()}
              retrying={membersFetching}
            />
          ) : (
            <ul className="divide-y divide-border">
              {memberList.map((m) => (
                <li key={m.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    {roleIcon(m.role)}
                    <div className="min-w-0">
                      <div className="truncate font-medium text-foreground">{memberLabel(m)}</div>
                      <div className="text-xs capitalize text-muted-foreground">
                        {m.role}
                        {!m.accepted_at && ' · pending'}
                      </div>
                    </div>
                  </div>
                  {m.role !== 'owner' && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-11 w-11 shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      aria-label={`Remove ${memberLabel(m)}`}
                      disabled={removeMember.isPending && removeMember.variables?.id === m.id}
                      onClick={() => setRemoveTarget(m)}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Lead routing rules */}
      <LeadRoutingRules teamId={team.id} members={memberList} />

      <AlertDialog
        open={!!removeTarget}
        onOpenChange={(open) => {
          if (!open) setRemoveTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {removeTarget ? `Remove ${memberLabel(removeTarget)}?` : 'Remove this member?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {removeTarget && !removeTarget.accepted_at
                ? 'Their invitation will be cancelled and the link they were emailed will stop working.'
                : `They lose access to ${team.name} and their seat is freed. You can invite them again later.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (removeTarget) removeMember.mutate(removeTarget);
                setRemoveTarget(null);
              }}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
