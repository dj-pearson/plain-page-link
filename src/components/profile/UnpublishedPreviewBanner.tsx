/**
 * Shown above the agent's own page while it is unpublished (US-265).
 *
 * Only the owner can load an unpublished profile (RLS), so this is the
 * "preview as visitor" view: the page renders as visitors would see it once
 * live, with one line saying it is not live and a way to publish it.
 */
import { Link } from 'react-router-dom';
import { EyeOff } from 'lucide-react';

export function UnpublishedPreviewBanner() {
  return (
    <div
      role="status"
      className="relative z-20 border-b border-amber-300 bg-amber-50 text-amber-950"
    >
      <div className="container mx-auto flex max-w-5xl flex-col gap-2 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-start gap-2">
          <EyeOff className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>
            <strong className="font-semibold">Preview: only you can see this page.</strong> It isn’t
            published, so visitors see “This page isn’t available”.
          </span>
        </p>
        <Link
          to="/dashboard/settings#publish"
          className="inline-flex min-h-[44px] shrink-0 items-center font-semibold underline underline-offset-2 sm:min-h-0"
        >
          Publish your page
        </Link>
      </div>
    </div>
  );
}
