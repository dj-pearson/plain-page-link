import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { getCorsHeaders } from '../_shared/cors.ts';
import { getErrorMessage } from '../_shared/errorHelpers.ts';
import { requireAuth } from '../_shared/auth.ts';
import { successResponse, errorResponse, unauthorizedResponse, handleUnexpectedError } from '../_shared/response.ts';

/**
 * Google Search Console OAuth Handler
 * Exchanges authorization code for access tokens and stores them securely
 */

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get('origin'));

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { code, redirectUri } = await req.json();

    if (!code) {
      return errorResponse('Authorization code is required', 'REQUEST_VALIDATION_FAILED', req);
    }

    // Get OAuth credentials from environment
    const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID");
    const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET");
    const REDIRECT_URI = redirectUri || Deno.env.get("GOOGLE_REDIRECT_URI");

    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      return errorResponse('Google OAuth credentials not configured', 'INTERNAL_SERVER_ERROR', req, 500);
    }

    console.log('Exchanging authorization code for tokens...');

    // Exchange authorization code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: REDIRECT_URI!,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Token exchange failed:', errorText);
      throw new Error(`OAuth token exchange failed: ${tokenResponse.status} - ${errorText}`);
    }

    const tokens = await tokenResponse.json();
    console.log('Tokens obtained successfully');

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
      return unauthorizedResponse(req);
    }

    // Calculate token expiration
    const expiresAt = new Date(Date.now() + (tokens.expires_in * 1000));

    // Check if credentials already exist for this user
    const { data: existing } = await supabase
      .from('gsc_oauth_credentials')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (existing) {
      // Update existing credentials
      const { error: updateError } = await supabase
        .from('gsc_oauth_credentials')
        .update({
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token || undefined,
          token_type: tokens.token_type || 'Bearer',
          expires_at: expiresAt.toISOString(),
          scope: tokens.scope,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);

      if (updateError) {
        console.error('Failed to update credentials:', updateError);
        throw new Error(`Failed to update credentials: ${updateError.message}`);
      }

      console.log('Updated existing GSC credentials');
    } else {
      // Insert new credentials
      const { error: insertError } = await supabase
        .from('gsc_oauth_credentials')
        .insert({
          user_id: userId,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          token_type: tokens.token_type || 'Bearer',
          expires_at: expiresAt.toISOString(),
          scope: tokens.scope,
        });

      if (insertError) {
        console.error('Failed to save credentials:', insertError);
        throw new Error(`Failed to save credentials: ${insertError.message}`);
      }

      console.log('Saved new GSC credentials');
    }

    return successResponse({
      message: 'Google Search Console connected successfully',
      expiresAt: expiresAt.toISOString(),
    }, req);

  } catch (error) {
    return handleUnexpectedError(error, req);
  }
});
