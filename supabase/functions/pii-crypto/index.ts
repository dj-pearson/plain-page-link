/**
 * PII encrypt/decrypt for the frontend (US-066).
 *
 * The browser used to do this itself, deriving its key from
 * VITE_PII_ENCRYPTION_KEY. Vite inlines every VITE_-prefixed value into the
 * production bundle, so the AES-256-GCM key protecting leads.encrypted_email
 * and leads.encrypted_phone was publicly downloadable — the ciphertext was
 * obfuscation, not encryption. The key now lives only here, as the
 * PII_ENCRYPTION_KEY function secret.
 *
 * The envelope is unchanged. _shared/encryption.ts and the old src/lib/pii.ts
 * produce byte-identical `enc:v1:` values — same PBKDF2-SHA256 at 100k
 * iterations, same 16-byte salt prepended to the 12-byte IV, same
 * base64-of-JSON serialization — so every value written under the old scheme
 * decrypts here unchanged, provided PII_ENCRYPTION_KEY is set to what
 * VITE_PII_ENCRYPTION_KEY used to hold. See DEPLOYMENT.md.
 *
 * Batched deliberately: the leads list decrypts two fields per row, and a
 * request per field would make the dashboard unusable. The client also
 * short-circuits locally on values that need no work (empty, or lacking the
 * `enc:v1:` prefix), so a page of not-yet-backfilled plaintext rows makes no
 * request at all.
 *
 * Requires a valid JWT. This is not an oracle for arbitrary ciphertext beyond
 * what a caller could already read through RLS, but it is still a decryption
 * service, so it is authenticated and rate limited rather than open.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import { getCorsHeaders } from '../_shared/cors.ts';
import {
  successResponse,
  errorResponse,
  handleUnexpectedError,
  rateLimitResponse,
  unauthorizedResponse,
  methodNotAllowedResponse,
} from '../_shared/response.ts';
import { checkRateLimitDb, RATE_LIMITS } from '../_shared/rate-limiter.ts';
import { encryptSecret, decryptSecret } from '../_shared/encryption.ts';

// One page of leads decrypts 2 fields x 50 rows. 200 leaves headroom without
// letting a single request pin a worker on PBKDF2 — each value is a separate
// 100k-iteration derivation.
const MAX_VALUES = 200;

type Op = 'encrypt' | 'decrypt';

export default async (req: Request) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin, 'POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return methodNotAllowedResponse(req, ['POST']);
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') as string,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return unauthorizedResponse(req, 'Authentication required');
    }
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authError || !user) {
      return unauthorizedResponse(req, 'Authentication required');
    }

    // Keyed on the user rather than the IP: this is an authenticated endpoint,
    // and several agents behind one office NAT should not share a budget.
    const rateLimit = await checkRateLimitDb(
      supabase,
      `user:${user.id}`,
      'pii-crypto',
      RATE_LIMITS.general
    );
    if (!rateLimit.allowed) {
      return rateLimitResponse(rateLimit.retryAfterSeconds, req, 'Too many requests.');
    }

    const body = (await req.json()) as { op?: Op; values?: unknown };
    const op = body.op;

    if (op !== 'encrypt' && op !== 'decrypt') {
      return errorResponse(
        "op must be 'encrypt' or 'decrypt'",
        'REQUEST_VALIDATION_FAILED',
        req,
        400
      );
    }
    if (!Array.isArray(body.values)) {
      return errorResponse('values must be an array', 'REQUEST_VALIDATION_FAILED', req, 400);
    }
    if (body.values.length > MAX_VALUES) {
      return errorResponse(
        `values may contain at most ${MAX_VALUES} entries`,
        'REQUEST_VALIDATION_FAILED',
        req,
        400
      );
    }
    if (body.values.some((v) => v !== null && v !== undefined && typeof v !== 'string')) {
      return errorResponse(
        'values must contain only strings or null',
        'REQUEST_VALIDATION_FAILED',
        req,
        400
      );
    }

    const values = body.values as (string | null)[];
    const transform = op === 'encrypt' ? encryptSecret : decryptSecret;

    // Positions are load-bearing: the client zips the result back onto the rows
    // it sent, so a failed value must hold its slot rather than shift the array.
    // A value that will not decrypt (corrupt, or written under a rotated key)
    // comes back untouched, matching what the old client-side decryptPII did.
    const out = await Promise.all(
      values.map(async (v) => {
        try {
          return (await transform(v)) ?? null;
        } catch {
          return v ?? null;
        }
      })
    );

    return successResponse({ values: out }, req);
  } catch (error) {
    return handleUnexpectedError(error, req);
  }
};
