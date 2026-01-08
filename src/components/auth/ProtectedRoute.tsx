import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import type { Session } from '@supabase/supabase-js';

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

/**
 * ProtectedRoute Component
 * 
 * Best Practices from AUTH_SETUP_DOCUMENTATION.md:
 * - Uses onAuthStateChange listener for real-time session updates
 * - Prevents race conditions with proper loading states
 * - Cleans up subscriptions on unmount
 * - Preserves intended route for post-login redirect
 * - Shows loading state to prevent flash of unauthenticated content
 */
export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    // Check existing session on mount
    const checkSession = async () => {
      const { data: { session: currentSession }, error } = await supabase.auth.getSession();
      setSession(currentSession);
      setIsLoading(false);
    };

    checkSession();

    // Listen for auth state changes (sign in, sign out, token refresh, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, currentSession) => {
        setSession(currentSession);
        setIsLoading(false);
      }
    );

    // Cleanup: unsubscribe from auth state changes on unmount
    return () => subscription.unsubscribe();
  }, []);

  // Save the full current route when user is authenticated
  useEffect(() => {
    if (session && !isLoading) {
      const fullPath = getFullPath(location);
      localStorage.setItem(LAST_ROUTE_KEY, fullPath);
    }
  }, [session, location, isLoading]);

  // Show loading state while checking authentication
  // This prevents flash of redirect or unauthorized content
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

  // Redirect to auth if no session
  // Save attempted route for post-login redirect
  if (session === null) {
    const fullPath = getFullPath(location);
    // Save the attempted route before redirecting to login
    // Don't save if already on login/register pages to avoid redirect loops
    if (!location.pathname.startsWith('/auth/')) {
      localStorage.setItem(LAST_ROUTE_KEY, fullPath);
    }
    return <Navigate to="/auth/login" replace />;
  }

  return <>{children}</>;
}
