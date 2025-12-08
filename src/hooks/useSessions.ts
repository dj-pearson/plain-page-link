/**
 * useSessions Hook
 * Manages user session viewing and revocation
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/useAuthStore';
import { useToast } from '@/hooks/use-toast';

export interface Session {
  id: string;
  ip_address: string | null;
  user_agent: string | null;
  device_type: 'desktop' | 'mobile' | 'tablet' | 'unknown' | null;
  browser: string | null;
  os: string | null;
  location_city: string | null;
  location_country: string | null;
  is_current: boolean;
  last_activity_at: string;
  created_at: string;
}

interface SessionsResponse {
  success: boolean;
  sessions: Session[];
  total: number;
  error?: string;
}

interface RevokeResponse {
  success: boolean;
  message: string;
  revoked_count?: number;
  error?: string;
}

export function useSessions() {
  const { user, session } = useAuthStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all active sessions
  const {
    data: sessionsData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['sessions', user?.id],
    queryFn: async (): Promise<SessionsResponse> => {
      const { data, error } = await edgeFunctions.invoke('get-sessions');

      if (error) {
        throw new Error(error.message);
      }

      return data;
    },
    enabled: !!user?.id,
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every minute
  });

  // Revoke a specific session
  const revokeSessionMutation = useMutation({
    mutationFn: async (sessionId: string): Promise<RevokeResponse> => {
      const { data, error } = await edgeFunctions.invoke('revoke-session', {
        body: {
          sessionId,
          reason: 'user_revoked',
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      toast({
        title: 'Session Revoked',
        description: data.message || 'The session has been revoked successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to revoke session.',
        variant: 'destructive',
      });
    },
  });

  // Revoke all other sessions
  const revokeAllOthersMutation = useMutation({
    mutationFn: async (): Promise<RevokeResponse> => {
      // Get current session ID for preservation
      const currentSessionId = sessionsData?.sessions.find(s => s.is_current)?.id;

      const { data, error } = await edgeFunctions.invoke('revoke-session', {
        body: {
          revokeAll: true,
          currentSessionId,
          reason: 'revoke_all_by_user',
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      toast({
        title: 'Sessions Revoked',
        description: data.message || `${data.revoked_count} session(s) have been revoked.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to revoke sessions.',
        variant: 'destructive',
      });
    },
  });

  // Helper to format session info
  const formatSessionInfo = (session: Session): string => {
    const parts: string[] = [];

    if (session.browser) parts.push(session.browser);
    if (session.os) parts.push(`on ${session.os}`);
    if (session.location_city && session.location_country) {
      parts.push(`from ${session.location_city}, ${session.location_country}`);
    } else if (session.location_country) {
      parts.push(`from ${session.location_country}`);
    }

    return parts.join(' ') || 'Unknown device';
  };

  // Helper to get device icon type
  const getDeviceIcon = (deviceType: Session['device_type']): 'desktop' | 'mobile' | 'tablet' => {
    switch (deviceType) {
      case 'mobile':
        return 'mobile';
      case 'tablet':
        return 'tablet';
      default:
        return 'desktop';
    }
  };

  // Helper to format relative time
  const formatRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

    return date.toLocaleDateString();
  };

  return {
    sessions: sessionsData?.sessions || [],
    totalSessions: sessionsData?.total || 0,
    isLoading,
    error: error?.message || sessionsData?.error,
    refetch,
    revokeSession: revokeSessionMutation.mutate,
    revokeAllOtherSessions: revokeAllOthersMutation.mutate,
    isRevoking: revokeSessionMutation.isPending,
    isRevokingAll: revokeAllOthersMutation.isPending,
    formatSessionInfo,
    getDeviceIcon,
    formatRelativeTime,
  };
}
