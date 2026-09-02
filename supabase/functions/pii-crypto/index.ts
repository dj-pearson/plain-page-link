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
 * US-119: it WAS an oracle. `decrypt` took up to 200 arbitrary ciphertexts from
 * the request body and returned their plaintext to any valid JWT — no check
 * that the caller had ever been able to read those rows. That mattered because
 * audit_table_change stores to_jsonb(NEW) for `leads`, so audit_logs holds a
 * copy of every ciphertext ever written; anything that could obtain one could
 * bring it here to be opened.
 *
 * Decryption is now addressed by row id, not by value: the caller names lead
 * ids (or asks for their own profile), the function reads those rows with the
 * service role, filters to the ones the caller owns, and decrypts what it read.
 * A ciphertext the caller cannot select is a ciphertext this function will not
 * open, and there is no longer any way to hand it one.
 *
 * Encryption still accepts values, which is not an oracle: it produces
 * ciphertext for the caller's own data.
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

/** One page of leads is 50 rows; 100 leaves headroom for a wider view. */
const MAX_ROWS = 100;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Op = 'encrypt' | 'decrypt_leads' | 'decrypt_profile';

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

    const body = (await req.json()) as {
      op?: Op;
      values?: unknown;
      leadIds?: unknown;
    };
    const op = body.op;

    if (op !== 'encrypt' && op !== 'decrypt_leads' && op !== 'decrypt_profile') {
      return errorResponse(
        "op must be 'encrypt', 'decrypt_leads' or 'decrypt_profile'",
        'REQUEST_VALIDATION_FAILED',
        req,
        400
      );
    }

    // ---------------------------------------------------------------------
    // decrypt_profile — the caller's own row, nothing else.
    // ---------------------------------------------------------------------
    if (op === 'decrypt_profile') {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('phone')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        return errorResponse('Could not read the profile', 'PROFILE_READ_FAILED', req, 502);
      }

      let phone: string | null = profile?.phone ?? null;
      try {
        phone = (await decryptSecret(phone)) ?? null;
      } catch {
        // A value that will not decrypt (corrupt, or written under a rotated
        // key) comes back untouched, matching what the old client did.
      }

      return successResponse({ phone }, req);
    }

    // ---------------------------------------------------------------------
    // decrypt_leads — by id, filtered to rows the caller owns.
    // ---------------------------------------------------------------------
    if (op === 'decrypt_leads') {
      if (!Array.isArray(body.leadIds)) {
        return errorResponse('leadIds must be an array', 'REQUEST_VALIDATION_FAILED', req, 400);
      }
      if (body.leadIds.length > MAX_ROWS) {
        return errorResponse(
          `leadIds may contain at most ${MAX_ROWS} entries`,
          'REQUEST_VALIDATION_FAILED',
          req,
          400
        );
      }
      if (!body.leadIds.every((id) => typeof id === 'string' && UUID_RE.test(id))) {
        return errorResponse('leadIds must be uuids', 'REQUEST_VALIDATION_FAILED', req, 400);
      }

      const leadIds = body.leadIds as string[];
      if (leadIds.length === 0) {
        return successResponse({ leads: [] }, req);
      }

      // The ownership filter is the control. The service-role client bypasses
      // RLS, so without `.eq('user_id', user.id)` this would open any row whose
      // id the caller could guess or read from an audit entry.
      const { data: rows, error } = await supabase
        .from('leads')
        .select('id, encrypted_email, encrypted_phone')
        .in('id', leadIds)
        .eq('user_id', user.id);

      if (error) {
        return errorResponse('Could not read those leads', 'LEAD_READ_FAILED', req, 502);
      }

      const decryptOne = async (value: string | null) => {
        try {
          return (await decryptSecret(value)) ?? null;
        } catch {
          return value ?? null;
        }
      };

      const leads = await Promise.all(
        (rows ?? []).map(async (row) => ({
          id: row.id as string,
          email: await decryptOne(row.encrypted_email as string | null),
          phone: await decryptOne(row.encrypted_phone as string | null),
        }))
      );

      // Ids the caller does not own are simply absent from the result. The
      // client zips by id, so a missing row reads as "no contact details"
      // rather than shifting anything.
      return successResponse({ leads }, req);
    }

    // ---------------------------------------------------------------------
    // encrypt — values, because the caller is encrypting their own data.
    // ---------------------------------------------------------------------
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

    // Positions are load-bearing: the client zips the result back onto the rows
    // it sent, so a failed value must hold its slot rather than shift the array.
    const out = await Promise.all(
      values.map(async (v) => {
        try {
          return (await encryptSecret(v)) ?? null;
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
