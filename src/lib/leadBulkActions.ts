/**
 * Bulk status change and bulk delete on the Leads list (US-588).
 *
 * The list holds the viewer's own leads and the leads a team owner assigned to
 * them. The two bulk actions treat those differently, the same way the leads
 * policies do (20260902000006, 20261028000004):
 *
 *   - status: the owner and the assignee may both update a lead. The bulk
 *     update used to be scoped to user_id alone, so a teammate who marked their
 *     assigned leads "contacted" changed nothing and was told "Updated N".
 *   - delete: only the owner may delete. The toast said "Deleted N" for a
 *     selection the server had partly or wholly refused.
 *
 * Both toasts now report what the server changed, from the ids it returned.
 */

const leadsWord = (n: number) => `${n} lead${n === 1 ? '' : 's'}`;

export interface BulkSummary {
  title: string;
  description: string;
  /** True when part of the selection was not changed. */
  partial: boolean;
}

/** What the toast says after a bulk status change. */
export function summarizeBulkStatus(
  selected: number,
  updated: number,
  statusLabel: string
): BulkSummary {
  const missed = Math.max(0, selected - updated);
  if (updated === 0) {
    return {
      title: 'Status not updated',
      description: `None of the selected leads could be changed; ${
        selected === 1 ? 'it was' : 'they were'
      } deleted or ${selected === 1 ? 'is' : 'are'} no longer yours or assigned to you. Refresh and try again.`,
      partial: true,
    };
  }
  const parts = [`${leadsWord(updated)} set to ${statusLabel}.`];
  if (missed > 0) {
    parts.push(
      `${leadsWord(missed)} not changed; ${missed === 1 ? 'it was' : 'they were'} deleted or ${
        missed === 1 ? 'is' : 'are'
      } no longer yours or assigned to you.`
    );
  }
  return {
    title: missed > 0 ? 'Some leads were not updated' : 'Status updated',
    description: parts.join(' '),
    partial: missed > 0,
  };
}

export interface BulkDeletePlan {
  /** Ids to send: the viewer's own, plus any no longer loaded (the server decides). */
  toDelete: string[];
  /** Selected leads another agent owns and assigned to the viewer. */
  notOwned: number;
}

export function planBulkDelete(
  selectedIds: Iterable<string>,
  loaded: readonly { id: string; user_id: string }[],
  viewerId: string
): BulkDeletePlan {
  const byId = new Map(loaded.map((l) => [l.id, l]));
  const plan: BulkDeletePlan = { toDelete: [], notOwned: 0 };
  for (const id of selectedIds) {
    const lead = byId.get(id);
    if (lead && lead.user_id !== viewerId) {
      plan.notOwned += 1;
    } else {
      plan.toDelete.push(id);
    }
  }
  return plan;
}

/** What the toast says after a bulk delete. `deleted` is the server's count. */
export function summarizeBulkDelete(plan: BulkDeletePlan, deleted: number): BulkSummary {
  const missed = Math.max(0, plan.toDelete.length - deleted);
  const parts: string[] = [];
  if (deleted > 0) parts.push(`${leadsWord(deleted)} deleted.`);
  if (plan.notOwned > 0) {
    parts.push(
      `${leadsWord(plan.notOwned)} kept: only a lead’s owner can delete it, and ${
        plan.notOwned === 1 ? 'that one was' : 'those were'
      } assigned to you by another agent.`
    );
  }
  if (missed > 0) {
    parts.push(
      `${leadsWord(missed)} could not be deleted; ${
        missed === 1 ? 'it was' : 'they were'
      } already gone or ${missed === 1 ? 'is' : 'are'} no longer yours.`
    );
  }
  const partial = plan.notOwned > 0 || missed > 0;
  return {
    title:
      deleted === 0
        ? 'No leads deleted'
        : partial
          ? 'Some leads were not deleted'
          : 'Leads deleted',
    description: parts.join(' '),
    partial,
  };
}
