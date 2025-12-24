import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { getCorsHeaders } from '../_shared/cors.ts';
import { getErrorMessage } from '../_shared/errorHelpers.ts';
import { requireAuth } from '../_shared/auth.ts';

/**
 * Fetch Google Search Console Properties
 * Retrieves list of GSC properties (websites) for authenticated user
 */

interface GSCProperty {
  siteUrl: string;
  permissionLevel: string;
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get('origin'));

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Securely authenticate user with JWT verification
    let userId = null;
    try {
      const user = await requireAuth(req, supabase);
      userId = user.id;
    } catch (e) {
      console.error('Failed to authenticate user:', e);
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Fetching GSC properties for user: ${userId}`);

    // Get OAuth credentials from database
    const { data: credentials, error: credError } = await supabase
      .from('gsc_oauth_credentials')
      .select('access_token, refresh_token, expires_at')
      .eq('user_id', userId)
      .maybeSingle();

    if (credError || !credentials) {
      return new Response(
        JSON.stringify({
          error: 'Google Search Console not connected. Please authenticate first.',
          needsAuth: true
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if token is expired
    const expiresAt = new Date(credentials.expires_at);
    if (expiresAt < new Date()) {
      console.log('Access token expired, needs refresh');
      return new Response(
        JSON.stringify({
          error: 'Access token expired. Please re-authenticate.',
          needsAuth: true
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch properties from Google Search Console API
    const gscResponse = await fetch(
      'https://www.googleapis.com/webmasters/v3/sites',
      {
        headers: {
          'Authorization': `Bearer ${credentials.access_token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!gscResponse.ok) {
      const errorText = await gscResponse.text();
      console.error('GSC API error:', errorText);

      if (gscResponse.status === 401) {
        return new Response(
          JSON.stringify({
            error: 'Invalid or expired token. Please re-authenticate.',
            needsAuth: true
          }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      throw new Error(`GSC API error: ${gscResponse.status} - ${errorText}`);
    }

    const data = await gscResponse.json();
    const properties: GSCProperty[] = data.siteEntry || [];

    console.log(`Found ${properties.length} GSC properties`);

    // Save or update properties in database
    for (const property of properties) {
      const { error: upsertError } = await supabase
        .from('gsc_properties')
        .upsert({
          user_id: userId,
          property_url: property.siteUrl,
          permission_level: property.permissionLevel,
          site_url: property.siteUrl,
          is_verified: property.permissionLevel !== 'siteUnverifiedUser',
          last_sync_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,property_url',
        });

      if (upsertError) {
        console.error('Error saving property:', upsertError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        properties: properties.map(p => ({
          siteUrl: p.siteUrl,
          permissionLevel: p.permissionLevel,
          isVerified: p.permissionLevel !== 'siteUnverifiedUser',
        })),
        count: properties.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error fetching GSC properties:', error);
    return new Response(
      JSON.stringify({ error: getErrorMessage(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
