/**
 * useLoginSecurity Hook
 * Provides brute force protection and login throttling functionality
 */

import { supabase } from '@/integrations/supabase/client';

interface ThrottleCheckResult {
  success: boolean;
  blocked: boolean;
  attemptsRemaining: number;
  blockedUntil: string | null;
  reason: string | null;
}

interface RecordAttemptResult {
  success: boolean;
  attemptId: string;
}

interface RegisterSessionResult {
  success: boolean;
  sessionId: string;
}

/**
 * Check if login should be throttled for the given email
 */
export async function checkLoginThrottle(email: string): Promise<ThrottleCheckResult> {
  try {
    const { data, error } = await supabase.functions.invoke('login-security', {
      body: {
        action: 'check_throttle',
        email: email.toLowerCase().trim(),
      },
    });

    if (error) {
      console.error('Throttle check error:', error);
      // Allow login on error to avoid blocking legitimate users
      return {
        success: false,
        blocked: false,
        attemptsRemaining: 5,
        blockedUntil: null,
        reason: null,
      };
    }

    return data;
  } catch (error) {
    console.error('Throttle check error:', error);
    return {
      success: false,
      blocked: false,
      attemptsRemaining: 5,
      blockedUntil: null,
      reason: null,
    };
  }
}

/**
 * Record a login attempt (success or failure)
 */
export async function recordLoginAttempt(
  email: string,
  success: boolean,
  userId?: string,
  failureReason?: string,
  deviceFingerprint?: string
): Promise<RecordAttemptResult | null> {
  try {
    const { data, error } = await supabase.functions.invoke('login-security', {
      body: {
        action: 'record_attempt',
        email: email.toLowerCase().trim(),
        userId,
        success,
        failureReason,
        deviceFingerprint,
      },
    });

    if (error) {
      console.error('Failed to record login attempt:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Failed to record login attempt:', error);
    return null;
  }
}

/**
 * Register a new session after successful login
 */
export async function registerSession(
  userId: string,
  expiresAt: string,
  deviceType?: string,
  browser?: string,
  os?: string
): Promise<RegisterSessionResult | null> {
  try {
    // Generate a session token hash (in production, use actual session token)
    const sessionTokenHash = await generateSessionTokenHash();

    const { data, error } = await supabase.functions.invoke('login-security', {
      body: {
        action: 'register_session',
        userId,
        sessionTokenHash,
        expiresAt,
        deviceType,
        browser,
        os,
      },
    });

    if (error) {
      console.error('Failed to register session:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Failed to register session:', error);
    return null;
  }
}

/**
 * Generate a hash for the session token
 */
async function generateSessionTokenHash(): Promise<string> {
  const randomBytes = new Uint8Array(32);
  crypto.getRandomValues(randomBytes);

  const hashBuffer = await crypto.subtle.digest('SHA-256', randomBytes);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Get device fingerprint for session tracking
 */
export function getDeviceFingerprint(): string {
  const components = [
    navigator.userAgent,
    navigator.language,
    screen.width,
    screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    navigator.hardwareConcurrency || 'unknown',
  ];

  return btoa(components.join('|'));
}

/**
 * Parse user agent to get device info
 */
export function parseUserAgent(userAgent: string): {
  deviceType: 'desktop' | 'mobile' | 'tablet';
  browser: string;
  os: string;
} {
  const ua = userAgent.toLowerCase();

  // Device type
  let deviceType: 'desktop' | 'mobile' | 'tablet' = 'desktop';
  if (/tablet|ipad/i.test(ua)) {
    deviceType = 'tablet';
  } else if (/mobile|android|iphone|phone/i.test(ua)) {
    deviceType = 'mobile';
  }

  // Browser
  let browser = 'Unknown';
  if (/edg\//i.test(userAgent)) browser = 'Edge';
  else if (/chrome/i.test(userAgent) && !/edg\//i.test(userAgent)) browser = 'Chrome';
  else if (/firefox/i.test(userAgent)) browser = 'Firefox';
  else if (/safari/i.test(userAgent) && !/chrome/i.test(userAgent)) browser = 'Safari';
  else if (/opera|opr\//i.test(userAgent)) browser = 'Opera';

  // OS
  let os = 'Unknown';
  if (/windows/i.test(userAgent)) os = 'Windows';
  else if (/macintosh|mac os x/i.test(userAgent)) os = 'macOS';
  else if (/linux/i.test(userAgent) && !/android/i.test(userAgent)) os = 'Linux';
  else if (/android/i.test(userAgent)) os = 'Android';
  else if (/iphone|ipad|ipod/i.test(userAgent)) os = 'iOS';

  return { deviceType, browser, os };
}

/**
 * Format blocked until time for display
 */
export function formatBlockedUntil(blockedUntil: string): string {
  const blocked = new Date(blockedUntil);
  const now = new Date();
  const diffMs = blocked.getTime() - now.getTime();
  const diffMins = Math.ceil(diffMs / 60000);

  if (diffMins <= 0) return 'now';
  if (diffMins === 1) return '1 minute';
  if (diffMins < 60) return `${diffMins} minutes`;

  const diffHours = Math.ceil(diffMins / 60);
  return `${diffHours} hour${diffHours > 1 ? 's' : ''}`;
}

/**
 * Custom hook for login security (optional wrapper)
 */
export function useLoginSecurity() {
  return {
    checkThrottle: checkLoginThrottle,
    recordAttempt: recordLoginAttempt,
    registerSession,
    getDeviceFingerprint,
    parseUserAgent,
    formatBlockedUntil,
  };
}
