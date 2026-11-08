/**
 * useGDPR Hook
 * Handles GDPR data export and account deletion functionality
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { callEdgeFunction, edgeFunctions } from '@/lib/edgeFunctions';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/useAuthStore';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import {
  EXPORT_REQUEST_COLUMNS,
  EXPORT_REQUEST_LIST_LIMIT,
  IMMEDIATE_EXPORT_TIMEOUT_MS,
  describeQueueError,
  describeResendError,
  hasExportInFlight,
  shouldOfferQueuedExport,
  type ExportRequestRow,
} from '@/lib/dataExportRequests';

interface DeletionStatus {
  scheduled: boolean;
  scheduledFor?: string;
  daysRemaining?: number;
  reason?: string;
  canCancel?: boolean;
  requestedAt?: string;
  message?: string;
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
  const user = useAuthStore((s) => s.user);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isExporting, setIsExporting] = useState(false);
  // Set when the immediate download failed in a way the emailed link would
  // fix (server could not finish, timed out, connection dropped).
  const [offerQueuedExport, setOfferQueuedExport] = useState(false);

  // The subject's own export requests (US-403). RLS: "Users can view own
  // GDPR requests". file_url is never selected — the link exists only in the
  // email.
  const {
    data: exportRequests = [],
    isLoading: isExportRequestsLoading,
    error: exportRequestsError,
  } = useQuery({
    queryKey: ['exportRequests', user?.id],
    queryFn: async (): Promise<ExportRequestRow[]> => {
      const { data, error } = await supabase
        .from('gdpr_data_requests')
        .select(EXPORT_REQUEST_COLUMNS)
        .eq('user_id', user!.id)
        .eq('request_type', 'export')
        .order('created_at', { ascending: false })
        .limit(EXPORT_REQUEST_LIST_LIMIT);
      if (error) {
        logger.error('Could not load data export requests', error);
        throw error;
      }
      return (data ?? []) as ExportRequestRow[];
    },
    enabled: !!user?.id,
    staleTime: 30_000,
    // While one is queued, check back now and then so the status moves on
    // without a reload.
    refetchInterval: (query) =>
      hasExportInFlight((query.state.data as ExportRequestRow[] | undefined) ?? [])
        ? 60_000
        : false,
  });

  // Queue an export to be built in the background and emailed (US-403).
  const queueExportMutation = useMutation({
    mutationFn: async (): Promise<{ requestId?: string; message?: string }> => {
      return await callEdgeFunction<{ requestId?: string; message?: string }>('gdpr-export', {
        method: 'POST',
        auth: true,
      });
    },
    onSuccess: () => {
      setOfferQueuedExport(false);
      queryClient.invalidateQueries({ queryKey: ['exportRequests'] });
      toast({
        title: 'Export requested',
        description: 'We will email you a download link when it is ready, usually within the hour.',
      });
    },
    onError: (error: unknown) => {
      // A 409 means one is already on its way: show it in the list.
      queryClient.invalidateQueries({ queryKey: ['exportRequests'] });
      toast({
        title: 'Could not request export',
        description: describeQueueError(error),
        variant: 'destructive',
      });
    },
  });

  // Email a fresh link to a completed export that has not expired (US-404).
  // The server sends it; the link never comes back to the browser.
  const resendExportLinkMutation = useMutation({
    mutationFn: async (requestId: string): Promise<{ expiresAt?: string }> => {
      return await callEdgeFunction<{ expiresAt?: string }>('gdpr-export', {
        method: 'POST',
        auth: true,
        body: { action: 'resend_link', requestId },
      });
    },
    onSuccess: () => {
      toast({
        title: 'Link sent',
        description:
          'We have emailed you a fresh download link. Check your spam folder if it does not arrive.',
      });
    },
    onError: (error: unknown) => {
      // A 410 means the file is gone: refresh so the row reads Expired.
      queryClient.invalidateQueries({ queryKey: ['exportRequests'] });
      toast({
        title: 'Could not send the link',
        description: describeResendError(error),
        variant: 'destructive',
      });
    },
  });

  // Fetch deletion status
  const {
    data: deletionStatus,
    isLoading: isDeletionStatusLoading,
    error: deletionStatusError,
    refetch: refetchDeletionStatus,
  } = useQuery({
    queryKey: ['deletionStatus', user?.id],
    queryFn: async (): Promise<DeletionStatus> => {
      return await callEdgeFunction<DeletionStatus>('gdpr-deletion', {
        method: 'GET',
        auth: true,
      });
    },
    enabled: !!user?.id,
    staleTime: 60000, // 1 minute
  });

  // Request data export
  const exportDataMutation = useMutation({
    mutationFn: async (): Promise<Blob> => {
      setIsExporting(true);
      setOfferQueuedExport(false);

      // A large account can take longer than anyone will wait; past this the
      // screen offers the emailed link instead.
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), IMMEDIATE_EXPORT_TIMEOUT_MS);

      try {
        // Request export and get data directly
        const data = await callEdgeFunction('gdpr-export', {
          method: 'GET',
          auth: true,
          signal: controller.signal,
        });

        // Convert to blob for download
        const blob = new Blob([JSON.stringify(data, null, 2)], {
          type: 'application/json',
        });

        return blob;
      } finally {
        clearTimeout(timer);
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
      // The GET leaves any queued request as it was (US-424), so the list of
      // requests is unchanged and needs no refetch.
    },
    onError: (error: Error) => {
      if (shouldOfferQueuedExport(error)) {
        setOfferQueuedExport(true);
        toast({
          title: 'The download did not finish',
          description: 'We can build it in the background and email you a download link instead.',
          variant: 'destructive',
        });
        return;
      }
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
      const { data, error } = await edgeFunctions.invoke('gdpr-deletion', {
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
      const { data, error } = await edgeFunctions.invoke('gdpr-deletion', {
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

    // Queued (emailed) export
    queueExport: queueExportMutation.mutate,
    isQueueingExport: queueExportMutation.isPending,
    offerQueuedExport,
    exportRequests,
    isExportRequestsLoading,
    exportRequestsError: exportRequestsError ? 'Could not load your export requests.' : undefined,
    hasExportInFlight: hasExportInFlight(exportRequests),
    resendExportLink: resendExportLinkMutation.mutate,
    /** The request whose link is being re-sent, if any. */
    resendingExportId: resendExportLinkMutation.isPending
      ? (resendExportLinkMutation.variables ?? null)
      : null,

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
