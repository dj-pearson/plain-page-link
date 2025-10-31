/**
 * Stale Content Alert Component
 * Automatically detects and alerts users about listings needing updates
 */

import { useState, useEffect } from "react";
import { AlertTriangle, X, CheckCircle, Clock, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface StaleListing {
    id: string;
    title: string;
    status: string;
    updatedAt: string;
    daysSinceUpdate: number;
}

interface StaleContentAlertProps {
    staleListings: StaleListing[];
    onDismiss?: (listingId: string) => void;
    onRefresh?: (listingId: string) => void;
    onDismissAll?: () => void;
    className?: string;
}

export function StaleContentAlert({
    staleListings,
    onDismiss,
    onRefresh,
    onDismissAll,
    className,
}: StaleContentAlertProps) {
    const [isExpanded, setIsExpanded] = useState(true);
    const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

    // Load dismissed IDs from localStorage
    useEffect(() => {
        const saved = localStorage.getItem("dismissed-stale-alerts");
        if (saved) {
            try {
                setDismissedIds(new Set(JSON.parse(saved)));
            } catch (e) {
                console.error("Failed to parse dismissed alerts:", e);
            }
        }
    }, []);

    // Save dismissed IDs to localStorage
    useEffect(() => {
        localStorage.setItem(
            "dismissed-stale-alerts",
            JSON.stringify(Array.from(dismissedIds))
        );
    }, [dismissedIds]);

    const visibleListings = staleListings.filter(
        (listing) => !dismissedIds.has(listing.id)
    );

    if (visibleListings.length === 0) {
        return null;
    }

    const handleDismiss = (listingId: string) => {
        setDismissedIds((prev) => new Set(prev).add(listingId));
        onDismiss?.(listingId);
    };

    const handleDismissAll = () => {
        setDismissedIds(new Set(staleListings.map((l) => l.id)));
        onDismissAll?.();
    };

    const criticalCount = visibleListings.filter(
        (l) => l.daysSinceUpdate >= 14
    ).length;
    const warningCount = visibleListings.length - criticalCount;

    return (
        <div
            className={cn(
                "bg-orange-50 border-2 border-orange-200 rounded-lg",
                className
            )}
        >
            {/* Header */}
            <div
                className="flex items-center justify-between p-4 cursor-pointer"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <AlertTriangle className="w-6 h-6 text-orange-600" />
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-orange-600 text-white text-xs rounded-full flex items-center justify-center font-bold">
                            {visibleListings.length}
                        </div>
                    </div>
                    <div>
                        <h3 className="font-semibold text-orange-900">
                            Stale Listings Need Attention
                        </h3>
                        <p className="text-sm text-orange-700">
                            {criticalCount > 0 && (
                                <span className="font-medium">
                                    {criticalCount} critical (14+ days)
                                </span>
                            )}
                            {criticalCount > 0 && warningCount > 0 && " · "}
                            {warningCount > 0 && (
                                <span>{warningCount} warning (7+ days)</span>
                            )}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleDismissAll();
                        }}
                        className="text-orange-700 hover:text-orange-900"
                    >
                        Dismiss All
                    </Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        className="text-orange-700"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {isExpanded ? "▼" : "▶"}
                    </Button>
                </div>
            </div>

            {/* Expanded List */}
            {isExpanded && (
                <div className="border-t border-orange-200 divide-y divide-orange-200">
                    {visibleListings.map((listing) => (
                        <StaleListingRow
                            key={listing.id}
                            listing={listing}
                            onDismiss={() => handleDismiss(listing.id)}
                            onRefresh={() => onRefresh?.(listing.id)}
                        />
                    ))}
                </div>
            )}

            {/* Helpful Tips */}
            {isExpanded && (
                <div className="p-4 bg-orange-100/50 border-t border-orange-200">
                    <p className="text-xs text-orange-800 mb-2 font-medium">
                        💡 Quick Tips:
                    </p>
                    <ul className="text-xs text-orange-700 space-y-1 ml-4 list-disc">
                        <li>
                            Update listing descriptions with recent improvements
                            or price changes
                        </li>
                        <li>Add new photos to refresh your listing's appeal</li>
                        <li>
                            Verify pricing is still competitive in current
                            market
                        </li>
                        <li>Check if property status has changed</li>
                    </ul>
                </div>
            )}
        </div>
    );
}

// Individual Stale Listing Row
interface StaleListingRowProps {
    listing: StaleListing;
    onDismiss: () => void;
    onRefresh: () => void;
}

function StaleListingRow({
    listing,
    onDismiss,
    onRefresh,
}: StaleListingRowProps) {
    const isCritical = listing.daysSinceUpdate >= 14;

    return (
        <div className="p-4 flex items-center justify-between hover:bg-orange-100/30 transition-colors">
            <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-gray-900">
                        {listing.title}
                    </h4>
                    <Badge
                        variant="outline"
                        className={cn(
                            "text-xs",
                            isCritical
                                ? "bg-red-100 text-red-800 border-red-300"
                                : "bg-yellow-100 text-yellow-800 border-yellow-300"
                        )}
                    >
                        {isCritical ? (
                            <>
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                CRITICAL
                            </>
                        ) : (
                            <>
                                <Clock className="w-3 h-3 mr-1" />
                                WARNING
                            </>
                        )}
                    </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>Status: {listing.status}</span>
                    <span>
                        Last updated:{" "}
                        {formatDistanceToNow(new Date(listing.updatedAt), {
                            addSuffix: true,
                        })}
                    </span>
                    <span className="font-medium text-orange-700">
                        {listing.daysSinceUpdate} days old
                    </span>
                </div>
            </div>
            <div className="flex gap-2 ml-4">
                <Button
                    size="sm"
                    variant="outline"
                    onClick={onRefresh}
                    className="gap-1 bg-white"
                >
                    <RefreshCw className="w-3 h-3" />
                    Update
                </Button>
                <Button size="sm" variant="ghost" onClick={onDismiss}>
                    <X className="w-4 h-4" />
                </Button>
            </div>
        </div>
    );
}

// Stale Content Badge - Can be used in headers/nav
export function StaleContentBadge({ count }: { count: number }) {
    if (count === 0) return null;

    return (
        <Badge
            variant="outline"
            className="bg-orange-100 text-orange-800 border-orange-300 animate-pulse"
        >
            <AlertTriangle className="w-3 h-3 mr-1" />
            {count} Stale
        </Badge>
    );
}
