/**
 * Moves a lead into the agent's client sphere.
 *
 * A lead is somebody who filled in a form; a client is somebody whose kids'
 * names the agent should know. This is the one-tap bridge: it creates the
 * contact with the lead's name, email and phone (encrypted, as on the lead),
 * links it back through contacts.lead_id, and from then on shows "View client"
 * instead — one lead, one contact.
 *
 * US-629: before creating, it asks pii-crypto whether the person is already a
 * client (same email or phone, by keyed fingerprint). A past client's new
 * enquiry, or someone the agent typed in by hand, is then offered as "Link to
 * this client" rather than becoming a second record. If the check cannot be
 * made, the add goes ahead as before: a possible duplicate beats a lost lead.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { HeartHandshake, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/useAuthStore';
import { useContacts } from '@/hooks/useContacts';
import { usePlanUsage } from '@/hooks/usePlanUsage';
import { toastSaveError } from '@/lib/planLimitToast';
import { relationshipForLead, splitName } from '@/lib/leadToClient';
import { findContactsMatchingLead, type ContactMatchForLead } from '@/lib/pii';
import { logger } from '@/lib/logger';
import type { Lead } from '@/types/lead';

const MATCHED_ON_LABEL: Record<ContactMatchForLead['matched_on'], string> = {
  email: 'same email',
  phone: 'same phone',
  email_and_phone: 'same email and phone',
};

function matchName(m: ContactMatchForLead): string {
  return [m.first_name, m.last_name].filter(Boolean).join(' ');
}

export function AddLeadToClientsButton({ lead }: { lead: Lead }) {
  const { user } = useAuthStore();
  const { createContact, updateContact } = useContacts();
  const { planName } = usePlanUsage();
  const [checking, setChecking] = useState(false);
  const [matches, setMatches] = useState<ContactMatchForLead[] | null>(null);

  const existing = useQuery({
    queryKey: ['contacts', 'by-lead', lead.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contacts')
        .select('id')
        .eq('user_id', user?.id ?? '')
        .eq('lead_id', lead.id)
        .maybeSingle();
      if (error) throw error;
      return data?.id ?? null;
    },
    enabled: !!user?.id,
  });

  if (existing.isLoading) return null;
  // A locked lead has no contact details to carry across; converting it now
  // would create a client with none, which an upgrade would not fill in.
  if (lead.contact_locked && !existing.data) return null;

  if (existing.data) {
    return (
      <Button asChild variant="outline" size="sm" className="min-h-[44px] sm:min-h-0">
        <Link to={`/dashboard/clients?client=${existing.data}`}>
          <HeartHandshake className="mr-1.5 h-4 w-4" aria-hidden="true" />
          View client
        </Link>
      </Button>
    );
  }

  const createFromLead = async () => {
    try {
      await createContact.mutateAsync({
        ...splitName(lead.name),
        email: lead.email,
        phone: lead.phone,
        relationship: relationshipForLead(lead.lead_type),
        source: lead.source ?? 'lead',
        lead_id: lead.id,
        notes: lead.message ?? null,
      });
      setMatches(null);
      await existing.refetch();
      toast.success(`${lead.name} added to your clients`, {
        description: 'Add their family, birthdays and key dates from Clients.',
      });
    } catch (error) {
      toastSaveError(error, 'Could not add to clients. Please try again.', planName);
    }
  };

  const handleAdd = async () => {
    setChecking(true);
    let found: ContactMatchForLead[] = [];
    try {
      found = await findContactsMatchingLead(lead.id);
    } catch (error) {
      // Go ahead without the check rather than block the conversion.
      logger.warn('Duplicate-client check failed; adding without it', {
        action: 'match_contacts_for_lead',
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setChecking(false);
    }
    if (found.length > 0) {
      setMatches(found);
      return;
    }
    await createFromLead();
  };

  const linkTo = async (match: ContactMatchForLead) => {
    try {
      await updateContact.mutateAsync({ id: match.id, input: { lead_id: lead.id } });
      setMatches(null);
      await existing.refetch();
      toast.success(`Linked to ${matchName(match)}`, {
        description: 'This enquiry now opens their client record.',
      });
    } catch (error) {
      toastSaveError(error, 'Could not link to the client. Please try again.', planName);
    }
  };

  const busy = createContact.isPending || updateContact.isPending;
  const open = !!matches && matches.length > 0;

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (!next) setMatches(null);
      }}
    >
      <PopoverAnchor asChild>
        <Button
          variant="outline"
          size="sm"
          className="min-h-[44px] sm:min-h-0"
          onClick={() => void handleAdd()}
          disabled={checking || createContact.isPending}
        >
          <UserPlus className="mr-1.5 h-4 w-4" aria-hidden="true" />
          {checking ? 'Checking…' : createContact.isPending ? 'Adding…' : 'Add to clients'}
        </Button>
      </PopoverAnchor>
      <PopoverContent
        align="end"
        className="w-80 rounded-xl border-border bg-popover text-popover-foreground"
      >
        {open && (
          <div role="group" aria-labelledby={`existing-client-${lead.id}`} className="text-sm">
            <p id={`existing-client-${lead.id}`} className="font-medium">
              {matches?.length === 1
                ? 'This may already be one of your clients'
                : 'These may already be your clients'}
            </p>
            <ul className="mt-2 space-y-2">
              {(matches ?? []).map((m) => (
                <li key={m.id} className="flex flex-wrap items-center justify-between gap-2">
                  <span>
                    {matchName(m)}{' '}
                    <span className="text-muted-foreground">
                      ({MATCHED_ON_LABEL[m.matched_on]})
                    </span>
                  </span>
                  {m.lead_id ? (
                    // Already linked to another enquiry; contacts.lead_id holds
                    // one, so open the client rather than move the link.
                    <Button asChild variant="outline" size="sm" className="min-h-[44px] sm:min-h-0">
                      <Link to={`/dashboard/clients?client=${m.id}`}>Open client</Link>
                    </Button>
                  ) : (
                    <Button
                      variant="default"
                      size="sm"
                      className="min-h-[44px] sm:min-h-0"
                      onClick={() => void linkTo(m)}
                      disabled={busy}
                    >
                      Link to this client
                    </Button>
                  )}
                </li>
              ))}
            </ul>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                className="min-h-[44px] sm:min-h-0"
                onClick={() => void createFromLead()}
                disabled={busy}
              >
                <UserPlus className="mr-1.5 h-4 w-4" aria-hidden="true" />
                {createContact.isPending ? 'Adding…' : 'Add as a new client'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="min-h-[44px] sm:min-h-0"
                onClick={() => setMatches(null)}
                disabled={busy}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
