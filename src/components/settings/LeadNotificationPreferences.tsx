/**
 * Lead Notification Preferences
 *
 * Lets an agent choose how they're notified of new leads:
 * instant email, a daily digest, or off. Persisted to
 * profiles.notification_preferences.leads and read by the notify-lead edge
 * function, which is the single sender.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/useAuthStore';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type LeadNotificationMode = 'instant' | 'daily_digest' | 'off';

const OPTIONS: { value: LeadNotificationMode; label: string; description: string }[] = [
  { value: 'instant', label: 'Instant', description: 'Email me the moment a lead comes in' },
  {
    value: 'daily_digest',
    label: 'Daily digest',
    // Honest label. The digest job does not exist; notify-lead used to skip
    // these agents entirely, so choosing "daily digest" meant never being
    // emailed about a lead at all (US-099). Until the job is built the setting
    // behaves as Instant, and saying so beats a promise nothing keeps.
    description: 'Not available yet — currently sends instantly, like Instant',
  },
  { value: 'off', label: 'Off', description: 'Do not email me about new leads' },
];

export function LeadNotificationPreferences() {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: mode = 'instant', isLoading } = useQuery({
    queryKey: ['notification-preferences', user?.id],
    enabled: !!user?.id,
    queryFn: async (): Promise<LeadNotificationMode> => {
      // notification_preferences is jsonb, so the generated type is Json —
      // narrowed here rather than by casting the client. The comment this
      // replaced claimed the column was "not yet in the generated types"; it
      // has been there throughout (types.ts:3414), and the cast was disabling
      // the check rather than working around a gap (the US-094 pattern).
      const { data, error } = await supabase
        .from('profiles')
        .select('notification_preferences')
        .eq('id', user!.id)
        .single();
      if (error) throw error;
      const prefs = data?.notification_preferences as { leads?: LeadNotificationMode } | null;
      return prefs?.leads ?? 'instant';
    },
  });

  const updateMode = useMutation({
    mutationFn: async (next: LeadNotificationMode) => {
      const { error } = await supabase
        .from('profiles')
        .update({ notification_preferences: { leads: next } })
        .eq('id', user!.id);
      if (error) throw error;
      return next;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences', user?.id] });
      toast({
        title: 'Preferences saved',
        description: 'Your lead notification setting has been updated.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update preferences.',
        variant: 'destructive',
      });
    },
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Bell className="h-5 w-5 text-primary" />
          <div>
            <CardTitle>Lead Notifications</CardTitle>
            <CardDescription>Choose how you want to hear about new leads</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Select
          value={mode}
          onValueChange={(value) => updateMode.mutate(value as LeadNotificationMode)}
          disabled={isLoading || updateMode.isPending}
        >
          <SelectTrigger className="w-full sm:w-72">
            <SelectValue placeholder="Select notification frequency" />
          </SelectTrigger>
          <SelectContent>
            {OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                <span className="font-medium">{opt.label}</span>
                <span className="block text-xs text-muted-foreground">{opt.description}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  );
}
