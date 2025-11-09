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

    // Microsoft OAuth credentials (Bing uses Microsoft OAuth)
    const MICROSOFT_CLIENT_ID = Deno.env.get("MICROSOFT_CLIENT_ID");
    const MICROSOFT_CLIENT_SECRET = Deno.env.get("MICROSOFT_CLIENT_SECRET");
    const MICROSOFT_REDIRECT_URI = Deno.env.get("BING_WEBMASTER_REDIRECT_URI");

    if (!MICROSOFT_CLIENT_ID || !MICROSOFT_CLIENT_SECRET || !MICROSOFT_REDIRECT_URI) {
      throw new Error('Missing Microsoft OAuth configuration for Bing Webmaster');
    }

    // Exchange authorization code for access token
    const tokenResponse = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: MICROSOFT_CLIENT_ID,
        client_secret: MICROSOFT_CLIENT_SECRET,
        redirect_uri: MICROSOFT_REDIRECT_URI,
        grant_type: 'authorization_code',
        scope: 'https://api.bing.microsoft.com/webmaster.read offline_access',
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
      scope,
      token_type = 'Bearer',
    } = tokenData;

    // Calculate expiration time
    const expiresAt = new Date(Date.now() + expires_in * 1000).toISOString();

    // Deactivate any existing active credentials for this user
    const { error: deactivateError } = await supabase
      .from('bing_webmaster_oauth_credentials')
      .update({ is_active: false })
      .eq('user_id', userId)
      .eq('is_active', true);

    if (deactivateError) {
      console.error('Error deactivating old credentials:', deactivateError);
    }

    // Store credentials in database
    const { data: credential, error: insertError } = await supabase
      .from('bing_webmaster_oauth_credentials')
      .insert({
        user_id: userId,
        access_token,
        refresh_token,
        token_type,
        expires_at: expiresAt,
        scope,
        is_active: true,
        last_refreshed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error storing credentials:', insertError);
      throw new Error('Failed to store OAuth credentials');
    }

    console.log(`Successfully stored Bing Webmaster OAuth credentials for user: ${userId}`);

    // Fetch available sites from Bing Webmaster Tools
    const sitesResponse = await fetch(
      'https://ssl.bing.com/webmaster/api.svc/json/GetSites',
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (sitesResponse.ok) {
      const sitesData = await sitesResponse.json();
      const sites = sitesData.d || [];

      // Store sites
      for (const site of sites) {
        const { error: siteError } = await supabase
          .from('bing_webmaster_sites')
          .upsert({
            user_id: userId,
            credential_id: credential.id,
            site_url: site.SiteUrl || site.Url,
            site_name: site.SiteName || site.SiteUrl,
            is_verified: site.IsVerified || false,
            is_primary: false,
            sync_status: 'pending',
            auto_sync_enabled: true,
          }, {
            onConflict: 'user_id,site_url',
          });

        if (siteError) {
          console.error(`Error storing site ${site.SiteUrl}:`, siteError);
        }
      }

      console.log(`Stored ${sites.length} Bing Webmaster site(s)`);
    } else {
      const errorText = await sitesResponse.text();
      console.warn('Failed to fetch Bing Webmaster sites:', errorText);
    }

    return new Response(
      JSON.stringify({
        success: true,
        credential_id: credential.id,
        message: 'Bing Webmaster Tools OAuth connection successful',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in Bing Webmaster OAuth callback:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
