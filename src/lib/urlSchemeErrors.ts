/**
 * US-456: the database refuses a URL that is not a web address in the columns
 * an agent writes that become links on their public page
 * (migration 20261108000456_agent_url_scheme_checks.sql). The refusal is a
 * check_violation on a constraint named `<table>_<column>_scheme`; this turns
 * it into a sentence the agent can act on instead of Postgres's
 * "new row for relation ... violates check constraint ...".
 */

const FIELD_LABELS: Record<string, string> = {
  links_url: 'The link address',
  listings_virtual_tour_url: 'The virtual tour link',
  profiles_website_url: 'Your website address',
  profiles_instagram_url: 'Your Instagram link',
  profiles_facebook_url: 'Your Facebook link',
  profiles_linkedin_url: 'Your LinkedIn link',
  profiles_tiktok_url: 'Your TikTok link',
  profiles_youtube_url: 'Your YouTube link',
  profiles_zillow_url: 'Your Zillow link',
  profiles_realtor_com_url: 'Your Realtor.com link',
  profiles_calendly_url: 'Your Calendly link',
};

export interface UrlSchemeError {
  /** `<table>_<column>`, e.g. `profiles_instagram_url`. */
  field: string;
  /** A message written for the agent. */
  message: string;
}

/**
 * The field a URL-scheme refusal names, with a message for the agent, or null
 * when the error is anything else.
 */
export function urlSchemeErrorFrom(error: unknown): UrlSchemeError | null {
  if (!error || typeof error !== 'object') return null;
  const e = error as { message?: unknown; details?: unknown; code?: unknown };
  const text = [e.message, e.details].filter((v): v is string => typeof v === 'string').join(' ');
  const match = /check constraint "([a-z_]+)_scheme"/.exec(text);
  if (!match) return null;
  const field = match[1];
  const label = FIELD_LABELS[field];
  if (!label) return null;
  const allowed =
    field === 'links_url'
      ? 'a web address starting with https://, an email (mailto:) or a phone number (tel:)'
      : 'a full web address starting with https://';
  return { field, message: `${label} must be ${allowed}.` };
}
