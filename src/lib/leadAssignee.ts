/**
 * Who holds a lead (US-497, closes US-489).
 *
 * leads.assigned_to is set by a routing rule (auto_assign_lead), cleared when a
 * teammate leaves (US-475), and — from the lead detail dialog — chosen by the
 * owner. Only an accepted member of a team the lead's owner owns can hold it;
 * migration 20261108000497 refuses anyone else, because the assignee policies
 * and pii-crypto's decrypt_leads open the lead to whoever assigned_to names.
 */

/** A person the owner may hand a lead to. */
export interface TeamAssignee {
  userId: string;
  label: string;
}

/** The roster's way of naming someone: their email, else a neutral fallback. */
export function assigneeLabel(m: { email: string | null; user_id: string | null }): string {
  return m.email ?? 'Teammate';
}

/**
 * What the lead row and the detail dialog say about the assignment, or null
 * when there is nothing worth saying (a solo agent's own unassigned lead).
 *
 * `hasTeam` is whether the viewer owns a team: "Unassigned" means something
 * only to someone who could assign it.
 */
export function describeAssignee(
  lead: { user_id: string; assigned_to: string | null },
  viewerId: string | null,
  roster: readonly TeamAssignee[],
  hasTeam: boolean
): string | null {
  const { assigned_to: assignee } = lead;
  if (!assignee) return hasTeam && lead.user_id === viewerId ? 'Unassigned' : null;
  if (assignee === viewerId) return 'Assigned to you';
  if (assignee === lead.user_id) return 'Assigned to the owner';
  const member = roster.find((m) => m.userId === assignee);
  if (member) return `Assigned to ${member.label}`;
  // The viewer is the assignee's teammate, not the owner, or the owner's
  // roster has not loaded: do not claim the person left.
  return lead.user_id === viewerId ? 'Assigned to someone not on your team' : null;
}

/**
 * The Postgres refusal from guard_lead_assignee (20261108000497), recognised
 * so the dialog can say why rather than "Failed to update".
 */
export function isNotTeammateError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const e = error as { code?: unknown; details?: unknown };
  return e.code === '23514' && e.details === 'lead_assignee_not_teammate';
}

/**
 * The Leads list's assignee filter (US-515): 'unassigned', or one person's
 * user id. It comes from the URL, so anything else (a mistyped link, a stale
 * param) reads as no filter rather than as an empty list.
 */
export type AssigneeFilter = 'unassigned' | string;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function normalizeAssigneeFilter(raw: string | null | undefined): AssigneeFilter | null {
  if (!raw) return null;
  if (raw === 'unassigned') return 'unassigned';
  return UUID_RE.test(raw) ? raw.toLowerCase() : null;
}

/**
 * Bulk "Assign to…" on the Leads list (US-573, closes US-505).
 *
 * Only a lead's owner can change assigned_to (the leads UPDATE policy's WITH
 * CHECK), so a selection that mixes the owner's leads with leads another agent
 * assigned to them can move only the owner's. Those are reported, not hidden.
 */
export interface BulkAssignPlan {
  /** Ids to send. An id no longer loaded is sent; the server decides. */
  toUpdate: string[];
  /** Selected leads owned by someone else: the viewer cannot hand them on. */
  notOwned: number;
  /** The viewer's leads already held by the chosen person. */
  unchanged: number;
}

export function planBulkAssign(
  selectedIds: Iterable<string>,
  loaded: readonly { id: string; user_id: string; assigned_to: string | null }[],
  viewerId: string,
  next: string | null
): BulkAssignPlan {
  const byId = new Map(loaded.map((l) => [l.id, l]));
  const plan: BulkAssignPlan = { toUpdate: [], notOwned: 0, unchanged: 0 };
  for (const id of selectedIds) {
    const lead = byId.get(id);
    if (!lead) {
      plan.toUpdate.push(id);
    } else if (lead.user_id !== viewerId) {
      plan.notOwned += 1;
    } else if ((lead.assigned_to ?? null) === next) {
      plan.unchanged += 1;
    } else {
      plan.toUpdate.push(id);
    }
  }
  return plan;
}

const leadsWord = (n: number) => `${n} lead${n === 1 ? '' : 's'}`;

/**
 * What the toast says after a bulk assign. `updated` is how many of the ids
 * sent the server reports as changed; the rest were deleted meanwhile or are
 * not the viewer's. `partial` is true when anything selected did not end up
 * with the chosen person.
 */
export function summarizeBulkAssign(
  plan: BulkAssignPlan,
  updated: number,
  target: string | null
): { title: string; description: string; partial: boolean } {
  const missed = Math.max(0, plan.toUpdate.length - updated);
  const done = updated + plan.unchanged;
  const verb = done === 1 ? 'is' : 'are';
  const parts = [
    target
      ? `${leadsWord(done)} ${verb} now assigned to ${target}.`
      : `${leadsWord(done)} ${verb} now unassigned.`,
  ];
  if (plan.notOwned > 0) {
    parts.push(
      `${leadsWord(plan.notOwned)} not changed: only a lead’s owner can reassign it, and ${
        plan.notOwned === 1 ? 'that one belongs' : 'those belong'
      } to another agent.`
    );
  }
  if (missed > 0) {
    parts.push(
      `${leadsWord(missed)} could not be changed; ${missed === 1 ? 'it was' : 'they were'} deleted or ${missed === 1 ? 'is' : 'are'} no longer yours.`
    );
  }
  const partial = plan.notOwned > 0 || missed > 0;
  return {
    title: partial ? 'Some leads were not reassigned' : 'Leads reassigned',
    description: parts.join(' '),
    partial,
  };
}
