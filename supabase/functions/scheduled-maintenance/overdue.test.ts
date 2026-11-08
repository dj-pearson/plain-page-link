import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  buildChaseEmail,
  candidateWindow,
  chaseOverdueLeads,
  inQuietHours,
  slaHoursFor,
  summarizeOverdueReport,
  LOOKBACK_HOURS,
  MAX_CANDIDATES,
  PAGE_SIZE,
  type OverdueAgent,
  type OverdueLead,
  type OverdueNotification,
  type OverdueStore,
} from './overdue.ts';

const HOUR = 3_600_000;
const NOW = new Date('2026-11-07T15:17:00Z');
const SITE = 'https://agentbio.net';

function lead(id: string, userId: string, hoursAgo: number, name = `Lead ${id}`): OverdueLead {
  return {
    id,
    user_id: userId,
    name,
    created_at: new Date(NOW.getTime() - hoursAgo * HOUR).toISOString(),
    lead_type: 'buyer',
  };
}

type StoredNotification = OverdueNotification & { created_at: string; id?: string };

/** A notification an earlier night-time run claimed with its email held. */
function heldRow(leadId: string, userId: string, hoursAgo: number): StoredNotification {
  return {
    id: `held-${leadId}`,
    user_id: userId,
    type: 'lead_overdue',
    title: 't',
    message: 'm',
    data: { lead_id: leadId, hours_waiting: 4, email_pending: true },
    created_at: new Date(NOW.getTime() - hoursAgo * HOUR).toISOString(),
  };
}

/**
 * An in-memory store that behaves like the database: the leads table filtered
 * and ordered as the real query is, and notifications with the unique index.
 */
function memoryStore(opts: {
  leads: OverdueLead[];
  agents?: Record<string, OverdueAgent | null>;
  notifications?: StoredNotification[];
  failChasedRead?: boolean;
  failEmail?: boolean;
  failAgentsRead?: boolean;
  failHeldRead?: boolean;
  failWaitingRead?: boolean;
  /** Leads answered since they were chased (no longer `new`). */
  answered?: Set<string>;
}) {
  const notifications: StoredNotification[] = (opts.notifications ?? []).map((n) => ({ ...n, data: { ...n.data } }));
  const emails: { to: string; subject: string; body: string }[] = [];
  const candidateCalls: { from: string; to: string; offset: number }[] = [];
  const agentCalls: string[][] = [];
  let clock = NOW;

  const store: OverdueStore = {
    async listCandidates(from, to, offset, limit) {
      candidateCalls.push({ from, to, offset });
      return opts.leads
        .filter((l) => l.created_at >= from && l.created_at < to)
        .sort((a, b) => a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id))
        .slice(offset, offset + limit);
    },
    async listChasedLeadIds(userIds, since) {
      if (opts.failChasedRead) throw new Error('connection reset');
      return new Set(
        notifications
          .filter((n) => n.type === 'lead_overdue' && userIds.includes(n.user_id) && n.created_at >= since)
          .map((n) => n.data.lead_id)
      );
    },
    async getAgents(userIds) {
      agentCalls.push(userIds);
      if (opts.failAgentsRead) throw new Error('reading agent contacts: timeout');
      const agents = opts.agents ?? {};
      const found = new Map<string, OverdueAgent>();
      for (const userId of userIds) {
        const agent = userId in agents ? agents[userId] : { email: `${userId}@example.com`, preferences: {} };
        if (agent) found.set(userId, agent);
      }
      return found;
    },
    async claim(notification) {
      const dup = notifications.some(
        (n) => n.type === notification.type && n.user_id === notification.user_id && n.data.lead_id === notification.data.lead_id
      );
      if (dup) return 'duplicate';
      notifications.push({
        ...notification,
        data: { ...notification.data },
        created_at: clock.toISOString(),
        id: `n${notifications.length}`,
      });
      return 'claimed';
    },
    async listHeldChases(since) {
      if (opts.failHeldRead) throw new Error('held read timeout');
      return notifications
        .filter((n) => n.type === 'lead_overdue' && n.data.email_pending === true && n.created_at >= since)
        .map((n) => ({
          notificationId: n.id ?? '',
          user_id: n.user_id,
          lead_id: n.data.lead_id,
          data: { ...n.data } as Record<string, unknown>,
        }));
    },
    async listStillWaiting(leadIds) {
      if (opts.failWaitingRead) throw new Error('leads read timeout');
      return opts.leads.filter((l) => leadIds.includes(l.id) && !opts.answered?.has(l.id));
    },
    async releaseHeld(held) {
      const row = notifications.find((n) => n.id === held.notificationId);
      if (!row || row.data.email_pending !== true) return false;
      delete row.data.email_pending;
      return true;
    },
    async sendEmail(email) {
      if (opts.failEmail) return { ok: false, error: 'resend 500' };
      emails.push(email);
      return { ok: true };
    },
  };
  return {
    store,
    notifications,
    emails,
    candidateCalls,
    agentCalls,
    advance(hours: number) {
      clock = new Date(clock.getTime() + hours * HOUR);
      return clock;
    },
  };
}

describe('slaHoursFor', () => {
  it('uses the agent setting when it is one Settings offers', () => {
    expect(slaHoursFor({ sla_hours: 1 })).toBe(1);
    expect(slaHoursFor({ sla_hours: 8 })).toBe(8);
    expect(slaHoursFor({ sla_hours: 24 })).toBe(24);
  });
  it('falls back to 2 hours for anything else', () => {
    expect(slaHoursFor(null)).toBe(2);
    expect(slaHoursFor({})).toBe(2);
    expect(slaHoursFor({ sla_hours: 0 })).toBe(2);
    expect(slaHoursFor({ sla_hours: -5 })).toBe(2);
    expect(slaHoursFor({ sla_hours: '1' })).toBe(2);
  });
});

describe('candidateWindow', () => {
  it('starts at the tightest SLA Settings offers (1h), not 2h', () => {
    const { to } = candidateWindow(NOW);
    expect(NOW.getTime() - new Date(to).getTime()).toBe(1 * HOUR);
  });
  it('looks back a week, past the longest SLA', () => {
    const { from } = candidateWindow(NOW);
    expect(NOW.getTime() - new Date(from).getTime()).toBe(LOOKBACK_HOURS * HOUR);
    expect(LOOKBACK_HOURS).toBeGreaterThan(24 * 2);
  });
});

describe('chaseOverdueLeads (US-309)', () => {
  it('chases an agent on a 1-hour SLA after 1 hour', async () => {
    const m = memoryStore({
      leads: [lead('a', 'u1', 1.5)],
      agents: { u1: { email: 'u1@example.com', preferences: { sla_hours: 1 } } },
    });
    const report = await chaseOverdueLeads(m.store, { now: NOW, siteUrl: SITE });
    expect(report.claimed).toBe(1);
    expect(m.emails).toHaveLength(1);
    expect(m.emails[0].subject).toBe('Lead a has been waiting 1h');
  });

  it('waits for each agent’s own SLA', async () => {
    const m = memoryStore({
      leads: [lead('a', 'u1', 3), lead('b', 'u2', 3)],
      agents: {
        u1: { email: 'u1@example.com', preferences: { sla_hours: 2 } },
        u2: { email: 'u2@example.com', preferences: { sla_hours: 4 } },
      },
    });
    const report = await chaseOverdueLeads(m.store, { now: NOW, siteUrl: SITE });
    expect(report.claimed).toBe(1);
    expect(report.notYetDue).toBe(1);
    expect(m.notifications.map((n) => n.data.lead_id)).toEqual(['a']);
  });

  it('chases a lead at most once across repeated runs', async () => {
    const m = memoryStore({ leads: [lead('a', 'u1', 3)] });
    await chaseOverdueLeads(m.store, { now: NOW, siteUrl: SITE });
    for (let i = 1; i <= 5; i++) {
      const report = await chaseOverdueLeads(m.store, { now: m.advance(1), siteUrl: SITE });
      expect(report.claimed).toBe(0);
      expect(report.alreadyChased).toBe(1);
    }
    expect(m.notifications).toHaveLength(1);
    expect(m.emails).toHaveLength(1);
  });

  it('a claim that loses a race to another run is not emailed', async () => {
    const m = memoryStore({ leads: [lead('a', 'u1', 3)] });
    // The bulk read misses the row another run inserted a moment later.
    const realRead = m.store.listChasedLeadIds;
    m.store.listChasedLeadIds = async () => new Set();
    await m.store.claim({
      user_id: 'u1',
      type: 'lead_overdue',
      title: 't',
      message: 'm',
      data: { lead_id: 'a', hours_waiting: 3 },
    });
    const report = await chaseOverdueLeads(m.store, { now: NOW, siteUrl: SITE });
    m.store.listChasedLeadIds = realRead;
    expect(report.claimed).toBe(0);
    expect(report.alreadyChased).toBe(1);
    expect(m.emails).toHaveLength(0);
  });

  it('fails instead of re-sending when the already-chased read fails', async () => {
    const m = memoryStore({ leads: [lead('a', 'u1', 3)], failChasedRead: true });
    await expect(chaseOverdueLeads(m.store, { now: NOW, siteUrl: SITE })).rejects.toThrow('connection reset');
    expect(m.notifications).toHaveLength(0);
    expect(m.emails).toHaveLength(0);
  });

  it('is not starved by an old backlog of chased, never-answered leads', async () => {
    // 1,200 leads chased already and still "new", then one fresh overdue lead.
    // The old query read the oldest 500 and never reached it.
    const backlog = Array.from({ length: 1200 }, (_, i) => lead(`old${String(i).padStart(4, '0')}`, 'u1', 100));
    const m = memoryStore({
      leads: [...backlog, lead('fresh', 'u1', 3)],
      notifications: backlog.map((l) => ({
        user_id: 'u1',
        type: 'lead_overdue',
        title: 't',
        message: 'm',
        data: { lead_id: l.id, hours_waiting: 2 },
        created_at: new Date(NOW.getTime() - 98 * HOUR).toISOString(),
      })),
    });
    const report = await chaseOverdueLeads(m.store, { now: NOW, siteUrl: SITE });
    expect(m.candidateCalls.map((c) => c.offset)).toEqual([0, PAGE_SIZE]);
    expect(report.claimed).toBe(1);
    expect(report.alreadyChased).toBe(1200);
    expect(m.emails[0].body).toContain('lead=fresh');
  });

  it('does not chase leads older than the look-back window', async () => {
    const m = memoryStore({ leads: [lead('ancient', 'u1', LOOKBACK_HOURS + 1)] });
    const report = await chaseOverdueLeads(m.store, { now: NOW, siteUrl: SITE });
    expect(report.claimed).toBe(0);
    expect(m.emails).toHaveLength(0);
  });

  it('makes up a missed run: a lead that crossed its SLA during an outage is chased once on the next run', async () => {
    // Arrived 30h ago; the scheduler was down for the last day.
    const m = memoryStore({ leads: [lead('a', 'u1', 30)] });
    const first = await chaseOverdueLeads(m.store, { now: NOW, siteUrl: SITE });
    const second = await chaseOverdueLeads(m.store, { now: m.advance(1), siteUrl: SITE });
    expect(first.claimed).toBe(1);
    expect(second.claimed).toBe(0);
    expect(m.emails).toHaveLength(1);
  });

  it('sends one email per agent per run, not one per lead', async () => {
    const leads = Array.from({ length: 12 }, (_, i) => lead(`l${i}`, 'u1', 5, `Buyer ${i}`));
    const m = memoryStore({ leads: [...leads, lead('x', 'u2', 5)] });
    const report = await chaseOverdueLeads(m.store, { now: NOW, siteUrl: SITE });
    expect(report.claimed).toBe(13);
    expect(report.agentsEmailed).toBe(2);
    expect(m.emails).toHaveLength(2);
    const u1 = m.emails.find((e) => e.to === 'u1@example.com')!;
    expect(u1.subject).toBe('12 leads are still waiting to hear from you');
    expect(u1.body).toContain('and 2 more');
    expect(m.notifications).toHaveLength(13);
  });

  it('respects chasing turned off, and leaves those leads unclaimed', async () => {
    const m = memoryStore({
      leads: [lead('a', 'u1', 3)],
      agents: { u1: { email: 'u1@example.com', preferences: { leads: 'off' } } },
    });
    const report = await chaseOverdueLeads(m.store, { now: NOW, siteUrl: SITE });
    expect(report.chasingOff).toBe(1);
    expect(m.notifications).toHaveLength(0);
    expect(m.emails).toHaveLength(0);
  });

  it('leaves an unreadable agent’s leads for the next run and reports it', async () => {
    const m = memoryStore({ leads: [lead('a', 'u1', 3)], agents: { u1: null } });
    const report = await chaseOverdueLeads(m.store, { now: NOW, siteUrl: SITE });
    expect(report.claimed).toBe(0);
    expect(report.errors).toHaveLength(1);
    expect(m.notifications).toHaveLength(0);
  });

  it('reads every agent’s address in one call, not one per agent (US-378)', async () => {
    const leads = Array.from({ length: 30 }, (_, i) => lead(`l${i}`, `u${i}`, 3));
    const m = memoryStore({ leads });
    const report = await chaseOverdueLeads(m.store, { now: NOW, siteUrl: SITE });
    expect(report.agentsEmailed).toBe(30);
    expect(m.agentCalls).toHaveLength(1);
    expect(m.agentCalls[0]).toHaveLength(30);
  });

  it('does not read the address of an agent whose leads were all chased already', async () => {
    const m = memoryStore({
      leads: [lead('a', 'u1', 3), lead('b', 'u2', 3)],
      notifications: [
        { user_id: 'u1', type: 'lead_overdue', title: '', message: '', data: { lead_id: 'a', hours_waiting: 2 }, created_at: NOW.toISOString() },
      ],
    });
    await chaseOverdueLeads(m.store, { now: NOW, siteUrl: SITE });
    expect(m.agentCalls).toEqual([['u2']]);
  });

  it('a failed address read is one error and claims nothing, so the next run chases', async () => {
    const m = memoryStore({ leads: [lead('a', 'u1', 3), lead('b', 'u2', 3)], failAgentsRead: true });
    const report = await chaseOverdueLeads(m.store, { now: NOW, siteUrl: SITE });
    expect(report.claimed).toBe(0);
    expect(report.errors).toEqual(['reading the addresses of 2 agents: reading agent contacts: timeout']);
    expect(m.notifications).toHaveLength(0);
  });

  it('a failed email is reported but the lead is not emailed again next run', async () => {
    const m = memoryStore({ leads: [lead('a', 'u1', 3)], failEmail: true });
    const first = await chaseOverdueLeads(m.store, { now: NOW, siteUrl: SITE });
    expect(first.claimed).toBe(1);
    expect(first.errors[0]).toContain('resend 500');
    const second = await chaseOverdueLeads(m.store, { now: m.advance(1), siteUrl: SITE });
    expect(second.claimed).toBe(0);
    expect(m.notifications).toHaveLength(1);
  });

  it('reports when it stopped at the candidate ceiling', async () => {
    const leads = Array.from({ length: MAX_CANDIDATES + 5 }, (_, i) => lead(`c${String(i).padStart(5, '0')}`, `u${i % 50}`, 3));
    const m = memoryStore({ leads, agents: Object.fromEntries(Array.from({ length: 50 }, (_, i) => [`u${i}`, { email: null, preferences: {} }])) });
    const report = await chaseOverdueLeads(m.store, { now: NOW, siteUrl: SITE });
    expect(report.truncated).toBe(true);
    expect(report.claimed).toBe(MAX_CANDIDATES);
    expect(summarizeOverdueReport(report)).toContain(`stopped at ${MAX_CANDIDATES}`);
  });
});

describe('inQuietHours (US-457)', () => {
  it('is 21:00 to 07:00 on the agent’s own clock', () => {
    // New York is on standard time (UTC-5) on 2026-11-08.
    expect(inQuietHours(new Date('2026-11-08T01:59:00Z'), 'America/New_York')).toBe(false); // 20:59
    expect(inQuietHours(new Date('2026-11-08T02:00:00Z'), 'America/New_York')).toBe(true); // 21:00
    expect(inQuietHours(new Date('2026-11-08T11:59:00Z'), 'America/New_York')).toBe(true); // 06:59
    expect(inQuietHours(new Date('2026-11-08T12:00:00Z'), 'America/New_York')).toBe(false); // 07:00
  });
  it('has no quiet hours without a usable zone', () => {
    expect(inQuietHours(new Date('2026-11-08T03:00:00Z'), null)).toBe(false);
    expect(inQuietHours(new Date('2026-11-08T03:00:00Z'), undefined)).toBe(false);
    expect(inQuietHours(new Date('2026-11-08T03:00:00Z'), 'Not/AZone')).toBe(false);
  });
});

describe('chaseOverdueLeads quiet hours (US-457)', () => {
  // NOW is 15:17 UTC: 07:17 in Los Angeles (UTC-8), 00:17 next day in Tokyo (UTC+9).
  const LA = 'America/Los_Angeles';
  const TOKYO = 'Asia/Tokyo';
  const night = new Date('2026-11-07T07:17:00Z'); // 23:17 in Los Angeles
  const laAgent = { u1: { email: 'u1@example.com', preferences: {}, timeZone: LA } };

  it('claims the notification on time but holds the email during the agent’s night', async () => {
    const m = memoryStore({
      leads: [lead('a', 'u1', 3)],
      agents: { u1: { email: 'u1@example.com', preferences: {}, timeZone: TOKYO } },
    });
    const report = await chaseOverdueLeads(m.store, { now: NOW, siteUrl: SITE });
    expect(report.claimed).toBe(1);
    expect(report.held).toBe(1);
    expect(m.emails).toHaveLength(0);
    expect(m.notifications).toHaveLength(1);
    expect(m.notifications[0].data).toMatchObject({ lead_id: 'a', email_pending: true });
    expect(summarizeOverdueReport(report)).toContain('held for quiet hours 1');
  });

  it('emails an agent in their daytime at once, with no pending flag', async () => {
    const m = memoryStore({ leads: [lead('a', 'u1', 3)], agents: laAgent });
    const report = await chaseOverdueLeads(m.store, { now: NOW, siteUrl: SITE });
    expect(report.held).toBe(0);
    expect(m.emails).toHaveLength(1);
    expect(m.notifications[0].data).not.toHaveProperty('email_pending');
  });

  it('an agent with no zone is emailed at once, as before', async () => {
    const at = new Date(night.getTime());
    const m = memoryStore({
      leads: [{ ...lead('a', 'u1', 0), created_at: new Date(at.getTime() - 3 * HOUR).toISOString() }],
      agents: { u1: { email: 'u1@example.com', preferences: {}, timeZone: null } },
    });
    await chaseOverdueLeads(m.store, { now: at, siteUrl: SITE });
    expect(m.emails).toHaveLength(1);
  });

  it('sends nothing all night, then one email at the first run after 07:00 local', async () => {
    const leads = [
      { ...lead('a', 'u1', 0, 'Dana'), created_at: new Date(night.getTime() - 3 * HOUR).toISOString() },
      { ...lead('b', 'u1', 0, 'Sam'), created_at: new Date(night.getTime() + 1 * HOUR).toISOString() },
    ];
    const m = memoryStore({ leads, agents: laAgent });
    // Hourly runs from 23:17 to 06:17 Los Angeles time.
    for (let h = 0; h <= 7; h++) {
      await chaseOverdueLeads(m.store, { now: new Date(night.getTime() + h * HOUR), siteUrl: SITE });
    }
    expect(m.emails).toHaveLength(0);
    expect(m.notifications).toHaveLength(2);

    // 07:17: both held leads go out together.
    const morning = new Date(night.getTime() + 8 * HOUR);
    const report = await chaseOverdueLeads(m.store, { now: morning, siteUrl: SITE });
    expect(report.released).toBe(2);
    expect(m.emails).toHaveLength(1);
    expect(m.emails[0].subject).toBe('2 leads are still waiting to hear from you');
    expect(m.emails[0].body).toContain('Dana (buyer, 11h)');
    expect(m.notifications.every((n) => n.data.email_pending === undefined)).toBe(true);

    // And never again.
    await chaseOverdueLeads(m.store, { now: new Date(morning.getTime() + HOUR), siteUrl: SITE });
    expect(m.emails).toHaveLength(1);
  });

  it('folds held leads and this run’s new claims into one email', async () => {
    const m = memoryStore({
      leads: [lead('a', 'u1', 12), lead('b', 'u1', 3)],
      agents: laAgent,
      notifications: [heldRow('a', 'u1', 8)],
    });
    const report = await chaseOverdueLeads(m.store, { now: NOW, siteUrl: SITE });
    expect(report.released).toBe(1);
    expect(report.claimed).toBe(1);
    expect(m.emails).toHaveLength(1);
    expect(m.emails[0].body).toContain('?lead=a');
    expect(m.emails[0].body).toContain('?lead=b');
  });

  it('a lead answered overnight is released without an email', async () => {
    const m = memoryStore({
      leads: [lead('a', 'u1', 12)],
      answered: new Set(['a']),
      agents: laAgent,
      notifications: [heldRow('a', 'u1', 8)],
    });
    const report = await chaseOverdueLeads(m.store, { now: NOW, siteUrl: SITE });
    expect(report.released).toBe(0);
    expect(m.emails).toHaveLength(0);
    expect(m.notifications[0].data.email_pending).toBeUndefined();
  });

  it('an agent who turned chasing off overnight has held leads released without an email', async () => {
    const m = memoryStore({
      leads: [lead('a', 'u1', 12)],
      agents: { u1: { email: 'u1@example.com', preferences: { leads: 'off' }, timeZone: LA } },
      notifications: [heldRow('a', 'u1', 8)],
    });
    await chaseOverdueLeads(m.store, { now: NOW, siteUrl: SITE });
    expect(m.emails).toHaveLength(0);
    expect(m.notifications[0].data.email_pending).toBeUndefined();
  });

  it('keeps held leads held while the agent is still in quiet hours', async () => {
    const m = memoryStore({
      leads: [lead('a', 'u1', 12)],
      agents: { u1: { email: 'u1@example.com', preferences: {}, timeZone: TOKYO } },
      notifications: [heldRow('a', 'u1', 8)],
    });
    await chaseOverdueLeads(m.store, { now: NOW, siteUrl: SITE });
    expect(m.emails).toHaveLength(0);
    expect(m.notifications[0].data.email_pending).toBe(true);
  });

  it('keeps held leads held when the still-waiting read fails, then sends them next run', async () => {
    const m = memoryStore({
      leads: [lead('a', 'u1', 12)],
      agents: laAgent,
      notifications: [heldRow('a', 'u1', 8)],
      failWaitingRead: true,
    });
    const report = await chaseOverdueLeads(m.store, { now: NOW, siteUrl: SITE });
    expect(report.errors[0]).toContain('reading held leads');
    expect(m.emails).toHaveLength(0);
    expect(m.notifications[0].data.email_pending).toBe(true);
  });

  it('a held row another run already released is not emailed again', async () => {
    const m = memoryStore({
      leads: [lead('a', 'u1', 12)],
      agents: laAgent,
      notifications: [{ ...heldRow('a', 'u1', 8), data: { lead_id: 'a', hours_waiting: 4 } }],
    });
    // A stale listing: the row was released between the read and the update.
    m.store.listHeldChases = async () => [
      { notificationId: 'held-a', user_id: 'u1', lead_id: 'a', data: { lead_id: 'a', email_pending: true } },
    ];
    const report = await chaseOverdueLeads(m.store, { now: NOW, siteUrl: SITE });
    expect(report.released).toBe(0);
    expect(report.claimed).toBe(0);
    expect(m.emails).toHaveLength(0);
  });

  it('a failed held read is reported but new leads are still chased', async () => {
    const m = memoryStore({ leads: [lead('a', 'u1', 3)], failHeldRead: true });
    const report = await chaseOverdueLeads(m.store, { now: NOW, siteUrl: SITE });
    expect(report.claimed).toBe(1);
    expect(m.emails).toHaveLength(1);
    expect(report.errors).toEqual(['reading held chases: held read timeout']);
  });
});

describe('buildChaseEmail', () => {
  it('names the lead and links to it when there is one', () => {
    const email = buildChaseEmail([lead('a', 'u1', 3, 'Dana')], SITE, NOW);
    expect(email.subject).toBe('Dana has been waiting 3h');
    expect(email.body).toContain(`${SITE}/dashboard/leads?lead=a`);
  });
});

describe('idx_notifications_lead_overdue_once migration', () => {
  const sql = readFileSync(
    resolve(__dirname, '../../migrations/20261107000309_lead_overdue_once.sql'),
    'utf8'
  );
  it('is a unique index on the agent and lead, limited to lead_overdue rows', () => {
    expect(sql).toMatch(
      /CREATE UNIQUE INDEX IF NOT EXISTS idx_notifications_lead_overdue_once\s+ON public\.notifications \(user_id, \(data ->> 'lead_id'\)\)\s+WHERE type = 'lead_overdue'/
    );
  });
  it('removes only duplicate lead_overdue rows before building it', () => {
    const del = sql.slice(sql.indexOf('DELETE'), sql.indexOf('CREATE UNIQUE INDEX'));
    expect(del).toContain("n.type = 'lead_overdue'");
    expect(del).toContain("earlier.type = 'lead_overdue'");
  });
});
