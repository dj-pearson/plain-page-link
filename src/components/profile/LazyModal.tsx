import { Suspense, type ReactNode } from 'react';
import { LazyLoadErrorBoundary } from '@/components/LazyLoadErrorBoundary';

/**
 * Shown while a modal's chunk is on its way, so the first tap on "Contact" or
 * "Schedule a showing" gets an immediate overlay instead of a blank pause.
 */
export function ModalLoadingFallback() {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      role="status"
      aria-live="polite"
    >
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/40 border-t-white" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}

/**
 * Wraps a React.lazy modal on the public profile (US-244): a spinner overlay
 * while its chunk loads, and — if the fetch fails — a small dialog offering a
 * reload, instead of LazyLoadErrorBoundary's default full-screen page, which
 * would replace the whole profile because one form did not load.
 *
 * Mount it only while the modal is open, so the chunk is fetched on first use.
 */
export function LazyModal({ children, onClose }: { children: ReactNode; onClose: () => void }) {
  return (
    <LazyLoadErrorBoundary
      fallback={
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          role="alert"
        >
          <div className="max-w-sm rounded-lg bg-white p-6 text-center text-gray-900 shadow-lg">
            <p className="mb-4">
              This form could not be loaded. Check your connection and try again.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mr-2 min-h-[44px] rounded-md bg-blue-600 px-4 text-white"
            >
              Reload
            </button>
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] rounded-md border border-gray-300 px-4"
            >
              Close
            </button>
          </div>
        </div>
      }
    >
      <Suspense fallback={<ModalLoadingFallback />}>{children}</Suspense>
    </LazyLoadErrorBoundary>
  );
}
