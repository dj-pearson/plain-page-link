/**
 * Dashboard: the agent's open houses.
 *
 * Upcoming first (soonest at the top), then past (newest first), with
 * cancelled ones folded away underneath. Each row carries what the agent needs
 * on the day: the sign-in kiosk link for the tablet, a QR code for a printed
 * sign-in sheet, and the visitors who have signed in so far.
 */
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { format, isSameYear } from 'date-fns';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';
import {
  AlertCircle,
  CalendarPlus,
  ChevronDown,
  Copy,
  ExternalLink,
  MoreHorizontal,
  Plus,
  QrCode,
  RefreshCw,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { OpenHouseFormDialog } from '@/components/openHouses/OpenHouseFormDialog';
import { OpenHouseVisitorsDialog } from '@/components/openHouses/OpenHouseVisitorsDialog';
import { PlanLimitNotice } from '@/components/PlanLimitNotice';
import { UpgradeModal } from '@/components/UpgradeModal';
import { usePlanUsage } from '@/hooks/usePlanUsage';
import { formatOpenHouseAddress, useOpenHouses, type OpenHouse } from '@/hooks/useOpenHouses';
import { useListings } from '@/hooks/useListings';
import { getImageUrl, PLACEHOLDER_PROPERTY_IMAGE } from '@/lib/images';
import { toStringList } from '@/types/profile';
import { cn } from '@/lib/utils';

type Confirm = { kind: 'cancel' | 'delete'; openHouse: OpenHouse } | null;

function kioskUrl(id: string): string {
  return `${window.location.origin}/open-house/${id}`;
}

/** "Sat, Oct 4 · 1:00–3:00 PM" — with the year when it is not this year. */
function formatWhen(startsAt: string, endsAt: string): string {
  const s = new Date(startsAt);
  const e = new Date(endsAt);
  const day = format(s, isSameYear(s, new Date()) ? 'EEE, MMM d' : 'EEE, MMM d, yyyy');
  const time =
    format(s, 'a') === format(e, 'a')
      ? `${format(s, 'h:mm')}–${format(e, 'h:mm a')}`
      : `${format(s, 'h:mm a')}–${format(e, 'h:mm a')}`;
  return `${day} · ${time}`;
}

function photoOf(oh: OpenHouse): string {
  const l = oh.listings;
  if (!l) return PLACEHOLDER_PROPERTY_IMAGE;
  return getImageUrl(toStringList(l.photos)[0] ?? l.image);
}

function addressOf(oh: OpenHouse): string {
  return oh.listings ? formatOpenHouseAddress(oh.listings) : 'Listing removed';
}

interface RowProps {
  openHouse: OpenHouse;
  variant: 'upcoming' | 'past' | 'cancelled';
  onShowQr(): void;
  onVisitors(): void;
  onEdit(): void;
  onComplete(): void;
  onCancel(): void;
  onDelete(): void;
}

function OpenHouseRow({
  openHouse: oh,
  variant,
  onShowQr,
  onVisitors,
  onEdit,
  onComplete,
  onCancel,
  onDelete,
}: RowProps) {
  const muted = variant !== 'upcoming';
  return (
    <li className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:gap-4">
      <div className="flex min-w-0 flex-1 items-start gap-3 sm:items-center sm:gap-4">
        <img
          src={photoOf(oh)}
          alt=""
          loading="lazy"
          className={cn(
            'h-16 w-20 shrink-0 rounded-lg object-cover sm:h-[72px] sm:w-24',
            muted && 'opacity-80'
          )}
          onError={(e) => {
            if (!e.currentTarget.src.endsWith(PLACEHOLDER_PROPERTY_IMAGE)) {
              e.currentTarget.src = PLACEHOLDER_PROPERTY_IMAGE;
            }
          }}
        />
        <div className="min-w-0">
          <p className="font-semibold text-foreground">
            <time dateTime={oh.starts_at}>{formatWhen(oh.starts_at, oh.ends_at)}</time>
          </p>
          <p className="truncate text-sm text-foreground">{addressOf(oh)}</p>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            <span
              className={cn(
                'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                oh.is_public
                  ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              {oh.is_public ? 'Public' : 'Private'}
            </span>
            {variant === 'cancelled' && (
              <span className="text-xs font-medium text-muted-foreground">Cancelled</span>
            )}
            <span>{oh.signInCount === 1 ? '1 sign-in' : `${oh.signInCount} sign-ins`}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:shrink-0 sm:justify-end">
        {variant === 'upcoming' && (
          <>
            <Button asChild variant="outline" size="sm" className="h-11 gap-1.5 sm:h-9">
              <a href={`/open-house/${oh.id}`} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
                Open sign-in kiosk
              </a>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-11 gap-1.5 sm:h-9"
              onClick={onShowQr}
            >
              <QrCode className="h-4 w-4" aria-hidden="true" />
              Show QR
            </Button>
          </>
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-11 gap-1.5 sm:h-9"
          onClick={onVisitors}
        >
          <Users className="h-4 w-4" aria-hidden="true" />
          Visitors
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`More actions for ${addressOf(oh)}`}
            >
              <MoreHorizontal className="h-5 w-5" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[11rem]">
            {variant !== 'cancelled' && (
              <DropdownMenuItem className="min-h-[44px]" onSelect={onEdit}>
                Edit
              </DropdownMenuItem>
            )}
            {oh.status === 'scheduled' && (
              <DropdownMenuItem className="min-h-[44px]" onSelect={onComplete}>
                Mark complete
              </DropdownMenuItem>
            )}
            {variant === 'upcoming' && (
              <DropdownMenuItem className="min-h-[44px]" onSelect={onCancel}>
                Cancel open house
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="min-h-[44px] text-red-700 focus:bg-red-50 focus:text-red-800"
              onSelect={onDelete}
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </li>
  );
}

export default function OpenHouses() {
  const { openHouses, isLoading, error, refetch, updateOpenHouse, deleteOpenHouse } =
    useOpenHouses();
  const { listings, isLoading: listingsLoading } = useListings();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<OpenHouse | null>(null);
  const [qrFor, setQrFor] = useState<OpenHouse | null>(null);
  const [visitorsFor, setVisitorsFor] = useState<OpenHouse | null>(null);
  const [confirm, setConfirm] = useState<Confirm>(null);
  const [showCancelled, setShowCancelled] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const { status, planName } = usePlanUsage();

  const { upcoming, past, cancelled } = useMemo(() => {
    const now = Date.now();
    const up: OpenHouse[] = [];
    const done: OpenHouse[] = [];
    const off: OpenHouse[] = [];
    for (const oh of openHouses) {
      if (oh.status === 'cancelled') off.push(oh);
      else if (oh.status === 'scheduled' && new Date(oh.ends_at).getTime() > now) up.push(oh);
      else done.push(oh);
    }
    const byStart = (a: OpenHouse, b: OpenHouse) =>
      new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime();
    up.sort(byStart);
    done.sort((a, b) => byStart(b, a));
    off.sort((a, b) => byStart(b, a));
    return { upcoming: up, past: done, cancelled: off };
  }, [openHouses]);

  const hasListings = listings.length > 0;

  // Free has no open houses and paid plans a monthly allowance. The allowance
  // is per month and the month is only known once a date is picked, so a full
  // month is refused by the database on save (with its own upgrade message).
  // Here the agent is stopped only when the plan has no open houses at all.
  const openCreate = () => {
    if (status('open_houses_per_month').level === 'locked') {
      setUpgradeOpen(true);
      return;
    }
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (oh: OpenHouse) => {
    setEditing(oh);
    setFormOpen(true);
  };

  const markComplete = async (oh: OpenHouse) => {
    try {
      await updateOpenHouse.mutateAsync({ id: oh.id, input: { status: 'completed' } });
      toast.success('Marked complete');
    } catch {
      toast.error("Couldn't update the open house. Please try again.");
    }
  };

  const runConfirm = async () => {
    if (!confirm) return;
    const { kind, openHouse } = confirm;
    try {
      if (kind === 'cancel') {
        await updateOpenHouse.mutateAsync({ id: openHouse.id, input: { status: 'cancelled' } });
        toast.success('Open house cancelled', {
          description: 'It no longer shows on your public page or takes sign-ins.',
        });
      } else {
        await deleteOpenHouse.mutateAsync(openHouse.id);
        toast.success('Open house deleted');
      }
    } catch {
      toast.error(
        kind === 'cancel'
          ? "Couldn't cancel the open house. Please try again."
          : "Couldn't delete the open house. Please try again."
      );
    } finally {
      setConfirm(null);
    }
  };

  const copyLink = async (id: string) => {
    try {
      await navigator.clipboard.writeText(kioskUrl(id));
      toast.success('Sign-in link copied');
    } catch {
      toast.error("Couldn't copy the link. Select it and copy it instead.");
    }
  };

  const rowHandlers = (oh: OpenHouse) => ({
    onShowQr: () => setQrFor(oh),
    onVisitors: () => setVisitorsFor(oh),
    onEdit: () => openEdit(oh),
    onComplete: () => void markComplete(oh),
    onCancel: () => setConfirm({ kind: 'cancel', openHouse: oh }),
    onDelete: () => setConfirm({ kind: 'delete', openHouse: oh }),
  });

  const isEmpty = !isLoading && !error && openHouses.length === 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Open Houses</h1>
          <p className="mt-1 max-w-prose text-muted-foreground">
            Schedule open houses, run the sign-in at the door, and follow up with everyone who came
            through.
          </p>
        </div>
        <Button
          type="button"
          className="gap-2 sm:shrink-0"
          onClick={openCreate}
          disabled={!listingsLoading && !hasListings}
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Schedule open house
        </Button>
      </div>

      <PlanLimitNotice limitKey="open_houses_per_month" />

      {isLoading && (
        <div className="space-y-4" aria-busy="true" aria-label="Loading open houses">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-[72px] w-24 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-64" />
              </div>
            </div>
          ))}
        </div>
      )}

      {error && !isLoading && (
        <div className="rounded-xl border border-border bg-card p-6 text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-red-600" aria-hidden="true" />
          <p className="mt-3 font-semibold text-foreground">Couldn’t load your open houses</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {error instanceof Error ? error.message : 'Please try again.'}
          </p>
          <Button variant="outline" className="mt-4 gap-2" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Try again
          </Button>
        </div>
      )}

      {isEmpty && (
        <div className="rounded-xl border border-dashed border-border px-6 py-10 text-center">
          <CalendarPlus className="mx-auto h-10 w-10 text-muted-foreground" aria-hidden="true" />
          <h2 className="mt-4 text-lg font-semibold text-foreground">No open houses yet</h2>
          {!listingsLoading && !hasListings ? (
            <>
              <p className="mx-auto mt-2 max-w-md text-muted-foreground">
                An open house is held at one of your listings, so add a listing first.
              </p>
              <Button asChild className="mt-5">
                <Link to="/dashboard/listings">Add a listing</Link>
              </Button>
            </>
          ) : (
            <>
              <ol className="mx-auto mt-3 max-w-md space-y-2 text-left text-muted-foreground">
                <li>
                  <span className="font-medium text-foreground">1. Schedule it</span> — pick a
                  listing, a date and a time.
                </li>
                <li>
                  <span className="font-medium text-foreground">
                    2. It shows on your public page
                  </span>{' '}
                  — visitors can add it to their calendar and get directions.
                </li>
                <li>
                  <span className="font-medium text-foreground">
                    3. Visitors sign in on a tablet
                  </span>{' '}
                  at the door, and every sign-in lands in your Leads.
                </li>
              </ol>
              <Button className="mt-6 gap-2" onClick={openCreate}>
                <Plus className="h-4 w-4" aria-hidden="true" />
                Schedule your first open house
              </Button>
            </>
          )}
        </div>
      )}

      {!isLoading && !error && openHouses.length > 0 && (
        <>
          <section aria-labelledby="oh-upcoming">
            <h2 id="oh-upcoming" className="text-lg font-semibold text-foreground">
              Upcoming
            </h2>
            {upcoming.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">
                Nothing scheduled.{' '}
                {hasListings && (
                  <button
                    type="button"
                    onClick={openCreate}
                    className="font-medium text-foreground underline underline-offset-4"
                  >
                    Schedule one
                  </button>
                )}
              </p>
            ) : (
              <ul className="mt-1 divide-y divide-border">
                {upcoming.map((oh) => (
                  <OpenHouseRow
                    key={oh.id}
                    openHouse={oh}
                    variant="upcoming"
                    {...rowHandlers(oh)}
                  />
                ))}
              </ul>
            )}
          </section>

          {past.length > 0 && (
            <section aria-labelledby="oh-past">
              <h2 id="oh-past" className="text-lg font-semibold text-foreground">
                Past
              </h2>
              <ul className="mt-1 divide-y divide-border">
                {past.map((oh) => (
                  <OpenHouseRow key={oh.id} openHouse={oh} variant="past" {...rowHandlers(oh)} />
                ))}
              </ul>
            </section>
          )}

          {cancelled.length > 0 && (
            <section aria-labelledby="oh-cancelled">
              <button
                id="oh-cancelled"
                type="button"
                aria-expanded={showCancelled}
                aria-controls="oh-cancelled-list"
                onClick={() => setShowCancelled((v) => !v)}
                className="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                <ChevronDown
                  className={cn('h-4 w-4 transition-transform', showCancelled && 'rotate-180')}
                  aria-hidden="true"
                />
                Cancelled ({cancelled.length})
              </button>
              {showCancelled && (
                <ul id="oh-cancelled-list" className="divide-y divide-border">
                  {cancelled.map((oh) => (
                    <OpenHouseRow
                      key={oh.id}
                      openHouse={oh}
                      variant="cancelled"
                      {...rowHandlers(oh)}
                    />
                  ))}
                </ul>
              )}
            </section>
          )}
        </>
      )}

      <OpenHouseFormDialog open={formOpen} onOpenChange={setFormOpen} openHouse={editing} />
      <UpgradeModal
        open={upgradeOpen}
        onOpenChange={setUpgradeOpen}
        feature="open_houses_per_month"
        currentPlan={planName}
      />

      <OpenHouseVisitorsDialog
        openHouse={visitorsFor}
        onOpenChange={(open) => !open && setVisitorsFor(null)}
      />

      <Dialog open={!!qrFor} onOpenChange={(open) => !open && setQrFor(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Sign-in QR code</DialogTitle>
            <DialogDescription>
              Print this on your sign-in sheet or tape it by the door. Visitors scan it to sign in
              on their own phone.
            </DialogDescription>
          </DialogHeader>
          {qrFor && (
            <div className="flex flex-col items-center gap-4">
              <div className="rounded-lg bg-white p-4">
                <QRCodeSVG
                  value={kioskUrl(qrFor.id)}
                  size={224}
                  level="M"
                  includeMargin={false}
                  role="img"
                  aria-label={`QR code for the sign-in link for ${addressOf(qrFor)}`}
                />
              </div>
              <p className="text-center text-sm font-medium text-gray-900">{addressOf(qrFor)}</p>
              <div className="flex w-full flex-col gap-2 sm:flex-row">
                <input
                  readOnly
                  value={kioskUrl(qrFor.id)}
                  aria-label="Sign-in link"
                  onFocus={(e) => e.currentTarget.select()}
                  className="min-h-[44px] w-full min-w-0 rounded-md border border-gray-300 bg-gray-50 px-3 text-sm text-gray-900"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="shrink-0 gap-2"
                  onClick={() => void copyLink(qrFor.id)}
                >
                  <Copy className="h-4 w-4" aria-hidden="true" />
                  Copy link
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirm} onOpenChange={(open) => !open && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirm?.kind === 'cancel' ? 'Cancel this open house?' : 'Delete this open house?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirm?.kind === 'cancel'
                ? 'It will come off your public page and the sign-in link will stop accepting visitors. Anyone who already signed in stays in your Leads.'
                : 'This removes the open house permanently. Visitors who signed in stay in your Leads.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 text-white hover:bg-red-700"
              onClick={() => void runConfirm()}
            >
              {confirm?.kind === 'cancel' ? 'Cancel open house' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
