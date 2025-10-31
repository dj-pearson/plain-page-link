/**
 * Mobile Listing Card Component
 * Touch-optimized listing card with swipe gestures
 */

import { useState, useRef, useEffect } from "react";
import { MoreVertical, Edit, Trash2, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from "date-fns";

interface MobileListingCardProps {
    listing: {
        id: string;
        title: string;
        price: number;
        status: "active" | "pending" | "sold" | "draft";
        image?: string;
        bedrooms?: number;
        bathrooms?: number;
        updatedAt: string;
    };
    onEdit?: (id: string) => void;
    onDelete?: (id: string) => void;
    onStatusChange?: (id: string, status: string) => void;
}

const statusColors = {
    active: "bg-green-100 text-green-800",
    pending: "bg-yellow-100 text-yellow-800",
    sold: "bg-red-100 text-red-800",
    draft: "bg-gray-100 text-gray-800",
};

export function MobileListingCard({
    listing,
    onEdit,
    onDelete,
    onStatusChange,
}: MobileListingCardProps) {
    const [swipeOffset, setSwipeOffset] = useState(0);
    const [isSwiping, setIsSwiping] = useState(false);
    const startX = useRef(0);
    const currentX = useRef(0);
    const cardRef = useRef<HTMLDivElement>(null);

    const handleTouchStart = (e: React.TouchEvent) => {
        startX.current = e.touches[0].clientX;
        setIsSwiping(true);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isSwiping) return;

        currentX.current = e.touches[0].clientX;
        const diff = currentX.current - startX.current;

        // Only allow left swipe (negative offset)
        if (diff < 0) {
            setSwipeOffset(Math.max(diff, -150));
        }
    };

    const handleTouchEnd = () => {
        setIsSwiping(false);

        // If swiped more than 50px, keep it open, otherwise close
        if (swipeOffset < -50) {
            setSwipeOffset(-150);
        } else {
            setSwipeOffset(0);
        }
    };

    // Close swipe actions when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                cardRef.current &&
                !cardRef.current.contains(event.target as Node)
            ) {
                setSwipeOffset(0);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const isStale = () => {
        const daysSinceUpdate = Math.floor(
            (Date.now() - new Date(listing.updatedAt).getTime()) /
                (1000 * 60 * 60 * 24)
        );
        return daysSinceUpdate > 7;
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            maximumFractionDigits: 0,
        }).format(price);
    };

    return (
        <div
            ref={cardRef}
            className="relative overflow-hidden bg-white rounded-lg shadow-sm border border-gray-200"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            {/* Swipe actions background */}
            <div className="absolute right-0 top-0 bottom-0 w-[150px] bg-gray-50 flex items-center justify-end px-2 gap-2">
                <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onEdit?.(listing.id)}
                    className="h-full"
                    aria-label="Edit listing"
                >
                    <Edit className="w-4 h-4" />
                </Button>
                <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => onDelete?.(listing.id)}
                    className="h-full"
                    aria-label="Delete listing"
                >
                    <Trash2 className="w-4 h-4" />
                </Button>
            </div>

            {/* Card content */}
            <Link
                to={`/listings/${listing.id}`}
                className={cn(
                    "relative block p-4 bg-white transition-transform duration-200",
                    isStale() && "border-l-4 border-l-orange-500"
                )}
                style={{ transform: `translateX(${swipeOffset}px)` }}
            >
                <div className="flex gap-3">
                    {/* Thumbnail */}
                    <div className="flex-shrink-0 w-20 h-20 bg-gray-200 rounded-lg overflow-hidden">
                        {listing.image ? (
                            <img
                                src={listing.image}
                                alt={listing.title}
                                className="w-full h-full object-cover"
                                loading="lazy"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                                <Clock className="w-8 h-8" />
                            </div>
                        )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                            <h3 className="font-semibold text-sm truncate">
                                {listing.title}
                            </h3>
                            <DropdownMenu>
                                <DropdownMenuTrigger
                                    asChild
                                    onClick={(e) => e.preventDefault()}
                                >
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 w-6 p-0"
                                    >
                                        <MoreVertical className="w-4 h-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                        onClick={() => onEdit?.(listing.id)}
                                    >
                                        <Edit className="w-4 h-4 mr-2" />
                                        Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() =>
                                            onStatusChange?.(
                                                listing.id,
                                                "pending"
                                            )
                                        }
                                    >
                                        Mark Pending
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() =>
                                            onStatusChange?.(listing.id, "sold")
                                        }
                                    >
                                        Mark Sold
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() => onDelete?.(listing.id)}
                                        className="text-red-600"
                                    >
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Delete
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        <p className="text-lg font-bold text-primary mt-1">
                            {formatPrice(listing.price)}
                        </p>

                        <div className="flex items-center gap-3 text-xs text-gray-600 mt-1">
                            {listing.bedrooms && (
                                <span>🏠 {listing.bedrooms}bd</span>
                            )}
                            {listing.bathrooms && (
                                <span>{listing.bathrooms}ba</span>
                            )}
                            <span
                                className={cn(
                                    "px-2 py-0.5 rounded-full font-medium",
                                    statusColors[listing.status]
                                )}
                            >
                                {listing.status.charAt(0).toUpperCase() +
                                    listing.status.slice(1)}
                            </span>
                        </div>

                        <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Updated{" "}
                            {formatDistanceToNow(new Date(listing.updatedAt), {
                                addSuffix: true,
                            })}
                            {isStale() && (
                                <span className="text-orange-600 font-medium">
                                    (Stale)
                                </span>
                            )}
                        </p>
                    </div>
                </div>
            </Link>
        </div>
    );
}
