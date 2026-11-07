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

/** The fields the scheduled emails need, for many agents at once (US-378). */
export interface AgentSummary {
  /** auth.users.email. Null when the account has none. */
  email: string | null;
  fullName: string | null;
  notificationPreferences: Record<string, unknown> | null;
}

/** Ids per get_agent_contacts call; the function refuses more than 1000. */
export const AGENT_CONTACTS_BATCH = 200;

/** The one call {@link readAgentContacts} makes, so tests can supply a fake. */
export interface AgentContactsRpc {
  rpc(
    fn: 'get_agent_contacts',
    args: { p_user_ids: string[] }
  ): PromiseLike<{ data: unknown; error: { message: string; code?: string | null } | null }>;
}

/** PostgREST PGRST202 (function not in the schema cache) or Postgres 42883 (undefined_function). */
function isMissingFunction(error: { code?: string | null }): boolean {
  return error.code === 'PGRST202' || error.code === '42883';
}

interface AgentContactRow {
  id: string;
  email: string | null;
  full_name: string | null;
  notification_preferences: unknown;
}

/**
 * Contact details for many agents: one get_agent_contacts call per
 * {@link AGENT_CONTACTS_BATCH} ids, instead of getAgentContact's two calls
 * per agent. An id absent from the result has no profile; callers treat it as
 * "could not be read", exactly as a null from getAgentContact.
 *
 * Until migration 20261107000378 is applied the function does not exist, and
 * each agent is read through `fallback` (getAgentContact) so the digest and
 * the chaser keep working during the rollout. Any other failure throws: a
 * failed read reported as "no agents" is how emails were silently lost before.
 */
export async function readAgentContacts(
  client: AgentContactsRpc,
  userIds: readonly string[],
  fallback: (userId: string) => Promise<AgentSummary | null>
): Promise<Map<string, AgentSummary>> {
  const found = new Map<string, AgentSummary>();
  const ids = [...new Set(userIds)];
  for (let i = 0; i < ids.length; i += AGENT_CONTACTS_BATCH) {
    const part = ids.slice(i, i + AGENT_CONTACTS_BATCH);
    const { data, error } = await client.rpc('get_agent_contacts', { p_user_ids: part });
    if (error && isMissingFunction(error)) {
      for (const id of part) {
        const contact = await fallback(id);
        if (contact) found.set(id, contact);
      }
      continue;
    }
    if (error) throw new Error(`reading agent contacts: ${error.message}`);
    for (const row of (data ?? []) as AgentContactRow[]) {
      const prefs = row.notification_preferences;
      found.set(row.id, {
        email: row.email ?? null,
        fullName: row.full_name ?? null,
        notificationPreferences:
          prefs && typeof prefs === 'object' && !Array.isArray(prefs)
            ? (prefs as Record<string, unknown>)
            : null,
      });
    }
  }
  return found;
}

/** {@link readAgentContacts} over a service-role client, falling back to getAgentContact. */
export function getAgentContacts(
  supabase: SupabaseClient,
  userIds: readonly string[]
): Promise<Map<string, AgentSummary>> {
  return readAgentContacts(supabase as unknown as AgentContactsRpc, userIds, async (id) => {
    const contact = await getAgentContact(supabase, id);
    return contact
      ? {
          email: contact.email,
          fullName: contact.fullName,
          notificationPreferences: contact.notificationPreferences,
        }
      : null;
  });
}
