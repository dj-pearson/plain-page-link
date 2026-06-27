/**
 * Shared error helpers for edge functions.
 *
 * getErrorMessage normalizes an unknown caught value into a string message,
 * since `catch` variables are `unknown` and may not be Error instances.
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}
