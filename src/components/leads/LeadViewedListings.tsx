import { formatDistanceToNow } from 'date-fns';
import { useLeadViewedListings } from '@/hooks/useLeadViewedListings';
import { viewedListingsHeadline } from '@/lib/leadViewedListings';

/** How many listings are named before the rest collapse into "and N more". */
export const VIEWED_LISTINGS_SHOWN = 5;

interface LeadViewedListingsProps {
  lead: { user_id: string; visitor_id?: string | null; created_at?: string | null };
}

/**
 * "Viewed 4 listings before contacting you" on the lead detail (US-531,
 * US-276). Renders nothing for a lead with no visitor id (older leads, kiosk
 * sign-ins, visitors without storage), while loading, on a failed read, or
 * when the visitor opened nothing: absence here is not worth a placeholder.
 */
export function LeadViewedListings({ lead }: LeadViewedListingsProps) {
  const { viewed, isLoading, isError } = useLeadViewedListings(lead);
  const headline = viewedListingsHeadline(viewed.length);
  if (isLoading || isError || !headline) return null;

  const shown = viewed.slice(0, VIEWED_LISTINGS_SHOWN);
  const more = viewed.length - shown.length;

  return (
    <section className="space-y-2" aria-labelledby="lead-viewed-listings-heading">
      <h3
        id="lead-viewed-listings-heading"
        className="font-semibold text-sm text-muted-foreground uppercase tracking-wide"
      >
        Browsing before they asked
      </h3>
      <p className="text-sm font-medium">{headline}</p>
      <ul className="divide-y rounded-lg border">
        {shown.map((item) => (
          <li key={item.listingId} className="flex items-baseline justify-between gap-3 px-3 py-2">
            <span className="min-w-0 truncate text-sm">
              {item.address ?? 'A listing since removed'}
            </span>
            <time
              dateTime={item.lastViewedAt}
              className="flex-shrink-0 text-xs text-muted-foreground"
            >
              {formatDistanceToNow(new Date(item.lastViewedAt), { addSuffix: true })}
            </time>
          </li>
        ))}
      </ul>
      {more > 0 && (
        <p className="text-xs text-muted-foreground">and {more.toLocaleString('en-US')} more</p>
      )}
      <p className="text-xs text-muted-foreground">
        From this visitor&apos;s browser only, so views on another device are not counted.
      </p>
    </section>
  );
}
