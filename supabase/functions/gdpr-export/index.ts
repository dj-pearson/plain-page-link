/**
 * GDPR Data Export Edge Function
 *
 * GET builds the export in this request and returns it as a download, written
 * a page at a time and streamed once it outgrows a small buffer (US-584). It
 * does not touch the subject's queued requests (US-424).
 * POST queues it: scheduled-maintenance builds the same document into the
 * private gdpr-exports bucket and emails the subject a link that expires
 * (US-397, _shared/gdpr-export-queue.ts). An account too large to export in one
 * request is served by the queue.
 * POST { action: 'resend_link', requestId } emails a fresh link to the
 * caller's own completed export while its file is still held (US-404).
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import { getCorsHeaders, handleCorsPreFlight } from '../_shared/cors.ts';
import { requireAuth, getClientIP } from '../_shared/auth.ts';
import { checkRateLimitDb } from '../_shared/rate-limiter.ts';
import { decryptSecret } from '../_shared/encryption.ts';
import { reportError } from '../_shared/report.ts';
import { sendEmail } from '../_shared/email.ts';
import { getSiteUrl } from '../_shared/env.ts';
import { resendExportLink, supabaseExportResendStore } from '../_shared/gdpr-export-queue.ts';
import {
  ExportIncompleteError,
  exportDocumentChunks,
  exportDownloadStream,
  startExportDownload,
  supabaseExportReader,
  type ExportSummary,
} from '../_shared/gdpr-export.ts';

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
    // POST { action: 'resend_link', requestId } re-emails a fresh link to a
    // completed export that has not expired (US-404). Any other POST body,
    // including none, queues a new export as before.
    let postBody: Record<string, unknown> | null = null;
    if (req.method === 'POST') {
      const parsed: unknown = await req.json().catch(() => null);
      postBody = parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : null;
    }
    const isResend = postBody?.action === 'resend_link';

    // Its own budget, so re-sending a link never spends the subject's export
    // attempts (and vice versa). Each one sends an email, hence the limit.
    if (isResend) {
      const rl = await checkRateLimitDb(serviceSupabase, user.id, 'gdpr-export-resend', {
        maxRequests: 3,
        windowSeconds: 3600,
      });
      if (!rl.allowed) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'You have asked for the link several times in the last hour. Please check your inbox and spam folder, or try again later.',
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
      const outcome = await resendExportLink(
        supabaseExportResendStore(serviceSupabase, {
          decrypt: decryptSecret,
          sendEmail: (email) => sendEmail(email),
        }),
        { requestId: postBody?.requestId, userId: user.id, now: new Date(), siteUrl: getSiteUrl() }
      );
      return new Response(
        JSON.stringify(
          outcome.ok
            ? {
                success: true,
                expiresAt: outcome.expiresAt,
                message: 'We have emailed you a fresh download link.',
              }
            : { success: false, error: outcome.error }
        ),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: outcome.ok ? 200 : outcome.status,
        }
      );
    }

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
          message: 'Data export requested. We will email you a download link when it is ready, usually within the hour.',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 202,
        }
      );
    } else if (req.method === 'GET') {
      // Every section, every row (paged past PostgREST's row cap), written a
      // page at a time (US-584). A query that fails fails the export instead
      // of exporting as empty.
      const reader = supabaseExportReader(serviceSupabase);
      // decryptSecret passes through any value that is not enc:v1: prefixed.
      const chunks = exportDocumentChunks(reader, user, decryptSecret, { failFast: true });

      const auditFailure = async (err: ExportIncompleteError, streamed: boolean) => {
        console.error('[gdpr-export] export incomplete:', err.failed, streamed ? '(after streaming began)' : '');
        void reportError(err, { functionName: 'gdpr-export', status: streamed ? 200 : 503, method: 'GET' });
        await serviceSupabase.rpc('log_audit_event', {
          p_user_id: user.id,
          p_action: 'gdpr_data_export',
          p_status: 'failure',
          p_resource_type: 'gdpr',
          p_ip_address: clientIP,
          p_user_agent: userAgent,
          p_details: { failed_sections: err.failed.map((f) => f.section), streamed },
          p_risk_level: 'medium',
        });
      };

      // A queued export the subject made earlier is deliberately left alone
      // (US-424). This download has no file in the bucket and sends no email,
      // so marking the request completed showed 'Completed' with no link; the
      // queue still builds it and emails the link the subject asked for.
      const auditSuccess = async (summary: ExportSummary) => {
        const { error: auditError } = await serviceSupabase.rpc('log_audit_event', {
          p_user_id: user.id,
          p_action: 'gdpr_data_export',
          p_status: 'success',
          p_resource_type: 'gdpr',
          p_ip_address: clientIP,
          p_user_agent: userAgent,
          p_details: { records_exported: summary.counts, truncated: summary.truncated },
          p_risk_level: 'medium',
        });
        if (auditError) {
          console.error('[gdpr-export] could not write audit entry:', auditError.message);
        }
      };

      const start = await startExportDownload(chunks);

      if (start.kind === 'failed') {
        await auditFailure(start.error, false);
        return new Response(
          JSON.stringify({
            success: false,
            error: start.error.message,
            failedSections: start.error.failed.map((f) => f.section),
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 503 }
        );
      }

      const filename = `agentbio-data-export-${new Date().toISOString().split('T')[0]}.json`;
      const downloadHeaders = {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      };

      if (start.kind === 'complete') {
        await auditSuccess(start.summary);
        return new Response(start.body, { headers: downloadHeaders, status: 200 });
      }

      // Larger than the buffer: streamed, one page held at a time. A section
      // that fails from here on aborts the body before the closing brace.
      const body = exportDownloadStream(start.head, start.rest, async (outcome) => {
        if (outcome.ok) {
          await auditSuccess(outcome.summary);
        } else if ('cancelled' in outcome) {
          // The client stopped reading (tab closed, the dashboard's timeout, a
          // caller that read part and left). Part of the PII was released, so
          // the download is still recorded.
          const { error: auditError } = await serviceSupabase.rpc('log_audit_event', {
            p_user_id: user.id,
            p_action: 'gdpr_data_export',
            p_status: 'failure',
            p_resource_type: 'gdpr',
            p_ip_address: clientIP,
            p_user_agent: userAgent,
            p_details: { streamed: true, cancelled: true },
            p_risk_level: 'medium',
          });
          if (auditError) {
            console.error('[gdpr-export] could not write audit entry:', auditError.message);
          }
        } else if (outcome.error instanceof ExportIncompleteError) {
          await auditFailure(outcome.error, true);
        } else {
          console.error('[gdpr-export] streamed export failed:', outcome.error);
          void reportError(outcome.error, { functionName: 'gdpr-export', status: 200, method: 'GET' });
        }
      });
      return new Response(body, { headers: downloadHeaders, status: 200 });
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
