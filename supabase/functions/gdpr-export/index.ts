/**
 * GDPR Data Export Edge Function
 * Exports all user data in JSON format for GDPR compliance
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import { getCorsHeaders, handleCorsPreFlight } from '../_shared/cors.ts';
import { requireAuth, getClientIP } from '../_shared/auth.ts';
import { checkRateLimitDb } from '../_shared/rate-limiter.ts';
import { decryptSecret } from '../_shared/encryption.ts';
import { reportError } from '../_shared/report.ts';
import {
  collectSections,
  ExportIncompleteError,
  maskLoginAttempt,
  sectionCounts,
  type CollectedSections,
  type ExportReader,
  type Row,
} from './collect.ts';

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

    // Use service role for comprehensive data access
    const serviceSupabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Rate limit: 3 exports per hour per user. The limiter is keyed by
    // identifier + endpoint, so we pass the user id as the identifier to
    // get per-user (not per-IP) enforcement. It was 1, but the attempt is
    // counted before the export runs, so a transient failure (now a 503
    // rather than a silently empty file) would have locked the subject out
    // for an hour.
    if (req.method === 'POST' || req.method === 'GET') {
      const rl = await checkRateLimitDb(serviceSupabase, user.id, 'gdpr-export', {
        maxRequests: 3,
        windowSeconds: 3600,
      });
      if (!rl.allowed) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'You have requested several data exports in the last hour. Please try again later.',
          }),
          {
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
              'Retry-After': String(rl.retryAfterSeconds),
            },
            status: 429,
          }
        );
      }
    }

    if (req.method === 'POST') {
      // Create export request
      const { data: requestData, error: requestError } = await serviceSupabase
        .rpc('request_gdpr_data_export', {
          p_user_id: user.id,
          p_ip_address: clientIP,
          p_user_agent: userAgent,
        });

      if (requestError) {
        throw new Error(requestError.message);
      }

      return new Response(
        JSON.stringify({
          success: true,
          requestId: requestData,
          message: 'Data export request created. Processing will begin shortly.',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 202,
        }
      );
    } else if (req.method === 'GET') {
      // Every section, every row (paged past PostgREST's row cap), and any
      // query that fails fails the export instead of exporting as empty.
      const reader: ExportReader = {
        page: (spec, userId, from, to) =>
          serviceSupabase
            .from(spec.table)
            .select(spec.columns)
            .eq(spec.ownerColumn, userId)
            .order('id', { ascending: true })
            .range(from, to),
        one: (spec, userId) =>
          serviceSupabase
            .from(spec.table)
            .select(spec.columns)
            .eq(spec.ownerColumn, userId)
            .maybeSingle(),
      };

      let collected: CollectedSections;
      try {
        collected = await collectSections(reader, user.id);
      } catch (err) {
        if (!(err instanceof ExportIncompleteError)) throw err;
        console.error('[gdpr-export] export incomplete:', err.failed);
        void reportError(err, { functionName: 'gdpr-export', status: 503, method: 'GET' });
        await serviceSupabase.rpc('log_audit_event', {
          p_user_id: user.id,
          p_action: 'gdpr_data_export',
          p_status: 'failure',
          p_resource_type: 'gdpr',
          p_ip_address: clientIP,
          p_user_agent: userAgent,
          p_details: { failed_sections: err.failed.map((f) => f.section) },
          p_risk_level: 'medium',
        });
        return new Response(
          JSON.stringify({ success: false, error: err.message, failedSections: err.failed.map((f) => f.section) }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 503 }
        );
      }

      const rows = collected.rows;
      const singles = collected.singles;

      // Decrypt the lead and contact PII for the subject's own copy.
      // encrypted_* are the only store since US-086, so a subject access
      // request that returned ciphertext would not be an export at all.
      // decryptSecret passes through any value that is not enc:v1: prefixed.
      const decryptPii = (list: Row[]) =>
        Promise.all(
          list.map(async (row) => {
            const { encrypted_phone, encrypted_email, ...rest } = row;
            const [email, phone] = await Promise.all([
              decryptSecret(encrypted_email as string | null),
              decryptSecret(encrypted_phone as string | null),
            ]);
            return { ...rest, email: email ?? null, phone: phone ?? null };
          })
        );
      const [leads, contacts] = await Promise.all([decryptPii(rows.leads), decryptPii(rows.contacts)]);

      const exportData = {
        exportedAt: new Date().toISOString(),
        user: {
          id: user.id,
          email: user.email || '',
          createdAt: user.created_at || '',
          lastSignIn: user.last_sign_in_at || null,
        },
        profile: singles.profile,
        settings: singles.settings,
        listings: rows.listings,
        openHouses: rows.openHouses,
        leads,
        leadActivities: rows.leadActivities,
        contacts,
        contactKeyDates: rows.contactKeyDates,
        contactInteractions: rows.contactInteractions,
        testimonials: rows.testimonials,
        links: rows.links,
        customPages: rows.customPages,
        blogPosts: rows.blogPosts,
        workflows: rows.workflows,
        notifications: rows.notifications,
        billing: {
          subscriptions: rows.subscriptions,
          invoices: rows.invoices,
        },
        teams: {
          memberships: rows.teamMemberships,
          roles: rows.roles,
        },
        analytics: {
          profileViews: rows.profileViews,
          events: rows.analyticsEvents,
        },
        security: {
          sessions: rows.sessions,
          loginAttempts: rows.loginAttempts.map(maskLoginAttempt),
          mfaSettings: singles.mfaSettings,
          apiKeys: rows.apiKeys,
          auditLogs: rows.auditLogs,
        },
        gdprRequests: rows.gdprRequests,
        meta: {
          counts: sectionCounts(collected),
          // Sections that hit the per-section ceiling. Named so a partial
          // section is never mistaken for a complete one.
          truncated: collected.truncated,
        },
      };

      // Close the newest pending export request, if the subject made one.
      // (An UPDATE with order/limit is not something PostgREST does by
      // default, so find the row first and update it by id.)
      const { data: pending, error: pendingError } = await serviceSupabase
        .from('gdpr_data_requests')
        .select('id')
        .eq('user_id', user.id)
        .eq('request_type', 'export')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (pendingError) {
        console.error('[gdpr-export] could not read pending export request:', pendingError.message);
      } else if (pending) {
        const { error: closeError } = await serviceSupabase
          .from('gdpr_data_requests')
          .update({ status: 'completed', completed_at: new Date().toISOString() })
          .eq('id', pending.id);
        if (closeError) {
          console.error('[gdpr-export] could not close export request:', closeError.message);
        }
      }

      const { error: auditError } = await serviceSupabase.rpc('log_audit_event', {
        p_user_id: user.id,
        p_action: 'gdpr_data_export',
        p_status: 'success',
        p_resource_type: 'gdpr',
        p_ip_address: clientIP,
        p_user_agent: userAgent,
        p_details: { records_exported: exportData.meta.counts, truncated: collected.truncated },
        p_risk_level: 'medium',
      });
      if (auditError) {
        console.error('[gdpr-export] could not write audit entry:', auditError.message);
      }

      // Return as downloadable JSON
      const filename = `agentbio-data-export-${new Date().toISOString().split('T')[0]}.json`;

      return new Response(
        JSON.stringify(exportData, null, 2),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'Content-Disposition': `attachment; filename="${filename}"`,
          },
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
    const status = errorMessage.includes('Unauthorized') ? 401 :
                   errorMessage.includes('already pending') ? 409 : 500;

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
