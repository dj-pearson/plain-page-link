import { useState, useMemo } from "react";
import ListingCard from "./ListingCard";
import type { Listing } from "@/types";
import { Building2, Search, SlidersHorizontal, X } from "lucide-react";
import { CalendlyModal } from "@/components/integrations/CalendlyModal";
import { cn } from "@/lib/utils";
import { parsePrice } from "@/lib/format";

interface ListingGalleryProps {
    listings: Listing[];
    title?: string;
    emptyMessage?: string;
    onListingClick?: (listing: Listing) => void;
    calendlyUrl?: string;
}

type PriceRange = "all" | "under-300k" | "300k-500k" | "500k-750k" | "750k-1m" | "over-1m";
type BedroomFilter = "all" | "1+" | "2+" | "3+" | "4+";
type SortOption = "newest" | "price-low" | "price-high" | "beds-high";

export default function ListingGallery({
    listings,
    title = "Active Listings",
    emptyMessage = "No listings available at this time.",
    onListingClick,
    calendlyUrl,
}: ListingGalleryProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [priceRange, setPriceRange] = useState<PriceRange>("all");
    const [bedroomFilter, setBedroomFilter] = useState<BedroomFilter>("all");
    const [sortBy, setSortBy] = useState<SortOption>("newest");
    const [showFilters, setShowFilters] = useState(false);
    const [isCalendlyModalOpen, setIsCalendlyModalOpen] = useState(false);
    const [selectedListingForShowing, setSelectedListingForShowing] = useState<Listing | null>(null);

    const handleBookShowing = (e: React.MouseEvent, listing: Listing) => {
        e.stopPropagation();
        setSelectedListingForShowing(listing);
        setIsCalendlyModalOpen(true);
    };

    // Filter and sort listings
    const filteredListings = useMemo(() => {
        let filtered = [...listings];

        // Search filter
        if (searchQuery) {
            filtered = filtered.filter((listing) => {
                const searchLower = searchQuery.toLowerCase();
                const address = ((listing as any).address || "").toLowerCase();
                const city = ((listing as any).city || "").toLowerCase();
                const state = ((listing as any).state || "").toLowerCase();
                return (
                    address.includes(searchLower) ||
                    city.includes(searchLower) ||
                    state.includes(searchLower)
                );
            });
        }

        // Price range filter
        if (priceRange !== "all") {
            filtered = filtered.filter((listing) => {
                const price = parsePrice((listing as any).price);
                switch (priceRange) {
                    case "under-300k":
                        return price < 300000;
                    case "300k-500k":
                        return price >= 300000 && price < 500000;
                    case "500k-750k":
                        return price >= 500000 && price < 750000;
                    case "750k-1m":
                        return price >= 750000 && price < 1000000;
                    case "over-1m":
                        return price >= 1000000;
                    default:
                        return true;
                }
            });
        }

        // Bedroom filter
        if (bedroomFilter !== "all") {
            const minBeds = parseInt(bedroomFilter);
            filtered = filtered.filter(
                (listing) => (listing.bedrooms || 0) >= minBeds
            );
        }

        // Sort
        filtered.sort((a, b) => {
            switch (sortBy) {
                case "price-low":
                    return parsePrice((a as any).price) - parsePrice((b as any).price);
                case "price-high":
                    return parsePrice((b as any).price) - parsePrice((a as any).price);
                case "beds-high":
                    return (b.bedrooms || 0) - (a.bedrooms || 0);
                case "newest":
                default:
                    return (
                        new Date((b as any).listed_date || b.created_at || 0).getTime() -
                        new Date((a as any).listed_date || a.created_at || 0).getTime()
                    );
            }
        });

        return filtered;
    }, [listings, searchQuery, priceRange, bedroomFilter, sortBy]);

    const hasActiveFilters =
        searchQuery || priceRange !== "all" || bedroomFilter !== "all" || sortBy !== "newest";

    const clearFilters = () => {
        setSearchQuery("");
        setPriceRange("all");
        setBedroomFilter("all");
        setSortBy("newest");
    };

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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h2 className="text-2xl font-bold text-gray-900">
                    {title}
                    <span className="ml-2 text-lg font-normal text-gray-500">
                        ({filteredListings.length})
                    </span>
                </h2>

                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all",
                        showFilters
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    )}
                >
                    <SlidersHorizontal className="h-4 w-4" />
                    <span>Filters</span>
                    {hasActiveFilters && (
                        <span className="bg-white text-blue-600 px-2 py-0.5 rounded-full text-xs font-bold">
                            {[searchQuery, priceRange !== "all", bedroomFilter !== "all", sortBy !== "newest"]
                                .filter(Boolean).length}
                        </span>
                    )}
                </button>
            </div>

            {/* Filters Panel */}
            {showFilters && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6 space-y-4">
                    {/* Search */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Search by location
                        </label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Enter address, city, or zip..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    {/* Price Range */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Price Range
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {[
                                { value: "all", label: "All Prices" },
                                { value: "under-300k", label: "Under $300K" },
                                { value: "300k-500k", label: "$300K - $500K" },
                                { value: "500k-750k", label: "$500K - $750K" },
                                { value: "750k-1m", label: "$750K - $1M" },
                                { value: "over-1m", label: "Over $1M" },
                            ].map((option) => (
                                <button
                                    key={option.value}
                                    onClick={() => setPriceRange(option.value as PriceRange)}
                                    className={cn(
                                        "px-4 py-2 rounded-lg font-medium text-sm transition-all border",
                                        priceRange === option.value
                                            ? "bg-blue-600 text-white border-blue-600"
                                            : "bg-white text-gray-700 border-gray-300 hover:border-blue-400"
                                    )}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Bedrooms */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Bedrooms
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {[
                                { value: "all", label: "Any" },
                                { value: "1+", label: "1+" },
                                { value: "2+", label: "2+" },
                                { value: "3+", label: "3+" },
                                { value: "4+", label: "4+" },
                            ].map((option) => (
                                <button
                                    key={option.value}
                                    onClick={() => setBedroomFilter(option.value as BedroomFilter)}
                                    className={cn(
                                        "px-4 py-2 rounded-lg font-medium text-sm transition-all border",
                                        bedroomFilter === option.value
                                            ? "bg-blue-600 text-white border-blue-600"
                                            : "bg-white text-gray-700 border-gray-300 hover:border-blue-400"
                                    )}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Sort */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Sort By
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {[
                                { value: "newest", label: "Newest First" },
                                { value: "price-low", label: "Price: Low to High" },
                                { value: "price-high", label: "Price: High to Low" },
                                { value: "beds-high", label: "Most Bedrooms" },
                            ].map((option) => (
                                <button
                                    key={option.value}
                                    onClick={() => setSortBy(option.value as SortOption)}
                                    className={cn(
                                        "px-4 py-2 rounded-lg font-medium text-sm transition-all border",
                                        sortBy === option.value
                                            ? "bg-blue-600 text-white border-blue-600"
                                            : "bg-white text-gray-700 border-gray-300 hover:border-blue-400"
                                    )}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Clear Filters */}
                    {hasActiveFilters && (
                        <div className="pt-4 border-t border-gray-200">
                            <button
                                onClick={clearFilters}
                                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-all"
                            >
                                <X className="h-4 w-4" />
                                Clear All Filters
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Results */}
            {filteredListings.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm p-8 md:p-12 text-center">
                    <Building2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">
                        No properties match your filters.
                    </p>
                    <button
                        onClick={clearFilters}
                        className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                        Clear filters to see all properties
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredListings.map((listing) => (
                        <ListingCard
                            key={listing.id}
                            listing={listing}
                            onClick={() => onListingClick?.(listing)}
                            onBookShowing={(e) => handleBookShowing(e, listing)}
                            hasCalendly={!!calendlyUrl}
                        />
                    ))}
                </div>
            )}

            {/* Calendly Modal */}
            {calendlyUrl && selectedListingForShowing && (
                <CalendlyModal
                    isOpen={isCalendlyModalOpen}
                    onClose={() => {
                        setIsCalendlyModalOpen(false);
                        setSelectedListingForShowing(null);
                    }}
                    calendlyUrl={calendlyUrl}
                    listingAddress={`${(selectedListingForShowing as any).address || ''}${(selectedListingForShowing as any).city ? `, ${(selectedListingForShowing as any).city}` : ''}`}
                />
            )}
        </div>
    );
}
