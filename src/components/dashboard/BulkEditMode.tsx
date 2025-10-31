/**
 * Bulk Edit Mode Component
 * Allows editing multiple listings at once
 */

import { useState } from "react";
import {
    CheckSquare,
    Square,
    Edit,
    Trash2,
    Tag,
    DollarSign,
    Save,
    X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Listing {
    id: string;
    title: string;
    price: number;
    status: string;
    category?: string;
}

interface BulkEditModeProps {
    listings: Listing[];
    selectedIds: string[];
    onToggleSelect: (id: string) => void;
    onSelectAll: () => void;
    onClearSelection: () => void;
    onBulkUpdate: (updates: BulkUpdateData) => Promise<void>;
    onBulkDelete: (ids: string[]) => Promise<void>;
}

interface BulkUpdateData {
    status?: string;
    category?: string;
    priceAdjustment?: {
        type: "increase" | "decrease" | "set";
        value: number;
        unit: "percent" | "amount";
    };
}

export function BulkEditMode({
    listings,
    selectedIds,
    onToggleSelect,
    onSelectAll,
    onClearSelection,
    onBulkUpdate,
    onBulkDelete,
}: BulkEditModeProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [bulkUpdates, setBulkUpdates] = useState<BulkUpdateData>({});
    const [priceAdjustType, setPriceAdjustType] = useState<
        "increase" | "decrease" | "set"
    >("increase");
    const [priceValue, setPriceValue] = useState("");
    const [priceUnit, setPriceUnit] = useState<"percent" | "amount">("percent");

    const selectedListings = listings.filter((l) => selectedIds.includes(l.id));
    const allSelected =
        listings.length > 0 && selectedIds.length === listings.length;

    const handleSaveBulkEdit = async () => {
        if (selectedIds.length === 0) {
            toast.error("No listings selected");
            return;
        }

        const updates: BulkUpdateData = { ...bulkUpdates };

        // Add price adjustment if specified
        if (priceValue) {
            updates.priceAdjustment = {
                type: priceAdjustType,
                value: parseFloat(priceValue),
                unit: priceUnit,
            };
        }

        if (Object.keys(updates).length === 0) {
            toast.warning("No changes to apply");
            return;
        }

        try {
            await onBulkUpdate(updates);
            toast.success(`${selectedIds.length} listing(s) updated`);
            setIsEditing(false);
            setBulkUpdates({});
            setPriceValue("");
        } catch (error) {
            console.error("Bulk update failed:", error);
            toast.error("Failed to update listings");
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) {
            toast.error("No listings selected");
            return;
        }

        if (
            !confirm(
                `Delete ${selectedIds.length} listing(s)? This cannot be undone.`
            )
        ) {
            return;
        }

        try {
            await onBulkDelete(selectedIds);
            toast.success(`${selectedIds.length} listing(s) deleted`);
            onClearSelection();
        } catch (error) {
            console.error("Bulk delete failed:", error);
            toast.error("Failed to delete listings");
        }
    };

    const calculatePricePreview = (listing: Listing) => {
        if (!priceValue) return listing.price;

        const value = parseFloat(priceValue);
        if (isNaN(value)) return listing.price;

        switch (priceAdjustType) {
            case "increase":
                return priceUnit === "percent"
                    ? listing.price * (1 + value / 100)
                    : listing.price + value;
            case "decrease":
                return priceUnit === "percent"
                    ? listing.price * (1 - value / 100)
                    : listing.price - value;
            case "set":
                return value;
            default:
                return listing.price;
        }
    };

    return (
        <div className="space-y-4">
            {/* Selection Bar */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center gap-4">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={allSelected ? onClearSelection : onSelectAll}
                        className="gap-2"
                    >
                        {allSelected ? (
                            <>
                                <CheckSquare className="w-4 h-4" />
                                Deselect All
                            </>
                        ) : (
                            <>
                                <Square className="w-4 h-4" />
                                Select All
                            </>
                        )}
                    </Button>
                    <span className="text-sm font-medium">
                        {selectedIds.length} of {listings.length} selected
                    </span>
                </div>
                <div className="flex gap-2">
                    {selectedIds.length > 0 && !isEditing && (
                        <>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setIsEditing(true)}
                                className="gap-2"
                            >
                                <Edit className="w-4 h-4" />
                                Bulk Edit
                            </Button>
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={handleBulkDelete}
                                className="gap-2"
                            >
                                <Trash2 className="w-4 h-4" />
                                Delete Selected
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {/* Bulk Edit Panel */}
            {isEditing && selectedIds.length > 0 && (
                <div className="p-6 bg-white rounded-lg border-2 border-primary shadow-lg">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold">
                            Bulk Edit {selectedIds.length} Listings
                        </h3>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsEditing(false)}
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Status Update */}
                        <div className="space-y-2">
                            <Label>Update Status</Label>
                            <Select
                                value={bulkUpdates.status || ""}
                                onValueChange={(value) =>
                                    setBulkUpdates({
                                        ...bulkUpdates,
                                        status: value,
                                    })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Keep current status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="active">
                                        Active
                                    </SelectItem>
                                    <SelectItem value="pending">
                                        Pending
                                    </SelectItem>
                                    <SelectItem value="sold">Sold</SelectItem>
                                    <SelectItem value="draft">Draft</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Category Update */}
                        <div className="space-y-2">
                            <Label>Update Category</Label>
                            <Select
                                value={bulkUpdates.category || ""}
                                onValueChange={(value) =>
                                    setBulkUpdates({
                                        ...bulkUpdates,
                                        category: value,
                                    })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Keep current category" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="residential">
                                        Residential
                                    </SelectItem>
                                    <SelectItem value="commercial">
                                        Commercial
                                    </SelectItem>
                                    <SelectItem value="land">Land</SelectItem>
                                    <SelectItem value="rental">
                                        Rental
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Price Adjustment */}
                        <div className="space-y-2 md:col-span-2">
                            <Label>Price Adjustment</Label>
                            <div className="grid grid-cols-3 gap-2">
                                <Select
                                    value={priceAdjustType}
                                    onValueChange={(v: any) =>
                                        setPriceAdjustType(v)
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="increase">
                                            Increase
                                        </SelectItem>
                                        <SelectItem value="decrease">
                                            Decrease
                                        </SelectItem>
                                        <SelectItem value="set">
                                            Set to
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                <Input
                                    type="number"
                                    placeholder="Value"
                                    value={priceValue}
                                    onChange={(e) =>
                                        setPriceValue(e.target.value)
                                    }
                                />
                                <Select
                                    value={priceUnit}
                                    onValueChange={(v: any) => setPriceUnit(v)}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="percent">
                                            Percent
                                        </SelectItem>
                                        <SelectItem value="amount">
                                            Amount
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    {/* Preview */}
                    {selectedListings.length > 0 && (
                        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                            <h4 className="font-medium mb-3">
                                Preview Changes
                            </h4>
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                {selectedListings.slice(0, 5).map((listing) => (
                                    <div
                                        key={listing.id}
                                        className="flex items-center justify-between text-sm p-2 bg-white rounded"
                                    >
                                        <span className="truncate flex-1">
                                            {listing.title}
                                        </span>
                                        {priceValue && (
                                            <div className="flex items-center gap-2">
                                                <span className="text-gray-500 line-through">
                                                    $
                                                    {listing.price.toLocaleString()}
                                                </span>
                                                <span className="font-medium text-primary">
                                                    $
                                                    {calculatePricePreview(
                                                        listing
                                                    ).toLocaleString()}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {selectedListings.length > 5 && (
                                    <p className="text-xs text-gray-500 text-center">
                                        ... and {selectedListings.length - 5}{" "}
                                        more
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end gap-2 mt-6">
                        <Button
                            variant="outline"
                            onClick={() => setIsEditing(false)}
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleSaveBulkEdit} className="gap-2">
                            <Save className="w-4 h-4" />
                            Apply Changes
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
