import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { getCorsHeaders } from '../_shared/cors.ts';

interface AuditSchedule {
  id: string
  name: string
  schedule_type: string
  audit_config: {
    checks?: string[]
    include_performance?: boolean
    include_accessibility?: boolean
  }
  notification_channels: string[]
  notification_recipients: string[]
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get('origin'));
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // This function can be called in two ways:
    // 1. With a schedule_id to run a specific scheduled audit
    // 2. Without params to check all schedules and run due audits (cron mode)

    const { schedule_id } = await req.json().catch(() => ({}))

    let schedulesToRun: AuditSchedule[] = []

    if (schedule_id) {
      // Run specific schedule
      const { data: schedule, error } = await supabase
        .from('seo_audit_schedules')
        .select('*')
        .eq('id', schedule_id)
        .eq('active', true)
        .single()

      if (error) throw error
      if (schedule) schedulesToRun = [schedule]
    } else {
      // Find all schedules that are due to run (cron mode)
      const { data: schedules, error } = await supabase
        .from('seo_audit_schedules')
        .select('*')
        .eq('active', true)
        .lte('next_run_at', new Date().toISOString())

      if (error) throw error
      schedulesToRun = schedules || []
    }

    const results = []

    for (const schedule of schedulesToRun) {
      try {
        // Log start
        await supabase.rpc('log_automation_execution', {
          p_automation_type: 'audit',
          p_automation_id: schedule.id,
          p_status: 'started',
          p_message: `Starting scheduled audit: ${schedule.name}`,
        })

        const startTime = Date.now()

        // Call the existing seo-audit function
        const auditResponse = await fetch(`${supabaseUrl}/functions/v1/seo-audit`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({
            url: Deno.env.get('PUBLIC_SITE_URL') || 'https://example.com',
            options: schedule.audit_config,
          }),
        })

        if (!auditResponse.ok) {
          throw new Error(`Audit failed with status: ${auditResponse.status}`)
        }

        const auditResults = await auditResponse.json()
        const duration = Date.now() - startTime

        // Update schedule with results
        const { error: updateError } = await supabase
          .from('seo_audit_schedules')
          .update({
            last_run_at: new Date().toISOString(),
            last_run_status: 'success',
            last_run_results: auditResults,
            next_run_at: calculateNextRun(schedule.schedule_type, schedule.cron_expression),
          })
          .eq('id', schedule.id)

        if (updateError) throw updateError

        // Log completion
        await supabase.rpc('log_automation_execution', {
          p_automation_type: 'audit',
          p_automation_id: schedule.id,
          p_status: 'completed',
          p_message: `Audit completed successfully`,
          p_details: { results: auditResults },
          p_duration_ms: duration,
        })

        // Check for critical issues and send notifications
        await processAuditResults(supabase, schedule, auditResults)

        results.push({
          schedule_id: schedule.id,
          schedule_name: schedule.name,
          status: 'success',
          duration_ms: duration,
          overall_score: auditResults.overall_score,
        })
      } catch (error) {
        // Log failure
        await supabase.rpc('log_automation_execution', {
          p_automation_type: 'audit',
          p_automation_id: schedule.id,
          p_status: 'failed',
          p_message: error.message,
        })

        // Update schedule status
        await supabase
          .from('seo_audit_schedules')
          .update({
            last_run_at: new Date().toISOString(),
            last_run_status: 'failed',
            next_run_at: calculateNextRun(schedule.schedule_type, schedule.cron_expression),
          })
          .eq('id', schedule.id)

        results.push({
          schedule_id: schedule.id,
          schedule_name: schedule.name,
          status: 'failed',
          error: error.message,
        })
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        schedules_processed: results.length,
        results,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error in schedule-seo-audit:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

function calculateNextRun(scheduleType: string, cronExpression?: string): string {
  const now = new Date()

  switch (scheduleType) {
    case 'daily':
      return new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString()
    case 'weekly':
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
    case 'monthly':
      const nextMonth = new Date(now)
      nextMonth.setMonth(nextMonth.getMonth() + 1)
      return nextMonth.toISOString()
    case 'cron':
      // TODO: Implement proper cron parsing
      // For now, default to daily
      return new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString()
    default:
      return new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString()
  }
}

async function processAuditResults(
  supabase: any,
  schedule: AuditSchedule,
  results: any
) {
  const criticalIssues = []
  const warnings = []
  const opportunities = []

  // Analyze audit results
  if (results.overall_score < 50) {
    criticalIssues.push('Overall SEO score is critically low')
  }

  if (results.seo_score < 70) {
    warnings.push('SEO score needs improvement')
  }

  if (results.performance_score < 60) {
    warnings.push('Performance score is below acceptable threshold')
  }

  if (results.accessibility_score < 80) {
    warnings.push('Accessibility issues detected')
  }

  // Check for critical issues in recommendations
  if (results.recommendations) {
    results.recommendations.forEach((rec: any) => {
      if (rec.priority === 'critical' || rec.severity === 'high') {
        criticalIssues.push(rec.message || rec.title)
      } else if (rec.priority === 'high' || rec.severity === 'medium') {
        warnings.push(rec.message || rec.title)
      } else {
        opportunities.push(rec.message || rec.title)
      }
    })
  }

  // Send notifications based on severity
  if (criticalIssues.length > 0 && schedule.notification_channels.length > 0) {
    await supabase.rpc('queue_seo_notification', {
      p_notification_type: 'critical_issue',
      p_title: `Critical SEO Issues Detected - ${schedule.name}`,
      p_message: `Found ${criticalIssues.length} critical issues:\n${criticalIssues.slice(0, 5).join('\n')}`,
      p_severity: 'critical',
      p_channels: schedule.notification_channels,
      p_recipients: schedule.notification_recipients,
      p_data: {
        schedule_id: schedule.id,
        overall_score: results.overall_score,
        critical_issues: criticalIssues,
        warnings: warnings,
        audit_timestamp: new Date().toISOString(),
      },
    })
  } else if (warnings.length > 0 && schedule.notification_channels.includes('in_app')) {
    await supabase.rpc('queue_seo_notification', {
      p_notification_type: 'warning',
      p_title: `SEO Warnings - ${schedule.name}`,
      p_message: `Found ${warnings.length} warnings that need attention`,
      p_severity: 'medium',
      p_channels: ['in_app'],
      p_recipients: schedule.notification_recipients,
      p_data: {
        schedule_id: schedule.id,
        overall_score: results.overall_score,
        warnings: warnings,
        opportunities: opportunities,
      },
    })
  }
}
