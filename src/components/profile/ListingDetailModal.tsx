import { X, Bed, Bath, Ruler, MapPin, Calendar, Share2, Heart, CalendarCheck } from "lucide-react";
import { useState } from "react";
import type { Listing } from "@/types/listing";
import { formatPrice, formatPropertyStats, formatAddress, formatDate, parsePrice } from "@/lib/format";
import { getImageUrls } from "@/lib/images";
import { CalendlyModal } from "@/components/integrations/CalendlyModal";

interface ListingDetailModalProps {
    listing: Listing;
    isOpen: boolean;
    onClose: () => void;
    calendlyUrl?: string;
}

export default function ListingDetailModal({
    listing,
    isOpen,
    onClose,
    calendlyUrl,
}: ListingDetailModalProps) {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isFavorited, setIsFavorited] = useState(false);
    const [isCalendlyModalOpen, setIsCalendlyModalOpen] = useState(false);

    if (!isOpen) return null;

    const images = getImageUrls(
        listing.photos?.length > 0 
            ? listing.photos 
            : listing.primary_photo 
                ? [listing.primary_photo]
                : undefined,
        'listings'
    );

    const handlePrevImage = () => {
        setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    };

    const handleNextImage = () => {
        setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    };

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: listing.title,
                    text: `Check out this property: ${listing.title}`,
                    url: window.location.href,
                });
            } catch (error) {
                console.error("Error sharing:", error);
            }
        } else {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(window.location.href);
            alert("Link copied to clipboard!");
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
                    <h2 className="text-xl font-bold text-gray-900 truncate pr-4">
                        {listing.title}
                    </h2>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsFavorited(!isFavorited)}
                            className={`p-2 rounded-lg transition-colors ${
                                isFavorited
                                    ? "bg-red-100 text-red-600"
                                    : "hover:bg-gray-100 text-gray-600"
                            }`}
                            aria-label="Add to favorites"
                        >
                            <Heart
                                className="h-5 w-5"
                                fill={isFavorited ? "currentColor" : "none"}
                            />
                        </button>
                        <button
                            onClick={handleShare}
                            className="p-2 hover:bg-gray-100 text-gray-600 rounded-lg transition-colors"
                            aria-label="Share listing"
                        >
                            <Share2 className="h-5 w-5" />
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 text-gray-600 rounded-lg transition-colors"
                            aria-label="Close modal"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto">
                    {/* Image Gallery */}
                    <div className="relative bg-gray-900 aspect-video">
                        <img
                            src={images[currentImageIndex]}
                            alt={`${listing.title || (listing as any).address || 'Property'} - Image ${currentImageIndex + 1}`}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                                e.currentTarget.src = '/placeholder-property.jpg';
                            }}
                        />

                        {images.length > 1 && (
                            <>
                                <button
                                    onClick={handlePrevImage}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-3 rounded-full shadow-lg transition-all"
                                    aria-label="Previous image"
                                >
                                    ‹
                                </button>
                                <button
                                    onClick={handleNextImage}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-3 rounded-full shadow-lg transition-all"
                                    aria-label="Next image"
                                >
                                    ›
                                </button>
                                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
                                    {currentImageIndex + 1} / {images.length}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Thumbnail Gallery */}
                    {images.length > 1 && (
                        <div className="flex gap-2 p-4 overflow-x-auto">
                            {images.map((image, index) => (
                                <button
                                    key={index}
                                    onClick={() => setCurrentImageIndex(index)}
                                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                                        index === currentImageIndex
                                            ? "border-blue-600 ring-2 ring-blue-200"
                                            : "border-gray-200 hover:border-gray-300"
                                    }`}
                                >
                                    <img
                                        src={image}
                                        alt={`Thumbnail ${index + 1}`}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            e.currentTarget.src = '/placeholder-property.jpg';
                                        }}
                                    />
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Details */}
                    <div className="p-6 space-y-6">
                        {/* Price and Status */}
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-3xl font-bold text-gray-900 mb-2">
                                    {formatPrice(parsePrice((listing as any).price))}
                                </p>
                                <div className="flex items-center gap-2 text-gray-600">
                                    <MapPin className="h-4 w-4" />
                                    <span>
                                        {(listing as any).address || ''}{(listing as any).city ? `, ${(listing as any).city}` : ''}
                                    </span>
                                </div>
                            </div>
                            <span
                                className={`px-4 py-2 rounded-full text-sm font-semibold ${
                                    listing.status === "active"
                                        ? "bg-green-100 text-green-800"
                                        : listing.status === "pending"
                                        ? "bg-yellow-100 text-yellow-800"
                                        : "bg-gray-100 text-gray-800"
                                }`}
                            >
                                {listing.status.charAt(0).toUpperCase() +
                                    listing.status.slice(1)}
                            </span>
                        </div>

                        {/* Property Stats */}
                        <div className="grid grid-cols-3 gap-4 py-6 border-y">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-blue-100 rounded-lg">
                                    <Bed className="h-6 w-6 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {listing.bedrooms}
                                    </p>
                                    <p className="text-sm text-gray-600">Bedrooms</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-purple-100 rounded-lg">
                                    <Bath className="h-6 w-6 text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {listing.bathrooms}
                                    </p>
                                    <p className="text-sm text-gray-600">Bathrooms</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-orange-100 rounded-lg">
                                    <Ruler className="h-6 w-6 text-orange-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {formatPropertyStats(listing).split(" • ")[2] || "N/A"}
                                    </p>
                                    <p className="text-sm text-gray-600">Sq Ft</p>
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-3">
                                Property Description
                            </h3>
                            <p className="text-gray-600 leading-relaxed">
                                {listing.description ||
                                    "No description available for this property."}
                            </p>
                        </div>

                        {/* Property Details */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-3">
                                Property Details
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Property Type</p>
                                    <p className="font-medium text-gray-900">
                                        {listing.property_type
                                            ?.split("_")
                                            .map(
                                                (word) =>
                                                    word.charAt(0).toUpperCase() + word.slice(1)
                                            )
                                            .join(" ") || "N/A"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Listed Date</p>
                                    <p className="font-medium text-gray-900">
                                        <Calendar className="h-4 w-4 inline mr-1" />
                                        {formatDate(listing.created_at)}
                                    </p>
                                </div>
                                {listing.square_feet && (
                                    <div>
                                        <p className="text-sm text-gray-600 mb-1">Square Feet</p>
                                        <p className="font-medium text-gray-900">
                                            {listing.square_feet.toLocaleString()} sq ft
                                        </p>
                                    </div>
                                )}
                                {listing.lot_size && (
                                    <div>
                                        <p className="text-sm text-gray-600 mb-1">Lot Size</p>
                                        <p className="font-medium text-gray-900">
                                            {listing.lot_size}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* CTA */}
                        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                Interested in this property?
                            </h3>
                            <p className="text-gray-600 mb-4">
                                Get in touch to schedule a viewing or learn more about this
                                listing.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-3">
                                {calendlyUrl && listing.status === "active" && (
                                    <button
                                        onClick={() => setIsCalendlyModalOpen(true)}
                                        className="flex-1 bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <CalendarCheck className="h-5 w-5" />
                                        Book a Showing
                                    </button>
                                )}
                                <button className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                                    Contact Agent
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Calendly Modal */}
            {calendlyUrl && (
                <CalendlyModal
                    isOpen={isCalendlyModalOpen}
                    onClose={() => setIsCalendlyModalOpen(false)}
                    calendlyUrl={calendlyUrl}
                    listingAddress={`${(listing as any).address || ''}${(listing as any).city ? `, ${(listing as any).city}` : ''}`}
                />
            )}
        </div>
    );
}

