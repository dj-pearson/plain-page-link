/**
 * Resolving an agent's contact details (US-070).
 *
 * `public.profiles` has never had an `email` column — the display-only field is
 * `email_display`, and the account's real address lives in `auth.users.email`.
 * Five functions nevertheless did `.select('full_name, email, …')` on profiles.
 * PostgREST rejects the whole query for the unknown column, and because every
 * one of those call sites was written best-effort (`const { data: profile } =`
 * with no error branch), `profile` came back undefined and the path silently
 * did nothing. That cost agent lead notifications, Zapier webhook deliveries,
 * contact-form alerts, and Stripe dunning emails — all returning HTTP 200.
 *
 * Everything goes through this helper so the mistake has one place to live, and
 * so a caller cannot accidentally reintroduce it by hand.
 *
 * Requires a service-role client: it reads auth.users via the admin API.
 */

import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

export interface AgentContact {
  /** auth.users.email — the account's real address. Null if it cannot be resolved. */
  email: string | null;
  fullName: string | null;
  /** Display-only address the agent chose to publish; NOT the account address. */
  emailDisplay: string | null;
  phone: string | null;
  zapierWebhookUrl: string | null;
  notificationPreferences: Record<string, unknown> | null;
}

/**
 * Look up an agent's contact details by user id.
 *
 * Returns null when the profile row or the auth user cannot be read, and logs
 * why. Callers must treat null as a failure worth reporting — the whole point
 * of this story is that silently continuing is how the defect stayed invisible.
 */
export async function getAgentContact(
  supabase: SupabaseClient,
  userId: string
): Promise<AgentContact | null> {
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('full_name, email_display, phone, zapier_webhook_url, notification_preferences')
    .eq('id', userId)
    .single();

  if (profileError) {
    console.error(`[agent-contact] profile lookup failed for ${userId}:`, profileError.message);
    return null;
  }

  // The account address is in auth.users, not in profiles.
  const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId);

  if (authError) {
    console.error(`[agent-contact] auth lookup failed for ${userId}:`, authError.message);
  }

  return {
    email: authUser?.user?.email ?? null,
    fullName: profile?.full_name ?? null,
    emailDisplay: profile?.email_display ?? null,
    phone: profile?.phone ?? null,
    zapierWebhookUrl: profile?.zapier_webhook_url ?? null,
    notificationPreferences:
      (profile?.notification_preferences as Record<string, unknown> | null) ?? null,
  };
}
