import { ReactNode } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { cn } from '@/lib/utils';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
  threshold?: number;
  disabled?: boolean;
}

export function PullToRefresh({
  onRefresh,
  children,
  threshold = 80,
  disabled = false,
}: PullToRefreshProps) {
  const { containerRef, isPulling, isRefreshing, pullDistance } = usePullToRefresh({
    onRefresh,
    threshold,
    disabled,
  });

  const progress = Math.min((pullDistance / threshold) * 100, 100);
  const shouldShowIndicator = pullDistance > 10;

  return (
    <div ref={containerRef} className="relative h-full overflow-y-auto momentum-scroll">
      {/* Pull indicator */}
      <div
        className={cn(
          'absolute top-0 left-0 right-0 flex items-center justify-center transition-all duration-200 z-50',
          shouldShowIndicator ? 'opacity-100' : 'opacity-0'
        )}
        style={{
          height: `${Math.min(pullDistance, threshold * 1.5)}px`,
          transform: `translateY(-${threshold * 1.5 - pullDistance}px)`,
        }}
      >
        <div className="flex flex-col items-center gap-2 text-primary">
          {isRefreshing ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="text-xs font-medium">Refreshing...</span>
            </>
          ) : (
            <>
              <RefreshCw
                className={cn(
                  'w-6 h-6 transition-transform duration-200',
                  progress >= 100 && 'rotate-180'
                )}
                style={{
                  transform: `rotate(${progress * 1.8}deg)`,
                }}
              />
              <span className="text-xs font-medium">
                {progress >= 100 ? 'Release to refresh' : 'Pull to refresh'}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div
        className="transition-transform duration-200"
        style={{
          transform: isRefreshing
            ? `translateY(${threshold}px)`
            : `translateY(${pullDistance}px)`,
        }}
      >
        {children}
      </div>
    </div>
  );
}
