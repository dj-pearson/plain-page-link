/**
 * Who holds this lead, and — for the lead's owner — a way to change it
 * (US-497, closes US-489).
 *
 * Before this the owner could not see who a routing rule had given a lead to,
 * and leads US-475 unassigned when a teammate left could not be handed to
 * anyone from the dashboard. The choice is limited to accepted teammates; the
 * database enforces the same set (guard_lead_assignee, 20261108000497).
 */
import { useEffect, useState } from 'react';
import { RefreshCw, UserCheck } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/useAuthStore';
import { useLeadAssignees } from '@/hooks/useLeadAssignees';
import { describeAssignee, isNotTeammateError } from '@/lib/leadAssignee';
import { logger } from '@/lib/logger';
import { Button } from '@/components/ui/button';

const SELECT_CLASS =
  'h-11 w-full rounded-md border border-input bg-background px-3 text-base sm:h-10 sm:text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';

/** The select's value for "nobody". A select cannot hold null. */
const UNASSIGNED = '';

interface LeadAssigneeControlProps {
  lead: { id: string; name: string; user_id: string; assigned_to: string | null };
  onAssigned?: () => void;
}

export function LeadAssigneeControl({ lead, onAssigned }: LeadAssigneeControlProps) {
  const viewerId = useAuthStore((s) => s.user?.id ?? null);
  const isOwner = !!viewerId && viewerId === lead.user_id;
  const { teamId, assignees, isLoading, error, refetch } = useLeadAssignees();

  // What the server holds. Not optimistic: it moves only after a save works,
  // so a refused change leaves the select on the real assignee.
  const [current, setCurrent] = useState<string | null>(lead.assigned_to);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    setCurrent(lead.assigned_to);
  }, [lead.id, lead.assigned_to]);

  if (!isOwner) {
    // An assignee sees who holds it (them) but cannot hand it on: the leads
    // UPDATE policy's WITH CHECK refuses a row neither theirs nor theirs-to-hold.
    const text = describeAssignee(
      { user_id: lead.user_id, assigned_to: current },
      viewerId,
      [],
      false
    );
    return text ? <AssigneeLine text={text} /> : null;
  }

  if (isLoading) return null;

  if (error) {
    return (
      <div role="alert" className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <span>Couldn’t load your team, so the assignee can’t be changed.</span>
        <Button variant="outline" size="sm" className="gap-2" onClick={() => void refetch()}>
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          Try again
        </Button>
      </div>
    );
  }

  // A solo agent: nobody to assign to, and nothing to show.
  if (!teamId) return null;

  const nameOf = (userId: string | null): string => {
    if (!userId) return 'nobody';
    if (userId === viewerId) return 'you';
    return assignees.find((a) => a.userId === userId)?.label ?? 'someone not on your team';
  };
  const known =
    current === null || current === viewerId || assignees.some((a) => a.userId === current);

  const assign = async (raw: string) => {
    const next = raw === UNASSIGNED ? null : raw;
    if (next === current) return;
    setSaving(true);
    try {
      const { error: updateError } = await supabase
        .from('leads')
        .update({ assigned_to: next })
        .eq('id', lead.id)
        .eq('user_id', viewerId!)
        .select('id')
        .single();
      if (updateError) throw updateError;
      setCurrent(next);
      toast.success(
        next ? `${lead.name} is assigned to ${nameOf(next)}` : `${lead.name} is unassigned`
      );
      onAssigned?.();
    } catch (e) {
      logger.error('Failed to reassign lead', e as Error);
      toast.error(
        isNotTeammateError(e)
          ? `${nameOf(next)} is no longer an accepted member of your team. Refresh and try again.`
          : `Couldn’t change who holds ${lead.name}. Please try again.`
      );
      if (isNotTeammateError(e)) void refetch();
    } finally {
      setSaving(false);
    }
  };

  const selectId = `lead-assignee-${lead.id}`;
  return (
    <div className="space-y-2">
      <label htmlFor={selectId} className="text-sm font-medium leading-none">
        Assigned to
      </label>
      <select
        id={selectId}
        className={SELECT_CLASS}
        value={current ?? UNASSIGNED}
        disabled={saving}
        aria-busy={saving}
        onChange={(e) => void assign(e.target.value)}
      >
        <option value={UNASSIGNED}>Unassigned</option>
        <option value={viewerId!}>Me</option>
        {assignees.map((a) => (
          <option key={a.userId} value={a.userId}>
            {a.label}
          </option>
        ))}
        {!known && current && (
          <option value={current} disabled>
            Someone not on your team
          </option>
        )}
      </select>
      {assignees.length === 0 && (
        <p className="text-xs text-muted-foreground">
          No one has accepted an invitation to your team yet, so there is no teammate to assign to.
        </p>
      )}
    </div>
  );
}

function AssigneeLine({ text }: { text: string }) {
  return (
    <p className="flex items-center gap-2 text-sm text-muted-foreground">
      <UserCheck className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
      {text}
    </p>
  );
}
