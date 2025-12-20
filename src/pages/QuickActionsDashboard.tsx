/**
 * Quick Actions Dashboard Page
 * Integrated dashboard with all Sprint 3-4 features
 * Uses real data from database via hooks
 */

import { useState, useMemo } from "react";
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
import { useListings } from "@/hooks/useListings";
import { useAnalytics } from "@/hooks/useAnalytics";
import { Loader2 } from "lucide-react";

// Transform database listings to dashboard format
interface DashboardListing {
    id: string;
    title: string;
    price: number;
    status: "active" | "pending" | "sold";
    updatedAt: string;
    views: number;
    leads: number;
}

export default function QuickActionsDashboard() {
    const { listings: dbListings, isLoading, updateListing, deleteListing } = useListings();
    const { stats } = useAnalytics("30d");
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    // Transform database listings to dashboard format
    const listings: DashboardListing[] = useMemo(() => {
        return dbListings.map(listing => ({
            id: listing.id,
            title: `${listing.address}, ${listing.city}`,
            price: parseFloat(listing.price) || 0,
            status: (listing.status as "active" | "pending" | "sold") || "active",
            updatedAt: listing.updated_at || listing.created_at,
            views: 0, // Views are tracked separately in analytics_views
            leads: 0, // Leads are tracked separately in leads table
        }));
    }, [dbListings]);

    // Calculate stale listings (not updated in 7+ days)
    const staleListings = useMemo(() => {
        return listings
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
    }, [listings]);

    // Analytics data from real stats
    const analyticsStats = useMemo(() => {
        const activeListings = listings.filter((l) => l.status === "active").length;
        const avgPrice = listings.length > 0
            ? Math.floor(listings.reduce((sum, l) => sum + l.price, 0) / listings.length)
            : 0;

        return defaultRealEstateStats({
            totalListings: listings.length,
            activeListings,
            totalViews: stats.totalViews,
            totalLeads: stats.totalLeads,
            avgPrice,
            viewsChange: 0, // Would need historical data
            leadsChange: 0, // Would need historical data
        });
    }, [listings, stats]);

    // Handlers
    const handleStatusChange = async (listingId: string, newStatus: string) => {
        try {
            await updateListing.mutateAsync({
                id: listingId,
                status: newStatus,
            });
            toast.success("Listing status updated");
        } catch (error) {
            toast.error("Failed to update listing status");
        }
    };

    const handleRefresh = async () => {
        // The listings will auto-refresh via React Query
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
        try {
            for (const id of selectedIds) {
                const listing = listings.find(l => l.id === id);
                if (!listing) continue;

                let updateData: any = {};

                if (updates.status) {
                    updateData.status = updates.status;
                }

                if (updates.priceAdjustment) {
                    const { type, value, unit } = updates.priceAdjustment;
                    let newPrice = listing.price;

                    if (type === "increase") {
                        newPrice = unit === "percent"
                            ? listing.price * (1 + value / 100)
                            : listing.price + value;
                    } else if (type === "decrease") {
                        newPrice = unit === "percent"
                            ? listing.price * (1 - value / 100)
                            : listing.price - value;
                    } else if (type === "set") {
                        newPrice = value;
                    }

                    updateData.price = newPrice.toString();
                }

                if (Object.keys(updateData).length > 0) {
                    await updateListing.mutateAsync({ id, ...updateData });
                }
            }
            handleClearSelection();
            toast.success(`Updated ${selectedIds.length} listing(s)`);
        } catch (error) {
            toast.error("Failed to update listings");
        }
    };

    const handleBulkDelete = async (ids: string[]) => {
        try {
            for (const id of ids) {
                await deleteListing.mutateAsync(id);
            }
            handleClearSelection();
            toast.success(`Deleted ${ids.length} listing(s)`);
        } catch (error) {
            toast.error("Failed to delete listings");
        }
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

    if (isLoading) {
        return (
            <div className="container mx-auto py-6 flex items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <p className="text-gray-600">Loading listings...</p>
                </div>
            </div>
        );
    }

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

            {/* Empty State */}
            {listings.length === 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
                    <h3 className="text-lg font-semibold text-blue-900 mb-2">No Listings Yet</h3>
                    <p className="text-blue-700">
                        Add your first listing to start managing your properties here.
                    </p>
                </div>
            )}

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
            {listings.length > 0 && (
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
                            isLoading={updateListing.isPending}
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
            )}

            {/* Keyboard Shortcuts Helper */}
            <KeyboardShortcutsHelper shortcuts={shortcuts} />
        </div>
    );
}
