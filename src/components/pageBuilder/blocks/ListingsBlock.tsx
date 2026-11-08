/**
 * Listings Block Component
 * Displays property listings in various layouts
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ListingsBlockConfig } from '@/types/pageBuilder';
import { Badge } from '@/components/ui/badge';
import { Bed, Bath, Square, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { LISTINGS_BLOCK_COLUMNS, type ListingsBlockRow } from '@/lib/listingColumns';
import { formatPrice, parsePrice } from '@/lib/format';
import { toStringList } from '@/types/profile';
import { fallBackToOriginal, LISTING_CARD_IMAGE_SIZES, responsiveImage } from '@/lib/images';
import { cn } from '@/lib/utils';

/**
 * The public page a listing in the block opens, or null when it has none.
 *
 * Supplied by the public profile, which knows the username and the agent's
 * show_listings / show_sold_properties settings; the page builder's canvas
 * passes nothing, so cards there stay inert.
 */
export type ListingsBlockHref = (listing: Pick<ListingsBlockRow, 'id' | 'status'>) => string | null;

interface ListingsBlockProps {
  config: ListingsBlockConfig;
  isEditing?: boolean;
  userId?: string; // User ID to fetch listings for
  listingHref?: ListingsBlockHref;
}

/**
 * "1 Oak St, Provo, UT" from whichever parts the listing has. The template
 * this replaces rendered "1 Oak St, Provo, null" on the public page for every
 * listing saved without a state (state is nullable).
 */
export function listingsBlockAddress(
  listing: Pick<ListingsBlockRow, 'address' | 'city' | 'state'>
): string {
  return [listing.address, listing.city, listing.state]
    .map((part) => (typeof part === 'string' ? part.trim() : ''))
    .filter((part) => part.length > 0)
    .join(', ');
}

/** A positive count, or null — so a 0 renders nothing rather than a stray "0". */
function positive(value: number | null | undefined): number | null {
  return typeof value === 'number' && value > 0 ? value : null;
}

/**
 * A row from `listings`, with photos narrowed.
 *
 * Restated by hand this declared `price: number`. The column is text, so at
 * runtime price is a string and `listing.price.toLocaleString()` below was
 * String.prototype.toLocaleString — which returns the string unchanged. A
 * price the agent typed as "$450,000" rendered as "$$450,000" with the leading
 * $ in the template, and a plain "450000" rendered as "$450000", never
 * acquiring the thousands separators the call was there to add. It also typed
 * `state` non-nullable and omitted every other column. It now carries exactly
 * the columns LISTINGS_BLOCK_COLUMNS selects (US-342).
 */
type Listing = Omit<ListingsBlockRow, 'photos'> & {
  photos: string[] | null;
};

/**
 * The listing's own photo at the size it is shown (200/400/800 variants with a
 * srcset), never a stock photo of someone else's house. The old fallback was an
 * 800px Unsplash image hot-linked from a third party, presented as the agent's
 * listing (US-260). No photo shows the property placeholder.
 */
function ListingPhoto({ listing, alt }: { listing: Listing; alt: string }) {
  const photo = responsiveImage(listing.photos?.[0] ?? listing.image);
  return (
    <img
      src={photo.src}
      srcSet={photo.srcSet}
      sizes={photo.srcSet ? LISTING_CARD_IMAGE_SIZES : undefined}
      alt={alt}
      loading="lazy"
      decoding="async"
      className="w-full h-full object-cover"
      onError={(e) => fallBackToOriginal(e.currentTarget, photo.original)}
    />
  );
}

export function ListingsBlock({
  config,
  isEditing = false,
  userId,
  listingHref,
}: ListingsBlockProps) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchListings() {
      if (!userId) {
        setIsLoading(false);
        return;
      }

      try {
        let query = supabase
          .from('listings')
          .select(LISTINGS_BLOCK_COLUMNS)
          .eq('user_id', userId)
          // The order the agent arranged in the dashboard, as the profile's
          // own gallery uses it (usePublicProfile, US-253). created_at alone
          // ignored every drag-to-reorder the agent made.
          .order('sort_order', { ascending: true })
          .order('created_at', { ascending: false })
          .order('id', { ascending: true });

        // Apply filter
        if (config.filter === 'active') {
          query = query.eq('status', 'active');
        } else if (config.filter === 'featured') {
          query = query.eq('is_featured', true);
        }

        // Limit results
        if (config.maxItems) {
          query = query.limit(config.maxItems);
        }

        const { data, error } = await query;

        if (error) throw error;

        setListings((data ?? []).map((row) => ({ ...row, photos: toStringList(row.photos) })));
      } catch (error) {
        logger.error('Error fetching listings', error as Error);
        setListings([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchListings();
  }, [userId, config.filter, config.maxItems]);

  const getGridClass = () => {
    switch (config.layout) {
      case 'list':
        return 'grid grid-cols-1 gap-4';
      case 'carousel':
        return 'flex overflow-x-auto gap-4 snap-x snap-mandatory';
      case 'grid':
      default:
        return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {config.title && <h2 className="text-2xl font-bold text-center">{config.title}</h2>}
        <div className="text-center py-12 text-gray-500">
          <p>Loading listings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      {config.title && <h2 className="text-2xl font-bold text-center">{config.title}</h2>}

      {/* Listings Grid */}
      <div className={getGridClass()}>
        {listings.map((listing) => {
          const address = listingsBlockAddress(listing);
          // Only on the public page, and only to a listing page that will
          // actually show this home (selectListingForPage's rules). These
          // cards used to wear cursor-pointer and a hover shadow while
          // going nowhere: a visitor tapping a home on the agent's page got
          // nothing, not the listing page with its gallery and contact bar.
          const href = isEditing ? null : (listingHref?.(listing) ?? null);
          const beds = positive(listing.bedrooms);
          const baths = positive(listing.bathrooms);
          const sqft = positive(listing.square_feet);
          return (
            <div
              key={listing.id}
              className={cn(
                'relative bg-white rounded-lg border overflow-hidden',
                href && 'group hover:shadow-lg transition-shadow',
                config.layout === 'carousel' && 'w-72 shrink-0 snap-start'
              )}
            >
              {/* Image */}
              <div className="relative aspect-video">
                <ListingPhoto listing={listing} alt={address} />
                {config.showStatus && (
                  <Badge
                    className="absolute top-2 right-2 capitalize"
                    variant={listing.status === 'active' ? 'default' : 'secondary'}
                  >
                    {listing.status}
                  </Badge>
                )}
              </div>

              {/* Content */}
              <div className="p-4 space-y-2">
                {/* Price */}
                {config.showPrices && (
                  <p className="text-2xl font-bold text-primary">
                    {formatPrice(parsePrice(listing.price))}
                  </p>
                )}

                {/* Address */}
                <div className="flex items-center gap-1 text-gray-600 text-sm">
                  <MapPin className="w-4 h-4 shrink-0" aria-hidden="true" />
                  {href ? (
                    // The card's one control. Its ::after covers the card, so
                    // the whole card is the target while it stays a real link
                    // (open in a new tab, crawlable), as ListingCard does.
                    <Link
                      to={href}
                      className="min-w-0 truncate rounded group-hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary after:absolute after:inset-0 after:content-['']"
                    >
                      <span className="sr-only">View listing: </span>
                      {address}
                    </Link>
                  ) : (
                    <span className="min-w-0 truncate">{address}</span>
                  )}
                </div>

                {/* Features */}
                {(beds || baths || sqft) && (
                  <div className="flex items-center gap-4 text-gray-700 text-sm pt-2">
                    {beds && (
                      <div className="flex items-center gap-1">
                        <Bed className="w-4 h-4" aria-hidden="true" />
                        {beds} bd
                      </div>
                    )}
                    {baths && (
                      <div className="flex items-center gap-1">
                        <Bath className="w-4 h-4" aria-hidden="true" />
                        {baths} ba
                      </div>
                    )}
                    {sqft && (
                      <div className="flex items-center gap-1">
                        <Square className="w-4 h-4" aria-hidden="true" />
                        {sqft.toLocaleString()} sqft
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {listings.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p>No listings to display</p>
          {isEditing && (
            <p className="text-sm mt-1">
              Add some properties in the Listings dashboard to see them here
            </p>
          )}
        </div>
      )}
    </div>
  );
}
