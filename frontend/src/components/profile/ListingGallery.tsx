import { useState } from "react";
import ListingCard from "./ListingCard";
import type { Listing } from "@/types";
import { Building2 } from "lucide-react";

interface ListingGalleryProps {
    listings: Listing[];
    title?: string;
    emptyMessage?: string;
    onListingClick?: (listing: Listing) => void;
}

export default function ListingGallery({
    listings,
    title = "Active Listings",
    emptyMessage = "No listings available at this time.",
    onListingClick,
}: ListingGalleryProps) {
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

    if (listings.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow-sm p-8 md:p-12 text-center">
                <Building2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">{emptyMessage}</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">
                    {title}
                    <span className="ml-2 text-lg font-normal text-gray-500">
                        ({listings.length})
                    </span>
                </h2>

                {/* View Toggle (optional, for future enhancement) */}
                {/* <div className="flex gap-2">
                    <button className="p-2 rounded-lg bg-blue-100 text-blue-600">
                        <Grid3x3 className="h-5 w-5" />
                    </button>
                    <button className="p-2 rounded-lg bg-gray-100 text-gray-600">
                        <List className="h-5 w-5" />
                    </button>
                </div> */}
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {listings.map((listing) => (
                    <ListingCard
                        key={listing.id}
                        listing={listing}
                        onClick={() => onListingClick?.(listing)}
                    />
                ))}
            </div>
        </div>
    );
}
