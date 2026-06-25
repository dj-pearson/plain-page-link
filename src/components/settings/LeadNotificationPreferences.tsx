/**
 * Lead Notification Preferences
 *
 * Lets an agent choose how they're notified of new leads:
 * instant email, a daily digest, or off. Persisted to
 * profiles.notification_preferences.leads.
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
  { value: 'daily_digest', label: 'Daily digest', description: 'One summary email per day' },
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
      // notification_preferences is not yet in the generated Supabase types
      // (types.ts is out of sync); cast is isolated to this read.
      const { data, error } = await supabase
        .from('profiles')
        .select('notification_preferences')
        .eq('id', user!.id)
        .single();
      if (error) throw error;
      const prefs = (data as { notification_preferences?: { leads?: LeadNotificationMode } } | null)
        ?.notification_preferences;
      return prefs?.leads ?? 'instant';
    },
  });

  const updateMode = useMutation({
    mutationFn: async (next: LeadNotificationMode) => {
      const { error } = await supabase
        .from('profiles')
        // Cast: out-of-sync generated types don't include this jsonb column.
        .update({ notification_preferences: { leads: next } } as never)
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
