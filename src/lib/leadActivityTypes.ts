/**
 * The two kinds of row on a lead's timeline (public.lead_activities).
 *
 * Agent-authored rows record what a person did with the lead. System rows are
 * the record of what happened to it, written only by the SECURITY DEFINER
 * lead triggers (auto_log_lead_status_change, auto_log_lead_creation).
 *
 * This list is the same one the database enforces in migration
 * 20261107000349_lead_timeline_system_rows_tamper_proof.sql: log_lead_activity,
 * and the lead_activities INSERT and DELETE policies, refuse any other type, so
 * a system row cannot be forged or removed through the API (US-349). Change
 * both together; src/lib/leadTimelineIntegrity.test.ts fails if they drift.
 */
export const AGENT_AUTHORED_ACTIVITY_TYPES = [
  'note',
  'call',
  'email',
  'sms',
  'meeting',
  'task',
] as const;

export const SYSTEM_ACTIVITY_TYPES = ['status_change', 'form_submission'] as const;

export type AgentAuthoredActivityType = (typeof AGENT_AUTHORED_ACTIVITY_TYPES)[number];
export type SystemActivityType = (typeof SYSTEM_ACTIVITY_TYPES)[number];
export type ActivityType = AgentAuthoredActivityType | SystemActivityType;

const AGENT_AUTHORED = new Set<string>(AGENT_AUTHORED_ACTIVITY_TYPES);

export function isAgentAuthoredActivityType(type: string): type is AgentAuthoredActivityType {
  return AGENT_AUTHORED.has(type);
}
