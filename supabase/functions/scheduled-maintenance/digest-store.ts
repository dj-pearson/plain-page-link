/**
 * The morning email's reads and writes (US-331), over the service-role
 * client. Every method throws on error: digests.ts decides what a failure
 * costs, and a failure read as "no rows" is how agents silently lost their
 * digest before.
 */
import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import { sendEmail } from '../_shared/email.ts';
import { getAgentContacts } from '../_shared/agent-contact.ts';
import type { DigestKeyDateRow, DigestStore } from './digests.ts';

/** Postgres 42P01 (undefined_table) or PostgREST's PGRST205 (not in the schema cache). */
export function isMissingTable(error: { code?: string | null }): boolean {
  return error.code === '42P01' || error.code === 'PGRST205';
}

/** Postgres 42703 (undefined_column) or PostgREST's PGRST204 (column not in the schema cache). */
export function isMissingColumn(error: { code?: string | null }): boolean {
  return error.code === '42703' || error.code === 'PGRST204';
}

export function supabaseDigestStore(supabase: SupabaseClient): DigestStore {
  // Until migration 20261107000433 is applied there is no profiles.timezone
  // and no digest_runs.slot: everyone gets the UTC edition, as before, rather
  // than the task failing.
  let hasTimezone = true;
  let hasSlot = true;

  return {
    async listProfiles(afterId, limit) {
      const read = (columns: string) => {
        let query = supabase.from('profiles').select(columns).order('id', { ascending: true }).limit(limit);
        if (afterId) query = query.gt('id', afterId);
        return query;
      };
      let result = hasTimezone ? await read('id, full_name, notification_preferences, timezone') : null;
      if (result?.error && isMissingColumn(result.error)) hasTimezone = false;
      if (!hasTimezone) result = await read('id, full_name, notification_preferences');
      const { data, error } = result!;
      if (error) throw new Error(`reading profiles: ${error.message}`);
      return (data ?? []) as unknown as Awaited<ReturnType<DigestStore['listProfiles']>>;
    },

    async listClaimed(userIds, day) {
      const { data, error } = await supabase
        .from('digest_log')
        .select('user_id')
        .eq('digest_date', day)
        .in('user_id', userIds);
      if (error) throw new Error(`reading digest_log: ${error.message}`);
      return new Set((data ?? []).map((row: { user_id: string }) => row.user_id));
    },

    async listNewLeads(userIds, from, to, offset, limit) {
      const { data, error } = await supabase
        .from('leads')
        .select('id, user_id, name, lead_type')
        .in('user_id', userIds)
        .gte('created_at', from)
        .lt('created_at', to)
        .order('created_at', { ascending: false })
        .order('id', { ascending: true })
        .range(offset, offset + limit - 1);
      if (error) throw new Error(`reading new leads: ${error.message}`);
      return data ?? [];
    },

    async listDueTasks(userIds, dueBy, offset, limit) {
      const { data, error } = await supabase
        .from('lead_activities')
        .select('lead_id, user_id, title, task_due_date')
        .in('user_id', userIds)
        .eq('activity_type', 'task')
        .is('task_completed_at', null)
        .lte('task_due_date', dueBy)
        .order('task_due_date', { ascending: true })
        .order('id', { ascending: true })
        .range(offset, offset + limit - 1);
      if (error) throw new Error(`reading due tasks: ${error.message}`);
      return data ?? [];
    },

    async listKeyDates(userIds, offset, limit) {
      const { data, error } = await supabase
        .from('contact_key_dates')
        .select(
          'id, user_id, kind, event_date, year_known, recurs_annually, remind_days_before, person_name, contacts(first_name, last_name)'
        )
        .in('user_id', userIds)
        .order('id', { ascending: true })
        .range(offset, offset + limit - 1);
      if (error) throw new Error(`reading key dates: ${error.message}`);
      type Row = Omit<DigestKeyDateRow, 'contact_name'> & {
        id: string;
        contacts?: { first_name?: string | null; last_name?: string | null } | null;
      };
      return ((data ?? []) as unknown as Row[]).map(({ contacts, ...row }) => ({
        ...row,
        contact_name: contacts ? [contacts.first_name, contacts.last_name].filter(Boolean).join(' ') || null : null,
      }));
    },

    async weeklyStats(userId, from, to) {
      const [views, leads, clicks] = await Promise.all([
        supabase
          .from('analytics_views')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .gte('viewed_at', from)
          .lt('viewed_at', to),
        supabase
          .from('leads')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .gte('created_at', from)
          .lt('created_at', to),
        supabase
          .from('analytics_events')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('event_type', 'link_click')
          .gte('occurred_at', from)
          .lt('occurred_at', to),
      ]);
      for (const r of [views, leads, clicks]) if (r.error) throw new Error(`weekly numbers: ${r.error.message}`);
      return { views: views.count ?? 0, leads: leads.count ?? 0, linkClicks: clicks.count ?? 0 };
    },

    async getAgents(userIds) {
      const agents = new Map<string, { email: string | null; fullName: string | null }>();
      for (const [id, c] of await getAgentContacts(supabase, userIds)) {
        agents.set(id, { email: c.email, fullName: c.fullName });
      }
      return agents;
    },

    async claim(userId, day, kind) {
      const { error } = await supabase.from('digest_log').insert({ user_id: userId, digest_date: day, kind });
      if (!error) return 'claimed';
      if (error.code === '23505') return 'duplicate';
      throw new Error(`claiming digest: ${error.message}`);
    },

    async release(userId, day, kind) {
      const { error } = await supabase
        .from('digest_log')
        .delete()
        .eq('user_id', userId)
        .eq('digest_date', day)
        .eq('kind', kind);
      if (error) throw new Error(error.message);
    },

    async hasCompletedRun(day, slot) {
      const read = (withSlot: boolean) => {
        const query = supabase.from('digest_runs').select('digest_date').eq('digest_date', day);
        return (withSlot ? query.eq('slot', slot) : query).maybeSingle();
      };
      let result = hasSlot ? await read(true) : null;
      if (result?.error && isMissingColumn(result.error)) hasSlot = false;
      if (!hasSlot) {
        // Only the UTC edition existed before the slot column.
        if (slot !== '') return false;
        result = await read(false);
      }
      const { data, error } = result!;
      // Before migration 20261107000354 is applied there is no marker table:
      // behave as before (a full pass every run) rather than fail the task.
      if (error && isMissingTable(error)) return false;
      if (error) throw new Error(error.message);
      return data !== null;
    },

    async markRunCompleted(day, slot, totals) {
      if (!hasSlot && slot !== '') return;
      const row = { digest_date: day, profiles: totals.profiles, sent: totals.sent };
      const { error } = hasSlot
        ? await supabase
            .from('digest_runs')
            .upsert({ ...row, slot }, { onConflict: 'digest_date,slot', ignoreDuplicates: true })
        : await supabase.from('digest_runs').upsert(row, { onConflict: 'digest_date', ignoreDuplicates: true });
      if (error && isMissingTable(error)) return;
      if (error) throw new Error(error.message);
    },

    sendEmail: (mail) => sendEmail(mail),
  };
}
