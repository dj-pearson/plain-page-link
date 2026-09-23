import { useState, type FormEvent, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { format, formatDistanceToNow } from 'date-fns';
import {
  Calendar,
  Mail,
  MessageSquare,
  Pencil,
  Phone,
  Plus,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import {
  INTERACTION_KINDS,
  contactName,
  relationshipLabel,
  useContact,
  useContactInteractions,
  useContacts,
  useKeyDates,
  type Contact,
  type InteractionKind,
  type KeyDateRow,
} from '@/hooks/useContacts';
import {
  TOUCH_FREQUENCIES,
  daysBetween,
  describeDaysAway,
  describeOccasion,
  isTouchDue,
  keyDateKindLabel,
  parseCalendarDate,
  toCalendarDate,
  upcomingKeyDates,
} from '@/lib/keyDates';
import { cn } from '@/lib/utils';
import { ContactFormDialog, HOUSEHOLD_RELATIONS } from './ContactFormDialog';
import { KeyDateForm } from './KeyDateForm';

export interface ContactDetailProps {
  contactId: string;
  open: boolean;
  onOpenChange(open: boolean): void;
}

const QUICK_LOG: { kind: InteractionKind; label: string }[] = [
  { kind: 'call', label: 'Call' },
  { kind: 'text', label: 'Text' },
  { kind: 'email', label: 'Email' },
  { kind: 'meeting', label: 'Met' },
  { kind: 'gift', label: 'Gift' },
  { kind: 'card', label: 'Card' },
];

function interactionLabel(kind: string): string {
  return INTERACTION_KINDS.find((k) => k.value === kind)?.label ?? kind;
}

function householdRelationLabel(relation: string): string {
  return HOUSEHOLD_RELATIONS.find((r) => r.value === relation)?.label ?? relation;
}

function cadenceLabel(days: number | null): string {
  if (!days) return 'No check-in cadence';
  const known = TOUCH_FREQUENCIES.find((f) => f.value === days);
  return known ? `Check in ${known.label.toLowerCase()}` : `Check in every ${days} days`;
}

/** "Mar 14, 1988", or "Mar 14" when the year is not known. */
export function formatKeyDate(eventDate: string, yearKnown: boolean): string {
  const date = parseCalendarDate(eventDate);
  if (!date) return eventDate;
  return format(date, yearKnown ? 'MMM d, yyyy' : 'MMM d');
}

const actionLinkClass =
  'inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-border bg-background px-4 text-sm font-medium text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

export function ContactDetail({ contactId, open, onOpenChange }: ContactDetailProps) {
  const { data: contact, isLoading, error } = useContact(open ? contactId : null);
  const { deleteContact } = useContacts();
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleDelete = async () => {
    if (!contact) return;
    try {
      await deleteContact.mutateAsync(contact.id);
      toast.success(`${contactName(contact)} removed`);
      setConfirmDelete(false);
      onOpenChange(false);
    } catch {
      toast.error('Could not delete. Please try again.');
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <DialogTitle className="sr-only">Loading client</DialogTitle>
              <LoadingSpinner size="lg" />
            </div>
          ) : error || !contact ? (
            <div className="py-8 text-center">
              <DialogTitle>Client not found</DialogTitle>
              <DialogDescription className="mt-2">
                {error
                  ? 'This client could not be loaded. Please try again.'
                  : 'It may have been deleted.'}
              </DialogDescription>
            </div>
          ) : (
            <ContactBody
              contact={contact}
              onEdit={() => setEditing(true)}
              onDelete={() => setConfirmDelete(true)}
            />
          )}
        </DialogContent>
      </Dialog>

      {contact && <ContactFormDialog open={editing} onOpenChange={setEditing} contact={contact} />}

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {contact ? contactName(contact) : 'this client'}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Their key dates and activity history are deleted with them. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteContact.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteContact.isPending}
              onClick={(e) => {
                // Keep the dialog open until the delete settles.
                e.preventDefault();
                void handleDelete();
              }}
            >
              {deleteContact.isPending ? 'Deleting…' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm text-foreground">{children}</dd>
    </div>
  );
}

function ContactBody({
  contact,
  onEdit,
  onDelete,
}: {
  contact: Contact;
  onEdit(): void;
  onDelete(): void;
}) {
  const name = contactName(contact);
  const due = isTouchDue(contact.next_touch_at);
  const householdNames = contact.household.map((m) => m.name);

  let nextTouch = 'No next touch scheduled';
  if (contact.next_touch_at) {
    if (due) nextTouch = 'Touch due now';
    else {
      const days = daysBetween(new Date(), new Date(contact.next_touch_at));
      nextTouch = days === 1 ? 'Next touch tomorrow' : `Next touch in ${days} days`;
    }
  }

  return (
    <div className="space-y-5">
      <DialogHeader className="space-y-2 text-left">
        <DialogTitle className="text-xl sm:text-2xl">{name}</DialogTitle>
        <DialogDescription asChild>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{relationshipLabel(contact.relationship)}</Badge>
            {contact.city && <span>{contact.city}</span>}
          </div>
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-wrap gap-2">
        {contact.phone && (
          <>
            <a href={`tel:${contact.phone}`} className={actionLinkClass}>
              <Phone className="h-4 w-4" aria-hidden="true" />
              Call
            </a>
            <a href={`sms:${contact.phone}`} className={actionLinkClass}>
              <MessageSquare className="h-4 w-4" aria-hidden="true" />
              Text
            </a>
          </>
        )}
        {contact.email && (
          <a href={`mailto:${contact.email}`} className={actionLinkClass}>
            <Mail className="h-4 w-4" aria-hidden="true" />
            Email
          </a>
        )}
        <div className="flex gap-2 sm:ml-auto">
          <Button variant="outline" onClick={onEdit}>
            <Pencil className="mr-2 h-4 w-4" aria-hidden="true" />
            Edit
          </Button>
          <Button
            variant="ghost"
            onClick={onDelete}
            className="text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
          >
            <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />
            Delete
          </Button>
        </div>
      </div>

      <dl className="grid gap-4 sm:grid-cols-3">
        <Fact label="Cadence">{cadenceLabel(contact.touch_frequency_days)}</Fact>
        <Fact label="Next touch">
          <span className={cn(due && 'font-semibold text-amber-700 dark:text-amber-400')}>
            {nextTouch}
          </span>
        </Fact>
        <Fact label="Last contacted">
          {contact.last_contacted_at
            ? `${formatDistanceToNow(new Date(contact.last_contacted_at))} ago`
            : 'Not yet'}
        </Fact>
      </dl>

      {contact.household.length > 0 && (
        <section aria-labelledby="household-heading" className="space-y-2">
          <h3 id="household-heading" className="text-sm font-semibold text-foreground">
            Household
          </h3>
          <ul className="divide-y divide-border rounded-xl border border-border">
            {contact.household.map((m, i) => (
              <li key={`${m.name}-${i}`} className="px-4 py-3 text-sm">
                <span className="font-medium text-foreground">{m.name}</span>
                <span className="text-muted-foreground">
                  {' '}
                  · {householdRelationLabel(m.relation)}
                </span>
                {m.notes && <p className="mt-0.5 text-muted-foreground">{m.notes}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {(contact.interests.length > 0 || contact.tags.length > 0) && (
        <div className="space-y-2">
          {contact.interests.length > 0 && (
            <p className="text-sm">
              <span className="text-muted-foreground">Interests: </span>
              <span className="text-foreground">{contact.interests.join(', ')}</span>
            </p>
          )}
          {contact.tags.length > 0 && (
            <ul className="flex flex-wrap gap-1.5" aria-label="Tags">
              {contact.tags.map((tag) => (
                <li key={tag}>
                  <Badge variant="outline" className="dark:text-gray-100">
                    {tag}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <Separator />

      <Tabs defaultValue="dates">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="dates" className="min-h-[44px]">
            Key dates
          </TabsTrigger>
          <TabsTrigger value="activity" className="min-h-[44px]">
            Activity
          </TabsTrigger>
          <TabsTrigger value="details" className="min-h-[44px]">
            Details
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dates" className="mt-4">
          <KeyDatesPanel contactId={contact.id} householdNames={householdNames} />
        </TabsContent>

        <TabsContent value="activity" className="mt-4">
          <ActivityPanel contactId={contact.id} />
        </TabsContent>

        <TabsContent value="details" className="mt-4">
          <DetailsPanel contact={contact} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Key dates
// ---------------------------------------------------------------------------

function KeyDatesPanel({
  contactId,
  householdNames,
}: {
  contactId: string;
  householdNames: string[];
}) {
  const { keyDates, isLoading, deleteKeyDate } = useKeyDates(contactId);
  // null: no form open; 'new': adding; otherwise the id being edited.
  const [editing, setEditing] = useState<string | null>(null);
  const today = new Date();

  const handleDelete = async (kd: KeyDateRow) => {
    try {
      await deleteKeyDate.mutateAsync(kd.id);
      toast.success(`${kd.label} removed`);
    } catch {
      toast.error('Could not delete the date. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-6">
        <LoadingSpinner />
      </div>
    );
  }

  // Soonest next occurrence first; one-off dates that have passed go last.
  const sorted = keyDates
    .map((kd) => ({ kd, upcoming: upcomingKeyDates([kd], today, 366)[0] ?? null }))
    .sort((a, b) => (a.upcoming?.daysAway ?? 9999) - (b.upcoming?.daysAway ?? 9999));

  return (
    <div className="space-y-4">
      {sorted.length === 0 && editing !== 'new' && (
        <p className="text-sm text-muted-foreground">
          No dates yet. Birthdays, anniversaries and the day they got the keys are the ones worth a
          card.
        </p>
      )}

      {sorted.length > 0 && (
        <ul className="divide-y divide-border rounded-xl border border-border">
          {sorted.map(({ kd, upcoming }) =>
            editing === kd.id ? (
              <li key={kd.id} className="p-3">
                <KeyDateForm
                  contactId={contactId}
                  householdNames={householdNames}
                  keyDate={kd}
                  onDone={() => setEditing(null)}
                />
              </li>
            ) : (
              <li key={kd.id} className="flex items-start gap-3 px-4 py-3">
                <Calendar
                  className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
                <div className="min-w-0 flex-1 space-y-0.5">
                  <p className="text-sm font-medium text-foreground">
                    {kd.label}
                    {kd.person_name && (
                      <span className="font-normal text-muted-foreground"> · {kd.person_name}</span>
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatKeyDate(kd.event_date, kd.year_known)}
                    {kd.label !== keyDateKindLabel(kd.kind) && ` · ${keyDateKindLabel(kd.kind)}`}
                  </p>
                  <p className="text-sm text-foreground">
                    {upcoming
                      ? [
                          describeDaysAway(upcoming.daysAway),
                          describeOccasion(kd.kind, upcoming.years),
                        ]
                          .filter(Boolean)
                          .join(' — ')
                      : kd.recurs_annually
                        ? 'Every year'
                        : 'Passed'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {kd.remind_days_before === 0
                      ? 'Reminder on the day'
                      : `Reminder ${kd.remind_days_before} day${kd.remind_days_before === 1 ? '' : 's'} before`}
                  </p>
                </div>
                <div className="flex shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setEditing(kd.id)}
                    aria-label={`Edit ${kd.label}`}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => void handleDelete(kd)}
                    aria-label={`Delete ${kd.label}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            )
          )}
        </ul>
      )}

      {editing === 'new' ? (
        <KeyDateForm
          contactId={contactId}
          householdNames={householdNames}
          onDone={() => setEditing(null)}
        />
      ) : (
        <Button variant="outline" onClick={() => setEditing('new')}>
          <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
          Add date
        </Button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Activity
// ---------------------------------------------------------------------------

/** A picked calendar day as a timestamp: now if it is today, else midday that day. */
function occurredAt(day: string): string | undefined {
  const date = parseCalendarDate(day);
  if (!date) return undefined;
  if (day === toCalendarDate(new Date())) return new Date().toISOString();
  date.setHours(12, 0, 0, 0);
  return date.toISOString();
}

function ActivityPanel({ contactId }: { contactId: string }) {
  const { interactions, isLoading, logInteraction, deleteInteraction } =
    useContactInteractions(contactId);
  const [kind, setKind] = useState<InteractionKind>('call');
  const [summary, setSummary] = useState('');
  const [day, setDay] = useState(() => toCalendarDate(new Date()));

  const log = async (input: { kind: InteractionKind; summary?: string; occurred_at?: string }) => {
    try {
      await logInteraction.mutateAsync({ contact_id: contactId, ...input });
      toast.success(`${interactionLabel(input.kind)} logged`);
      return true;
    } catch {
      toast.error('Could not log that. Please try again.');
      return false;
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const ok = await log({
      kind,
      summary: summary.trim() || undefined,
      occurred_at: occurredAt(day),
    });
    if (ok) {
      setSummary('');
      setDay(toCalendarDate(new Date()));
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteInteraction.mutateAsync(id);
    } catch {
      toast.error('Could not delete. Please try again.');
    }
  };

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground" id="quick-log-label">
          Just reached out? Log it in one tap.
        </p>
        <div className="flex flex-wrap gap-2" role="group" aria-labelledby="quick-log-label">
          {QUICK_LOG.map((q) => (
            <Button
              key={q.kind}
              variant="outline"
              disabled={logInteraction.isPending}
              onClick={() => void log({ kind: q.kind })}
            >
              {q.label}
            </Button>
          ))}
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid gap-3 rounded-xl border border-border p-4 sm:grid-cols-[10rem_1fr_10rem_auto] sm:items-end"
        aria-label="Log an interaction"
      >
        <div className="space-y-1.5">
          <Label htmlFor={`interaction-kind-${contactId}`}>Kind</Label>
          <Select value={kind} onValueChange={(v) => setKind(v as InteractionKind)}>
            <SelectTrigger id={`interaction-kind-${contactId}`} className="h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {INTERACTION_KINDS.map((k) => (
                <SelectItem key={k.value} value={k.value}>
                  {k.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`interaction-summary-${contactId}`}>What happened</Label>
          <Input
            id={`interaction-summary-${contactId}`}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Caught up about Emma's recital"
            className="h-11"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`interaction-date-${contactId}`}>Date</Label>
          <Input
            id={`interaction-date-${contactId}`}
            type="date"
            value={day}
            max={toCalendarDate(new Date())}
            onChange={(e) => setDay(e.target.value)}
            className="h-11"
          />
        </div>
        <Button type="submit" disabled={logInteraction.isPending}>
          Log
        </Button>
      </form>

      {isLoading ? (
        <div className="flex justify-center py-6">
          <LoadingSpinner />
        </div>
      ) : interactions.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nothing logged yet.</p>
      ) : (
        <ol
          className="divide-y divide-border rounded-xl border border-border"
          aria-label="Activity"
        >
          {interactions.map((item) => (
            <li key={item.id} className="flex items-start gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">{interactionLabel(item.kind)}</p>
                {item.summary && <p className="text-sm text-muted-foreground">{item.summary}</p>}
                <p className="text-xs text-muted-foreground">
                  <time dateTime={item.occurred_at}>
                    {formatDistanceToNow(new Date(item.occurred_at), { addSuffix: true })}
                  </time>
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => void handleDelete(item.id)}
                aria-label={`Delete ${interactionLabel(item.kind).toLowerCase()} entry`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Details
// ---------------------------------------------------------------------------

function DetailsPanel({ contact }: { contact: Contact }) {
  const address = [
    contact.address,
    [contact.city, contact.state].filter(Boolean).join(', '),
    contact.zip_code,
  ]
    .filter(Boolean)
    .join(' ');
  const work = [contact.occupation, contact.employer].filter(Boolean).join(' at ');

  return (
    <div className="space-y-4">
      <dl className="grid gap-4 sm:grid-cols-2">
        <Fact label="Email">
          {contact.email ? (
            <a
              href={`mailto:${contact.email}`}
              className="break-all underline-offset-4 hover:underline"
            >
              {contact.email}
            </a>
          ) : (
            '—'
          )}
        </Fact>
        <Fact label="Phone">
          {contact.phone ? (
            <a href={`tel:${contact.phone}`} className="underline-offset-4 hover:underline">
              {contact.phone}
            </a>
          ) : (
            '—'
          )}
        </Fact>
        <Fact label="Prefers">
          {contact.preferred_contact
            ? ({ call: 'A call', text: 'A text', email: 'An email' }[contact.preferred_contact] ??
              contact.preferred_contact)
            : 'No preference'}
        </Fact>
        <Fact label="Address">{address || '—'}</Fact>
        <Fact label="Work">{work || '—'}</Fact>
        <Fact label="Referred by">{contact.referred_by || '—'}</Fact>
        <Fact label="Source">{contact.source || '—'}</Fact>
        <Fact label="Client since">{format(new Date(contact.created_at), 'MMM d, yyyy')}</Fact>
      </dl>

      {contact.notes && (
        <section aria-labelledby="contact-notes-heading" className="space-y-1">
          <h3 id="contact-notes-heading" className="text-sm font-semibold text-foreground">
            Notes
          </h3>
          <p className="max-w-prose whitespace-pre-wrap text-sm text-foreground">{contact.notes}</p>
        </section>
      )}

      {contact.lead_id && (
        <Link
          to={`/dashboard/leads?lead=${encodeURIComponent(contact.lead_id)}`}
          className="inline-flex min-h-[44px] items-center gap-2 text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          <ExternalLink className="h-4 w-4" aria-hidden="true" />
          View original lead
        </Link>
      )}
    </div>
  );
}
