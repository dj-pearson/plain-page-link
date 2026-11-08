/**
 * profiles.notification_preferences — one reader, one writer.
 *
 * US-103 added sla_hours here (it was useState(2) inside Leads.tsx, reset on
 * every load and unreadable by the job that has to chase overdue leads). That
 * gave the column a second consumer, and two hooks with their own queryFn under
 * one queryKey is precisely the cache collision US-094 fixed on ['leads'] —
 * whichever mounts first decides the shape the other sees. So this is the only
 * place that reads or writes the column; the Settings card and the Leads page
 * both go through it.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/useAuthStore';
import { fetchOwnProfile } from '@/lib/ownProfile';
import type { Json } from '@/integrations/supabase/types';
import { agentTimeZoneKey, useAgentTimeZone } from '@/hooks/useAgentTimeZone';

export type LeadNotificationMode = 'instant' | 'daily_digest' | 'off';

/** The morning email (US-230): read by scheduled-maintenance/digests.ts. */
export type DigestMode = 'daily' | 'weekly' | 'off';

/**
 * The local hours an agent may choose for the morning email (US-518). Mirrors
 * DIGEST_HOUR_CHOICES in scheduled-maintenance/digests.ts, which ignores any
 * other value; 7 is the job's default (DIGEST_LOCAL_HOUR).
 */
export const DIGEST_HOUR_CHOICES = [5, 6, 7, 8, 9, 10] as const;
export const DEFAULT_DIGEST_HOUR = 7;

/** How long a new lead may sit unanswered before it counts as overdue. */
export const DEFAULT_SLA_HOURS = 2;

export interface NotificationPreferences {
  leads: LeadNotificationMode;
  sla_hours: number;
  digest: DigestMode;
  /** The morning email's local hour (US-518); absent = DEFAULT_DIGEST_HOUR. */
  digest_hour?: number;
  [key: string]: Json | undefined;
}

const DEFAULTS: NotificationPreferences = {
  leads: 'instant',
  sla_hours: DEFAULT_SLA_HOURS,
  digest: 'daily',
};

export function useNotificationPreferences() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['notification-preferences', user?.id],
    enabled: !!user?.id,
    queryFn: async (): Promise<NotificationPreferences> => {
      // US-235: notification_preferences is a private column, readable by its
      // owner only through get_own_profile.
      const { data, error } = await fetchOwnProfile();
      if (error) throw error;

      const stored = (data?.notification_preferences ?? {}) as Record<string, unknown>;
      return {
        ...(stored as NotificationPreferences),
        leads: (stored.leads as LeadNotificationMode) ?? DEFAULTS.leads,
        sla_hours: typeof stored.sla_hours === 'number' ? stored.sla_hours : DEFAULTS.sla_hours,
        digest:
          stored.digest === 'weekly' || stored.digest === 'off' ? stored.digest : DEFAULTS.digest,
      };
    },
  });
  const preferences = query.data ?? DEFAULTS;
  // US-612: whether `preferences` is what is stored, or only the defaults
  // standing in for a read that has not succeeded.
  const loaded = query.data !== undefined;

  // US-433: the morning email's hour follows profiles.timezone. An agent who
  // has never set one gets this device's zone the first time they save a
  // notification setting, so the digest moves to their morning without a
  // separate step. Only while the stored value is known to be empty.
  const zone = useAgentTimeZone();
  const zoneDefault = zone.isKnown && zone.timeZone === null ? zone.detected : null;

  const update = useMutation({
    mutationFn: async (next: Partial<NotificationPreferences>) => {
      // US-612: the write is the whole column, merged onto what was read. With
      // the read failed or still in flight, `preferences` is DEFAULTS, and the
      // merge would reset every other stored setting (an agent who had turned
      // lead emails off would have them switched back on by changing the
      // response window). Refuse rather than guess.
      if (!loaded) {
        throw new Error(
          'Your notification settings have not loaded yet, so nothing was changed. Reload and try again.'
        );
      }
      // Merged onto what is stored, not replacing it: writing { leads } alone
      // would drop sla_hours, and vice versa.
      const merged = { ...preferences, ...next };
      const write = (withZone: boolean) =>
        supabase
          .from('profiles')
          .update({
            notification_preferences: merged,
            ...(withZone ? { timezone: zoneDefault } : {}),
          })
          .eq('id', user!.id);
      let { error } = await write(!!zoneDefault);
      // The zone is a bonus: a refusal of it (an unknown column before the
      // migration, or a name the database does not know) must not lose the
      // setting the agent actually changed.
      if (error && zoneDefault) ({ error } = await write(false));
      if (error) throw error;
      return merged;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences', user?.id] });
      if (zoneDefault) queryClient.invalidateQueries({ queryKey: agentTimeZoneKey(user?.id) });
    },
  });

  return {
    preferences,
    slaHours: preferences.sla_hours,
    leadMode: preferences.leads,
    digestMode: preferences.digest,
    digestHour: digestHourOf(preferences),
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    update,
  };
}

/** The stored morning-email hour, or the default when none (or an unusable one) is stored. */
export function digestHourOf(preferences: { digest_hour?: unknown }): number {
  const hour = preferences.digest_hour;
  return typeof hour === 'number' && (DIGEST_HOUR_CHOICES as readonly number[]).includes(hour)
    ? hour
    : DEFAULT_DIGEST_HOUR;
}
