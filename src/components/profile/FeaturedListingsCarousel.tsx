import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Eye, Heart, Bed, Bath, Maximize, MapPin, Share2, Check, Copy } from "lucide-react";
import { formatPrice, parsePrice } from "@/lib/format";
import { getImageUrl } from "@/lib/images";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Listing } from "@/types";

interface FeaturedListingsCarouselProps {
    listings: Listing[];
    onViewDetails?: (listing: Listing) => void;
    autoRotate?: boolean;
    interval?: number;
}

const statusColors = {
    active: "bg-green-500 text-white",
    pending: "bg-yellow-500 text-white",
    under_contract: "bg-orange-500 text-white",
    sold: "bg-blue-500 text-white",
    draft: "bg-gray-500 text-white",
};

const statusLabels = {
    active: "Active",
    pending: "Pending",
    under_contract: "Under Contract",
    sold: "Sold",
    draft: "Draft",
};

// Storage key for saved listings
const SAVED_LISTINGS_KEY = 'agentbio_saved_listings';

// Helper to get saved listings from localStorage
const getSavedListings = (): string[] => {
    try {
        const saved = localStorage.getItem(SAVED_LISTINGS_KEY);
        return saved ? JSON.parse(saved) : [];
    } catch {
        return [];
    }
};

// Helper to save listings to localStorage
const saveListing = (listingId: string): void => {
    const saved = getSavedListings();
    if (!saved.includes(listingId)) {
        saved.push(listingId);
        localStorage.setItem(SAVED_LISTINGS_KEY, JSON.stringify(saved));
    }
};

// Helper to remove listing from saved
const unsaveListing = (listingId: string): void => {
    const saved = getSavedListings().filter(id => id !== listingId);
    localStorage.setItem(SAVED_LISTINGS_KEY, JSON.stringify(saved));
};

export function FeaturedListingsCarousel({
    listings,
    onViewDetails,
    autoRotate = true,
    interval = 4000,
}: FeaturedListingsCarouselProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [savedListings, setSavedListings] = useState<string[]>([]);

    // Load saved listings on mount
    useEffect(() => {
        setSavedListings(getSavedListings());
    }, []);

    // Filter for featured listings
    const featuredListings = listings.filter((l) => l.is_featured);

    // If no featured listings, don't render
    if (featuredListings.length === 0) {
        return null;
    }

    const currentListing = featuredListings[currentIndex];
    const isCurrentSaved = savedListings.includes(currentListing.id);

    // Handle save/unsave listing
    const handleSaveClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isCurrentSaved) {
            unsaveListing(currentListing.id);
            setSavedListings(prev => prev.filter(id => id !== currentListing.id));
            toast.success("Removed from saved listings");
        } else {
            saveListing(currentListing.id);
            setSavedListings(prev => [...prev, currentListing.id]);
            toast.success("Saved to your favorites");
        }
    };

    // Handle share listing
    const handleShareClick = async () => {
        const address = (currentListing as any).address || currentListing.title || 'Property';
        const city = (currentListing as any).city || '';
        const price = formatPrice(parsePrice((currentListing as any).price));

        const shareTitle = `Check out this property: ${address}`;
        const shareText = `${address}${city ? `, ${city}` : ''} - ${price}`;
        const shareUrl = window.location.href;

        // Try native share API first (mobile)
        if (navigator.share) {
            try {
                await navigator.share({
                    title: shareTitle,
                    text: shareText,
                    url: shareUrl,
                });
                toast.success("Shared successfully!");
            } catch (err) {
                // User cancelled or share failed - fallback to copy
                if ((err as Error).name !== 'AbortError') {
                    await copyToClipboard(shareUrl);
                }
            }
        } else {
            // Fallback to copy to clipboard
            await copyToClipboard(shareUrl);
        }
    };

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            toast.success("Link copied to clipboard!");
        } catch {
            toast.error("Failed to copy link");
        }
    };

    // Auto-advance carousel
    useEffect(() => {
        if (!autoRotate || isPaused || featuredListings.length <= 1) return;

        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % featuredListings.length);
        }, interval);

        return () => clearInterval(timer);
    }, [autoRotate, isPaused, featuredListings.length, interval]);

    const goToNext = () => {
        setCurrentIndex((prev) => (prev + 1) % featuredListings.length);
    };

    const goToPrev = () => {
        setCurrentIndex((prev) => (prev - 1 + featuredListings.length) % featuredListings.length);
    };

    const goToSlide = (index: number) => {
        setCurrentIndex(index);
    };

    const primaryPhoto = getImageUrl(
        (currentListing as any).image || currentListing.photos?.[0],
        'listings'
    );

    return (
        <div
            className="relative w-full h-[400px] md:h-[500px] lg:h-[600px] overflow-hidden rounded-xl shadow-2xl bg-gray-900"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
        >
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentIndex}
                    initial={{ opacity: 0, x: 100 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                    className="absolute inset-0"
                >
                    {/* Background Image */}
                    <img
                        src={primaryPhoto}
                        alt={currentListing.title || (currentListing as any).address || 'Featured Property'}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                            e.currentTarget.src = '/placeholder-property.jpg';
                        }}
                    />

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />

                    {/* Property Info Overlay */}
                    <div className="absolute inset-0 flex flex-col justify-between p-6 md:p-8 lg:p-10">
                        {/* Top Row - Status Badge */}
                        <div className="flex items-start justify-between">
                            <div className="flex gap-2">
                                <span
                                    className={cn(
                                        "px-3 py-1.5 rounded-full text-xs md:text-sm font-semibold shadow-lg backdrop-blur-sm",
                                        statusColors[currentListing.status]
                                    )}
                                >
                                    {statusLabels[currentListing.status]}
                                </span>
                                <span className="px-3 py-1.5 bg-purple-600 text-white rounded-full text-xs md:text-sm font-semibold shadow-lg">
                                    Featured
                                </span>
                            </div>

                            {/* Save Button */}
                            <button
                                onClick={handleSaveClick}
                                className={cn(
                                    "p-2 md:p-3 backdrop-blur-md rounded-full transition-all group",
                                    isCurrentSaved
                                        ? "bg-red-500 hover:bg-red-600"
                                        : "bg-white/20 hover:bg-white/30"
                                )}
                                aria-label={isCurrentSaved ? "Remove from saved" : "Save property"}
                            >
                                <Heart
                                    className={cn(
                                        "h-5 w-5 md:h-6 md:w-6 transition-all",
                                        isCurrentSaved
                                            ? "text-white fill-white"
                                            : "text-white group-hover:fill-white"
                                    )}
                                />
                            </button>
                        </div>

                        {/* Bottom Row - Property Details */}
                        <div className="space-y-4">
                            {/* Price */}
                            <div>
                                <motion.h2
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.2 }}
                                    className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2"
                                >
                                    {formatPrice(parsePrice((currentListing as any).price))}
                                </motion.h2>
                                {((currentListing as any).original_price &&
                                    parsePrice((currentListing as any).original_price) !== parsePrice((currentListing as any).price)) && (
                                    <p className="text-lg md:text-xl text-white/70 line-through">
                                        {formatPrice(parsePrice((currentListing as any).original_price))}
                                    </p>
                                )}
                            </div>

                            {/* Address */}
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                className="flex items-start gap-2"
                            >
                                <MapPin className="h-5 w-5 md:h-6 md:w-6 text-white flex-shrink-0 mt-1" />
                                <p className="text-base md:text-lg lg:text-xl text-white font-medium">
                                    {(currentListing as any).address || ''}
                                    {(currentListing as any).city && `, ${(currentListing as any).city}`}
                                    {(currentListing as any).state && `, ${(currentListing as any).state}`}
                                </p>
                            </motion.div>

                            {/* Property Stats */}
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.4 }}
                                className="flex flex-wrap gap-4 md:gap-6 text-white"
                            >
                                {currentListing.bedrooms && (
                                    <div className="flex items-center gap-2">
                                        <Bed className="h-5 w-5 md:h-6 md:w-6" />
                                        <span className="text-base md:text-lg font-medium">
                                            {currentListing.bedrooms} Beds
                                        </span>
                                    </div>
                                )}
                                {currentListing.bathrooms && (
                                    <div className="flex items-center gap-2">
                                        <Bath className="h-5 w-5 md:h-6 md:w-6" />
                                        <span className="text-base md:text-lg font-medium">
                                            {currentListing.bathrooms} Baths
                                        </span>
                                    </div>
                                )}
                                {currentListing.square_feet && (
                                    <div className="flex items-center gap-2">
                                        <Maximize className="h-5 w-5 md:h-6 md:w-6" />
                                        <span className="text-base md:text-lg font-medium">
                                            {currentListing.square_feet.toLocaleString()} sqft
                                        </span>
                                    </div>
                                )}
                            </motion.div>

                            {/* Action Buttons */}
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.5 }}
                                className="flex flex-wrap gap-3"
                            >
                                <button
                                    onClick={() => onViewDetails?.(currentListing)}
                                    className="bg-white text-gray-900 px-6 py-3 md:px-8 md:py-4 rounded-lg font-semibold text-sm md:text-base hover:bg-gray-100 transition-all flex items-center gap-2 shadow-lg"
                                >
                                    <Eye className="h-4 w-4 md:h-5 md:w-5" />
                                    View Details
                                </button>
                                <button
                                    onClick={handleShareClick}
                                    className="bg-white/10 backdrop-blur-md text-white px-6 py-3 md:px-8 md:py-4 rounded-lg font-semibold text-sm md:text-base hover:bg-white/20 transition-all border border-white/20 flex items-center gap-2"
                                >
                                    <Share2 className="h-4 w-4 md:h-5 md:w-5" />
                                    Share
                                </button>
                            </motion.div>
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Navigation Arrows */}
            {featuredListings.length > 1 && (
                <>
                    <button
                        onClick={goToPrev}
                        className="absolute left-4 top-1/2 -translate-y-1/2 p-2 md:p-3 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full transition-all z-10 group"
                        aria-label="Previous property"
                    >
                        <ChevronLeft className="h-6 w-6 md:h-8 md:w-8 text-white" />
                    </button>
                    <button
                        onClick={goToNext}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 md:p-3 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full transition-all z-10 group"
                        aria-label="Next property"
                    >
                        <ChevronRight className="h-6 w-6 md:h-8 md:w-8 text-white" />
                    </button>
                </>
            )}

            {/* Carousel Indicators */}
            {featuredListings.length > 1 && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                    {featuredListings.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => goToSlide(idx)}
                            className={cn(
                                'h-2 rounded-full transition-all',
                                idx === currentIndex
                                    ? 'w-8 bg-white'
                                    : 'w-2 bg-white/50 hover:bg-white/75'
                            )}
                            aria-label={`Go to property ${idx + 1}`}
                        />
                    ))}
                </div>
            )}

            {/* Property Counter */}
            {featuredListings.length > 1 && (
                <div className="absolute top-6 right-6 px-3 py-1.5 bg-black/50 backdrop-blur-md rounded-full text-white text-sm font-medium">
                    {currentIndex + 1} / {featuredListings.length}
                </div>
            )}
        </div>
    );
}
