import { lazy, Suspense } from 'react';
import { useDeferred3D } from '@/hooks/useDeferred3D';

// Lazy load the actual Three.js component
const FloatingGeometryCore = lazy(() =>
  import('./FloatingGeometry').then((module) => ({
    default: module.FloatingGeometry,
  }))
);

interface FloatingGeometryProps {
  color?: string;
}

/**
 * Lazy-loaded Floating Geometry component
 * Loads the Three.js chunk only after load + idle, never under reduced motion
 * or Save-Data (useDeferred3D).
 */
export function FloatingGeometry({ color = '#f59e0b' }: FloatingGeometryProps) {
  // Static gradient until load + idle, and for good under reduced motion or
  // Save-Data: the three chunk is not even requested then (US-260).
  const ready = useDeferred3D();
  const fallback = (
    <div
      className="fixed inset-0 -z-10 opacity-25"
      style={{
        background: `radial-gradient(circle at 30% 40%, ${color}15 0%, transparent 40%), radial-gradient(circle at 70% 60%, ${color}10 0%, transparent 40%)`,
      }}
    />
  );
  if (!ready) return fallback;

  return (
    <Suspense fallback={fallback}>
      <FloatingGeometryCore color={color} />
    </Suspense>
  );
}
