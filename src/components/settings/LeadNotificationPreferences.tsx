/**
 * Lead Notification Preferences
 *
 * Lets an agent choose how they're notified of new leads:
 * instant email, a daily digest, or off. Persisted to
 * profiles.notification_preferences.leads and read by the notify-lead edge
 * function, which is the single sender.
 */

import { Bell } from 'lucide-react';
import {
  useNotificationPreferences,
  type LeadNotificationMode,
  type DigestMode,
} from '@/hooks/useNotificationPreferences';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const SLA_OPTIONS = [1, 2, 4, 8, 24];

const OPTIONS: { value: LeadNotificationMode; label: string; description: string }[] = [
  { value: 'instant', label: 'Instant', description: 'Email me the moment a lead comes in' },
  {
    value: 'daily_digest',
    label: 'Daily digest',
    // US-230: the digest exists now. (It did not, and this said so — US-099.)
    // With the morning email off or weekly, notify-lead still sends instantly
    // so no lead waits a week.
    description: 'New leads arrive in your morning email instead of one by one',
  },
  { value: 'off', label: 'Off', description: 'Do not email me about new leads' },
];

export function LeadNotificationPreferences() {
  const { toast } = useToast();
  // One reader and writer for this column — see useNotificationPreferences for
  // why the Leads page and this card must not each hold their own query.
  const { leadMode: mode, slaHours, digestMode, isLoading, update } = useNotificationPreferences();

  const save = (next: Parameters<typeof update.mutate>[0]) =>
    update.mutate(next, {
      onSuccess: () =>
        toast({
          title: 'Preferences saved',
          description: 'Your lead notification setting has been updated.',
        }),
      onError: (error: unknown) =>
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'Failed to update preferences.',
          variant: 'destructive',
        }),
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
          onValueChange={(value) => save({ leads: value as LeadNotificationMode })}
          disabled={isLoading || update.isPending}
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

        <div className="mt-6 space-y-2">
          <p className="text-sm font-medium" id="digest-label">Morning email</p>
          <p className="text-xs text-muted-foreground">
            New leads, follow-ups due today and your clients&apos; upcoming birthdays and
            anniversaries — sent only when there is something. Monday&apos;s adds last week&apos;s numbers.
          </p>
          <Select
            value={digestMode}
            onValueChange={(value) => save({ digest: value as DigestMode })}
            disabled={isLoading || update.isPending}
          >
            <SelectTrigger className="w-full sm:w-72" aria-labelledby="digest-label">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Every morning</SelectItem>
              <SelectItem value="weekly">Mondays only</SelectItem>
              <SelectItem value="off">Off</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="mt-6 space-y-2">
          <p className="text-sm font-medium">Chase me about unanswered leads after</p>
          <p className="text-xs text-muted-foreground">
            A new lead with no response by this point is flagged on your Leads page, and the
            overdue-lead check emails you about it.
          </p>
          <Select
            value={String(slaHours)}
            onValueChange={(value) => save({ sla_hours: Number(value) })}
            disabled={isLoading || update.isPending}
          >
            <SelectTrigger className="w-full sm:w-72">
              <SelectValue placeholder="Select a response window" />
            </SelectTrigger>
            <SelectContent>
              {SLA_OPTIONS.map((h) => (
                <SelectItem key={h} value={String(h)}>
                  {h === 1 ? '1 hour' : h === 24 ? '1 day' : `${h} hours`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
