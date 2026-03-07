/**
 * Google Indexing API Edge Function
 * Submits URLs to Google for indexing/removal using the Indexing API v3
 *
 * Requires GOOGLE_SERVICE_ACCOUNT_JSON secret set in Supabase Edge Function secrets
 * See: https://developers.google.com/search/apis/indexing-api/v3/prereqs
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders, handleCorsPreFlight } from '../_shared/cors.ts';
import { handleError, successResponse, ValidationError, AppError } from '../_shared/errors.ts';
import { requireAuth } from '../_shared/auth.ts';

const GOOGLE_INDEXING_API_URL = 'https://indexing.googleapis.com/v3/urlNotifications:publish';
const GOOGLE_BATCH_API_URL = 'https://indexing.googleapis.com/batch';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';

type IndexingAction = 'URL_UPDATED' | 'URL_DELETED';

interface IndexingRequest {
  urls: string[];
  action?: IndexingAction;
}

interface ServiceAccountCredentials {
  client_email: string;
  private_key: string;
  token_uri?: string;
}

/**
 * Create a JWT for Google service account authentication
 */
async function createServiceAccountJWT(credentials: ServiceAccountCredentials): Promise<string> {
  const header = {
    alg: 'RS256',
    typ: 'JWT',
  };

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: credentials.client_email,
    scope: 'https://www.googleapis.com/auth/indexing',
    aud: credentials.token_uri || GOOGLE_TOKEN_URL,
    iat: now,
    exp: now + 3600, // 1 hour
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signInput = `${encodedHeader}.${encodedPayload}`;

  const signature = await signWithRSA(credentials.private_key, signInput);
  return `${signInput}.${signature}`;
}

/**
 * Base64 URL encode a string
 */
function base64UrlEncode(str: string): string {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const base64 = btoa(String.fromCharCode(...data));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Sign data with RSA private key (RS256)
 */
async function signWithRSA(privateKeyPem: string, data: string): Promise<string> {
  // Parse PEM key
  const pemContent = privateKeyPem
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/\s/g, '');

  const binaryKey = Uint8Array.from(atob(pemContent), c => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey.buffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const encoder = new TextEncoder();
  const signatureBuffer = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    encoder.encode(data)
  );

  const signature = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)));
  return signature.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Get an access token from Google using the service account JWT
 */
async function getAccessToken(credentials: ServiceAccountCredentials): Promise<string> {
  const jwt = await createServiceAccountJWT(credentials);

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[Google Auth Error]', errorText);
    throw new AppError('Failed to authenticate with Google service account', 500, 'Google authentication failed');
  }

  const tokenData = await response.json();
  return tokenData.access_token;
}

/**
 * Submit a single URL to the Google Indexing API
 */
async function submitUrl(
  url: string,
  action: IndexingAction,
  accessToken: string
): Promise<{ url: string; success: boolean; error?: string }> {
  try {
    const response = await fetch(GOOGLE_INDEXING_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        url,
        type: action,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: { message: response.statusText } }));
      return {
        url,
        success: false,
        error: errorData.error?.message || `HTTP ${response.status}`,
      };
    }

    const result = await response.json();
    return { url, success: true, ...result };
  } catch (err) {
    return {
      url,
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return handleCorsPreFlight(req.headers.get('origin'));
  }

  try {
    // Only allow POST
    if (req.method !== 'POST') {
      throw new ValidationError('Method not allowed. Use POST.');
    }

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!
    );

    // Require authenticated user
    const user = await requireAuth(req, supabase);

    // Parse request body
    const body: IndexingRequest = await req.json();

    if (!body.urls || !Array.isArray(body.urls) || body.urls.length === 0) {
      throw new ValidationError('urls must be a non-empty array of URL strings');
    }

    // Limit batch size to 100 (Google's recommendation)
    if (body.urls.length > 100) {
      throw new ValidationError('Maximum 100 URLs per request');
    }

    // Validate URLs
    for (const url of body.urls) {
      try {
        new URL(url);
      } catch {
        throw new ValidationError(`Invalid URL: ${url}`);
      }
    }

    const action: IndexingAction = body.action || 'URL_UPDATED';
    if (action !== 'URL_UPDATED' && action !== 'URL_DELETED') {
      throw new ValidationError('action must be URL_UPDATED or URL_DELETED');
    }

    // Load Google service account credentials
    const serviceAccountJson = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_JSON');
    if (!serviceAccountJson) {
      throw new AppError(
        'GOOGLE_SERVICE_ACCOUNT_JSON not configured',
        500,
        'Google Indexing API is not configured. Please contact support.'
      );
    }

    let credentials: ServiceAccountCredentials;
    try {
      credentials = JSON.parse(serviceAccountJson);
    } catch {
      throw new AppError(
        'Invalid GOOGLE_SERVICE_ACCOUNT_JSON format',
        500,
        'Google Indexing API configuration error'
      );
    }

    if (!credentials.client_email || !credentials.private_key) {
      throw new AppError(
        'GOOGLE_SERVICE_ACCOUNT_JSON missing required fields (client_email, private_key)',
        500,
        'Google Indexing API configuration error'
      );
    }

    // Get access token
    const accessToken = await getAccessToken(credentials);

    // Submit URLs
    const results = await Promise.all(
      body.urls.map(url => submitUrl(url, action, accessToken))
    );

    const succeeded = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    console.log(`[Google Indexing] User ${user.id}: ${succeeded} succeeded, ${failed} failed out of ${body.urls.length} URLs`);

    return successResponse({
      success: failed === 0,
      total: body.urls.length,
      succeeded,
      failed,
      action,
      results,
    }, req);

  } catch (error) {
    return handleError(error, req);
  }
});
