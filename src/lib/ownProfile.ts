import type { PostgrestSingleResponse } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import type { ProfileRow } from '@/types/profile';

/**
 * The signed-in agent's own profile row, private columns included (US-235).
 *
 * `authenticated` holds SELECT on the public columns of `profiles` only —
 * column grants are not row-aware, so table-wide SELECT let any signed-in user
 * read every published agent's zapier_webhook_url, notification_preferences and
 * referred_by. The owner's full row comes through get_own_profile(), which
 * picks the row from the JWT. `.from('profiles').select('*')`, and an update
 * followed by a bare `.select()`, are refused for every caller.
 *
 * Same contract as `.from('profiles').select('*').eq('id', uid).single()`:
 * an error (PGRST116) when there is no session or no row.
 */
export async function fetchOwnProfile(): Promise<PostgrestSingleResponse<ProfileRow>> {
  return supabase.rpc('get_own_profile').single();
}
