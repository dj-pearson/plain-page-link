/**
 * Shown when an agent's public page fails to load for a reason that is not
 * "this agent does not exist".
 *
 * US-112: FullProfilePage rendered NotFound for ANY error from the profile
 * query. A visitor who hit a transient network failure — on a phone moving
 * between cells, say — was told the agent does not exist, which is both wrong
 * and, for a page an agent hands out on a business card, damaging. They also
 * had no way to retry short of guessing that a reload might help.
 */
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProfileLoadErrorProps {
  onRetry: () => void;
}

export function ProfileLoadError({ onRetry }: ProfileLoadErrorProps) {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
          <AlertCircle className="h-7 w-7 text-amber-600" />
        </div>
        <h1 className="text-xl font-semibold text-gray-900">This page didn’t load</h1>
        <p className="mt-2 text-sm text-gray-600">
          Something went wrong on the way here — it’s not you, and the page is still there. Try
          again in a moment.
        </p>
        <Button onClick={onRetry} className="mt-6 gap-2">
          <RefreshCw className="h-4 w-4" />
          Try again
        </Button>
      </div>
    </main>
  );
}
