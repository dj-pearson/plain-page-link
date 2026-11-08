/**
 * The lead status vocabulary, for edge functions (US-428).
 *
 * The edge functions cannot import from src/ (the container copies only
 * supabase/functions), so this repeats LEAD_STATUSES from src/lib/leadStatus.ts.
 * lead-status.test.ts holds the two lists and the leads_status_check constraint
 * in migration 20261107000428 together.
 */
export const LEAD_STATUS_VALUES = [
  'new',
  'contacted',
  'qualified',
  'nurturing',
  'converted',
  'closed',
  'lost',
] as const;

export type LeadStatus = (typeof LEAD_STATUS_VALUES)[number];

export function isLeadStatus(value: unknown): value is LeadStatus {
  return typeof value === 'string' && (LEAD_STATUS_VALUES as readonly string[]).includes(value);
}
