import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/useAuthStore';
import { encryptPIIBatch, decryptPIIBatch } from '@/lib/pii';
import type { Lead, LeadRow } from '@/types/lead';

/**
 * Turns stored lead rows into the app's Lead shape by decrypting the contact
 * details. Since US-086 dropped the plaintext columns, encrypted_email and
 * encrypted_phone are the only store; decryptPIIBatch passes through any value
 * that is not `enc:v1:` prefixed, so a row written before the backfill still
 * reads correctly.
 *
 * Batched across the whole page rather than per row: since US-066 the crypto
 * lives in the pii-crypto Edge Function, so a per-field call would be two
 * network round trips per lead.
 */
async function decryptLeadRows(rows: LeadRow[]): Promise<Lead[]> {
  const [decryptedEmails, decryptedPhones] = await Promise.all([
    decryptPIIBatch(rows.map((row) => row.encrypted_email)),
    decryptPIIBatch(rows.map((row) => row.encrypted_phone)),
  ]);

  return rows.map(({ encrypted_email: _e, encrypted_phone: _p, ...rest }, i) => ({
    ...rest,
    email: decryptedEmails[i] ?? null,
    phone: decryptedPhones[i] ?? null,
  }));
}

export function useLeads() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const {
    data: leads = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['leads', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return decryptLeadRows(data ?? []);
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes - data considered fresh
    gcTime: 10 * 60 * 1000, // 10 minutes - cache retention
  });

  const addLead = useMutation({
    mutationFn: async (leadData: Omit<Lead, 'id' | 'created_at' | 'updated_at'>) => {
      if (!user?.id) throw new Error('User not authenticated');

      // US-086: the plaintext email/phone columns are gone, so the encrypted
      // ones are the only store. This used to dual-write both, which meant the
      // ciphertext protected nothing an attacker could not already read from
      // the plaintext beside it under the same RLS.
      // Force ownership to the authenticated user rather than trusting caller-supplied user_id.
      // Both fields go in one encryptPIIBatch call — two encryptPII calls would
      // be two round trips to pii-crypto (US-066).
      const [encryptedEmail, encryptedPhone] = await encryptPIIBatch([
        leadData.email,
        leadData.phone,
      ]);
      const { email: _email, phone: _phone, ...rest } = leadData;
      const payload = {
        ...rest,
        user_id: user.id,
        encrypted_email: encryptedEmail,
        encrypted_phone: encryptedPhone,
      };

      const { data, error } = await supabase.from('leads').insert(payload).select().single();

      if (error) throw error;

      // Deliberately no notify-lead call here. US-099 consolidated lead
      // notification onto that one function, and submit-lead calls it for
      // every lead captured from a public form. This path is an agent typing a
      // lead into their own CRM: the notification would email them about
      // something they just entered, and reaching notify-lead from the browser
      // would mean accepting a user session on a function US-078 restricted to
      // the service role. Neither is worth it. If team assignment ever needs to
      // notify a colleague, that belongs in the assignment trigger, addressed
      // to leads.assigned_to rather than to leads.user_id.
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads', user?.id] });
    },
  });

  const updateLead = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Lead> & { id: string }) => {
      if (!user?.id) throw new Error('User not authenticated');

      // Encrypt PII fields being updated, in a single batched call (US-066),
      // and drop the plaintext keys — there are no plaintext columns to
      // receive them since US-086.
      const encryptedUpdates: Record<string, unknown> = { ...updates };
      const changed = (['email', 'phone'] as const).filter((f) => f in updates);
      if (changed.length > 0) {
        const encrypted = await encryptPIIBatch(changed.map((f) => updates[f]));
        changed.forEach((field, i) => {
          encryptedUpdates[`encrypted_${field}`] = encrypted[i];
          delete encryptedUpdates[field];
        });
      }

      // Security: Verify user owns this lead by requiring both id and user_id match
      const { data, error } = await supabase
        .from('leads')
        .update(encryptedUpdates as typeof updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads', user?.id] });
    },
  });

  const deleteLead = useMutation({
    mutationFn: async (id: string) => {
      if (!user?.id) throw new Error('User not authenticated');

      // Security: Verify user owns this lead by requiring both id and user_id match
      const { error } = await supabase.from('leads').delete().eq('id', id).eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads', user?.id] });
    },
  });

  return {
    leads,
    isLoading,
    isError,
    error,
    refetch,
    addLead,
    updateLead,
    deleteLead,
  };
}
