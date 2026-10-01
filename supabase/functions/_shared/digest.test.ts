import { describe, it, expect } from 'vitest';
import { buildDigest, type DigestInput } from './digest.ts';

const base: DigestInput = {
  to: 'agent@example.com',
  agentName: 'Jane',
  siteUrl: 'https://agentbio.test',
  newLeads: [],
  dueTasks: [],
  keyDates: [],
  today: new Date(2026, 9, 1), // 1 Oct 2026, local
};

describe('buildDigest (US-230)', () => {
  it('sends nothing when nothing needs the agent', () => {
    expect(buildDigest(base)).toBeNull();
    expect(buildDigest({ ...base, weekly: { views: 0, leads: 0, linkClicks: 0 } })).toBeNull();
  });

  it('lists new leads, due follow-ups and birthdays inside their reminder window', () => {
    const mail = buildDigest({
      ...base,
      newLeads: [{ id: 'l1', name: 'Dana Rivers', lead_type: 'buyer' }],
      dueTasks: [{ lead_id: 'l2', title: 'Call about the condo', task_due_date: '2026-10-01T15:00:00Z' }],
      keyDates: [
        // Turns 7 in three days, reminder set for a week ahead: included.
        { kind: 'birthday', event_date: '2019-10-04', year_known: true, recurs_annually: true, remind_days_before: 7, person_name: 'Mia', contact_name: 'The Lees' },
        // Home anniversary in 20 days, reminder 7 days ahead: not yet.
        { kind: 'home_anniversary', event_date: '2021-10-21', year_known: true, recurs_annually: true, remind_days_before: 7, person_name: null, contact_name: 'Sam Park' },
      ],
    })!;
    expect(mail.subject).toBe('Today on AgentBio');
    expect(mail.body).toContain('Dana Rivers — buyer: https://agentbio.test/dashboard/leads?lead=l1');
    expect(mail.body).toContain('Call about the condo');
    expect(mail.body).toContain('In 3 days: Mia — turns 7');
    expect(mail.body).not.toContain('Sam Park');
    expect(mail.body).toContain('https://agentbio.test/dashboard/settings');
  });

  it('the Monday edition leads with the week', () => {
    const mail = buildDigest({ ...base, weekly: { views: 120, leads: 4, linkClicks: 30 } })!;
    expect(mail.subject).toMatch(/your week/i);
    expect(mail.body).toContain('120 profile views, 4 leads, 30 link clicks');
  });

  it('escapes names in the HTML', () => {
    const mail = buildDigest({ ...base, newLeads: [{ id: 'l1', name: '<b>x</b>', lead_type: null }] })!;
    expect(mail.html).not.toContain('<b>x</b>');
  });
});
