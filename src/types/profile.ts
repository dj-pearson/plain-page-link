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
