import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { getCorsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get('origin'));
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { alertId, notificationType, recipients, customMessage } = await req.json();

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Get alert details
    const { data: alert } = await supabase
      .from('seo_alerts')
      .select('*, seo_alert_rules(*)')
      .eq('id', alertId)
      .single();

    if (!alert) {
      throw new Error('Alert not found');
    }

    // Get user notification preferences
    const { data: preferences } = await supabase
      .from('seo_notification_preferences')
      .select('*')
      .eq('user_id', alert.user_id)
      .single();

    const channels = notificationType
      ? [notificationType]
      : preferences?.notification_channels || ['email'];

    const results: any[] = [];

    for (const channel of channels) {
      try {
        let sent = false;
        let error = null;

        switch (channel) {
          case 'email':
            sent = await sendEmail(alert, recipients, customMessage);
            break;
          case 'slack':
            sent = await sendSlack(alert, preferences?.slack_webhook_url, customMessage);
            break;
          case 'webhook':
            sent = await sendWebhook(alert, preferences?.webhook_url, customMessage);
            break;
          case 'in_app':
            sent = true; // Already in database as alert
            break;
        }

        results.push({
          channel,
          sent,
          error,
          timestamp: new Date().toISOString(),
        });

        // Update alert notification status
        if (sent) {
          await supabase
            .from('seo_alerts')
            .update({
              notified_at: new Date().toISOString(),
              notification_sent: true,
            })
            .eq('id', alertId);
        }
      } catch (channelError: any) {
        results.push({
          channel,
          sent: false,
          error: channelError.message,
          timestamp: new Date().toISOString(),
        });
      }
    }

    console.log(`Sent ${results.filter(r => r.sent).length}/${results.length} notifications for alert ${alertId}`);

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error sending notification:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function sendEmail(alert: any, recipients?: string[], customMessage?: string): Promise<boolean> {
  // In production, integrate with email service (SendGrid, Resend, etc.)
  console.log('Email notification:', {
    to: recipients || [alert.user_id],
    subject: `SEO Alert: ${alert.alert_type} - ${alert.severity}`,
    body: customMessage || alert.message,
    alert: alert,
  });

  // For now, just log (would need actual email service integration)
  return true;
}

async function sendSlack(alert: any, webhookUrl?: string, customMessage?: string): Promise<boolean> {
  if (!webhookUrl) {
    console.log('No Slack webhook URL configured');
    return false;
  }

  const severityColors: any = {
    critical: '#dc2626',
    high: '#ea580c',
    medium: '#f59e0b',
    low: '#3b82f6',
  };

  const payload = {
    text: customMessage || `SEO Alert: ${alert.alert_type}`,
    attachments: [{
      color: severityColors[alert.severity] || '#6b7280',
      fields: [
        {
          title: 'Alert Type',
          value: alert.alert_type,
          short: true,
        },
        {
          title: 'Severity',
          value: alert.severity.toUpperCase(),
          short: true,
        },
        {
          title: 'Message',
          value: alert.message,
          short: false,
        },
        {
          title: 'URL',
          value: alert.related_url || 'N/A',
          short: false,
        },
      ],
      footer: 'SEO Management System',
      ts: Math.floor(new Date(alert.created_at).getTime() / 1000),
    }],
  };

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  return response.ok;
}

async function sendWebhook(alert: any, webhookUrl?: string, customMessage?: string): Promise<boolean> {
  if (!webhookUrl) {
    console.log('No webhook URL configured');
    return false;
  }

  const payload = {
    event: 'seo_alert',
    timestamp: new Date().toISOString(),
    alert: {
      id: alert.id,
      type: alert.alert_type,
      severity: alert.severity,
      message: customMessage || alert.message,
      url: alert.related_url,
      metadata: alert.metadata,
      created_at: alert.created_at,
    },
  };

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  return response.ok;
}
