/**
 * Secure Query Utilities
 *
 * Provides security-wrapped data fetching that enforces all security layers:
 * 1. Authentication - Validates user session
 * 2. Authorization - Checks permissions
 * 3. Ownership - Scopes queries to user's data
 * 4. Validation - Sanitizes inputs and outputs
 *
 * Use these utilities for building secure data access patterns.
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { requireAuth, getSecurityContext } from './authentication';
import { requirePermission, hasPermission } from './authorization';
import { requireOwnership, createUserScopedQuery, fetchOwnedResource } from './ownership';
import { validateResourceId, sanitizeHtml, stripHtml } from './validation';
import type { Permission, ResourceType, OwnedResource } from './types';

// ============================================================
// Secure Query Builder
// ============================================================

export interface SecureQueryOptions {
  /** Table name */
  table: string;

  /** Required permission for this operation */
  permission?: Permission;

  /** Columns to select (default: '*') */
  columns?: string;

  /** Apply user ownership filter */
  scopeToUser?: boolean;

  /** Allow admin bypass of ownership filter */
  allowAdminBypass?: boolean;
}

export interface SecureQueryResult<T> {
  data: T | null;
  error: Error | null;
  count?: number;
}

/**
 * Execute a secure SELECT query
 * Automatically applies authentication, authorization, and ownership checks
 */
export async function secureSelect<T = unknown>(
  options: SecureQueryOptions & {
    filters?: Record<string, unknown>;
    orderBy?: { column: string; ascending?: boolean };
    limit?: number;
    offset?: number;
  }
): Promise<SecureQueryResult<T[]>> {
  try {
    // Layer 1: Authentication
    await requireAuth();

    // Layer 2: Authorization
    if (options.permission) {
      await requirePermission(options.permission);
    }

    // Get security context for ownership filtering
    const context = await getSecurityContext();

    // Build query
    let query = supabase
      .from(options.table)
      .select(options.columns || '*', { count: 'exact' });

    // Layer 3: Ownership filter
    if (options.scopeToUser && context.userId) {
      // Check if admin can bypass ownership
      const canBypass =
        options.allowAdminBypass && context.role === 'admin';

      if (!canBypass) {
        query = query.eq('user_id', context.userId);
      }
    }

    // Apply additional filters
    if (options.filters) {
      for (const [key, value] of Object.entries(options.filters)) {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value);
        }
      }
    }

    // Apply ordering
    if (options.orderBy) {
      query = query.order(options.orderBy.column, {
        ascending: options.orderBy.ascending ?? true,
      });
    }

    // Apply pagination
    if (options.limit) {
      query = query.limit(options.limit);
    }
    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    const { data, error, count } = await query;

    if (error) {
      logger.error('Secure select query failed', error, {
        table: options.table,
        action: 'select',
      });
      return { data: null, error: new Error(error.message), count: 0 };
    }

    return { data: data as T[], error: null, count: count ?? undefined };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Query failed'),
    };
  }
}

/**
 * Execute a secure INSERT query
 */
export async function secureInsert<T extends Record<string, unknown>>(
  options: SecureQueryOptions & {
    data: Omit<T, 'id' | 'user_id' | 'created_at' | 'updated_at'>;
  }
): Promise<SecureQueryResult<T>> {
  try {
    // Layer 1: Authentication
    const { user } = await requireAuth();

    // Layer 2: Authorization
    if (options.permission) {
      await requirePermission(options.permission);
    }

    // Prepare data with user_id
    const insertData = {
      ...options.data,
      user_id: user.id,
    };

    // Execute insert
    const { data, error } = await supabase
      .from(options.table)
      .insert(insertData)
      .select(options.columns || '*')
      .single();

    if (error) {
      logger.error('Secure insert query failed', error, {
        table: options.table,
        action: 'insert',
      });
      return { data: null, error: new Error(error.message) };
    }

    return { data: data as T, error: null };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Insert failed'),
    };
  }
}

/**
 * Execute a secure UPDATE query
 * Automatically validates ownership before updating
 */
export async function secureUpdate<T extends OwnedResource>(
  options: SecureQueryOptions & {
    id: string;
    data: Partial<Omit<T, 'id' | 'user_id' | 'created_at'>>;
  }
): Promise<SecureQueryResult<T>> {
  try {
    // Validate resource ID format
    validateResourceId(options.id, options.table);

    // Layer 1: Authentication
    const { user } = await requireAuth();

    // Layer 2: Authorization
    if (options.permission) {
      await requirePermission(options.permission);
    }

    // Get security context
    const context = await getSecurityContext();
    const canBypass = options.allowAdminBypass && context.role === 'admin';

    // Build update query with ownership check
    let query = supabase
      .from(options.table)
      .update({
        ...options.data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', options.id);

    // Layer 3: Ownership filter (unless admin bypass)
    if (!canBypass) {
      query = query.eq('user_id', user.id);
    }

    const { data, error } = await query.select(options.columns || '*').single();

    if (error) {
      // Check if it's a "no rows" error (ownership violation)
      if (error.code === 'PGRST116') {
        logger.warn('Secure update ownership violation', {
          table: options.table,
          resourceId: options.id.substring(0, 8),
          userId: user.id.substring(0, 8),
        });
        return {
          data: null,
          error: new Error('Resource not found or access denied'),
        };
      }

      logger.error('Secure update query failed', error, {
        table: options.table,
        action: 'update',
      });
      return { data: null, error: new Error(error.message) };
    }

    return { data: data as T, error: null };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Update failed'),
    };
  }
}

/**
 * Execute a secure DELETE query
 * Automatically validates ownership before deleting
 */
export async function secureDelete(
  options: SecureQueryOptions & {
    id: string;
  }
): Promise<SecureQueryResult<null>> {
  try {
    // Validate resource ID format
    validateResourceId(options.id, options.table);

    // Layer 1: Authentication
    const { user } = await requireAuth();

    // Layer 2: Authorization
    if (options.permission) {
      await requirePermission(options.permission);
    }

    // Get security context
    const context = await getSecurityContext();
    const canBypass = options.allowAdminBypass && context.role === 'admin';

    // Build delete query with ownership check
    let query = supabase.from(options.table).delete().eq('id', options.id);

    // Layer 3: Ownership filter (unless admin bypass)
    if (!canBypass) {
      query = query.eq('user_id', user.id);
    }

    const { error, count } = await query;

    if (error) {
      logger.error('Secure delete query failed', error, {
        table: options.table,
        action: 'delete',
      });
      return { data: null, error: new Error(error.message) };
    }

    // Check if anything was deleted
    if (count === 0) {
      logger.warn('Secure delete - no rows affected (ownership violation?)', {
        table: options.table,
        resourceId: options.id.substring(0, 8),
      });
      return {
        data: null,
        error: new Error('Resource not found or access denied'),
      };
    }

    return { data: null, error: null };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Delete failed'),
    };
  }
}

/**
 * Fetch a single resource with ownership validation
 */
export async function secureFetchOne<T extends OwnedResource>(
  options: SecureQueryOptions & {
    id: string;
  }
): Promise<SecureQueryResult<T>> {
  try {
    // Validate resource ID format
    validateResourceId(options.id, options.table);

    // Layer 1: Authentication
    await requireAuth();

    // Layer 2: Authorization
    if (options.permission) {
      await requirePermission(options.permission);
    }

    // Layer 3: Fetch with ownership validation
    const data = await fetchOwnedResource<T>(options.table, options.id, {
      allowAdmin: options.allowAdminBypass,
      columns: options.columns,
    });

    if (!data) {
      return {
        data: null,
        error: new Error('Resource not found or access denied'),
      };
    }

    return { data, error: null };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Fetch failed'),
    };
  }
}

// ============================================================
// Secure Mutation Helpers
// ============================================================

/**
 * Create a secure mutation wrapper for TanStack Query
 * Provides consistent security checks for mutations
 */
export function createSecureMutation<TInput, TOutput>(config: {
  table: string;
  operation: 'insert' | 'update' | 'delete';
  permission?: Permission;
  allowAdminBypass?: boolean;
  transform?: (input: TInput) => Record<string, unknown>;
}) {
  return async (input: TInput & { id?: string }): Promise<TOutput> => {
    const data = config.transform ? config.transform(input) : (input as Record<string, unknown>);

    switch (config.operation) {
      case 'insert': {
        const result = await secureInsert({
          table: config.table,
          permission: config.permission,
          data,
        });
        if (result.error) throw result.error;
        return result.data as TOutput;
      }

      case 'update': {
        if (!input.id) throw new Error('ID required for update');
        const result = await secureUpdate({
          table: config.table,
          permission: config.permission,
          allowAdminBypass: config.allowAdminBypass,
          id: input.id,
          data,
        });
        if (result.error) throw result.error;
        return result.data as TOutput;
      }

      case 'delete': {
        if (!input.id) throw new Error('ID required for delete');
        const result = await secureDelete({
          table: config.table,
          permission: config.permission,
          allowAdminBypass: config.allowAdminBypass,
          id: input.id,
        });
        if (result.error) throw result.error;
        return null as TOutput;
      }

      default:
        throw new Error(`Unknown operation: ${config.operation}`);
    }
  };
}
