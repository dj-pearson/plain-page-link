// Centralized error handling utility
// Can be integrated with Sentry or other error monitoring services

interface ErrorContext {
  user?: {
    id: string;
    email?: string;
  };
  action?: string;
  component?: string;
  [key: string]: any;
}

class ErrorHandler {
  private enabled: boolean;

  constructor() {
    this.enabled = import.meta.env.PROD;
  }

  captureException(error: Error, context?: ErrorContext) {
    // Log to console in development
    console.error('[Error Handler]', error, context);

    if (!this.enabled) return;

    // Future: Send to error monitoring service (Sentry, etc.)
    // Sentry.captureException(error, {
    //   contexts: {
    //     custom: context
    //   }
    // });

    // Store error in localStorage for debugging
    this.storeError(error, context);
  }

  captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info', context?: ErrorContext) {
    console.log(`[${level.toUpperCase()}]`, message, context);

    if (!this.enabled) return;

    // Future: Send to error monitoring service
    // Sentry.captureMessage(message, level);
  }

  private storeError(error: Error, context?: ErrorContext) {
    try {
      const errorLog = {
        message: error.message,
        stack: error.stack,
        context,
        timestamp: new Date().toISOString(),
      };

      const existingErrors = JSON.parse(localStorage.getItem('error_logs') || '[]');
      existingErrors.push(errorLog);

      // Keep only last 10 errors
      const recentErrors = existingErrors.slice(-10);
      localStorage.setItem('error_logs', JSON.stringify(recentErrors));
    } catch (e) {
      console.error('Failed to store error:', e);
    }
  }

  setUser(userId: string, email?: string) {
    if (!this.enabled) return;

    // Future: Set user context for error monitoring
    // Sentry.setUser({ id: userId, email });
  }

  clearUser() {
    if (!this.enabled) return;

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
