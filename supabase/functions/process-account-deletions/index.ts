/**
 * Account Deletion Processor (Right to Delete)
 *
 * Executes account erasures whose 30-day grace period has elapsed by calling
 * the `process_scheduled_account_deletions()` database function.
 *
 * This endpoint is destructive, so it is restricted to service-role callers
 * (your scheduler / cron), never end users. Invoke it on a schedule with the
 * SUPABASE_SERVICE_ROLE_KEY as the Bearer token, e.g. daily:
 *
 *   curl -X POST "$SUPABASE_URL/functions/v1/process-account-deletions" \
 *        -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"
 *
 * Alternatively schedule the DB function directly with pg_cron (see migration
 * 20260723000001_process_account_deletions.sql).
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import { getCorsHeaders, handleCorsPreFlight } from '../_shared/cors.ts';
import { isServiceRoleRequest } from '../_shared/service-auth.ts';

serve(async (req: Request) => {
  const origin = req.headers.get('Origin');

  if (req.method === 'OPTIONS') {
    return handleCorsPreFlight(origin);
  }

  const cors = getCorsHeaders(origin, 'POST, OPTIONS');
  const json = { ...cors, 'Content-Type': 'application/json' };

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: json }
    );
  }

  // Destructive endpoint: only the service role (scheduler/admin) may trigger it.
  if (!isServiceRoleRequest(req)) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: json }
    );
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data, error } = await supabase.rpc('process_scheduled_account_deletions');

    if (error) {
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { status: 500, headers: json }
      );
    }

    return new Response(
      JSON.stringify({ success: true, processed: data ?? 0 }),
      { status: 200, headers: json }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: json }
    );
  }
});
