/**
 * Unified Security Hook
 *
 * Combines all security layers into a single, easy-to-use React hook.
 * This is the primary interface for security checks in React components.
 *
 * Defense-in-Depth Layers:
 * 1. Authentication - WHO are you?
 * 2. Authorization - WHAT can you do?
 * 3. Ownership - IS this yours?
 * 4. Database RLS - FINAL enforcement
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import {
  requireAuth,
  checkAuth,
  getSecurityContext,
  clearAuthCache,
  AuthenticationError,
  SessionExpiredError,
} from '@/lib/security/authentication';
import {
  hasPermission,
  hasAllPermissions,
  hasAnyPermission,
  requirePermission,
  requireAdmin,
  isAdmin,
  checkPermission,
  roleHasPermission,
  getRoleLevel,
  AuthorizationError,
} from '@/lib/security/authorization';
import {
  isResourceOwner,
  canAccessOwnedResource,
  requireOwnership,
  requireOwnershipOrAdmin,
  fetchOwnedResource,
  validateOwnershipForMutation,
  createUserScopedQuery,
  checkOwnership,
  checkOwnershipOrAdmin,
  OwnershipError,
} from '@/lib/security/ownership';
import {
  sanitizeHtml,
  stripHtml,
  sanitizeUrl,
  validateResourceId,
  isValidUUID,
  isValidEmail,
  isValidPhone,
  validateString,
  validateObject,
  sanitizeProfileInput,
  sanitizeListingInput,
  sanitizeLeadInput,
  sanitizeLinkInput,
  isRateLimited,
  resetRateLimit,
  ValidationError,
} from '@/lib/security/validation';
import type {
  Permission,
  AppRole,
  ResourceType,
  SecurityContext,
  SecurityCheckResult,
  OwnedResource,
  ValidationResult,
  ValidationRules,
} from '@/lib/security/types';

// ============================================================
// Hook Types
// ============================================================

export interface UseSecurityResult {
  // Security context
  context: SecurityContext | null;
  isLoading: boolean;
  error: string | null;

  // Layer 1: Authentication
  isAuthenticated: boolean;
  requireAuth: typeof requireAuth;
  checkAuth: typeof checkAuth;

  // Layer 2: Authorization
  role: AppRole | null;
  isAdmin: boolean;
  hasPermission: (permission: Permission) => Promise<boolean>;
  hasAllPermissions: (permissions: Permission[]) => Promise<boolean>;
  hasAnyPermission: (permissions: Permission[]) => Promise<boolean>;
  requirePermission: typeof requirePermission;
  requireAdmin: typeof requireAdmin;
  checkPermission: typeof checkPermission;

  // Layer 3: Ownership
  userId: string | null;
  isResourceOwner: typeof isResourceOwner;
  canAccessOwnedResource: typeof canAccessOwnedResource;
  requireOwnership: typeof requireOwnership;
  requireOwnershipOrAdmin: typeof requireOwnershipOrAdmin;
  fetchOwnedResource: typeof fetchOwnedResource;
  validateOwnershipForMutation: typeof validateOwnershipForMutation;
  createUserScopedQuery: typeof createUserScopedQuery;
  checkOwnership: typeof checkOwnership;
  checkOwnershipOrAdmin: typeof checkOwnershipOrAdmin;

  // Input Validation
  sanitize: {
    html: typeof sanitizeHtml;
    text: typeof stripHtml;
    url: typeof sanitizeUrl;
    profile: typeof sanitizeProfileInput;
    listing: typeof sanitizeListingInput;
    lead: typeof sanitizeLeadInput;
    link: typeof sanitizeLinkInput;
  };
  validate: {
    resourceId: typeof validateResourceId;
    uuid: typeof isValidUUID;
    email: typeof isValidEmail;
    phone: typeof isValidPhone;
    string: typeof validateString;
    object: typeof validateObject;
  };
  isRateLimited: typeof isRateLimited;
  resetRateLimit: typeof resetRateLimit;

  // Combined checks
  checkAccess: (options: AccessCheckOptions) => Promise<SecurityCheckResult>;
  requireAccess: (options: AccessCheckOptions) => Promise<void>;

  // Utilities
  refreshContext: () => Promise<void>;
}

export interface AccessCheckOptions {
  /** Require authentication */
  authenticated?: boolean;
  /** Required permission */
  permission?: Permission;
  /** Required permissions (all must be present) */
  permissions?: Permission[];
  /** Require admin role */
  admin?: boolean;
  /** Resource owner ID for ownership check */
  resourceOwnerId?: string;
  /** Allow admin to bypass ownership */
  allowAdminBypass?: boolean;
  /** Resource type for permission scoping */
  resource?: ResourceType;
  /** Action for permission scoping */
  action?: 'view' | 'create' | 'update' | 'delete';
}

// ============================================================
// Main Security Hook
// ============================================================

/**
 * Unified security hook for React components
 *
 * @example
 * ```tsx
 * const { isAuthenticated, hasPermission, requireOwnership, sanitize } = useSecurity();
 *
 * // Check if user can edit a listing
 * const canEdit = await hasPermission('listing.update_own');
 *
 * // Ensure user owns the resource before editing
 * await requireOwnership(listing.user_id);
 *
 * // Sanitize user input
 * const cleanInput = sanitize.text(userInput);
 * ```
 */
export function useSecurity(): UseSecurityResult {
  const { user, session, role: storeRole, isLoading: authLoading } = useAuthStore();
  const [context, setContext] = useState<SecurityContext | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load security context
  useEffect(() => {
    let mounted = true;

    async function loadContext() {
      try {
        const ctx = await getSecurityContext();
        if (mounted) {
          setContext(ctx);
          setIsLoading(false);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to load security context');
          setIsLoading(false);
        }
      }
    }

    if (!authLoading) {
      loadContext();
    }

    return () => {
      mounted = false;
    };
  }, [user?.id, session?.access_token, authLoading]);

  // Refresh context when auth state changes
  const refreshContext = useCallback(async () => {
    clearAuthCache();
    try {
      const ctx = await getSecurityContext();
      setContext(ctx);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh security context');
    }
  }, []);

  // Derived state
  const isAuthenticated = useMemo(() => !!context?.isAuthenticated, [context]);
  const role = useMemo(() => context?.role ?? null, [context]);
  const userId = useMemo(() => context?.userId ?? null, [context]);
  const isAdminUser = useMemo(() => role === 'admin', [role]);

  // Combined access check
  const checkAccess = useCallback(
    async (options: AccessCheckOptions): Promise<SecurityCheckResult> => {
      // Layer 1: Authentication
      if (options.authenticated !== false) {
        const authResult = await checkAuth();
        if (!authResult.allowed) {
          return authResult;
        }
      }

      // Layer 2: Authorization (admin check)
      if (options.admin) {
        const adminResult = await checkPermission('admin.view' as Permission);
        if (!adminResult.allowed) {
          return {
            allowed: false,
            reason: 'Admin access required',
            layer: 'authorization',
          };
        }
      }

      // Layer 2: Authorization (permission check)
      if (options.permission) {
        const permResult = await checkPermission(options.permission);
        if (!permResult.allowed) {
          return permResult;
        }
      }

      // Layer 2: Authorization (multiple permissions)
      if (options.permissions && options.permissions.length > 0) {
        const hasAll = await hasAllPermissions(options.permissions);
        if (!hasAll) {
          return {
            allowed: false,
            reason: 'Missing required permissions',
            requiredPermission: options.permissions[0],
            layer: 'authorization',
          };
        }
      }

      // Layer 3: Ownership
      if (options.resourceOwnerId) {
        if (options.allowAdminBypass) {
          const ownerResult = await checkOwnershipOrAdmin(options.resourceOwnerId);
          if (!ownerResult.allowed) {
            return ownerResult;
          }
        } else {
          const ownerResult = await checkOwnership(options.resourceOwnerId);
          if (!ownerResult.allowed) {
            return ownerResult;
          }
        }
      }

      return {
        allowed: true,
      };
    },
    []
  );

  // Combined access requirement (throws on failure)
  const requireAccess = useCallback(
    async (options: AccessCheckOptions): Promise<void> => {
      // Layer 1: Authentication
      if (options.authenticated !== false) {
        await requireAuth();
      }

      // Layer 2: Authorization (admin check)
      if (options.admin) {
        await requireAdmin();
      }

      // Layer 2: Authorization (permission check)
      if (options.permission) {
        await requirePermission(options.permission);
      }

      // Layer 2: Authorization (multiple permissions)
      if (options.permissions && options.permissions.length > 0) {
        for (const permission of options.permissions) {
          await requirePermission(permission);
        }
      }

      // Layer 3: Ownership
      if (options.resourceOwnerId) {
        if (options.allowAdminBypass) {
          await requireOwnershipOrAdmin(options.resourceOwnerId);
        } else {
          await requireOwnership(options.resourceOwnerId);
        }
      }
    },
    []
  );

  // Sanitization functions
  const sanitize = useMemo(
    () => ({
      html: sanitizeHtml,
      text: stripHtml,
      url: sanitizeUrl,
      profile: sanitizeProfileInput,
      listing: sanitizeListingInput,
      lead: sanitizeLeadInput,
      link: sanitizeLinkInput,
    }),
    []
  );

  // Validation functions
  const validate = useMemo(
    () => ({
      resourceId: validateResourceId,
      uuid: isValidUUID,
      email: isValidEmail,
      phone: isValidPhone,
      string: validateString,
      object: validateObject,
    }),
    []
  );

  return {
    // Security context
    context,
    isLoading: isLoading || authLoading,
    error,

    // Layer 1: Authentication
    isAuthenticated,
    requireAuth,
    checkAuth,

    // Layer 2: Authorization
    role,
    isAdmin: isAdminUser,
    hasPermission,
    hasAllPermissions,
    hasAnyPermission,
    requirePermission,
    requireAdmin,
    checkPermission,

    // Layer 3: Ownership
    userId,
    isResourceOwner,
    canAccessOwnedResource,
    requireOwnership,
    requireOwnershipOrAdmin,
    fetchOwnedResource,
    validateOwnershipForMutation,
    createUserScopedQuery,
    checkOwnership,
    checkOwnershipOrAdmin,

    // Input Validation
    sanitize,
    validate,
    isRateLimited,
    resetRateLimit,

    // Combined checks
    checkAccess,
    requireAccess,

    // Utilities
    refreshContext,
  };
}

// ============================================================
// Specialized Security Hooks
// ============================================================

/**
 * Hook for resource-specific security
 * Use when working with a specific resource type
 */
export function useResourceSecurity(resourceType: ResourceType) {
  const security = useSecurity();

  const canView = useCallback(
    async (resourceOwnerId?: string): Promise<boolean> => {
      if (resourceOwnerId) {
        return security.canAccessOwnedResource(resourceOwnerId, resourceType, 'view');
      }
      return security.hasPermission(`${resourceType}.view_own` as Permission);
    },
    [security, resourceType]
  );

  const canCreate = useCallback(async (): Promise<boolean> => {
    return security.hasPermission(`${resourceType}.create` as Permission);
  }, [security, resourceType]);

  const canUpdate = useCallback(
    async (resourceOwnerId: string): Promise<boolean> => {
      return security.canAccessOwnedResource(resourceOwnerId, resourceType, 'update');
    },
    [security, resourceType]
  );

  const canDelete = useCallback(
    async (resourceOwnerId: string): Promise<boolean> => {
      return security.canAccessOwnedResource(resourceOwnerId, resourceType, 'delete');
    },
    [security, resourceType]
  );

  return {
    ...security,
    resourceType,
    canView,
    canCreate,
    canUpdate,
    canDelete,
  };
}

/**
 * Hook for admin-only features
 */
export function useAdminSecurity() {
  const security = useSecurity();

  useEffect(() => {
    if (security.isLoading) return;

    if (!security.isAuthenticated) {
      throw new AuthenticationError('Authentication required for admin features');
    }

    if (!security.isAdmin) {
      throw new AuthorizationError('Admin access required');
    }
  }, [security.isLoading, security.isAuthenticated, security.isAdmin]);

  return security;
}

// ============================================================
// Re-export Error Classes
// ============================================================

export {
  AuthenticationError,
  SessionExpiredError,
  AuthorizationError,
  OwnershipError,
  ValidationError,
};

// ============================================================
// Re-export Types
// ============================================================

export type {
  Permission,
  AppRole,
  ResourceType,
  SecurityContext,
  SecurityCheckResult,
  OwnedResource,
  ValidationResult,
  ValidationRules,
};
