/**
 * What the agent should know about this week, on the dashboard.
 *
 * Three things an agent otherwise keeps in their head: the dates in their
 * clients' lives that are coming round (a daughter's birthday, a third home
 * anniversary, a move-in day), the people they have not spoken to for longer
 * than they meant to, and their next open house. Each is a reason to pick up
 * the phone, which is the whole job.
 *
 * Renders nothing when there is nothing to say, like DueFollowUps.
 */
import { Link } from 'react-router-dom';
import { CalendarHeart, DoorOpen, PhoneCall } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { contactName, useContactsDueForTouch, useKeyDates } from '@/hooks/useContacts';
import { useOpenHouses, formatOpenHouseAddress } from '@/hooks/useOpenHouses';
import {
  describeDaysAway,
  describeOccasion,
  isReminderDue,
  upcomingKeyDates,
} from '@/lib/keyDates';

/** How far ahead to look. Each date's own reminder lead time decides emphasis. */
const WINDOW_DAYS = 30;

export function ComingUp() {
  const { keyDates, isLoading: datesLoading } = useKeyDates();
  const { data: due = [], isLoading: dueLoading } = useContactsDueForTouch(5);
  const { openHouses, isLoading: ohLoading } = useOpenHouses();

  if (datesLoading || dueLoading || ohLoading) return null;

  const upcoming = upcomingKeyDates(keyDates, new Date(), WINDOW_DAYS).slice(0, 6);
  const now = Date.now();
  const nextOpenHouse = openHouses
    .filter((o) => o.status === 'scheduled' && new Date(o.ends_at).getTime() > now)
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at))[0];

  if (upcoming.length === 0 && due.length === 0 && !nextOpenHouse) return null;

  return (
    <Card>
      <CardHeader className="pb-3 sm:pb-4">
        <CardTitle className="text-base sm:text-lg">Coming up</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {nextOpenHouse && nextOpenHouse.listings && (
          <div>
            <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
              <DoorOpen className="h-4 w-4" aria-hidden="true" />
              Next open house
            </h3>
            <Link
              to="/dashboard/open-houses"
              className="flex min-h-[44px] items-center justify-between gap-3 rounded-lg border p-3 hover:bg-muted/50"
            >
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">
                  {formatOpenHouseAddress(nextOpenHouse.listings)}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {format(new Date(nextOpenHouse.starts_at), 'EEE, MMM d · h:mm a')}
                  {' – '}
                  {format(new Date(nextOpenHouse.ends_at), 'h:mm a')}
                </span>
              </span>
              {nextOpenHouse.signInCount > 0 && (
                <Badge variant="secondary">{nextOpenHouse.signInCount} signed in</Badge>
              )}
            </Link>
          </div>
        )}

        {upcoming.length > 0 && (
          <div>
            <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
              <CalendarHeart className="h-4 w-4" aria-hidden="true" />
              Dates to remember
            </h3>
            <ul className="space-y-2">
              {upcoming.map((item) => {
                const kd = item.keyDate;
                const who = kd.person_name || (kd.contacts ? contactName(kd.contacts) : 'A client');
                const occasion = describeOccasion(kd.kind, item.years);
                const owner = kd.person_name && kd.contacts ? ` · ${contactName(kd.contacts)}` : '';
                return (
                  <li key={kd.id}>
                    <Link
                      to={`/dashboard/clients?client=${kd.contact_id}`}
                      className="flex min-h-[44px] items-center justify-between gap-3 rounded-lg border p-3 hover:bg-muted/50"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium">
                          {who}
                          {occasion ? ` ${occasion}` : ` · ${kd.label}`}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {kd.label}
                          {owner} · {format(item.occursOn, 'EEE, MMM d')}
                        </span>
                      </span>
                      <Badge
                        variant={isReminderDue(item) ? 'default' : 'outline'}
                        className="flex-shrink-0"
                      >
                        {describeDaysAway(item.daysAway)}
                      </Badge>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {due.length > 0 && (
          <div>
            <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
              <PhoneCall className="h-4 w-4" aria-hidden="true" />
              Due for a touch
            </h3>
            <ul className="space-y-2">
              {due.map((c) => (
                <li key={c.id}>
                  <Link
                    to={`/dashboard/clients?client=${c.id}`}
                    className="flex min-h-[44px] items-center justify-between gap-3 rounded-lg border p-3 hover:bg-muted/50"
                  >
                    <span className="truncate text-sm font-medium">{contactName(c)}</span>
                    <span className="flex-shrink-0 text-xs text-muted-foreground">
                      {c.last_contacted_at
                        ? `Last ${formatDistanceToNow(new Date(c.last_contacted_at), { addSuffix: true })}`
                        : 'Not contacted yet'}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
