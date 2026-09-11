/**
 * An error that already knows what HTTP status it deserves.
 *
 * US-204: requireAuth threw `new Error('Unauthorized: No authorization header')`
 * — before it ever touched Supabase, so this is purely "the caller sent no
 * credentials". Every function catches it in the same `catch` that guards
 * against genuine faults and answers 500.
 *
 * Smoke-testing all 84 functions with an unauthenticated POST found 20 answering
 * 5xx, at least 14 of them for this reason. That costs two things:
 *
 *   - 5xx is retried. Browsers, CDNs, cron runners and webhook senders all treat
 *     it as "the server is having a moment" and come back; 401 they do not. An
 *     expired session became a retry loop.
 *   - Every auth failure looks like a crash. A platform whose logs are full of
 *     [UnexpectedError] cannot see a real outage against them, and `health-check`
 *     and Sentry are both wired up on the assumption that 500 means something.
 *
 * Carrying the status on the error keeps the decision where the knowledge is:
 * requireAuth knows it is a 401, and handleUnexpectedError should not have to
 * guess from a message string.
 */

/** Error codes from the table in _shared/response.ts. */
export type HttpErrorCode =
  | 'AUTH_TOKEN_MISSING'
  | 'AUTH_TOKEN_EXPIRED'
  | 'AUTH_SESSION_INVALID'
  | 'FORBIDDEN'
  | 'REQUEST_VALIDATION_FAILED';

export class HttpError extends Error {
  readonly status: number;
  readonly code: HttpErrorCode;

  constructor(message: string, status: number, code: HttpErrorCode) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.code = code;
  }
}

/** 401 — the caller did not prove who they are. */
export function unauthorized(
  message: string,
  code: HttpErrorCode = 'AUTH_TOKEN_MISSING'
): HttpError {
  return new HttpError(message, 401, code);
}

/** 403 — the caller proved who they are, and it is not enough. */
export function forbidden(message: string): HttpError {
  return new HttpError(message, 403, 'FORBIDDEN');
}

/**
 * True for an HttpError, including one thrown across a module boundary where
 * `instanceof` can fail — two copies of this module exist whenever a function is
 * imported under a different specifier than the one that threw.
 */
export function isHttpError(error: unknown): error is HttpError {
  if (error instanceof HttpError) return true;
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as { name?: unknown }).name === 'HttpError' &&
    typeof (error as { status?: unknown }).status === 'number'
  );
}

/**
 * The HTTP status an error deserves — its own if it has one, 500 otherwise.
 *
 * For the 25 functions that hand-roll their catch block rather than calling
 * handleUnexpectedError. Changing them all to the standard envelope would change
 * what their callers parse; changing the status alone fixes the defect without
 * touching the contract.
 */
export function errorStatus(error: unknown): number {
  return isHttpError(error) ? error.status : 500;
}
