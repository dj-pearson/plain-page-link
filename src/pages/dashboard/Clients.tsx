import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { AlertCircle, ChevronRight, Plus, RefreshCw, Search, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ContactFormDialog } from '@/components/clients/ContactFormDialog';
import { ContactDetail } from '@/components/clients/ContactDetail';
import { PlanLimitNotice } from '@/components/PlanLimitNotice';
import { UpgradeModal } from '@/components/UpgradeModal';
import { usePlanUsage } from '@/hooks/usePlanUsage';
import {
  RELATIONSHIPS,
  contactName,
  relationshipLabel,
  useContacts,
  type ContactSummary,
  type HouseholdMember,
} from '@/hooks/useContacts';
import { daysBetween, isTouchDue } from '@/lib/keyDates';

const ALL = 'all';

/** "Sam · Emma, Leo": the partner, then everyone else in the household. */
export function householdSummary(household: HouseholdMember[]): string {
  const partners = household.filter((m) => m.relation === 'spouse').map((m) => m.name);
  const others = household.filter((m) => m.relation !== 'spouse').map((m) => m.name);
  return [partners.join(', '), others.join(', ')].filter(Boolean).join(' · ');
}

/** Case-insensitive match over name, tags, interests, household names and city. */
export function matchesSearch(contact: ContactSummary, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = [
    contactName(contact),
    contact.city ?? '',
    ...contact.tags,
    ...contact.interests,
    ...contact.household.map((m) => m.name),
  ]
    .join('\n')
    .toLowerCase();
  return haystack.includes(q);
}

function NextTouch({ contact, now }: { contact: ContactSummary; now: Date }) {
  if (isTouchDue(contact.next_touch_at, now)) {
    return <span className="font-semibold text-amber-700 dark:text-amber-400">Touch due</span>;
  }
  if (!contact.next_touch_at) return <span className="text-muted-foreground">No cadence</span>;
  const days = daysBetween(now, new Date(contact.next_touch_at));
  return (
    <span className="text-muted-foreground">
      {days === 1 ? 'Next touch tomorrow' : `Next touch in ${days} days`}
    </span>
  );
}

export default function Clients() {
  const { contacts, isLoading, error, refetch } = useContacts();
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState('');
  const [relationship, setRelationship] = useState<string>(ALL);
  const [dueOnly, setDueOnly] = useState(false);
  const [adding, setAdding] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const { canAdd, planName } = usePlanUsage();

  // The database refuses a client past the plan's limit; asking first means
  // the agent meets the upgrade prompt before filling in a long form, not after.
  const startAdding = () => {
    if (canAdd('contacts')) setAdding(true);
    else setUpgradeOpen(true);
  };

  // The open contact lives in the URL so the Overview widget can deep-link to it.
  const selectedId = searchParams.get('client');

  const openContact = (id: string) => {
    const next = new URLSearchParams(searchParams);
    next.set('client', id);
    setSearchParams(next);
  };

  const closeContact = () => {
    const next = new URLSearchParams(searchParams);
    next.delete('client');
    setSearchParams(next, { replace: true });
  };

  const now = useMemo(() => new Date(), []);
  const dueCount = useMemo(
    () => contacts.filter((c) => isTouchDue(c.next_touch_at, now)).length,
    [contacts, now]
  );

  const filtered = useMemo(
    () =>
      contacts.filter(
        (c) =>
          matchesSearch(c, query) &&
          (relationship === ALL || c.relationship === relationship) &&
          (!dueOnly || isTouchDue(c.next_touch_at, now))
      ),
    [contacts, query, relationship, dueOnly, now]
  );

  const hasFilters = query.trim() !== '' || relationship !== ALL || dueOnly;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Clients</h1>
          <p className="mt-1 text-muted-foreground">
            Remember the people behind the deals — their families, their dates, and when you last
            checked in.
          </p>
        </div>
        <Button onClick={startAdding} className="self-start sm:self-auto">
          <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
          Add client
        </Button>
      </div>

      <PlanLimitNotice limitKey="contacts" />

      {isLoading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner size="lg" />
        </div>
      ) : error ? (
        <div
          role="alert"
          className="flex flex-col items-start gap-3 rounded-xl border border-border bg-card p-6"
        >
          <div className="flex items-center gap-2 text-foreground">
            <AlertCircle className="h-5 w-5 text-red-600" aria-hidden="true" />
            <p className="font-medium">Your clients could not be loaded.</p>
          </div>
          <Button variant="outline" onClick={() => void refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
            Try again
          </Button>
        </div>
      ) : contacts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card px-6 py-12 text-center">
          <Users className="mx-auto h-10 w-10 text-muted-foreground" aria-hidden="true" />
          <h2 className="mt-4 text-lg font-semibold text-foreground">Start your client sphere</h2>
          <p className="mx-auto mt-2 max-w-prose text-muted-foreground">
            Add past clients and the people in your sphere, with their partners, kids and pets, the
            birthdays and home anniversaries worth a card, and how often you want to check in. We
            will tell you when someone is due.
          </p>
          <Button className="mt-6" onClick={startAdding}>
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
            Add your first client
          </Button>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3 md:flex-row md:items-end">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="clients-search">Search</Label>
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  id="clients-search"
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Name, family member, tag or interest"
                  className="h-11 pl-9"
                />
              </div>
            </div>
            <div className="space-y-1.5 md:w-52">
              <Label htmlFor="clients-relationship">Relationship</Label>
              <Select value={relationship} onValueChange={setRelationship}>
                <SelectTrigger id="clients-relationship" className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>All</SelectItem>
                  {RELATIONSHIPS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              type="button"
              variant={dueOnly ? 'default' : 'outline'}
              aria-pressed={dueOnly}
              onClick={() => setDueOnly((v) => !v)}
              className="md:w-auto"
            >
              Due for a touch ({dueCount})
            </Button>
          </div>

          <p className="text-sm text-muted-foreground" aria-live="polite">
            {filtered.length === contacts.length
              ? `${contacts.length} ${contacts.length === 1 ? 'client' : 'clients'}`
              : `Showing ${filtered.length} of ${contacts.length}`}
          </p>

          {filtered.length === 0 ? (
            <div className="rounded-xl border border-border bg-card px-6 py-10 text-center">
              <p className="text-foreground">No clients match.</p>
              {hasFilters && (
                <Button
                  variant="link"
                  onClick={() => {
                    setQuery('');
                    setRelationship(ALL);
                    setDueOnly(false);
                  }}
                >
                  Clear filters
                </Button>
              )}
            </div>
          ) : (
            <ul
              className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card"
              aria-label="Clients"
            >
              {filtered.map((c) => {
                const household = householdSummary(c.household);
                return (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => openContact(c.id)}
                      className="flex min-h-[44px] w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:outline-none"
                    >
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium text-foreground">{contactName(c)}</span>
                          <Badge variant="secondary">{relationshipLabel(c.relationship)}</Badge>
                        </div>
                        {household && (
                          <p className="truncate text-sm text-muted-foreground">{household}</p>
                        )}
                        <p className="flex flex-wrap gap-x-3 gap-y-0.5 text-sm">
                          <NextTouch contact={c} now={now} />
                          <span className="text-muted-foreground">
                            {c.last_contacted_at
                              ? `Last contacted ${formatDistanceToNow(new Date(c.last_contacted_at))} ago`
                              : 'Not contacted yet'}
                          </span>
                        </p>
                      </div>
                      <ChevronRight
                        className="h-5 w-5 shrink-0 text-muted-foreground"
                        aria-hidden="true"
                      />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}

      <ContactFormDialog open={adding} onOpenChange={setAdding} onSaved={openContact} />
      <UpgradeModal
        open={upgradeOpen}
        onOpenChange={setUpgradeOpen}
        feature="contacts"
        currentPlan={planName}
      />

      {selectedId && (
        <ContactDetail
          contactId={selectedId}
          open
          onOpenChange={(open) => {
            if (!open) closeContact();
          }}
        />
      )}
    </div>
  );
}
