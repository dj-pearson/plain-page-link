import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
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
    console.log(`Starting scheduled audit: ${schedule.schedule_name}`);

    // Create monitoring log entry
    const { data: logEntry } = await supabase
      .from('seo_monitoring_log')
      .insert({
        schedule_id: scheduleId,
        user_id: schedule.user_id,
        check_type: schedule.audit_type,
        status: 'running',
        started_at: startTime.toISOString(),
      })
      .select()
      .single();

    const results: any = {
      audits: [],
      errors: [],
      alerts: [],
    };

    try {
      // Run audit based on type
      switch (schedule.audit_type) {
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
          throw new Error(`Unsupported audit type: ${schedule.audit_type}`);
      }

      // Check alert rules and trigger if needed
      const alerts = await checkAlertRules(supabase, schedule, results);
      results.alerts = alerts;

      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();

      // Update log entry
      await supabase
        .from('seo_monitoring_log')
        .update({
          status: 'completed',
          completed_at: endTime.toISOString(),
          duration_ms: duration,
          results_summary: results,
          checks_performed: results.audits.length,
          issues_found: countIssues(results),
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
          error_message: auditError.message,
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
  const urls = schedule.target_urls || [];
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
  const urls = schedule.target_urls || [];
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
  const urls = schedule.target_urls || [];
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
  const urls = schedule.target_urls || [];
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
  const urls = schedule.target_urls || [];
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
  const urls = schedule.target_urls || [];
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
  const { data: rules } = await supabase
    .from('seo_alert_rules')
    .select('*')
    .eq('user_id', schedule.user_id)
    .eq('is_active', true);

  if (!rules || rules.length === 0) return alerts;

  for (const rule of rules) {
    const triggered = evaluateAlertRule(rule, results);

    if (triggered) {
      const { data: alert } = await supabase
        .from('seo_alerts')
        .insert({
          user_id: schedule.user_id,
          rule_id: rule.id,
          alert_type: rule.alert_type,
          severity: rule.severity,
          message: `Alert triggered: ${rule.rule_name}`,
          related_url: schedule.target_urls?.[0],
          metadata: { results, rule },
          status: 'active',
        })
        .select()
        .single();

      if (alert) {
        alerts.push(alert);

        // Trigger notification if configured
        if (rule.notification_enabled) {
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
