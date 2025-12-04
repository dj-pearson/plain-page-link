/**
 * GDPR Data Export Edge Function
 * Exports all user data in JSON format for GDPR compliance
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { requireAuth, getClientIP } from '../_shared/auth.ts';

interface ExportData {
  exportedAt: string;
  user: {
    id: string;
    email: string;
    createdAt: string;
    lastSignIn: string | null;
  };
  profile: Record<string, unknown> | null;
  settings: Record<string, unknown> | null;
  listings: unknown[];
  leads: unknown[];
  testimonials: unknown[];
  links: unknown[];
  blogPosts: unknown[];
  analytics: {
    profileViews: unknown[];
    searchQueries: unknown[];
  };
  security: {
    sessions: unknown[];
    loginAttempts: unknown[];
    mfaSettings: Record<string, unknown> | null;
    auditLogs: unknown[];
  };
  gdprRequests: unknown[];
}

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

    // Use service role for comprehensive data access
    const serviceSupabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

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
      // Generate and return data export immediately
      // In production, this would be queued and processed async

      // Fetch all user data in parallel
      const [
        profileResult,
        settingsResult,
        listingsResult,
        leadsResult,
        testimonialsResult,
        linksResult,
        blogPostsResult,
        profileViewsResult,
        sessionsResult,
        loginAttemptsResult,
        mfaSettingsResult,
        auditLogsResult,
        gdprRequestsResult,
      ] = await Promise.all([
        serviceSupabase.from('profiles').select('*').eq('id', user.id).single(),
        serviceSupabase.from('user_settings').select('*').eq('user_id', user.id).single(),
        serviceSupabase.from('listings').select('*').eq('user_id', user.id),
        serviceSupabase.from('leads').select('*').eq('user_id', user.id),
        serviceSupabase.from('testimonials').select('*').eq('user_id', user.id),
        serviceSupabase.from('links').select('*').eq('user_id', user.id),
        serviceSupabase.from('blog_posts').select('*').eq('author_id', user.id),
        serviceSupabase.from('profile_views').select('*').eq('profile_id', user.id).limit(1000),
        serviceSupabase.from('user_sessions').select('*').eq('user_id', user.id),
        serviceSupabase.from('login_attempts').select('*').eq('user_id', user.id).limit(100),
        serviceSupabase.from('user_mfa_settings').select('id, mfa_enabled, mfa_method, verified_at, created_at').eq('user_id', user.id).single(),
        serviceSupabase.from('audit_logs').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(500),
        serviceSupabase.from('gdpr_data_requests').select('*').eq('user_id', user.id),
      ]);

      // Build export data object
      const exportData: ExportData = {
        exportedAt: new Date().toISOString(),
        user: {
          id: user.id,
          email: user.email || '',
          createdAt: user.created_at || '',
          lastSignIn: user.last_sign_in_at || null,
        },
        profile: profileResult.data || null,
        settings: settingsResult.data || null,
        listings: listingsResult.data || [],
        leads: leadsResult.data || [],
        testimonials: testimonialsResult.data || [],
        links: linksResult.data || [],
        blogPosts: blogPostsResult.data || [],
        analytics: {
          profileViews: profileViewsResult.data || [],
          searchQueries: [], // Add if you have search query tracking
        },
        security: {
          sessions: (sessionsResult.data || []).map(s => ({
            ...s,
            session_token_hash: '[REDACTED]', // Don't expose token hashes
          })),
          loginAttempts: (loginAttemptsResult.data || []).map(a => ({
            ...a,
            device_fingerprint: a.device_fingerprint ? '[PRESENT]' : null,
          })),
          mfaSettings: mfaSettingsResult.data ? {
            ...mfaSettingsResult.data,
            totp_secret: '[REDACTED]',
            backup_codes: '[REDACTED]',
          } : null,
          auditLogs: auditLogsResult.data || [],
        },
        gdprRequests: gdprRequestsResult.data || [],
      };

      // Update the export request status
      await serviceSupabase
        .from('gdpr_data_requests')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .eq('request_type', 'export')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1);

      // Log the export
      await serviceSupabase.rpc('log_audit_event', {
        p_user_id: user.id,
        p_action: 'gdpr_data_export',
        p_status: 'success',
        p_resource_type: 'gdpr',
        p_ip_address: clientIP,
        p_user_agent: userAgent,
        p_details: JSON.stringify({
          records_exported: {
            listings: exportData.listings.length,
            leads: exportData.leads.length,
            testimonials: exportData.testimonials.length,
            links: exportData.links.length,
            blog_posts: exportData.blogPosts.length,
            audit_logs: exportData.security.auditLogs.length,
          },
        }),
        p_risk_level: 'medium',
      });

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
