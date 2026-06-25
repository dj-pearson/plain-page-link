/**
 * Admin Audit Log Viewer
 *
 * Admin-only, sortable/filterable view of the full audit trail (all users).
 * Relies on the audit_logs admin "read all" RLS policy. Filters by date
 * range, user, action, and resource type; rows expand to show the raw jsonb
 * details. Paginated 50 events per page.
 */

import { useState, Fragment } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { ChevronDown, ChevronRight, Loader2, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/useAuthStore';
import type { AuditLogEntry } from '@/hooks/useAuditLog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const PAGE_SIZE = 50;

// audit_logs isn't in the (out-of-sync) generated Supabase types. This is a
// minimal, self-returning query-builder shape so the chain stays typed without
// `any`. Cast is isolated to the query below.
type AuditResult = {
  data: AuditLogEntry[] | null;
  count: number | null;
  error: { message: string } | null;
};
interface AuditChain extends PromiseLike<AuditResult> {
  order: (c: string, o: { ascending: boolean }) => AuditChain;
  range: (a: number, b: number) => AuditChain;
  ilike: (c: string, v: string) => AuditChain;
  eq: (c: string, v: string) => AuditChain;
  gte: (c: string, v: string) => AuditChain;
  lte: (c: string, v: string) => AuditChain;
}
interface AuditFrom {
  select: (c: string, o?: { count: 'exact' }) => AuditChain;
}

export default function AuditLogPage() {
  const { user, role } = useAuthStore();

  const [filters, setFilters] = useState({
    action: '',
    resourceType: '',
    userId: '',
    startDate: '',
    endDate: '',
  });
  const [page, setPage] = useState(0);
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['admin-audit-logs', filters, page],
    placeholderData: keepPreviousData,
    enabled: role === 'admin',
    queryFn: async () => {
      const from = (supabase as unknown as { from: (t: string) => AuditFrom }).from('audit_logs');
      let query = from
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);

      if (filters.action) query = query.ilike('action', `%${filters.action}%`);
      if (filters.resourceType) query = query.eq('resource_type', filters.resourceType);
      if (filters.userId) query = query.eq('user_id', filters.userId);
      if (filters.startDate) query = query.gte('created_at', filters.startDate);
      if (filters.endDate) query = query.lte('created_at', `${filters.endDate}T23:59:59`);

      const { data: logs, count, error } = await query;
      if (error) throw error;
      return { logs: logs ?? [], total: count ?? 0 };
    },
  });

  // Admin-only.
  if (!user || role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  const logs = data?.logs ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const updateFilter = (key: keyof typeof filters, value: string) => {
    setPage(0);
    setFilters((f) => ({ ...f, [key]: value }));
  };

  return (
    <div className="mx-auto max-w-7xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link to="/admin" className="text-sm text-primary hover:underline">
            ← Back to Admin
          </Link>
          <h1 className="text-2xl font-bold text-foreground">Audit Log</h1>
          <p className="text-muted-foreground">{total} events</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div>
          <Label htmlFor="f-action">Action</Label>
          <Input
            id="f-action"
            placeholder="e.g. login"
            value={filters.action}
            onChange={(e) => updateFilter('action', e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="f-resource">Resource type</Label>
          <Input
            id="f-resource"
            placeholder="e.g. listing"
            value={filters.resourceType}
            onChange={(e) => updateFilter('resourceType', e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="f-user">User ID</Label>
          <Input
            id="f-user"
            placeholder="uuid"
            value={filters.userId}
            onChange={(e) => updateFilter('userId', e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="f-start">From</Label>
          <Input
            id="f-start"
            type="date"
            value={filters.startDate}
            onChange={(e) => updateFilter('startDate', e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="f-end">To</Label>
          <Input
            id="f-end"
            type="date"
            value={filters.endDate}
            onChange={(e) => updateFilter('endDate', e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="w-8 p-3" />
              <th className="p-3 font-medium">Timestamp</th>
              <th className="p-3 font-medium">User</th>
              <th className="p-3 font-medium">Action</th>
              <th className="p-3 font-medium">Resource</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 font-medium">IP</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-muted-foreground">
                  <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-muted-foreground">
                  No audit events match these filters.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <Fragment key={log.id}>
                  <tr
                    className="cursor-pointer border-t border-border hover:bg-accent/40"
                    onClick={() => setExpanded(expanded === log.id ? null : log.id)}
                  >
                    <td className="p-3 text-muted-foreground">
                      {expanded === log.id ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </td>
                    <td className="whitespace-nowrap p-3">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="p-3">
                      {log.user_id ? (
                        <button
                          className="font-mono text-xs text-primary hover:underline"
                          onClick={(e) => {
                            e.stopPropagation();
                            updateFilter('userId', log.user_id);
                          }}
                          title="Filter by this user"
                        >
                          {log.user_id.slice(0, 8)}…
                        </button>
                      ) : (
                        <span className="text-muted-foreground">system</span>
                      )}
                    </td>
                    <td className="p-3">{log.action}</td>
                    <td className="p-3 text-muted-foreground">
                      {log.resource_type ?? '—'}
                      {log.resource_id ? ` #${log.resource_id.slice(0, 8)}` : ''}
                    </td>
                    <td className="p-3">
                      <span
                        className={
                          log.status === 'success'
                            ? 'text-green-600'
                            : log.status === 'blocked'
                              ? 'text-amber-600'
                              : 'text-red-600'
                        }
                      >
                        {log.status}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-xs text-muted-foreground">
                      {log.ip_address ?? '—'}
                    </td>
                  </tr>
                  {expanded === log.id && (
                    <tr className="border-t border-border bg-muted/30">
                      <td colSpan={7} className="p-4">
                        <pre className="overflow-x-auto whitespace-pre-wrap break-all text-xs text-foreground">
                          {JSON.stringify(
                            {
                              actor_id: log.actor_id,
                              risk_level: log.risk_level,
                              user_agent: log.user_agent,
                              details: log.details,
                            },
                            null,
                            2
                          )}
                        </pre>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-4 flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          Page {page + 1} of {totalPages}
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0 || isFetching}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => (p + 1 < totalPages ? p + 1 : p))}
            disabled={page + 1 >= totalPages || isFetching}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
