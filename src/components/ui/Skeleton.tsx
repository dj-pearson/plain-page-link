/**
 * Skeleton Loading Components
 * Mobile-optimized loading placeholders that prevent layout shift
 * Uses CSS shimmer animation for visual feedback
 */

import { cn } from "@/lib/utils";

interface SkeletonProps {
    className?: string;
}

/**
 * Base skeleton element with shimmer animation
 */
export function Skeleton({ className }: SkeletonProps) {
    return (
        <div
            className={cn(
                "animate-pulse rounded-md bg-gray-200 dark:bg-gray-700",
                className
            )}
            aria-hidden="true"
        />
    );
}

/**
 * Skeleton for text lines
 */
export function SkeletonText({ className, lines = 1 }: SkeletonProps & { lines?: number }) {
    return (
        <div className="space-y-2" aria-hidden="true">
            {Array.from({ length: lines }).map((_, i) => (
                <Skeleton
                    key={i}
                    className={cn(
                        "h-4",
                        i === lines - 1 ? "w-3/4" : "w-full",
                        className
                    )}
                />
            ))}
        </div>
    );
}

/**
 * Skeleton for circular avatars
 */
export function SkeletonAvatar({ className, size = "md" }: SkeletonProps & { size?: "sm" | "md" | "lg" }) {
    const sizeClasses = {
        sm: "w-8 h-8",
        md: "w-12 h-12",
        lg: "w-16 h-16",
    };

    return (
        <Skeleton
            className={cn("rounded-full", sizeClasses[size], className)}
        />
    );
}

/**
 * Skeleton for property/listing cards - mobile optimized
 */
export function SkeletonCard({ className }: SkeletonProps) {
    return (
        <div
            className={cn(
                "rounded-lg border border-gray-200 bg-white p-4 space-y-4",
                "dark:border-gray-700 dark:bg-gray-800",
                className
            )}
            aria-hidden="true"
        >
            {/* Image placeholder - 16:9 aspect ratio */}
            <Skeleton className="w-full aspect-video rounded-lg" />

            {/* Title */}
            <Skeleton className="h-5 w-3/4" />

            {/* Subtitle/description */}
            <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
            </div>

            {/* Price and details row */}
            <div className="flex justify-between items-center pt-2">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-8 w-20 rounded-md" />
            </div>
        </div>
    );
}

/**
 * Skeleton for lead/contact cards
 */
export function SkeletonLeadCard({ className }: SkeletonProps) {
    return (
        <div
            className={cn(
                "rounded-lg border border-gray-200 bg-white p-4",
                "dark:border-gray-700 dark:bg-gray-800",
                className
            )}
            aria-hidden="true"
        >
            <div className="flex items-start gap-3">
                <SkeletonAvatar size="md" />
                <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-6 w-16 rounded-full" />
            </div>
        </div>
    );
}

/**
 * Skeleton for stat/metric cards on dashboard
 */
export function SkeletonStatCard({ className }: SkeletonProps) {
    return (
        <div
            className={cn(
                "rounded-lg border border-gray-200 bg-white p-4 sm:p-6",
                "dark:border-gray-700 dark:bg-gray-800",
                className
            )}
            aria-hidden="true"
        >
            <div className="flex items-center justify-between">
                <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-8 w-16" />
                </div>
                <Skeleton className="w-10 h-10 rounded-lg" />
            </div>
            <Skeleton className="h-3 w-24 mt-3" />
        </div>
    );
}

/**
 * Skeleton for list items
 */
export function SkeletonListItem({ className }: SkeletonProps) {
    return (
        <div
            className={cn(
                "flex items-center gap-3 p-3 rounded-lg",
                className
            )}
            aria-hidden="true"
        >
            <Skeleton className="w-10 h-10 rounded-lg flex-shrink-0" />
            <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
            </div>
            <Skeleton className="h-8 w-8 rounded-md flex-shrink-0" />
        </div>
    );
}

/**
 * Skeleton for table rows
 */
export function SkeletonTableRow({ columns = 4, className }: SkeletonProps & { columns?: number }) {
    return (
        <tr className={cn("border-b border-gray-100", className)} aria-hidden="true">
            {Array.from({ length: columns }).map((_, i) => (
                <td key={i} className="px-4 py-3">
                    <Skeleton className={cn("h-4", i === 0 ? "w-32" : "w-20")} />
                </td>
            ))}
        </tr>
    );
}

/**
 * Skeleton for profile header
 */
export function SkeletonProfileHeader({ className }: SkeletonProps) {
    return (
        <div
            className={cn("space-y-4", className)}
            aria-hidden="true"
        >
            {/* Cover image */}
            <Skeleton className="w-full h-32 sm:h-48 rounded-lg" />

            {/* Avatar and info */}
            <div className="flex flex-col sm:flex-row items-center gap-4 -mt-12 sm:-mt-16 px-4">
                <Skeleton className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-white" />
                <div className="flex-1 text-center sm:text-left space-y-2 pt-2">
                    <Skeleton className="h-7 w-48 mx-auto sm:mx-0" />
                    <Skeleton className="h-4 w-32 mx-auto sm:mx-0" />
                    <Skeleton className="h-4 w-64 mx-auto sm:mx-0" />
                </div>
            </div>
        </div>
    );
}

/**
 * Container for multiple skeleton cards with grid layout
 */
export function SkeletonCardGrid({
    count = 6,
    CardComponent = SkeletonCard,
    className,
}: {
    count?: number;
    CardComponent?: React.ComponentType<SkeletonProps>;
    className?: string;
}) {
    return (
        <div
            className={cn(
                "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6",
                className
            )}
            aria-busy="true"
            aria-label="Loading content"
        >
            {Array.from({ length: count }).map((_, i) => (
                <CardComponent key={i} />
            ))}
        </div>
    );
}

/**
 * Full page loading skeleton for dashboard
 */
export function SkeletonDashboard() {
    return (
        <div className="space-y-6 p-4 sm:p-6" aria-busy="true" aria-label="Loading dashboard">
            {/* Stats row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <SkeletonStatCard key={i} />
                ))}
            </div>

            {/* Content area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main content */}
                <div className="lg:col-span-2 space-y-4">
                    <Skeleton className="h-8 w-48" />
                    <SkeletonCardGrid count={4} CardComponent={SkeletonCard} className="grid-cols-1 md:grid-cols-2" />
                </div>

                {/* Sidebar */}
                <div className="space-y-4">
                    <Skeleton className="h-8 w-32" />
                    {Array.from({ length: 5 }).map((_, i) => (
                        <SkeletonListItem key={i} />
                    ))}
                </div>
            </div>
        </div>
    );
}
