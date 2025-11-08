import { lazy, Suspense } from 'react';

// Lazy load the actual Three.js component
const Hero3DCore = lazy(() => import('./Hero3D').then(module => ({
  default: module.Hero3D
})));

interface Hero3DProps {
  className?: string;
  height?: string;
}

/**
 * Lazy-loaded 3D Hero component
 * Only loads massive Three.js bundle when component is rendered
 * Saves ~888KB on initial page load
 */
export function Hero3D({ className = '', height = '600px' }: Hero3DProps) {
  return (
    <Suspense
      fallback={
        <div
          className={`relative overflow-hidden rounded-2xl ${className}`}
          style={{ height }}
        >
          {/* Lightweight CSS-only fallback */}
          <div className="absolute inset-0 bg-glass-background backdrop-blur-sm border border-glass-border rounded-2xl" />
          <div className="absolute inset-0 bg-gradient-to-br from-[#80d0c7]/10 via-transparent to-[#a1c4fd]/10 rounded-2xl" />

          {/* Loading indicator */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-glass-border rounded-full animate-pulse" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 bg-gradient-to-br from-[#80d0c7] to-[#a1c4fd] rounded-full animate-ping" />
              </div>
            </div>
          </div>

          {/* Bottom fade */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/20 to-transparent rounded-b-2xl pointer-events-none" />
        </div>
      }
    >
      <Hero3DCore className={className} height={height} />
    </Suspense>
  );
}
