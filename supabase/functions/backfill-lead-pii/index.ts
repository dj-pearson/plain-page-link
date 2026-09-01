/**
 * One-off backfill: encrypt the plaintext PII still on `leads` (US-086).
 *
 * The plaintext `email`/`phone` columns are being dropped, and the AES-256-GCM
 * key lives only in the Edge Function secrets (US-066 moved it out of the
 * frontend bundle) — so no SQL migration can do this. It has to run here,
 * before 20260901000001_leads_drop_plaintext_pii.sql is applied. That migration
 * refuses to drop anything while un-backfilled rows remain, so the ordering is
 * enforced rather than merely documented.
 *
 * Idempotent: a row whose encrypted_* is already set is skipped, so re-running
 * after a partial run costs nothing and cannot double-encrypt.
 *
 * Admin-only. This reads every lead's plaintext contact details in the clear,
 * which is precisely the exposure the story is closing, so it is not something
 * an ordinary authenticated user may trigger.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import { getCorsHeaders } from '../_shared/cors.ts';
import {
  successResponse,
  errorResponse,
  handleUnexpectedError,
  unauthorizedResponse,
  methodNotAllowedResponse,
} from '../_shared/response.ts';
import { encryptSecret } from '../_shared/encryption.ts';

/** Rows per pass. Each row costs two AES operations, not a network call. */
const BATCH_SIZE = 500;

interface LeadPiiRow {
  id: string;
  email: string | null;
  phone: string | null;
  encrypted_email: string | null;
  encrypted_phone: string | null;
}

serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return methodNotAllowedResponse(corsHeaders);
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return unauthorizedResponse(corsHeaders);
    }

    const serviceSupabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const {
      data: { user },
      error: authError,
    } = await serviceSupabase.auth.getUser(authHeader.replace('Bearer ', ''));

    if (authError || !user) {
      return unauthorizedResponse(corsHeaders);
    }

    const { data: isAdmin, error: roleError } = await serviceSupabase.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin',
    });

    if (roleError || !isAdmin) {
      return errorResponse('Admin role required', 403, corsHeaders);
    }

    let encrypted = 0;
    let scanned = 0;
    let cursor: string | null = null;

    for (;;) {
      // `*` rather than a column list on purpose: this runs against the
      // pre-drop schema, and naming `email`/`phone` here would make
      // verify-schema report them as missing columns once the migration has
      // been applied. Reading them off the row defensively also means a run
      // against the post-drop schema is a clean no-op rather than an error.
      let query = serviceSupabase
        .from('leads')
        .select('*')
        .order('id', { ascending: true })
        .limit(BATCH_SIZE);

      if (cursor) query = query.gt('id', cursor);

      const { data, error } = await query;
      if (error) throw error;

      const rows = (data ?? []).map((row) => {
        const r = row as Record<string, unknown>;
        return {
          id: String(r.id),
          email: typeof r.email === 'string' ? r.email : null,
          phone: typeof r.phone === 'string' ? r.phone : null,
          encrypted_email: typeof r.encrypted_email === 'string' ? r.encrypted_email : null,
          encrypted_phone: typeof r.encrypted_phone === 'string' ? r.encrypted_phone : null,
        } satisfies LeadPiiRow;
      });
      if (rows.length === 0) break;

      for (const row of rows) {
        scanned++;

        const needsEmail = !!row.email && !row.encrypted_email;
        const needsPhone = !!row.phone && !row.encrypted_phone;
        if (!needsEmail && !needsPhone) continue;

        const update: Record<string, string | null> = {};
        if (needsEmail) update.encrypted_email = (await encryptSecret(row.email)) ?? null;
        if (needsPhone) update.encrypted_phone = (await encryptSecret(row.phone)) ?? null;

        const { error: updateError } = await serviceSupabase
          .from('leads')
          .update(update)
          .eq('id', row.id);

        if (updateError) throw updateError;
        encrypted++;
      }

      cursor = rows[rows.length - 1].id;
      if (rows.length < BATCH_SIZE) break;
    }

    return successResponse(
      {
        scanned,
        encrypted,
        message:
          encrypted === 0
            ? 'Nothing to backfill — every lead with contact details already has ciphertext.'
            : `Encrypted ${encrypted} of ${scanned} lead(s). Safe to apply 20260901000001_leads_drop_plaintext_pii.sql.`,
      },
      corsHeaders
    );
  } catch (error) {
    return handleUnexpectedError(error, corsHeaders);
  }
});
