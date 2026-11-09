/**
 * US-517 (US-466): the virtual tour link on a listing.
 *
 * US-456 made the database refuse a virtual_tour_url that is not an http(s)
 * address (listings_virtual_tour_url_scheme). The listing forms did not know:
 * the edit dialog used type="url", which the browser satisfies with
 * "javascript:x" and refuses for "my.matterport.com/show?m=1" (how most
 * agents paste one); the add form's z.string().url() had the same two faults.
 * A refused save then toasted "Failed to update listing. Please try again.",
 * which reads as a dropped connection to retry.
 *
 * The value is now checked before the save is sent, the same way the Profile
 * page checks its links (src/lib/profileUrls.ts): a bare host gains https://,
 * anything sanitizeExternalUrl refuses is reported next to the field in the
 * words the database refusal would produce. A refusal that still reaches the
 * database (an older tab, the CSV import) is described the same way.
 */
import { sanitizeExternalUrl } from '@/utils/sanitizeUrl';
import { urlFieldMessage, urlSchemeErrorFrom } from '@/lib/urlSchemeErrors';
import { planLimitKeyFromError } from '@/lib/planLimits';

export const VIRTUAL_TOUR_URL_MESSAGE =
  urlFieldMessage('listings_virtual_tour_url') ??
  'The virtual tour link must be a full web address starting with https://.';

/**
 * Check a virtual tour URL. Returns the value to save ('' for empty, https://
 * added to a bare host) or the sentence to show the agent.
 */
export function normalizeVirtualTourUrl(
  raw: string | null | undefined
): { value: string } | { error: string } {
  const trimmed = (raw ?? '').trim();
  if (!trimmed) return { value: '' };
  const safe = sanitizeExternalUrl(trimmed);
  return safe ? { value: safe } : { error: VIRTUAL_TOUR_URL_MESSAGE };
}

/**
 * The toast text for a listing save the server refused. A URL-scheme refusal
 * names the field, a plan-limit refusal carries the trigger's message (written
 * for the agent, 20260923000002); anything else falls back to `fallback`,
 * since a raw Postgres message is not something an agent can act on.
 */
export function describeListingSaveError(error: unknown, fallback: string): string {
  const urlError = urlSchemeErrorFrom(error);
  if (urlError) return urlError.message;
  if (planLimitKeyFromError(error)) {
    const message =
      error && typeof error === 'object' && 'message' in error && typeof error.message === 'string'
        ? error.message
        : '';
    return message || 'Your plan does not include this change.';
  }
  return fallback;
}
