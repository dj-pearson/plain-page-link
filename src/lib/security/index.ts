/**
 * Security Module - Defense-in-Depth Security Layers
 *
 * This module provides a comprehensive security framework with four layers:
 *
 * ┌─────────────────────────────────────────────────────────┐
 * │  Layer 1: Authentication (WHO are you?)                 │
 * │  - requireAuth, protectedRoute middleware               │
 * │  - Validates JWT/session is valid                       │
 * ├─────────────────────────────────────────────────────────┤
 * │  Layer 2: Authorization (WHAT can you do?)              │
 * │  - requirePermission('resource.action')                 │
 * │  - Role level checks (roleLevel >= required)            │
 * ├─────────────────────────────────────────────────────────┤
 * │  Layer 3: Resource Ownership (IS this yours?)           │
 * │  - Owner checks (createdBy = userId for "own" access)   │
 * │  - Resource-specific access validation                  │
 * ├─────────────────────────────────────────────────────────┤
 * │  Layer 4: Database RLS (FINAL enforcement)              │
 * │  - Row-level security policies in PostgreSQL            │
 * │  - Even if code has bugs, DB rejects unauthorized       │
 * └─────────────────────────────────────────────────────────┘
 *
 * @example
 * ```tsx
 * import { useSecurity } from '@/hooks/useSecurity';
 *
 * function MyComponent() {
 *   const { requireAccess, sanitize, isAuthenticated } = useSecurity();
 *
 *   // Combined security check
 *   await requireAccess({
 *     authenticated: true,
 *     permission: 'listing.update_own',
 *     resourceOwnerId: listing.user_id,
 *     allowAdminBypass: true,
 *   });
 *
 *   // Sanitize input
 *   const cleanData = sanitize.listing(formData);
 * }
 * ```
 */

// ============================================================
// Types
// ============================================================

export type {
  AppRole,
  Permission,
  ResourceType,
  ActionType,
  SecurityContext,
  OwnedResource,
  SecurityCheckResult,
  SecurityViolation,
  ValidationResult,
  ValidationRules,
} from './types';

export { ROLE_LEVELS, ROLE_PERMISSIONS } from './types';

// ============================================================
// Layer 1: Authentication
// ============================================================

export {
  requireAuth,
  checkAuth,
  getSecurityContext,
  validateSessionOwnership,
  isMFARequired,
  requireMFA,
  clearAuthCache,
  AuthenticationError,
  SessionExpiredError,
} from './authentication';

// ============================================================
// Layer 2: Authorization
// ============================================================

export {
  hasPermission,
  hasAllPermissions,
  hasAnyPermission,
  hasRoleLevel,
  isAdmin,
  requirePermission,
  requireAllPermissions,
  requireAdmin,
  requireRoleLevel,
  checkPermission,
  checkAdmin,
  roleHasPermission,
  getRoleLevel,
  getPermissionsForRole,
  getCurrentUserPermissions,
  getActionScope,
  canAccessResource,
  AuthorizationError,
} from './authorization';

// ============================================================
// Layer 3: Resource Ownership
// ============================================================

export {
  isResourceOwner,
  canAccessOwnedResource,
  requireOwnership,
  requireOwnershipOrAdmin,
  fetchOwnedResource,
  validateOwnershipForMutation,
  createUserScopedQuery,
  withOwnershipFilter,
  filterOwnedResources,
  checkOwnership,
  checkOwnershipOrAdmin,
  OwnershipError,
} from './ownership';

// ============================================================
// Input Validation & Sanitization
// ============================================================

export {
  sanitizeHtml,
  stripHtml,
  sanitizeUrl,
  sanitizeFilename,
  isValidUUID,
  validateResourceId,
  isValidEmail,
  isValidPhone,
  validateString,
  validateObject,
  sanitizeProfileInput,
  sanitizeListingInput,
  sanitizeLeadInput,
  sanitizeLinkInput,
  containsSqlInjection,
  validateNoSqlInjection,
  containsXssPatterns,
  isRateLimited,
  resetRateLimit,
  ValidationError,
} from './validation';

// ============================================================
// Secure Query Utilities
// ============================================================

export {
  secureSelect,
  secureInsert,
  secureUpdate,
  secureDelete,
  secureFetchOne,
  createSecureMutation,
} from './secureQuery';

export type { SecureQueryOptions, SecureQueryResult } from './secureQuery';
