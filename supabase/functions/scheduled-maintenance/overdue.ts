/**
 * The overdue-lead chaser (US-103, reworked in US-309). Called by
 * scheduled-maintenance every hour.
 *
 * A new lead with no response past the agent's own SLA
 * (profiles.notification_preferences.sla_hours, set in Settings and on the
 * Leads page) gets one in-app notification, and the agent gets one email per
 * run listing every lead that crossed the line since the last run.
 *
 * What US-309 fixed in the inline version that used to live in index.ts:
 *
 * - It fetched the OLDEST 500 unanswered leads and nothing else. Leads that
 *   are never answered stay `new` forever, so once 500 of them existed across
 *   all agents, every run re-read the same already-chased backlog and no new
 *   lead was ever chased again.
 * - It had no look-back limit, so the first run (or a lead whose agent turned
 *   chasing back on) emailed about leads months old.
 * - The net was cast at 2 hours while Settings offers 1, so an agent who chose
 *   the tightest window was chased an hour late.
 * - The "already chased?" lookup ignored its error and used maybeSingle(),
 *   which errors on two matches; either way it read as "not chased" and the
 *   agent was emailed again every hour.
 * - One email per lead: twenty overdue leads meant twenty emails in a minute.
 *
 * Now: every lead in the window is read (paged), the already-chased set is
 * read in bulk and a failed read fails the task instead of re-sending, the
 * notification insert is the claim (a unique index makes a second claim a
 * 23505, 20261107000309), and the email goes out only for leads this run
 * claimed. A lead is therefore chased at most once, and a missed run is made
 * up by the next one as long as the lead is still inside the window.
 *
 * No Deno globals here, so it runs under vitest.
 */

/** Settings offers these (src/components/settings/LeadNotificationPreferences.tsx). */
export const SLA_HOURS_OPTIONS = [1, 2, 4, 8, 24] as const;
export const DEFAULT_SLA_HOURS = 2;
const MIN_SLA_HOURS = Math.min(...SLA_HOURS_OPTIONS);

/**
 * How far back a lead may have arrived and still be chased. A week covers
 * six days of missed runs past the longest SLA; anything older is not news,
 * and chasing it would turn the first run after a deploy into a flood.
 */
export const LOOKBACK_HOURS = 7 * 24;

/** Never read more than this many candidates in one run; reported if hit. */
export const MAX_CANDIDATES = 10_000;
export const PAGE_SIZE = 1000;

/** Leads named in one email before "and N more". */
const EMAIL_LIST_LIMIT = 10;

export const OVERDUE_NOTIFICATION_TYPE = 'lead_overdue';

const HOUR_MS = 3_600_000;

export interface OverdueLead {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  lead_type: string | null;
}

export interface OverdueAgent {
  email: string | null;
  preferences: Record<string, unknown> | null;
}

export interface OverdueNotification {
  user_id: string;
  type: string;
  title: string;
  message: string;
  data: { lead_id: string; hours_waiting: number };
}

/** Everything the chaser touches. Each method throws on a failed read or write. */
export interface OverdueStore {
  /** Unanswered `new` leads created in [from, to), ordered by created_at then id. */
  listCandidates(from: string, to: string, offset: number, limit: number): Promise<OverdueLead[]>;
  /** Lead ids already chased for these agents, by notifications created at or after `since`. */
  listChasedLeadIds(userIds: string[], since: string): Promise<Set<string>>;
  /** Null when the agent cannot be read; the chaser retries them next run. */
  getAgent(userId: string): Promise<OverdueAgent | null>;
  /** Insert the notification. 'duplicate' when the lead was already chased. */
  claim(notification: OverdueNotification): Promise<'claimed' | 'duplicate'>;
  sendEmail(email: { to: string; subject: string; body: string }): Promise<{ ok: boolean; error?: string }>;
}

export interface OverdueReport {
  claimed: number;
  agentsEmailed: number;
  alreadyChased: number;
  notYetDue: number;
  chasingOff: number;
  truncated: boolean;
  errors: string[];
}

/** The agent's SLA in hours; anything Settings could not have written falls back to the default. */
export function slaHoursFor(preferences: Record<string, unknown> | null | undefined): number {
  const raw = preferences?.sla_hours;
  return typeof raw === 'number' && (SLA_HOURS_OPTIONS as readonly number[]).includes(raw)
    ? raw
    : DEFAULT_SLA_HOURS;
}

/** The created_at range worth looking at: old enough for the tightest SLA, young enough to be news. */
export function candidateWindow(now: Date): { from: string; to: string } {
  return {
    from: new Date(now.getTime() - LOOKBACK_HOURS * HOUR_MS).toISOString(),
    to: new Date(now.getTime() - MIN_SLA_HOURS * HOUR_MS).toISOString(),
  };
}

export function hoursWaiting(lead: Pick<OverdueLead, 'created_at'>, now: Date): number {
  return Math.floor((now.getTime() - new Date(lead.created_at).getTime()) / HOUR_MS);
}

export function buildChaseNotification(lead: OverdueLead, now: Date): OverdueNotification {
  const hours = hoursWaiting(lead, now);
  return {
    user_id: lead.user_id,
    type: OVERDUE_NOTIFICATION_TYPE,
    title: `${lead.name} is still waiting`,
    message: `This ${lead.lead_type ?? 'lead'} has had no response for ${hours}h.`,
    data: { lead_id: lead.id, hours_waiting: hours },
  };
}

/** One email for every lead this run claimed for one agent. */
export function buildChaseEmail(
  leads: OverdueLead[],
  siteUrl: string,
  now: Date
): { subject: string; body: string } {
  const footer = `You can change how long to wait, or turn these off, in Settings.`;
  if (leads.length === 1) {
    const [lead] = leads;
    const hours = hoursWaiting(lead, now);
    return {
      subject: `${lead.name} has been waiting ${hours}h`,
      body:
        `${lead.name} sent you a ${lead.lead_type ?? 'lead'} ${hours} hours ago and ` +
        `has not heard back.\n\n` +
        `Open the lead: ${siteUrl}/dashboard/leads?lead=${lead.id}\n\n` +
        footer,
    };
  }

  const listed = leads.slice(0, EMAIL_LIST_LIMIT).map((lead) => {
    const hours = hoursWaiting(lead, now);
    return `- ${lead.name} (${lead.lead_type ?? 'lead'}, ${hours}h): ${siteUrl}/dashboard/leads?lead=${lead.id}`;
  });
  const more = leads.length - listed.length;
  return {
    subject: `${leads.length} leads are still waiting to hear from you`,
    body:
      `These leads have had no response past your response window:\n\n` +
      listed.join('\n') +
      (more > 0 ? `\n- and ${more} more: ${siteUrl}/dashboard/leads` : '') +
      `\n\n` +
      footer,
  };
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

export async function chaseOverdueLeads(
  store: OverdueStore,
  opts: { now: Date; siteUrl: string }
): Promise<OverdueReport> {
  const { now, siteUrl } = opts;
  const { from, to } = candidateWindow(now);
  const report: OverdueReport = {
    claimed: 0,
    agentsEmailed: 0,
    alreadyChased: 0,
    notYetDue: 0,
    chasingOff: 0,
    truncated: false,
    errors: [],
  };

  // Read the whole window, so a backlog of chased-but-unanswered leads cannot
  // crowd newer ones out.
  const candidates: OverdueLead[] = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const page = await store.listCandidates(from, to, offset, PAGE_SIZE);
    candidates.push(...page);
    if (page.length < PAGE_SIZE) break;
    if (candidates.length >= MAX_CANDIDATES) {
      report.truncated = true;
      break;
    }
  }
  if (candidates.length === 0) return report;

  const byAgent = new Map<string, OverdueLead[]>();
  for (const lead of candidates) {
    byAgent.set(lead.user_id, [...(byAgent.get(lead.user_id) ?? []), lead]);
  }

  // A failed read throws: treating it as "nothing chased yet" is exactly how
  // the old version re-sent every hour.
  const chased = new Set<string>();
  for (const ids of chunk([...byAgent.keys()], 200)) {
    for (const id of await store.listChasedLeadIds(ids, from)) chased.add(id);
  }

  for (const [agentId, agentLeads] of byAgent) {
    const pending = agentLeads.filter((lead) => {
      if (chased.has(lead.id)) {
        report.alreadyChased++;
        return false;
      }
      return true;
    });
    if (pending.length === 0) continue;

    const agent = await store.getAgent(agentId);
    if (!agent) {
      // Leave the leads unclaimed so the next run tries again.
      report.errors.push(`agent ${agentId.slice(0, 8)} could not be read`);
      continue;
    }
    if (agent.preferences?.leads === 'off') {
      report.chasingOff += pending.length;
      continue;
    }

    const slaMs = slaHoursFor(agent.preferences) * HOUR_MS;
    const claimedNow: OverdueLead[] = [];
    for (const lead of pending) {
      if (now.getTime() - new Date(lead.created_at).getTime() < slaMs) {
        report.notYetDue++;
        continue;
      }
      try {
        const outcome = await store.claim(buildChaseNotification(lead, now));
        if (outcome === 'duplicate') {
          report.alreadyChased++;
          continue;
        }
        claimedNow.push(lead);
        report.claimed++;
      } catch (error) {
        report.errors.push(
          `lead ${lead.id.slice(0, 8)}: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }

    // The claim is what makes this at-most-once: a lead whose email fails is
    // still in the agent's notifications and is not emailed again.
    if (claimedNow.length > 0 && agent.email) {
      const email = buildChaseEmail(claimedNow, siteUrl, now);
      const result = await store.sendEmail({ to: agent.email, ...email });
      if (result.ok) report.agentsEmailed++;
      else report.errors.push(`email to agent ${agentId.slice(0, 8)} failed: ${result.error ?? 'unknown'}`);
    }
  }

  return report;
}

export function summarizeOverdueReport(report: OverdueReport): string {
  return (
    `chased ${report.claimed}, agents emailed ${report.agentsEmailed}, ` +
    `already chased ${report.alreadyChased}, not yet due ${report.notYetDue}, ` +
    `chasing off ${report.chasingOff}` +
    (report.truncated ? `, stopped at ${MAX_CANDIDATES} candidates` : '')
  );
}
