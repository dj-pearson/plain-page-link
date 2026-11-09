/**
 * OAuth Proxy Edge Function
 * Bypasses GoTrue's GOTRUE_SITE_URL limitation for self-hosted Supabase
 *
 * Flow:
 *   Frontend -> oauth-proxy?action=authorize -> Google/Apple OAuth
 *   Google/Apple -> oauth-proxy?action=callback -> verify & create session
 *   oauth-proxy -> Frontend /auth/callback?token=xxx -> establish session
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import { getCorsHeaders } from '../_shared/cors.ts';
import { getSiteUrl, getFunctionsUrl } from '../_shared/env.ts';
import { findAuthUserIdByEmail, isEmailExistsError } from '../_shared/auth-user-lookup.ts';
import {
  STATE_TTL_SECONDS,
  checkSocialIdToken,
  derivePkceVerifier,
  isOAuthProvider,
  newNonce,
  newSocialUserMetadata,
  pkceChallenge,
  resolveStateSecret,
  safeRedirectPath,
  sanitizeSignupAttribution,
  signState,
  tokenErrorForLog,
  verifyState,
} from './oauth.ts';

// Configuration from environment variables
const SITE_URL = getSiteUrl();
const FUNCTIONS_URL = getFunctionsUrl();
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || 'https://api.agentbio.net';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID') || '';
const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET') || '';
const APPLE_CLIENT_ID = Deno.env.get('APPLE_CLIENT_ID') || '';
const APPLE_CLIENT_SECRET = Deno.env.get('APPLE_CLIENT_SECRET') || '';
// Signs the OAuth state (US-249). Falls back to a key derived from the
// service-role key so an unset secret does not break sign-in.
const STATE_SECRET = resolveStateSecret(Deno.env.get('OAUTH_STATE_SECRET'), SUPABASE_SERVICE_ROLE_KEY);

const loginError = (code: string): Response => {
  const errorUrl = new URL(`${SITE_URL}/auth/login`);
  errorUrl.searchParams.set('error', code);
  return new Response(null, { status: 302, headers: { 'Location': errorUrl.toString() } });
};

// Export handler for edge-functions-server (NOT Deno.serve)
export default async function handler(req: Request): Promise<Response> {
  // Use the shared origin allow-list instead of a wildcard.
  const corsHeaders = getCorsHeaders(req.headers.get('origin'), 'GET, POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action');
    const provider = url.searchParams.get('provider') || 'google';
    const redirectTo = safeRedirectPath(url.searchParams.get('redirect_to'));
    const functionUrl = `${FUNCTIONS_URL}/oauth-proxy`;
    const jsonError = (message: string, status: number): Response =>
      new Response(JSON.stringify({ error: message }), {
        status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    if ((action === 'authorize' || action === 'callback') && !STATE_SECRET) {
      console.error('oauth-proxy: neither OAUTH_STATE_SECRET nor SUPABASE_SERVICE_ROLE_KEY is set');
      return jsonError('Social sign-in is not configured', 503);
    }

    // ── AUTHORIZE: Redirect user to OAuth provider ──────────────────
    if (action === 'authorize') {
      if (!isOAuthProvider(provider)) return jsonError('Unsupported provider', 400);
      // The state is signed and expires; the PKCE verifier is not in it, but
      // derived from its nonce on both legs (see oauth.ts).
      const nonce = newNonce();
      const codeChallenge = await pkceChallenge(await derivePkceVerifier(STATE_SECRET!, nonce));
      // US-594: referral and first-touch source for a new account (oauth.ts).
      const attribution = sanitizeSignupAttribution(
        url.searchParams.get('ref'),
        url.searchParams.get('signup_source'),
      );
      const stateData = await signState(STATE_SECRET!, {
        provider,
        redirectTo,
        nonce,
        exp: Math.floor(Date.now() / 1000) + STATE_TTL_SECONDS,
        ...attribution,
      });

      let authUrl: URL;

      if (provider === 'google') {
        authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
        authUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID);
        authUrl.searchParams.set('redirect_uri', `${functionUrl}?action=callback`);
        authUrl.searchParams.set('response_type', 'code');
        authUrl.searchParams.set('scope', 'openid email profile');
        authUrl.searchParams.set('state', stateData);
        authUrl.searchParams.set('code_challenge', codeChallenge);
        authUrl.searchParams.set('code_challenge_method', 'S256');
        authUrl.searchParams.set('access_type', 'offline');
        authUrl.searchParams.set('prompt', 'consent');
      } else if (provider === 'apple') {
        authUrl = new URL('https://appleid.apple.com/auth/authorize');
        authUrl.searchParams.set('client_id', APPLE_CLIENT_ID);
        authUrl.searchParams.set('redirect_uri', `${functionUrl}?action=callback`);
        authUrl.searchParams.set('response_type', 'code');
        authUrl.searchParams.set('scope', 'name email');
        authUrl.searchParams.set('state', stateData);
        authUrl.searchParams.set('response_mode', 'query');
      } else {
        return new Response(JSON.stringify({ error: 'Unsupported provider' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(null, {
        status: 302,
        headers: { ...corsHeaders, 'Location': authUrl.toString() },
      });
    }

    // ── CALLBACK: Exchange code for tokens, create session ──────────
    if (action === 'callback') {
      const code = url.searchParams.get('code');
      const state = url.searchParams.get('state');
      const error = url.searchParams.get('error');

      if (error) {
        const errorUrl = new URL(`${SITE_URL}/auth/login`);
        errorUrl.searchParams.set('error', error);
        errorUrl.searchParams.set('error_description', url.searchParams.get('error_description') || '');
        return new Response(null, { status: 302, headers: { 'Location': errorUrl.toString() } });
      }

      if (!code || !state) {
        return new Response(JSON.stringify({ error: 'Missing code or state' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const checked = await verifyState(STATE_SECRET!, state, Math.floor(Date.now() / 1000));
      if (!checked.ok) return jsonError(checked.error, checked.status);

      const {
        nonce,
        redirectTo: finalRedirect,
        provider: stateProvider,
        ref: stateRef,
        source: stateSource,
      } = checked.value;
      const verifier = await derivePkceVerifier(STATE_SECRET!, nonce);
      let tokenData: Record<string, unknown> = {};

      // Exchange authorization code for tokens
      if (stateProvider === 'google') {
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: GOOGLE_CLIENT_ID,
            client_secret: GOOGLE_CLIENT_SECRET,
            code: code,
            code_verifier: verifier,
            grant_type: 'authorization_code',
            redirect_uri: `${functionUrl}?action=callback`,
          }),
        });
        tokenData = await tokenResponse.json();
      } else if (stateProvider === 'apple') {
        const tokenResponse = await fetch('https://appleid.apple.com/auth/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: APPLE_CLIENT_ID,
            client_secret: APPLE_CLIENT_SECRET,
            code: code,
            grant_type: 'authorization_code',
            redirect_uri: `${functionUrl}?action=callback`,
          }),
        });
        tokenData = await tokenResponse.json();
      }

      if (tokenData.error) {
        // Only the error code: the rest of the body can echo codes or tokens.
        const errorCode = tokenErrorForLog(tokenData);
        console.error('Token exchange error:', errorCode);
        return loginError(errorCode);
      }

      // Decode (base64url) and check the ID token. An unverified email is refused.
      const identity = checkSocialIdToken(tokenData.id_token, {
        provider: stateProvider,
        clientId: stateProvider === 'google' ? GOOGLE_CLIENT_ID : APPLE_CLIENT_ID,
        nowSeconds: Math.floor(Date.now() / 1000),
      });
      if (!identity.ok) {
        console.error('ID token refused:', identity.error);
        return loginError(identity.status === 403 ? 'email_not_verified' : 'invalid_id_token');
      }
      const payload = identity.value;

      // Create Supabase admin client
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false },
      });

      // Look the account up directly; the admin user list only returned its first page.
      let existingUserId: string | null;
      try {
        existingUserId = await findAuthUserIdByEmail(supabase, payload.email);
      } catch (lookupError) {
        console.error('User lookup error:', (lookupError as Error).message);
        return loginError('user_lookup_failed');
      }
      let isNewUser = false;

      if (!existingUserId) {
        // Create new user with provider metadata
        const { error: createError } = await supabase.auth.admin.createUser({
          email: payload.email,
          email_confirm: true,
          user_metadata: newSocialUserMetadata(payload, stateProvider, { ref: stateRef, source: stateSource }),
          app_metadata: {
            provider: stateProvider,
            providers: [stateProvider],
          },
        });
        if (createError && !isEmailExistsError(createError)) {
          console.error('Create user error:', createError.message);
          return loginError('create_user_failed');
        }
        // email_exists: a concurrent sign-in created it first; sign in to it.
        isNewUser = !createError;
      }

      // Generate magic link for session establishment
      const { data, error: linkError } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: payload.email,
        options: { redirectTo: `${SITE_URL}${finalRedirect}` },
      });

      if (linkError) {
        console.error('Generate link error:', linkError);
        const errorUrl = new URL(`${SITE_URL}/auth/login`);
        errorUrl.searchParams.set('error', 'generate_link_failed');
        return new Response(null, { status: 302, headers: { 'Location': errorUrl.toString() } });
      }

      // Extract token from magic link and redirect to frontend callback
      const magicLinkUrl = new URL(data.properties.action_link);
      const token = magicLinkUrl.searchParams.get('token');
      const type = magicLinkUrl.searchParams.get('type');

      const successUrl = new URL(`${SITE_URL}/auth/callback`);
      successUrl.searchParams.set('token', token || '');
      successUrl.searchParams.set('type', type || 'magiclink');
      successUrl.searchParams.set('redirect_to', finalRedirect);
      if (isNewUser) successUrl.searchParams.set('new_user', 'true');

      return new Response(null, { status: 302, headers: { 'Location': successUrl.toString() } });
    }

    // ── Default: usage info ─────────────────────────────────────────
    return new Response(JSON.stringify({
      usage: 'Call with ?action=authorize&provider=google to start OAuth flow',
      providers: ['google', 'apple'],
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('OAuth proxy error:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}
