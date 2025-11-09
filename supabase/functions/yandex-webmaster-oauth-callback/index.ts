import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { getCorsHeaders } from '../_shared/cors.ts';

interface OAuthCallbackRequest {
  code: string;
  state?: string;
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get('origin'));
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { code, state }: OAuthCallbackRequest = await req.json();

    if (!code) {
      return new Response(
        JSON.stringify({ error: 'Authorization code is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Get user ID from authorization header
    const authHeader = req.headers.get('authorization');
    let userId = null;
    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (error) throw error;
        userId = user?.id;
      } catch (e) {
        console.error('Failed to get user:', e);
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'User ID not found' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Yandex OAuth credentials
    const YANDEX_CLIENT_ID = Deno.env.get("YANDEX_CLIENT_ID");
    const YANDEX_CLIENT_SECRET = Deno.env.get("YANDEX_CLIENT_SECRET");
    const YANDEX_REDIRECT_URI = Deno.env.get("YANDEX_WEBMASTER_REDIRECT_URI");

    if (!YANDEX_CLIENT_ID || !YANDEX_CLIENT_SECRET || !YANDEX_REDIRECT_URI) {
      throw new Error('Missing Yandex OAuth configuration');
    }

    // Exchange authorization code for access token
    const tokenResponse = await fetch('https://oauth.yandex.ru/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: YANDEX_CLIENT_ID,
        client_secret: YANDEX_CLIENT_SECRET,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Token exchange failed:', errorData);
      throw new Error('Failed to exchange authorization code for tokens');
    }

    const tokenData = await tokenResponse.json();
    const {
      access_token,
      refresh_token,
      expires_in,
      token_type = 'Bearer',
    } = tokenData;

    // Calculate expiration time
    const expiresAt = new Date(Date.now() + expires_in * 1000).toISOString();

    // Deactivate any existing active credentials for this user
    const { error: deactivateError } = await supabase
      .from('yandex_webmaster_oauth_credentials')
      .update({ is_active: false })
      .eq('user_id', userId)
      .eq('is_active', true);

    if (deactivateError) {
      console.error('Error deactivating old credentials:', deactivateError);
    }

    // Store credentials in database
    const { data: credential, error: insertError } = await supabase
      .from('yandex_webmaster_oauth_credentials')
      .insert({
        user_id: userId,
        access_token,
        refresh_token,
        token_type,
        expires_at: expiresAt,
        is_active: true,
        last_refreshed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error storing credentials:', insertError);
      throw new Error('Failed to store OAuth credentials');
    }

    console.log(`Successfully stored Yandex Webmaster OAuth credentials for user: ${userId}`);

    // Fetch available hosts from Yandex Webmaster API
    const hostsResponse = await fetch(
      'https://api.webmaster.yandex.net/v4/user/',
      {
        method: 'GET',
        headers: {
          'Authorization': `OAuth ${access_token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (hostsResponse.ok) {
      const hostsData = await hostsResponse.json();
      const hosts = hostsData.hosts || [];

      // Store hosts
      for (const host of hosts) {
        // Fetch detailed host info
        const hostDetailResponse = await fetch(
          `https://api.webmaster.yandex.net/v4/user/${host.host_id}`,
          {
            method: 'GET',
            headers: {
              'Authorization': `OAuth ${access_token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        let hostUrl = host.ascii_host_url || host.host_id;
        let verificationState = 'unknown';

        if (hostDetailResponse.ok) {
          const hostDetail = await hostDetailResponse.json();
          hostUrl = hostDetail.ascii_host_url || hostUrl;
          verificationState = hostDetail.verification?.state || 'unknown';
        }

        const { error: siteError } = await supabase
          .from('yandex_webmaster_sites')
          .upsert({
            user_id: userId,
            credential_id: credential.id,
            host_id: host.host_id,
            host_url: hostUrl,
            host_display_name: host.host_id,
            verification_state: verificationState,
            is_primary: false,
            sync_status: 'pending',
            auto_sync_enabled: true,
          }, {
            onConflict: 'user_id,host_id',
          });

        if (siteError) {
          console.error(`Error storing host ${host.host_id}:`, siteError);
        }
      }

      console.log(`Stored ${hosts.length} Yandex Webmaster host(s)`);
    } else {
      const errorText = await hostsResponse.text();
      console.warn('Failed to fetch Yandex Webmaster hosts:', errorText);
    }

    return new Response(
      JSON.stringify({
        success: true,
        credential_id: credential.id,
        message: 'Yandex Webmaster OAuth connection successful',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in Yandex Webmaster OAuth callback:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
