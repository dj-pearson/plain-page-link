/**
 * The agent profile, as the `profiles` table actually stores it.
 *
 * This file previously described a schema that does not exist: `id: number`
 * (it is a uuid), plus `user_id`, `slug`, `display_name` and `profile_photo`,
 * none of which are columns. That is the same failure the `blog_posts` entry in
 * CLAUDE.md caused for `gdpr-export` — a type written from what a feature
 * "should" have rather than from the schema — and it had the same result:
 * ProfileHeader and StickyActionBar rendered `profile.profile_photo`, which is
 * always undefined, so **every public profile showed the initials placeholder
 * instead of the agent's headshot**. The real column is `avatar_url`, which
 * usePublicProfile was selecting correctly all along. Fixed in US-056.
 *
 * Derived from `Database['public']['Tables']['profiles']['Row']` rather than
 * restated, so it cannot drift again — `npm run types:generate` regenerates the
 * source of truth, and anything this file adds on top is opt-in.
 */

import type { Database } from '@/integrations/supabase/types';

/** A row from `profiles`, exactly as stored. */
export type ProfileRow = Database['public']['Tables']['profiles']['Row'];

/**
 * The profile as the public-facing components consume it.
 *
 * Identical to the row. The jsonb columns (`specialties`, `certifications`,
 * `service_cities`, `service_zip_codes`) are narrowed to string arrays, which
 * is what every reader already assumes and what the settings UI writes; a
 * malformed value degrades to an empty list at the read boundary rather than
 * throwing mid-render.
 */
export type Profile = Omit<
  ProfileRow,
  'specialties' | 'certifications' | 'service_cities' | 'service_zip_codes'
> & {
  specialties: string[] | null;
  certifications: string[] | null;
  service_cities: string[] | null;
  service_zip_codes: string[] | null;
};

/** Narrows one of the jsonb list columns to the string[] the UI expects. */
export function toStringList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : [];
}

/**
 * The read boundary: turns a raw `profiles` row into a `Profile`.
 *
 * The four jsonb columns arrive as `Json`, which is not `string[]`. Every
 * reader in the app already assumes a list, so narrow once here rather than
 * casting at each call site — a cast would restore exactly the drift this
 * module exists to prevent. A malformed value degrades to `[]`.
 */
export function toProfile<T extends ProfileRow>(row: T): Profile;
export function toProfile<T extends ProfileRow>(row: T | null | undefined): Profile | null;
export function toProfile<T extends ProfileRow>(row: T | null | undefined): Profile | null {
  if (!row) return null;
  return {
    ...row,
    specialties: toStringList(row.specialties),
    certifications: toStringList(row.certifications),
    service_cities: toStringList(row.service_cities),
    service_zip_codes: toStringList(row.service_zip_codes),
  };
}

/**
 * The subset of the profile that a public profile page receives.
 *
 * usePublicProfile deliberately selects only these columns — the comment there
 * reads "ONLY PUBLIC FIELDS" — so the public components must not be typed
 * against the full row. They were, which is why assigning the hook's result
 * produced "missing the following properties" for every column the query
 * omits (custom_css, zapier_webhook_url, the denormalised counters, and so on).
 *
 * Kept in lockstep with the query by construction: add a column there and it
 * belongs here, and Pick will reject a name that is not a real column.
 */
export type PublicProfileFields =
  | 'id'
  | 'username'
  | 'full_name'
  | 'bio'
  | 'avatar_url'
  | 'theme'
  | 'title'
  | 'brokerage_name'
  | 'brokerage_logo'
  | 'years_experience'
  | 'certifications'
  | 'specialties'
  | 'service_cities'
  | 'service_zip_codes'
  | 'license_number'
  | 'license_state'
  | 'phone'
  | 'sms_enabled'
  | 'email_display'
  | 'calendly_url'
  | 'instagram_url'
  | 'facebook_url'
  | 'linkedin_url'
  | 'tiktok_url'
  | 'youtube_url'
  | 'zillow_url'
  | 'realtor_com_url'
  | 'website_url'
  | 'seo_title'
  | 'seo_description'
  | 'og_image'
  | 'created_at'
  | 'is_published';

export type PublicProfile = Pick<Profile, PublicProfileFields>;
