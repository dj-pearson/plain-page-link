// Centralized error handling utility
// Can be integrated with Sentry or other error monitoring services

import { logger, sanitizeObject, truncateId } from '@/lib/logger';

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

    if (!this.enabled) return;

    // Future: Send to error monitoring service (Sentry, etc.)
    // Sentry.captureException(error, {
    //   contexts: {
    //     custom: context
    //   }
    // });

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

    if (!this.enabled) return;

    // Future: Send to error monitoring service
    // Sentry.captureMessage(message, level);
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

  setUser(userId: string, email?: string) {
    if (!this.enabled) return;

    // Log user context change (with truncated ID for privacy)
    logger.debug('Error handler: User context set', { userId: truncateId(userId) });

    // Future: Set user context for error monitoring
    // Sentry.setUser({ id: userId, email });
  }

  clearUser() {
    if (!this.enabled) return;

    logger.debug('Error handler: User context cleared');

    // Future: Clear user context
    // Sentry.setUser(null);
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
export function handleApiError(error: any, context?: ErrorContext): string {
  let message = 'An unexpected error occurred';

  if (error?.message) {
    message = error.message;
  } else if (error?.error) {
    message = error.error;
  } else if (typeof error === 'string') {
    message = error;
  }

  errorHandler.captureException(
    error instanceof Error ? error : new Error(message),
    context
  );

  return message;
}
