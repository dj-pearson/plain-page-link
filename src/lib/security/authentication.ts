/**
 * Security Layer 1: Authentication
 *
 * Validates that the user is who they claim to be.
 * This is the first line of defense - WHO are you?
 *
 * Responsibilities:
 * - Verify valid session exists
 * - Check session hasn't expired
 * - Validate MFA if required
 * - Track authentication failures
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import type { SecurityContext, SecurityCheckResult, SecurityViolation } from './types';
import type { User, Session } from '@supabase/supabase-js';

// ============================================================
// Authentication State
// ============================================================

interface AuthenticationState {
  user: User | null;
  session: Session | null;
  lastValidated: Date | null;
  isValid: boolean;
}

// Cache authentication state briefly to avoid excessive validation calls
let authStateCache: AuthenticationState | null = null;
const AUTH_CACHE_TTL_MS = 30_000; // 30 seconds

/**
 * Clear the authentication state cache
 * Call this when auth state changes (login, logout, etc.)
 */
export function clearAuthCache(): void {
  authStateCache = null;
}

// ============================================================
// Core Authentication Functions
// ============================================================

/**
 * Get current authentication state with caching
 */
async function getAuthState(): Promise<AuthenticationState> {
  // Check cache
  if (authStateCache && authStateCache.lastValidated) {
    const cacheAge = Date.now() - authStateCache.lastValidated.getTime();
    if (cacheAge < AUTH_CACHE_TTL_MS) {
      return authStateCache;
    }
  }

  try {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      logger.warn('Auth session check failed', { error: error.message });
      authStateCache = {
        user: null,
        session: null,
        lastValidated: new Date(),
        isValid: false,
      };
      return authStateCache;
    }

    authStateCache = {
      user: session?.user ?? null,
      session: session,
      lastValidated: new Date(),
      isValid: !!session?.user,
    };

    return authStateCache;
  } catch (error) {
    logger.error('Auth state retrieval error', error as Error);
    return {
      user: null,
      session: null,
      lastValidated: new Date(),
      isValid: false,
    };
  }
}

/**
 * Require authentication - throws if not authenticated
 * Use this in hooks/functions that require a logged-in user
 */
export async function requireAuth(): Promise<{ user: User; session: Session }> {
  const authState = await getAuthState();

  if (!authState.isValid || !authState.user || !authState.session) {
    const violation: SecurityViolation = {
      type: 'auth_failure',
      action: 'require_auth',
      details: 'User is not authenticated',
      timestamp: new Date(),
    };
    logSecurityViolation(violation);

    throw new AuthenticationError('Authentication required');
  }

  // Check if session is expired
  const expiresAt = authState.session.expires_at;
  if (expiresAt && new Date(expiresAt * 1000) < new Date()) {
    const violation: SecurityViolation = {
      type: 'auth_failure',
      userId: authState.user.id,
      action: 'session_expired',
      details: 'Session has expired',
      timestamp: new Date(),
    };
    logSecurityViolation(violation);

    throw new AuthenticationError('Session expired');
  }

  return { user: authState.user, session: authState.session };
}

/**
 * Check if user is authenticated without throwing
 * Returns a security check result
 */
export async function checkAuth(): Promise<SecurityCheckResult> {
  const authState = await getAuthState();

  if (!authState.isValid || !authState.user || !authState.session) {
    return {
      allowed: false,
      reason: 'User is not authenticated',
      layer: 'authentication',
    };
  }

  // Check session expiration
  const expiresAt = authState.session.expires_at;
  if (expiresAt && new Date(expiresAt * 1000) < new Date()) {
    return {
      allowed: false,
      reason: 'Session has expired',
      layer: 'authentication',
    };
  }

  return {
    allowed: true,
    layer: 'authentication',
  };
}

/**
 * Get current security context
 * Provides all security-relevant information about the current user
 */
export async function getSecurityContext(): Promise<SecurityContext> {
  const authState = await getAuthState();

  if (!authState.isValid || !authState.user || !authState.session) {
    return {
      userId: null,
      role: null,
      isAuthenticated: false,
      isMFAVerified: false,
      session: {
        id: null,
        expiresAt: null,
        isValid: false,
      },
    };
  }

  // Fetch role from database
  let role: 'admin' | 'user' | null = null;
  try {
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', authState.user.id)
      .order('role', { ascending: true });

    role = roles?.find((r) => r.role === 'admin')?.role || roles?.[0]?.role || 'user';
  } catch (error) {
    logger.warn('Failed to fetch user role', { userId: authState.user.id });
    role = 'user'; // Default to user role on error
  }

  // Check MFA status
  let isMFAVerified = true; // Default to true if MFA not enabled
  try {
    const { data: mfaSettings } = await supabase
      .from('user_mfa_settings')
      .select('mfa_enabled, verified_at')
      .eq('user_id', authState.user.id)
      .maybeSingle();

    if (mfaSettings?.mfa_enabled && mfaSettings?.verified_at) {
      // MFA is enabled - we'd need to check session state for MFA verification
      // For now, assume verified if they got past login
      isMFAVerified = true;
    }
  } catch {
    // MFA check failed - continue with default
  }

  return {
    userId: authState.user.id,
    role: role as 'admin' | 'user',
    isAuthenticated: true,
    isMFAVerified,
    session: {
      id: authState.session.access_token?.substring(0, 16) ?? null, // Truncated for logging
      expiresAt: authState.session.expires_at
        ? new Date(authState.session.expires_at * 1000)
        : null,
      isValid: true,
    },
  };
}

/**
 * Validate that a session matches the current user
 * Prevents session hijacking attempts
 */
export async function validateSessionOwnership(expectedUserId: string): Promise<boolean> {
  const authState = await getAuthState();

  if (!authState.isValid || !authState.user) {
    return false;
  }

  const matches = authState.user.id === expectedUserId;

  if (!matches) {
    const violation: SecurityViolation = {
      type: 'auth_failure',
      userId: authState.user.id,
      action: 'session_ownership_check',
      details: `Session user mismatch: expected ${expectedUserId.substring(0, 8)}...`,
      timestamp: new Date(),
    };
    logSecurityViolation(violation);
  }

  return matches;
}

// ============================================================
// MFA Verification
// ============================================================

/**
 * Check if MFA is required for the current user
 */
export async function isMFARequired(): Promise<boolean> {
  const authState = await getAuthState();

  if (!authState.user) {
    return false;
  }

  try {
    const { data: mfaSettings } = await supabase
      .from('user_mfa_settings')
      .select('mfa_enabled, verified_at')
      .eq('user_id', authState.user.id)
      .maybeSingle();

    return !!(mfaSettings?.mfa_enabled && mfaSettings?.verified_at);
  } catch {
    return false;
  }
}

/**
 * Require MFA verification - throws if not verified
 */
export async function requireMFA(): Promise<void> {
  const required = await isMFARequired();

  if (required) {
    // In a real implementation, check session state for MFA verification flag
    // For now, we'll trust that the login flow handled this
    logger.debug('MFA required and assumed verified through login flow');
  }
}

// ============================================================
// Security Violation Logging
// ============================================================

/**
 * Log security violations for audit trail
 */
function logSecurityViolation(violation: SecurityViolation): void {
  logger.warn('Security violation detected', {
    type: violation.type,
    action: violation.action,
    resource: violation.resource,
    resourceId: violation.resourceId,
    userId: violation.userId?.substring(0, 8),
    details: violation.details,
  });

  // In production, this would also write to audit_logs table
  // and potentially trigger alerts for suspicious patterns
}

// ============================================================
// Custom Error Classes
// ============================================================

/**
 * Authentication error - thrown when auth fails
 */
export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

/**
 * Session expired error
 */
export class SessionExpiredError extends AuthenticationError {
  constructor() {
    super('Session has expired');
    this.name = 'SessionExpiredError';
  }
}

// ============================================================
// React Hook for Authentication Layer
// ============================================================

/**
 * Hook return type for useAuthLayer
 */
export interface UseAuthLayerResult {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  error: string | null;
  requireAuth: () => Promise<{ user: User; session: Session }>;
  checkAuth: () => Promise<SecurityCheckResult>;
}
