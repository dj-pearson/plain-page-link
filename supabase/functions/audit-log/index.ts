/**
 * Audit Log Edge Function
 * Centralized audit logging for security-relevant actions
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { requireAuth, getClientIP } from '../_shared/auth.ts';

interface AuditLogRequest {
  action: string;
  status: 'success' | 'failure' | 'blocked';
  resourceType?: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
}

interface GetLogsRequest {
  action?: string;
  resourceType?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

// Actions that are considered high/critical risk
const HIGH_RISK_ACTIONS = [
  'password_change',
  'email_change',
  'mfa_disable',
  'session_revoke',
  'revoke_all_sessions',
  'api_key_create',
  'api_key_delete',
];

const CRITICAL_RISK_ACTIONS = [
  'account_deletion_request',
  'account_deletion_cancelled',
  'gdpr_export_request',
  'admin_action',
];

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Require authentication
    const user = await requireAuth(req, supabase);
    const clientIP = getClientIP(req);
    const userAgent = req.headers.get('user-agent') || '';

    if (req.method === 'POST') {
      // Log an audit event
      const body: AuditLogRequest = await req.json();
      const { action, status, resourceType, resourceId, details, riskLevel } = body;

      if (!action || !status) {
        return new Response(
          JSON.stringify({ error: 'action and status are required' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      // Determine risk level if not provided
      let calculatedRiskLevel = riskLevel || 'low';
      if (!riskLevel) {
        if (CRITICAL_RISK_ACTIONS.includes(action)) {
          calculatedRiskLevel = 'critical';
        } else if (HIGH_RISK_ACTIONS.includes(action)) {
          calculatedRiskLevel = 'high';
        } else if (status === 'failure' || status === 'blocked') {
          calculatedRiskLevel = 'medium';
        }
      }

      // Use service role for inserting logs
      const serviceSupabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      );

      const { data, error } = await serviceSupabase
        .rpc('log_audit_event', {
          p_user_id: user.id,
          p_action: action,
          p_status: status,
          p_resource_type: resourceType || null,
          p_resource_id: resourceId || null,
          p_ip_address: clientIP,
          p_user_agent: userAgent,
          p_details: details ? JSON.stringify(details) : null,
          p_risk_level: calculatedRiskLevel,
        });

      if (error) {
        throw new Error(`Failed to log audit event: ${error.message}`);
      }

      return new Response(
        JSON.stringify({
          success: true,
          logId: data,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    } else if (req.method === 'GET') {
      // Get audit logs for the user
      const url = new URL(req.url);
      const action = url.searchParams.get('action');
      const resourceType = url.searchParams.get('resourceType');
      const startDate = url.searchParams.get('startDate');
      const endDate = url.searchParams.get('endDate');
      const limit = parseInt(url.searchParams.get('limit') || '50', 10);
      const offset = parseInt(url.searchParams.get('offset') || '0', 10);

      let query = supabase
        .from('audit_logs')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (action) {
        query = query.eq('action', action);
      }
      if (resourceType) {
        query = query.eq('resource_type', resourceType);
      }
      if (startDate) {
        query = query.gte('created_at', startDate);
      }
      if (endDate) {
        query = query.lte('created_at', endDate);
      }

      const { data: logs, error, count } = await query;

      if (error) {
        throw new Error(`Failed to fetch audit logs: ${error.message}`);
      }

      return new Response(
        JSON.stringify({
          success: true,
          logs,
          total: count,
          limit,
          offset,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    } else {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 405 }
      );
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const status = errorMessage.includes('Unauthorized') ? 401 : 500;

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status,
      }
    );
  }
});
