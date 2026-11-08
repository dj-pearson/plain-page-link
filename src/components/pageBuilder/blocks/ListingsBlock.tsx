/**
 * Listings Block Component
 * Displays property listings in various layouts
 */

import { useEffect, useState } from 'react';
import { ListingsBlockConfig } from '@/types/pageBuilder';
import { Badge } from '@/components/ui/badge';
import { Bed, Bath, Square, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { LISTINGS_BLOCK_COLUMNS, type ListingsBlockRow } from '@/lib/listingColumns';
import { formatPrice, parsePrice } from '@/lib/format';
import { toStringList } from '@/types/profile';
import { fallBackToOriginal, LISTING_CARD_IMAGE_SIZES, responsiveImage } from '@/lib/images';

interface ListingsBlockProps {
  config: ListingsBlockConfig;
  isEditing?: boolean;
  userId?: string; // User ID to fetch listings for
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

export function ListingsBlock({ config, isEditing = false, userId }: ListingsBlockProps) {
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
          .order('created_at', { ascending: false });

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
        return 'flex overflow-x-auto gap-4 snap-x';
      case 'grid':
      default:
        return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6';
    }
  };

  const formatAddress = (listing: Listing) => {
    return `${listing.address}, ${listing.city}, ${listing.state}`;
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
        {listings.map((listing) => (
          <div
            key={listing.id}
            className="bg-white rounded-lg border overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
          >
            {/* Image */}
            <div className="relative aspect-video">
              <ListingPhoto listing={listing} alt={formatAddress(listing)} />
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
                <MapPin className="w-4 h-4" />
                {formatAddress(listing)}
              </div>

              {/* Features */}
              {(listing.bedrooms || listing.bathrooms || listing.square_feet) && (
                <div className="flex items-center gap-4 text-gray-700 text-sm pt-2">
                  {listing.bedrooms && (
                    <div className="flex items-center gap-1">
                      <Bed className="w-4 h-4" />
                      {listing.bedrooms} bd
                    </div>
                  )}
                  {listing.bathrooms && (
                    <div className="flex items-center gap-1">
                      <Bath className="w-4 h-4" />
                      {listing.bathrooms} ba
                    </div>
                  )}
                  {listing.square_feet && (
                    <div className="flex items-center gap-1">
                      <Square className="w-4 h-4" />
                      {listing.square_feet.toLocaleString()} sqft
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
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
