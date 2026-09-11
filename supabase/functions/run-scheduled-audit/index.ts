import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import { getCorsHeaders } from '../_shared/cors.ts';
import { isServiceRoleRequest } from '../_shared/service-auth.ts';

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get('origin'));
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // verify_jwt is disabled (cron-invoked), so enforce the service-role key in
  // code — otherwise any anonymous caller could trigger audits for arbitrary
  // schedule IDs and fan out expensive crawls.
  if (!isServiceRoleRequest(req)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { scheduleId, manualTrigger = false } = await req.json();

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Get schedule details
    const { data: schedule } = await supabase
      .from('seo_monitoring_schedules')
      .select('*')
      .eq('id', scheduleId)
      .single();

    if (!schedule) {
      throw new Error('Schedule not found');
    }

    if (!schedule.is_active && !manualTrigger) {
      throw new Error('Schedule is not active');
    }

    const startTime = new Date();
    console.log(`Starting scheduled audit: ${schedule.name}`);

    // Create monitoring log entry.
    //
    // US-201: this sent user_id and check_type, which seo_monitoring_log does
    // not have — it is a deliberately slim log (schedule_id, status,
    // results_summary, started_at, completed_at) and both of those live on the
    // schedule row it points at. PostgREST rejected the insert, `logEntry` came
    // back undefined, and the very next statement reads `logEntry.id`. So every
    // scheduled audit died with a TypeError immediately after starting.
    const { data: logEntry, error: logError } = await supabase
      .from('seo_monitoring_log')
      .insert({
        schedule_id: scheduleId,
        status: 'running',
        started_at: startTime.toISOString(),
      })
      .select()
      .single();

    if (logError || !logEntry) {
      throw new Error(`Could not open a monitoring log entry: ${logError?.message ?? 'no row returned'}`);
    }

    const results: any = {
      audits: [],
      errors: [],
      alerts: [],
    };

    try {
      // Run audit based on type
      switch (schedule.schedule_type) {
        case 'full_audit':
          results.audits = await runFullAudit(supabase, schedule);
          break;
        case 'core_web_vitals':
          results.audits = await runCoreWebVitals(supabase, schedule);
          break;
        case 'broken_links':
          results.audits = await runBrokenLinksCheck(supabase, schedule);
          break;
        case 'content_optimization':
          results.audits = await runContentOptimization(supabase, schedule);
          break;
        case 'security_headers':
          results.audits = await runSecurityCheck(supabase, schedule);
          break;
        case 'image_optimization':
          results.audits = await runImageOptimization(supabase, schedule);
          break;
        default:
          throw new Error(`Unsupported audit type: ${schedule.schedule_type}`);
      }

      // Check alert rules and trigger if needed
      const alerts = await checkAlertRules(supabase, schedule, results);
      results.alerts = alerts;

      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();

      // Update log entry
      await supabase
        .from('seo_monitoring_log')
        // results_summary is the jsonb column this table has for exactly this.
        // duration_ms, checks_performed and issues_found were written as though
        // they were columns; they are facts about the run, so they go in the
        // summary with the rest of it.
        .update({
          status: 'completed',
          completed_at: endTime.toISOString(),
          results_summary: {
            ...results,
            durationMs: duration,
            checksPerformed: results.audits.length,
            issuesFound: countIssues(results),
          },
        })
        .eq('id', logEntry.id);

      // Update schedule last run
      await supabase
        .from('seo_monitoring_schedules')
        .update({
          last_run_at: endTime.toISOString(),
          last_run_status: 'success',
          last_run_duration_ms: duration,
        })
        .eq('id', scheduleId);

      console.log(`Scheduled audit completed: ${results.audits.length} audits, ${results.alerts.length} alerts`);

      return new Response(
        JSON.stringify({ success: true, results, duration }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (auditError: any) {
      // Update log entry with error
      await supabase
        .from('seo_monitoring_log')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          results_summary: { error: auditError.message },
        })
        .eq('id', logEntry.id);

      // Update schedule status
      await supabase
        .from('seo_monitoring_schedules')
        .update({
          last_run_at: new Date().toISOString(),
          last_run_status: 'failed',
        })
        .eq('id', scheduleId);

      throw auditError;
    }

  } catch (error: any) {
    console.error('Error running scheduled audit:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function runFullAudit(supabase: any, schedule: any): Promise<any[]> {
  const urls = scheduleUrls(schedule);
  const audits = [];

  for (const url of urls) {
    try {
      const response = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/seo-audit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        },
        body: JSON.stringify({ url, auditType: 'full', saveResults: true }),
      });

      const data = await response.json();
      audits.push(data);
    } catch (error: any) {
      console.error(`Audit failed for ${url}:`, error);
    }
  }

  return audits;
}

async function runCoreWebVitals(supabase: any, schedule: any): Promise<any[]> {
  const urls = scheduleUrls(schedule);
  const audits = [];

  for (const url of urls) {
    try {
      const response = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/check-core-web-vitals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        },
        body: JSON.stringify({ url, saveResults: true }),
      });

      const data = await response.json();
      audits.push(data);
    } catch (error: any) {
      console.error(`Core Web Vitals check failed for ${url}:`, error);
    }
  }

  return audits;
}

async function runBrokenLinksCheck(supabase: any, schedule: any): Promise<any[]> {
  const urls = scheduleUrls(schedule);
  const audits = [];

  for (const url of urls) {
    try {
      const response = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/check-broken-links`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        },
        body: JSON.stringify({ url, saveResults: true }),
      });

      const data = await response.json();
      audits.push(data);
    } catch (error: any) {
      console.error(`Broken links check failed for ${url}:`, error);
    }
  }

  return audits;
}

async function runContentOptimization(supabase: any, schedule: any): Promise<any[]> {
  const urls = scheduleUrls(schedule);
  const audits = [];

  for (const url of urls) {
    try {
      const response = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/analyze-content`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        },
        body: JSON.stringify({ url, saveResults: true }),
      });

      const data = await response.json();
      audits.push(data);
    } catch (error: any) {
      console.error(`Content optimization failed for ${url}:`, error);
    }
  }

  return audits;
}

async function runSecurityCheck(supabase: any, schedule: any): Promise<any[]> {
  const urls = scheduleUrls(schedule);
  const audits = [];

  for (const url of urls) {
    try {
      const response = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/check-security-headers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        },
        body: JSON.stringify({ url, saveResults: true }),
      });

      const data = await response.json();
      audits.push(data);
    } catch (error: any) {
      console.error(`Security check failed for ${url}:`, error);
    }
  }

  return audits;
}

async function runImageOptimization(supabase: any, schedule: any): Promise<any[]> {
  const urls = scheduleUrls(schedule);
  const audits = [];

  for (const url of urls) {
    try {
      const response = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/analyze-images`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        },
        body: JSON.stringify({ url, saveResults: true }),
      });

      const data = await response.json();
      audits.push(data);
    } catch (error: any) {
      console.error(`Image optimization failed for ${url}:`, error);
    }
  }

  return audits;
}

async function checkAlertRules(supabase: any, schedule: any, results: any): Promise<any[]> {
  const alerts = [];

  // Get alert rules for this user
  // US-200: `.eq('user_id', schedule.user_id)` was here. seo_alert_rules has
  // no user_id — it is a global rule table (conditions, rule_type, severity,
  // is_active). The filter 400'd, `rules` was undefined, and the function
  // returned no alerts at all, so a scheduled audit never alerted on anything.
  const { data: rules } = await supabase
    .from('seo_alert_rules')
    .select('*')
    .eq('is_active', true);

  if (!rules || rules.length === 0) return alerts;

  for (const rule of rules) {
    const triggered = evaluateAlertRule(rule, results);

    if (triggered) {
      const { data: alert } = await supabase
        .from('seo_alerts')
        // US-201: five of the eight keys here named columns seo_alerts does
        // not have (rule_id, related_url, metadata) or values its CHECK
        // constraint forbids (status 'active' — the allowed set is open /
        // acknowledged / resolved / ignored), while `title` is NOT NULL and was
        // not supplied at all. The rule's own fields were invented too:
        // seo_alert_rules has name, rule_type and conditions, not rule_name,
        // alert_type and notification_enabled.
        //
        // `metadata: { results, rule }` has no home and is dropped rather than
        // relocated: it is the entire audit payload, which is already in the
        // monitoring log's results_summary for this run.
        .insert({
          user_id: schedule.created_by,
          alert_rule_id: rule.id,
          alert_type: rule.rule_type,
          severity: rule.severity,
          title: rule.name,
          message: `Alert triggered: ${rule.name}`,
          affected_url: schedule.target_url,
          status: 'open',
        })
        .select()
        .single();

      if (alert) {
        alerts.push(alert);

        // Trigger notification if configured
        // `rule.notification_enabled` does not exist, so this has always been
        // undefined and no alert has ever notified anyone. `conditions` is the
        // jsonb column the rule's own thresholds already live in
        // (evaluateAlertRule reads minScore and maxIssues from it), so the flag
        // belongs there too. Opt-in rather than default-on: the first run in
        // which alerting works should not also be the first in which every
        // historical rule fires a notification at once.
        if (rule.conditions?.notify === true) {
          await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-seo-notification`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
            },
            body: JSON.stringify({ alertId: alert.id }),
          });
        }
      }
    }
  }

  return alerts;
}

/**
 * Every URL a schedule covers.
 *
 * US-201: all six audit functions read `schedule.target_urls`, which is not a
 * column. The schedule has `target_url` (NOT NULL, one) and `additional_urls`
 * (text[]). `urls` was therefore always [], every loop body ran zero times, and
 * a scheduled audit that got as far as running produced zero audits — on top of
 * the log insert that stopped it getting that far.
 */
function scheduleUrls(schedule: any): string[] {
  return [schedule.target_url, ...(schedule.additional_urls || [])].filter(Boolean);
}

function evaluateAlertRule(rule: any, results: any): boolean {
  // Simple rule evaluation logic
  const conditions = rule.conditions || {};

  if (conditions.minScore && results.audits.some((a: any) => a.analysis?.overallScore < conditions.minScore)) {
    return true;
  }

  if (conditions.maxIssues && countIssues(results) > conditions.maxIssues) {
    return true;
  }

  return false;
}

function countIssues(results: any): number {
  let count = 0;
  for (const audit of results.audits) {
    if (audit.analysis?.criticalIssues) count += audit.analysis.criticalIssues.length;
    if (audit.analysis?.warnings) count += audit.analysis.warnings.length;
  }
  return count;
}
