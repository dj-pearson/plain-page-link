import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Whether to animate the skeleton with a pulse effect
   * @default true
   */
  animate?: boolean;
}

/**
 * Skeleton component for loading states
 * Use this to show a placeholder while content is loading
 */
function Skeleton({ className, animate = true, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "rounded-md bg-gray-200",
        animate && "animate-pulse",
        className
      )}
      aria-hidden="true"
      {...props}
    />
  );
}

/**
 * Skeleton for text content
 */
function SkeletonText({
  lines = 1,
  className,
  lastLineWidth = "75%"
}: {
  lines?: number;
  className?: string;
  lastLineWidth?: string;
}) {
  return (
    <div className={cn("space-y-2", className)} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-4"
          style={{
            width: i === lines - 1 && lines > 1 ? lastLineWidth : "100%"
          }}
        />
      ))}
    </div>
  );
}

/**
 * Skeleton for card content with common dashboard patterns
 */
function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-lg border border-gray-200 bg-white p-4 sm:p-6",
        className
      )}
      aria-hidden="true"
    >
      <Skeleton className="h-4 w-1/3 mb-4" />
      <Skeleton className="h-8 w-1/2 mb-2" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  );
}

/**
 * Skeleton for stats cards (used in dashboard)
 */
function SkeletonStatsCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-lg border border-gray-200 bg-white p-4 sm:p-6",
        className
      )}
      aria-hidden="true"
    >
      <div className="flex items-center justify-between mb-3">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
      <Skeleton className="h-7 w-16 mb-1" />
      <Skeleton className="h-3 w-24" />
    </div>
  );
}

/**
 * Skeleton for list items (leads, listings, etc.)
 */
function SkeletonListItem({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-lg border border-gray-200 bg-white p-4 sm:p-6",
        className
      )}
      aria-hidden="true"
    >
      <div className="flex items-start gap-4">
        <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-36" />
        </div>
        <Skeleton className="h-4 w-20" />
      </div>
    </div>
  );
}

/**
 * Skeleton for chart/graph areas
 */
function SkeletonChart({
  className,
  height = 300
}: {
  className?: string;
  height?: number;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-gray-200 bg-white p-4 sm:p-6",
        className
      )}
      aria-hidden="true"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <Skeleton className="h-5 w-32 mb-2" />
          <Skeleton className="h-3 w-48" />
        </div>
      </div>
      <Skeleton
        className="w-full rounded-lg"
        style={{ height: `${height}px` }}
      />
    </div>
  );
}

/**
 * Analytics page skeleton
 */
function SkeletonAnalytics() {
  return (
    <div className="space-y-4 sm:space-y-6" role="status" aria-label="Loading analytics">
      {/* Header skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-28" />
        </div>
      </div>

      {/* Stats cards skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <SkeletonStatsCard />
        <SkeletonStatsCard />
        <SkeletonStatsCard />
        <SkeletonStatsCard />
      </div>

      {/* Chart skeleton */}
      <SkeletonChart height={250} />

      {/* Two column grid skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <SkeletonCard />
        <SkeletonCard />
      </div>

      <span className="sr-only">Loading analytics data...</span>
    </div>
  );
}

/**
 * Leads page skeleton
 */
function SkeletonLeads() {
  return (
    <div className="space-y-4 sm:space-y-6" role="status" aria-label="Loading leads">
      {/* Header skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-56" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-28" />
        </div>
      </div>

      {/* Stats cards skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <SkeletonStatsCard />
        <SkeletonStatsCard />
        <SkeletonStatsCard />
        <SkeletonStatsCard />
      </div>

      {/* Search bar skeleton */}
      <Skeleton className="h-11 w-full rounded-lg" />

      {/* Lead items skeleton */}
      <div className="space-y-2 sm:space-y-3">
        <SkeletonListItem />
        <SkeletonListItem />
        <SkeletonListItem />
        <SkeletonListItem />
      </div>

      <span className="sr-only">Loading leads data...</span>
    </div>
  );
}

/**
 * Listings page skeleton
 */
function SkeletonListings() {
  return (
    <div className="space-y-4 sm:space-y-6" role="status" aria-label="Loading listings">
      {/* Header skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <Skeleton className="h-8 w-40 mb-2" />
          <Skeleton className="h-4 w-52" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Grid of listing cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-lg border border-gray-200 bg-white overflow-hidden"
            aria-hidden="true"
          >
            <Skeleton className="h-48 w-full rounded-none" />
            <div className="p-4 space-y-3">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <div className="flex gap-2">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-6 w-16" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <span className="sr-only">Loading listings data...</span>
    </div>
  );
}

/**
 * Profile page skeleton
 */
function SkeletonProfile() {
  return (
    <div className="space-y-6" role="status" aria-label="Loading profile">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-9 w-40 mb-2" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Profile Photo section skeleton */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <Skeleton className="h-5 w-28 mb-4" />
        <div className="flex items-center gap-6">
          <Skeleton className="w-24 h-24 rounded-full" />
          <div>
            <Skeleton className="h-5 w-28 mb-1" />
            <Skeleton className="h-4 w-44 mb-3" />
            <Skeleton className="h-9 w-28" />
          </div>
        </div>
      </div>

      {/* Tabs skeleton */}
      <div className="space-y-6">
        <div className="flex gap-2 border-b border-gray-200 pb-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-16" />
        </div>

        {/* Form section skeleton */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <Skeleton className="h-5 w-36 mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div>
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="md:col-span-2">
              <Skeleton className="h-4 w-32 mb-2" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </div>

        {/* Bio section skeleton */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <Skeleton className="h-5 w-32 mb-4" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-4 w-28 mt-2" />
        </div>
      </div>

      <span className="sr-only">Loading profile data...</span>
    </div>
  );
}

export {
  Skeleton,
  SkeletonText,
  SkeletonCard,
  SkeletonStatsCard,
  SkeletonListItem,
  SkeletonChart,
  SkeletonAnalytics,
  SkeletonLeads,
  SkeletonListings,
  SkeletonProfile
};
