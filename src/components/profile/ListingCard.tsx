import { useState, useEffect } from "react";
import { Bed, Bath, Maximize, MapPin, Calendar, CalendarCheck, Heart, Eye, Share2 } from "lucide-react";
import { formatPrice, formatPropertyStats, parsePrice } from "@/lib/format";
import { getImageUrl } from "@/lib/images";
import type { Listing } from "@/types";
import { cn } from "@/lib/utils";

interface ListingCardProps {
    listing: Listing;
    onClick?: () => void;
    onBookShowing?: (e: React.MouseEvent) => void;
    hasCalendly?: boolean;
}

const statusColors = {
    active: "bg-green-100 text-green-800",
    pending: "bg-yellow-100 text-yellow-800",
    under_contract: "bg-orange-100 text-orange-800",
    sold: "bg-blue-100 text-blue-800",
    draft: "bg-gray-100 text-gray-800",
};

const statusLabels = {
    active: "Active",
    pending: "Pending",
    under_contract: "Under Contract",
    sold: "Sold",
    draft: "Draft",
};

export default function ListingCard({ listing, onClick, onBookShowing, hasCalendly }: ListingCardProps) {
    const [isSaved, setIsSaved] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    // Load saved state from localStorage
    useEffect(() => {
        const savedListings = JSON.parse(localStorage.getItem('savedListings') || '[]');
        setIsSaved(savedListings.includes(listing.id));
    }, [listing.id]);

    const handleSave = (e: React.MouseEvent) => {
        e.stopPropagation();
        const savedListings = JSON.parse(localStorage.getItem('savedListings') || '[]');

        if (isSaved) {
            // Remove from saved
            const updated = savedListings.filter((id: string) => id !== listing.id);
            localStorage.setItem('savedListings', JSON.stringify(updated));
            setIsSaved(false);
        } else {
            // Add to saved
            savedListings.push(listing.id);
            localStorage.setItem('savedListings', JSON.stringify(savedListings));
            setIsSaved(true);
        }
    };

    const handleShare = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (navigator.share) {
            navigator.share({
                title: `${(listing as any).address || 'Property'} - ${formatPrice(parsePrice((listing as any).price))}`,
                text: `Check out this property: ${listing.bedrooms} bed, ${listing.bathrooms} bath`,
                url: window.location.href,
            }).catch((err) => console.log('Error sharing:', err));
        } else {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(window.location.href);
            alert('Link copied to clipboard!');
        }
    };

    const primaryPhoto = getImageUrl(
        (listing as any).image || listing.photos?.[0],
        'listings'
    );

    return (
        <div
            onClick={onClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={cn(
                "bg-white rounded-xl overflow-hidden cursor-pointer transition-all duration-300 group",
                "hover:shadow-2xl hover:-translate-y-1",
                isHovered ? "shadow-2xl -translate-y-1" : "shadow-md"
            )}
        >
            {/* Image */}
            <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                <img
                    src={primaryPhoto}
                    alt={listing.title || (listing as any).address || 'Property'}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    loading="lazy"
                    onError={(e) => {
                        e.currentTarget.src = '/placeholder-property.jpg';
                    }}
                />

                {/* Gradient Overlay on Hover */}
                <div className={cn(
                    "absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent transition-opacity duration-300",
                    isHovered ? "opacity-100" : "opacity-0"
                )} />

                {/* Status Badge */}
                <div className="absolute top-3 left-3">
                    <span
                        className={cn(
                            "px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg",
                            statusColors[listing.status]
                        )}
                    >
                        {statusLabels[listing.status]}
                    </span>
                </div>

                {/* Featured Badge */}
                {listing.is_featured && (
                    <div className="absolute top-3 right-3">
                        <span className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full text-xs font-semibold shadow-lg">
                            Featured
                        </span>
                    </div>
                )}

                {/* Quick Actions - Show on Hover */}
                <div className={cn(
                    "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex gap-3 transition-all duration-300",
                    isHovered ? "opacity-100 scale-100" : "opacity-0 scale-90 pointer-events-none"
                )}>
                    <button
                        onClick={onClick}
                        className="p-3 bg-white rounded-full shadow-xl hover:bg-blue-50 transition-all hover:scale-110"
                        aria-label="View details"
                    >
                        <Eye className="h-5 w-5 text-blue-600" />
                    </button>
                    <button
                        onClick={handleSave}
                        className="p-3 bg-white rounded-full shadow-xl hover:bg-red-50 transition-all hover:scale-110"
                        aria-label={isSaved ? "Unsave property" : "Save property"}
                    >
                        <Heart className={cn(
                            "h-5 w-5",
                            isSaved ? "fill-red-500 text-red-500" : "text-gray-600"
                        )} />
                    </button>
                    <button
                        onClick={handleShare}
                        className="p-3 bg-white rounded-full shadow-xl hover:bg-green-50 transition-all hover:scale-110"
                        aria-label="Share property"
                    >
                        <Share2 className="h-5 w-5 text-green-600" />
                    </button>
                </div>

                {/* Days on Market */}
                {listing.days_on_market !== null &&
                    listing.status === "active" && (
                        <div className="absolute bottom-3 right-3">
                            <span className="px-3 py-1.5 bg-black/70 backdrop-blur-sm text-white rounded-lg text-xs font-medium flex items-center gap-1.5 shadow-lg">
                                <Calendar className="h-3.5 w-3.5" />
                                {listing.days_on_market} days
                            </span>
                        </div>
                    )}

                {/* Saved Indicator (top-left corner) */}
                {isSaved && !isHovered && (
                    <div className="absolute top-3 left-3">
                        <Heart className="h-6 w-6 fill-red-500 text-red-500 drop-shadow-lg" />
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-5">
                {/* Price */}
                <div className="mb-3">
                    <p className="text-2xl md:text-3xl font-bold text-gray-900">
                        {formatPrice(parsePrice((listing as any).price))}
                    </p>
                    {((listing as any).original_price &&
                        parsePrice((listing as any).original_price) !== parsePrice((listing as any).price)) && (
                        <p className="text-sm text-gray-500 line-through mt-1">
                            {formatPrice(parsePrice((listing as any).original_price))}
                        </p>
                    )}
                </div>

                {/* Property Stats */}
                {(listing.bedrooms ||
                    listing.bathrooms ||
                    listing.square_feet) && (
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-3 pb-3 border-b border-gray-200">
                        {listing.bedrooms && (
                            <div className="flex items-center gap-1.5 font-medium">
                                <Bed className="h-4 w-4 text-blue-600" />
                                <span>{listing.bedrooms} bd</span>
                            </div>
                        )}
                        {listing.bathrooms && (
                            <div className="flex items-center gap-1.5 font-medium">
                                <Bath className="h-4 w-4 text-blue-600" />
                                <span>{listing.bathrooms} ba</span>
                            </div>
                        )}
                        {listing.square_feet && (
                            <div className="flex items-center gap-1.5 font-medium">
                                <Maximize className="h-4 w-4 text-blue-600" />
                                <span>
                                    {listing.square_feet.toLocaleString()} sqft
                                </span>
                            </div>
                        )}
                    </div>
                )}

                {/* Address */}
                <div className="flex items-start gap-2 text-sm text-gray-700 mb-2">
                    <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-gray-500" />
                    <p className="line-clamp-2 font-medium">
                        {(listing as any).address || ''}{(listing as any).city ? `, ${(listing as any).city}` : ''}
                    </p>
                </div>

                {/* Description (optional, truncated) */}
                {listing.description && (
                    <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                        {listing.description}
                    </p>
                )}

                {/* Open House */}
                {listing.open_house_date && listing.status === "active" && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-xs text-blue-600 font-semibold flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5" />
                            Open House:{" "}
                            {new Date(
                                listing.open_house_date
                            ).toLocaleDateString("en-US", {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                                hour: "numeric",
                                minute: "2-digit",
                            })}
                        </p>
                    </div>
                )}

                {/* Book Showing Button */}
                {hasCalendly && listing.status === "active" && onBookShowing && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                        <button
                            onClick={onBookShowing}
                            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all flex items-center justify-center gap-2 text-sm shadow-md hover:shadow-lg"
                        >
                            <CalendarCheck className="h-4 w-4" />
                            Book a Showing
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
