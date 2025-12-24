import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import { getCorsHeaders } from '../_shared/cors.ts';
import { getClientIP } from '../_shared/auth.ts';
import { sanitizeRedirectUrl } from '../_shared/url-validation.ts';
import { decode as base64Decode, encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

/**
 * SSO Callback - Handle SAML Response or OIDC Callback
 * Validates response, creates/updates user, issues session
 */

// Simple XML parser for SAML responses
function extractFromXML(xml: string, tagName: string): string | null {
  const regex = new RegExp(`<[^>]*:?${tagName}[^>]*>([^<]*)<`, 'i');
  const match = xml.match(regex);
  return match ? match[1].trim() : null;
}

// Extract SAML attributes
function extractSAMLAttributes(xml: string): Record<string, string> {
  const attributes: Record<string, string> = {};

  // Common attribute patterns
  const patterns = [
    { name: 'email', regex: /<(?:saml2?:)?Attribute[^>]*Name="(?:email|mail|http:\/\/schemas\.xmlsoap\.org\/ws\/2005\/05\/identity\/claims\/emailaddress)"[^>]*>[\s\S]*?<(?:saml2?:)?AttributeValue[^>]*>([^<]+)</ },
    { name: 'firstName', regex: /<(?:saml2?:)?Attribute[^>]*Name="(?:firstName|givenName|http:\/\/schemas\.xmlsoap\.org\/ws\/2005\/05\/identity\/claims\/givenname)"[^>]*>[\s\S]*?<(?:saml2?:)?AttributeValue[^>]*>([^<]+)</ },
    { name: 'lastName', regex: /<(?:saml2?:)?Attribute[^>]*Name="(?:lastName|surname|sn|http:\/\/schemas\.xmlsoap\.org\/ws\/2005\/05\/identity\/claims\/surname)"[^>]*>[\s\S]*?<(?:saml2?:)?AttributeValue[^>]*>([^<]+)</ },
    { name: 'displayName', regex: /<(?:saml2?:)?Attribute[^>]*Name="(?:displayName|name|http:\/\/schemas\.xmlsoap\.org\/ws\/2005\/05\/identity\/claims\/name)"[^>]*>[\s\S]*?<(?:saml2?:)?AttributeValue[^>]*>([^<]+)</ },
  ];

  for (const pattern of patterns) {
    const match = xml.match(pattern.regex);
    if (match) {
      attributes[pattern.name] = match[1].trim();
    }
  }

  // Extract NameID
  const nameIdMatch = xml.match(/<(?:saml2?:)?NameID[^>]*>([^<]+)</);
  if (nameIdMatch) {
    attributes.nameId = nameIdMatch[1].trim();
  }

  return attributes;
}

// Exchange OIDC code for tokens
async function exchangeOIDCCode(
  code: string,
  clientId: string,
  clientSecret: string,
  tokenEndpoint: string,
  redirectUri: string
): Promise<{ access_token: string; id_token: string }> {
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
  });

  const response = await fetch(tokenEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('OIDC token exchange failed:', error);
    throw new Error('Failed to exchange authorization code');
  }

  return response.json();
}

// Decode JWT payload (without verification - verification should be done properly in production)
function decodeJWTPayload(token: string): Record<string, any> {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid JWT format');
  }

  const payload = parts[1];
  const decoded = new TextDecoder().decode(base64Decode(payload.replace(/-/g, '+').replace(/_/g, '/')));
  return JSON.parse(decoded);
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

    const body = await req.json();
    const { SAMLResponse, RelayState, code, state, error: oauthError, error_description } = body;

    // Handle OAuth/OIDC errors
    if (oauthError) {
      throw new Error(error_description || oauthError);
    }

    let ssoSession;
    let ssoConfig;
    let userEmail: string;
    let userAttributes: Record<string, string> = {};
    let subjectId: string;

    if (SAMLResponse) {
      // Handle SAML Response
      const samlXml = new TextDecoder().decode(base64Decode(SAMLResponse));

      // Parse RelayState
      let relayStateData: { requestId: string; state: string } = { requestId: '', state: '' };
      if (RelayState) {
        try {
          relayStateData = JSON.parse(new TextDecoder().decode(base64Decode(RelayState)));
        } catch {
          console.error('Failed to parse RelayState');
        }
      }

      // Find session by request ID
      const { data: session, error: sessionError } = await supabase
        .from('sso_login_sessions')
        .select('*, enterprise_sso_config(*)')
        .eq('request_id', relayStateData.requestId)
        .eq('status', 'pending')
        .single();

      if (sessionError || !session) {
        throw new Error('Invalid or expired SSO session');
      }

      ssoSession = session;
      ssoConfig = session.enterprise_sso_config;

      // Extract user info from SAML assertion
      userAttributes = extractSAMLAttributes(samlXml);
      userEmail = userAttributes.email || userAttributes.nameId || ssoSession.user_email;
      subjectId = userAttributes.nameId || userEmail;

      if (!userEmail) {
        throw new Error('Unable to extract email from SAML response');
      }

      // Store SAML response for audit
      await supabase
        .from('sso_login_sessions')
        .update({
          saml_response: SAMLResponse,
          saml_assertion_id: extractFromXML(samlXml, 'AssertionID') || undefined,
        })
        .eq('id', ssoSession.id);

    } else if (code && state) {
      // Handle OIDC Callback
      const { data: session, error: sessionError } = await supabase
        .from('sso_login_sessions')
        .select('*, enterprise_sso_config(*)')
        .eq('request_id', state)
        .eq('status', 'pending')
        .single();

      if (sessionError || !session) {
        throw new Error('Invalid or expired SSO session');
      }

      ssoSession = session;
      ssoConfig = session.enterprise_sso_config;

      // Exchange code for tokens
      const tokens = await exchangeOIDCCode(
        code,
        ssoConfig.oidc_client_id,
        ssoConfig.oidc_client_secret,
        ssoConfig.oidc_token_endpoint,
        `${appUrl}/auth/sso/callback`
      );

      // Decode ID token to get user info
      const idTokenPayload = decodeJWTPayload(tokens.id_token);

      userEmail = idTokenPayload.email;
      subjectId = idTokenPayload.sub;
      userAttributes = {
        email: idTokenPayload.email,
        firstName: idTokenPayload.given_name,
        lastName: idTokenPayload.family_name,
        displayName: idTokenPayload.name,
        nameId: idTokenPayload.sub,
      };

      if (!userEmail) {
        throw new Error('Unable to extract email from OIDC response');
      }
    } else {
      throw new Error('Invalid SSO callback - missing SAMLResponse or code');
    }

    // Check if session is expired
    if (new Date(ssoSession.expires_at) < new Date()) {
      throw new Error('SSO session has expired');
    }

    // Find or create user
    let userId: string | null = null;

    // Check existing SSO mapping
    const { data: existingMapping } = await supabase
      .from('sso_user_mappings')
      .select('user_id')
      .eq('config_id', ssoConfig.id)
      .eq('sso_subject_id', subjectId)
      .single();

    if (existingMapping) {
      userId = existingMapping.user_id;

      // Update mapping with latest info
      await supabase
        .from('sso_user_mappings')
        .update({
          sso_email: userEmail,
          sso_attributes: userAttributes,
          last_login_at: new Date().toISOString(),
          login_count: supabase.rpc('increment', { x: 1 }),
        })
        .eq('config_id', ssoConfig.id)
        .eq('sso_subject_id', subjectId);

    } else {
      // Check if user exists by email
      const { data: existingUser } = await supabase.auth.admin.listUsers();
      const userByEmail = existingUser?.users?.find(u => u.email === userEmail);

      if (userByEmail) {
        userId = userByEmail.id;
      } else if (ssoConfig.auto_provision_users) {
        // Create new user
        const fullName = userAttributes.displayName ||
          [userAttributes.firstName, userAttributes.lastName].filter(Boolean).join(' ') ||
          userEmail.split('@')[0];

        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
          email: userEmail,
          email_confirm: true,
          user_metadata: {
            full_name: fullName,
            sso_provider: ssoConfig.sso_provider,
            sso_subject_id: subjectId,
          },
        });

        if (createError) {
          console.error('Error creating user:', createError);
          throw new Error('Failed to create user account');
        }

        userId = newUser.user.id;

        // Create profile
        await supabase.from('profiles').insert({
          id: userId,
          username: userEmail.split('@')[0] + '_' + Date.now().toString(36),
          full_name: fullName,
        });

        // Assign default role
        await supabase.from('user_roles').insert({
          user_id: userId,
          role: ssoConfig.default_role || 'user',
        });

        // Log user provisioning
        await supabase.from('sso_audit_logs').insert({
          config_id: ssoConfig.id,
          user_id: userId,
          event_type: 'user_provisioned',
          event_details: { email: userEmail, sso_subject_id: subjectId },
          ip_address: clientIP,
          user_agent: userAgent,
        });
      } else {
        throw new Error('User account not found and auto-provisioning is disabled');
      }

      // Create SSO mapping
      await supabase.from('sso_user_mappings').insert({
        user_id: userId,
        config_id: ssoConfig.id,
        sso_subject_id: subjectId,
        sso_email: userEmail,
        sso_attributes: userAttributes,
      });
    }

    if (!userId) {
      throw new Error('Failed to authenticate user');
    }

    // Generate session token using Supabase Admin
    const { data: sessionData, error: sessionGenError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: userEmail,
      options: {
        redirectTo: ssoSession.redirect_uri || `${appUrl}/dashboard`,
      },
    });

    if (sessionGenError || !sessionData) {
      console.error('Error generating session:', sessionGenError);
      throw new Error('Failed to create session');
    }

    // Update SSO session as completed
    await supabase
      .from('sso_login_sessions')
      .update({
        status: 'completed',
        user_id: userId,
        completed_at: new Date().toISOString(),
      })
      .eq('id', ssoSession.id);

    // Update SSO config last used
    await supabase
      .from('enterprise_sso_config')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', ssoConfig.id);

    // Log successful login
    await supabase.from('sso_audit_logs').insert({
      config_id: ssoConfig.id,
      user_id: userId,
      event_type: 'login_success',
      event_details: { email: userEmail },
      ip_address: clientIP,
      user_agent: userAgent,
    });

    // Validate redirect URL before returning (defense in depth)
    const finalRedirectUrl = sanitizeRedirectUrl(
      sessionData.properties?.action_link || ssoSession.redirect_uri,
      appUrl,
      '/dashboard',
      ['*.agentbio.net', 'localhost:8080', '127.0.0.1:8080'] // Whitelisted domains
    );

    return new Response(
      JSON.stringify({
        success: true,
        userId,
        email: userEmail,
        redirectUrl: finalRedirectUrl,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An error occurred';
    console.error('SSO Callback Error:', message);

    return new Response(
      JSON.stringify({ error: message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
