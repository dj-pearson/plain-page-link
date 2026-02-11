import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, ChevronLeft, ChevronRight, Heart, Share2, Bed, Bath, Maximize, MapPin,
  Calendar, Home, ExternalLink, Video, Tag, Clock, Check, Layers,
} from "lucide-react";
import { getImageUrls } from "@/lib/images";
import { formatPrice, parsePrice, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Listing } from "@/types";

interface ListingDetailModalProps {
  listing: Listing;
  isOpen: boolean;
  onClose: () => void;
  calendlyUrl?: string;
}

const statusColors: Record<string, string> = {
  active: "bg-green-500 text-white",
  pending: "bg-yellow-500 text-white",
  under_contract: "bg-orange-500 text-white",
  sold: "bg-blue-500 text-white",
  draft: "bg-gray-500 text-white",
};

const statusLabels: Record<string, string> = {
  active: "Active",
  pending: "Pending",
  under_contract: "Under Contract",
  sold: "Sold",
  draft: "Draft",
};

const propertyTypeLabels: Record<string, string> = {
  single_family: "Single Family",
  condo: "Condo",
  townhouse: "Townhouse",
  multi_family: "Multi-Family",
  land: "Land",
  commercial: "Commercial",
};

const SAVED_LISTINGS_KEY = 'agentbio_saved_listings';

export default function ListingDetailModal({ listing, isOpen, onClose, calendlyUrl }: ListingDetailModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [showShareTooltip, setShowShareTooltip] = useState(false);

  const listingAny = listing as any;
  const photos = getImageUrls(
    listingAny.photos || (listingAny.image ? [listingAny.image] : null),
    'listings'
  );

  const address = listingAny.address || listing.title || '';
  const city = listingAny.city || '';
  const state = listingAny.state || '';
  const zipCode = listingAny.zip_code || '';
  const price = parsePrice(listingAny.price);
  const beds = listing.bedrooms ?? listingAny.beds ?? 0;
  const baths = listing.bathrooms ?? listingAny.baths ?? 0;
  const sqft = listing.square_feet ?? listingAny.sqft ?? 0;
  const description = listingAny.description || '';
  const propertyType = listingAny.property_type || '';
  const mlsNumber = listingAny.mls_number || '';
  const lotSize = listingAny.lot_size_acres;
  const virtualTourUrl = listingAny.virtual_tour_url;
  const daysOnMarket = listingAny.days_on_market;
  const highlights = listingAny.highlights;

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(SAVED_LISTINGS_KEY) || '[]') as string[];
      setIsSaved(saved.includes(listing.id));
    } catch { /* ignore */ }
  }, [listing.id]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setCurrentImageIndex(0);
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isOpen) return;
    if (e.key === 'Escape') onClose();
    if (e.key === 'ArrowLeft') setCurrentImageIndex(i => (i - 1 + photos.length) % photos.length);
    if (e.key === 'ArrowRight') setCurrentImageIndex(i => (i + 1) % photos.length);
  }, [isOpen, onClose, photos.length]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const toggleSave = () => {
    try {
      const saved = JSON.parse(localStorage.getItem(SAVED_LISTINGS_KEY) || '[]') as string[];
      if (isSaved) {
        const updated = saved.filter(id => id !== listing.id);
        localStorage.setItem(SAVED_LISTINGS_KEY, JSON.stringify(updated));
        setIsSaved(false);
        toast.success("Removed from saved listings");
      } else {
        saved.push(listing.id);
        localStorage.setItem(SAVED_LISTINGS_KEY, JSON.stringify(saved));
        setIsSaved(true);
        toast.success("Saved to your favorites!");
      }
    } catch { /* ignore */ }
  };

  const handleShare = async () => {
    const shareText = `${address}${city ? `, ${city}` : ''} - ${formatPrice(price)}`;
    const shareUrl = window.location.href;

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
      toast.success("Link copied to clipboard!");
    } catch {
      toast.error("Failed to copy link");
    }
  };

  if (!isOpen) return null;

  const highlightsList = highlights
    ? (typeof highlights === 'string' ? highlights.split(',').map((h: string) => h.trim()).filter(Boolean) : (Array.isArray(highlights) ? highlights : []))
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="relative w-full max-w-5xl max-h-[92vh] bg-white rounded-2xl overflow-hidden shadow-2xl mx-3 sm:mx-4 flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-white/95 backdrop-blur-sm sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <span className={cn("px-2.5 py-1 rounded-full text-xs font-semibold", statusColors[listing.status] || "bg-gray-500 text-white")}>
              {statusLabels[listing.status] || listing.status}
            </span>
            {mlsNumber && <span className="text-xs text-gray-500">MLS# {mlsNumber}</span>}
          </div>
          <div className="flex items-center gap-1">
            <button onClick={toggleSave}
              className={cn("p-2 rounded-full transition-all min-h-[44px] min-w-[44px] flex items-center justify-center",
                isSaved ? "bg-red-50 text-red-500" : "hover:bg-gray-100 text-gray-600")}>
              <Heart className={cn("h-5 w-5", isSaved && "fill-current")} />
            </button>
            <button onClick={handleShare} className="p-2 rounded-full hover:bg-gray-100 text-gray-600 transition-all min-h-[44px] min-w-[44px] flex items-center justify-center">
              {showShareTooltip ? <Check className="h-5 w-5 text-green-500" /> : <Share2 className="h-5 w-5" />}
            </button>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 text-gray-600 transition-all min-h-[44px] min-w-[44px] flex items-center justify-center">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Image Gallery */}
          <div className="relative bg-gray-900 aspect-[16/9] sm:aspect-[2/1] max-h-[50vh]">
            <AnimatePresence mode="wait">
              <motion.img
                key={currentImageIndex}
                src={photos[currentImageIndex]}
                alt={`${address} - Photo ${currentImageIndex + 1}`}
                className="w-full h-full object-cover"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                onError={(e) => { e.currentTarget.src = '/placeholder-property.jpg'; }}
              />
            </AnimatePresence>

            {photos.length > 1 && (
              <>
                <button onClick={() => setCurrentImageIndex(i => (i - 1 + photos.length) % photos.length)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-all min-h-[44px] min-w-[44px] flex items-center justify-center">
                  <ChevronLeft className="h-5 w-5 text-gray-800" />
                </button>
                <button onClick={() => setCurrentImageIndex(i => (i + 1) % photos.length)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-all min-h-[44px] min-w-[44px] flex items-center justify-center">
                  <ChevronRight className="h-5 w-5 text-gray-800" />
                </button>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-black/60 backdrop-blur-sm rounded-full text-white text-xs font-medium">
                  {currentImageIndex + 1} / {photos.length}
                </div>
              </>
            )}

            {photos.length > 1 && (
              <div className="absolute bottom-3 right-3 flex gap-1 max-w-[40%]">
                {photos.slice(0, 5).map((photo, idx) => (
                  <button key={idx} onClick={() => setCurrentImageIndex(idx)}
                    className={cn("w-12 h-9 rounded-md overflow-hidden border-2 transition-all flex-shrink-0",
                      idx === currentImageIndex ? "border-white shadow-lg" : "border-transparent opacity-70 hover:opacity-100")}>
                    <img src={photo} alt="" className="w-full h-full object-cover"
                      onError={(e) => { e.currentTarget.src = '/placeholder-property.jpg'; }} />
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

          {/* Content */}
          <div className="p-5 sm:p-6 lg:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
              {/* Main Details */}
              <div className="lg:col-span-2 space-y-6">
                <div>
                  <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-1">{formatPrice(price)}</h2>
                  <div className="flex items-start gap-2 text-gray-600">
                    <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span className="text-base">{address}{city && `, ${city}`}{state && `, ${state}`}{zipCode && ` ${zipCode}`}</span>
                  </div>
                </div>

                {/* Key Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {beds > 0 && (
                    <div className="bg-gray-50 rounded-xl p-4 text-center">
                      <Bed className="h-5 w-5 mx-auto mb-1 text-gray-500" />
                      <div className="text-xl font-bold text-gray-900">{beds}</div>
                      <div className="text-xs text-gray-500">Bedrooms</div>
                    </div>
                  )}
                  {baths > 0 && (
                    <div className="bg-gray-50 rounded-xl p-4 text-center">
                      <Bath className="h-5 w-5 mx-auto mb-1 text-gray-500" />
                      <div className="text-xl font-bold text-gray-900">{baths}</div>
                      <div className="text-xs text-gray-500">Bathrooms</div>
                    </div>
                  )}
                  {sqft > 0 && (
                    <div className="bg-gray-50 rounded-xl p-4 text-center">
                      <Maximize className="h-5 w-5 mx-auto mb-1 text-gray-500" />
                      <div className="text-xl font-bold text-gray-900">{formatNumber(sqft)}</div>
                      <div className="text-xs text-gray-500">Sq Ft</div>
                    </div>
                  )}
                  {sqft > 0 && price > 0 && (
                    <div className="bg-gray-50 rounded-xl p-4 text-center">
                      <Tag className="h-5 w-5 mx-auto mb-1 text-gray-500" />
                      <div className="text-xl font-bold text-gray-900">${Math.round(price / sqft)}</div>
                      <div className="text-xs text-gray-500">Per Sq Ft</div>
                    </div>
                  )}
                </div>

                {description && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">About This Property</h3>
                    <p className="text-gray-600 leading-relaxed whitespace-pre-line">{description}</p>
                  </div>
                )}

                {highlightsList.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Property Highlights</h3>
                    <div className="flex flex-wrap gap-2">
                      {highlightsList.map((highlight: string, idx: number) => (
                        <span key={idx} className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">{highlight}</span>
                      ))}
                    </div>
                  </div>
                )}

                {virtualTourUrl && (
                  <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-5 border border-purple-100">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-purple-100 rounded-lg">
                          <Video className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">Virtual Tour Available</h4>
                          <p className="text-sm text-gray-500">Experience this property in 3D</p>
                        </div>
                      </div>
                      <a href={virtualTourUrl} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium text-sm min-h-[44px]">
                        Take Tour <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-xl p-5">
                  <h3 className="font-semibold text-gray-900 mb-3">Property Details</h3>
                  <div className="space-y-3">
                    {propertyType && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500 flex items-center gap-2"><Home className="h-3.5 w-3.5" /> Type</span>
                        <span className="font-medium text-gray-900">{propertyTypeLabels[propertyType] || propertyType}</span>
                      </div>
                    )}
                    {beds > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500 flex items-center gap-2"><Bed className="h-3.5 w-3.5" /> Bedrooms</span>
                        <span className="font-medium text-gray-900">{beds}</span>
                      </div>
                    )}
                    {baths > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500 flex items-center gap-2"><Bath className="h-3.5 w-3.5" /> Bathrooms</span>
                        <span className="font-medium text-gray-900">{baths}</span>
                      </div>
                    )}
                    {sqft > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500 flex items-center gap-2"><Maximize className="h-3.5 w-3.5" /> Square Feet</span>
                        <span className="font-medium text-gray-900">{formatNumber(sqft)}</span>
                      </div>
                    )}
                    {lotSize && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500 flex items-center gap-2"><Layers className="h-3.5 w-3.5" /> Lot Size</span>
                        <span className="font-medium text-gray-900">{lotSize} acres</span>
                      </div>
                    )}
                    {daysOnMarket != null && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500 flex items-center gap-2"><Clock className="h-3.5 w-3.5" /> Days on Market</span>
                        <span className="font-medium text-gray-900">{daysOnMarket}</span>
                      </div>
                    )}
                    {mlsNumber && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500 flex items-center gap-2"><Tag className="h-3.5 w-3.5" /> MLS#</span>
                        <span className="font-medium text-gray-900">{mlsNumber}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* CTAs */}
                <div className="space-y-2">
                  {calendlyUrl ? (
                    <a href={calendlyUrl} target="_blank" rel="noopener noreferrer"
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-md min-h-[44px]">
                      <Calendar className="h-4 w-4" /> Schedule a Showing
                    </a>
                  ) : (
                    <button className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-md min-h-[44px]">
                      <Calendar className="h-4 w-4" /> Request a Showing
                    </button>
                  )}
                  <button onClick={handleShare}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium min-h-[44px]">
                    <Share2 className="h-4 w-4" /> Share Property
                  </button>
                  <button onClick={toggleSave}
                    className={cn("w-full inline-flex items-center justify-center gap-2 px-4 py-3 border rounded-lg transition-colors font-medium min-h-[44px]",
                      isSaved ? "bg-red-50 border-red-200 text-red-600" : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50")}>
                    <Heart className={cn("h-4 w-4", isSaved && "fill-current")} />
                    {isSaved ? "Saved" : "Save Property"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
