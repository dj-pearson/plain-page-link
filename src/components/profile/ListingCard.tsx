import { Bed, Bath, Maximize, MapPin, Calendar } from "lucide-react";
import { formatPrice, formatPropertyStats, parsePrice } from "@/lib/format";
import { getImageUrl } from "@/lib/images";
import type { Listing } from "@/types";

interface ListingCardProps {
    listing: Listing;
    onClick?: () => void;
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

export default function ListingCard({ listing, onClick }: ListingCardProps) {
    const primaryPhoto = getImageUrl(
        (listing as any).image || listing.photos?.[0],
        'listings'
    );

    return (
        <div
            onClick={onClick}
            className="bg-white rounded-lg shadow-sm overflow-hidden cursor-pointer hover:shadow-lg transition-all group"
        >
            {/* Image */}
            <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                <img
                    src={primaryPhoto}
                    alt={listing.title || listing.address_full}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                />

                {/* Status Badge */}
                <div className="absolute top-3 left-3">
                    <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            statusColors[listing.status]
                        }`}
                    >
                        {statusLabels[listing.status]}
                    </span>
                </div>

                {/* Featured Badge */}
                {listing.is_featured && (
                    <div className="absolute top-3 right-3">
                        <span className="px-3 py-1 bg-purple-600 text-white rounded-full text-xs font-semibold">
                            Featured
                        </span>
                    </div>
                )}

                {/* Days on Market */}
                {listing.days_on_market !== null &&
                    listing.status === "active" && (
                        <div className="absolute bottom-3 right-3">
                            <span className="px-2 py-1 bg-black/70 text-white rounded text-xs font-medium flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {listing.days_on_market} days
                            </span>
                        </div>
                    )}
            </div>

            {/* Content */}
            <div className="p-4">
                {/* Price */}
                <div className="mb-2">
                    <p className="text-2xl font-bold text-gray-900">
                        {formatPrice(parsePrice((listing as any).price))}
                    </p>
                    {((listing as any).original_price &&
                        parsePrice((listing as any).original_price) !== parsePrice((listing as any).price)) && (
                        <p className="text-sm text-gray-500 line-through">
                            {formatPrice(parsePrice((listing as any).original_price))}
                        </p>
                    )}
                </div>

                {/* Property Stats */}
                {(listing.bedrooms ||
                    listing.bathrooms ||
                    listing.square_feet) && (
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                        {listing.bedrooms && (
                            <div className="flex items-center gap-1">
                                <Bed className="h-4 w-4" />
                                <span>{listing.bedrooms} bd</span>
                            </div>
                        )}
                        {listing.bathrooms && (
                            <div className="flex items-center gap-1">
                                <Bath className="h-4 w-4" />
                                <span>{listing.bathrooms} ba</span>
                            </div>
                        )}
                        {listing.square_feet && (
                            <div className="flex items-center gap-1">
                                <Maximize className="h-4 w-4" />
                                <span>
                                    {listing.square_feet.toLocaleString()} sqft
                                </span>
                            </div>
                        )}
                    </div>
                )}

                {/* Address */}
                <div className="flex items-start gap-2 text-sm text-gray-700">
                    <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <p className="line-clamp-2">
                        {listing.address_street}, {listing.address_city},{" "}
                        {listing.address_state} {listing.address_zip}
                    </p>
                </div>

                {/* Description (optional, truncated) */}
                {listing.description && (
                    <p className="mt-3 text-sm text-gray-600 line-clamp-2">
                        {listing.description}
                    </p>
                )}

                {/* Open House */}
                {listing.open_house_date && listing.status === "active" && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-xs text-blue-600 font-medium">
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
            </div>
        </div>
    );
}
