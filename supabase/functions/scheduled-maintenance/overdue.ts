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
 * US-457 (US-318): quiet hours. An agent with profiles.timezone set is not
 * emailed between 21:00 and 07:00 on their own clock. The notification is
 * still claimed on time, so the bell shows the lead at once; the claim
 * carries data.email_pending, and the first run after 07:00 local emails
 * every held lead that is still unanswered, folded into that run's email.
 * Releasing a held row is itself a conditional claim (only the run that
 * clears email_pending sends), so a held lead is still emailed at most once.
 * An agent with no zone is emailed at once, as before: guessing UTC would
 * hold an American agent's emails through their afternoon.
 *
 * No Deno globals here, so it runs under vitest.
 */

import { normalizeTimeZone, zonedParts } from '../_shared/timeZone.ts';

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

/** No chase email from QUIET_START_HOUR:00 until QUIET_END_HOUR:00, agent's local time. */
export const QUIET_START_HOUR = 21;
export const QUIET_END_HOUR = 7;

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
  /** profiles.timezone. Null or unusable means no quiet hours (emailed at once). */
  timeZone?: string | null;
}

export interface OverdueNotification {
  user_id: string;
  type: string;
  title: string;
  message: string;
  data: { lead_id: string; hours_waiting: number; email_pending?: true };
}

/** A claimed chase whose email was held for the agent's quiet hours. */
export interface HeldChase {
  notificationId: string;
  user_id: string;
  lead_id: string;
  data: Record<string, unknown>;
}

/** Everything the chaser touches. Each method throws on a failed read or write. */
export interface OverdueStore {
  /** Unanswered `new` leads created in [from, to), ordered by created_at then id. */
  listCandidates(from: string, to: string, offset: number, limit: number): Promise<OverdueLead[]>;
  /** Lead ids already chased for these agents, by notifications created at or after `since`. */
  listChasedLeadIds(userIds: string[], since: string): Promise<Set<string>>;
  /**
   * These agents' address and preferences in one read (US-378). An agent
   * absent from the map could not be read; the chaser retries them next run.
   * Throws when the read fails.
   */
  getAgents(userIds: string[]): Promise<Map<string, OverdueAgent>>;
  /** Insert the notification. 'duplicate' when the lead was already chased. */
  claim(notification: OverdueNotification): Promise<'claimed' | 'duplicate'>;
  /** lead_overdue notifications created at or after `since` whose email is still held. */
  listHeldChases(since: string): Promise<HeldChase[]>;
  /** Of these lead ids, the leads still `new` with no response. */
  listStillWaiting(leadIds: string[]): Promise<OverdueLead[]>;
  /**
   * Clear email_pending on one held row, only if it is still set. True when
   * this call cleared it (this run owns the email), false when another run did.
   */
  releaseHeld(held: HeldChase): Promise<boolean>;
  sendEmail(email: { to: string; subject: string; body: string }): Promise<{ ok: boolean; error?: string }>;
}

export interface OverdueReport {
  claimed: number;
  agentsEmailed: number;
  alreadyChased: number;
  notYetDue: number;
  chasingOff: number;
  /** Leads claimed during the agent's quiet hours, email held until morning. */
  held: number;
  /** Held leads emailed this run, now the agent's quiet hours are over. */
  released: number;
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

/**
 * True while `timeZone`'s wall clock is in [QUIET_START_HOUR, QUIET_END_HOUR).
 * An unset or unusable zone has no quiet hours.
 */
export function inQuietHours(now: Date, timeZone: string | null | undefined): boolean {
  const zone = normalizeTimeZone(timeZone);
  if (!zone) return false;
  const { hour } = zonedParts(now, zone);
  return hour >= QUIET_START_HOUR || hour < QUIET_END_HOUR;
}

export function buildChaseNotification(
  lead: OverdueLead,
  now: Date,
  opts: { holdEmail?: boolean } = {}
): OverdueNotification {
  const hours = hoursWaiting(lead, now);
  return {
    user_id: lead.user_id,
    type: OVERDUE_NOTIFICATION_TYPE,
    title: `${lead.name} is still waiting`,
    message: `This ${lead.lead_type ?? 'lead'} has had no response for ${hours}h.`,
    data: opts.holdEmail
      ? { lead_id: lead.id, hours_waiting: hours, email_pending: true }
      : { lead_id: lead.id, hours_waiting: hours },
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
    held: 0,
    released: 0,
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

  // Emails held overnight. A failed read only delays them to the next run; it
  // must not stop new leads being chased.
  let heldChases: HeldChase[] = [];
  try {
    heldChases = await store.listHeldChases(from);
  } catch (error) {
    report.errors.push(`reading held chases: ${error instanceof Error ? error.message : String(error)}`);
  }

  if (candidates.length === 0 && heldChases.length === 0) return report;

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

  const pendingBy = new Map<string, OverdueLead[]>();
  for (const [agentId, agentLeads] of byAgent) {
    const pending = agentLeads.filter((lead) => {
      if (chased.has(lead.id)) {
        report.alreadyChased++;
        return false;
      }
      return true;
    });
    if (pending.length > 0) pendingBy.set(agentId, pending);
  }

  const heldBy = new Map<string, HeldChase[]>();
  for (const held of heldChases) {
    heldBy.set(held.user_id, [...(heldBy.get(held.user_id) ?? []), held]);
  }

  // Every address in one read per chunk (US-378: this was two round trips per
  // agent). A failed chunk leaves its agents' leads unclaimed (and held
  // emails held) for next run.
  const agents = new Map<string, OverdueAgent>();
  const readFailed = new Set<string>();
  for (const ids of chunk([...new Set([...pendingBy.keys(), ...heldBy.keys()])], 200)) {
    try {
      for (const [id, agent] of await store.getAgents(ids)) agents.set(id, agent);
    } catch (error) {
      for (const id of ids) readFailed.add(id);
      report.errors.push(
        `reading the addresses of ${ids.length} agents: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  // Held emails whose agent is out of quiet hours. Which leads are still
  // waiting is read before anything is released, so a failed read leaves
  // them all held for the next run instead of releasing them unsent.
  const releasedBy = new Map<string, OverdueLead[]>();
  const dueHeld = [...heldBy].filter(([agentId]) => {
    const agent = agents.get(agentId);
    return agent !== undefined && !inQuietHours(now, agent.timeZone);
  });
  if (dueHeld.length > 0) {
    const waiting = new Map<string, OverdueLead>();
    let waitingRead = true;
    try {
      const leadIds = dueHeld.flatMap(([, rows]) => rows.map((row) => row.lead_id));
      for (const ids of chunk(leadIds, 200)) {
        for (const lead of await store.listStillWaiting(ids)) waiting.set(lead.id, lead);
      }
    } catch (error) {
      waitingRead = false;
      report.errors.push(`reading held leads: ${error instanceof Error ? error.message : String(error)}`);
    }
    if (waitingRead) {
      for (const [agentId, rows] of dueHeld) {
        const chasingOn = agents.get(agentId)?.preferences?.leads !== 'off';
        const toEmail: OverdueLead[] = [];
        for (const row of rows) {
          try {
            if (!(await store.releaseHeld(row))) continue;
          } catch (error) {
            report.errors.push(
              `releasing held lead ${row.lead_id.slice(0, 8)}: ${error instanceof Error ? error.message : String(error)}`
            );
            continue;
          }
          // Answered overnight, deleted, or chasing since turned off: released
          // without an email.
          const lead = waiting.get(row.lead_id);
          if (lead && lead.user_id === agentId && chasingOn) toEmail.push(lead);
        }
        if (toEmail.length > 0) {
          releasedBy.set(agentId, toEmail);
          report.released += toEmail.length;
        }
      }
    }
  }

  for (const agentId of new Set([...pendingBy.keys(), ...releasedBy.keys()])) {
    const pending = pendingBy.get(agentId) ?? [];
    const released = releasedBy.get(agentId) ?? [];
    const agent = agents.get(agentId);
    if (!agent) {
      // Leave the leads unclaimed so the next run tries again.
      if (!readFailed.has(agentId)) report.errors.push(`agent ${agentId.slice(0, 8)} could not be read`);
      continue;
    }
    if (agent.preferences?.leads === 'off') {
      report.chasingOff += pending.length;
      continue;
    }

    const quiet = inQuietHours(now, agent.timeZone);
    const slaMs = slaHoursFor(agent.preferences) * HOUR_MS;
    const claimedNow: OverdueLead[] = [];
    for (const lead of pending) {
      if (now.getTime() - new Date(lead.created_at).getTime() < slaMs) {
        report.notYetDue++;
        continue;
      }
      try {
        const outcome = await store.claim(buildChaseNotification(lead, now, { holdEmail: quiet }));
        if (outcome === 'duplicate') {
          report.alreadyChased++;
          continue;
        }
        claimedNow.push(lead);
        report.claimed++;
        if (quiet) report.held++;
      } catch (error) {
        report.errors.push(
          `lead ${lead.id.slice(0, 8)}: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }

    // The claim is what makes this at-most-once: a lead whose email fails is
    // still in the agent's notifications and is not emailed again.
    // In quiet hours the claim carries email_pending and the morning run
    // sends it; otherwise this run's claims and any leads released from
    // overnight go out in one email.
    const toEmail = quiet ? [] : [...released, ...claimedNow];
    if (toEmail.length > 0 && agent.email) {
      const email = buildChaseEmail(toEmail, siteUrl, now);
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
    (report.held > 0 ? `, held for quiet hours ${report.held}` : '') +
    (report.released > 0 ? `, released after quiet hours ${report.released}` : '') +
    (report.truncated ? `, stopped at ${MAX_CANDIDATES} candidates` : '')
  );
}
