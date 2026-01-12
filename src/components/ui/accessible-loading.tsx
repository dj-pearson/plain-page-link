import * as React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface AccessibleSpinnerProps {
  /** Size of the spinner */
  size?: "sm" | "md" | "lg" | "xl";
  /** Color variant */
  variant?: "default" | "primary" | "muted";
  /** Additional CSS classes */
  className?: string;
  /** Accessible label for the spinner */
  label?: string;
}

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
  xl: "h-12 w-12",
};

const variantClasses = {
  default: "text-gray-600",
  primary: "text-blue-600",
  muted: "text-gray-400",
};

/**
 * AccessibleSpinner Component
 *
 * A simple accessible spinner with proper ARIA attributes.
 *
 * @example
 * <AccessibleSpinner size="lg" label="Loading data" />
 */
export function AccessibleSpinner({
  size = "md",
  variant = "primary",
  className,
  label = "Loading",
}: AccessibleSpinnerProps) {
  return (
    <div
      role="status"
      aria-label={label}
      className={cn("inline-flex items-center justify-center", className)}
    >
      <Loader2
        className={cn(
          "animate-spin",
          sizeClasses[size],
          variantClasses[variant]
        )}
        aria-hidden="true"
      />
      <span className="sr-only">{label}</span>
    </div>
  );
}

interface AccessibleLoadingProps {
  /** Whether content is currently loading */
  isLoading: boolean;
  /** Content to display when not loading */
  children: React.ReactNode;
  /** Loading message for screen readers */
  loadingMessage?: string;
  /** Complete message for screen readers (announced when loading finishes) */
  completeMessage?: string;
  /** Whether to show loading spinner inline with content */
  inline?: boolean;
  /** Size of the loading spinner */
  spinnerSize?: "sm" | "md" | "lg" | "xl";
  /** Custom loading component */
  loadingComponent?: React.ReactNode;
  /** Delay in ms before showing loading indicator (prevents flash for fast loads) */
  delay?: number;
  /** Minimum time to show loading indicator (prevents jarring flash) */
  minDuration?: number;
  /** Additional CSS classes for the container */
  className?: string;
}

/**
 * AccessibleLoading Component
 *
 * A wrapper component that handles loading states with proper accessibility.
 * Announces loading and completion to screen readers.
 *
 * @example
 * function DataList() {
 *   const { data, isLoading } = useQuery(...);
 *
 *   return (
 *     <AccessibleLoading
 *       isLoading={isLoading}
 *       loadingMessage="Loading your data..."
 *       completeMessage="Data loaded successfully"
 *     >
 *       <ul>
 *         {data?.map(item => <li key={item.id}>{item.name}</li>)}
 *       </ul>
 *     </AccessibleLoading>
 *   );
 * }
 */
export function AccessibleLoading({
  isLoading,
  children,
  loadingMessage = "Loading...",
  completeMessage = "Content loaded",
  inline = false,
  spinnerSize = "md",
  loadingComponent,
  delay = 0,
  minDuration = 0,
  className,
}: AccessibleLoadingProps) {
  const [showLoading, setShowLoading] = React.useState(false);
  const [announcement, setAnnouncement] = React.useState("");
  const loadingStartTime = React.useRef<number | null>(null);

  React.useEffect(() => {
    let delayTimer: ReturnType<typeof setTimeout> | null = null;
    let minDurationTimer: ReturnType<typeof setTimeout> | null = null;

    if (isLoading) {
      loadingStartTime.current = Date.now();

      if (delay > 0) {
        delayTimer = setTimeout(() => {
          setShowLoading(true);
          setAnnouncement(loadingMessage);
        }, delay);
      } else {
        setShowLoading(true);
        setAnnouncement(loadingMessage);
      }
    } else {
      if (delayTimer) {
        clearTimeout(delayTimer);
      }

      const elapsed = loadingStartTime.current
        ? Date.now() - loadingStartTime.current
        : 0;
      const remaining = Math.max(0, minDuration - elapsed);

      if (remaining > 0 && showLoading) {
        minDurationTimer = setTimeout(() => {
          setShowLoading(false);
          setAnnouncement(completeMessage);
        }, remaining);
      } else {
        setShowLoading(false);
        if (loadingStartTime.current) {
          setAnnouncement(completeMessage);
        }
      }

      loadingStartTime.current = null;
    }

    return () => {
      if (delayTimer) clearTimeout(delayTimer);
      if (minDurationTimer) clearTimeout(minDurationTimer);
    };
  }, [isLoading, delay, minDuration, loadingMessage, completeMessage, showLoading]);

  // Clear announcement after it's been read
  React.useEffect(() => {
    if (announcement) {
      const timer = setTimeout(() => setAnnouncement(""), 1000);
      return () => clearTimeout(timer);
    }
  }, [announcement]);

  const loadingIndicator = loadingComponent ?? (
    <div className={cn(
      "flex items-center justify-center",
      inline ? "inline-flex" : "py-8"
    )}>
      <AccessibleSpinner size={spinnerSize} label={loadingMessage} />
    </div>
  );

  return (
    <div
      className={className}
      aria-busy={showLoading}
    >
      {/* Live region for announcements */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {announcement}
      </div>

      {showLoading ? loadingIndicator : children}
    </div>
  );
}

interface FullPageLoadingProps {
  /** Loading message */
  message?: string;
  /** Whether to show the loading overlay */
  isLoading?: boolean;
}

/**
 * FullPageLoading Component
 *
 * A full-page loading overlay with accessibility support.
 *
 * @example
 * function App() {
 *   const { isInitializing } = useAuth();
 *
 *   return (
 *     <>
 *       <FullPageLoading isLoading={isInitializing} message="Initializing..." />
 *       <Routes>...</Routes>
 *     </>
 *   );
 * }
 */
export function FullPageLoading({
  message = "Loading...",
  isLoading = true,
}: FullPageLoadingProps) {
  if (!isLoading) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm"
      role="alert"
      aria-busy="true"
    >
      <div className="flex flex-col items-center gap-4">
        <AccessibleSpinner size="xl" label={message} />
        <p className="text-lg font-medium text-gray-700" aria-hidden="true">
          {message}
        </p>
      </div>
    </div>
  );
}

interface SkeletonProps {
  /** Width of the skeleton */
  width?: string | number;
  /** Height of the skeleton */
  height?: string | number;
  /** Whether to show as a circle */
  circle?: boolean;
  /** Number of skeleton lines */
  lines?: number;
  /** Additional CSS classes */
  className?: string;
  /** Accessible label for the skeleton */
  label?: string;
}

/**
 * AccessibleSkeleton Component
 *
 * An accessible skeleton loading placeholder.
 *
 * @example
 * <AccessibleSkeleton lines={3} label="Loading article content" />
 */
export function AccessibleSkeleton({
  width,
  height,
  circle = false,
  lines = 1,
  className,
  label = "Loading content",
}: SkeletonProps) {
  const style: React.CSSProperties = {
    width: typeof width === "number" ? `${width}px` : width,
    height: typeof height === "number" ? `${height}px` : height,
  };

  const baseClasses = cn(
    "animate-pulse bg-gray-200 dark:bg-gray-700",
    circle ? "rounded-full" : "rounded",
    className
  );

  if (lines > 1) {
    return (
      <div
        role="status"
        aria-label={label}
        className="space-y-2"
      >
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={cn(baseClasses, "h-4")}
            style={{
              width: index === lines - 1 ? "75%" : "100%",
            }}
            aria-hidden="true"
          />
        ))}
        <span className="sr-only">{label}</span>
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-label={label}
      className={baseClasses}
      style={style}
    >
      <span className="sr-only">{label}</span>
    </div>
  );
}

interface ProgressBarProps {
  /** Current progress (0-100) */
  value: number;
  /** Maximum value (defaults to 100) */
  max?: number;
  /** Accessible label */
  label: string;
  /** Whether to show the percentage text */
  showPercentage?: boolean;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Additional CSS classes */
  className?: string;
}

const progressSizeClasses = {
  sm: "h-1",
  md: "h-2",
  lg: "h-4",
};

/**
 * AccessibleProgressBar Component
 *
 * An accessible progress bar with proper ARIA attributes.
 *
 * @example
 * <AccessibleProgressBar value={75} label="Upload progress" showPercentage />
 */
export function AccessibleProgressBar({
  value,
  max = 100,
  label,
  showPercentage = false,
  size = "md",
  className,
}: ProgressBarProps) {
  const percentage = Math.round((value / max) * 100);

  return (
    <div className={cn("w-full", className)}>
      {showPercentage && (
        <div className="flex justify-between mb-1">
          <span className="text-sm font-medium text-gray-700">{label}</span>
          <span className="text-sm font-medium text-gray-700">{percentage}%</span>
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label}
        className={cn(
          "w-full bg-gray-200 rounded-full overflow-hidden",
          progressSizeClasses[size]
        )}
      >
        <div
          className={cn(
            "bg-blue-600 rounded-full transition-all duration-300 ease-in-out",
            progressSizeClasses[size]
          )}
          style={{ width: `${percentage}%` }}
          aria-hidden="true"
        />
      </div>
      {!showPercentage && <span className="sr-only">{label}: {percentage}%</span>}
    </div>
  );
}

export {
  AccessibleSpinner,
  AccessibleLoading,
  FullPageLoading,
  AccessibleSkeleton,
  AccessibleProgressBar,
};
