/**
 * Account Deletion Processor (Right to Delete)
 *
 * Executes account erasures whose 30-day grace period has elapsed. Each due
 * account's live Stripe subscription is cancelled first (US-250); an account
 * whose subscription cannot be cancelled is left scheduled and retried, since
 * process_scheduled_account_deletions() refuses to erase it.
 *
 * scheduled-maintenance runs the same work hourly, in-process. This endpoint
 * is for running it by hand. It is destructive, so it is restricted to
 * service-role callers, never end users:
 *
 *   curl -X POST "$FUNCTIONS_URL/process-account-deletions" \
 *        -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import { getCorsHeaders, handleCorsPreFlight } from '../_shared/cors.ts';
import { isServiceRoleRequest } from '../_shared/service-auth.ts';
import { processDueDeletions, supabaseDeletionStore } from '../_shared/account-deletion.ts';
import { createSubscriptionApi } from '../_shared/stripe-subscriptions.ts';

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
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');

    const report = await processDueDeletions({
      store: supabaseDeletionStore(supabase),
      stripe: stripeKey ? createSubscriptionApi(stripeKey) : null,
    });

    return new Response(
      JSON.stringify({ success: report.blocked === 0, ...report }),
      { status: report.blocked === 0 ? 200 : 207, headers: json }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: json }
    );
  }
});
