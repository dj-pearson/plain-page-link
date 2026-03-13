import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  text?: string;
}

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-8 w-8",
  lg: "h-12 w-12",
  xl: "h-16 w-16",
};

/**
 * Unified LoadingSpinner component
 * Use this as the single source of truth for loading states across the app
 */
export const LoadingSpinner = ({
  size = "md",
  className = "",
  text
}: LoadingSpinnerProps) => {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-2", className)}>
      <Loader2 className={cn("animate-spin text-primary", sizeClasses[size])} />
      {text && <p className="text-sm text-muted-foreground">{text}</p>}
    </div>
  );
};

/**
 * Card-level loading state - use inside cards or content sections
 */
export const LoadingCard = ({ className }: { className?: string }) => {
  return (
    <div className={cn("flex items-center justify-center p-8", className)}>
      <LoadingSpinner size="lg" />
    </div>
  );
};

/**
 * Full page loader - use for route transitions and initial page loads
 * Provides a centered loading indicator with optional text
 */
export const FullPageLoader = ({ text }: { text?: string }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <LoadingSpinner size="xl" />
        <p className="mt-4 text-lg text-muted-foreground font-medium">
          {text || "Loading..."}
        </p>
      </div>
    </div>
  );
};

/**
 * Overlay loader - use for blocking operations that need a backdrop
 * Useful for form submissions or async operations
 */
export const OverlayLoader = ({ text }: { text?: string }) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
      <div className="text-center">
        <LoadingSpinner size="xl" />
        <p className="mt-4 text-muted-foreground font-medium">
          {text || "Loading..."}
        </p>
      </div>
    </div>
  );
};

/**
 * Skeleton loading placeholder for content
 * Use for anticipatory loading states that show content structure
 */
export const SkeletonLine = ({
  className,
  width = "full"
}: {
  className?: string;
  width?: "full" | "3/4" | "1/2" | "1/4";
}) => {
  const widthClasses = {
    full: "w-full",
    "3/4": "w-3/4",
    "1/2": "w-1/2",
    "1/4": "w-1/4",
  };

  return (
    <div
      className={cn(
        "h-4 bg-muted animate-pulse rounded",
        widthClasses[width],
        className
      )}
    />
  );
};

/**
 * Skeleton card for loading card-based content
 */
export const SkeletonCard = ({ className }: { className?: string }) => {
  return (
    <div className={cn("p-4 border rounded-lg space-y-3", className)}>
      <SkeletonLine width="3/4" />
      <SkeletonLine width="full" />
      <SkeletonLine width="1/2" />
    </div>
  );
};

/**
 * Profile skeleton for loading user profiles
 * Mirrors the FullProfilePage layout structure for perceived performance
 */
export const ProfileSkeleton = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
      <div className="container mx-auto px-3 sm:px-4 max-w-5xl space-y-4 sm:space-y-6">
        {/* Profile Header skeleton */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
            <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-full bg-gray-200 animate-pulse flex-shrink-0" />
            <div className="flex-1 space-y-3 text-center sm:text-left w-full">
              <div className="h-7 bg-gray-200 animate-pulse rounded w-48 mx-auto sm:mx-0" />
              <div className="h-4 bg-gray-200 animate-pulse rounded w-32 mx-auto sm:mx-0" />
              <div className="h-4 bg-gray-200 animate-pulse rounded w-full max-w-md mx-auto sm:mx-0" />
              <div className="h-4 bg-gray-200 animate-pulse rounded w-3/4 max-w-sm mx-auto sm:mx-0" />
              {/* Trust badges */}
              <div className="flex gap-3 justify-center sm:justify-start pt-2">
                <div className="h-10 w-20 bg-gray-200 animate-pulse rounded-lg" />
                <div className="h-10 w-20 bg-gray-200 animate-pulse rounded-lg" />
                <div className="h-10 w-20 bg-gray-200 animate-pulse rounded-lg" />
              </div>
            </div>
          </div>
        </div>

        {/* Contact Buttons skeleton */}
        <div className="flex gap-3 justify-center">
          <div className="h-12 w-32 bg-gray-200 animate-pulse rounded-lg" />
          <div className="h-12 w-32 bg-gray-200 animate-pulse rounded-lg" />
          <div className="h-12 w-32 bg-gray-200 animate-pulse rounded-lg" />
        </div>

        {/* Featured Carousel skeleton */}
        <div className="h-[400px] md:h-[500px] bg-gray-200 animate-pulse rounded-xl" />

        {/* Listing Cards skeleton */}
        <div>
          <div className="h-7 bg-gray-200 animate-pulse rounded w-40 mb-4" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-xl overflow-hidden border border-gray-100">
                <div className="h-52 bg-gray-200 animate-pulse" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-200 animate-pulse rounded w-3/4" />
                  <div className="h-3 bg-gray-200 animate-pulse rounded w-1/2" />
                  <div className="flex gap-4">
                    <div className="h-4 w-12 bg-gray-200 animate-pulse rounded" />
                    <div className="h-4 w-12 bg-gray-200 animate-pulse rounded" />
                    <div className="h-4 w-16 bg-gray-200 animate-pulse rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Default export for backward compatibility
export default LoadingSpinner;
