/**
 * Listings Block Component
 * Displays property listings in various layouts
 */

import { useEffect, useState } from "react";
import { ListingsBlockConfig } from "@/types/pageBuilder";
import { Badge } from "@/components/ui/badge";
import { Bed, Bath, Square, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ListingsBlockProps {
    config: ListingsBlockConfig;
    isEditing?: boolean;
    userId?: string; // User ID to fetch listings for
}

interface Listing {
    id: string;
    address: string;
    city: string;
    state: string;
    price: number;
    bedrooms?: number;
    bathrooms?: number;
    square_feet?: number;
    status: string;
    photos?: string[];
}

export function ListingsBlock({
    config,
    isEditing = false,
    userId,
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
                    .from("listings")
                    .select("*")
                    .eq("user_id", userId)
                    .order("created_at", { ascending: false });

                // Apply filter
                if (config.filter === "active") {
                    query = query.eq("status", "active");
                } else if (config.filter === "featured") {
                    query = query.eq("is_featured", true);
                }

                // Limit results
                if (config.maxItems) {
                    query = query.limit(config.maxItems);
                }

                const { data, error } = await query;

                if (error) throw error;

                setListings(data || []);
            } catch (error) {
                console.error("Error fetching listings:", error);
                setListings([]);
            } finally {
                setIsLoading(false);
            }
        }

        fetchListings();
    }, [userId, config.filter, config.maxItems]);

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

    const getPhotoUrl = (listing: Listing) => {
        if (listing.photos && Array.isArray(listing.photos) && listing.photos.length > 0) {
            return listing.photos[0];
        }
        // Default placeholder image
        return "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800";
    };

    const formatAddress = (listing: Listing) => {
        return `${listing.address}, ${listing.city}, ${listing.state}`;
    };

    if (isLoading) {
        return (
            <div className="space-y-6">
                {config.title && (
                    <h2 className="text-2xl font-bold text-center">
                        {config.title}
                    </h2>
                )}
                <div className="text-center py-12 text-gray-500">
                    <p>Loading listings...</p>
                </div>
            </div>
        );
    }

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
                                src={getPhotoUrl(listing)}
                                alt={formatAddress(listing)}
                                className="w-full h-full object-cover"
                            />
                            {config.showStatus && (
                                <Badge
                                    className="absolute top-2 right-2 capitalize"
                                    variant={
                                        listing.status === "active"
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
