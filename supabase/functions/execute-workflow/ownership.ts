/**
 * Workflow steps act on leads through the SERVICE-ROLE client, so RLS never
 * asks whose lead it is. Before US-218 update_lead and create_task took any
 * leadId from the workflow's config or trigger data and wrote to it — an agent
 * could edit another agent's lead status, notes and score, or attach tasks to
 * it, by naming its id. This is the ownership check RLS would have made.
 */

interface LeadOwnerRow {
  user_id: string;
  assigned_to: string | null;
}

/** The subset of the Supabase client this needs, so it can be tested. */
export interface LeadReader {
  from(table: 'leads'): {
    select(columns: string): {
      eq(column: string, value: string): {
        maybeSingle(): PromiseLike<{ data: LeadOwnerRow | null; error: { message: string } | null }>;
      };
    };
  };
}

/**
 * Returns the lead's owner row when it belongs to the workflow's owner, and
 * throws "Lead not found" otherwise — the same answer whether the lead is
 * someone else's or does not exist.
 */
export async function assertLeadOwnedBy(db: LeadReader, leadId: string, ownerId: string): Promise<LeadOwnerRow> {
  const { data, error } = await db.from('leads').select('user_id, assigned_to').eq('id', leadId).maybeSingle();
  if (error) throw new Error(`Lead lookup failed: ${error.message}`);
  if (!data || data.user_id !== ownerId) {
    if (data) console.warn(`[execute-workflow] owner ${ownerId} named lead ${leadId}, owned by ${data.user_id}`);
    throw new Error('Lead not found');
  }
  return data;
}

/**
 * Who a created task may be assigned to: the owner, or the teammate the lead
 * is already assigned to. Any other id falls back to the owner rather than
 * dropping a task into a stranger's list.
 */
export function taskAssignee(requested: string | null | undefined, lead: LeadOwnerRow): string {
  if (requested && (requested === lead.user_id || requested === lead.assigned_to)) return requested;
  return lead.user_id;
}
