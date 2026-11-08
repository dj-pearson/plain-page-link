/**
 * Time zone (US-433). The morning email goes out at 7am on this clock, and
 * "due today" means today here. Until the agent saves one, the picker shows
 * this device's zone and says it is not saved yet.
 */
import { useMemo } from 'react';
import { Globe } from 'lucide-react';
import { useAgentTimeZone } from '@/hooks/useAgentTimeZone';
import { useToast } from '@/hooks/use-toast';
import { listTimeZones, localTimeIn, timeZoneLabel } from '@/lib/timeZone';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function TimeZoneSetting() {
  const { toast } = useToast();
  const { timeZone, detected, isLoading, update } = useAgentTimeZone();

  const shown = timeZone ?? detected ?? 'UTC';
  const unsaved = !isLoading && timeZone === null;
  const zones = useMemo(() => listTimeZones([timeZone, detected]), [timeZone, detected]);
  const labels = useMemo(() => {
    const now = new Date();
    return new Map(zones.map((z) => [z, timeZoneLabel(z, now)]));
  }, [zones]);

  const save = (zone: string) =>
    update.mutate(zone, {
      onSuccess: () =>
        toast({
          title: 'Time zone saved',
          description: `Your morning email now follows ${labels.get(zone) ?? zone}.`,
        }),
      onError: (error: unknown) =>
        toast({
          title: 'Could not save your time zone',
          description: error instanceof Error ? error.message : 'Please try again.',
          variant: 'destructive',
        }),
    });

  const now = localTimeIn(shown);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Globe className="h-5 w-5 text-primary" aria-hidden="true" />
          <div>
            <CardTitle id="timezone-label">Time zone</CardTitle>
            <CardDescription>
              Your morning email arrives at 7am here, and follow-ups count as due by your own day.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <Select value={shown} onValueChange={save} disabled={isLoading || update.isPending}>
          <SelectTrigger className="w-full sm:w-96" aria-labelledby="timezone-label">
            <SelectValue placeholder="Select your time zone" />
          </SelectTrigger>
          <SelectContent className="max-h-80">
            {zones.map((zone) => (
              <SelectItem key={zone} value={zone}>
                {labels.get(zone)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {now && <p className="text-xs text-muted-foreground">It is {now} there now.</p>}

        {unsaved && (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <p className="text-sm text-muted-foreground" role="status">
              Not saved yet{detected ? ' — this is the zone your device is set to' : ''}. Until you
              save one, your morning email follows UTC time.
            </p>
            <Button
              size="sm"
              variant="outline"
              className="min-h-[44px] sm:min-h-0 shrink-0"
              onClick={() => save(shown)}
              disabled={update.isPending}
            >
              Use this time zone
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
