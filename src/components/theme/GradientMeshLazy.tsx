import { lazy, Suspense } from 'react';

// Lazy load the actual Three.js component
const GradientMeshCore = lazy(() => import('./GradientMesh').then(module => ({
  default: module.GradientMesh
})));

interface GradientMeshProps {
  color1?: string;
  color2?: string;
}

/**
 * Lazy-loaded Gradient Mesh component
 * Only loads Three.js when component is rendered
 */
export function GradientMesh({ color1 = '#6366f1', color2 = '#8b5cf6' }: GradientMeshProps) {
  return (
    <Suspense
      fallback={
        <div
          className="fixed inset-0 -z-10 opacity-20"
          style={{
            background: `radial-gradient(circle at 50% 50%, ${color1}20 0%, ${color2}10 50%, transparent 100%)`
          }}
        />
      }
    >
      <GradientMeshCore color1={color1} color2={color2} />
    </Suspense>
  );
}
