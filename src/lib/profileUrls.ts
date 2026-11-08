/**
 * US-290: the URL fields on the Profile page.
 *
 * Only website_url used to be type="url"; the social, Zillow, Realtor.com and
 * Calendly fields saved any string. US-456 made the database refuse a value
 * that is not an http(s) address, but the agent then learned about it from a
 * banner after the round trip, and a bare host ("zillow.com/me", which is how
 * most people paste a profile) was refused instead of fixed. These are now
 * checked before the save is sent: a bare host gains https://, anything else
 * sanitizeExternalUrl refuses is reported next to its field and nothing is
 * saved.
 */
import { sanitizeExternalUrl } from '@/utils/sanitizeUrl';
import { urlFieldMessage } from '@/lib/urlSchemeErrors';

/** The profile columns that hold an external link, and the tab each is on. */
export const PROFILE_URL_FIELDS = {
  website_url: 'contact',
  calendly_url: 'contact',
  facebook_url: 'social',
  instagram_url: 'social',
  linkedin_url: 'social',
  tiktok_url: 'social',
  youtube_url: 'social',
  zillow_url: 'social',
  realtor_com_url: 'social',
} as const;

export type ProfileUrlField = keyof typeof PROFILE_URL_FIELDS;

export const PROFILE_URL_FIELD_NAMES = Object.keys(PROFILE_URL_FIELDS) as ProfileUrlField[];

export type ProfileUrlErrors = Partial<Record<ProfileUrlField, string>>;

export interface NormalizedProfileUrls {
  /** Every URL field, cleaned: '' for empty, https:// added to a bare host. */
  values: Record<ProfileUrlField, string>;
  /** A message per field that cannot be saved. Empty when all are fine. */
  errors: ProfileUrlErrors;
}

/** An https:// address, after sanitizeExternalUrl, or '' when it is not one. */
export function httpsOnlyUrl(raw: string | null | undefined): string {
  const safe = sanitizeExternalUrl(raw);
  return /^https:\/\//i.test(safe) ? safe : '';
}

/**
 * Check one URL field. Returns the value to save, or an error for the agent.
 * Calendly must be https: its scheduler is framed inside the agent's public
 * page, which is served over https and cannot embed an http:// page.
 */
export function normalizeProfileUrl(
  field: ProfileUrlField,
  raw: string | null | undefined
): { value: string } | { error: string } {
  const trimmed = (raw ?? '').trim();
  if (!trimmed) return { value: '' };
  const safe = field === 'calendly_url' ? httpsOnlyUrl(trimmed) : sanitizeExternalUrl(trimmed);
  if (safe) return { value: safe };
  return {
    error:
      urlFieldMessage(`profiles_${field}`) ??
      'This link must be a full web address starting with https://.',
  };
}

/** Check every URL field on the form at once. */
export function normalizeProfileUrls(
  form: Record<ProfileUrlField, string | null | undefined>
): NormalizedProfileUrls {
  const values = {} as Record<ProfileUrlField, string>;
  const errors: ProfileUrlErrors = {};
  for (const field of PROFILE_URL_FIELD_NAMES) {
    const result = normalizeProfileUrl(field, form[field]);
    if ('error' in result) {
      errors[field] = result.error;
      values[field] = form[field] ?? '';
    } else {
      values[field] = result.value;
    }
  }
  return { values, errors };
}
