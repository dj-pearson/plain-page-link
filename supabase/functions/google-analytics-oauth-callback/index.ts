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

    // Google OAuth credentials
    const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID");
    const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET");
    const GOOGLE_REDIRECT_URI = Deno.env.get("GOOGLE_ANALYTICS_REDIRECT_URI");

    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI) {
      throw new Error('Missing Google OAuth configuration');
    }

    // Exchange authorization code for access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: GOOGLE_REDIRECT_URI,
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
      scope,
      token_type = 'Bearer',
    } = tokenData;

    // Calculate expiration time
    const expiresAt = new Date(Date.now() + expires_in * 1000).toISOString();

    // Deactivate any existing active credentials for this user
    const { error: deactivateError } = await supabase
      .from('ga4_oauth_credentials')
      .update({ is_active: false })
      .eq('user_id', userId)
      .eq('is_active', true);

    if (deactivateError) {
      console.error('Error deactivating old credentials:', deactivateError);
    }

    // Store credentials in database
    const { data: credential, error: insertError } = await supabase
      .from('ga4_oauth_credentials')
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

    console.log(`Successfully stored GA4 OAuth credentials for user: ${userId}`);

    // Fetch available GA4 properties
    const propertiesResponse = await fetch(
      'https://analyticsadmin.googleapis.com/v1beta/accountSummaries',
      {
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (propertiesResponse.ok) {
      const propertiesData = await propertiesResponse.json();
      const accountSummaries = propertiesData.accountSummaries || [];

      // Extract and store properties
      for (const account of accountSummaries) {
        const propertySummaries = account.propertySummaries || [];

        for (const property of propertySummaries) {
          // Extract property ID from resource name (format: "properties/123456789")
          const propertyId = property.property.split('/')[1];

          const { error: propertyError } = await supabase
            .from('ga4_properties')
            .upsert({
              user_id: userId,
              credential_id: credential.id,
              property_id: propertyId,
              property_name: property.property,
              display_name: property.displayName,
              is_primary: false, // User can set primary later
              sync_status: 'pending',
              auto_sync_enabled: true,
            }, {
              onConflict: 'user_id,property_id',
            });

          if (propertyError) {
            console.error(`Error storing property ${propertyId}:`, propertyError);
          }
        }
      }

      console.log(`Stored ${accountSummaries.length} GA4 account(s) with properties`);
    } else {
      console.warn('Failed to fetch GA4 properties:', await propertiesResponse.text());
    }

    return new Response(
      JSON.stringify({
        success: true,
        credential_id: credential.id,
        message: 'Google Analytics OAuth connection successful',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in Google Analytics OAuth callback:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
