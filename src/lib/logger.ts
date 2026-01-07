/**
 * Secure Logger Utility
 *
 * Environment-aware logging that prevents sensitive data from being
 * logged in production. Provides structured logging with different
 * log levels and automatic sanitization.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

// Patterns that indicate sensitive data - these values will be redacted
const SENSITIVE_PATTERNS = [
  /password/i,
  /token/i,
  /secret/i,
  /key/i,
  /authorization/i,
  /cookie/i,
  /session/i,
];

// Keys that should always have their values redacted
const SENSITIVE_KEYS = new Set([
  'password',
  'token',
  'accessToken',
  'refreshToken',
  'apiKey',
  'secret',
  'authorization',
  'cookie',
  'sessionId',
  'jwt',
  'bearer',
]);

/**
 * Check if a key name indicates sensitive data
 */
function isSensitiveKey(key: string): boolean {
  const lowerKey = key.toLowerCase();
  if (SENSITIVE_KEYS.has(lowerKey)) return true;
  return SENSITIVE_PATTERNS.some(pattern => pattern.test(key));
}

/**
 * Redact a value, showing only partial information
 */
function redactValue(value: unknown): string {
  if (typeof value === 'string') {
    if (value.length <= 8) return '[REDACTED]';
    return `${value.substring(0, 4)}...[REDACTED]`;
  }
  return '[REDACTED]';
}

/**
 * Sanitize an object by redacting sensitive values
 */
function sanitizeObject(obj: unknown, depth = 0): unknown {
  // Prevent infinite recursion
  if (depth > 5) return '[MAX_DEPTH]';

  if (obj === null || obj === undefined) return obj;

  if (typeof obj === 'string') {
    // Redact things that look like tokens or keys (long base64-ish strings)
    if (obj.length > 50 && /^[A-Za-z0-9+/=_-]+$/.test(obj)) {
      return redactValue(obj);
    }
    // Redact email addresses partially
    if (obj.includes('@') && obj.includes('.')) {
      const [local, domain] = obj.split('@');
      if (local && domain) {
        const redactedLocal = local.length > 2
          ? `${local[0]}***${local[local.length - 1]}`
          : '***';
        return `${redactedLocal}@${domain}`;
      }
    }
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item, depth + 1));
  }

  if (typeof obj === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      if (isSensitiveKey(key)) {
        sanitized[key] = redactValue(value);
      } else {
        sanitized[key] = sanitizeObject(value, depth + 1);
      }
    }
    return sanitized;
  }

  return obj;
}

/**
 * Truncate user ID for logging (show first 8 chars)
 */
export function truncateId(id: string | null | undefined): string {
  if (!id) return '[none]';
  if (id.length <= 8) return id;
  return `${id.substring(0, 8)}...`;
}

class SecureLogger {
  private isDevelopment: boolean;
  private isEnabled: boolean;

  constructor() {
    this.isDevelopment = import.meta.env.DEV;
    // In production, only errors are logged by default
    // Can be overridden with VITE_ENABLE_LOGGING=true
    this.isEnabled = this.isDevelopment || import.meta.env.VITE_ENABLE_LOGGING === 'true';
  }

  /**
   * Check if logging is enabled for a given level
   */
  private shouldLog(level: LogLevel): boolean {
    if (this.isDevelopment) return true;
    // In production, only log errors unless explicitly enabled
    if (level === 'error') return true;
    return this.isEnabled;
  }

  /**
   * Format the log message with timestamp and level
   */
  private formatMessage(level: LogLevel, message: string): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  }

  /**
   * Log a debug message (development only)
   */
  debug(message: string, context?: LogContext): void {
    if (!this.shouldLog('debug')) return;

    const sanitizedContext = context ? sanitizeObject(context) : undefined;
    if (sanitizedContext) {
      console.debug(this.formatMessage('debug', message), sanitizedContext);
    } else {
      console.debug(this.formatMessage('debug', message));
    }
  }

  /**
   * Log an info message
   */
  info(message: string, context?: LogContext): void {
    if (!this.shouldLog('info')) return;

    const sanitizedContext = context ? sanitizeObject(context) : undefined;
    if (sanitizedContext) {
      console.info(this.formatMessage('info', message), sanitizedContext);
    } else {
      console.info(this.formatMessage('info', message));
    }
  }

  /**
   * Log a warning message
   */
  warn(message: string, context?: LogContext): void {
    if (!this.shouldLog('warn')) return;

    const sanitizedContext = context ? sanitizeObject(context) : undefined;
    if (sanitizedContext) {
      console.warn(this.formatMessage('warn', message), sanitizedContext);
    } else {
      console.warn(this.formatMessage('warn', message));
    }
  }

  /**
   * Log an error message (always logged, even in production)
   */
  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const sanitizedContext = context ? sanitizeObject(context) : undefined;

    // In production, don't include stack traces
    if (!this.isDevelopment) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (sanitizedContext) {
        console.error(this.formatMessage('error', message), { error: errorMessage, ...sanitizedContext as object });
      } else {
        console.error(this.formatMessage('error', message), { error: errorMessage });
      }
      return;
    }

    // In development, include full error details
    if (sanitizedContext) {
      console.error(this.formatMessage('error', message), error, sanitizedContext);
    } else if (error) {
      console.error(this.formatMessage('error', message), error);
    } else {
      console.error(this.formatMessage('error', message));
    }
  }

  /**
   * Log an authentication event (with truncated user ID)
   */
  authEvent(event: string, userId?: string | null): void {
    if (!this.shouldLog('info')) return;

    this.info(`Auth: ${event}`, {
      userId: truncateId(userId)
    });
  }
}

// Export singleton instance
export const logger = new SecureLogger();

// Export utility functions
export { sanitizeObject, isSensitiveKey };
