import { Link } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatTopListingCounts, type TopListing } from '@/lib/listingViews';

interface TopListingsCardProps {
  listings: TopListing[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  /** e.g. "the last 30 days" — names the window in the description and the empty state. */
  rangeLabel: string;
}

const STATUS_LABEL: Record<string, string> = { sold: 'Sold', pending: 'Pending' };

/**
 * "Top listings" on the Analytics page (US-325): the agent's most-opened
 * listings in the selected range, from top_listings(). Landing and
 * /features/analytics promise "see which listings visitors view most"; this is
 * where that is answered for a chosen period (the Listings page carries the
 * fixed 7/30-day line per card, US-263).
 *
 * Loading, error and empty are distinct: a failed query never reads as "no
 * views", which would tell the agent their listings are being ignored.
 */
export const TopListingsCard = ({
  listings,
  isLoading,
  isError,
  onRetry,
  rangeLabel,
}: TopListingsCardProps) => {
  const top = listings[0]?.views ?? 0;

  return (
    <Card>
      <CardHeader className="pb-3 sm:pb-4">
        <CardTitle className="text-base sm:text-lg">Top listings</CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          The listings visitors opened most in {rangeLabel}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3" aria-busy="true" aria-label="Loading top listings">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-11 rounded-md bg-muted animate-pulse" />
            ))}
          </div>
        ) : isError ? (
          <div className="text-center py-4 space-y-3" role="alert">
            <p className="text-xs sm:text-sm text-muted-foreground">
              Listing views could not be loaded.
            </p>
            <Button variant="outline" size="sm" onClick={onRetry} className="min-h-[44px]">
              <RefreshCw className="w-4 h-4 mr-2" aria-hidden="true" />
              Try again
            </Button>
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-4 space-y-2">
            <p className="text-xs sm:text-sm text-muted-foreground">
              No visitor opened a listing in {rangeLabel}.
            </p>
            <p className="text-xs text-muted-foreground">
              Share a listing&rsquo;s link from{' '}
              <Link to="/dashboard/listings" className="underline underline-offset-2">
                Listings
              </Link>{' '}
              to start seeing which homes draw interest.
            </p>
          </div>
        ) : (
          <ol className="space-y-1" aria-label={`Most viewed listings in ${rangeLabel}`}>
            {listings.map((listing, index) => {
              const statusLabel = listing.status ? STATUS_LABEL[listing.status] : undefined;
              const share = top > 0 ? Math.max(4, Math.round((listing.views / top) * 100)) : 0;
              return (
                <li key={listing.listingId} className="py-2 min-h-[44px]">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2 sm:gap-3 min-w-0">
                      <span
                        className="text-xs tabular-nums text-muted-foreground w-4 pt-0.5 flex-shrink-0"
                        aria-hidden="true"
                      >
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-medium truncate">{listing.address}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {[listing.city, statusLabel].filter(Boolean).join(' · ')}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs sm:text-sm tabular-nums whitespace-nowrap">
                      {formatTopListingCounts(listing)}
                    </span>
                  </div>
                  <div className="mt-1.5 ml-6 sm:ml-7 h-1 rounded-full bg-muted" aria-hidden="true">
                    <div
                      className="h-1 rounded-full bg-primary/70"
                      style={{ width: `${share}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ol>
        )}
        {!isLoading && !isError && listings.length > 0 && (
          <p className="text-xs text-muted-foreground pt-3">
            Views per listing, counted once per visitor session.
          </p>
        )}
      </CardContent>
    </Card>
  );
};
