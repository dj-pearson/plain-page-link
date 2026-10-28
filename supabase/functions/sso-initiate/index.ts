import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import { getCorsHeaders } from '../_shared/cors.ts';
import { getClientIP } from '../_shared/auth.ts';
import { sanitizeRedirectUrl } from '../_shared/url-validation.ts';
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";
import { getSiteUrl } from '../_shared/env.ts';
import { SAML_DISABLED_MESSAGE, isOidcProvider, isSamlProvider } from '../_shared/sso.ts';

/**
 * SSO Initiate - Start an OIDC authentication flow
 * Handles domain detection and redirects to the IdP.
 *
 * SAML-family providers (saml, okta, azure_ad) are refused (US-233): the
 * callback could not verify a SAML response's signature, so a forged one
 * signed in as any user. See _shared/sso.ts.
 */

// Generate secure random string for state/nonce
function generateSecureRandom(length = 32): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return base64Encode(array.buffer as ArrayBuffer).replace(/[+/=]/g, '').substring(0, length);
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get('origin'));

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') as string;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string;
    const appUrl = getSiteUrl();
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const clientIP = getClientIP(req);
    const userAgent = req.headers.get('user-agent') || '';

    const { email, redirectUri } = await req.json();

    if (!email) {
      throw new Error('Email is required');
    }

    // Extract domain from email
    const domain = email.split('@')[1]?.toLowerCase();
    if (!domain) {
      throw new Error('Invalid email format');
    }

    // Find SSO configuration for this domain
    const { data: ssoConfig, error: configError } = await supabase
      .from('enterprise_sso_config')
      .select('*')
      .eq('organization_domain', domain)
      .eq('active', true)
      .single();

    if (configError || !ssoConfig) {
      // No SSO configured for this domain
      return new Response(
        JSON.stringify({
          ssoAvailable: false,
          message: 'No SSO configuration found for this domain',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // Refuse before a session row is written: the callback would reject the
    // response anyway, and the user should hear why now rather than after a
    // round trip through their IdP.
    if (isSamlProvider(ssoConfig.sso_provider)) {
      return new Response(
        JSON.stringify({ error: SAML_DISABLED_MESSAGE, ssoAvailable: false }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    if (!isOidcProvider(ssoConfig.sso_provider)) {
      throw new Error('Unsupported SSO provider');
    }

    const state = generateSecureRandom(32);
    const nonce = generateSecureRandom(32);

    // Validate and sanitize redirect URL to prevent open redirect attacks
    const safeRedirectUri = sanitizeRedirectUrl(
      redirectUri,
      appUrl,
      '/dashboard',
      ['*.agentbio.net', 'localhost:8080', '127.0.0.1:8080'] // Whitelisted domains
    );

    // Store session for validation on callback
    const { error: sessionError } = await supabase
      .from('sso_login_sessions')
      .insert({
        config_id: ssoConfig.id,
        request_id: state, // the callback finds the session by OIDC state
        user_email: email,
        status: 'pending',
        oidc_nonce: nonce,
        ip_address: clientIP,
        user_agent: userAgent,
        redirect_uri: safeRedirectUri,
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes
      });

    if (sessionError) {
      console.error('Error creating SSO session:', sessionError);
      throw new Error('Failed to initiate SSO');
    }

    // Log the initiation
    await supabase.from('sso_audit_logs').insert({
      config_id: ssoConfig.id,
      event_type: 'login_initiated',
      event_details: { email, domain },
      ip_address: clientIP,
      user_agent: userAgent,
    });

    // Generate OIDC authorization URL
    const params = new URLSearchParams({
      client_id: ssoConfig.oidc_client_id,
      response_type: 'code',
      scope: (ssoConfig.oidc_scopes || ['openid', 'email', 'profile']).join(' '),
      redirect_uri: `${appUrl}/auth/sso/callback`,
      state: state,
      nonce: nonce,
    });

    // Add login_hint for better UX
    params.append('login_hint', email);

    const authUrl = `${ssoConfig.oidc_authorization_endpoint}?${params.toString()}`;

    return new Response(
      JSON.stringify({
        ssoAvailable: true,
        provider: ssoConfig.sso_provider,
        organizationName: ssoConfig.organization_name,
        authUrl,
        requestId: state,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An error occurred';
    console.error('SSO Initiate Error:', message);

    return new Response(
      JSON.stringify({ error: message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
