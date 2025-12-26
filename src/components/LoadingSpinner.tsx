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
 */
export const ProfileSkeleton = () => {
  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header skeleton */}
        <div className="flex items-center gap-4">
          <div className="h-24 w-24 rounded-full bg-muted animate-pulse" />
          <div className="space-y-2 flex-1">
            <SkeletonLine width="1/2" className="h-6" />
            <SkeletonLine width="3/4" />
            <SkeletonLine width="1/4" />
          </div>
        </div>
        {/* Content skeleton */}
        <div className="grid gap-4 md:grid-cols-2">
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <SkeletonCard className="h-48" />
      </div>
    </div>
  );
};

// Default export for backward compatibility
export default LoadingSpinner;
