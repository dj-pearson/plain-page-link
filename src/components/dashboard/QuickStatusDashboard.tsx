/**
 * Quick Status Updates Dashboard
 * Allows one-click status changes for listings with keyboard shortcuts
 */

import { useState, useEffect } from "react";
import {
    Home,
    Clock,
    CheckCircle,
    XCircle,
    Edit2,
    RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

interface Listing {
    id: string;
    title: string;
    price: number;
    status: "active" | "pending" | "sold" | "draft";
    image?: string;
    updatedAt: string;
    views?: number;
    leads?: number;
}

interface QuickStatusDashboardProps {
    listings: Listing[];
    onStatusChange: (listingId: string, newStatus: string) => Promise<void>;
    onRefresh?: () => void;
    isLoading?: boolean;
}

export function QuickStatusDashboard({
    listings,
    onStatusChange,
    onRefresh,
    isLoading = false,
}: QuickStatusDashboardProps) {
    const [selectedListings, setSelectedListings] = useState<Set<string>>(
        new Set()
    );
    const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());
    const [filter, setFilter] = useState<
        "all" | "active" | "pending" | "stale"
    >("all");

    // Detect stale listings (not updated in 7+ days)
    const isStale = (listing: Listing) => {
        const daysSinceUpdate = Math.floor(
            (Date.now() - new Date(listing.updatedAt).getTime()) /
                (1000 * 60 * 60 * 24)
        );
        return daysSinceUpdate >= 7 && listing.status === "active";
    };

    // Filter listings
    const filteredListings = listings.filter((listing) => {
        if (filter === "all") return true;
        if (filter === "stale") return isStale(listing);
        return listing.status === filter;
    });

    // Count stats
    const stats = {
        total: listings.length,
        active: listings.filter((l) => l.status === "active").length,
        pending: listings.filter((l) => l.status === "pending").length,
        sold: listings.filter((l) => l.status === "sold").length,
        stale: listings.filter((l) => isStale(l)).length,
    };

    const handleStatusChange = async (listingId: string, newStatus: string) => {
        setUpdatingIds((prev) => new Set(prev).add(listingId));
        try {
            await onStatusChange(listingId, newStatus);
            toast.success(`Listing updated to ${newStatus}`);
        } catch (error) {
            console.error("Failed to update status:", error);
            toast.error("Failed to update listing");
        } finally {
            setUpdatingIds((prev) => {
                const next = new Set(prev);
                next.delete(listingId);
                return next;
            });
        }
    };

    const handleBulkStatusChange = async (newStatus: string) => {
        if (selectedListings.size === 0) {
            toast.warning("No listings selected");
            return;
        }

        const count = selectedListings.size;
        toast.info(`Updating ${count} listing(s)...`);

        const promises = Array.from(selectedListings).map((id) =>
            handleStatusChange(id, newStatus)
        );

        await Promise.all(promises);
        setSelectedListings(new Set());
        toast.success(`${count} listing(s) updated to ${newStatus}`);
    };

    const toggleSelection = (listingId: string) => {
        setSelectedListings((prev) => {
            const next = new Set(prev);
            if (next.has(listingId)) {
                next.delete(listingId);
            } else {
                next.add(listingId);
            }
            return next;
        });
    };

    const selectAll = () => {
        setSelectedListings(new Set(filteredListings.map((l) => l.id)));
    };

    const clearSelection = () => {
        setSelectedListings(new Set());
    };

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            // Don't trigger if typing in input
            if (
                e.target instanceof HTMLInputElement ||
                e.target instanceof HTMLTextAreaElement
            ) {
                return;
            }

            if (selectedListings.size === 0) return;

            switch (e.key.toLowerCase()) {
                case "s":
                    e.preventDefault();
                    handleBulkStatusChange("sold");
                    break;
                case "p":
                    e.preventDefault();
                    handleBulkStatusChange("pending");
                    break;
                case "a":
                    e.preventDefault();
                    handleBulkStatusChange("active");
                    break;
                case "escape":
                    clearSelection();
                    break;
            }
        };

        window.addEventListener("keydown", handleKeyPress);
        return () => window.removeEventListener("keydown", handleKeyPress);
    }, [selectedListings]);

    return (
        <div className="space-y-4">
            {/* Header with Stats */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Quick Status Updates</h2>
                    <p className="text-sm text-gray-600">
                        Click listings to select, then use buttons or keyboard
                        shortcuts
                    </p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onRefresh}
                    disabled={isLoading}
                    className="gap-2"
                >
                    <RefreshCw
                        className={cn("w-4 h-4", isLoading && "animate-spin")}
                    />
                    Refresh
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <StatsCard
                    label="Total"
                    count={stats.total}
                    active={filter === "all"}
                    onClick={() => setFilter("all")}
                />
                <StatsCard
                    label="Active"
                    count={stats.active}
                    active={filter === "active"}
                    onClick={() => setFilter("active")}
                    color="green"
                />
                <StatsCard
                    label="Pending"
                    count={stats.pending}
                    active={filter === "pending"}
                    onClick={() => setFilter("pending")}
                    color="yellow"
                />
                <StatsCard label="Sold" count={stats.sold} color="blue" />
                <StatsCard
                    label="Stale"
                    count={stats.stale}
                    active={filter === "stale"}
                    onClick={() => setFilter("stale")}
                    color="orange"
                    alert={stats.stale > 0}
                />
            </div>

            {/* Bulk Actions Bar */}
            {selectedListings.size > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="font-semibold">
                            {selectedListings.size} selected
                        </span>
                        <Button variant="ghost" size="sm" onClick={selectAll}>
                            Select All
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearSelection}
                        >
                            Clear
                        </Button>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleBulkStatusChange("active")}
                            className="gap-1"
                        >
                            <CheckCircle className="w-4 h-4" />
                            Active <kbd className="ml-1 text-xs">A</kbd>
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleBulkStatusChange("pending")}
                            className="gap-1"
                        >
                            <Clock className="w-4 h-4" />
                            Pending <kbd className="ml-1 text-xs">P</kbd>
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleBulkStatusChange("sold")}
                            className="gap-1"
                        >
                            <XCircle className="w-4 h-4" />
                            Sold <kbd className="ml-1 text-xs">S</kbd>
                        </Button>
                    </div>
                </div>
            )}

            {/* Listings Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredListings.map((listing) => (
                    <ListingQuickCard
                        key={listing.id}
                        listing={listing}
                        isSelected={selectedListings.has(listing.id)}
                        isUpdating={updatingIds.has(listing.id)}
                        onSelect={() => toggleSelection(listing.id)}
                        onStatusChange={handleStatusChange}
                        isStale={isStale(listing)}
                    />
                ))}
            </div>

            {filteredListings.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                    <Home className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="text-lg font-medium">No listings found</p>
                    <p className="text-sm">Try adjusting your filters</p>
                </div>
            )}
        </div>
    );
}

// Stats Card Component
interface StatsCardProps {
    label: string;
    count: number;
    active?: boolean;
    onClick?: () => void;
    color?: "green" | "yellow" | "blue" | "orange";
    alert?: boolean;
}

function StatsCard({
    label,
    count,
    active,
    onClick,
    color,
    alert,
}: StatsCardProps) {
    const colors = {
        green: "text-green-600 bg-green-50 border-green-200",
        yellow: "text-yellow-600 bg-yellow-50 border-yellow-200",
        blue: "text-blue-600 bg-blue-50 border-blue-200",
        orange: "text-orange-600 bg-orange-50 border-orange-200",
    };

    return (
        <button
            onClick={onClick}
            disabled={!onClick}
            className={cn(
                "relative p-4 rounded-lg border-2 transition-all",
                active
                    ? "border-primary bg-primary/5"
                    : "border-gray-200 bg-white",
                onClick && "hover:border-primary/50 cursor-pointer",
                !onClick && "cursor-default"
            )}
        >
            {alert && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full animate-pulse" />
            )}
            <div className="text-3xl font-bold">{count}</div>
            <div className={cn("text-sm font-medium", color && colors[color])}>
                {label}
            </div>
        </button>
    );
}

// Listing Quick Card Component
interface ListingQuickCardProps {
    listing: Listing;
    isSelected: boolean;
    isUpdating: boolean;
    onSelect: () => void;
    onStatusChange: (listingId: string, newStatus: string) => void;
    isStale: boolean;
}

function ListingQuickCard({
    listing,
    isSelected,
    isUpdating,
    onSelect,
    onStatusChange,
    isStale,
}: ListingQuickCardProps) {
    const statusColors = {
        active: "bg-green-100 text-green-800",
        pending: "bg-yellow-100 text-yellow-800",
        sold: "bg-red-100 text-red-800",
        draft: "bg-gray-100 text-gray-800",
    };

    return (
        <div
            onClick={onSelect}
            className={cn(
                "relative group p-4 rounded-lg border-2 transition-all cursor-pointer",
                isSelected
                    ? "border-primary bg-primary/5 shadow-md"
                    : "border-gray-200 bg-white hover:border-gray-300",
                isUpdating && "opacity-50 pointer-events-none",
                isStale && "border-l-4 border-l-orange-500"
            )}
        >
            {/* Checkbox */}
            <div
                className={cn(
                    "absolute top-2 left-2 w-5 h-5 rounded border-2 flex items-center justify-center",
                    isSelected
                        ? "bg-primary border-primary"
                        : "border-gray-300 group-hover:border-primary"
                )}
            >
                {isSelected && <CheckCircle className="w-4 h-4 text-white" />}
            </div>

            {/* Stale Badge */}
            {isStale && (
                <Badge
                    variant="outline"
                    className="absolute top-2 right-2 bg-orange-100 text-orange-800 border-orange-300"
                >
                    <Clock className="w-3 h-3 mr-1" />
                    Stale
                </Badge>
            )}

            <div className="mt-6">
                <h3 className="font-semibold text-sm truncate mb-1">
                    {listing.title}
                </h3>
                <p className="text-lg font-bold text-primary mb-2">
                    ${listing.price.toLocaleString()}
                </p>

                <div className="flex items-center justify-between mb-3">
                    <Badge className={statusColors[listing.status]}>
                        {listing.status.toUpperCase()}
                    </Badge>
                    <span className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(listing.updatedAt), {
                            addSuffix: true,
                        })}
                    </span>
                </div>

                {/* Quick Stats */}
                {(listing.views !== undefined ||
                    listing.leads !== undefined) && (
                    <div className="flex gap-3 text-xs text-gray-600 mb-3">
                        {listing.views !== undefined && (
                            <span>👁️ {listing.views} views</span>
                        )}
                        {listing.leads !== undefined && (
                            <span>👥 {listing.leads} leads</span>
                        )}
                    </div>
                )}

                {/* Quick Action Buttons */}
                <div className="flex gap-2">
                    {listing.status !== "sold" && (
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                                e.stopPropagation();
                                onStatusChange(listing.id, "sold");
                            }}
                            className="flex-1 text-xs"
                        >
                            Mark Sold
                        </Button>
                    )}
                    {listing.status !== "pending" && (
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                                e.stopPropagation();
                                onStatusChange(listing.id, "pending");
                            }}
                            className="flex-1 text-xs"
                        >
                            Pending
                        </Button>
                    )}
                </div>
            </div>

            {isUpdating && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-lg">
                    <RefreshCw className="w-6 h-6 animate-spin text-primary" />
                </div>
            )}
        </div>
    );
}
