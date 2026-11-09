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
import { useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarPlus, ChevronDown, MapPin } from 'lucide-react';
import { formatOpenHouseAddress, usePublicOpenHouses } from '@/hooks/useOpenHouses';
import { downloadIcs, googleCalendarUrl, type CalendarEvent } from '@/lib/openHouseCalendar';
import {
  formatOpenHouseWhen,
  needsZoneLabel,
  openHouseLocalDate,
  visitorOpenHouseTimeZone,
} from '@/lib/openHouseSchedule';
import { fallBackToOriginal, sizedImage, type SizedImage } from '@/lib/images';
import { formatPrice, parsePrice } from '@/lib/format';
import { toStringList } from '@/types/profile';

interface UpcomingOpenHousesProps {
  agentId: string;
  agentName?: string | null;
  profileUrl?: string;
  /**
   * The page for an open house's listing, or null when it has none to show
   * (US-408). "View home" is a real link to it; it was a <button> that
   * navigated in an onClick handler.
   */
  listingHref?(listingId: string): string | null;
  /** Only this listing's open houses — the listing page (US-275). */
  listingId?: string;
}

interface UpcomingOpenHouse {
  id: string;
  listingId: string | null;
  startsAt: Date;
  endsAt: Date;
  /** The agent's zone (US-669), else the visitor's: what the times are shown in. */
  timeZone: string;
  publicNotes: string | null;
  address: string;
  fullAddress: string;
  price: string | null;
  photo: SizedImage;
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
    timeZone: visitorOpenHouseTimeZone(row.time_zone),
    publicNotes: str(row.public_notes),
    address,
    fullAddress: formatOpenHouseAddress({
      address,
      city: str(row.city) ?? '',
      state: str(row.state),
      zip_code: str(row.zip_code),
    }),
    price: numericPrice > 0 ? formatPrice(numericPrice) : rawPrice,
    // 400px: the card is full width on a phone (h-44) and 224px wide from sm.
    // The original is often a multi-megabyte phone photo (US-260).
    photo: sizedImage(toStringList(row.photos)[0] ?? str(row.image), 400),
  };
}

/**
 * The time at the property, in the agent's zone (US-669). It was formatted in
 * the visitor's zone, so someone in Denver read a Chicago 1–3 PM open house as
 * 12–2. A visitor whose clock differs also gets the zone's name ("CST").
 */
function formatWhen(oh: UpcomingOpenHouse): string {
  return formatOpenHouseWhen(
    oh.startsAt.toISOString(),
    oh.endsAt.toISOString(),
    oh.timeZone,
    new Date(),
    { zoneLabel: needsZoneLabel(oh.timeZone, oh.startsAt) }
  );
}

const actionClass =
  'inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

const menuItemClass =
  'flex min-h-[44px] w-full items-center rounded-md px-3 text-left text-sm text-popover-foreground hover:bg-muted focus-visible:bg-muted focus-visible:outline-none';

/**
 * "Add to calendar": a disclosure button and a two-item panel.
 *
 * This was a Radix DropdownMenu, and that one import put the whole ui-vendor
 * chunk (every Radix primitive the dashboard uses) on every public profile
 * with an open house - for two links (US-260). A disclosure is also the more
 * honest pattern for it: the panel holds an ordinary button and an ordinary
 * link, reached with Tab. Escape and a click outside close it; Escape returns
 * focus to the trigger.
 */
function AddToCalendar({ event, filename }: { event: CalendarEvent; filename: string }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onMouseDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [open]);

  return (
    <div
      ref={rootRef}
      className="relative"
      onKeyDown={(e) => {
        if (e.key === 'Escape' && open) {
          e.stopPropagation();
          setOpen(false);
          triggerRef.current?.focus();
        }
      }}
      onBlur={(e) => {
        // Tabbing past the last item closes it, as leaving a menu would.
        if (open && !rootRef.current?.contains(e.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((o) => !o)}
        className={actionClass}
      >
        <CalendarPlus className="h-4 w-4" aria-hidden="true" />
        Add to calendar
        <ChevronDown
          className={`h-4 w-4 transition-transform motion-reduce:transition-none ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>
      {open && (
        <div
          id={panelId}
          className="absolute left-0 top-full z-20 mt-1 w-56 rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-md"
        >
          <button
            type="button"
            className={menuItemClass}
            onClick={() => {
              downloadIcs(event, filename);
              setOpen(false);
            }}
          >
            Apple / Outlook (.ics)
          </button>
          <a
            href={googleCalendarUrl(event)}
            target="_blank"
            rel="noopener noreferrer"
            className={menuItemClass}
            onClick={() => setOpen(false)}
          >
            Google Calendar
          </a>
        </div>
      )}
    </div>
  );
}

export function UpcomingOpenHouses({
  agentId,
  agentName,
  profileUrl,
  listingHref,
  listingId,
}: UpcomingOpenHousesProps) {
  const { data } = usePublicOpenHouses(agentId);
  const openHouses = (data ?? [])
    .map(toUpcoming)
    .filter((oh): oh is UpcomingOpenHouse => oh !== null)
    .filter((oh) => !listingId || oh.listingId === listingId)
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

  const homeHref = (oh: UpcomingOpenHouse): string | null =>
    (oh.listingId && listingHref?.(oh.listingId)) || null;

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
        {listingId
          ? 'Come see this home in person — no appointment needed.'
          : 'Come see a home in person — no appointment needed.'}
      </p>

      <ul className="mt-4 space-y-4">
        {openHouses.map((oh) => (
          <li
            key={oh.id}
            className="overflow-hidden rounded-xl border border-border bg-card text-card-foreground sm:flex"
          >
            <img
              src={oh.photo.src}
              alt={oh.address}
              loading="lazy"
              decoding="async"
              className="h-44 w-full object-cover sm:h-auto sm:w-56 sm:shrink-0"
              onError={(e) => fallBackToOriginal(e.currentTarget, oh.photo.original)}
            />
            <div className="flex min-w-0 flex-1 flex-col gap-3 p-4 sm:p-5">
              <div>
                <p className="text-base font-semibold text-foreground">
                  <time dateTime={oh.startsAt.toISOString()}>{formatWhen(oh)}</time>
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
                <AddToCalendar
                  event={calendarEvent(oh)}
                  filename={`open-house-${openHouseLocalDate(oh.startsAt.toISOString(), oh.timeZone)}.ics`}
                />

                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(oh.fullAddress)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={actionClass}
                >
                  <MapPin className="h-4 w-4" aria-hidden="true" />
                  Get directions
                </a>

                {homeHref(oh) && (
                  <Link
                    to={homeHref(oh)!}
                    className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    View home
                    <span className="sr-only">: {oh.address}</span>
                  </Link>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
