import { lazy, Suspense } from 'react';
import { useDeferred3D } from '@/hooks/useDeferred3D';

// Lazy load the actual Three.js component
const GradientMeshCore = lazy(() =>
  import('./GradientMesh').then((module) => ({
    default: module.GradientMesh,
  }))
);

interface GradientMeshProps {
  color1?: string;
  color2?: string;
}

/**
 * Lazy-loaded Gradient Mesh component
 * Loads the Three.js chunk only after load + idle, never under reduced motion
 * or Save-Data (useDeferred3D).
 */
export function GradientMesh({ color1 = '#6366f1', color2 = '#8b5cf6' }: GradientMeshProps) {
  // Static gradient until load + idle, and for good under reduced motion or
  // Save-Data: the three chunk is not even requested then (US-260).
  const ready = useDeferred3D();
  const fallback = (
    <div
      className="fixed inset-0 -z-10 opacity-20"
      style={{
        background: `radial-gradient(circle at 50% 50%, ${color1}20 0%, ${color2}10 50%, transparent 100%)`,
      }}
    />
  );
  if (!ready) return fallback;

  return (
    <Suspense fallback={fallback}>
      <GradientMeshCore color1={color1} color2={color2} />
    </Suspense>
  );
}
