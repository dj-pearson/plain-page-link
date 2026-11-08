/**
 * update_lead's "Add Note" (US-452, slice 2 of US-278).
 *
 * The step used to write its text into leads.notes, a column nothing in the
 * dashboard reads, so an agent whose workflow "added a note" never saw it. A
 * note is a timeline row: lead_activities with activity_type 'note', which is
 * what LeadDetailModal renders and what the agent's own notes already are.
 *
 * Attributed to the lead's owner, who is the workflow's owner (checked by
 * assertLeadOwnedBy before this is built). 'note' is an agent-authored type
 * (US-349), so the owner can delete it like any note they wrote; it is marked
 * internal, because a workflow note is the agent's working record, not
 * something said to the lead.
 */

export interface WorkflowNoteRow {
  lead_id: string;
  user_id: string;
  activity_type: 'note';
  title: string;
  content: string;
  is_internal: true;
  metadata: { source: 'workflow'; workflow_id: string | null; node_id: string };
}

/** Longest note kept, so a runaway template cannot bloat the timeline. */
export const WORKFLOW_NOTE_MAX = 5000;

/**
 * The timeline row for a workflow note, or null when there is nothing to say
 * (an empty or whitespace-only note, including one whose variables resolved to
 * nothing).
 */
export function workflowNoteRow(params: {
  leadId: string;
  ownerId: string;
  content: unknown;
  workflowId?: string | null;
  nodeId: string;
}): WorkflowNoteRow | null {
  if (typeof params.content !== 'string') return null;
  const text = params.content.trim();
  if (!text) return null;
  return {
    lead_id: params.leadId,
    user_id: params.ownerId,
    activity_type: 'note',
    title: 'Workflow note',
    content: text.slice(0, WORKFLOW_NOTE_MAX),
    is_internal: true,
    metadata: { source: 'workflow', workflow_id: params.workflowId ?? null, node_id: params.nodeId },
  };
}
