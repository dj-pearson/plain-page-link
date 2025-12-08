/**
 * useAuditLog Hook
 * Provides audit logging functionality for security events
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/useAuthStore';

export interface AuditLogEntry {
  id: string;
  user_id: string;
  actor_id: string | null;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  status: 'success' | 'failure' | 'blocked';
  ip_address: string | null;
  user_agent: string | null;
  details: Record<string, unknown> | null;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  created_at: string;
}

interface AuditLogsResponse {
  success: boolean;
  logs: AuditLogEntry[];
  total: number;
  limit: number;
  offset: number;
  error?: string;
}

interface LogEventParams {
  action: string;
  status: 'success' | 'failure' | 'blocked';
  resourceType?: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
}

interface UseAuditLogOptions {
  action?: string;
  resourceType?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
  enabled?: boolean;
}

// Action display names
const ACTION_LABELS: Record<string, string> = {
  login: 'Login',
  logout: 'Logout',
  password_change: 'Password Changed',
  email_change: 'Email Changed',
  profile_update: 'Profile Updated',
  session_revoke: 'Session Revoked',
  revoke_all_sessions: 'All Sessions Revoked',
  mfa_enable: 'MFA Enabled',
  mfa_disable: 'MFA Disabled',
  mfa_verify: 'MFA Verified',
  gdpr_export_request: 'Data Export Requested',
  gdpr_data_export: 'Data Exported',
  account_deletion_request: 'Account Deletion Requested',
  account_deletion_cancelled: 'Account Deletion Cancelled',
  listing_create: 'Listing Created',
  listing_update: 'Listing Updated',
  listing_delete: 'Listing Deleted',
  lead_create: 'Lead Captured',
  lead_update: 'Lead Updated',
  settings_update: 'Settings Updated',
};

// Risk level colors
const RISK_COLORS: Record<string, string> = {
  low: 'text-green-600 bg-green-50',
  medium: 'text-yellow-600 bg-yellow-50',
  high: 'text-orange-600 bg-orange-50',
  critical: 'text-red-600 bg-red-50',
};

export function useAuditLog(options: UseAuditLogOptions = {}) {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const {
    action,
    resourceType,
    startDate,
    endDate,
    limit = 50,
    offset = 0,
    enabled = true,
  } = options;

  // Fetch audit logs
  const {
    data: logsData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['auditLogs', user?.id, action, resourceType, startDate, endDate, limit, offset],
    queryFn: async (): Promise<AuditLogsResponse> => {
      const params = new URLSearchParams();
      if (action) params.set('action', action);
      if (resourceType) params.set('resourceType', resourceType);
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      params.set('limit', limit.toString());
      params.set('offset', offset.toString());

      const { data, error } = await edgeFunctions.invoke('audit-log', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        body: null,
      });

      // For GET requests, we need to use direct DB query since functions.invoke defaults to POST
      const { data: logs, error: dbError, count } = await supabase
        .from('audit_logs')
        .select('*', { count: 'exact' })
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (dbError) {
        throw new Error(dbError.message);
      }

      return {
        success: true,
        logs: logs || [],
        total: count || 0,
        limit,
        offset,
      };
    },
    enabled: !!user?.id && enabled,
    staleTime: 60000, // 1 minute
  });

  // Log a new audit event
  const logEventMutation = useMutation({
    mutationFn: async (params: LogEventParams): Promise<{ success: boolean; logId: string }> => {
      const { data, error } = await edgeFunctions.invoke('audit-log', {
        body: params,
      });

      if (error) {
        throw new Error(error.message);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auditLogs'] });
    },
  });

  // Helper to get action label
  const getActionLabel = (actionName: string): string => {
    return ACTION_LABELS[actionName] || actionName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Helper to get risk level color classes
  const getRiskLevelColor = (riskLevel: string): string => {
    return RISK_COLORS[riskLevel] || RISK_COLORS.low;
  };

  // Helper to format log details
  const formatLogDetails = (log: AuditLogEntry): string => {
    const parts: string[] = [];

    if (log.resource_type) {
      parts.push(`${log.resource_type}${log.resource_id ? ` #${log.resource_id.slice(0, 8)}` : ''}`);
    }

    if (log.ip_address) {
      parts.push(`from ${log.ip_address}`);
    }

    return parts.join(' ') || 'No additional details';
  };

  // Helper to group logs by date
  const groupLogsByDate = (logs: AuditLogEntry[]): Record<string, AuditLogEntry[]> => {
    return logs.reduce((groups, log) => {
      const date = new Date(log.created_at).toLocaleDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(log);
      return groups;
    }, {} as Record<string, AuditLogEntry[]>);
  };

  return {
    logs: logsData?.logs || [],
    totalLogs: logsData?.total || 0,
    isLoading,
    error: error?.message || logsData?.error,
    refetch,
    logEvent: logEventMutation.mutateAsync,
    isLogging: logEventMutation.isPending,
    getActionLabel,
    getRiskLevelColor,
    formatLogDetails,
    groupLogsByDate,
  };
}

// Standalone function for logging events without the hook
export async function logAuditEvent(params: LogEventParams): Promise<void> {
  try {
    await edgeFunctions.invoke('audit-log', {
      body: params,
    });
  } catch (error) {
    console.error('Failed to log audit event:', error);
  }
}
