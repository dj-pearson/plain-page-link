/**
 * Security Layer 2: Authorization
 *
 * Validates what the user is allowed to do.
 * This answers the question: WHAT can you do?
 *
 * Responsibilities:
 * - Check role-based permissions
 * - Validate feature access
 * - Enforce permission boundaries
 */

import { logger } from '@/lib/logger';
import { getSecurityContext } from './authentication';
import type {
  Permission,
  AppRole,
  SecurityCheckResult,
  SecurityViolation,
  ROLE_PERMISSIONS,
  ROLE_LEVELS,
} from './types';
import { ROLE_PERMISSIONS as PERMISSIONS, ROLE_LEVELS as LEVELS } from './types';

// ============================================================
// Permission Checking Functions
// ============================================================

/**
 * Check if a role has a specific permission
 */
export function roleHasPermission(role: AppRole, permission: Permission): boolean {
  const permissions = PERMISSIONS[role];
  if (!permissions) {
    return false;
  }

  // Direct permission match
  if (permissions.includes(permission)) {
    return true;
  }

  // Check if role has "manage" permission for this resource (grants all actions)
  const [resource] = permission.split('.') as [string, string];
  const managePermission = `${resource}.manage` as Permission;
  if (permissions.includes(managePermission)) {
    return true;
  }

  // Check if role has "_all" version of "_own" permission
  // e.g., if checking "listing.view_own", admin with "listing.view_all" should pass
  if (permission.endsWith('_own')) {
    const allPermission = permission.replace('_own', '_all') as Permission;
    if (permissions.includes(allPermission)) {
      return true;
    }
  }

  return false;
}

/**
 * Get the role level for permission hierarchy checks
 */
export function getRoleLevel(role: AppRole | null): number {
  if (!role) return 0;
  return LEVELS[role] ?? 0;
}

/**
 * Check if a user has a permission based on their role
 */
export async function hasPermission(permission: Permission): Promise<boolean> {
  const context = await getSecurityContext();

  if (!context.isAuthenticated || !context.role) {
    return false;
  }

  return roleHasPermission(context.role, permission);
}

/**
 * Check if a user has ALL of the specified permissions
 */
export async function hasAllPermissions(permissions: Permission[]): Promise<boolean> {
  const context = await getSecurityContext();

  if (!context.isAuthenticated || !context.role) {
    return false;
  }

  return permissions.every((permission) => roleHasPermission(context.role!, permission));
}

/**
 * Check if a user has ANY of the specified permissions
 */
export async function hasAnyPermission(permissions: Permission[]): Promise<boolean> {
  const context = await getSecurityContext();

  if (!context.isAuthenticated || !context.role) {
    return false;
  }

  return permissions.some((permission) => roleHasPermission(context.role!, permission));
}

/**
 * Check if user's role level meets the required minimum
 */
export async function hasRoleLevel(requiredLevel: number): Promise<boolean> {
  const context = await getSecurityContext();
  return getRoleLevel(context.role) >= requiredLevel;
}

/**
 * Check if user has admin role
 */
export async function isAdmin(): Promise<boolean> {
  const context = await getSecurityContext();
  return context.role === 'admin';
}

// ============================================================
// Permission Enforcement Functions
// ============================================================

/**
 * Require a specific permission - throws if not authorized
 */
export async function requirePermission(permission: Permission): Promise<void> {
  const allowed = await hasPermission(permission);

  if (!allowed) {
    const context = await getSecurityContext();
    const violation: SecurityViolation = {
      type: 'permission_denied',
      userId: context.userId ?? undefined,
      action: 'require_permission',
      details: `Missing permission: ${permission}`,
      timestamp: new Date(),
    };
    logSecurityViolation(violation);

    throw new AuthorizationError(`Permission denied: ${permission}`);
  }
}

/**
 * Require ALL specified permissions - throws if any are missing
 */
export async function requireAllPermissions(permissions: Permission[]): Promise<void> {
  const hasAll = await hasAllPermissions(permissions);

  if (!hasAll) {
    const context = await getSecurityContext();
    const violation: SecurityViolation = {
      type: 'permission_denied',
      userId: context.userId ?? undefined,
      action: 'require_all_permissions',
      details: `Missing one or more permissions: ${permissions.join(', ')}`,
      timestamp: new Date(),
    };
    logSecurityViolation(violation);

    throw new AuthorizationError(`Missing required permissions`);
  }
}

/**
 * Require admin role - throws if not admin
 */
export async function requireAdmin(): Promise<void> {
  const admin = await isAdmin();

  if (!admin) {
    const context = await getSecurityContext();
    const violation: SecurityViolation = {
      type: 'permission_denied',
      userId: context.userId ?? undefined,
      action: 'require_admin',
      details: 'Admin role required',
      timestamp: new Date(),
    };
    logSecurityViolation(violation);

    throw new AuthorizationError('Admin access required');
  }
}

/**
 * Require minimum role level - throws if below threshold
 */
export async function requireRoleLevel(requiredLevel: number): Promise<void> {
  const meetsLevel = await hasRoleLevel(requiredLevel);

  if (!meetsLevel) {
    const context = await getSecurityContext();
    const violation: SecurityViolation = {
      type: 'permission_denied',
      userId: context.userId ?? undefined,
      action: 'require_role_level',
      details: `Insufficient role level. Required: ${requiredLevel}, Actual: ${getRoleLevel(context.role)}`,
      timestamp: new Date(),
    };
    logSecurityViolation(violation);

    throw new AuthorizationError('Insufficient role level');
  }
}

// ============================================================
// Permission Check Functions (non-throwing)
// ============================================================

/**
 * Check permission and return result without throwing
 */
export async function checkPermission(permission: Permission): Promise<SecurityCheckResult> {
  const allowed = await hasPermission(permission);

  if (!allowed) {
    return {
      allowed: false,
      reason: `Missing permission: ${permission}`,
      requiredPermission: permission,
      layer: 'authorization',
    };
  }

  return {
    allowed: true,
    layer: 'authorization',
  };
}

/**
 * Check admin status and return result without throwing
 */
export async function checkAdmin(): Promise<SecurityCheckResult> {
  const admin = await isAdmin();

  if (!admin) {
    return {
      allowed: false,
      reason: 'Admin role required',
      layer: 'authorization',
    };
  }

  return {
    allowed: true,
    layer: 'authorization',
  };
}

// ============================================================
// Permission Utilities
// ============================================================

/**
 * Get all permissions for a role
 */
export function getPermissionsForRole(role: AppRole): Permission[] {
  return [...PERMISSIONS[role]];
}

/**
 * Get all permissions for the current user
 */
export async function getCurrentUserPermissions(): Promise<Permission[]> {
  const context = await getSecurityContext();

  if (!context.isAuthenticated || !context.role) {
    return [];
  }

  return getPermissionsForRole(context.role);
}

/**
 * Check if action is "own" or "all" based on permission
 */
export function getActionScope(permission: Permission): 'own' | 'all' | 'any' {
  if (permission.endsWith('_own')) return 'own';
  if (permission.endsWith('_all')) return 'all';
  return 'any';
}

/**
 * Determine if user can access a resource based on ownership
 */
export async function canAccessResource(
  resourceUserId: string,
  viewPermission: Permission,
  viewAllPermission: Permission
): Promise<boolean> {
  const context = await getSecurityContext();

  if (!context.isAuthenticated || !context.role) {
    return false;
  }

  // Admin or user with "view_all" can access any resource
  if (roleHasPermission(context.role, viewAllPermission)) {
    return true;
  }

  // User with "view_own" can only access their own resources
  if (roleHasPermission(context.role, viewPermission)) {
    return resourceUserId === context.userId;
  }

  return false;
}

// ============================================================
// Security Violation Logging
// ============================================================

function logSecurityViolation(violation: SecurityViolation): void {
  logger.warn('Authorization violation detected', {
    type: violation.type,
    action: violation.action,
    resource: violation.resource,
    userId: violation.userId?.substring(0, 8),
    details: violation.details,
  });
}

// ============================================================
// Custom Error Classes
// ============================================================

/**
 * Authorization error - thrown when permission check fails
 */
export class AuthorizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthorizationError';
  }
}
