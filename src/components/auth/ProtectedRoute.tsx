import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const LAST_ROUTE_KEY = 'lastVisitedRoute';

/**
 * Gets the full current location including pathname, search, and hash
 */
function getFullPath(location: ReturnType<typeof useLocation>): string {
  return location.pathname + location.search + location.hash;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isLoading } = useAuthStore();
  const location = useLocation();

  // Save the full current route (with query params and hash) when user is authenticated
  useEffect(() => {
    if (user && !isLoading) {
      const fullPath = getFullPath(location);
      localStorage.setItem(LAST_ROUTE_KEY, fullPath);
    }
  }, [user, location, isLoading]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 text-sm">Verifying session...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, save attempted route and redirect to login
  if (!user) {
    const fullPath = getFullPath(location);
    // Save the attempted route before redirecting to login
    // Don't save if already on login page to avoid redirect loops
    if (location.pathname !== '/auth/login') {
      localStorage.setItem(LAST_ROUTE_KEY, fullPath);
    }
    return <Navigate to="/auth/login" replace />;
  }

  return <>{children}</>;
}
