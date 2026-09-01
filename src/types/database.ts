/**
 * Hand-written aliases for the tables the auth store and the link-in-bio UI
 * touch most.
 *
 * These were previously restated by hand, and had drifted: `Profile` listed 9
 * of the 45 columns on `profiles` and typed `theme`, `created_at` and
 * `updated_at` as non-nullable when the schema allows null, and `Link` typed
 * `click_count`, `is_active`, `created_at` and `updated_at` the same way. That
 * is the failure mode `src/types/profile.ts` documents at length — a type
 * describing what a feature "should" have rather than what the schema has —
 * and it produced real errors here too: ZapierIntegrationModal reads
 * `profile.zapier_webhook_url`, a genuine column this file claimed did not
 * exist.
 *
 * Everything below now derives from
 * `Database['public']['Tables'][...]['Row']`, so `npm run types:generate`
 * keeps it honest. `Profile` re-exports the narrowed variant from
 * `@/types/profile` so there is one profile shape in the codebase, not two.
 */

import type { Database } from '@/integrations/supabase/types';

export type AppRole = Database['public']['Enums']['app_role'];

export type { Profile, ProfileRow } from '@/types/profile';

export type UserRole = Database['public']['Tables']['user_roles']['Row'];

export type Link = Database['public']['Tables']['links']['Row'];
