/**
 * Team / Organization management page.
 *
 * Shows the user's team (creating one if none), its members and roles, an
 * invite form, and aggregate team stats. Owners/admins can invite, remove,
 * and change roles.
 *
 * US-411 (US-338): the team is the one the user owns or, failing that, the
 * one they have accepted an invitation to. Members see it read-only; admins
 * get the same controls as the owner, because the teams edge function gates
 * invite / remove / updateRole on is_team_admin (owner, or accepted admin).
 * RLS already lets accepted members read both tables ("Team members read
 * team", "Members read roster"); before this the page asked only for teams
 * the user owned, so an accepted member was offered "Create your team".
 *
 * US-430 (US-419): members and admins can leave, after confirming, through
 * the teams function's 'leave' action. The owner is not offered it.
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  Loader2,
  LogOut,
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

type AssignableRole = Exclude<TeamMember['role'], 'owner'>;

/** The team the page shows, and the caller's role in it. */
export interface MyTeam {
  team: Team;
  role: TeamMember['role'];
}

/** Mirrors is_team_admin: the owner and accepted admins manage the team. */
export function canManageTeam(role: TeamMember['role']): boolean {
  return role === 'owner' || role === 'admin';
}

/** The roles the teams edge function's invite and updateRole actions accept. */
export const ASSIGNABLE_ROLES: { value: AssignableRole; label: string }[] = [
  { value: 'member', label: 'Member' },
  { value: 'admin', label: 'Admin' },
];

const SELECT_CLASS =
  'h-11 rounded-md border border-input bg-background px-3 text-base sm:h-10 sm:text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';

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
  const [inviteRole, setInviteRole] = useState<AssignableRole>('member');
  const [removeTarget, setRemoveTarget] = useState<TeamMember | null>(null);
  const [leaveOpen, setLeaveOpen] = useState(false);

  // US-328: a failed load used to fall through to "Create your team", which
  // invited an owner to make a second team. Errors are now thrown and shown.
  const {
    data: myTeam,
    isLoading: teamLoading,
    error: teamError,
    refetch: refetchTeam,
    isFetching: teamFetching,
  } = useQuery({
    queryKey: ['my-team', user?.id],
    enabled: !!user?.id,
    queryFn: async (): Promise<MyTeam | null> => {
      const { data: owned, error } = await supabase
        .from('teams')
        .select('id, name, owner_id, max_seats')
        .eq('owner_id', user!.id)
        .maybeSingle();
      if (error) throw error;
      if (owned) return { team: owned, role: 'owner' };

      // Not an owner: the team they accepted an invitation to, if any. A
      // pending invite (accepted_at null) does not count — it is accepted
      // from the emailed link, not here.
      const { data: membership, error: membershipError } = await supabase
        .from('team_members')
        .select('team_id, role')
        .eq('user_id', user!.id)
        .not('accepted_at', 'is', null)
        .order('accepted_at', { ascending: true })
        .limit(1)
        .maybeSingle();
      if (membershipError) throw membershipError;
      if (!membership) return null;

      const { data: joined, error: joinedError } = await supabase
        .from('teams')
        .select('id, name, owner_id, max_seats')
        .eq('id', membership.team_id)
        .maybeSingle();
      if (joinedError) throw joinedError;
      // A membership whose team cannot be read is surfaced as an error, not
      // as "no team": the create prompt would make them owner of a second one.
      if (!joined) throw new Error('Your team could not be found');
      return { team: joined, role: membership.role as TeamMember['role'] };
    },
  });
  const team = myTeam?.team;

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
    mutationFn: async ({ email, role }: { email: string; role: AssignableRole }) => {
      const { data, error } = await edgeFunctions.invoke('teams', {
        body: { action: 'invite', teamId: team!.id, email, role },
      });
      if (error) throw new Error(error.message);
      // US-226: the invite is emailed with an accept link now; say if it failed.
      return (data as { data?: { emailed?: boolean } } | null)?.data?.emailed !== false;
    },
    onSuccess: (emailed) => {
      setInviteEmail('');
      setInviteRole('member');
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
      // US-454: removal pauses the member's routing rules server-side.
      queryClient.invalidateQueries({ queryKey: ['lead-routing-rules', team?.id] });
      // US-475: it also unassigns the leads they held, so the Leads list must re-read.
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast({ title: `${memberLabel(member)} was removed from the team` });
    },
    onError: (e, member) =>
      toast({
        title: `Couldn’t remove ${memberLabel(member)}`,
        description: e instanceof Error ? e.message : 'Please try again.',
        variant: 'destructive',
      }),
  });

  // US-394: the teams edge function has always had updateRole, but there
  // was no control for it, so a member could never be made an admin.
  const changeRole = useMutation({
    mutationFn: async ({ member, role }: { member: TeamMember; role: AssignableRole }) => {
      const { error } = await edgeFunctions.invoke('teams', {
        body: { action: 'updateRole', teamId: team!.id, memberId: member.id, role },
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: (_data, { member, role }) => {
      queryClient.invalidateQueries({ queryKey: ['team-members', team?.id] });
      toast({
        title:
          role === 'admin'
            ? `${memberLabel(member)} is now an admin`
            : `${memberLabel(member)} is now a member`,
      });
    },
    onError: (e, { member }) =>
      toast({
        title: `Couldn’t change ${memberLabel(member)}’s role`,
        description: e instanceof Error ? e.message : 'Please try again.',
        variant: 'destructive',
      }),
  });

  // US-430 (US-419): 'remove' is admin-only, so a member had no way out.
  // 'leave' deletes only the caller's own non-owner row; the owner is refused.
  const leaveTeam = useMutation({
    mutationFn: async (teamToLeave: Team) => {
      const { error } = await edgeFunctions.invoke('teams', {
        body: { action: 'leave', teamId: teamToLeave.id },
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: (_data, teamLeft) => {
      queryClient.removeQueries({ queryKey: ['team-members', teamLeft.id] });
      queryClient.invalidateQueries({ queryKey: ['my-team', user?.id] });
      // US-475: the leads assigned to the leaver are unassigned server-side.
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['leads-assigned-count', user?.id] });
      toast({ title: `You left ${teamLeft.name}` });
    },
    onError: (e, teamToLeave) =>
      toast({
        title: `Couldn’t leave ${teamToLeave.name}`,
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
  if (!myTeam || !team) {
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

  const canManage = canManageTeam(myTeam.role);
  const memberList = members ?? [];
  const acceptedCount = memberList.filter((m) => m.accepted_at).length;

  const roleIcon = (role: string) =>
    role === 'owner' ? (
      <Crown className="h-4 w-4 shrink-0 text-foreground" aria-hidden="true" />
    ) : role === 'admin' ? (
      <Shield className="h-4 w-4 shrink-0 text-foreground" aria-hidden="true" />
    ) : (
      <Users className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
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
        {!canManage && (
          <p className="mt-1 text-sm text-muted-foreground">
            You’re a member of this team. Ask the owner or an admin to invite or remove people.
          </p>
        )}
      </div>

      {/* Invite */}
      {canManage && (
        <Card>
          <CardHeader>
            <CardTitle>Invite a member</CardTitle>
            <CardDescription>
              They'll join your team once they accept. Admins can also invite and remove members and
              change roles.
            </CardDescription>
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
            <select
              aria-label="Role for the new member"
              className={SELECT_CLASS}
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as AssignableRole)}
            >
              {ASSIGNABLE_ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
            <Button
              onClick={() => invite.mutate({ email: inviteEmail.trim(), role: inviteRole })}
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
      )}

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
              {memberList.map((m) => {
                const roleChanging =
                  changeRole.isPending && changeRole.variables?.member.id === m.id;
                return (
                  <li key={m.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
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
                    {/* Nobody changes the owner's role, and an admin does not
                        demote or remove themselves from this list. */}
                    {canManage && m.role !== 'owner' && m.user_id !== user?.id && (
                      <div className="flex shrink-0 items-center gap-1">
                        <select
                          aria-label={`Role for ${memberLabel(m)}`}
                          className={SELECT_CLASS}
                          value={m.role}
                          disabled={roleChanging}
                          aria-busy={roleChanging || undefined}
                          onChange={(e) => {
                            const role = e.target.value as AssignableRole;
                            if (role !== m.role) changeRole.mutate({ member: m, role });
                          }}
                        >
                          {ASSIGNABLE_ROLES.map((r) => (
                            <option key={r.value} value={r.value}>
                              {r.label}
                            </option>
                          ))}
                        </select>
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
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Lead routing rules */}
      {/* Routing rules are written under is_team_admin RLS; members cannot edit them. */}
      {canManage && <LeadRoutingRules teamId={team.id} members={memberList} />}

      {/* Leave — members and admins only. The owner's team, seats and billing
          hang off teams.owner_id, so the teams function refuses an owner. */}
      {myTeam.role !== 'owner' && (
        <Card>
          <CardHeader>
            <CardTitle>Leave team</CardTitle>
            <CardDescription>
              You’ll lose access to {team.name} and your seat is freed. You can rejoin only if
              someone invites you again.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              className="gap-2 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
              disabled={leaveTeam.isPending}
              aria-busy={leaveTeam.isPending || undefined}
              onClick={() => setLeaveOpen(true)}
            >
              {leaveTeam.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <LogOut className="h-4 w-4" aria-hidden="true" />
              )}
              Leave {team.name}
            </Button>
          </CardContent>
        </Card>
      )}

      <AlertDialog open={leaveOpen} onOpenChange={setLeaveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave {team.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              You lose access to the team’s roster and routing, and to any of its leads assigned to
              you; they go back to the owner unassigned. Your seat is freed. To come back, the owner
              or an admin has to invite you again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Stay</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                leaveTeam.mutate(team);
                setLeaveOpen(false);
              }}
            >
              Leave team
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
                : `They lose access to ${team.name} and to the leads assigned to them, which become unassigned. Their seat is freed, and you can invite them again later.`}
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
