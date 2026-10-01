/**
 * The morning email task (US-230). Called by scheduled-maintenance every hour;
 * sends only in the configured hour (DIGEST_HOUR_UTC, default 13 — morning in
 * the US), once per agent per day (digest_log), and only when buildDigest
 * finds something worth sending.
 *
 * Preference: profiles.notification_preferences.digest — 'daily' (default),
 * 'weekly' (Mondays only) or 'off'. Monday's edition adds last week's numbers.
 */
import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import { sendEmail } from '../_shared/email.ts';
import { getAgentContact } from '../_shared/agent-contact.ts';
import { getSiteUrl } from '../_shared/env.ts';
import { buildDigest, type DigestKeyDate, type DigestLead, type DigestTask } from '../_shared/digest.ts';

export type DigestPreference = 'daily' | 'weekly' | 'off';

export function digestKindFor(pref: unknown, now: Date): 'daily' | 'weekly' | null {
  const p: DigestPreference = pref === 'weekly' || pref === 'off' ? pref : 'daily';
  if (p === 'off') return null;
  const monday = now.getUTCDay() === 1;
  if (p === 'weekly') return monday ? 'weekly' : null;
  return monday ? 'weekly' : 'daily';
}

function groupBy<T extends { user_id: string }>(rows: T[] | null): Map<string, T[]> {
  const out = new Map<string, T[]>();
  for (const row of rows ?? []) out.set(row.user_id, [...(out.get(row.user_id) ?? []), row]);
  return out;
}

export async function runDigests(supabase: SupabaseClient, opts: { force?: boolean; now?: Date } = {}): Promise<string> {
  const now = opts.now ?? new Date();
  const hour = Number.parseInt(Deno.env.get('DIGEST_HOUR_UTC') ?? '13', 10);
  if (!opts.force && now.getUTCHours() !== hour) return `not the digest hour (${hour}:00 UTC)`;

  const day = now.toISOString().slice(0, 10);
  const since24h = new Date(now.getTime() - 24 * 3_600_000).toISOString();
  const since7d = new Date(now.getTime() - 7 * 24 * 3_600_000).toISOString();
  const endOfDay = `${day}T23:59:59.999Z`;

  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, full_name, notification_preferences')
    .limit(5000);
  if (profilesError) throw profilesError;

  const [leadsRes, tasksRes, datesRes] = await Promise.all([
    supabase.from('leads').select('id, user_id, name, lead_type').gte('created_at', since24h).limit(5000),
    supabase
      .from('lead_activities')
      .select('lead_id, user_id, title, task_due_date')
      .eq('activity_type', 'task')
      .is('task_completed_at', null)
      .lte('task_due_date', endOfDay)
      .limit(5000),
    supabase
      .from('contact_key_dates')
      .select('user_id, kind, event_date, year_known, recurs_annually, remind_days_before, person_name, contacts(first_name, last_name)')
      .limit(10000),
  ]);
  for (const r of [leadsRes, tasksRes, datesRes]) if (r.error) throw r.error;

  const leadsBy = groupBy(leadsRes.data as (DigestLead & { user_id: string })[]);
  const tasksBy = groupBy(tasksRes.data as (DigestTask & { user_id: string })[]);
  const datesBy = groupBy(
    ((datesRes.data ?? []) as (DigestKeyDate & { user_id: string; contacts?: { first_name?: string; last_name?: string } | null })[]).map(
      (d) => ({
        ...d,
        contact_name: d.contacts ? [d.contacts.first_name, d.contacts.last_name].filter(Boolean).join(' ') || null : null,
      })
    )
  );

  let sent = 0;
  let skipped = 0;
  let failed = 0;
  const siteUrl = getSiteUrl();

  for (const profile of profiles ?? []) {
    const prefs = (profile.notification_preferences ?? {}) as { digest?: unknown };
    const kind = digestKindFor(prefs.digest, now);
    if (!kind) {
      skipped++;
      continue;
    }

    let weekly;
    if (kind === 'weekly') {
      const [views, leads, clicks] = await Promise.all([
        supabase.from('analytics_views').select('id', { count: 'exact', head: true }).eq('user_id', profile.id).gte('viewed_at', since7d),
        supabase.from('leads').select('id', { count: 'exact', head: true }).eq('user_id', profile.id).gte('created_at', since7d),
        supabase
          .from('analytics_events')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', profile.id)
          .eq('event_type', 'link_click')
          .gte('occurred_at', since7d),
      ]);
      weekly = { views: views.count ?? 0, leads: leads.count ?? 0, linkClicks: clicks.count ?? 0 };
    }

    const contact = await getAgentContact(supabase, profile.id);
    if (!contact?.email) {
      skipped++;
      continue;
    }
    const mail = buildDigest({
      to: contact.email,
      agentName: contact.fullName || profile.full_name || 'there',
      siteUrl,
      newLeads: leadsBy.get(profile.id) ?? [],
      dueTasks: tasksBy.get(profile.id) ?? [],
      keyDates: datesBy.get(profile.id) ?? [],
      weekly,
      today: now,
    });
    if (!mail) {
      skipped++;
      continue;
    }

    // Claim first; the primary key makes a second run a no-op.
    const { error: claimError } = await supabase.from('digest_log').insert({ user_id: profile.id, digest_date: day, kind });
    if (claimError) {
      if (claimError.code !== '23505') console.error(`[digests] claim failed for ${profile.id}: ${claimError.message}`);
      skipped++;
      continue;
    }
    const result = await sendEmail(mail);
    if (result.ok) {
      sent++;
    } else {
      failed++;
      await supabase.from('digest_log').delete().eq('user_id', profile.id).eq('digest_date', day).eq('kind', kind);
    }
  }

  return `sent ${sent}, skipped ${skipped}, failed ${failed}`;
}
