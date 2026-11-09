/**
 * The line a dashboard block shows when its own query failed.
 *
 * US-590: the Overview blocks below the stats each run their own query, and
 * each one treated a failure as "nothing to show". Due today and Coming up
 * vanished, so an agent with three overdue follow-ups saw a clean dashboard;
 * Top Links offered "Add your first link" to an agent with twenty; the funnel
 * drew five zeros. A failure now says so, in place, with a way to retry.
 */
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SectionLoadErrorProps {
  /** What did not load, as a sentence: "Your follow-ups did not load." */
  message: string;
  onRetry: () => void;
  /** Names the Retry button for screen readers when a page has several. */
  retryLabel?: string;
}

export function SectionLoadError({ message, onRetry, retryLabel }: SectionLoadErrorProps) {
  return (
    <div role="alert" className="flex flex-col gap-3 py-2 sm:flex-row sm:items-center sm:gap-4">
      <AlertCircle className="h-5 w-5 flex-shrink-0 text-destructive" aria-hidden="true" />
      <p className="flex-1 text-sm text-foreground">
        {message} <span className="text-muted-foreground">Nothing has been lost.</span>
      </p>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="min-h-[44px] gap-2 self-start sm:self-auto"
        onClick={onRetry}
        aria-label={retryLabel}
      >
        <RefreshCw className="h-4 w-4" aria-hidden="true" />
        Retry
      </Button>
    </div>
  );
}
