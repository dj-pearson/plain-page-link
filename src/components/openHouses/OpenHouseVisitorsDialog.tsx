/**
 * Who signed in at one open house.
 *
 * Every visitor here is also a lead — the kiosk submits through submit-lead —
 * so each row links to that lead in the Leads page, and this dialog is a
 * filtered view rather than a second copy to keep in sync. The list refreshes
 * every 30 seconds (useOpenHouseVisitors), so an agent can leave it open on a
 * phone during the event.
 */
import { LockedLeadDetails } from '@/components/leads/LockedLeadDetails';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { Download, Loader2, Mail, Phone } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  formatOpenHouseAddress,
  useOpenHouseVisitors,
  type OpenHouse,
} from '@/hooks/useOpenHouses';
import type { Lead } from '@/types/lead';

interface OpenHouseVisitorsDialogProps {
  openHouse: OpenHouse | null;
  onOpenChange(open: boolean): void;
}

interface VisitorAnswers {
  hasAgent: boolean | null;
  heardFrom: string | null;
}

function answersOf(lead: Lead): VisitorAnswers {
  const fd = lead.form_data;
  if (!fd || typeof fd !== 'object' || Array.isArray(fd))
    return { hasAgent: null, heardFrom: null };
  const bag = fd as Record<string, unknown>;
  return {
    hasAgent: typeof bag.hasAgent === 'boolean' ? bag.hasAgent : null,
    heardFrom: typeof bag.heardFrom === 'string' && bag.heardFrom ? bag.heardFrom : null,
  };
}

const yesNo = (v: boolean | null | undefined): string =>
  v === true ? 'Yes' : v === false ? 'No' : '';

/**
 * One CSV cell: quoted when it holds a comma, quote or newline, and prefixed
 * with an apostrophe when it starts like a formula — visitor-typed text opened
 * in a spreadsheet must not execute.
 */
function csvCell(value: string): string {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

function exportVisitorsCsv(openHouse: OpenHouse, visitors: Lead[]): void {
  const headers = [
    'Name',
    'Email',
    'Phone',
    'Signed in',
    'Timeline',
    'Pre-approved',
    'Working with an agent',
    'Heard from',
  ];
  const rows = visitors.map((v) => {
    const a = answersOf(v);
    return [
      v.name ?? '',
      v.email ?? '',
      v.phone ?? '',
      v.created_at ? format(new Date(v.created_at), 'yyyy-MM-dd HH:mm') : '',
      v.timeline ?? '',
      yesNo(v.preapproved),
      yesNo(a.hasAgent),
      a.heardFrom ?? '',
    ];
  });
  const csv = [headers, ...rows].map((r) => r.map(csvCell).join(',')).join('\r\n') + '\r\n';

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `open-house-visitors-${format(new Date(openHouse.starts_at), 'yyyy-MM-dd')}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function OpenHouseVisitorsDialog({ openHouse, onOpenChange }: OpenHouseVisitorsDialogProps) {
  const { data: visitors = [], isLoading, isError, refetch } = useOpenHouseVisitors(openHouse?.id);
  const address = openHouse?.listings ? formatOpenHouseAddress(openHouse.listings) : 'Open house';

  return (
    <Dialog open={!!openHouse} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Visitors</DialogTitle>
          <DialogDescription>
            {address}
            {openHouse && ` · ${format(new Date(openHouse.starts_at), 'EEE, MMM d, yyyy')}`}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-gray-600">
            {visitors.length === 1
              ? '1 visitor signed in.'
              : `${visitors.length} visitors signed in.`}{' '}
            Each one is also in your{' '}
            <Link
              to="/dashboard/leads"
              className="font-medium text-blue-700 underline-offset-4 hover:underline"
            >
              Leads
            </Link>
            .
          </p>
          <Button
            type="button"
            variant="outline"
            className="gap-2"
            disabled={!openHouse || visitors.length === 0}
            onClick={() => openHouse && exportVisitorsCsv(openHouse, visitors)}
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            Export CSV
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-gray-500" aria-hidden="true" />
            <span className="sr-only">Loading visitors</span>
          </div>
        ) : isError ? (
          <div className="py-8 text-center">
            <p className="text-sm text-gray-700">Couldn’t load the visitors.</p>
            <Button type="button" variant="outline" className="mt-3" onClick={() => refetch()}>
              Try again
            </Button>
          </div>
        ) : visitors.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-600">
            No one has signed in yet. Open the sign-in kiosk on a tablet at the door, or print the
            QR code for visitors to scan.
          </p>
        ) : (
          <ul className="divide-y divide-gray-200 border-y border-gray-200">
            {visitors.map((v) => {
              const a = answersOf(v);
              const details = [
                v.timeline ? `Timeline: ${v.timeline}` : null,
                v.preapproved === true
                  ? 'Pre-approved or cash'
                  : v.preapproved === false
                    ? 'Not pre-approved'
                    : null,
                a.hasAgent === true ? 'Has an agent' : a.hasAgent === false ? 'No agent' : null,
                a.heardFrom ? `Heard from: ${a.heardFrom}` : null,
              ].filter((d): d is string => d !== null);
              return (
                <li key={v.id} className="py-3">
                  <div className="flex items-center justify-between gap-3">
                    <Link
                      to={`/dashboard/leads?lead=${encodeURIComponent(v.id)}`}
                      className="inline-flex min-h-[44px] items-center font-medium text-gray-900 underline-offset-4 hover:underline"
                    >
                      {v.name || 'Unnamed visitor'}
                    </Link>
                    {v.created_at && (
                      <time dateTime={v.created_at} className="shrink-0 text-sm text-gray-600">
                        {format(new Date(v.created_at), 'h:mm a')}
                      </time>
                    )}
                  </div>
                  {v.contact_locked && <LockedLeadDetails className="mt-1" />}
                  <div className="flex flex-wrap gap-x-4 text-sm">
                    {v.email && (
                      <a
                        href={`mailto:${v.email}`}
                        className="inline-flex min-h-[44px] items-center gap-1.5 text-blue-700 hover:underline"
                      >
                        <Mail className="h-4 w-4" aria-hidden="true" />
                        {v.email}
                      </a>
                    )}
                    {v.phone && (
                      <a
                        href={`tel:${v.phone.replace(/[^\d+]/g, '')}`}
                        className="inline-flex min-h-[44px] items-center gap-1.5 text-blue-700 hover:underline"
                      >
                        <Phone className="h-4 w-4" aria-hidden="true" />
                        {v.phone}
                      </a>
                    )}
                  </div>
                  {details.length > 0 && (
                    <p className="text-sm text-gray-600">{details.join(' · ')}</p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
