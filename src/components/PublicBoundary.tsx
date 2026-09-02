import { Outlet } from 'react-router-dom';
import { RouteErrorBoundary } from './RouteErrorBoundary';

/**
 * The error boundary for every public route (US-120).
 *
 * RouteErrorBoundary was applied to the dashboard, the admin pages, the two
 * tools and the two profile routes — and to nothing else. The 13 public and
 * legal and blog routes, the 5 landing pages, the 5 feature pages and the 7
 * auth routes had no boundary at all, so a render error on any of them was a
 * white screen with no way back.
 *
 * A layout route, so a page is added to the group by nesting rather than by
 * remembering to wrap it.
 */
export default function PublicBoundary() {
  return (
    <RouteErrorBoundary section="Page" backPath="/" backLabel="Home">
      <Outlet />
    </RouteErrorBoundary>
  );
}
