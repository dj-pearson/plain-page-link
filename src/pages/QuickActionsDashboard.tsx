/**
 * Quick Actions Dashboard Page
 * Integrated dashboard with all Sprint 3-4 features
 */

import { useState, useEffect } from "react";
import { QuickStatusDashboard } from "@/components/dashboard/QuickStatusDashboard";
import {
    StaleContentAlert,
    StaleContentBadge,
} from "@/components/dashboard/StaleContentAlert";
import { BulkEditMode } from "@/components/dashboard/BulkEditMode";
import { KeyboardShortcutsHelper } from "@/components/dashboard/KeyboardShortcutsHelper";
import {
    AnalyticsWidget,
    defaultRealEstateStats,
} from "@/components/dashboard/AnalyticsWidget";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

// Mock data (replace with actual API calls)
const mockListings = [
    {
        id: "1",
        title: "Modern 3BR House in Downtown",
        price: 450000,
        status: "active" as const,
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 9).toISOString(), // 9 days ago
        views: 156,
        leads: 12,
    },
    {
        id: "2",
        title: "Luxury Condo with Ocean View",
        price: 850000,
        status: "pending" as const,
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
        views: 243,
        leads: 18,
    },
    {
        id: "3",
        title: "Cozy 2BR Apartment Near Park",
        price: 325000,
        status: "active" as const,
        updatedAt: new Date(
            Date.now() - 1000 * 60 * 60 * 24 * 15
        ).toISOString(), // 15 days ago - STALE
        views: 89,
        leads: 5,
    },
    {
        id: "4",
        title: "Spacious Family Home with Pool",
        price: 675000,
        status: "active" as const,
        updatedAt: new Date(
            Date.now() - 1000 * 60 * 60 * 24 * 12
        ).toISOString(), // 12 days ago - STALE
        views: 198,
        leads: 22,
    },
    {
        id: "5",
        title: "Renovated Townhouse in Suburbs",
        price: 425000,
        status: "sold" as const,
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(), // 1 day ago
        views: 312,
        leads: 28,
    },
    {
        id: "6",
        title: "Charming Cottage with Garden",
        price: 385000,
        status: "active" as const,
        updatedAt: new Date(
            Date.now() - 1000 * 60 * 60 * 24 * 20
        ).toISOString(), // 20 days ago - CRITICAL
        views: 67,
        leads: 3,
    },
];

export default function QuickActionsDashboard() {
    const [listings, setListings] = useState(mockListings);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Calculate stale listings
    const staleListings = listings
        .filter((listing) => {
            const daysSinceUpdate = Math.floor(
                (Date.now() - new Date(listing.updatedAt).getTime()) /
                    (1000 * 60 * 60 * 24)
            );
            return daysSinceUpdate >= 7 && listing.status === "active";
        })
        .map((listing) => ({
            id: listing.id,
            title: listing.title,
            status: listing.status,
            updatedAt: listing.updatedAt,
            daysSinceUpdate: Math.floor(
                (Date.now() - new Date(listing.updatedAt).getTime()) /
                    (1000 * 60 * 60 * 24)
            ),
        }));

    // Analytics data
    const analyticsStats = defaultRealEstateStats({
        totalListings: listings.length,
        activeListings: listings.filter((l) => l.status === "active").length,
        totalViews: listings.reduce((sum, l) => sum + (l.views || 0), 0),
        totalLeads: listings.reduce((sum, l) => sum + (l.leads || 0), 0),
        avgPrice: Math.floor(
            listings.reduce((sum, l) => sum + l.price, 0) / listings.length
        ),
        viewsChange: 12.5,
        leadsChange: 8.3,
    });

    // Handlers
    const handleStatusChange = async (listingId: string, newStatus: string) => {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 500));
        setListings((prev) =>
            prev.map((listing) =>
                listing.id === listingId
                    ? {
                          ...listing,
                          status: newStatus as any,
                          updatedAt: new Date().toISOString(),
                      }
                    : listing
            )
        );
    };

    const handleRefresh = async () => {
        setIsLoading(true);
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setIsLoading(false);
        toast.success("Listings refreshed");
    };

    const handleRefreshStale = async (listingId: string) => {
        const listing = listings.find((l) => l.id === listingId);
        if (listing) {
            toast.info(`Opening editor for "${listing.title}"`);
            // Navigate to edit page in real implementation
        }
    };

    const handleToggleSelect = (id: string) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };

    const handleSelectAll = () => {
        setSelectedIds(listings.map((l) => l.id));
    };

    const handleClearSelection = () => {
        setSelectedIds([]);
    };

    const handleBulkUpdate = async (updates: any) => {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000));

        setListings((prev) =>
            prev.map((listing) => {
                if (!selectedIds.includes(listing.id)) return listing;

                let updated = {
                    ...listing,
                    updatedAt: new Date().toISOString(),
                };

                if (updates.status) {
                    updated.status = updates.status;
                }

                if (updates.priceAdjustment) {
                    const { type, value, unit } = updates.priceAdjustment;
                    if (type === "increase") {
                        updated.price =
                            unit === "percent"
                                ? listing.price * (1 + value / 100)
                                : listing.price + value;
                    } else if (type === "decrease") {
                        updated.price =
                            unit === "percent"
                                ? listing.price * (1 - value / 100)
                                : listing.price - value;
                    } else if (type === "set") {
                        updated.price = value;
                    }
                }

                return updated;
            })
        );
        handleClearSelection();
    };

    const handleBulkDelete = async (ids: string[]) => {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 800));
        setListings((prev) => prev.filter((l) => !ids.includes(l.id)));
    };

    // Keyboard shortcuts
    const shortcuts = [
        {
            key: "?",
            description: "Show keyboard shortcuts",
            action: () => {},
            category: "General",
        },
        {
            key: "s",
            description: "Mark selected as Sold",
            action: () => {
                if (selectedIds.length > 0) {
                    selectedIds.forEach((id) => handleStatusChange(id, "sold"));
                }
            },
            category: "Status",
        },
        {
            key: "p",
            description: "Mark selected as Pending",
            action: () => {
                if (selectedIds.length > 0) {
                    selectedIds.forEach((id) =>
                        handleStatusChange(id, "pending")
                    );
                }
            },
            category: "Status",
        },
        {
            key: "a",
            description: "Mark selected as Active",
            action: () => {
                if (selectedIds.length > 0) {
                    selectedIds.forEach((id) =>
                        handleStatusChange(id, "active")
                    );
                }
            },
            category: "Status",
        },
        {
            key: "Escape",
            description: "Clear selection",
            action: handleClearSelection,
            category: "Selection",
        },
    ];

    return (
        <div className="container mx-auto py-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">
                        Quick Actions Dashboard
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Manage your listings efficiently with keyboard shortcuts
                        and bulk actions
                    </p>
                </div>
                {staleListings.length > 0 && (
                    <StaleContentBadge count={staleListings.length} />
                )}
            </div>

            {/* Analytics */}
            <AnalyticsWidget stats={analyticsStats} period="Last 30 days" />

            {/* Stale Content Alert */}
            {staleListings.length > 0 && (
                <StaleContentAlert
                    staleListings={staleListings}
                    onRefresh={handleRefreshStale}
                />
            )}

            {/* Main Content Tabs */}
            <Tabs defaultValue="quick-status" className="w-full">
                <TabsList className="grid w-full grid-cols-2 max-w-md">
                    <TabsTrigger value="quick-status">Quick Status</TabsTrigger>
                    <TabsTrigger value="bulk-edit">Bulk Edit</TabsTrigger>
                </TabsList>

                <TabsContent value="quick-status" className="mt-6">
                    <QuickStatusDashboard
                        listings={listings}
                        onStatusChange={handleStatusChange}
                        onRefresh={handleRefresh}
                        isLoading={isLoading}
                    />
                </TabsContent>

                <TabsContent value="bulk-edit" className="mt-6">
                    <BulkEditMode
                        listings={listings}
                        selectedIds={selectedIds}
                        onToggleSelect={handleToggleSelect}
                        onSelectAll={handleSelectAll}
                        onClearSelection={handleClearSelection}
                        onBulkUpdate={handleBulkUpdate}
                        onBulkDelete={handleBulkDelete}
                    />

                    {/* Listings Grid for Bulk Edit */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                        {listings.map((listing) => (
                            <div
                                key={listing.id}
                                onClick={() => handleToggleSelect(listing.id)}
                                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                                    selectedIds.includes(listing.id)
                                        ? "border-primary bg-primary/5"
                                        : "border-gray-200 hover:border-gray-300"
                                }`}
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <h3 className="font-semibold text-sm">
                                        {listing.title}
                                    </h3>
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.includes(
                                            listing.id
                                        )}
                                        onChange={() =>
                                            handleToggleSelect(listing.id)
                                        }
                                        className="mt-1"
                                    />
                                </div>
                                <p className="text-lg font-bold text-primary">
                                    ${listing.price.toLocaleString()}
                                </p>
                                <p className="text-sm text-gray-600 capitalize">
                                    {listing.status}
                                </p>
                            </div>
                        ))}
                    </div>
                </TabsContent>
            </Tabs>

            {/* Keyboard Shortcuts Helper */}
            <KeyboardShortcutsHelper shortcuts={shortcuts} />
        </div>
    );
}
