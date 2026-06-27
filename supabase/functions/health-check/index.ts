import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import { getCorsHeaders } from '../_shared/cors.ts';

/**
 * Health Check
 *
 * Verifies database connectivity and returns latency. Public (no auth) so it
 * can be used by uptime monitors / load balancers. Returns 200 when healthy,
 * 503 when the database is unreachable.
 */

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get('origin'));

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const start = Date.now();
  let dbOk = false;
  let dbLatencyMs: number | null = null;
  let error: string | undefined;

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    const t0 = Date.now();
    // Lightweight connectivity probe.
    const { error: dbError } = await supabase
      .from('feature_flags')
      .select('name', { count: 'exact', head: true })
      .limit(1);
    dbLatencyMs = Date.now() - t0;
    if (dbError) {
      error = dbError.message;
    } else {
      dbOk = true;
    }
  } catch (e) {
    error = e instanceof Error ? e.message : 'unknown error';
  }

  const body = {
    status: dbOk ? 'healthy' : 'unhealthy',
    database: { connected: dbOk, latency_ms: dbLatencyMs, error },
    total_ms: Date.now() - start,
    timestamp: new Date().toISOString(),
  };

  return new Response(JSON.stringify(body), {
    status: dbOk ? 200 : 503,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
