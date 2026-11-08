/**
 * US-560 (US-550): agents who finished onboarding before US-537 never saw the
 * time zone picker, so profiles.timezone is NULL and their morning email and
 * "due today" follow UTC. This offers the device's zone once, on the
 * dashboard, and saves it with one tap.
 *
 * Shown only when the stored value has been read and really is unset, and the
 * device reports a zone other than UTC (offering UTC would change nothing).
 * "Not now" is remembered per agent in this browser; a convenience only, so a
 * cleared or blocked storage just shows the offer again.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Globe } from 'lucide-react';
import { useAgentTimeZone } from '@/hooks/useAgentTimeZone';
import { useAuthStore } from '@/stores/useAuthStore';
import { useToast } from '@/hooks/use-toast';
import { localTimeIn, timeZoneLabel } from '@/lib/timeZone';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export const timeZonePromptDismissKey = (userId: string) =>
  `agentbio:tz-prompt-dismissed:${userId}`;

function readDismissed(userId: string | undefined): boolean {
  if (!userId) return false;
  try {
    return window.localStorage.getItem(timeZonePromptDismissKey(userId)) === '1';
  } catch {
    return false;
  }
}

function writeDismissed(userId: string | undefined): void {
  if (!userId) return;
  try {
    window.localStorage.setItem(timeZonePromptDismissKey(userId), '1');
  } catch {
    // Storage blocked: the offer comes back next visit, which is harmless.
  }
}

export function TimeZonePrompt() {
  const userId = useAuthStore((s) => s.user?.id);
  const { toast } = useToast();
  const { timeZone, detected, isKnown, update } = useAgentTimeZone();
  const [dismissed, setDismissed] = useState(() => readDismissed(userId));

  if (!isKnown || timeZone !== null || !detected || detected === 'UTC') return null;
  if (dismissed || readDismissed(userId)) return null;

  const label = timeZoneLabel(detected);
  const now = localTimeIn(detected);

  const save = () =>
    update.mutate(detected, {
      onSuccess: () =>
        toast({
          title: 'Time zone saved',
          description: `Your morning email now follows ${label}.`,
        }),
      onError: (error: unknown) =>
        toast({
          title: 'Could not save your time zone',
          description: error instanceof Error ? error.message : 'Please try again.',
          variant: 'destructive',
        }),
    });

  const dismiss = () => {
    writeDismissed(userId);
    setDismissed(true);
  };

  return (
    <Card aria-labelledby="tz-prompt-title">
      <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        <Globe className="h-6 w-6 text-primary flex-shrink-0" aria-hidden="true" />
        <div className="flex-1 min-w-0">
          <p id="tz-prompt-title" className="font-semibold text-foreground">
            Your morning email follows UTC time
          </p>
          <p className="text-sm text-muted-foreground">
            This device is set to {label}
            {now ? `, where it is ${now} now` : ''}. Use it so your email arrives in your morning
            and follow-ups count as due by your own day. You can{' '}
            <Link to="/dashboard/settings" className="underline underline-offset-2">
              choose another in Settings
            </Link>
            .
          </p>
        </div>
        <div className="flex gap-2 self-start sm:self-auto shrink-0">
          <Button onClick={save} disabled={update.isPending} className="min-h-[44px]">
            Use this time zone
          </Button>
          <Button
            variant="ghost"
            onClick={dismiss}
            disabled={update.isPending}
            className="min-h-[44px]"
          >
            Not now
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
