import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import { isServiceRoleRequest } from '../_shared/service-auth.ts';
import { getCorsHeaders } from '../_shared/cors.ts';
import { sendEmail } from '../_shared/email.ts';
import { getAgentContact } from '../_shared/agent-contact.ts';
import { successResponse, errorResponse, handleUnexpectedError } from '../_shared/response.ts';

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

/** How long a new lead may sit unanswered before the agent is chased. */
const DEFAULT_SLA_HOURS = 2;

/** Never chase the same lead twice, however often this runs. */
const OVERDUE_NOTIFICATION_TYPE = 'lead_overdue';

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
    // 1. Chase leads that have gone unanswered past the agent's own SLA.
    // ---------------------------------------------------------------------
    results.push(
      await run('overdue_leads', async () => {
        // Cast the net at the SHORTEST configurable window and check each
        // lead against its own agent's setting below. Filtering at the longest
        // window here would silently exclude every agent who chose a tighter
        // one, which is the setting that matters most.
        const cutoff = new Date(Date.now() - DEFAULT_SLA_HOURS * 3_600_000).toISOString();

        const { data: leads, error } = await supabase
          .from('leads')
          .select('id, user_id, name, created_at, lead_type')
          .eq('status', 'new')
          .is('first_responded_at', null)
          .lt('created_at', cutoff)
          .order('created_at', { ascending: true })
          .limit(500);
        if (error) throw error;
        if (!leads?.length) return 'no overdue leads';

        // Group by agent so each agent's SLA is read once, not per lead.
        const byAgent = new Map<string, typeof leads>();
        for (const lead of leads) {
          const list = byAgent.get(lead.user_id) ?? [];
          list.push(lead);
          byAgent.set(lead.user_id, list);
        }

        let notified = 0;
        let skipped = 0;

        for (const [agentId, agentLeads] of byAgent) {
          const contact = await getAgentContact(supabase, agentId);
          const prefs = (contact?.notificationPreferences ?? {}) as {
            leads?: string;
            sla_hours?: number;
          };
          if (prefs.leads === 'off') {
            skipped += agentLeads.length;
            continue;
          }
          const slaMs = (prefs.sla_hours ?? DEFAULT_SLA_HOURS) * 3_600_000;

          for (const lead of agentLeads) {
            const age = Date.now() - new Date(lead.created_at).getTime();
            if (age < slaMs) {
              skipped++;
              continue;
            }

            // At most once per lead, ever. A notifications row is the record —
            // cheaper than a dedicated table and visible to the agent either
            // way.
            const { data: already } = await supabase
              .from('notifications')
              .select('id')
              .eq('user_id', agentId)
              .eq('type', OVERDUE_NOTIFICATION_TYPE)
              .contains('data', { lead_id: lead.id })
              .maybeSingle();
            if (already) {
              skipped++;
              continue;
            }

            const hours = Math.floor(age / 3_600_000);
            const { error: notifyError } = await supabase.from('notifications').insert({
              user_id: agentId,
              type: OVERDUE_NOTIFICATION_TYPE,
              title: `${lead.name} is still waiting`,
              message: `This ${lead.lead_type ?? 'lead'} has had no response for ${hours}h.`,
              data: { lead_id: lead.id, hours_waiting: hours },
            });
            if (notifyError) {
              console.error(
                `[scheduled-maintenance] could not notify for lead ${lead.id}: ${notifyError.message}`
              );
              continue;
            }

            if (contact?.email) {
              const siteUrl = Deno.env.get('SITE_URL') || 'https://agentbio.net';
              await sendEmail({
                to: contact.email,
                subject: `${lead.name} has been waiting ${hours}h`,
                body:
                  `${lead.name} sent you a ${lead.lead_type ?? 'lead'} ${hours} hours ago and ` +
                  `has not heard back.\n\n` +
                  `Open the lead: ${siteUrl}/dashboard/leads?lead=${lead.id}\n\n` +
                  `You can change how long to wait, or turn these off, in Settings.`,
              });
            }
            notified++;
          }
        }

        return `notified ${notified}, skipped ${skipped}`;
      })
    );

    // ---------------------------------------------------------------------
    // 2. Account deletions. process-account-deletions had no caller at all,
    //    so a requested deletion sat in the queue indefinitely — a GDPR
    //    commitment nothing honoured.
    // ---------------------------------------------------------------------
    results.push(
      await run('account_deletions', async () => {
        const response = await fetch(
          `${Deno.env.get('SUPABASE_URL')}/functions/v1/process-account-deletions`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
            },
            body: JSON.stringify({}),
          }
        );
        const text = await response.text();
        if (!response.ok) throw new Error(`${response.status}: ${text}`);
        return text.slice(0, 200);
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
