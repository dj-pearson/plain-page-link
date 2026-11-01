import { lazy, Suspense } from 'react';
import { useDeferred3D } from '@/hooks/useDeferred3D';

// Lazy load the actual Three.js component
const ThreeDBackgroundCore = lazy(() =>
  import('./ThreeDBackground').then((module) => ({
    default: module.ThreeDBackground,
  }))
);

interface ThreeDBackgroundProps {
  variant: 'particles' | 'waves' | 'spiral';
  color?: string;
}

/**
 * Lazy-loaded Three.js background component
 * Loads the Three.js chunk only after load + idle, never under reduced motion
 * or Save-Data (useDeferred3D).
 */
export function ThreeDBackground({ variant, color = '#2563eb' }: ThreeDBackgroundProps) {
  // Static gradient until load + idle, and for good under reduced motion or
  // Save-Data: the three chunk is not even requested then (US-260).
  const ready = useDeferred3D();
  const fallback = (
    <div
      className="fixed inset-0 -z-10 opacity-30"
      style={{
        background: `radial-gradient(circle at 20% 50%, ${color}15 0%, transparent 50%), radial-gradient(circle at 80% 80%, ${color}10 0%, transparent 50%)`,
      }}
    />
  );
  if (!ready) return fallback;

  return (
    <Suspense fallback={fallback}>
      <ThreeDBackgroundCore variant={variant} color={color} />
    </Suspense>
  );
}
