/**
 * What to tell someone when their action failed.
 *
 * US-199 found the review page discarding the server's own explanation and
 * printing "Please try again" for every failure, so a client whose testimonial
 * was one character over the limit was told to do the one thing that could
 * never work. It is not one page: 26 catch blocks across the app tell someone
 * to try again without saying what happened (US-200).
 *
 * The reason nobody fixed it by just printing `error.message` is that doing so
 * is worse. A Postgres error reads
 *
 *     duplicate key value violates unique constraint "links_user_id_position_key"
 *
 * and a Supabase transport failure reads "Edge Function returned a non-2xx
 * status code". Showing either to an agent is noise with the added cost of
 * leaking a schema.
 *
 * So this decides. A message that was written for a person is passed through; a
 * database code is translated into what it means for the thing they were doing;
 * and infrastructure noise falls back to the caller's own sentence, which is
 * all that was ever available before.
 */

import { logger } from '@/lib/logger';

/**
 * Postgres and PostgREST codes worth explaining, as a function of the noun the
 * caller was acting on — "That link already exists" beats "23505".
 */
const CODE_MESSAGES: Record<string, (subject: string) => string> = {
  '23505': (s) => `That ${s} already exists.`,
  '23503': (s) => `That ${s} refers to something that no longer exists.`,
  '23514': (s) => `Some of the ${s} details are not valid.`,
  '22001': (s) => `One of the ${s} fields is too long.`,
  '22P02': (s) => `Some of the ${s} details are in the wrong format.`,
  '42501': (s) => `You do not have permission to change this ${s}.`,
  PGRST116: (s) => `That ${s} could not be found. It may have been deleted.`,
  PGRST301: () => 'Your session has expired. Please sign in again.',
};

/**
 * Text that is about the plumbing rather than about what the person did.
 * Recognised so it can be logged and not shown.
 */
const INFRASTRUCTURE = [
  /edge function returned/i,
  /non-2xx/i,
  /failed to fetch/i,
  /networkerror/i,
  /load failed/i,
  /\bECONN/i,
  /violates .*constraint/i,
  /^\s*\{/, // a serialised object
  /relation ".*" does not exist/i,
  /column ".*" does not exist/i,
];

interface SupabaseLikeError {
  code?: unknown;
  message?: unknown;
  error?: { message?: unknown } | unknown;
}

function codeOf(error: unknown): string | undefined {
  const code = (error as SupabaseLikeError)?.code;
  return typeof code === 'string' ? code : undefined;
}

function messageOf(error: unknown): string | undefined {
  if (error instanceof Error) return error.message;
  const candidate = error as SupabaseLikeError;
  if (typeof candidate?.message === 'string') return candidate.message;
  const nested = (candidate?.error as { message?: unknown } | undefined)?.message;
  if (typeof nested === 'string') return nested;
  return undefined;
}

export interface UserFacingErrorOptions {
  /**
   * The noun the person was acting on — 'link', 'listing', 'profile'. Used to
   * word the database-code messages, which are otherwise about nothing.
   */
  subject: string;
  /** What to say when the failure has nothing a person can act on. */
  fallback: string;
}

/**
 * Turn whatever was thrown into one sentence worth showing.
 *
 * Never throws, and never returns an empty string: a caller can put the result
 * straight into a toast.
 */
export function userFacingError(error: unknown, options: UserFacingErrorOptions): string {
  const { subject, fallback } = options;

  const code = codeOf(error);
  if (code && CODE_MESSAGES[code]) return CODE_MESSAGES[code](subject);

  const message = messageOf(error)?.trim();
  if (!message) return fallback;

  if (INFRASTRUCTURE.some((pattern) => pattern.test(message))) {
    // Worth having, just not worth showing.
    logger.debug('Suppressed an infrastructure error from the UI', { subject, message });
    return fallback;
  }

  // A sentence someone wrote for a person: an edge function's validation
  // message, a thrown Error with a real explanation. Long text is not that.
  if (message.length > 200) return fallback;

  return message;
}
