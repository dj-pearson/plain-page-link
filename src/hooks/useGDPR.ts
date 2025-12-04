/**
 * useGDPR Hook
 * Handles GDPR data export and account deletion functionality
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/useAuthStore';
import { useToast } from '@/hooks/use-toast';

interface DeletionStatus {
  scheduled: boolean;
  scheduledFor?: string;
  daysRemaining?: number;
  reason?: string;
  canCancel?: boolean;
  requestedAt?: string;
  message?: string;
}

interface ExportRequestResponse {
  success: boolean;
  requestId?: string;
  message?: string;
  error?: string;
}

interface DeletionRequestResponse {
  success: boolean;
  requestId?: string;
  message?: string;
  scheduledFor?: string;
  daysRemaining?: number;
  canCancel?: boolean;
  cancelInstructions?: string;
  error?: string;
}

export function useGDPR() {
  const { user, signOut } = useAuthStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isExporting, setIsExporting] = useState(false);

  // Fetch deletion status
  const {
    data: deletionStatus,
    isLoading: isDeletionStatusLoading,
    error: deletionStatusError,
    refetch: refetchDeletionStatus,
  } = useQuery({
    queryKey: ['deletionStatus', user?.id],
    queryFn: async (): Promise<DeletionStatus> => {
      const { data, error } = await supabase.functions.invoke('gdpr-deletion', {
        method: 'GET',
      });

      if (error) {
        throw new Error(error.message);
      }

      return data;
    },
    enabled: !!user?.id,
    staleTime: 60000, // 1 minute
  });

  // Request data export
  const exportDataMutation = useMutation({
    mutationFn: async (): Promise<Blob> => {
      setIsExporting(true);

      try {
        // Request export and get data directly
        const { data, error } = await supabase.functions.invoke('gdpr-export', {
          method: 'GET',
        });

        if (error) {
          throw new Error(error.message);
        }

        // Convert to blob for download
        const blob = new Blob([JSON.stringify(data, null, 2)], {
          type: 'application/json',
        });

        return blob;
      } finally {
        setIsExporting(false);
      }
    },
    onSuccess: (blob) => {
      // Trigger download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `agentbio-data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: 'Data Export Complete',
        description: 'Your data has been downloaded successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Export Failed',
        description: error.message || 'Failed to export your data. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Request account deletion
  const requestDeletionMutation = useMutation({
    mutationFn: async (reason?: string): Promise<DeletionRequestResponse> => {
      const { data, error } = await supabase.functions.invoke('gdpr-deletion', {
        body: {
          action: 'request',
          reason,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['deletionStatus'] });
      toast({
        title: 'Account Deletion Scheduled',
        description: `Your account will be deleted in ${data.daysRemaining} days. You can cancel this request anytime before then.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Request Failed',
        description: error.message || 'Failed to schedule account deletion.',
        variant: 'destructive',
      });
    },
  });

  // Cancel account deletion
  const cancelDeletionMutation = useMutation({
    mutationFn: async (cancelReason?: string): Promise<DeletionRequestResponse> => {
      const { data, error } = await supabase.functions.invoke('gdpr-deletion', {
        body: {
          action: 'cancel',
          cancelReason,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deletionStatus'] });
      toast({
        title: 'Deletion Cancelled',
        description: 'Your account deletion has been cancelled. Your account is safe.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Cancellation Failed',
        description: error.message || 'Failed to cancel account deletion.',
        variant: 'destructive',
      });
    },
  });

  // Helper to format days remaining message
  const formatDaysRemaining = (days: number): string => {
    if (days === 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    return `In ${days} days`;
  };

  // Helper to get deletion status message
  const getDeletionStatusMessage = (): string => {
    if (!deletionStatus?.scheduled) {
      return 'No account deletion is scheduled';
    }

    const daysText = formatDaysRemaining(deletionStatus.daysRemaining || 0);
    return `Account deletion scheduled for ${daysText}`;
  };

  return {
    // Export functions
    exportData: exportDataMutation.mutate,
    isExporting: isExporting || exportDataMutation.isPending,

    // Deletion status
    deletionStatus,
    isDeletionStatusLoading,
    deletionStatusError: deletionStatusError?.message,
    refetchDeletionStatus,
    isAccountDeletionScheduled: deletionStatus?.scheduled || false,
    daysUntilDeletion: deletionStatus?.daysRemaining,
    deletionScheduledFor: deletionStatus?.scheduledFor,

    // Deletion actions
    requestDeletion: requestDeletionMutation.mutate,
    cancelDeletion: cancelDeletionMutation.mutate,
    isRequestingDeletion: requestDeletionMutation.isPending,
    isCancellingDeletion: cancelDeletionMutation.isPending,

    // Helpers
    formatDaysRemaining,
    getDeletionStatusMessage,
  };
}
