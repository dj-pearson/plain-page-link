import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import { getCorsHeaders } from '../_shared/cors.ts';
import { getClientIP } from '../_shared/auth.ts';
import { sanitizeRedirectUrl } from '../_shared/url-validation.ts';
import { getSiteUrl } from '../_shared/env.ts';
import {
  SAML_DISABLED_MESSAGE,
  checkIdTokenClaims,
  decodeJwtPayload,
  isOidcProvider,
  mayMintLinkFor,
} from '../_shared/sso.ts';

/**
 * SSO Callback - Handle an OIDC callback and issue a session.
 *
 * SAML responses are refused (US-233): nothing verified their signature, so a
 * forged response could sign in as any user. See _shared/sso.ts.
 */

/** An error carrying the HTTP status the caller should see. */
class SsoError extends Error {
  constructor(message: string, readonly status = 400) {
    super(message);
  }
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

    const body = await req.json();
    const { SAMLResponse, code, state, error: oauthError, error_description } = body;

    // SAML is refused before anything is looked up or written: nothing here
    // can verify the response's signature, so nothing in it can be believed,
    // and no session is minted from it.
    if (SAMLResponse) {
      throw new SsoError(SAML_DISABLED_MESSAGE, 400);
    }

    // Handle OAuth/OIDC errors
    if (oauthError) {
      throw new Error(error_description || oauthError);
    }

    if (!code || !state) {
      throw new Error('Invalid SSO callback - missing code or state');
    }

    const { data: ssoSession, error: sessionError } = await supabase
      .from('sso_login_sessions')
      .select('*, enterprise_sso_config(*)')
      .eq('request_id', state)
      .eq('status', 'pending')
      .single();

    if (sessionError || !ssoSession || !ssoSession.enterprise_sso_config) {
      throw new Error('Invalid or expired SSO session');
    }

    const ssoConfig = ssoSession.enterprise_sso_config;

    if (!isOidcProvider(ssoConfig.sso_provider)) {
      throw new SsoError(SAML_DISABLED_MESSAGE, 400);
    }

    // Check expiry before spending the code at the IdP.
    if (new Date(ssoSession.expires_at) < new Date()) {
      throw new Error('SSO session has expired');
    }

    // Exchange code for tokens
    const tokens = await exchangeOIDCCode(
      code,
      ssoConfig.oidc_client_id,
      ssoConfig.oidc_client_secret,
      ssoConfig.oidc_token_endpoint,
      `${appUrl}/auth/sso/callback`
    );

    // The ID token came straight from the token endpoint over TLS; its claims
    // must still name this client, this login's nonce, and the org's domain.
    let claims: Record<string, unknown>;
    try {
      claims = decodeJwtPayload(tokens.id_token);
    } catch {
      throw new SsoError('Invalid ID token', 401);
    }

    const decision = checkIdTokenClaims(
      claims,
      {
        clientId: ssoConfig.oidc_client_id,
        issuer: ssoConfig.oidc_issuer,
        nonce: ssoSession.oidc_nonce,
        nowSeconds: Math.floor(Date.now() / 1000),
      },
      ssoConfig.organization_domain,
    );

    if (!decision.ok) {
      await supabase.from('sso_audit_logs').insert({
        config_id: ssoConfig.id,
        event_type: 'login_failed',
        event_details: { reason: decision.error },
        ip_address: clientIP,
        user_agent: userAgent,
      });
      throw new SsoError(decision.error, decision.status);
    }

    const userEmail = decision.value.email;
    const subjectId = decision.value.subjectId;
    const userAttributes: Record<string, string> = decision.value.attributes;

    // Find or create user
    let userId: string | null = null;

    // Check existing SSO mapping
    const { data: existingMapping } = await supabase
      .from('sso_user_mappings')
      .select('user_id, login_count')
      .eq('config_id', ssoConfig.id)
      .eq('sso_subject_id', subjectId)
      .single();

    if (existingMapping) {
      userId = existingMapping.user_id;

      // Update mapping with latest info.
      //
      // login_count previously read `supabase.rpc('increment', { x: 1 })`. There
      // is no `increment` function, and even if there were, a query builder is
      // not a value: it was serialized into the PATCH body for an integer
      // column, so the whole update was rejected and sso_email, sso_attributes
      // and last_login_at were never refreshed on re-login.
      //
      // Read-modify-write is used rather than an atomic `login_count + 1`, which
      // PostgREST cannot express without a dedicated RPC. Two logins racing may
      // undercount, which is acceptable for a login counter and is strictly
      // better than the update failing outright.
      await supabase
        .from('sso_user_mappings')
        .update({
          sso_email: userEmail,
          sso_attributes: userAttributes,
          last_login_at: new Date().toISOString(),
          login_count: (existingMapping.login_count ?? 0) + 1,
        })
        .eq('config_id', ssoConfig.id)
        .eq('sso_subject_id', subjectId);

    } else {
      // Check if user exists by email
      const { data: existingUser } = await supabase.auth.admin.listUsers();
      const userByEmail = existingUser?.users?.find((u: { email?: string }) => (u.email ?? '').toLowerCase() === userEmail);

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

    // Whatever path resolved the account, the link is only ever minted for
    // an address in the organisation's own domain.
    if (!mayMintLinkFor(userEmail, ssoConfig.organization_domain)) {
      throw new SsoError("Email is not in this organization's domain", 403);
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
    const status = error instanceof SsoError ? error.status : 400;
    console.error('SSO Callback Error:', message);

    return new Response(
      JSON.stringify({ error: message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status,
      }
    );
  }
});
