import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, ShieldAlert } from 'lucide-react';
import type { Session } from '@supabase/supabase-js';
import { useAuthStore } from '@/stores/useAuthStore';

const LAST_ROUTE_KEY = 'lastVisitedRoute';

interface RequireAuthProps {
  /** Also require the admin role. */
  requireAdmin?: boolean;
}

/**
 * The one route guard (US-120).
 *
 * There were two — ProtectedRoute and SecureRoute — with different state
 * machines, different loading and unauthorised screens, and both writing the
 * same `lastVisitedRoute` key. Which one a route got was historical rather than
 * considered, and a fix to one (the first-run onboarding gate, US-108) applied
 * only to the routes using it.
 *
 * A layout route rather than a wrapper, so App.tsx nests the protected routes
 * inside one element instead of repeating a wrapper on each. `requireAdmin`
 * replaces SecureRoute's only actual use — every call site passed exactly that
 * prop and nothing else.
 */
export default function RequireAuth({ requireAdmin = false }: RequireAuthProps) {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();
  const requiresMFA = useAuthStore((s) => s.requiresMFA);
  const mfaVerified = useAuthStore((s) => s.mfaVerified);
  const profile = useAuthStore((s) => s.profile);
  const role = useAuthStore((s) => s.role);

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();
      setSession(currentSession);
      setIsLoading(false);
    };

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fullPath = location.pathname + location.search + location.hash;

  // Remember where an authenticated agent was, for the post-login redirect.
  useEffect(() => {
    if (session && !isLoading) {
      localStorage.setItem(LAST_ROUTE_KEY, fullPath);
    }
  }, [session, fullPath, isLoading]);

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

  if (session === null) {
    // Don't save an auth route as the destination, or login loops.
    if (!location.pathname.startsWith('/auth/')) {
      localStorage.setItem(LAST_ROUTE_KEY, fullPath);
    }
    return <Navigate to="/auth/login" replace />;
  }

  // A valid session whose second factor is still pending must not reach the app.
  // (requiresMFA defaults to false, so this only affects users mid-MFA in the
  // current session — it never blocks users without MFA.)
  if (requiresMFA && !mfaVerified && !location.pathname.startsWith('/auth/')) {
    localStorage.setItem(LAST_ROUTE_KEY, fullPath);
    return <Navigate to="/auth/mfa" replace />;
  }

  // First run: send the agent through the wizard once.
  //
  // This check lived only in Login.tsx's password path, so anyone who signed up
  // with Google or Apple went straight to /dashboard and never saw onboarding
  // at all (US-108). Gated on `profile` being loaded, so a slow profile fetch
  // does not bounce an established user into the wizard; and it never redirects
  // away from the wizard itself.
  //
  // "Not onboarded" means the column is present and null. An ABSENT key is not
  // evidence of anything and must not redirect: `profile` can be a partial row
  // rehydrated from the persisted store, and production spent the US-108 window
  // with no onboarding_completed_at column at all, so `!profile.x` was true for
  // every user and sent all of them into a wizard that could not save. Read the
  // key, not its truthiness.
  const onboardingStateKnown = profile !== null && 'onboarding_completed_at' in profile;
  if (
    onboardingStateKnown &&
    !profile.onboarding_completed_at &&
    !location.pathname.startsWith('/onboarding')
  ) {
    return <Navigate to="/onboarding/wizard" replace />;
  }

  // Admin. Rendered rather than redirected: bouncing someone to /dashboard for
  // a page they are simply not allowed to see reads as a broken link.
  //
  // `role` is null while the store is still loading it, so this waits rather
  // than refusing — otherwise an admin gets a flash of "Access denied" on every
  // hard refresh of an admin page.
  if (requireAdmin) {
    if (role === null || role === undefined) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
        </div>
      );
    }
    if (role !== 'admin') {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="text-center max-w-sm">
            <ShieldAlert className="h-12 w-12 text-amber-500 mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Admin access required</h1>
            <p className="text-gray-600 text-sm mb-6">
              This page is part of the platform's own tooling. Your account does not have access to
              it.
            </p>
            <a
              href="/dashboard"
              className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 text-white font-medium"
            >
              Back to dashboard
            </a>
          </div>
        </div>
      );
    }
  }

  return <Outlet />;
}
