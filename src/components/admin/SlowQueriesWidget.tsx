/**
 * Slow Queries Widget (admin-only)
 *
 * Shows the top 10 slowest queries in the last 24h, from the query_metrics
 * table via the top_slow_queries() RPC. Helps identify performance hotspots.
 */

import { useQuery } from '@tanstack/react-query';
import { Loader2, Gauge } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface SlowQueryRow {
  query_hash: string;
  endpoint: string | null;
  max_ms: number;
  avg_ms: number;
  calls: number;
}

export function SlowQueriesWidget() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-slow-queries'],
    queryFn: async (): Promise<SlowQueryRow[]> => {
      // top_slow_queries RPC isn't in the generated types — isolated cast.
      const rpc = supabase as unknown as {
        rpc: (
          fn: string,
          args: Record<string, unknown>
        ) => Promise<{ data: SlowQueryRow[] | null; error: unknown }>;
      };
      const { data, error } = await rpc.rpc('top_slow_queries', { p_limit: 10 });
      if (error) return [];
      return data ?? [];
    },
  });

  return (
    <div className="rounded-lg border border-border p-6">
      <div className="mb-4 flex items-center gap-2">
        <Gauge className="h-5 w-5 text-primary" />
        <div>
          <h2 className="text-xl font-bold">Slowest Queries (24h)</h2>
          <p className="text-sm text-muted-foreground">
            Top 10 by max duration, captured from edge functions (&gt;500ms).
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-6 text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading…
        </div>
      ) : !data || data.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          No slow queries recorded in the last 24 hours. 🎉
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm">
            <thead className="text-left text-muted-foreground">
              <tr>
                <th className="p-2 font-medium">Query</th>
                <th className="p-2 font-medium">Endpoint</th>
                <th className="p-2 text-right font-medium">Max</th>
                <th className="p-2 text-right font-medium">Avg</th>
                <th className="p-2 text-right font-medium">Calls</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => (
                <tr key={`${row.query_hash}-${i}`} className="border-t border-border">
                  <td className="p-2 font-mono text-xs">{row.query_hash}</td>
                  <td className="p-2 text-muted-foreground">{row.endpoint ?? '—'}</td>
                  <td className="p-2 text-right font-semibold text-red-600">{row.max_ms}ms</td>
                  <td className="p-2 text-right">{row.avg_ms}ms</td>
                  <td className="p-2 text-right text-muted-foreground">{row.calls}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
