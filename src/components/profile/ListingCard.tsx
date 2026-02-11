import { useState, useEffect } from "react";
import { Bed, Bath, Maximize, MapPin, Heart, Eye, Share2, Star } from "lucide-react";
import { formatPrice, parsePrice, formatNumber } from "@/lib/format";
import { getImageUrl } from "@/lib/images";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Listing } from "@/types";

interface ListingCardProps {
  listing: Listing;
  onClick?: () => void;
}

const statusColors: Record<string, string> = {
  active: "bg-green-500",
  pending: "bg-yellow-500",
  under_contract: "bg-orange-500",
  sold: "bg-blue-500",
  draft: "bg-gray-500",
};

const statusLabels: Record<string, string> = {
  active: "Active",
  pending: "Pending",
  under_contract: "Under Contract",
  sold: "Sold",
  draft: "Draft",
};

const SAVED_LISTINGS_KEY = 'agentbio_saved_listings';

export default function ListingCard({ listing, onClick }: ListingCardProps) {
  const [isSaved, setIsSaved] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const listingAny = listing as any;
  const address = listingAny.address || listing.title || 'Property';
  const city = listingAny.city || '';
  const state = listingAny.state || '';
  const price = parsePrice(listingAny.price);
  const beds = listing.bedrooms ?? listingAny.beds ?? 0;
  const baths = listing.bathrooms ?? listingAny.baths ?? 0;
  const sqft = listing.square_feet ?? listingAny.sqft ?? 0;
  const isFeatured = listingAny.is_featured;
  const photoCount = listingAny.photos?.length || 1;

  const primaryImage = getImageUrl(
    listingAny.image || listingAny.photos?.[0],
    'listings'
  );

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(SAVED_LISTINGS_KEY) || '[]') as string[];
      setIsSaved(saved.includes(listing.id));
    } catch { /* ignore */ }
  }, [listing.id]);

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const saved = JSON.parse(localStorage.getItem(SAVED_LISTINGS_KEY) || '[]') as string[];
      if (isSaved) {
        const updated = saved.filter(id => id !== listing.id);
        localStorage.setItem(SAVED_LISTINGS_KEY, JSON.stringify(updated));
        setIsSaved(false);
        toast.success("Removed from saved");
      } else {
        saved.push(listing.id);
        localStorage.setItem(SAVED_LISTINGS_KEY, JSON.stringify(saved));
        setIsSaved(true);
        toast.success("Saved to favorites!");
      }
    } catch { /* ignore */ }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareText = `${address}${city ? `, ${city}` : ''} - ${formatPrice(price)}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: shareText, url: window.location.href });
        return;
      } catch { /* ignore */ }
    }
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied!");
    } catch { /* ignore */ }
  };

  return (
    <div
      onClick={onClick}
      className="group bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer"
      role="button"
      tabIndex={0}
      aria-label={`View ${address} - ${formatPrice(price)}`}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
    >
      {/* Image Container */}
      <div className="relative h-52 sm:h-56 overflow-hidden">
        {/* Skeleton while loading */}
        {!imageLoaded && (
          <div className="absolute inset-0 bg-gray-200 animate-pulse" />
        )}
        <img
          src={primaryImage}
          alt={address}
          className={cn(
            "w-full h-full object-cover transition-transform duration-700 group-hover:scale-110",
            imageLoaded ? "opacity-100" : "opacity-0"
          )}
          loading="lazy"
          onLoad={() => setImageLoaded(true)}
          onError={(e) => {
            e.currentTarget.src = '/placeholder-property.jpg';
            setImageLoaded(true);
          }}
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

        {/* Top badges */}
        <div className="absolute top-3 left-3 flex items-center gap-2">
          <span className={cn(
            "px-2.5 py-1 text-white text-xs font-semibold rounded-full shadow-sm backdrop-blur-sm",
            statusColors[listing.status] || "bg-gray-500"
          )}>
            {statusLabels[listing.status] || listing.status}
          </span>
          {isFeatured && (
            <span className="px-2.5 py-1 bg-purple-600/90 backdrop-blur-sm text-white text-xs font-semibold rounded-full flex items-center gap-1">
              <Star className="h-3 w-3 fill-current" /> Featured
            </span>
          )}
        </div>

        {/* Photo count badge */}
        {photoCount > 1 && (
          <div className="absolute top-3 right-3 px-2 py-1 bg-black/50 backdrop-blur-sm rounded-full text-white text-xs font-medium">
            {photoCount} photos
          </div>
        )}

        {/* Action buttons - visible on hover */}
        <div className="absolute bottom-3 right-3 flex gap-2 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
          <button onClick={handleSave}
            className={cn("p-2.5 rounded-full shadow-lg transition-all min-h-[40px] min-w-[40px] flex items-center justify-center",
              isSaved ? "bg-red-500 text-white" : "bg-white/90 backdrop-blur-sm text-gray-700 hover:bg-white")}
            aria-label={isSaved ? "Remove from saved" : "Save property"}>
            <Heart className={cn("h-4 w-4", isSaved && "fill-current")} />
          </button>
          <button onClick={handleShare}
            className="p-2.5 bg-white/90 backdrop-blur-sm rounded-full shadow-lg text-gray-700 hover:bg-white transition-all min-h-[40px] min-w-[40px] flex items-center justify-center"
            aria-label="Share property">
            <Share2 className="h-4 w-4" />
          </button>
        </div>

        {/* Price overlay */}
        <div className="absolute bottom-3 left-3">
          <div className="text-2xl font-bold text-white drop-shadow-lg">
            {formatPrice(price)}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Address */}
        <div className="flex items-start gap-1.5 mb-3">
          <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
          <div className="min-w-0">
            <h3 className="font-semibold text-gray-900 text-sm leading-tight truncate group-hover:text-blue-600 transition-colors">
              {address}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {city}{state && `, ${state}`}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-gray-600">
          {beds > 0 && (
            <div className="flex items-center gap-1.5">
              <Bed className="h-4 w-4 text-gray-400" />
              <span className="text-sm font-medium">{beds}</span>
              <span className="text-xs text-gray-400">bd</span>
            </div>
          )}
          {baths > 0 && (
            <div className="flex items-center gap-1.5">
              <Bath className="h-4 w-4 text-gray-400" />
              <span className="text-sm font-medium">{baths}</span>
              <span className="text-xs text-gray-400">ba</span>
            </div>
          )}
          {sqft > 0 && (
            <div className="flex items-center gap-1.5">
              <Maximize className="h-4 w-4 text-gray-400" />
              <span className="text-sm font-medium">{formatNumber(sqft)}</span>
              <span className="text-xs text-gray-400">sqft</span>
            </div>
          )}
        </div>

        {/* View Details prompt */}
        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
          <span className="text-xs text-gray-400 group-hover:text-blue-500 transition-colors flex items-center gap-1">
            <Eye className="h-3.5 w-3.5" /> View Details
          </span>
          {sqft > 0 && price > 0 && (
            <span className="text-xs text-gray-400">${Math.round(price / sqft)}/sqft</span>
          )}
        </div>
      </div>
    </div>
  );
}
