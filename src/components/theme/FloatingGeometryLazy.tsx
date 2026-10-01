import { lazy, Suspense } from 'react';

// Lazy load the actual Three.js component
const FloatingGeometryCore = lazy(() => import('./FloatingGeometry').then(module => ({
  default: module.FloatingGeometry
})));

interface FloatingGeometryProps {
  color?: string;
  /** false: one still frame (US-236). */
  animate?: boolean;
}

/**
 * Lazy-loaded Floating Geometry component
 * Only loads Three.js when component is rendered
 */
export function FloatingGeometry({ color = '#f59e0b', animate = true }: FloatingGeometryProps) {
  return (
    <Suspense
      fallback={
        <div
          className="fixed inset-0 -z-10 opacity-25"
          aria-hidden="true"
          style={{
            background: `radial-gradient(circle at 30% 40%, ${color}15 0%, transparent 40%), radial-gradient(circle at 70% 60%, ${color}10 0%, transparent 40%)`
          }}
        />
      }
    >
      <FloatingGeometryCore color={color} animate={animate} />
    </Suspense>
  );
}
