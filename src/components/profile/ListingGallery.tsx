import { useState, useMemo } from "react";
import { Search, SlidersHorizontal, ArrowUpDown, Home, X } from "lucide-react";
import ListingCard from "./ListingCard";
import { parsePrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Listing } from "@/types";

interface ListingGalleryProps {
  listings: Listing[];
  title?: string;
  onListingClick?: (listing: Listing) => void;
  calendlyUrl?: string;
}

type SortOption = "newest" | "price-low" | "price-high" | "beds-high";
type PropertyTypeFilter = "all" | "single_family" | "condo" | "townhouse" | "multi_family" | "land" | "commercial";

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  all: "All Types",
  single_family: "Houses",
  condo: "Condos",
  townhouse: "Townhomes",
  multi_family: "Multi-Family",
  land: "Land",
  commercial: "Commercial",
};

const SORT_LABELS: Record<SortOption, string> = {
  newest: "Newest First",
  "price-low": "Price: Low to High",
  "price-high": "Price: High to Low",
  "beds-high": "Most Bedrooms",
};

export default function ListingGallery({ listings, title, onListingClick, calendlyUrl }: ListingGalleryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [propertyTypeFilter, setPropertyTypeFilter] = useState<PropertyTypeFilter>("all");
  const [bedroomFilter, setBedroomFilter] = useState<number>(0);
  const [showFilters, setShowFilters] = useState(false);
  const [showSort, setShowSort] = useState(false);

  const availableTypes = useMemo(() => {
    const types = new Set<string>();
    listings.forEach(l => {
      const pt = (l as any).property_type;
      if (pt) types.add(pt);
    });
    return types;
  }, [listings]);

  const filteredListings = useMemo(() => {
    let result = [...listings];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(l => {
        const la = l as any;
        return (la.address?.toLowerCase().includes(q) ||
                la.city?.toLowerCase().includes(q) ||
                la.description?.toLowerCase().includes(q));
      });
    }

    if (propertyTypeFilter !== "all") {
      result = result.filter(l => (l as any).property_type === propertyTypeFilter);
    }

    if (bedroomFilter > 0) {
      result = result.filter(l => {
        const beds = l.bedrooms ?? (l as any).beds ?? 0;
        return beds >= bedroomFilter;
      });
    }

    result.sort((a, b) => {
      const aa = a as any;
      const ba = b as any;
      switch (sortBy) {
        case "price-low": return parsePrice(aa.price) - parsePrice(ba.price);
        case "price-high": return parsePrice(ba.price) - parsePrice(aa.price);
        case "beds-high": return ((b.bedrooms ?? ba.beds ?? 0) - (a.bedrooms ?? aa.beds ?? 0));
        default: return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      }
    });

    return result;
  }, [listings, searchQuery, sortBy, propertyTypeFilter, bedroomFilter]);

  const hasActiveFilters = propertyTypeFilter !== "all" || bedroomFilter > 0;

  const clearFilters = () => {
    setPropertyTypeFilter("all");
    setBedroomFilter(0);
    setSearchQuery("");
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
          {title || "Properties"}
          <span className="text-sm font-normal text-gray-500 ml-2">({filteredListings.length})</span>
        </h2>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input type="text" placeholder="Search properties..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm min-h-[44px]" />
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowFilters(!showFilters)}
            className={cn("inline-flex items-center gap-2 px-3.5 py-2.5 border rounded-lg text-sm font-medium transition-all min-h-[44px]",
              showFilters || hasActiveFilters ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 hover:bg-gray-50")}>
            <SlidersHorizontal className="h-4 w-4" />
            <span className="hidden sm:inline">Filters</span>
            {hasActiveFilters && (
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center">
                {(propertyTypeFilter !== "all" ? 1 : 0) + (bedroomFilter > 0 ? 1 : 0)}
              </span>
            )}
          </button>
          <div className="relative">
            <button onClick={() => setShowSort(!showSort)}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-all min-h-[44px]">
              <ArrowUpDown className="h-4 w-4" />
              <span className="hidden sm:inline">{SORT_LABELS[sortBy]}</span>
            </button>
            {showSort && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setShowSort(false)} />
                <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-40 w-48 py-1">
                  {Object.entries(SORT_LABELS).map(([key, label]) => (
                    <button key={key} onClick={() => { setSortBy(key as SortOption); setShowSort(false); }}
                      className={cn("w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 transition-colors min-h-[44px]",
                        sortBy === key && "font-semibold text-blue-600 bg-blue-50")}>
                      {label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {showFilters && (
        <div className="bg-gray-50 rounded-xl p-4 space-y-4 border border-gray-100">
          {availableTypes.size > 0 && (
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Property Type</label>
              <div className="flex flex-wrap gap-2">
                {(["all", ...Array.from(availableTypes)] as PropertyTypeFilter[]).map(type => (
                  <button key={type} onClick={() => setPropertyTypeFilter(type)}
                    className={cn("px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                      propertyTypeFilter === type ? "bg-blue-600 text-white border-blue-600" : "bg-white border-gray-200 hover:border-blue-300")}>
                    {PROPERTY_TYPE_LABELS[type] || type}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Minimum Bedrooms</label>
            <div className="flex gap-2">
              {[0, 1, 2, 3, 4, 5].map(n => (
                <button key={n} onClick={() => setBedroomFilter(n)}
                  className={cn("w-10 h-10 rounded-lg text-sm font-medium border transition-all flex items-center justify-center",
                    bedroomFilter === n ? "bg-blue-600 text-white border-blue-600" : "bg-white border-gray-200 hover:border-blue-300")}>
                  {n === 0 ? "Any" : `${n}+`}
                </button>
              ))}
            </div>
          </div>
          {hasActiveFilters && (
            <button onClick={clearFilters} className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 font-medium">
              <X className="h-3.5 w-3.5" /> Clear all filters
            </button>
          )}
        </div>
      )}

      {filteredListings.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
          {filteredListings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} onClick={() => onListingClick?.(listing)} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Home className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No properties found</h3>
          <p className="text-sm text-gray-500 mb-4">
            {hasActiveFilters ? "Try adjusting your filters to see more properties." : "Check back soon for new listings."}
          </p>
          {hasActiveFilters && (
            <button onClick={clearFilters}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
              Clear Filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}
