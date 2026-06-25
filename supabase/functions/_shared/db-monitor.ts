/**
 * Query timing instrumentation for Edge Functions.
 *
 * Wrap a Supabase query (or any async DB call) with `monitorQuery` to record
 * how long it took. Anything slower than the threshold (default 500ms) is
 * persisted to the query_metrics table (fire-and-forget; never blocks or
 * throws into the caller's flow).
 *
 * Usage:
 *   const { data, error } = await monitorQuery(
 *     supabase, 'profiles.byId', 'get-profile',
 *     () => supabase.from('profiles').select('*').eq('id', id).single()
 *   );
 */

import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SLOW_QUERY_MS = 500;

export async function monitorQuery<T>(
  supabase: SupabaseClient,
  queryHash: string,
  endpoint: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = Date.now();
  try {
    return await fn();
  } finally {
    const duration = Date.now() - start;
    if (duration > SLOW_QUERY_MS) {
      // Fire-and-forget; a logging failure must never affect the request.
      void supabase
        .from('query_metrics')
        .insert({ query_hash: queryHash, duration_ms: duration, endpoint })
        .then(undefined, () => undefined);
      console.warn(`[db-monitor] slow query ${queryHash} (${endpoint}): ${duration}ms`);
    }
  }
}

export { SLOW_QUERY_MS };
