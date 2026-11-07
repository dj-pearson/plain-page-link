import { ExternalLink } from 'lucide-react';
import { useLeadListing } from '@/hooks/useLeadListing';
import { fallBackToOriginal, sizedImage } from '@/lib/images';
import { formatPrice } from '@/lib/format';
import { buildListingShareUrl } from '@/lib/listingShare';
import { listingStatusBadgeClass, listingStatusLabel } from '@/lib/listingStatus';

/** `listings.price` is text; a bare number is formatted, anything else shown as typed. */
export function displayListingPrice(price: string): string {
  const trimmed = price.trim();
  return /^\d+(\.\d+)?$/.test(trimmed) ? formatPrice(Number(trimmed)) : trimmed;
}

interface LeadListingCardProps {
  listingId: string;
  /** What the lead row recorded, shown while loading or if the listing is gone. */
  fallbackAddress?: string | null;
}

/**
 * The property a lead asked about, with its current status (US-264). Status
 * matters most here: an enquiry about a listing that has since gone pending is
 * a different first call.
 */
export function LeadListingCard({ listingId, fallbackAddress }: LeadListingCardProps) {
  const { listing, isLoading } = useLeadListing(listingId);

  if (isLoading) {
    return (
      <div
        className="h-20 rounded-lg border bg-muted/40 animate-pulse"
        aria-label="Loading listing"
      />
    );
  }

  if (!listing) {
    return (
      <p className="text-sm text-muted-foreground">
        {fallbackAddress ? `${fallbackAddress} — ` : ''}this listing has since been removed.
      </p>
    );
  }

  const image = sizedImage(listing.photo, 200);
  const publicUrl =
    listing.username && typeof window !== 'undefined'
      ? buildListingShareUrl(`${window.location.origin}/${listing.username}`, listing.id)
      : null;
  const place = [listing.city, listing.state].filter(Boolean).join(', ');

  return (
    <div className="flex items-center gap-3 rounded-lg border p-3">
      <img
        src={image.src}
        alt=""
        width={64}
        height={64}
        loading="lazy"
        onError={(e) => fallBackToOriginal(e.currentTarget, image.original)}
        className="h-16 w-16 flex-shrink-0 rounded-md object-cover bg-muted"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{listing.address}</p>
        {place && <p className="truncate text-xs text-muted-foreground">{place}</p>}
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold">{displayListingPrice(listing.price)}</span>
          <span
            className={`rounded px-1.5 py-0.5 text-xs font-medium ${listingStatusBadgeClass(listing.status)}`}
          >
            {listingStatusLabel(listing.status)}
          </span>
        </div>
      </div>
      {publicUrl && (
        <a
          href={publicUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-[44px] flex-shrink-0 items-center gap-1 rounded-md px-2 text-xs font-medium text-primary hover:underline"
        >
          View
          <ExternalLink className="h-3 w-3" aria-hidden="true" />
          <span className="sr-only">{listing.address} on the public page</span>
        </a>
      )}
    </div>
  );
}
