/**
 * Hook for submitting URLs to Google Indexing API
 * Uses the google-indexing edge function with the service account credentials
 */

import { useMutation } from '@tanstack/react-query';
import { EdgeFunctions } from '@/lib/edgeFunctions';

type IndexingAction = 'URL_UPDATED' | 'URL_DELETED';

interface GoogleIndexingResult {
  success: boolean;
  total: number;
  succeeded: number;
  failed: number;
  action: string;
  results: Array<{ url: string; success: boolean; error?: string }>;
}

export const useGoogleIndexing = () => {
  const mutation = useMutation({
    mutationFn: async ({
      urls,
      action = 'URL_UPDATED',
    }: {
      urls: string[];
      action?: IndexingAction;
    }) => {
      return EdgeFunctions.submitGoogleIndexing({ urls, action });
    },
  });

  const submitUrlsForIndexing = (urls: string[]) => {
    return mutation.mutateAsync({ urls, action: 'URL_UPDATED' });
  };

  const submitUrlsForRemoval = (urls: string[]) => {
    return mutation.mutateAsync({ urls, action: 'URL_DELETED' });
  };

  return {
    submitUrlsForIndexing,
    submitUrlsForRemoval,
    isSubmitting: mutation.isPending,
    error: mutation.error,
    result: mutation.data as GoogleIndexingResult | undefined,
    reset: mutation.reset,
  };
};
