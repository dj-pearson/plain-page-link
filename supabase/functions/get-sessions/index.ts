/**
 * Get User Sessions Edge Function
 * Returns all active sessions for the authenticated user
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { requireAuth, getClientIP } from '../_shared/auth.ts';

interface Session {
  id: string;
  ip_address: string | null;
  user_agent: string | null;
  device_type: string | null;
  browser: string | null;
  os: string | null;
  location_city: string | null;
  location_country: string | null;
  is_current: boolean;
  last_activity_at: string;
  created_at: string;
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

    // Get all active sessions using the helper function
    const { data: sessions, error } = await supabase
      .rpc('get_user_sessions', { p_user_id: user.id });

    if (error) {
      throw new Error(`Failed to fetch sessions: ${error.message}`);
    }

    // Parse user agent for the current request to identify current session
    const currentUserAgent = req.headers.get('user-agent') || '';
    const currentIP = getClientIP(req);

    // Mark current session based on IP and user agent match
    const enhancedSessions = (sessions || []).map((session: Session) => ({
      ...session,
      is_current: session.is_current ||
        (session.ip_address === currentIP && session.user_agent === currentUserAgent),
    }));

    return new Response(
      JSON.stringify({
        success: true,
        sessions: enhancedSessions,
        total: enhancedSessions.length,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
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
