import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const LAST_ROUTE_KEY = 'lastVisitedRoute';

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isLoading } = useAuthStore();
  const location = useLocation();

  // Save the current route when user is authenticated
  useEffect(() => {
    if (user && !isLoading) {
      localStorage.setItem(LAST_ROUTE_KEY, location.pathname);
    }
  }, [user, location.pathname, isLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user) {
    // Save the attempted route before redirecting to login
    if (location.pathname !== '/auth/login') {
      localStorage.setItem(LAST_ROUTE_KEY, location.pathname);
    }
    return <Navigate to="/auth/login" replace />;
  }

  return <>{children}</>;
}
