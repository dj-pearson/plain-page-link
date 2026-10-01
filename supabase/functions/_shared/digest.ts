/**
 * The morning email (US-230).
 *
 * The only scheduled email used to be "this lead has waited Xh". Follow-up
 * tasks and clients' birthdays and home anniversaries showed only on the
 * dashboard Overview, so an agent who did not open it that day missed them,
 * and nothing brought an agent back. This assembles one email from what needs
 * them today; scheduled-maintenance decides who gets one and when.
 *
 * Pure: the caller gathers the rows. Returns null when there is nothing worth
 * an email — an empty digest is noise.
 */
import { escapeHtml, type EmailOptions } from './email.ts';
import {
  describeDaysAway,
  describeOccasion,
  isReminderDue,
  keyDateKindLabel,
  upcomingKeyDates,
  type KeyDateLike,
} from './keyDates.ts';

export interface DigestLead {
  id: string;
  name: string;
  lead_type: string | null;
}

export interface DigestTask {
  lead_id: string;
  title: string | null;
  task_due_date: string;
}

export interface DigestKeyDate extends KeyDateLike {
  person_name: string | null;
  contact_name: string | null;
}

export interface WeeklyStats {
  views: number;
  leads: number;
  linkClicks: number;
}

export interface DigestInput {
  to: string;
  agentName: string;
  siteUrl: string;
  newLeads: DigestLead[];
  dueTasks: DigestTask[];
  keyDates: DigestKeyDate[];
  /** Present on the Monday edition. */
  weekly?: WeeklyStats;
  today?: Date;
}

export function buildDigest(input: DigestInput): EmailOptions | null {
  const today = input.today ?? new Date();
  const dates = upcomingKeyDates(input.keyDates, today, 30).filter(isReminderDue).slice(0, 10);
  const leads = input.newLeads.slice(0, 10);
  const tasks = input.dueTasks.slice(0, 10);
  const weeklyHasNews = !!input.weekly && (input.weekly.views + input.weekly.leads + input.weekly.linkClicks) > 0;

  if (leads.length === 0 && tasks.length === 0 && dates.length === 0 && !weeklyHasNews) return null;

  const dash = `${input.siteUrl}/dashboard`;
  const text: string[] = [`Good morning ${input.agentName},`, ''];
  const html: string[] = [];
  const e = escapeHtml;

  if (input.weekly && weeklyHasNews) {
    const w = input.weekly;
    text.push(`Last 7 days: ${w.views} profile views, ${w.leads} leads, ${w.linkClicks} link clicks.`, '');
    html.push(
      `<p style="margin:0 0 20px;font-size:15px;">Last 7 days: <strong>${w.views}</strong> profile views, <strong>${w.leads}</strong> leads, <strong>${w.linkClicks}</strong> link clicks.</p>`
    );
  }

  const section = (title: string, rows: { text: string; href: string }[]) => {
    if (rows.length === 0) return;
    text.push(title, ...rows.map((r) => `  - ${r.text}: ${r.href}`), '');
    html.push(
      `<h2 style="margin:20px 0 8px;font-size:16px;">${e(title)}</h2><ul style="margin:0;padding-left:20px;font-size:15px;line-height:1.7;">${rows
        .map((r) => `<li><a href="${e(r.href)}" style="color:#1d4ed8;">${e(r.text)}</a></li>`)
        .join('')}</ul>`
    );
  };

  section(
    `New leads (${input.newLeads.length})`,
    leads.map((l) => ({ text: `${l.name}${l.lead_type ? ` — ${l.lead_type}` : ''}`, href: `${dash}/leads?lead=${l.id}` }))
  );
  section(
    `Follow-ups due (${input.dueTasks.length})`,
    tasks.map((t) => ({ text: t.title || 'Follow up', href: `${dash}/leads?lead=${t.lead_id}` }))
  );
  section(
    'Coming up with your clients',
    dates.map(({ keyDate, daysAway, years }) => {
      const who = keyDate.person_name || keyDate.contact_name || 'A client';
      const what = describeOccasion(keyDate.kind, years) ?? keyDateKindLabel(keyDate.kind).toLowerCase();
      return { text: `${describeDaysAway(daysAway)}: ${who} — ${what}`, href: `${dash}/clients` };
    })
  );

  const settings = `${dash}/settings`;
  text.push(`Change or turn off this email: ${settings}`);

  return {
    to: input.to,
    subject: input.weekly ? 'Your week on AgentBio, and today' : 'Today on AgentBio',
    body: text.join('\n'),
    html: `<!DOCTYPE html><html><body style="margin:0;padding:24px;background:#f6f5f2;font-family:Arial,sans-serif;color:#1f2933;">
<div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;padding:28px;">
<p style="margin:0 0 16px;font-size:16px;">Good morning ${e(input.agentName)},</p>
${html.join('\n')}
<p style="margin:28px 0 0;font-size:12px;color:#6b7280;">You get this because it is on in <a href="${e(settings)}" style="color:#6b7280;">Settings</a>. Change or turn it off there.</p>
</div></body></html>`,
  };
}
