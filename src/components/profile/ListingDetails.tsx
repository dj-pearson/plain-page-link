/**
 * One listing in full: photos, price, facts, description, highlights, tour,
 * and the showing / share / save actions.
 *
 * This was ListingDetailModal, a Radix dialog over the profile. US-275 gave the
 * listing a page of its own (/:username/listing/:id, ListingPage), so the same
 * content now renders in the page flow instead: the address is the page's h1,
 * there is no close button, and the photo arrows answer the keyboard only while
 * the gallery has focus — a window-wide arrow listener is fine inside a modal
 * and wrong on a page, where it would steal the arrows from everything else.
 *
 * The JSON-LD the modal injected now comes from the page's SEOHead, where it
 * sits in <head> with the canonical URL beside it.
 */
import { useState, useEffect, type ReactNode } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  Share2,
  Bed,
  Bath,
  Maximize,
  MapPin,
  Calendar,
  Home,
  ExternalLink,
  Video,
  Tag,
  Clock,
  Check,
  Layers,
} from 'lucide-react';
import {
  fallBackToOriginal,
  getImageUrls,
  imageVariantUrl,
  PLACEHOLDER_PROPERTY_IMAGE,
} from '@/lib/images';
import { formatPrice, parsePrice, formatNumber } from '@/lib/format';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { PublicProfileListing } from '@/types';
import { currentListingShareUrl } from '@/lib/listingShare';
import { sanitizeExternalUrl } from '@/utils/sanitizeUrl';
import { listingStatusBadgeClass } from '@/lib/listingStatus';

interface ListingDetailsProps {
  listing: PublicProfileListing;
  calendlyUrl?: string;
  /**
   * Opens the agent's scheduling flow for THIS property, so the enquiry
   * reaches the CRM with the listing attached (US-096).
   */
  onRequestShowing?: (listing: PublicProfileListing) => void;
}

const statusLabels: Record<string, string> = {
  active: 'Active',
  pending: 'Pending',
  under_contract: 'Under Contract',
  sold: 'Sold',
  draft: 'Draft',
};

const propertyTypeLabels: Record<string, string> = {
  single_family: 'Single Family',
  condo: 'Condo',
  townhouse: 'Townhouse',
  multi_family: 'Multi-Family',
  land: 'Land',
  commercial: 'Commercial',
};

const SAVED_LISTINGS_KEY = 'agentbio_saved_listings';

/** The listing's photos: the gallery, else the legacy single image (US-112). */
export function listingPhotos(listing: PublicProfileListing): string[] {
  // `photos?.length ? … : …`, not `photos || …`: usePublicProfile normalises a
  // null gallery to [], which is truthy, so the legacy image never showed.
  return getImageUrls(
    listing.photos?.length ? listing.photos : listing.image ? [listing.image] : null
  );
}

export default function ListingDetails({
  listing,
  calendlyUrl,
  onRequestShowing,
}: ListingDetailsProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [showShareTooltip, setShowShareTooltip] = useState(false);
  // The photo cross-fade swaps instantly under prefers-reduced-motion (US-260).
  const reduceMotion = useReducedMotion() ?? false;

  const photos = listingPhotos(listing);

  const address = listing.address || '';
  const city = listing.city || '';
  const state = listing.state || '';
  const zipCode = listing.zip_code || '';
  const price = parsePrice(listing.price);
  const beds = listing.bedrooms ?? 0;
  const baths = listing.bathrooms ?? 0;
  const sqft = listing.square_feet ?? 0;
  const description = listing.description || '';
  const propertyType = listing.property_type || '';
  const mlsNumber = listing.mls_number || '';
  const lotSize = listing.lot_size_acres;
  // US-268: an agent-entered (or CSV-imported) URL; only http(s) is linked.
  const virtualTourUrl = sanitizeExternalUrl(listing.virtual_tour_url);
  const daysOnMarket = listing.days_on_market;
  // text[] since US-056; the guard is for an older row holding anything else.
  const highlightsList = Array.isArray(listing.highlights) ? listing.highlights : [];

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(SAVED_LISTINGS_KEY) || '[]') as string[];
      setIsSaved(saved.includes(listing.id));
    } catch {
      /* ignore */
    }
  }, [listing.id]);

  // A different listing (a "More from" card) starts at its first photo.
  useEffect(() => {
    setCurrentImageIndex(0);
  }, [listing.id]);

  const showPrevious = () => setCurrentImageIndex((i) => (i - 1 + photos.length) % photos.length);
  const showNext = () => setCurrentImageIndex((i) => (i + 1) % photos.length);

  const toggleSave = () => {
    try {
      const saved = JSON.parse(localStorage.getItem(SAVED_LISTINGS_KEY) || '[]') as string[];
      if (isSaved) {
        const updated = saved.filter((id) => id !== listing.id);
        localStorage.setItem(SAVED_LISTINGS_KEY, JSON.stringify(updated));
        setIsSaved(false);
        toast.success('Removed from saved listings');
      } else {
        saved.push(listing.id);
        localStorage.setItem(SAVED_LISTINGS_KEY, JSON.stringify(saved));
        setIsSaved(true);
        toast.success('Saved to your favorites!');
      }
    } catch {
      /* ignore */
    }
  };

  const handleShare = async () => {
    const shareText = `${address}${city ? `, ${city}` : ''} - ${formatPrice(price)}`;
    const shareUrl = currentListingShareUrl(listing.id) ?? window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({ title: `Property: ${address}`, text: shareText, url: shareUrl });
        return;
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setShowShareTooltip(true);
      setTimeout(() => setShowShareTooltip(false), 2000);
      toast.success('Link copied to clipboard!');
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const fullAddress = [address, city, [state, zipCode].filter(Boolean).join(' ')]
    .filter(Boolean)
    .join(', ');

  return (
    <article className="overflow-hidden rounded-2xl bg-white text-gray-900 shadow-sm">
      {/* Status and actions */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'px-2.5 py-1 rounded-full text-xs font-semibold',
              listingStatusBadgeClass(listing.status)
            )}
          >
            {statusLabels[listing.status ?? 'active'] || listing.status}
          </span>
          {mlsNumber && <span className="text-xs text-gray-600">MLS# {mlsNumber}</span>}
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={toggleSave}
            aria-label={isSaved ? 'Remove from saved' : 'Save property'}
            aria-pressed={isSaved}
            className={cn(
              'p-2 rounded-full transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center',
              isSaved ? 'bg-red-50 text-red-600' : 'hover:bg-gray-100 text-gray-700'
            )}
          >
            <Heart className={cn('h-5 w-5', isSaved && 'fill-current')} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={handleShare}
            aria-label={showShareTooltip ? 'Link copied' : 'Share property'}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-700 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            {showShareTooltip ? (
              <Check className="h-5 w-5 text-green-600" aria-hidden="true" />
            ) : (
              <Share2 className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Photos. Focusable, so the arrow keys page through them without a
          window-wide listener. */}
      <div
        role="group"
        aria-roledescription="carousel"
        aria-label={`Photos of ${address || 'this property'}`}
        tabIndex={photos.length > 1 ? 0 : undefined}
        onKeyDown={(e) => {
          if (photos.length < 2) return;
          if (e.key === 'ArrowLeft') {
            e.preventDefault();
            showPrevious();
          } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            showNext();
          }
        }}
        className="relative bg-gray-900 aspect-[4/3] sm:aspect-[16/9] max-h-[65vh] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white"
      >
        <AnimatePresence mode="wait">
          <motion.img
            key={currentImageIndex}
            src={photos[currentImageIndex]}
            alt={`${address} - Photo ${currentImageIndex + 1}`}
            className="w-full h-full object-cover"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.3 }}
            onError={(e) => {
              e.currentTarget.src = PLACEHOLDER_PROPERTY_IMAGE;
            }}
          />
        </AnimatePresence>

        {photos.length > 1 && (
          <>
            <button
              type="button"
              onClick={showPrevious}
              aria-label="Previous photo"
              className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 bg-white/90 rounded-full shadow-lg hover:bg-white transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <ChevronLeft className="h-5 w-5 text-gray-800" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={showNext}
              aria-label="Next photo"
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 bg-white/90 rounded-full shadow-lg hover:bg-white transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <ChevronRight className="h-5 w-5 text-gray-800" aria-hidden="true" />
            </button>
            <div
              className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-black/60 rounded-full text-white text-xs font-medium"
              aria-live="polite"
            >
              {currentImageIndex + 1} / {photos.length}
            </div>
          </>
        )}

        {photos.length > 1 && (
          <div className="absolute bottom-3 right-3 hidden sm:flex gap-1 max-w-[40%]">
            {photos.slice(0, 5).map((photo, idx) => (
              <button
                type="button"
                key={idx}
                onClick={() => setCurrentImageIndex(idx)}
                aria-label={`Show photo ${idx + 1} of ${photos.length}`}
                aria-pressed={idx === currentImageIndex}
                className={cn(
                  'w-12 h-9 rounded-md overflow-hidden border-2 transition-opacity flex-shrink-0',
                  idx === currentImageIndex
                    ? 'border-white shadow-lg'
                    : 'border-transparent opacity-70 hover:opacity-100'
                )}
              >
                {/* A 48x36 thumbnail: the 200px variant, not the original (US-260). */}
                <img
                  src={imageVariantUrl(photo, 200) ?? photo}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover"
                  onError={(e) => fallBackToOriginal(e.currentTarget, photo)}
                />
              </button>
            ))}
            {photos.length > 5 && (
              <div className="w-12 h-9 rounded-md bg-black/60 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                +{photos.length - 5}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="p-5 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Main details */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <p className="text-3xl sm:text-4xl font-bold text-gray-900 mb-1">
                {formatPrice(price)}
              </p>
              <h1 className="flex items-start gap-2 text-lg font-medium text-gray-700">
                <MapPin className="h-4 w-4 mt-1.5 flex-shrink-0" aria-hidden="true" />
                <span>{fullAddress || 'Property details'}</span>
              </h1>
            </div>

            {/* Key stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {beds > 0 && (
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <Bed className="h-5 w-5 mx-auto mb-1 text-gray-600" aria-hidden="true" />
                  <div className="text-xl font-bold text-gray-900">{beds}</div>
                  <div className="text-xs text-gray-600">Bedrooms</div>
                </div>
              )}
              {baths > 0 && (
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <Bath className="h-5 w-5 mx-auto mb-1 text-gray-600" aria-hidden="true" />
                  <div className="text-xl font-bold text-gray-900">{baths}</div>
                  <div className="text-xs text-gray-600">Bathrooms</div>
                </div>
              )}
              {sqft > 0 && (
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <Maximize className="h-5 w-5 mx-auto mb-1 text-gray-600" aria-hidden="true" />
                  <div className="text-xl font-bold text-gray-900">{formatNumber(sqft)}</div>
                  <div className="text-xs text-gray-600">Sq Ft</div>
                </div>
              )}
              {sqft > 0 && price > 0 && (
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <Tag className="h-5 w-5 mx-auto mb-1 text-gray-600" aria-hidden="true" />
                  <div className="text-xl font-bold text-gray-900">${Math.round(price / sqft)}</div>
                  <div className="text-xs text-gray-600">Per Sq Ft</div>
                </div>
              )}
            </div>

            {description && (
              <section>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">About This Property</h2>
                <p className="max-w-prose text-gray-700 leading-relaxed whitespace-pre-line">
                  {description}
                </p>
              </section>
            )}

            {highlightsList.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Property Highlights</h2>
                <ul className="flex flex-wrap gap-2">
                  {highlightsList.map((highlight: string, idx: number) => (
                    <li
                      key={idx}
                      className="px-3 py-1.5 bg-gray-100 text-gray-800 rounded-full text-sm font-medium"
                    >
                      {highlight}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {virtualTourUrl && (
              <div className="rounded-xl border border-gray-200 p-5">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <Video className="h-5 w-5 text-gray-700" aria-hidden="true" />
                    <div>
                      <h2 className="font-semibold text-gray-900">Virtual Tour Available</h2>
                      <p className="text-sm text-gray-600">Walk through this property online</p>
                    </div>
                  </div>
                  <a
                    href={virtualTourUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium text-sm min-h-[44px]"
                  >
                    Take Tour <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <section className="bg-gray-50 rounded-xl p-5">
              <h2 className="font-semibold text-gray-900 mb-3">Property Details</h2>
              <dl className="space-y-3">
                {propertyType && (
                  <DetailRow icon={Home} label="Type">
                    {propertyTypeLabels[propertyType] || propertyType}
                  </DetailRow>
                )}
                {beds > 0 && (
                  <DetailRow icon={Bed} label="Bedrooms">
                    {beds}
                  </DetailRow>
                )}
                {baths > 0 && (
                  <DetailRow icon={Bath} label="Bathrooms">
                    {baths}
                  </DetailRow>
                )}
                {sqft > 0 && (
                  <DetailRow icon={Maximize} label="Square Feet">
                    {formatNumber(sqft)}
                  </DetailRow>
                )}
                {lotSize && (
                  <DetailRow icon={Layers} label="Lot Size">
                    {lotSize} acres
                  </DetailRow>
                )}
                {daysOnMarket != null && (
                  <DetailRow icon={Clock} label="Days on Market">
                    {daysOnMarket}
                  </DetailRow>
                )}
                {mlsNumber && (
                  <DetailRow icon={Tag} label="MLS#">
                    {mlsNumber}
                  </DetailRow>
                )}
              </dl>
            </section>

            {/* CTAs */}
            <div className="space-y-2">
              {onRequestShowing && listing.status !== 'sold' && (
                <button
                  type="button"
                  onClick={() => onRequestShowing(listing)}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium min-h-[44px]"
                >
                  <Calendar className="h-4 w-4" aria-hidden="true" />
                  {calendlyUrl ? 'Schedule a Showing' : 'Request a Showing'}
                </button>
              )}
              <button
                type="button"
                onClick={handleShare}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-200 text-gray-800 rounded-lg hover:bg-gray-50 transition-colors font-medium min-h-[44px]"
              >
                <Share2 className="h-4 w-4" aria-hidden="true" /> Share Property
              </button>
              <button
                type="button"
                onClick={toggleSave}
                className={cn(
                  'w-full inline-flex items-center justify-center gap-2 px-4 py-3 border rounded-lg transition-colors font-medium min-h-[44px]',
                  isSaved
                    ? 'bg-red-50 border-red-200 text-red-700'
                    : 'bg-white border-gray-200 text-gray-800 hover:bg-gray-50'
                )}
              >
                <Heart className={cn('h-4 w-4', isSaved && 'fill-current')} aria-hidden="true" />
                {isSaved ? 'Saved' : 'Save Property'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

function DetailRow({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof Home;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <dt className="text-gray-600 flex items-center gap-2">
        <Icon className="h-3.5 w-3.5" aria-hidden="true" /> {label}
      </dt>
      <dd className="font-medium text-gray-900">{children}</dd>
    </div>
  );
}
