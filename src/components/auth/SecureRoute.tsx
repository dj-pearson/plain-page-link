/**
 * SecureRoute Component
 *
 * Enhanced route protection with defense-in-depth security layers.
 * Use this for routes that require specific permissions or admin access.
 *
 * Security Layers Applied:
 * 1. Authentication - Verifies user is logged in
 * 2. Authorization - Checks role/permissions
 * 3. MFA - Validates MFA if required
 *
 * @example
 * ```tsx
 * // Admin-only route
 * <SecureRoute requireAdmin>
 *   <AdminDashboard />
 * </SecureRoute>
 *
 * // Permission-based route
 * <SecureRoute permission="analytics.view_all">
 *   <AnalyticsDashboard />
 * </SecureRoute>
 *
 * // Multiple permissions required
 * <SecureRoute permissions={['listing.manage', 'lead.manage']}>
 *   <ManagementPanel />
 * </SecureRoute>
 * ```
 */

import { useEffect, useState, ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2, ShieldAlert, Lock } from 'lucide-react';
import { useSecurity } from '@/hooks/useSecurity';
import type { Permission } from '@/lib/security/types';

// ============================================================
// Component Props
// ============================================================

interface SecureRouteProps {
  children: ReactNode;

  /** Require admin role */
  requireAdmin?: boolean;

  /** Required permission */
  permission?: Permission;

  /** Required permissions (all must be present) */
  permissions?: Permission[];

  /** Minimum role level required */
  minRoleLevel?: number;

  /** Require MFA verification */
  requireMFA?: boolean;

  /** Custom loading component */
  loadingComponent?: ReactNode;

  /** Custom unauthorized component */
  unauthorizedComponent?: ReactNode;

  /** Redirect path for unauthorized users (default: /auth/login) */
  unauthorizedRedirect?: string;

  /** Redirect path for authenticated but unauthorized users (default: /dashboard) */
  forbiddenRedirect?: string;
}

// ============================================================
// Internal State
// ============================================================

interface SecurityState {
  status: 'loading' | 'authorized' | 'unauthenticated' | 'unauthorized' | 'mfa_required';
  message?: string;
}

// ============================================================
// Component
// ============================================================

const LAST_ROUTE_KEY = 'lastVisitedRoute';

function getFullPath(location: ReturnType<typeof useLocation>): string {
  return location.pathname + location.search + location.hash;
}

export default function SecureRoute({
  children,
  requireAdmin = false,
  permission,
  permissions,
  minRoleLevel,
  requireMFA = false,
  loadingComponent,
  unauthorizedComponent,
  unauthorizedRedirect = '/auth/login',
  forbiddenRedirect = '/dashboard',
}: SecureRouteProps) {
  const location = useLocation();
  const {
    isLoading,
    isAuthenticated,
    isAdmin,
    hasPermission,
    hasAllPermissions,
    hasRoleLevel,
    context,
  } = useSecurity();

  const [securityState, setSecurityState] = useState<SecurityState>({ status: 'loading' });

  // Perform security checks
  useEffect(() => {
    async function checkSecurity() {
      // Wait for security context to load
      if (isLoading) {
        setSecurityState({ status: 'loading' });
        return;
      }

      // Layer 1: Authentication check
      if (!isAuthenticated) {
        setSecurityState({
          status: 'unauthenticated',
          message: 'Please sign in to access this page',
        });
        return;
      }

      // MFA check (if required)
      if (requireMFA && context && !context.isMFAVerified) {
        setSecurityState({
          status: 'mfa_required',
          message: 'Multi-factor authentication required',
        });
        return;
      }

      // Layer 2: Authorization checks
      // Admin check
      if (requireAdmin && !isAdmin) {
        setSecurityState({
          status: 'unauthorized',
          message: 'Admin access required',
        });
        return;
      }

      // Single permission check
      if (permission) {
        const hasPermissionResult = await hasPermission(permission);
        if (!hasPermissionResult) {
          setSecurityState({
            status: 'unauthorized',
            message: `Missing required permission: ${permission}`,
          });
          return;
        }
      }

      // Multiple permissions check
      if (permissions && permissions.length > 0) {
        const hasAllResult = await hasAllPermissions(permissions);
        if (!hasAllResult) {
          setSecurityState({
            status: 'unauthorized',
            message: 'Missing required permissions',
          });
          return;
        }
      }

      // Role level check
      if (minRoleLevel !== undefined) {
        const meetsLevel = await hasRoleLevel(minRoleLevel);
        if (!meetsLevel) {
          setSecurityState({
            status: 'unauthorized',
            message: 'Insufficient access level',
          });
          return;
        }
      }

      // All checks passed
      setSecurityState({ status: 'authorized' });
    }

    checkSecurity();
  }, [
    isLoading,
    isAuthenticated,
    isAdmin,
    requireAdmin,
    permission,
    permissions,
    minRoleLevel,
    requireMFA,
    context,
    hasPermission,
    hasAllPermissions,
    hasRoleLevel,
  ]);

  // Save current route for post-login redirect
  useEffect(() => {
    if (securityState.status === 'authorized') {
      const fullPath = getFullPath(location);
      localStorage.setItem(LAST_ROUTE_KEY, fullPath);
    }
  }, [securityState.status, location]);

  // Render based on security state
  switch (securityState.status) {
    case 'loading':
      return loadingComponent || <LoadingState />;

    case 'unauthenticated':
      // Save attempted route for post-login redirect
      if (!location.pathname.startsWith('/auth/')) {
        localStorage.setItem(LAST_ROUTE_KEY, getFullPath(location));
      }
      return <Navigate to={unauthorizedRedirect} replace />;

    case 'mfa_required':
      return <Navigate to="/auth/mfa" replace />;

    case 'unauthorized':
      return unauthorizedComponent || (
        <UnauthorizedState message={securityState.message} redirectPath={forbiddenRedirect} />
      );

    case 'authorized':
      return <>{children}</>;

    default:
      return <LoadingState />;
  }
}

// ============================================================
// Sub-components
// ============================================================

function LoadingState() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
        <p className="text-gray-600 text-sm">Verifying access...</p>
      </div>
    </div>
  );
}

interface UnauthorizedStateProps {
  message?: string;
  redirectPath: string;
}

function UnauthorizedState({ message, redirectPath }: UnauthorizedStateProps) {
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          window.location.href = redirectPath;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [redirectPath]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full mx-auto p-8">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="h-8 w-8 text-red-600" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>

          <p className="text-gray-600 mb-4">
            {message || "You don't have permission to access this page."}
          </p>

          <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-6">
            <Lock className="h-4 w-4" />
            <span>Redirecting in {countdown} seconds...</span>
          </div>

          <a
            href={redirectPath}
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Go to Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// HOC for Class Components
// ============================================================

/**
 * Higher-order component for securing class components
 */
export function withSecureRoute<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: Omit<SecureRouteProps, 'children'>
) {
  return function SecuredComponent(props: P) {
    return (
      <SecureRoute {...options}>
        <WrappedComponent {...props} />
      </SecureRoute>
    );
  };
}
