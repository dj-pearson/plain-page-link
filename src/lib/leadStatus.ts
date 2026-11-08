/**
 * What a lead status change writes besides `status`.
 *
 * Every status change in the app used to be `.update({ status })` and nothing
 * else, so three timestamps the CRM reports on were never maintained from the
 * UI (US-101):
 *
 *   contacted_at        no code in src/ wrote it at all
 *   closed_at           never written, so a converted lead had no close date
 *   first_responded_at  set by the set_lead_first_responded_at trigger on the
 *                       first move away from 'new', and never cleared — so
 *                       bulk-resetting a lead to 'new' left it looking already
 *                       responded to, permanently
 *
 * Keeping this here rather than inline at each call site means the modal and
 * the bulk action agree, and the rules are testable without a database.
 */
import type { Lead } from '@/types/lead';

/**
 * The one lead status vocabulary (US-278 / US-428).
 *
 * Migration 20261107000428 adds `leads_status_check` with exactly these
 * values, in this order; leadStatus.test.ts reads the migration and holds the
 * two together. Every picker (the lead modal, the bulk action, the workflow
 * builder's update_lead step) and every badge reads this list, so a status
 * cannot be offered in one place and unknown in another — which is what had
 * happened: the UI offered new/contacted/qualified/converted/lost while this
 * file also honoured nurturing and closed, and nothing in the database stopped
 * any other string.
 *
 *   converted  the lead became a client (the agent's win)
 *   closed     the deal itself completed
 *   nurturing  a long-horizon lead the agent keeps warm
 *   lost       did not convert
 */
export const LEAD_STATUSES = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'nurturing', label: 'Nurturing' },
  { value: 'converted', label: 'Converted' },
  { value: 'closed', label: 'Closed' },
  { value: 'lost', label: 'Lost' },
] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number]['value'];

export const LEAD_STATUS_VALUES: readonly LeadStatus[] = LEAD_STATUSES.map((s) => s.value);

export function isLeadStatus(value: unknown): value is LeadStatus {
  return typeof value === 'string' && (LEAD_STATUS_VALUES as readonly string[]).includes(value);
}

/** The label for a stored status; an unexpected value is shown as-is. */
export function leadStatusLabel(status: string | null | undefined): string {
  const value = status ?? 'new';
  return LEAD_STATUSES.find((s) => s.value === value)?.label ?? value;
}

/** Statuses that mean the lead is finished, one way or the other. */
export const CLOSED_STATUSES: ReadonlySet<string> = new Set<LeadStatus>([
  'converted',
  'closed',
  'lost',
]);

/** Statuses that mean the agent has made contact. */
export const CONTACTED_STATUSES: ReadonlySet<string> = new Set<LeadStatus>([
  'contacted',
  'qualified',
  'nurturing',
  'converted',
  'closed',
]);

export interface LeadStatusPatch {
  status: string;
  contacted_at?: string | null;
  closed_at?: string | null;
  first_responded_at?: string | null;
}

/**
 * Builds the update for moving `lead` to `newStatus`.
 *
 * `now` is injectable so tests do not race the clock.
 *
 * Passing the current lead is optional — the bulk action changes many leads at
 * once and does not hold each row — in which case the timestamps that depend on
 * the previous value (contacted_at, which records FIRST contact) are left
 * alone rather than guessed at. The clearing rules for a reset to 'new' do not
 * depend on the previous value and always apply.
 */
export function buildLeadStatusPatch(
  newStatus: string,
  lead?: Pick<Lead, 'status' | 'contacted_at'> | null,
  now: Date = new Date()
): LeadStatusPatch {
  const patch: LeadStatusPatch = { status: newStatus };
  const iso = now.toISOString();

  if (newStatus === 'new') {
    // Reopening a lead resets the response clock. Leaving these set meant a
    // lead moved back to 'new' still counted as responded to in the Avg
    // Response KPI, and could never contribute to it again — the trigger only
    // fires on the first move away from 'new' when first_responded_at IS NULL.
    patch.first_responded_at = null;
    patch.contacted_at = null;
    patch.closed_at = null;
    return patch;
  }

  if (CLOSED_STATUSES.has(newStatus)) {
    patch.closed_at = iso;
  } else {
    // Moving a closed lead back into the pipeline reopens it.
    patch.closed_at = null;
  }

  // contacted_at records the FIRST contact, so it is only ever set when it is
  // not already set — the same rule the log_lead_* RPCs use (US-100).
  if (CONTACTED_STATUSES.has(newStatus) && lead && !lead.contacted_at) {
    patch.contacted_at = iso;
  }

  return patch;
}

/**
 * The patch for the agent actually reaching out — tapping call, email or SMS.
 *
 * A lead sitting at 'new' becomes 'contacted': the agent has responded, and
 * leaving it at 'new' is what made a lead they phoned within a minute still
 * read "No response · 3h" on the Leads page. Anything past 'new' is left
 * alone, since a later call does not un-qualify a lead.
 */
export function buildContactPatch(
  lead: Pick<Lead, 'status' | 'contacted_at'>,
  now: Date = new Date()
): LeadStatusPatch | null {
  if (lead.status !== 'new') {
    // Still record first contact if it somehow was never set.
    return lead.contacted_at
      ? null
      : { status: lead.status ?? 'new', contacted_at: now.toISOString() };
  }
  return buildLeadStatusPatch('contacted', lead, now);
}
