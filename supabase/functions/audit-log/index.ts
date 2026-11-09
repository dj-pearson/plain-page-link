/**
 * Audit Log Edge Function
 * Centralized audit logging for security-relevant actions
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import { getCorsHeaders, handleCorsPreFlight } from '../_shared/cors.ts';
import { requireAuth, getClientIP } from '../_shared/auth.ts';
import { parseClientAuditEvent, parseLogPage } from './policy.ts';

serve(async (req: Request) => {
  // Per request, from the Origin header. This was the module-level static
  // `corsHeaders`, pinned to https://agentbio.net, so every visitor who
  // reached the site as www.agentbio.net failed CORS here (US-123).
  const corsHeaders = getCorsHeaders(req.headers.get('origin'), 'GET, POST, PUT, DELETE, OPTIONS');
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return handleCorsPreFlight(req.headers.get('origin'));
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
      // Log an audit event the browser reports. Only the actions the app
      // itself reports are accepted, risk is decided server-side and the row
      // is tagged client_reported (see policy.ts).
      const parsed = parseClientAuditEvent(await req.json().catch(() => null));
      if (!parsed.ok) {
        return new Response(
          JSON.stringify({ error: parsed.error }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }
      const event = parsed.event;

      // Use service role for inserting logs
      const serviceSupabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      );

      const { data, error } = await serviceSupabase
        .rpc('log_audit_event', {
          p_user_id: user.id,
          p_action: event.action,
          p_status: event.status,
          p_resource_type: event.resourceType,
          p_resource_id: event.resourceId,
          p_ip_address: clientIP,
          p_user_agent: userAgent,
          // An object, so the jsonb column holds an object. This was
          // the stringified details, which stored a JSON *string* (US-657).
          p_details: event.details,
          p_risk_level: event.riskLevel,
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
      const { limit, offset } = parseLogPage(
        url.searchParams.get('limit'),
        url.searchParams.get('offset')
      );

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
