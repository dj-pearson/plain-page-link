/**
 * "Open houses" on the public profile: the agent's upcoming public open houses,
 * each with add-to-calendar, directions and a link to the home.
 *
 * Reads list_public_open_houses, which returns only public columns — private
 * notes never reach a visitor. Renders nothing while loading or when there is
 * nothing scheduled, so a profile without open houses has no empty section.
 *
 * Styled with the semantic tokens (bg-card, text-foreground, …) rather than
 * fixed grays, because the public profile is themed per agent through CSS
 * variables and this section has to follow that theme.
 */
import { format, isSameYear } from 'date-fns';
import { CalendarPlus, ChevronDown, MapPin } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatOpenHouseAddress, usePublicOpenHouses } from '@/hooks/useOpenHouses';
import { downloadIcs, googleCalendarUrl, type CalendarEvent } from '@/lib/openHouseCalendar';
import { getImageUrl, PLACEHOLDER_PROPERTY_IMAGE } from '@/lib/images';
import { formatPrice, parsePrice } from '@/lib/format';
import { toStringList } from '@/types/profile';

interface UpcomingOpenHousesProps {
  agentId: string;
  agentName?: string | null;
  profileUrl?: string;
  onViewListing?(listingId: string): void;
}

interface UpcomingOpenHouse {
  id: string;
  listingId: string | null;
  startsAt: Date;
  endsAt: Date;
  publicNotes: string | null;
  address: string;
  fullAddress: string;
  price: string | null;
  photo: string;
}

const str = (v: unknown): string | null => (typeof v === 'string' && v.trim() ? v : null);

function toUpcoming(row: Record<string, unknown>): UpcomingOpenHouse | null {
  const id = str(row.id);
  const starts = str(row.starts_at);
  const ends = str(row.ends_at);
  const address = str(row.address);
  if (!id || !starts || !ends || !address) return null;
  const rawPrice = str(row.price);
  const numericPrice = parsePrice(rawPrice);
  return {
    id,
    listingId: str(row.listing_id),
    startsAt: new Date(starts),
    endsAt: new Date(ends),
    publicNotes: str(row.public_notes),
    address,
    fullAddress: formatOpenHouseAddress({
      address,
      city: str(row.city) ?? '',
      state: str(row.state),
      zip_code: str(row.zip_code),
    }),
    price: numericPrice > 0 ? formatPrice(numericPrice) : rawPrice,
    photo: getImageUrl(toStringList(row.photos)[0] ?? str(row.image)),
  };
}

function formatWhen(start: Date, end: Date): string {
  const day = format(start, isSameYear(start, new Date()) ? 'EEE, MMM d' : 'EEE, MMM d, yyyy');
  const time =
    format(start, 'a') === format(end, 'a')
      ? `${format(start, 'h:mm')}–${format(end, 'h:mm a')}`
      : `${format(start, 'h:mm a')}–${format(end, 'h:mm a')}`;
  return `${day} · ${time}`;
}

const actionClass =
  'inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

export function UpcomingOpenHouses({
  agentId,
  agentName,
  profileUrl,
  onViewListing,
}: UpcomingOpenHousesProps) {
  const { data } = usePublicOpenHouses(agentId);
  const openHouses = (data ?? [])
    .map(toUpcoming)
    .filter((oh): oh is UpcomingOpenHouse => oh !== null)
    .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());

  if (openHouses.length === 0) return null;

  const calendarEvent = (oh: UpcomingOpenHouse): CalendarEvent => ({
    uid: `open-house-${oh.id}`,
    title: `Open house: ${oh.address}`,
    location: oh.fullAddress,
    start: oh.startsAt,
    end: oh.endsAt,
    description: [oh.publicNotes, agentName ? `Hosted by ${agentName}` : null]
      .filter(Boolean)
      .join('\n\n'),
    url: profileUrl,
  });

  return (
    <section
      id="open-houses"
      aria-labelledby="open-houses-heading"
      className="pt-4 sm:pt-6 scroll-mt-16 sm:scroll-mt-20"
    >
      <h2 id="open-houses-heading" className="text-xl sm:text-2xl font-bold text-foreground">
        Open houses
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Come see a home in person — no appointment needed.
      </p>

      <ul className="mt-4 space-y-4">
        {openHouses.map((oh) => (
          <li
            key={oh.id}
            className="overflow-hidden rounded-xl border border-border bg-card text-card-foreground sm:flex"
          >
            <img
              src={oh.photo}
              alt={oh.address}
              loading="lazy"
              className="h-44 w-full object-cover sm:h-auto sm:w-56 sm:shrink-0"
              onError={(e) => {
                if (!e.currentTarget.src.endsWith(PLACEHOLDER_PROPERTY_IMAGE)) {
                  e.currentTarget.src = PLACEHOLDER_PROPERTY_IMAGE;
                }
              }}
            />
            <div className="flex min-w-0 flex-1 flex-col gap-3 p-4 sm:p-5">
              <div>
                <p className="text-base font-semibold text-foreground">
                  <time dateTime={oh.startsAt.toISOString()}>
                    {formatWhen(oh.startsAt, oh.endsAt)}
                  </time>
                </p>
                <p className="mt-1 text-foreground">{oh.fullAddress}</p>
                {oh.price && <p className="mt-0.5 font-medium text-foreground">{oh.price}</p>}
                {oh.publicNotes && (
                  <p className="mt-2 max-w-prose whitespace-pre-line text-sm text-muted-foreground">
                    {oh.publicNotes}
                  </p>
                )}
              </div>

              <div className="mt-auto flex flex-wrap gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger className={actionClass}>
                    <CalendarPlus className="h-4 w-4" aria-hidden="true" />
                    Add to calendar
                    <ChevronDown className="h-4 w-4" aria-hidden="true" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    className="border-border bg-popover text-popover-foreground"
                  >
                    <DropdownMenuItem
                      className="min-h-[44px] focus:bg-muted focus:text-foreground"
                      onSelect={() =>
                        downloadIcs(
                          calendarEvent(oh),
                          `open-house-${oh.startsAt.toISOString().slice(0, 10)}.ics`
                        )
                      }
                    >
                      Apple / Outlook (.ics)
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      asChild
                      className="min-h-[44px] focus:bg-muted focus:text-foreground"
                    >
                      <a
                        href={googleCalendarUrl(calendarEvent(oh))}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Google Calendar
                      </a>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(oh.fullAddress)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={actionClass}
                >
                  <MapPin className="h-4 w-4" aria-hidden="true" />
                  Get directions
                </a>

                {onViewListing && oh.listingId && (
                  <button
                    type="button"
                    onClick={() => oh.listingId && onViewListing(oh.listingId)}
                    className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    View home
                  </button>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
