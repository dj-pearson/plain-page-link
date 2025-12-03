import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import { getCorsHeaders } from '../_shared/cors.ts';
import { getClientIP } from '../_shared/auth.ts';
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

/**
 * SSO Initiate - Start SAML or OIDC authentication flow
 * Handles domain detection and redirects to appropriate IdP
 */

// Generate secure random string for state/nonce
function generateSecureRandom(length = 32): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return base64Encode(array).replace(/[+/=]/g, '').substring(0, length);
}

// Generate SAML AuthnRequest
function generateSAMLRequest(
  entityId: string,
  acsUrl: string,
  requestId: string,
  issuer: string
): string {
  const now = new Date().toISOString();

  const samlRequest = `<?xml version="1.0" encoding="UTF-8"?>
<samlp:AuthnRequest
  xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol"
  xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion"
  ID="_${requestId}"
  Version="2.0"
  IssueInstant="${now}"
  AssertionConsumerServiceURL="${acsUrl}"
  Destination="${entityId}"
  ProtocolBinding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST">
  <saml:Issuer>${issuer}</saml:Issuer>
  <samlp:NameIDPolicy
    Format="urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress"
    AllowCreate="true"/>
</samlp:AuthnRequest>`;

  return samlRequest;
}

// Compress and encode SAML request
function encodeSAMLRequest(xml: string): string {
  const encoder = new TextEncoder();
  const data = encoder.encode(xml);
  return base64Encode(data);
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get('origin'));

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') as string;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string;
    const appUrl = Deno.env.get('APP_URL') || 'https://agentbio.net';
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

    const requestId = generateSecureRandom(32);
    const state = generateSecureRandom(32);
    const nonce = generateSecureRandom(32);

    // Store session for validation on callback
    const { error: sessionError } = await supabase
      .from('sso_login_sessions')
      .insert({
        config_id: ssoConfig.id,
        request_id: requestId,
        user_email: email,
        status: 'pending',
        oidc_nonce: nonce,
        ip_address: clientIP,
        user_agent: userAgent,
        redirect_uri: redirectUri || `${appUrl}/dashboard`,
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

    let authUrl = '';

    if (ssoConfig.sso_provider === 'saml' || ssoConfig.sso_provider === 'azure_ad' || ssoConfig.sso_provider === 'okta') {
      // Generate SAML AuthnRequest
      const acsUrl = `${appUrl}/auth/sso/callback`;
      const issuer = `${appUrl}/auth/saml/metadata`;

      const samlRequest = generateSAMLRequest(
        ssoConfig.saml_entity_id,
        acsUrl,
        requestId,
        issuer
      );

      const encodedRequest = encodeSAMLRequest(samlRequest);
      const relayState = base64Encode(new TextEncoder().encode(JSON.stringify({
        requestId,
        state,
      })));

      authUrl = `${ssoConfig.saml_sso_url}?SAMLRequest=${encodeURIComponent(encodedRequest)}&RelayState=${encodeURIComponent(relayState)}`;

    } else if (ssoConfig.sso_provider === 'oidc' || ssoConfig.sso_provider === 'google_workspace') {
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

      authUrl = `${ssoConfig.oidc_authorization_endpoint}?${params.toString()}`;

      // Update session with OIDC state
      await supabase
        .from('sso_login_sessions')
        .update({ request_id: state })
        .eq('request_id', requestId);
    }

    return new Response(
      JSON.stringify({
        ssoAvailable: true,
        provider: ssoConfig.sso_provider,
        organizationName: ssoConfig.organization_name,
        authUrl,
        requestId: ssoConfig.sso_provider.includes('oidc') || ssoConfig.sso_provider === 'google_workspace' ? state : requestId,
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
