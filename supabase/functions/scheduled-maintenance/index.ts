import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import { isServiceRoleRequest } from '../_shared/service-auth.ts';
import { getCorsHeaders } from '../_shared/cors.ts';
import { sendEmail } from '../_shared/email.ts';
import { getAgentContacts } from '../_shared/agent-contact.ts';
import { successResponse, errorResponse, handleUnexpectedError } from '../_shared/response.ts';
import { getSiteUrl } from '../_shared/env.ts';
import { digestSchedule, runDigests, summarizeDigestReport } from './digests.ts';
import { isMissingColumn, supabaseDigestStore } from './digest-store.ts';
import {
  chaseOverdueLeads,
  summarizeOverdueReport,
  OVERDUE_NOTIFICATION_TYPE,
  type OverdueStore,
} from './overdue.ts';
import { processDueDeletions, supabaseDeletionStore } from '../_shared/account-deletion.ts';
import { createSubscriptionApi } from '../_shared/stripe-subscriptions.ts';
import { decryptSecret } from '../_shared/encryption.ts';
import {
  processExportQueue,
  purgeExpiredExports,
  summarizeExportQueueReport,
  supabaseExportQueueStore,
} from '../_shared/gdpr-export-queue.ts';

/**
 * Scheduled maintenance.
 *
 * US-103: the repo had no scheduler of any kind — no pg_cron, no workflow
 * `schedule:`, no wrangler.toml. Everything meant to run on a clock therefore
 * never ran: the SLA on unanswered leads was a useState in a React component
 * evaluated only while that page was open, process-account-deletions had no
 * caller, and the five cleanup_* SQL functions were never executed, so
 * rate_limit_entries and the security tables grew without bound.
 *
 * This is the one thing a clock calls. It is driven by
 * .github/workflows/scheduled-maintenance.yml on an hourly cron, because the
 * self-hosted Supabase this deploys to has no pg_cron and a GitHub schedule
 * needs no new infrastructure.
 *
 * Service-role only. Every task is independent: one failing must not stop the
 * others, so each is caught and reported in the response rather than thrown.
 */

/** The overdue-lead chaser's reads and writes, over the service-role client. */
function overdueStore(supabase: SupabaseClient): OverdueStore {
  // Until migration 20261107000433 is applied there is no profiles.timezone:
  // every agent is emailed at once, as before, rather than the task failing.
  let hasTimezone = true;

  async function readTimeZones(userIds: string[]): Promise<Map<string, string | null>> {
    const zones = new Map<string, string | null>();
    if (!hasTimezone || userIds.length === 0) return zones;
    const { data, error } = await supabase.from('profiles').select('id, timezone').in('id', userIds);
    if (error && isMissingColumn(error)) {
      hasTimezone = false;
      return zones;
    }
    if (error) throw new Error(`reading agent time zones: ${error.message}`);
    for (const row of (data ?? []) as { id: string; timezone: string | null }[]) {
      zones.set(row.id, row.timezone ?? null);
    }
    return zones;
  }

  return {
    async listCandidates(from, to, offset, limit) {
      const { data, error } = await supabase
        .from('leads')
        .select('id, user_id, name, created_at, lead_type')
        .eq('status', 'new')
        .is('first_responded_at', null)
        .gte('created_at', from)
        .lt('created_at', to)
        .order('created_at', { ascending: true })
        .order('id', { ascending: true })
        .range(offset, offset + limit - 1);
      if (error) throw new Error(`reading overdue leads: ${error.message}`);
      return data ?? [];
    },
    async listChasedLeadIds(userIds, since) {
      const ids = new Set<string>();
      const pageSize = 1000;
      for (let offset = 0; ; offset += pageSize) {
        const { data, error } = await supabase
          .from('notifications')
          .select('id, data')
          .eq('type', OVERDUE_NOTIFICATION_TYPE)
          .in('user_id', userIds)
          .gte('created_at', since)
          .order('id', { ascending: true })
          .range(offset, offset + pageSize - 1);
        if (error) throw new Error(`reading chased leads: ${error.message}`);
        for (const row of data ?? []) {
          const leadId = (row.data as { lead_id?: unknown } | null)?.lead_id;
          if (typeof leadId === 'string') ids.add(leadId);
        }
        if ((data ?? []).length < pageSize) break;
      }
      return ids;
    },
    async getAgents(userIds) {
      const agents = new Map<
        string,
        { email: string | null; preferences: Record<string, unknown> | null; timeZone: string | null }
      >();
      // A failed zone read fails the chunk: emailing at 3am because the zone
      // could not be read is the thing quiet hours exist to prevent.
      const zones = await readTimeZones(userIds);
      for (const [id, c] of await getAgentContacts(supabase, userIds)) {
        agents.set(id, { email: c.email, preferences: c.notificationPreferences, timeZone: zones.get(id) ?? null });
      }
      return agents;
    },
    async listHeldChases(since) {
      const held: Awaited<ReturnType<OverdueStore['listHeldChases']>> = [];
      const pageSize = 1000;
      for (let offset = 0; ; offset += pageSize) {
        const { data, error } = await supabase
          .from('notifications')
          .select('id, user_id, data')
          .eq('type', OVERDUE_NOTIFICATION_TYPE)
          .eq('data->>email_pending', 'true')
          .gte('created_at', since)
          .order('id', { ascending: true })
          .range(offset, offset + pageSize - 1);
        if (error) throw new Error(`reading held chases: ${error.message}`);
        for (const row of (data ?? []) as { id: string; user_id: string; data: unknown }[]) {
          const payload = row.data as Record<string, unknown> | null;
          if (payload && typeof payload.lead_id === 'string') {
            held.push({ notificationId: row.id, user_id: row.user_id, lead_id: payload.lead_id, data: payload });
          }
        }
        if ((data ?? []).length < pageSize) break;
      }
      return held;
    },
    async listStillWaiting(leadIds) {
      if (leadIds.length === 0) return [];
      const { data, error } = await supabase
        .from('leads')
        .select('id, user_id, name, created_at, lead_type')
        .in('id', leadIds)
        .eq('status', 'new')
        .is('first_responded_at', null);
      if (error) throw new Error(`reading held leads: ${error.message}`);
      return data ?? [];
    },
    async releaseHeld(held) {
      const rest = { ...held.data };
      delete rest.email_pending;
      // Conditional on email_pending still being set: two overlapping runs
      // cannot both own the email.
      const { data, error } = await supabase
        .from('notifications')
        .update({ data: rest })
        .eq('id', held.notificationId)
        .eq('data->>email_pending', 'true')
        .select('id');
      if (error) throw new Error(error.message);
      return (data ?? []).length > 0;
    },
    async claim(notification) {
      const { error } = await supabase.from('notifications').insert(notification);
      if (!error) return 'claimed';
      // idx_notifications_lead_overdue_once: someone already chased this lead.
      if (error.code === '23505') return 'duplicate';
      throw new Error(error.message);
    },
    sendEmail: (email) => sendEmail(email),
  };
}

interface TaskResult {
  task: string;
  ok: boolean;
  detail: string;
}

async function run(task: string, fn: () => Promise<string>): Promise<TaskResult> {
  try {
    return { task, ok: true, detail: await fn() };
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    console.error(`[scheduled-maintenance] ${task} failed: ${detail}`);
    return { task, ok: false, detail };
  }
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get('origin'));
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') {
    return errorResponse('Method not allowed', 'METHOD_NOT_ALLOWED', req, 405);
  }

  try {
    if (!isServiceRoleRequest(req)) {
      return errorResponse('Unauthorized', 'UNAUTHORIZED', req, 401);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const results: TaskResult[] = [];

    // ---------------------------------------------------------------------
    // 1. Chase leads that have gone unanswered past the agent's own SLA
    //    (overdue.ts: at most once per lead, missed runs made up within a week).
    // ---------------------------------------------------------------------
    results.push(
      await run('overdue_leads', async () => {
        const report = await chaseOverdueLeads(overdueStore(supabase), {
          now: new Date(),
          siteUrl: getSiteUrl(),
        });
        const summary = summarizeOverdueReport(report);
        // Unclaimed leads are retried next run; the task is reported failed so
        // the 207 shows that some agent was not chased.
        if (report.errors.length > 0) {
          throw new Error(`${summary}: ${report.errors.join('; ').slice(0, 500)}`);
        }
        return summary;
      })
    );

    // ---------------------------------------------------------------------
    // 2. Account deletions. process-account-deletions had no caller at all,
    //    so a requested deletion sat in the queue indefinitely — a GDPR
    //    commitment nothing honoured. US-103 then called it over HTTP through
    //    the Supabase edge runtime, which serves no functions (500 on every
    //    name), so it still never ran. US-250: processed here directly, and
    //    each account's live Stripe subscription is cancelled first.
    // ---------------------------------------------------------------------
    results.push(
      await run('account_deletions', async () => {
        const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
        const report = await processDueDeletions({
          store: supabaseDeletionStore(supabase),
          stripe: stripeKey ? createSubscriptionApi(stripeKey) : null,
        });
        const summary = `processed ${report.processed}, held for retry ${report.blocked}`;
        // Held deletions are retried next run, but the task is reported failed
        // so the 207 says someone's card is still being charged.
        if (report.blocked > 0) {
          throw new Error(`${summary}: ${report.errors.join('; ').slice(0, 500)}`);
        }
        return summary;
      })
    );

    // ---------------------------------------------------------------------
    // 2b. Queued data exports (US-397). gdpr-export's POST queued a request
    //     that nothing processed. Each is built into the private gdpr-exports
    //     bucket and the subject emailed a link that expires; expired files
    //     are deleted.
    // ---------------------------------------------------------------------
    results.push(
      await run('data_exports', async () => {
        const store = supabaseExportQueueStore(supabase, {
          decrypt: (value) => decryptSecret(value),
          sendEmail: (email) => sendEmail(email),
        });
        const report = await processExportQueue(store, { now: new Date(), siteUrl: getSiteUrl() });
        const purged = await purgeExpiredExports(store, new Date()).catch((error) => {
          report.errors.push(`purging expired exports: ${error instanceof Error ? error.message : String(error)}`);
          return 0;
        });
        const summary = summarizeExportQueueReport(report, purged);
        // Retried requests run again next hour; reported failed so the 207
        // says some subject is still waiting for their data.
        if (report.errors.length > 0) {
          throw new Error(`${summary}: ${report.errors.join('; ').slice(0, 500)}`);
        }
        return summary;
      })
    );

    // ---------------------------------------------------------------------
    // 3. The cleanup_* functions, none of which had ever been executed.
    //    cleanup_rate_limits in particular was also pointed at the wrong table
    //    until US-098, so rate_limit_entries only ever grew.
    // ---------------------------------------------------------------------
    for (const fn of [
      'cleanup_rate_limits',
      'cleanup_expired_mfa_codes',
      'cleanup_expired_sso_sessions',
      'cleanup_query_metrics',
      'cleanup_security_tables',
    ]) {
      results.push(
        await run(fn, async () => {
          const { error } = await supabase.rpc(fn);
          if (error) throw new Error(error.message);
          return 'ok';
        })
      );
    }

    // ---------------------------------------------------------------------
    // 4. The morning email (US-230): new leads, follow-ups due today and
    //    clients' upcoming dates, once a day from DIGEST_HOUR_UTC. Runs up to
    //    DIGEST_CATCHUP_HOURS later make up a missed run (US-331); digest_log
    //    keeps it to one per agent per day. POST {"force_digest": true} runs
    //    it now (still once per agent per day). US-433: an agent with a time
    //    zone gets it at DIGEST_LOCAL_HOUR on their own clock instead, so some
    //    agent's edition is due in most hours and every run pages through
    //    the profiles.
    // ---------------------------------------------------------------------
    const body = (await req.json().catch(() => ({}))) as { force_digest?: boolean };
    results.push(
      await run('digests', async () => {
        const now = new Date();
        const force = body.force_digest === true;
        const catchUpHours = Number.parseInt(Deno.env.get('DIGEST_CATCHUP_HOURS') ?? '', 10);
        const localHour = Number.parseInt(Deno.env.get('DIGEST_LOCAL_HOUR') ?? '', 10);
        const schedule = digestSchedule(now, {
          hour: Number.parseInt(Deno.env.get('DIGEST_HOUR_UTC') ?? '', 10),
          catchUpHours,
          force,
        });
        // Editions an earlier clean pass completed today are skipped without
        // reading their agents' leads (digest_runs, US-354); a forced run
        // always does a full pass.
        const report = await runDigests(supabaseDigestStore(supabase), {
          schedule,
          scheduleFor: (timeZone) => digestSchedule(now, { hour: localHour, catchUpHours, force, timeZone }),
          siteUrl: getSiteUrl(),
          useRunMarker: body.force_digest !== true,
        });
        const summary = summarizeDigestReport(report);
        // Agents still owed today's edition are retried by the next run in
        // the window, but the task is reported failed so the 207 says so.
        if (report.errors.length > 0) {
          throw new Error(`${summary}: ${report.errors.slice(0, 10).join('; ').slice(0, 500)}`);
        }
        return summary;
      })
    );

    const failed = results.filter((r) => !r.ok);
    console.log(
      `[scheduled-maintenance] ${results.length - failed.length}/${results.length} tasks ok`
    );

    // 207: some tasks may have failed while others succeeded, and the caller
    // should be able to tell without parsing prose.
    return successResponse({ results, failed: failed.length }, req, failed.length ? 207 : 200);
  } catch (error) {
    return handleUnexpectedError(error, req);
  }
});
