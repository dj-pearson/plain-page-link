/**
 * Security Layer 3: Resource Ownership Validation
 *
 * Validates that the user owns or has access to the resource.
 * This answers the question: IS this yours?
 *
 * Responsibilities:
 * - Verify resource ownership
 * - Validate user_id matches for "own" operations
 * - Provide ownership-aware query helpers
 * - Prevent IDOR (Insecure Direct Object Reference) attacks
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { getSecurityContext } from './authentication';
import { isAdmin, roleHasPermission } from './authorization';
import type {
  OwnedResource,
  SecurityCheckResult,
  SecurityViolation,
  ResourceType,
  Permission,
} from './types';

// ============================================================
// Resource Ownership Types
// ============================================================

/**
 * Table to resource type mapping
 */
const TABLE_TO_RESOURCE: Record<string, ResourceType> = {
  profiles: 'profile',
  listings: 'listing',
  leads: 'lead',
  links: 'link',
  testimonials: 'testimonial',
  blog_posts: 'article',
  articles: 'article',
};

/**
 * Owner field name by table (most use user_id, but some differ)
 */
const OWNER_FIELD: Record<string, string> = {
  profiles: 'id', // Profile ID is the user ID
  listings: 'user_id',
  leads: 'user_id',
  links: 'user_id',
  testimonials: 'user_id',
  blog_posts: 'user_id',
  articles: 'user_id',
  user_sessions: 'user_id',
  user_mfa_settings: 'user_id',
};

// ============================================================
// Ownership Validation Functions
// ============================================================

/**
 * Check if the current user owns a resource
 */
export async function isResourceOwner(
  resourceUserId: string,
  options?: { throwOnFailure?: boolean }
): Promise<boolean> {
  const context = await getSecurityContext();

  if (!context.isAuthenticated || !context.userId) {
    if (options?.throwOnFailure) {
      throw new OwnershipError('User not authenticated');
    }
    return false;
  }

  const isOwner = context.userId === resourceUserId;

  if (!isOwner && options?.throwOnFailure) {
    const violation: SecurityViolation = {
      type: 'ownership_violation',
      userId: context.userId,
      action: 'ownership_check',
      resourceId: resourceUserId.substring(0, 8) + '...',
      details: 'User does not own this resource',
      timestamp: new Date(),
    };
    logSecurityViolation(violation);
    throw new OwnershipError('Access denied: you do not own this resource');
  }

  return isOwner;
}

/**
 * Check if user can access a resource (owner or admin)
 */
export async function canAccessOwnedResource(
  resourceUserId: string,
  resource: ResourceType,
  action: 'view' | 'update' | 'delete' = 'view'
): Promise<boolean> {
  const context = await getSecurityContext();

  if (!context.isAuthenticated || !context.userId || !context.role) {
    return false;
  }

  // Admins can access all resources
  if (context.role === 'admin') {
    return true;
  }

  // Check if user has "_all" permission for this resource
  const allPermission = `${resource}.${action}_all` as Permission;
  if (roleHasPermission(context.role, allPermission)) {
    return true;
  }

  // Check if user owns the resource and has "_own" permission
  const ownPermission = `${resource}.${action}_own` as Permission;
  if (roleHasPermission(context.role, ownPermission) && context.userId === resourceUserId) {
    return true;
  }

  return false;
}

/**
 * Require resource ownership - throws if not owner
 */
export async function requireOwnership(resourceUserId: string): Promise<void> {
  const isOwner = await isResourceOwner(resourceUserId, { throwOnFailure: false });

  if (!isOwner) {
    const context = await getSecurityContext();
    const violation: SecurityViolation = {
      type: 'ownership_violation',
      userId: context.userId ?? undefined,
      action: 'require_ownership',
      resourceId: resourceUserId.substring(0, 8) + '...',
      details: 'Ownership required but user is not the owner',
      timestamp: new Date(),
    };
    logSecurityViolation(violation);
    throw new OwnershipError('Access denied: you do not own this resource');
  }
}

/**
 * Require ownership OR admin access - throws if neither
 */
export async function requireOwnershipOrAdmin(resourceUserId: string): Promise<void> {
  const adminAccess = await isAdmin();
  if (adminAccess) return;

  await requireOwnership(resourceUserId);
}

// ============================================================
// Resource Fetching with Ownership Validation
// ============================================================

/**
 * Fetch a resource with automatic ownership validation
 * Returns null if user doesn't have access
 */
export async function fetchOwnedResource<T extends OwnedResource>(
  table: string,
  resourceId: string,
  options?: {
    allowAdmin?: boolean;
    columns?: string;
  }
): Promise<T | null> {
  const context = await getSecurityContext();

  if (!context.isAuthenticated || !context.userId) {
    return null;
  }

  const ownerField = OWNER_FIELD[table] || 'user_id';
  const columns = options?.columns || '*';

  try {
    // Build query
    let query = supabase.from(table).select(columns).eq('id', resourceId);

    // If not admin, also filter by owner
    if (!options?.allowAdmin || context.role !== 'admin') {
      query = query.eq(ownerField, context.userId);
    }

    const { data, error } = await query.single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned - either doesn't exist or user doesn't own it
        // Log as potential IDOR attempt if resource exists but user doesn't own it
        const { data: exists } = await supabase
          .from(table)
          .select('id')
          .eq('id', resourceId)
          .single();

        if (exists) {
          const violation: SecurityViolation = {
            type: 'ownership_violation',
            userId: context.userId,
            action: 'fetch_owned_resource',
            resource: table,
            resourceId: resourceId.substring(0, 8) + '...',
            details: 'Attempted to access resource owned by another user',
            timestamp: new Date(),
          };
          logSecurityViolation(violation);
        }
        return null;
      }
      throw error;
    }

    return data as T;
  } catch (error) {
    logger.error('Error fetching owned resource', error as Error, { table, resourceId });
    return null;
  }
}

/**
 * Validate ownership before mutation (update/delete)
 * Returns the resource if owned, null otherwise
 */
export async function validateOwnershipForMutation<T extends OwnedResource>(
  table: string,
  resourceId: string
): Promise<T | null> {
  const context = await getSecurityContext();

  if (!context.isAuthenticated || !context.userId) {
    return null;
  }

  const ownerField = OWNER_FIELD[table] || 'user_id';

  try {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .eq('id', resourceId)
      .eq(ownerField, context.userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Check if resource exists at all
        const { data: exists } = await supabase
          .from(table)
          .select('id')
          .eq('id', resourceId)
          .single();

        if (exists) {
          const violation: SecurityViolation = {
            type: 'ownership_violation',
            userId: context.userId,
            action: 'mutation_ownership_check',
            resource: table,
            resourceId: resourceId.substring(0, 8) + '...',
            details: 'Attempted to modify resource owned by another user',
            timestamp: new Date(),
          };
          logSecurityViolation(violation);
        }
        return null;
      }
      throw error;
    }

    return data as T;
  } catch (error) {
    logger.error('Error validating ownership for mutation', error as Error, { table, resourceId });
    return null;
  }
}

// ============================================================
// Ownership Check Results (non-throwing)
// ============================================================

/**
 * Check ownership and return result without throwing
 */
export async function checkOwnership(resourceUserId: string): Promise<SecurityCheckResult> {
  const isOwner = await isResourceOwner(resourceUserId);

  if (!isOwner) {
    return {
      allowed: false,
      reason: 'User does not own this resource',
      layer: 'ownership',
    };
  }

  return {
    allowed: true,
    layer: 'ownership',
  };
}

/**
 * Check ownership or admin access and return result without throwing
 */
export async function checkOwnershipOrAdmin(resourceUserId: string): Promise<SecurityCheckResult> {
  const adminAccess = await isAdmin();
  if (adminAccess) {
    return { allowed: true, layer: 'ownership' };
  }

  return checkOwnership(resourceUserId);
}

// ============================================================
// Secure Query Helpers
// ============================================================

/**
 * Create a query builder that automatically scopes to the current user
 * Prevents IDOR by always filtering by user_id
 */
export async function createUserScopedQuery(table: string) {
  const context = await getSecurityContext();

  if (!context.isAuthenticated || !context.userId) {
    throw new OwnershipError('User not authenticated');
  }

  const ownerField = OWNER_FIELD[table] || 'user_id';

  return {
    select: (columns: string = '*') =>
      supabase.from(table).select(columns).eq(ownerField, context.userId),

    insert: (data: Record<string, unknown>) =>
      supabase.from(table).insert({
        ...data,
        [ownerField]: context.userId,
      }),

    update: (id: string, data: Record<string, unknown>) =>
      supabase.from(table).update(data).eq('id', id).eq(ownerField, context.userId),

    delete: (id: string) => supabase.from(table).delete().eq('id', id).eq(ownerField, context.userId),

    userId: context.userId,
    ownerField,
  };
}

/**
 * Add user ownership filter to any Supabase query
 */
export async function withOwnershipFilter<T>(
  queryBuilder: T & { eq: (column: string, value: string) => T },
  table: string
): Promise<T> {
  const context = await getSecurityContext();

  if (!context.isAuthenticated || !context.userId) {
    throw new OwnershipError('User not authenticated');
  }

  const ownerField = OWNER_FIELD[table] || 'user_id';
  return queryBuilder.eq(ownerField, context.userId);
}

// ============================================================
// Bulk Ownership Validation
// ============================================================

/**
 * Validate ownership for multiple resource IDs
 * Returns array of IDs that the user owns
 */
export async function filterOwnedResources(
  table: string,
  resourceIds: string[]
): Promise<string[]> {
  const context = await getSecurityContext();

  if (!context.isAuthenticated || !context.userId || resourceIds.length === 0) {
    return [];
  }

  const ownerField = OWNER_FIELD[table] || 'user_id';

  try {
    const { data, error } = await supabase
      .from(table)
      .select('id')
      .in('id', resourceIds)
      .eq(ownerField, context.userId);

    if (error) throw error;

    return data?.map((r) => r.id) || [];
  } catch (error) {
    logger.error('Error filtering owned resources', error as Error, { table });
    return [];
  }
}

// ============================================================
// Security Violation Logging
// ============================================================

function logSecurityViolation(violation: SecurityViolation): void {
  logger.warn('Ownership violation detected', {
    type: violation.type,
    action: violation.action,
    resource: violation.resource,
    resourceId: violation.resourceId,
    userId: violation.userId?.substring(0, 8),
    details: violation.details,
  });

  // In production, this would also write to audit_logs table
}

// ============================================================
// Custom Error Classes
// ============================================================

/**
 * Ownership error - thrown when ownership validation fails
 */
export class OwnershipError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OwnershipError';
  }
}
