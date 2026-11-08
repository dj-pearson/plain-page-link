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
