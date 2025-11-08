import { lazy, Suspense } from 'react';

// Lazy load the actual Three.js component
const FloatingGeometryCore = lazy(() => import('./FloatingGeometry').then(module => ({
  default: module.FloatingGeometry
})));

interface FloatingGeometryProps {
  color?: string;
}

/**
 * Lazy-loaded Floating Geometry component
 * Only loads Three.js when component is rendered
 */
export function FloatingGeometry({ color = '#f59e0b' }: FloatingGeometryProps) {
  return (
    <Suspense
      fallback={
        <div
          className="fixed inset-0 -z-10 opacity-25"
          style={{
            background: `radial-gradient(circle at 30% 40%, ${color}15 0%, transparent 40%), radial-gradient(circle at 70% 60%, ${color}10 0%, transparent 40%)`
          }}
        />
      }
    >
      <FloatingGeometryCore color={color} />
    </Suspense>
  );
}
