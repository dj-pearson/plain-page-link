/**
 * Security Layer Types
 *
 * Defense-in-Depth Security Model:
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
 */

// ============================================================
// Role Definitions
// ============================================================

export type AppRole = 'admin' | 'user';

/**
 * Role hierarchy levels for permission checks
 * Higher number = more permissions
 */
export const ROLE_LEVELS: Record<AppRole, number> = {
  user: 1,
  admin: 10,
} as const;

// ============================================================
// Permission Definitions
// ============================================================

/**
 * Resource types in the application
 */
export type ResourceType =
  | 'profile'
  | 'listing'
  | 'lead'
  | 'link'
  | 'testimonial'
  | 'article'
  | 'analytics'
  | 'settings'
  | 'admin'
  | 'billing';

/**
 * Action types that can be performed on resources
 */
export type ActionType =
  | 'view'
  | 'view_own'
  | 'view_all'
  | 'create'
  | 'update'
  | 'update_own'
  | 'update_all'
  | 'delete'
  | 'delete_own'
  | 'delete_all'
  | 'manage'; // Full CRUD access

/**
 * Permission string format: "resource.action"
 * Examples: "listing.view_own", "admin.manage", "lead.delete_own"
 */
export type Permission = `${ResourceType}.${ActionType}`;

/**
 * Permission definitions for each role
 * Users get "own" permissions, Admins get "all" permissions
 */
export const ROLE_PERMISSIONS: Record<AppRole, Permission[]> = {
  user: [
    // Profile
    'profile.view_own',
    'profile.update_own',

    // Listings
    'listing.view_own',
    'listing.create',
    'listing.update_own',
    'listing.delete_own',

    // Leads
    'lead.view_own',
    'lead.create',
    'lead.update_own',
    'lead.delete_own',

    // Links
    'link.view_own',
    'link.create',
    'link.update_own',
    'link.delete_own',

    // Testimonials
    'testimonial.view_own',
    'testimonial.create',
    'testimonial.update_own',
    'testimonial.delete_own',

    // Articles
    'article.view_own',
    'article.create',
    'article.update_own',
    'article.delete_own',

    // Analytics - view own only
    'analytics.view_own',

    // Settings - own settings only
    'settings.view_own',
    'settings.update_own',

    // Billing - own billing only
    'billing.view_own',
    'billing.update_own',
  ],

  admin: [
    // Profile - full access
    'profile.view_all',
    'profile.update_all',
    'profile.manage',

    // Listings - full access
    'listing.view_all',
    'listing.create',
    'listing.update_all',
    'listing.delete_all',
    'listing.manage',

    // Leads - full access
    'lead.view_all',
    'lead.create',
    'lead.update_all',
    'lead.delete_all',
    'lead.manage',

    // Links - full access
    'link.view_all',
    'link.create',
    'link.update_all',
    'link.delete_all',
    'link.manage',

    // Testimonials - full access
    'testimonial.view_all',
    'testimonial.create',
    'testimonial.update_all',
    'testimonial.delete_all',
    'testimonial.manage',

    // Articles - full access
    'article.view_all',
    'article.create',
    'article.update_all',
    'article.delete_all',
    'article.manage',

    // Analytics - full access
    'analytics.view_all',
    'analytics.manage',

    // Settings - full access
    'settings.view_all',
    'settings.update_all',
    'settings.manage',

    // Admin panel access
    'admin.view',
    'admin.manage',

    // Billing - full access
    'billing.view_all',
    'billing.update_all',
    'billing.manage',
  ],
} as const;

// ============================================================
// Security Context Types
// ============================================================

/**
 * Security context passed through the application
 */
export interface SecurityContext {
  /** Current authenticated user ID */
  userId: string | null;

  /** Current user's role */
  role: AppRole | null;

  /** Whether user is authenticated */
  isAuthenticated: boolean;

  /** Whether MFA is verified (if required) */
  isMFAVerified: boolean;

  /** Session metadata */
  session: {
    id: string | null;
    expiresAt: Date | null;
    isValid: boolean;
  };
}

/**
 * Resource with ownership information
 */
export interface OwnedResource {
  id: string;
  user_id: string;
  [key: string]: unknown;
}

/**
 * Security check result
 */
export interface SecurityCheckResult {
  allowed: boolean;
  reason?: string;
  requiredPermission?: Permission;
  layer?: 'authentication' | 'authorization' | 'ownership' | 'rls';
}

/**
 * Security violation event for audit logging
 */
export interface SecurityViolation {
  type: 'auth_failure' | 'permission_denied' | 'ownership_violation' | 'input_validation';
  userId?: string;
  action: string;
  resource?: string;
  resourceId?: string;
  details: string;
  timestamp: Date;
  ip?: string;
  userAgent?: string;
}

// ============================================================
// Input Validation Types
// ============================================================

/**
 * Validation result for input sanitization
 */
export interface ValidationResult<T = unknown> {
  isValid: boolean;
  sanitized: T | null;
  errors: string[];
}

/**
 * Field validation rules
 */
export interface ValidationRules {
  maxLength?: number;
  minLength?: number;
  pattern?: RegExp;
  required?: boolean;
  sanitize?: boolean;
  allowHtml?: boolean;
}
