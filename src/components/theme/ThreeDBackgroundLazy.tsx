import { lazy, Suspense } from 'react';

// Lazy load the actual Three.js component
const ThreeDBackgroundCore = lazy(() => import('./ThreeDBackground').then(module => ({
  default: module.ThreeDBackground
})));

interface ThreeDBackgroundProps {
  variant: 'particles' | 'waves' | 'spiral';
  color?: string;
  /** false: one still frame (US-236). */
  animate?: boolean;
}

/**
 * Lazy-loaded Three.js background component
 * Only loads 888KB Three.js bundle when component is rendered
 */
export function ThreeDBackground({ variant, color = '#2563eb', animate = true }: ThreeDBackgroundProps) {
  return (
    <Suspense
      fallback={
        <div
          className="fixed inset-0 -z-10 opacity-30"
          aria-hidden="true"
          style={{
            background: `radial-gradient(circle at 20% 50%, ${color}15 0%, transparent 50%), radial-gradient(circle at 80% 80%, ${color}10 0%, transparent 50%)`
          }}
        />
      }
    >
      <ThreeDBackgroundCore variant={variant} color={color} animate={animate} />
    </Suspense>
  );
}
