import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { requireAdmin } from '../_shared/auth.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import { getCorsHeaders } from '../_shared/cors.ts';

/**
 * Health Check
 *
 * Two answers (US-222):
 *   - No Authorization header: a liveness probe for uptime monitors — 200
 *     {"ok":true} when the database answers, 503 {"ok":false} when it does
 *     not, and nothing else. The comment here always said it was public, but
 *     US-078 put requireAdmin in front of everything, so no monitor could use
 *     it and no outage was ever caught by one.
 *   - An admin's JWT: the detailed report (latency, error text).
 */

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get('origin'));

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Liveness: no credentials, no detail.
  if (!req.headers.get('Authorization')) {
    let ok = false;
    try {
      const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
      const { error: probeError } = await supabase
        .from('feature_flags')
        .select('name', { count: 'exact', head: true })
        .limit(1);
      ok = !probeError;
    } catch {
      ok = false;
    }
    return new Response(JSON.stringify({ ok }), {
      status: ok ? 200 : 503,
      headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
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

    // US-078: admin SEO tooling running with the service role. It was
    // callable by anyone holding the anon key, which ships in the bundle.
    await requireAdmin(req, supabase);
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
