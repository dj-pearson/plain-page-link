/**
 * The morning email task (US-230, reworked in US-331). Called by
 * scheduled-maintenance every hour; sends once per agent per day (digest_log),
 * and only when buildDigest finds something worth sending.
 *
 * Preference: profiles.notification_preferences.digest — 'daily' (default),
 * 'weekly' (Mondays only) or 'off'. Monday's edition adds last week's numbers.
 *
 * What US-331 fixed:
 *
 * - It ran only when the clock read exactly DIGEST_HOUR_UTC. One missed or
 *   failed hourly run (a GitHub Actions cron is routinely skipped under load)
 *   meant nobody got that day's email. Now every run from the digest hour to
 *   DIGEST_CATCHUP_HOURS after it sends to whoever digest_log says has not had
 *   today's edition, so a missed run is made up by the next one, exactly once.
 *   The look-back windows are anchored to the scheduled hour, not to when the
 *   run happened, so a late edition covers the same leads an on-time one would
 *   have, and tomorrow's does not repeat them.
 * - It read the first 5,000 profiles (in practice PostgREST's 1,000-row cap)
 *   and, across ALL agents, the first 5,000 new leads, 5,000 due tasks and
 *   10,000 key dates. Everyone past those lines silently got a thinner digest
 *   or none. Profiles are now read in id-ordered pages, and each page's leads,
 *   tasks and dates are read for that page's agents only, paged to the end.
 * - A failed weekly count read as zero, a failed claim or contact lookup read
 *   as "skipped", and a failed release of a claim after a failed send was
 *   ignored (so that agent got nothing that day and nobody knew). Each is now
 *   an error in the report, and the task fails so the 207 says so.
 *
 * US-354 (US-344): every run in the catch-up window re-read every profile and
 * its related rows, only to find everyone sent or with nothing to send. A
 * complete pass with no errors now writes a digest_runs row for the day, and
 * later unforced runs that day return before reading a single profile. A pass
 * with any error writes nothing, so the next run still retries. The cost: an
 * agent who had nothing at the first clean pass, or who switches the digest
 * on, signs up or gains a task due today after it, is not reconsidered until
 * tomorrow's edition — the same as a run exactly on the hour always meant.
 *
 * US-433 (US-343): an agent with profiles.timezone set gets the edition at
 * DIGEST_LOCAL_HOUR on their own wall clock, dated by their own calendar day,
 * with "due today" measured to the end of that local day. Agents without one
 * keep the UTC edition at DIGEST_HOUR_UTC. Each (local date, zone) is its own
 * edition with its own digest_runs marker (slot = the zone, '' for UTC), so the
 * hourly run now always pages through the profiles' ids, zones and
 * preferences, but reads leads, tasks, dates and digest_log only for agents
 * whose edition is due and not yet settled.
 *
 * US-518 (US-445): an agent with a time zone may choose the hour, 5am to
 * 10am, in notification_preferences.digest_hour. Each chosen hour is its own
 * edition with its own marker (slot `zone@hour`); an agent who has not chosen
 * keeps the DIGEST_LOCAL_HOUR edition under the bare zone slot, so markers
 * written before this mean what they meant. The hour is ignored for an agent
 * with no zone: a "7am" in UTC would be nobody's morning. Changing the hour
 * on a day the edition already went out does not send a second one
 * (digest_log is per agent per day); moving it earlier, to an edition a clean
 * pass has already settled that day, starts at tomorrow's edition.
 *
 * No Deno globals here, so it runs under vitest; the database side is
 * digest-store.ts.
 */
import {
  buildDigest,
  type DigestInput,
  type DigestKeyDate,
  type DigestLead,
  type DigestTask,
  type WeeklyStats,
} from '../_shared/digest.ts';
import type { EmailOptions } from '../_shared/email.ts';
import { addDays, localDateIn, normalizeTimeZone, zonedTimeToUtc } from '../_shared/timeZone.ts';

export type DigestPreference = 'daily' | 'weekly' | 'off';
export type DigestKind = 'daily' | 'weekly';

export const DEFAULT_DIGEST_HOUR_UTC = 13;
/** The local hour an agent with a time zone gets the edition (US-433). */
export const DEFAULT_DIGEST_LOCAL_HOUR = 7;
/** The local hours an agent may choose for the edition (US-518). */
export const DIGEST_HOUR_CHOICES = [5, 6, 7, 8, 9, 10] as const;
/** How many hourly runs after the digest hour may still send a missed edition. */
export const DEFAULT_CATCHUP_HOURS = 6;
/** Profiles per page; each page's related rows are read for its agents only. */
export const PROFILE_PAGE_SIZE = 500;
/** Agent ids per `in (...)` filter, so the request URL stays short. */
export const ID_CHUNK = 100;
/** Rows per related-table read; matches PostgREST's default max-rows. */
export const ROW_PAGE_SIZE = 1000;

const HOUR_MS = 3_600_000;

/**
 * Which edition an agent gets. `on` is the edition's date (`YYYY-MM-DD`, the
 * agent's local date) or an instant read in UTC.
 */
export function digestKindFor(pref: unknown, on: Date | string): DigestKind | null {
  const p: DigestPreference = pref === 'weekly' || pref === 'off' ? pref : 'daily';
  if (p === 'off') return null;
  const date = typeof on === 'string' ? new Date(`${on}T12:00:00Z`) : on;
  const monday = date.getUTCDay() === 1;
  if (p === 'weekly') return monday ? 'weekly' : null;
  return monday ? 'weekly' : 'daily';
}

/**
 * The local hour the agent chose for the edition (US-518), or null when they
 * have not chosen one, or stored something outside DIGEST_HOUR_CHOICES.
 */
export function chosenDigestHour(prefs: unknown): number | null {
  if (!prefs || typeof prefs !== 'object') return null;
  const hour = (prefs as { digest_hour?: unknown }).digest_hour;
  return typeof hour === 'number' && (DIGEST_HOUR_CHOICES as readonly number[]).includes(hour) ? hour : null;
}

/** The UTC date after `now`'s, as `YYYY-MM-DD`. */
export function dueCutoffDay(now: Date): string {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)).toISOString().slice(0, 10);
}

export interface DigestSchedule {
  /** The edition's date, `YYYY-MM-DD` (digest_log.digest_date): local to `timeZone`. */
  day: string;
  /** What the edition's windows are measured back from. */
  anchor: Date;
  /** Set for an agent's local edition (US-433); absent for the UTC edition. */
  timeZone?: string;
  /** Set when the agent chose the hour (US-518); part of the edition's slot. */
  chosenHour?: number;
}

/**
 * Which edition, if any, a run at `now` should send. Null outside
 * [hour, hour + catchUpHours] on the wall clock of `timeZone` (UTC when
 * absent) unless forced. Forced runs before the hour anchor on `now`, so they
 * never look into the future.
 */
export function digestSchedule(
  now: Date,
  opts: { hour?: number; catchUpHours?: number; force?: boolean; timeZone?: string | null } = {}
): DigestSchedule | null {
  const timeZone = normalizeTimeZone(opts.timeZone);
  const fallbackHour = timeZone ? DEFAULT_DIGEST_LOCAL_HOUR : DEFAULT_DIGEST_HOUR_UTC;
  const hour = Number.isInteger(opts.hour) && opts.hour! >= 0 && opts.hour! <= 23 ? opts.hour! : fallbackHour;
  const requested = Number.isInteger(opts.catchUpHours) && opts.catchUpHours! >= 0 ? opts.catchUpHours! : DEFAULT_CATCHUP_HOURS;
  // Never roll past midnight: tomorrow's edition is a different day.
  const catchUp = Math.min(requested, 23 - hour);
  const zone = timeZone ?? 'UTC';
  const day = localDateIn(now, zone);
  const scheduled = zonedTimeToUtc(day, hour, zone);
  const since = now.getTime() - scheduled.getTime();
  const tag = timeZone ? { timeZone } : {};
  if (since >= 0 && since < (catchUp + 1) * HOUR_MS) return { day, anchor: scheduled, ...tag };
  if (!opts.force) return null;
  return { day, anchor: since >= 0 ? scheduled : now, ...tag };
}

export interface DigestProfile {
  id: string;
  full_name: string | null;
  notification_preferences: unknown;
  /** IANA zone (US-433); null or absent = the UTC edition. */
  timezone?: string | null;
}

export type DigestKeyDateRow = DigestKeyDate & { user_id: string };

export interface DigestAgent {
  email: string | null;
  fullName: string | null;
}

/** Everything the digest touches. Each method throws on a failed read or write. */
export interface DigestStore {
  /** Profiles with id > afterId (all when null), ordered by id. */
  listProfiles(afterId: string | null, limit: number): Promise<DigestProfile[]>;
  /** Of these agents, the ones that already have an edition dated `day`. */
  listClaimed(userIds: string[], day: string): Promise<Set<string>>;
  /** Leads created in [from, to). Page through with offset. */
  listNewLeads(userIds: string[], from: string, to: string, offset: number, limit: number): Promise<(DigestLead & { user_id: string })[]>;
  /** Open follow-up tasks due at or before `dueBy`. */
  listDueTasks(userIds: string[], dueBy: string, offset: number, limit: number): Promise<(DigestTask & { user_id: string })[]>;
  listKeyDates(userIds: string[], offset: number, limit: number): Promise<DigestKeyDateRow[]>;
  weeklyStats(userId: string, from: string, to: string): Promise<WeeklyStats>;
  /**
   * Address and name for each of these agents, in one read (US-378). An agent
   * absent from the map could not be read. Throws when the read fails.
   */
  getAgents(userIds: string[]): Promise<Map<string, DigestAgent>>;
  /** Insert into digest_log. 'duplicate' when this edition was already claimed. */
  claim(userId: string, day: string, kind: DigestKind): Promise<'claimed' | 'duplicate'>;
  /** Undo a claim after a failed send, so the next run can retry. */
  release(userId: string, day: string, kind: DigestKind): Promise<void>;
  /**
   * Whether a complete, error-free pass already ran for the edition dated
   * `day` in `slot` (digest_runs): the zone name, or '' for the UTC edition.
   */
  hasCompletedRun(day: string, slot: string): Promise<boolean>;
  /** Record that the pass for that edition completed with no errors. Idempotent. */
  markRunCompleted(day: string, slot: string, totals: { profiles: number; sent: number }): Promise<void>;
  sendEmail(mail: EmailOptions): Promise<{ ok: boolean; error?: string }>;
}

export interface DigestReport {
  sent: number;
  alreadySent: number;
  off: number;
  nothingToSend: number;
  noEmail: number;
  failed: number;
  profiles: number;
  /** Agents whose edition is not due at this hour (US-433). */
  notDue: number;
  /** Agents whose edition an earlier run already completed cleanly. */
  settled: number;
  /** True when every due edition was already completed by an earlier run. */
  skipped: boolean;
  errors: string[];
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

/** Every row a paged read returns, over every id chunk. */
async function readAll<T>(ids: string[], read: (ids: string[], offset: number, limit: number) => Promise<T[]>): Promise<T[]> {
  const out: T[] = [];
  for (const part of chunk(ids, ID_CHUNK)) {
    for (let offset = 0; ; offset += ROW_PAGE_SIZE) {
      const page = await read(part, offset, ROW_PAGE_SIZE);
      out.push(...page);
      if (page.length < ROW_PAGE_SIZE) break;
    }
  }
  return out;
}

function groupBy<T extends { user_id: string }>(rows: T[]): Map<string, T[]> {
  const out = new Map<string, T[]>();
  for (const row of rows) {
    const list = out.get(row.user_id);
    if (list) list.push(row);
    else out.set(row.user_id, [row]);
  }
  return out;
}

const short = (id: string) => id.slice(0, 8);
const message = (error: unknown) => (error instanceof Error ? error.message : String(error));

/**
 * The digest_runs slot of an edition: '' for the UTC edition, the zone for the
 * default local hour, and `zone@hour` for an hour the agent chose (US-518).
 */
export function editionSlot(schedule: DigestSchedule): string {
  if (!schedule.timeZone) return '';
  return schedule.chosenHour === undefined ? schedule.timeZone : `${schedule.timeZone}@${schedule.chosenHour}`;
}

export interface EditionWindows {
  day: string;
  anchor: Date;
  anchorIso: string;
  since24h: string;
  since7d: string;
  endOfDay: string;
  /** The date the key-date reminders count from. */
  today: Date;
  siteUrl: string;
}

export function editionWindows(schedule: DigestSchedule, siteUrl: string): EditionWindows {
  const { day, anchor, timeZone } = schedule;
  // Tasks are stored as the end of the agent's local due day (US-240). With
  // the agent's zone known, "due today" ends exactly at the end of their local
  // day. Without it, noon UTC tomorrow is the end of today in UTC-12, so every
  // US zone's "due today" is in, and no "due tomorrow" west of UTC+12 is.
  const endOfDay = timeZone
    ? new Date(zonedTimeToUtc(addDays(day, 1), 0, timeZone).getTime() - 1).toISOString()
    : `${dueCutoffDay(anchor)}T11:59:59.999Z`;
  return {
    day,
    anchor,
    anchorIso: anchor.toISOString(),
    since24h: new Date(anchor.getTime() - 24 * HOUR_MS).toISOString(),
    since7d: new Date(anchor.getTime() - 7 * 24 * HOUR_MS).toISOString(),
    endOfDay,
    // Noon UTC of the edition's own date: the same calendar date in every
    // zone the runtime might read it in, so a Sydney edition (anchored on the
    // previous UTC day) counts birthdays from Sydney's today.
    today: timeZone ? new Date(`${day}T12:00:00Z`) : anchor,
    siteUrl,
  };
}

interface Edition {
  schedule: DigestSchedule;
  windows: EditionWindows;
  /** Null until asked; true when an earlier run completed it. */
  completed: boolean | null;
  /** Any error or failure for this edition in this run: write no marker. */
  troubled: boolean;
  profiles: number;
  sent: number;
}

export async function runDigests(
  store: DigestStore,
  opts: {
    /** The UTC edition, for agents with no time zone. Null outside its window. */
    schedule: DigestSchedule | null;
    /**
     * An agent's local edition for their zone (US-433), or null when it is not
     * due. `hour` is the hour the agent chose (US-518), null for the default
     * local hour. Without it, agents with a zone get the UTC edition too.
     */
    scheduleFor?: (timeZone: string, hour: number | null) => DigestSchedule | null;
    siteUrl: string;
    /**
     * Read and write the per-edition run marker (digest_runs). True for the
     * hourly scheduled runs; false for a forced run, which always does a full
     * pass and, since it may anchor on `now` before the hour, records nothing
     * that would stop the on-time edition.
     */
    useRunMarker?: boolean;
  }
): Promise<DigestReport> {
  const useRunMarker = opts.useRunMarker === true;
  const { siteUrl, scheduleFor } = opts;
  const report: DigestReport = {
    sent: 0,
    alreadySent: 0,
    off: 0,
    nothingToSend: 0,
    noEmail: 0,
    failed: 0,
    profiles: 0,
    notDue: 0,
    settled: 0,
    skipped: false,
    errors: [],
  };

  const editions = new Map<string, Edition>();
  const editionOf = (profile: DigestProfile): Edition | null => {
    const timeZone = scheduleFor ? normalizeTimeZone(profile.timezone) : null;
    const hour = timeZone ? chosenDigestHour(profile.notification_preferences) : null;
    const local = timeZone && scheduleFor ? scheduleFor(timeZone, hour) : undefined;
    const schedule = local === undefined ? opts.schedule : local && hour !== null ? { ...local, chosenHour: hour } : local;
    if (!schedule) return null;
    const key = `${schedule.day}|${editionSlot(schedule)}`;
    let edition = editions.get(key);
    if (!edition) {
      edition = {
        schedule,
        windows: editionWindows(schedule, siteUrl),
        completed: useRunMarker ? null : false,
        troubled: false,
        profiles: 0,
        sent: 0,
      };
      editions.set(key, edition);
    }
    return edition;
  };

  const isCompleted = async (edition: Edition): Promise<boolean> => {
    if (edition.completed !== null) return edition.completed;
    try {
      edition.completed = await store.hasCompletedRun(edition.schedule.day, editionSlot(edition.schedule));
    } catch (error) {
      // Not knowing must not cost anyone their digest: do the full pass
      // (digest_log still stops a double send), say why, and record nothing.
      report.errors.push(`reading the digest run marker: ${message(error)}`);
      edition.completed = false;
      edition.troubled = true;
    }
    return edition.completed;
  };

  let afterId: string | null = null;
  for (;;) {
    // A failed profile read cannot be worked around: throw, and the next run
    // in the catch-up window starts again (digest_log skips who was sent).
    const profiles = await store.listProfiles(afterId, PROFILE_PAGE_SIZE);
    if (profiles.length === 0) break;
    afterId = profiles[profiles.length - 1].id;
    report.profiles += profiles.length;

    const byEdition = new Map<Edition, { profile: DigestProfile; kind: DigestKind }[]>();
    for (const profile of profiles) {
      const edition = editionOf(profile);
      if (!edition) {
        report.notDue++;
        continue;
      }
      if (await isCompleted(edition)) {
        report.settled++;
        continue;
      }
      edition.profiles++;
      const prefs = (profile.notification_preferences ?? {}) as { digest?: unknown };
      const kind = digestKindFor(prefs.digest, edition.schedule.day);
      if (!kind) {
        report.off++;
        continue;
      }
      const list = byEdition.get(edition);
      if (list) list.push({ profile, kind });
      else byEdition.set(edition, [{ profile, kind }]);
    }

    for (const [edition, wanted] of byEdition) {
      const before = { errors: report.errors.length, failed: report.failed, sent: report.sent };
      try {
        await sendPage(store, wanted, edition.windows, report);
      } catch (error) {
        // One page's failed read must not cost every later page its digest.
        report.errors.push(`profiles after ${short(wanted[0].profile.id)}: ${message(error)}`);
        report.failed += wanted.length;
      }
      edition.sent += report.sent - before.sent;
      if (report.errors.length > before.errors || report.failed > before.failed) edition.troubled = true;
    }

    if (profiles.length < PROFILE_PAGE_SIZE) break;
  }

  const seen = [...editions.values()];
  report.skipped = seen.length > 0 && seen.every((e) => e.completed === true);

  if (useRunMarker) {
    for (const edition of seen) {
      if (edition.completed || edition.troubled) continue;
      try {
        await store.markRunCompleted(edition.schedule.day, editionSlot(edition.schedule), {
          profiles: edition.profiles,
          sent: edition.sent,
        });
      } catch (error) {
        // Every digest went out; the next run will just do the pass again.
        report.errors.push(`recording the digest run marker: ${message(error)}`);
      }
    }
  }

  return report;
}

async function sendPage(
  store: DigestStore,
  wanted: { profile: DigestProfile; kind: DigestKind }[],
  w: EditionWindows,
  report: DigestReport
): Promise<void> {
  const ids = wanted.map((x) => x.profile.id);

  const claimed = new Set<string>();
  for (const part of chunk(ids, ID_CHUNK)) {
    for (const id of await store.listClaimed(part, w.day)) claimed.add(id);
  }
  const pending = wanted.filter((x) => {
    if (!claimed.has(x.profile.id)) return true;
    report.alreadySent++;
    return false;
  });
  if (pending.length === 0) return;

  const pendingIds = pending.map((x) => x.profile.id);
  const [leads, tasks, dates] = await Promise.all([
    readAll(pendingIds, (part, offset, limit) => store.listNewLeads(part, w.since24h, w.anchorIso, offset, limit)),
    readAll(pendingIds, (part, offset, limit) => store.listDueTasks(part, w.endOfDay, offset, limit)),
    readAll(pendingIds, (part, offset, limit) => store.listKeyDates(part, offset, limit)),
  ]);
  const leadsBy = groupBy(leads);
  const tasksBy = groupBy(tasks);
  const datesBy = groupBy(dates);

  // Decide on content first, so no address is read for an agent with nothing
  // to say; then read every remaining address in one go (US-378: this was two
  // round trips per agent).
  type Content = Omit<DigestInput, 'to' | 'agentName'>;
  const worth: { profile: DigestProfile; kind: DigestKind; content: Content }[] = [];
  for (const { profile, kind } of pending) {
    try {
      const weekly = kind === 'weekly' ? await store.weeklyStats(profile.id, w.since7d, w.anchorIso) : undefined;
      const content: Content = {
        siteUrl: w.siteUrl,
        newLeads: leadsBy.get(profile.id) ?? [],
        dueTasks: tasksBy.get(profile.id) ?? [],
        keyDates: datesBy.get(profile.id) ?? [],
        weekly,
        today: w.today,
      };
      if (!buildDigest({ ...content, to: 'check@invalid', agentName: 'there' })) {
        report.nothingToSend++;
        continue;
      }
      worth.push({ profile, kind, content });
    } catch (error) {
      report.failed++;
      report.errors.push(`agent ${short(profile.id)}: ${message(error)}`);
    }
  }
  if (worth.length === 0) return;

  const agents = new Map<string, DigestAgent>();
  const readFailed = new Set<string>();
  for (const part of chunk(worth.map((x) => x.profile.id), ID_CHUNK)) {
    try {
      for (const [id, agent] of await store.getAgents(part)) agents.set(id, agent);
    } catch (error) {
      // One error for the chunk; its agents count as failed below. Nothing
      // was claimed, so the next run retries them.
      for (const id of part) readFailed.add(id);
      report.errors.push(`reading the addresses of ${part.length} agents: ${message(error)}`);
    }
  }

  for (const { profile, kind, content } of worth) {
    try {
      const agent = agents.get(profile.id);
      if (!agent) {
        report.failed++;
        if (!readFailed.has(profile.id)) report.errors.push(`agent ${short(profile.id)} could not be read`);
        continue;
      }
      if (!agent.email) {
        report.noEmail++;
        continue;
      }
      const mail = buildDigest({ ...content, to: agent.email, agentName: agent.fullName || profile.full_name || 'there' });
      if (!mail) {
        report.nothingToSend++;
        continue;
      }

      // Claim first; the primary key makes a second run a no-op.
      if ((await store.claim(profile.id, w.day, kind)) === 'duplicate') {
        report.alreadySent++;
        continue;
      }
      const result = await store.sendEmail(mail);
      if (result.ok) {
        report.sent++;
        continue;
      }
      report.failed++;
      report.errors.push(`email to agent ${short(profile.id)} failed: ${result.error ?? 'unknown'}`);
      try {
        await store.release(profile.id, w.day, kind);
      } catch (error) {
        report.errors.push(`agent ${short(profile.id)} will miss today's digest: releasing the claim failed: ${message(error)}`);
      }
    } catch (error) {
      report.failed++;
      report.errors.push(`agent ${short(profile.id)}: ${message(error)}`);
    }
  }
}

export function summarizeDigestReport(report: DigestReport): string {
  if (report.skipped) return 'already completed today';
  return (
    `sent ${report.sent}, already sent ${report.alreadySent}, nothing to send ${report.nothingToSend}, ` +
    `off ${report.off}, no email ${report.noEmail}, not due ${report.notDue}, settled ${report.settled}, ` +
    `failed ${report.failed} (of ${report.profiles} profiles)`
  );
}
