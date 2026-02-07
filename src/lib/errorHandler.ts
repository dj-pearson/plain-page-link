// Centralized error handling utility
// Integrated with Sentry for production error monitoring

import { logger, sanitizeObject, truncateId } from '@/lib/logger';
import * as SentryLib from '@/lib/sentry';

interface ErrorContext {
  user?: {
    id: string;
    email?: string;
  };
  action?: string;
  component?: string;
  [key: string]: unknown;
}

class ErrorHandler {
  private enabled: boolean;
  private isDevelopment: boolean;

  constructor() {
    this.enabled = import.meta.env.PROD;
    this.isDevelopment = import.meta.env.DEV;
  }

  captureException(error: Error, context?: ErrorContext) {
    // Use secure logger instead of direct console.error
    const sanitizedContext = context ? sanitizeObject(context) : undefined;
    logger.error('Error captured', error, sanitizedContext as Record<string, unknown>);

    // Send to Sentry in production
    if (this.enabled) {
      SentryLib.captureException(error, {
        action: context?.action,
        component: context?.component,
        userId: context?.user?.id ? truncateId(context.user.id) : undefined,
        ...sanitizedContext,
      });

      // Add breadcrumb for debugging
      SentryLib.addBreadcrumb({
        category: 'error',
        message: error.message,
        level: 'error',
        data: {
          action: context?.action,
          component: context?.component,
        },
      });
    }

    // Store error in localStorage for debugging (only non-sensitive data)
    this.storeError(error, context);
  }

  captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info', context?: ErrorContext) {
    const sanitizedContext = context ? sanitizeObject(context) : undefined;

    switch (level) {
      case 'error':
        logger.error(message, undefined, sanitizedContext as Record<string, unknown>);
        break;
      case 'warning':
        logger.warn(message, sanitizedContext as Record<string, unknown>);
        break;
      default:
        logger.info(message, sanitizedContext as Record<string, unknown>);
    }

    // Send to Sentry in production
    if (this.enabled) {
      const sentryLevel = level === 'warning' ? 'warning' : level === 'error' ? 'error' : 'info';
      SentryLib.captureMessage(message, sentryLevel, sanitizedContext as Record<string, unknown>);
    }
  }

  private storeError(error: Error, context?: ErrorContext) {
    try {
      // Only store sanitized error data - no stack traces in production
      const errorLog = {
        message: error.message,
        // Only include stack in development
        stack: this.isDevelopment ? error.stack : undefined,
        // Sanitize context to remove sensitive data
        context: context ? {
          action: context.action,
          component: context.component,
          // Truncate user ID for privacy
          userId: context.user?.id ? truncateId(context.user.id) : undefined,
        } : undefined,
        timestamp: new Date().toISOString(),
      };

      const existingErrors = JSON.parse(localStorage.getItem('error_logs') || '[]');
      existingErrors.push(errorLog);

      // Keep only last 10 errors
      const recentErrors = existingErrors.slice(-10);
      localStorage.setItem('error_logs', JSON.stringify(recentErrors));
    } catch (e) {
      // Don't log the error to avoid infinite loops
      // Just silently fail - localStorage storage is non-critical
    }
  }

  setUser(userId: string, email?: string, username?: string) {
    // Log user context change (with truncated ID for privacy)
    logger.debug('Error handler: User context set', { userId: truncateId(userId) });

    // Set user context in Sentry
    if (this.enabled) {
      SentryLib.setUser({
        id: userId,
        email,
        username,
      });
    }
  }

  clearUser() {
    logger.debug('Error handler: User context cleared');

    // Clear user context in Sentry
    if (this.enabled) {
      SentryLib.clearUser();
    }
  }

  /**
   * Set additional context for error tracking
   */
  setContext(name: string, context: Record<string, unknown>) {
    if (this.enabled) {
      SentryLib.setContext(name, context);
    }
  }

  /**
   * Set a tag for filtering errors
   */
  setTag(key: string, value: string) {
    if (this.enabled) {
      SentryLib.setTag(key, value);
    }
  }

  /**
   * Add a breadcrumb for debugging
   */
  addBreadcrumb(category: string, message: string, data?: Record<string, unknown>) {
    if (this.enabled) {
      SentryLib.addBreadcrumb({
        category,
        message,
        level: 'info',
        data,
      });
    }
  }
}

export const errorHandler = new ErrorHandler();

// Helper function to wrap async operations with error handling
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  context?: ErrorContext
): Promise<T | null> {
  try {
    return await operation();
  } catch (error) {
    errorHandler.captureException(error as Error, context);
    return null;
  }
}

// Helper to handle API errors
export function handleApiError(error: unknown, context?: ErrorContext): string {
  let message = 'An unexpected error occurred';

  if (error && typeof error === 'object') {
    const err = error as { message?: string; error?: string };
    if (err.message) {
      message = err.message;
    } else if (err.error) {
      message = err.error;
    }
  } else if (typeof error === 'string') {
    message = error;
  }

  errorHandler.captureException(
    error instanceof Error ? error : new Error(message),
    context
  );

  return message;
}
