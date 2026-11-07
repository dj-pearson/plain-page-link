import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  buildChaseEmail,
  candidateWindow,
  chaseOverdueLeads,
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

/**
 * An in-memory store that behaves like the database: the leads table filtered
 * and ordered as the real query is, and notifications with the unique index.
 */
function memoryStore(opts: {
  leads: OverdueLead[];
  agents?: Record<string, OverdueAgent | null>;
  notifications?: (OverdueNotification & { created_at: string })[];
  failChasedRead?: boolean;
  failEmail?: boolean;
}) {
  const notifications = [...(opts.notifications ?? [])];
  const emails: { to: string; subject: string; body: string }[] = [];
  const candidateCalls: { from: string; to: string; offset: number }[] = [];
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
    async getAgent(userId) {
      const agents = opts.agents ?? {};
      return userId in agents ? agents[userId] : { email: `${userId}@example.com`, preferences: {} };
    },
    async claim(notification) {
      const dup = notifications.some(
        (n) => n.type === notification.type && n.user_id === notification.user_id && n.data.lead_id === notification.data.lead_id
      );
      if (dup) return 'duplicate';
      notifications.push({ ...notification, created_at: clock.toISOString() });
      return 'claimed';
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
