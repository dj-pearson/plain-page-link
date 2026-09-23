/**
 * Moves a lead into the agent's client sphere.
 *
 * A lead is somebody who filled in a form; a client is somebody whose kids'
 * names the agent should know. This is the one-tap bridge: it creates the
 * contact with the lead's name, email and phone (encrypted, as on the lead),
 * links it back through contacts.lead_id, and from then on shows "View client"
 * instead — one lead, one contact.
 */
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { HeartHandshake, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/useAuthStore';
import { useContacts } from '@/hooks/useContacts';
import { usePlanUsage } from '@/hooks/usePlanUsage';
import { toastSaveError } from '@/lib/planLimitToast';
import { relationshipForLead, splitName } from '@/lib/leadToClient';
import type { Lead } from '@/types/lead';

export function AddLeadToClientsButton({ lead }: { lead: Lead }) {
  const { user } = useAuthStore();
  const { createContact } = useContacts();
  const { planName } = usePlanUsage();

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

  const handleAdd = async () => {
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
      await existing.refetch();
      toast.success(`${lead.name} added to your clients`, {
        description: 'Add their family, birthdays and key dates from Clients.',
      });
    } catch (error) {
      toastSaveError(error, 'Could not add to clients. Please try again.', planName);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className="min-h-[44px] sm:min-h-0"
      onClick={() => void handleAdd()}
      disabled={createContact.isPending}
    >
      <UserPlus className="mr-1.5 h-4 w-4" aria-hidden="true" />
      {createContact.isPending ? 'Adding…' : 'Add to clients'}
    </Button>
  );
}
