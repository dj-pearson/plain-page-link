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
import type { Json } from '@/integrations/supabase/types';

export type LeadNotificationMode = 'instant' | 'daily_digest' | 'off';

/** The morning email (US-230): read by scheduled-maintenance/digests.ts. */
export type DigestMode = 'daily' | 'weekly' | 'off';

/** How long a new lead may sit unanswered before it counts as overdue. */
export const DEFAULT_SLA_HOURS = 2;

export interface NotificationPreferences {
  leads: LeadNotificationMode;
  sla_hours: number;
  digest: DigestMode;
  [key: string]: Json | undefined;
}

const DEFAULTS: NotificationPreferences = { leads: 'instant', sla_hours: DEFAULT_SLA_HOURS, digest: 'daily' };

export function useNotificationPreferences() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: preferences = DEFAULTS, isLoading } = useQuery({
    queryKey: ['notification-preferences', user?.id],
    enabled: !!user?.id,
    queryFn: async (): Promise<NotificationPreferences> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('notification_preferences')
        .eq('id', user!.id)
        .single();
      if (error) throw error;

      const stored = (data?.notification_preferences ?? {}) as Record<string, unknown>;
      return {
        ...(stored as NotificationPreferences),
        leads: (stored.leads as LeadNotificationMode) ?? DEFAULTS.leads,
        sla_hours: typeof stored.sla_hours === 'number' ? stored.sla_hours : DEFAULTS.sla_hours,
        digest: stored.digest === 'weekly' || stored.digest === 'off' ? stored.digest : DEFAULTS.digest,
      };
    },
  });

  const update = useMutation({
    mutationFn: async (next: Partial<NotificationPreferences>) => {
      // Merged onto what is stored, not replacing it: writing { leads } alone
      // would drop sla_hours, and vice versa.
      const merged = { ...preferences, ...next };
      const { error } = await supabase
        .from('profiles')
        .update({ notification_preferences: merged })
        .eq('id', user!.id);
      if (error) throw error;
      return merged;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences', user?.id] });
    },
  });

  return {
    preferences,
    slaHours: preferences.sla_hours,
    leadMode: preferences.leads,
    digestMode: preferences.digest,
    isLoading,
    update,
  };
}
