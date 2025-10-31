/**
 * Listings Block Component
 * Displays property listings in various layouts
 */

import { ListingsBlockConfig } from "@/types/pageBuilder";
import { Badge } from "@/components/ui/badge";
import { Bed, Bath, Square, MapPin } from "lucide-react";

interface ListingsBlockProps {
    config: ListingsBlockConfig;
    isEditing?: boolean;
}

// Mock listing data (replace with actual data from API)
const mockListings = [
    {
        id: "1",
        image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800",
        title: "Modern Downtown Condo",
        price: 425000,
        address: "123 Main St, Seattle, WA",
        beds: 2,
        baths: 2,
        sqft: 1200,
        status: "Active",
    },
    {
        id: "2",
        image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800",
        title: "Suburban Family Home",
        price: 675000,
        address: "456 Oak Ave, Bellevue, WA",
        beds: 4,
        baths: 3,
        sqft: 2400,
        status: "Pending",
    },
    {
        id: "3",
        image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800",
        title: "Luxury Waterfront Estate",
        price: 1250000,
        address: "789 Lake Dr, Kirkland, WA",
        beds: 5,
        baths: 4,
        sqft: 3800,
        status: "Active",
    },
];

export function ListingsBlock({
    config,
    isEditing = false,
}: ListingsBlockProps) {
    const listings = mockListings.slice(0, config.maxItems || 6);

    const getGridClass = () => {
        switch (config.layout) {
            case "list":
                return "grid grid-cols-1 gap-4";
            case "carousel":
                return "flex overflow-x-auto gap-4 snap-x";
            case "grid":
            default:
                return "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6";
        }
    };

    return (
        <div className="space-y-6">
            {/* Title */}
            {config.title && (
                <h2 className="text-2xl font-bold text-center">
                    {config.title}
                </h2>
            )}

            {/* Listings Grid */}
            <div className={getGridClass()}>
                {listings.map((listing) => (
                    <div
                        key={listing.id}
                        className="bg-white rounded-lg border overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                    >
                        {/* Image */}
                        <div className="relative aspect-video">
                            <img
                                src={listing.image}
                                alt={listing.title}
                                className="w-full h-full object-cover"
                            />
                            {config.showStatus && (
                                <Badge
                                    className="absolute top-2 right-2"
                                    variant={
                                        listing.status === "Active"
                                            ? "default"
                                            : "secondary"
                                    }
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
                                    ${listing.price.toLocaleString()}
                                </p>
                            )}

                            {/* Title */}
                            <h3 className="font-semibold text-lg">
                                {listing.title}
                            </h3>

                            {/* Address */}
                            <div className="flex items-center gap-1 text-gray-600 text-sm">
                                <MapPin className="w-4 h-4" />
                                {listing.address}
                            </div>

                            {/* Features */}
                            <div className="flex items-center gap-4 text-gray-700 text-sm pt-2">
                                <div className="flex items-center gap-1">
                                    <Bed className="w-4 h-4" />
                                    {listing.beds} bd
                                </div>
                                <div className="flex items-center gap-1">
                                    <Bath className="w-4 h-4" />
                                    {listing.baths} ba
                                </div>
                                <div className="flex items-center gap-1">
                                    <Square className="w-4 h-4" />
                                    {listing.sqft.toLocaleString()} sqft
                                </div>
                            </div>
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
                            Add some properties to see them here
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
