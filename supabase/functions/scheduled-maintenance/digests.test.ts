import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  chosenDigestHour,
  digestKindFor,
  digestSchedule,
  dueCutoffDay,
  editionSlot,
  editionWindows,
  runDigests,
  summarizeDigestReport,
  ID_CHUNK,
  PROFILE_PAGE_SIZE,
  ROW_PAGE_SIZE,
  type DigestKind,
  type DigestProfile,
  type DigestStore,
} from './digests.ts';

describe('digestKindFor (US-230)', () => {
  const monday = new Date('2026-10-05T13:00:00Z');
  const tuesday = new Date('2026-10-06T13:00:00Z');
  it('daily by default, and the weekly edition on Mondays', () => {
    expect(digestKindFor(undefined, tuesday)).toBe('daily');
    expect(digestKindFor(undefined, monday)).toBe('weekly');
  });
  it('weekly subscribers hear only on Mondays', () => {
    expect(digestKindFor('weekly', tuesday)).toBeNull();
    expect(digestKindFor('weekly', monday)).toBe('weekly');
  });
  it('off is off', () => {
    expect(digestKindFor('off', monday)).toBeNull();
  });
});

describe('dueCutoffDay (US-240)', () => {
  it('is the UTC day after the digest runs', () => {
    expect(dueCutoffDay(new Date('2026-10-28T13:00:00Z'))).toBe('2026-10-29');
    expect(dueCutoffDay(new Date('2026-12-31T13:00:00Z'))).toBe('2027-01-01');
  });

  it('takes in a task due today in Los Angeles, stored as the end of the local day', () => {
    const cutoff = `${dueCutoffDay(new Date('2026-10-28T13:00:00Z'))}T11:59:59.999Z`;
    // Due 28 Oct in LA → 2026-10-29T06:59:59.999Z; due 29 Oct in London → 23:59:59.999Z.
    expect('2026-10-29T06:59:59.999Z' <= cutoff).toBe(true);
    expect('2026-10-29T23:59:59.999Z' <= cutoff).toBe(false);
  });
});

describe('digestSchedule (US-331)', () => {
  const at = (iso: string) => new Date(iso);
  const scheduled = at('2026-11-10T13:00:00Z');

  it('sends from the digest hour, anchored to it', () => {
    expect(digestSchedule(at('2026-11-10T13:04:00Z'))).toEqual({ day: '2026-11-10', anchor: scheduled });
  });

  it('a run hours late is a catch-up with the same anchor, so it covers the same leads', () => {
    expect(digestSchedule(at('2026-11-10T16:30:00Z'))).toEqual({ day: '2026-11-10', anchor: scheduled });
    expect(digestSchedule(at('2026-11-10T19:59:59Z'))).toEqual({ day: '2026-11-10', anchor: scheduled });
  });

  it('nothing before the hour or after the catch-up window', () => {
    expect(digestSchedule(at('2026-11-10T12:59:00Z'))).toBeNull();
    expect(digestSchedule(at('2026-11-10T20:00:00Z'))).toBeNull();
  });

  it('honours the configured hour and window, and never rolls into tomorrow', () => {
    expect(digestSchedule(at('2026-11-10T09:30:00Z'), { hour: 9, catchUpHours: 0 })).not.toBeNull();
    expect(digestSchedule(at('2026-11-10T10:00:00Z'), { hour: 9, catchUpHours: 0 })).toBeNull();
    expect(digestSchedule(at('2026-11-11T00:30:00Z'), { hour: 22, catchUpHours: 6 })).toBeNull();
    expect(digestSchedule(at('2026-11-10T23:30:00Z'), { hour: 22, catchUpHours: 6 })?.day).toBe('2026-11-10');
  });

  it('falls back to the defaults on an unparsable setting', () => {
    expect(digestSchedule(at('2026-11-10T13:10:00Z'), { hour: Number.NaN, catchUpHours: Number.NaN })?.anchor).toEqual(scheduled);
  });

  it('force runs outside the window; before the hour it anchors on now', () => {
    const early = at('2026-11-10T08:00:00Z');
    expect(digestSchedule(early, { force: true })).toEqual({ day: '2026-11-10', anchor: early });
    expect(digestSchedule(at('2026-11-10T22:00:00Z'), { force: true })?.anchor).toEqual(scheduled);
  });
});

// ---------------------------------------------------------------------------
// runDigests against an in-memory store that behaves like the database.
// ---------------------------------------------------------------------------

const SCHEDULE = { day: '2026-11-10', anchor: new Date('2026-11-10T13:00:00Z') }; // a Tuesday
const SITE = 'https://agentbio.net';
const HOUR = 3_600_000;

/** digest_runs key: the UTC edition keeps the bare date. */
const runKey = (day: string, slot: string) => (slot === '' ? day : `${day}|${slot}`);
const uid = (n: number) => `00000000-0000-0000-0000-${String(n).padStart(12, '0')}`;
const hoursBefore = (h: number) => new Date(SCHEDULE.anchor.getTime() - h * HOUR).toISOString();

interface MemoryLead {
  id: string;
  user_id: string;
  name: string;
  lead_type: string | null;
  created_at: string;
}

function memoryStore(opts: {
  profiles: DigestProfile[];
  leads?: MemoryLead[];
  emails?: Record<string, string | null>;
  log?: { user_id: string; digest_date: string; kind: DigestKind }[];
  failSendFor?: Set<string>;
  failRelease?: boolean;
  failLeadsReadOnce?: boolean;
  failWeekly?: boolean;
  failMarkerRead?: boolean;
  failMarkerWrite?: boolean;
  failAgentsRead?: boolean;
}) {
  const log = [...(opts.log ?? [])];
  const runs = new Map<string, { profiles: number; sent: number }>();
  const sent: { to: string; subject: string; body: string }[] = [];
  const calls = { listProfiles: 0, listNewLeads: 0, listClaimed: 0, getAgents: 0, agentIdsRead: 0, maxIds: 0, markerReads: 0 };
  let leadsReadFailures = opts.failLeadsReadOnce ? 1 : 0;
  const sorted = [...opts.profiles].sort((a, b) => a.id.localeCompare(b.id));

  const store: DigestStore = {
    async listProfiles(afterId, limit) {
      calls.listProfiles++;
      return sorted.filter((p) => afterId === null || p.id > afterId).slice(0, limit);
    },
    async listClaimed(userIds, day) {
      calls.listClaimed++;
      calls.maxIds = Math.max(calls.maxIds, userIds.length);
      return new Set(log.filter((r) => r.digest_date === day && userIds.includes(r.user_id)).map((r) => r.user_id));
    },
    async listNewLeads(userIds, from, to, offset, limit) {
      calls.listNewLeads++;
      calls.maxIds = Math.max(calls.maxIds, userIds.length);
      if (leadsReadFailures > 0) {
        leadsReadFailures--;
        throw new Error('reading new leads: timeout');
      }
      return (opts.leads ?? [])
        .filter((l) => userIds.includes(l.user_id) && l.created_at >= from && l.created_at < to)
        .slice(offset, offset + limit);
    },
    async listDueTasks() {
      return [];
    },
    async listKeyDates() {
      return [];
    },
    async weeklyStats() {
      if (opts.failWeekly) throw new Error('weekly numbers: boom');
      return { views: 0, leads: 0, linkClicks: 0 };
    },
    async getAgents(userIds) {
      calls.getAgents++;
      calls.agentIdsRead += userIds.length;
      calls.maxIds = Math.max(calls.maxIds, userIds.length);
      if (opts.failAgentsRead) throw new Error('reading agent contacts: timeout');
      const found = new Map<string, { email: string | null; fullName: string | null }>();
      for (const userId of userIds) {
        const email = opts.emails ? opts.emails[userId] : `${userId.slice(-4)}@example.com`;
        if (email !== undefined) found.set(userId, { email, fullName: null });
      }
      return found;
    },
    async claim(userId, day, kind) {
      if (log.some((r) => r.user_id === userId && r.digest_date === day && r.kind === kind)) return 'duplicate';
      log.push({ user_id: userId, digest_date: day, kind });
      return 'claimed';
    },
    async release(userId, day, kind) {
      if (opts.failRelease) throw new Error('delete refused');
      const i = log.findIndex((r) => r.user_id === userId && r.digest_date === day && r.kind === kind);
      if (i >= 0) log.splice(i, 1);
    },
    async hasCompletedRun(day, slot) {
      calls.markerReads++;
      if (opts.failMarkerRead) throw new Error('digest_runs: timeout');
      return runs.has(runKey(day, slot));
    },
    async markRunCompleted(day, slot, totals) {
      if (opts.failMarkerWrite) throw new Error('digest_runs: insert refused');
      if (!runs.has(runKey(day, slot))) runs.set(runKey(day, slot), totals);
    },
    async sendEmail(mail) {
      if (opts.failSendFor?.has(mail.to)) return { ok: false, error: 'resend 500' };
      sent.push({ to: mail.to, subject: mail.subject, body: mail.body });
      return { ok: true };
    },
  };
  return { store, log, sent, calls, runs };
}

const profile = (n: number, digest?: string): DigestProfile => ({
  id: uid(n),
  full_name: `Agent ${n}`,
  notification_preferences: digest ? { digest } : null,
});
const leadFor = (n: number, hoursAgo = 2, i = 0): MemoryLead => ({
  id: `lead-${n}-${i}`,
  user_id: uid(n),
  name: `Buyer ${n}`,
  lead_type: 'buyer',
  created_at: hoursBefore(hoursAgo),
});

describe('runDigests (US-331)', () => {
  it('sends to every agent past the 5,000th profile', async () => {
    const count = 5_200;
    const profiles = Array.from({ length: count }, (_, i) => profile(i + 1));
    const leads = profiles.map((_, i) => leadFor(i + 1));
    const { store, sent, calls } = memoryStore({ profiles, leads });

    const report = await runDigests(store, { schedule: SCHEDULE, siteUrl: SITE });

    expect(report.sent).toBe(count);
    expect(report.profiles).toBe(count);
    expect(sent.some((m) => m.to === `${uid(count).slice(-4)}@example.com`)).toBe(true);
    expect(calls.listProfiles).toBe(Math.ceil(count / PROFILE_PAGE_SIZE));
    expect(calls.maxIds).toBeLessThanOrEqual(100);
  });

  it('reads an agent’s leads past the first page instead of dropping them', async () => {
    const leads = Array.from({ length: ROW_PAGE_SIZE + 5 }, (_, i) => leadFor(1, 1, i));
    const { store, sent } = memoryStore({ profiles: [profile(1)], leads });
    await runDigests(store, { schedule: SCHEDULE, siteUrl: SITE });
    expect(sent).toHaveLength(1);
    expect(sent[0].body).toContain(`New leads (${ROW_PAGE_SIZE + 5})`);
  });

  it('a missed run is caught up exactly once', async () => {
    const env = memoryStore({ profiles: [profile(1), profile(2)], leads: [leadFor(1), leadFor(2)] });
    const lateRun = digestSchedule(new Date('2026-11-10T15:00:00Z'))!;
    const first = await runDigests(env.store, { schedule: lateRun, siteUrl: SITE });
    const second = await runDigests(env.store, { schedule: digestSchedule(new Date('2026-11-10T16:00:00Z'))!, siteUrl: SITE });

    expect(first.sent).toBe(2);
    expect(second.sent).toBe(0);
    expect(second.alreadySent).toBe(2);
    expect(env.sent).toHaveLength(2);
    expect(env.log).toHaveLength(2);
  });

  it('a late run covers leads up to the scheduled hour, not up to when it ran', async () => {
    // Arrived after 13:00: tomorrow's edition, not today's late one.
    const env = memoryStore({ profiles: [profile(1)], leads: [{ ...leadFor(1), created_at: '2026-11-10T14:00:00.000Z' }] });
    const report = await runDigests(env.store, { schedule: digestSchedule(new Date('2026-11-10T15:00:00Z'))!, siteUrl: SITE });
    expect(report.nothingToSend).toBe(1);
    expect(env.sent).toHaveLength(0);
  });

  it('skips agents already sent today without looking them up again', async () => {
    const env = memoryStore({
      profiles: [profile(1), profile(2)],
      leads: [leadFor(1), leadFor(2)],
      log: [{ user_id: uid(1), digest_date: SCHEDULE.day, kind: 'daily' }],
    });
    const report = await runDigests(env.store, { schedule: SCHEDULE, siteUrl: SITE });
    expect(report.sent).toBe(1);
    expect(report.alreadySent).toBe(1);
    expect(env.calls.agentIdsRead).toBe(1);
  });

  it('does not look up the address of an agent with nothing to say', async () => {
    const env = memoryStore({ profiles: [profile(1), profile(2, 'off')] });
    const report = await runDigests(env.store, { schedule: SCHEDULE, siteUrl: SITE });
    expect(report.nothingToSend).toBe(1);
    expect(report.off).toBe(1);
    expect(env.calls.getAgents).toBe(0);
  });

  it('one page’s failed read is an error, and later pages still send', async () => {
    const profiles = Array.from({ length: PROFILE_PAGE_SIZE + 3 }, (_, i) => profile(i + 1));
    const leads = profiles.map((_, i) => leadFor(i + 1));
    const env = memoryStore({ profiles, leads, failLeadsReadOnce: true });
    const report = await runDigests(env.store, { schedule: SCHEDULE, siteUrl: SITE });

    expect(report.failed).toBe(PROFILE_PAGE_SIZE);
    expect(report.sent).toBe(3);
    expect(report.errors[0]).toMatch(/timeout/);

    // The next run in the window makes up the failed page, and only it.
    const retry = await runDigests(env.store, { schedule: SCHEDULE, siteUrl: SITE });
    expect(retry.sent).toBe(PROFILE_PAGE_SIZE);
    expect(retry.alreadySent).toBe(3);
  });

  it('a failed send releases the claim so the next run retries', async () => {
    const env = memoryStore({ profiles: [profile(1)], leads: [leadFor(1)], failSendFor: new Set([`${uid(1).slice(-4)}@example.com`]) });
    const report = await runDigests(env.store, { schedule: SCHEDULE, siteUrl: SITE });
    expect(report.failed).toBe(1);
    expect(report.errors[0]).toMatch(/resend 500/);
    expect(env.log).toHaveLength(0);
  });

  it('says so when releasing the claim fails, since that agent misses today', async () => {
    const env = memoryStore({
      profiles: [profile(1)],
      leads: [leadFor(1)],
      failSendFor: new Set([`${uid(1).slice(-4)}@example.com`]),
      failRelease: true,
    });
    const report = await runDigests(env.store, { schedule: SCHEDULE, siteUrl: SITE });
    expect(report.errors.some((e) => /miss today's digest/.test(e))).toBe(true);
  });

  it('a failed weekly count is an error, not a zero', async () => {
    const monday = { day: '2026-11-09', anchor: new Date('2026-11-09T13:00:00Z') };
    const env = memoryStore({
      profiles: [profile(1)],
      leads: [{ ...leadFor(1), created_at: '2026-11-09T10:00:00.000Z' }],
      failWeekly: true,
    });
    const report = await runDigests(env.store, { schedule: monday, siteUrl: SITE });
    expect(report.failed).toBe(1);
    expect(report.sent).toBe(0);
    expect(report.errors[0]).toMatch(/weekly numbers/);
  });

  it('an agent that cannot be read is a failure; one with no address is not', async () => {
    const env = memoryStore({
      profiles: [profile(1), profile(2)],
      leads: [leadFor(1), leadFor(2)],
      emails: { [uid(2)]: null },
    });
    const report = await runDigests(env.store, { schedule: SCHEDULE, siteUrl: SITE });
    expect(report.failed).toBe(1);
    expect(report.noEmail).toBe(1);
    expect(summarizeDigestReport(report)).toContain('failed 1 (of 2 profiles)');
  });
});

describe('runDigests address lookup (US-378)', () => {
  it('reads a page of agents’ addresses in one call per chunk, not one per agent', async () => {
    const profiles = Array.from({ length: 250 }, (_, i) => profile(i + 1));
    const leads = profiles.map((_, i) => leadFor(i + 1));
    const env = memoryStore({ profiles, leads });
    const report = await runDigests(env.store, { schedule: SCHEDULE, siteUrl: SITE });

    expect(report.sent).toBe(250);
    expect(env.calls.getAgents).toBe(Math.ceil(250 / ID_CHUNK));
    expect(env.calls.agentIdsRead).toBe(250);
    expect(env.calls.maxIds).toBeLessThanOrEqual(ID_CHUNK);
  });

  it('a failed address read is one error, claims nothing, and the next run sends', async () => {
    const env = memoryStore({ profiles: [profile(1), profile(2)], leads: [leadFor(1), leadFor(2)], failAgentsRead: true });
    const report = await runDigests(env.store, { schedule: SCHEDULE, siteUrl: SITE });
    expect(report.failed).toBe(2);
    expect(report.sent).toBe(0);
    expect(report.errors).toEqual(['reading the addresses of 2 agents: reading agent contacts: timeout']);
    expect(env.log).toHaveLength(0);

    const healthy = memoryStore({ profiles: [profile(1), profile(2)], leads: [leadFor(1), leadFor(2)] });
    expect((await runDigests(healthy.store, { schedule: SCHEDULE, siteUrl: SITE })).sent).toBe(2);
  });

  it('the store reads addresses in bulk, never per agent', () => {
    const store = readFileSync(resolve(__dirname, 'digest-store.ts'), 'utf8');
    expect(store).toMatch(/getAgentContacts\(supabase, userIds\)/);
    expect(store).not.toMatch(/getAgentContact\(/);
  });
});

describe('runDigests per-day run marker (US-354)', () => {
  const marked = { schedule: SCHEDULE, siteUrl: SITE, useRunMarker: true };

  it('after one complete pass, later runs that day read none of its agents’ rows', async () => {
    const env = memoryStore({ profiles: [profile(1), profile(2)], leads: [leadFor(1)] });
    const first = await runDigests(env.store, marked);
    expect(first.sent).toBe(1);
    expect(first.nothingToSend).toBe(1);
    expect(env.runs.get(SCHEDULE.day)).toEqual({ profiles: 2, sent: 1 });

    const claimedReads = env.calls.listClaimed;
    const later = await runDigests(env.store, { ...marked, schedule: digestSchedule(new Date('2026-11-10T16:00:00Z'))! });
    expect(later.skipped).toBe(true);
    // US-433: the profile ids and zones are paged every run (some zone's
    // edition is due most hours), but a settled edition reads nothing else.
    expect(later.settled).toBe(2);
    expect(env.calls.listClaimed).toBe(claimedReads);
    expect(env.calls.listNewLeads).toBe(1);
    expect(env.calls.markerReads).toBe(2);
    expect(summarizeDigestReport(later)).toBe('already completed today');
  });

  it('a pass that ended with errors does not write the marker, so the next run retries', async () => {
    const profiles = Array.from({ length: PROFILE_PAGE_SIZE + 3 }, (_, i) => profile(i + 1));
    const leads = profiles.map((_, i) => leadFor(i + 1));
    const env = memoryStore({ profiles, leads, failLeadsReadOnce: true });

    const first = await runDigests(env.store, marked);
    expect(first.errors.length).toBeGreaterThan(0);
    expect(env.runs.size).toBe(0);

    const retry = await runDigests(env.store, marked);
    expect(retry.skipped).toBe(false);
    expect(retry.sent).toBe(PROFILE_PAGE_SIZE);
    expect(retry.errors).toEqual([]);
    expect(env.runs.has(SCHEDULE.day)).toBe(true);
  });

  it('a failed send is a failure too: no marker', async () => {
    const env = memoryStore({ profiles: [profile(1)], leads: [leadFor(1)], failSendFor: new Set([`${uid(1).slice(-4)}@example.com`]) });
    await runDigests(env.store, marked);
    expect(env.runs.size).toBe(0);
  });

  it('the marker is per day: tomorrow’s edition still runs', async () => {
    const env = memoryStore({ profiles: [profile(1)], leads: [leadFor(1)] });
    await runDigests(env.store, marked);
    const tomorrow = { day: '2026-11-11', anchor: new Date('2026-11-11T13:00:00Z') };
    const next = await runDigests(env.store, { ...marked, schedule: tomorrow });
    expect(next.skipped).toBe(false);
    expect(next.profiles).toBe(1);
  });

  it('a run without the marker (a forced run) neither skips nor records', async () => {
    const env = memoryStore({ profiles: [profile(1)], leads: [leadFor(1)] });
    await runDigests(env.store, marked);
    const forced = await runDigests(env.store, { schedule: SCHEDULE, siteUrl: SITE });
    expect(forced.skipped).toBe(false);
    expect(forced.alreadySent).toBe(1);

    const fresh = memoryStore({ profiles: [profile(1)], leads: [leadFor(1)] });
    await runDigests(fresh.store, { schedule: SCHEDULE, siteUrl: SITE });
    expect(fresh.runs.size).toBe(0);
  });

  it('an unreadable marker still sends everyone, reports it, and records nothing', async () => {
    const env = memoryStore({ profiles: [profile(1)], leads: [leadFor(1)], failMarkerRead: true });
    const report = await runDigests(env.store, marked);
    expect(report.sent).toBe(1);
    expect(report.errors[0]).toMatch(/run marker/);
    expect(env.runs.size).toBe(0);
  });

  it('a failed marker write is reported after every digest went out', async () => {
    const env = memoryStore({ profiles: [profile(1)], leads: [leadFor(1)], failMarkerWrite: true });
    const report = await runDigests(env.store, marked);
    expect(report.sent).toBe(1);
    expect(report.errors).toEqual(['recording the digest run marker: digest_runs: insert refused']);
  });
});

describe('scheduled-maintenance wiring (US-331)', () => {
  const index = readFileSync(resolve(__dirname, 'index.ts'), 'utf8');
  const store = readFileSync(resolve(__dirname, 'digest-store.ts'), 'utf8');

  it('runs through the catch-up schedule and fails the task on errors', () => {
    expect(index).toMatch(/digestSchedule\(/);
    expect(index).toMatch(/DIGEST_CATCHUP_HOURS/);
    expect(index).toMatch(/report\.errors\.length > 0/);
  });

  it('hourly runs use the run marker and forced runs do not (US-354)', () => {
    expect(index).toMatch(/useRunMarker: body\.force_digest !== true/);
    expect(store).toMatch(/from\('digest_runs'\)/);
  });

  it('no read in the store is capped by a bare limit', () => {
    expect(store).not.toMatch(/\.limit\(\s*\d/);
  });

  it('agents with a zone get their own local edition (US-433)', () => {
    expect(index).toMatch(/scheduleFor: \(timeZone, hour\) =>\s*digestSchedule\(now, \{ hour: hour \?\? localHour,[^}]*timeZone \}\)/);
    expect(index).toMatch(/DIGEST_LOCAL_HOUR/);
    expect(index).not.toMatch(/outside the digest window/);
    expect(store).toMatch(/notification_preferences, timezone/);
    expect(store).toMatch(/onConflict: 'digest_date,slot'/);
  });
});

// ---------------------------------------------------------------------------
// US-433 (US-343): each agent's edition at their own local hour.
// ---------------------------------------------------------------------------

describe('digestSchedule in an agent’s time zone (US-433)', () => {
  const at = (iso: string) => new Date(iso);

  it('is due from 07:00 on the agent’s own clock, dated by their own day', () => {
    // 10 Nov 2026: Los Angeles is PST (UTC-8), London GMT, Sydney AEDT (UTC+11).
    expect(digestSchedule(at('2026-11-10T15:00:00Z'), { timeZone: 'America/Los_Angeles' })).toEqual({
      day: '2026-11-10',
      anchor: at('2026-11-10T15:00:00Z'),
      timeZone: 'America/Los_Angeles',
    });
    expect(digestSchedule(at('2026-11-10T14:59:00Z'), { timeZone: 'America/Los_Angeles' })).toBeNull();
    expect(digestSchedule(at('2026-11-10T07:20:00Z'), { timeZone: 'Europe/London' })?.anchor).toEqual(at('2026-11-10T07:00:00Z'));
    expect(digestSchedule(at('2026-11-10T20:00:00Z'), { timeZone: 'Australia/Sydney' })).toEqual({
      day: '2026-11-11',
      anchor: at('2026-11-10T20:00:00Z'),
      timeZone: 'Australia/Sydney',
    });
  });

  it('follows daylight saving: 07:00 in London is 06:00Z in summer', () => {
    expect(digestSchedule(at('2026-07-01T06:00:00Z'), { timeZone: 'Europe/London' })?.anchor).toEqual(at('2026-07-01T06:00:00Z'));
    expect(digestSchedule(at('2026-07-01T05:59:00Z'), { timeZone: 'Europe/London' })).toBeNull();
  });

  it('an unusable zone is the UTC edition', () => {
    expect(digestSchedule(at('2026-11-10T13:05:00Z'), { timeZone: 'Mars/Olympus_Mons' })).toEqual({
      day: '2026-11-10',
      anchor: at('2026-11-10T13:00:00Z'),
    });
  });
});

describe('editionWindows (US-433)', () => {
  it('a zoned edition’s “due today” ends at the end of the agent’s local day', () => {
    const sydney = digestSchedule(new Date('2026-11-10T20:00:00Z'), { timeZone: 'Australia/Sydney' })!;
    // Under the UTC cutoff (2026-11-11T11:59:59.999Z) a task due 11 Nov in
    // Sydney, stored as 12:59:59.999Z, was left out of that morning's email.
    expect(editionWindows(sydney, SITE).endOfDay).toBe('2026-11-11T12:59:59.999Z');
    const la = digestSchedule(new Date('2026-11-10T15:00:00Z'), { timeZone: 'America/Los_Angeles' })!;
    expect(editionWindows(la, SITE).endOfDay).toBe('2026-11-11T07:59:59.999Z');
  });

  it('the UTC edition keeps the broad cutoff and its slot is empty', () => {
    expect(editionWindows(SCHEDULE, SITE).endOfDay).toBe('2026-11-11T11:59:59.999Z');
    expect(editionSlot(SCHEDULE)).toBe('');
    expect(editionSlot({ ...SCHEDULE, timeZone: 'Europe/London' })).toBe('Europe/London');
  });
});

describe('runDigests with local editions (US-433)', () => {
  const zoned = (n: number, timezone: string | null): DigestProfile => ({ ...profile(n), timezone });
  const leadAt = (n: number, iso: string): MemoryLead => ({
    id: `lead-${n}`,
    user_id: uid(n),
    name: `Buyer ${n}`,
    lead_type: 'buyer',
    created_at: iso,
  });
  const email = (n: number) => `${uid(n).slice(-4)}@example.com`;

  /** Hourly runs from `fromIso`, wired as index.ts wires them; who was sent at which hour. */
  async function hourly(env: ReturnType<typeof memoryStore>, fromIso: string, hours: number, skip: Set<number> = new Set()) {
    const sentAt: Record<string, string> = {};
    for (let h = 0; h < hours; h++) {
      if (skip.has(h)) continue;
      const now = new Date(new Date(fromIso).getTime() + h * HOUR);
      const before = env.sent.length;
      const report = await runDigests(env.store, {
        schedule: digestSchedule(now),
        scheduleFor: (timeZone, hour) => digestSchedule(now, { hour: hour ?? undefined, timeZone }),
        siteUrl: SITE,
        useRunMarker: true,
      });
      expect(report.errors).toEqual([]);
      for (const mail of env.sent.slice(before)) sentAt[mail.to] = now.toISOString().slice(11, 16);
    }
    return sentAt;
  }

  it('Los Angeles, London and an agent with no zone each get it at their own hour, once', async () => {
    const env = memoryStore({
      profiles: [zoned(1, 'America/Los_Angeles'), zoned(2, 'Europe/London'), zoned(3, null)],
      leads: [leadAt(1, '2026-11-10T06:00:00Z'), leadAt(2, '2026-11-10T06:00:00Z'), leadAt(3, '2026-11-10T06:00:00Z')],
    });
    const sentAt = await hourly(env, '2026-11-10T00:00:00Z', 24);
    expect(sentAt).toEqual({ [email(1)]: '15:00', [email(2)]: '07:00', [email(3)]: '13:00' });
    expect(env.sent).toHaveLength(3);
    expect(env.runs.get('2026-11-10|America/Los_Angeles')).toEqual({ profiles: 1, sent: 1 });
    expect(env.runs.get('2026-11-10|Europe/London')).toEqual({ profiles: 1, sent: 1 });
    expect(env.runs.get('2026-11-10')).toEqual({ profiles: 1, sent: 1 });
  });

  it('a missed run is caught up exactly once per local day', async () => {
    const env = memoryStore({ profiles: [zoned(1, 'America/Los_Angeles')], leads: [leadAt(1, '2026-11-10T06:00:00Z')] });
    // Skip the 15:00Z run (07:00 in Los Angeles); the 16:00Z run sends.
    const sentAt = await hourly(env, '2026-11-10T00:00:00Z', 24, new Set([15]));
    expect(sentAt).toEqual({ [email(1)]: '16:00' });
    expect(env.log).toEqual([{ user_id: uid(1), digest_date: '2026-11-10', kind: 'daily' }]);
  });

  it('Sydney’s edition is dated, and weekly, by Sydney’s calendar', async () => {
    // 07:00 on Monday 9 Nov in Sydney is 20:00Z on Sunday 8 Nov.
    const env = memoryStore({ profiles: [zoned(1, 'Australia/Sydney')], leads: [leadAt(1, '2026-11-08T10:00:00Z')] });
    const sentAt = await hourly(env, '2026-11-08T12:00:00Z', 12);
    expect(sentAt).toEqual({ [email(1)]: '20:00' });
    expect(env.log).toEqual([{ user_id: uid(1), digest_date: '2026-11-09', kind: 'weekly' }]);
  });

  it('without scheduleFor every agent gets the UTC edition, as before', async () => {
    const env = memoryStore({ profiles: [zoned(1, 'America/Los_Angeles')], leads: [leadFor(1)] });
    const report = await runDigests(env.store, { schedule: SCHEDULE, siteUrl: SITE });
    expect(report.sent).toBe(1);
    expect(env.log[0].digest_date).toBe(SCHEDULE.day);
  });

  it('an agent whose edition is not due is counted, and nothing of theirs is read', async () => {
    const env = memoryStore({ profiles: [zoned(1, 'Australia/Sydney')], leads: [leadFor(1)] });
    const report = await runDigests(env.store, {
      schedule: SCHEDULE,
      scheduleFor: (timeZone) => digestSchedule(SCHEDULE.anchor, { timeZone }),
      siteUrl: SITE,
      useRunMarker: true,
    });
    expect(report.notDue).toBe(1);
    expect(report.sent).toBe(0);
    expect(env.calls.listClaimed).toBe(0);
    expect(env.runs.size).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// US-518 (US-445): the agent chooses the morning email's hour.
// ---------------------------------------------------------------------------

describe('chosenDigestHour (US-518)', () => {
  it('accepts a whole hour from 5 to 10', () => {
    for (const h of [5, 6, 7, 8, 9, 10]) expect(chosenDigestHour({ digest_hour: h })).toBe(h);
  });

  it('anything else is no choice', () => {
    for (const v of [4, 11, 7.5, '8', null, undefined, Number.NaN]) {
      expect(chosenDigestHour({ digest_hour: v })).toBeNull();
    }
    expect(chosenDigestHour(null)).toBeNull();
    expect(chosenDigestHour('8')).toBeNull();
    expect(chosenDigestHour({})).toBeNull();
  });
});

describe('runDigests at the hour the agent chose (US-518)', () => {
  const agent = (n: number, timezone: string | null, prefs: Record<string, unknown> | null): DigestProfile => ({
    id: uid(n),
    full_name: `Agent ${n}`,
    notification_preferences: prefs,
    timezone,
  });
  const email = (n: number) => `${uid(n).slice(-4)}@example.com`;
  const leadAt = (n: number, iso: string): MemoryLead => ({
    id: `lead-${n}`,
    user_id: uid(n),
    name: `Buyer ${n}`,
    lead_type: 'buyer',
    created_at: iso,
  });

  /** Hourly runs from `fromIso`, wired as index.ts wires them; who was sent at which hour. */
  async function hourly(env: ReturnType<typeof memoryStore>, fromIso: string, hours: number) {
    const sentAt: Record<string, string> = {};
    for (let h = 0; h < hours; h++) {
      const now = new Date(new Date(fromIso).getTime() + h * HOUR);
      const before = env.sent.length;
      const report = await runDigests(env.store, {
        schedule: digestSchedule(now),
        scheduleFor: (timeZone, hour) => digestSchedule(now, { hour: hour ?? undefined, timeZone }),
        siteUrl: SITE,
        useRunMarker: true,
      });
      expect(report.errors).toEqual([]);
      for (const mail of env.sent.slice(before)) sentAt[mail.to] = now.toISOString().slice(11, 16);
    }
    return sentAt;
  }

  it('London agents at 5am, 9am and the default 7am each get it at their own hour, once', async () => {
    const env = memoryStore({
      profiles: [
        agent(1, 'Europe/London', { digest_hour: 5 }),
        agent(2, 'Europe/London', { digest_hour: 9 }),
        agent(3, 'Europe/London', null),
      ],
      leads: [1, 2, 3].map((n) => leadAt(n, '2026-11-10T02:00:00Z')),
    });
    const sentAt = await hourly(env, '2026-11-10T00:00:00Z', 24);
    expect(sentAt).toEqual({ [email(1)]: '05:00', [email(2)]: '09:00', [email(3)]: '07:00' });
    expect(env.sent).toHaveLength(3);
    // Each hour is its own edition; the default keeps the bare zone slot.
    expect(env.runs.get('2026-11-10|Europe/London@5')).toEqual({ profiles: 1, sent: 1 });
    expect(env.runs.get('2026-11-10|Europe/London@9')).toEqual({ profiles: 1, sent: 1 });
    expect(env.runs.get('2026-11-10|Europe/London')).toEqual({ profiles: 1, sent: 1 });
  });

  it('a chosen hour follows the agent’s zone: 8am in Los Angeles is 16:00Z in November', async () => {
    const env = memoryStore({
      profiles: [agent(1, 'America/Los_Angeles', { digest_hour: 8 })],
      leads: [leadAt(1, '2026-11-10T06:00:00Z')],
    });
    expect(await hourly(env, '2026-11-10T00:00:00Z', 24)).toEqual({ [email(1)]: '16:00' });
  });

  it('is ignored for an agent with no time zone: they keep the UTC edition', async () => {
    const env = memoryStore({
      profiles: [agent(1, null, { digest_hour: 5 })],
      leads: [leadAt(1, '2026-11-10T02:00:00Z')],
    });
    expect(await hourly(env, '2026-11-10T00:00:00Z', 24)).toEqual({ [email(1)]: '13:00' });
    expect(env.runs.get('2026-11-10')).toEqual({ profiles: 1, sent: 1 });
  });

  it('an hour outside 5 to 10 is the default local hour', async () => {
    const env = memoryStore({
      profiles: [agent(1, 'Europe/London', { digest_hour: 3 })],
      leads: [leadAt(1, '2026-11-10T01:00:00Z')],
    });
    expect(await hourly(env, '2026-11-10T00:00:00Z', 24)).toEqual({ [email(1)]: '07:00' });
  });

  it('moving the hour later after today’s edition went out does not send a second one', async () => {
    const leads = [leadAt(1, '2026-11-10T02:00:00Z')];
    const first = memoryStore({ profiles: [agent(1, 'Europe/London', null)], leads });
    expect(await hourly(first, '2026-11-10T00:00:00Z', 8)).toEqual({ [email(1)]: '07:00' });
    // Same digest_log, now with 10am chosen.
    const moved = memoryStore({ profiles: [agent(1, 'Europe/London', { digest_hour: 10 })], leads, log: first.log });
    expect(await hourly(moved, '2026-11-10T08:00:00Z', 16)).toEqual({});
    expect(moved.log).toHaveLength(1);
  });

  it('editionSlot names a chosen hour', () => {
    expect(editionSlot({ ...SCHEDULE, timeZone: 'Europe/London', chosenHour: 9 })).toBe('Europe/London@9');
    expect(editionSlot({ ...SCHEDULE, chosenHour: 9 })).toBe('');
  });
});
