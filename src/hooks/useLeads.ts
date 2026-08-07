import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/useAuthStore';
import { encryptPIIBatch, decryptPIIBatch } from '@/lib/pii';
import type { Lead } from '@/types/lead';

/**
 * Decrypts the PII fields of fetched lead rows. Prefers the encrypted_*
 * columns (US-016); falls back to the still-present plaintext columns for rows
 * not yet backfilled — decryptPIIBatch passes plaintext through unchanged.
 *
 * Batched across the whole page rather than per row: since US-066 the crypto
 * lives in the pii-crypto Edge Function, so a per-field call would be two
 * network round trips per lead.
 */
async function decryptLeadRows(rows: Lead[]): Promise<Lead[]> {
  type WithEncrypted = Lead & { encrypted_email?: string | null; encrypted_phone?: string | null };

  const emails = rows.map((row) => (row as WithEncrypted).encrypted_email ?? row.email);
  const phones = rows.map((row) => (row as WithEncrypted).encrypted_phone ?? row.phone);

  const [decryptedEmails, decryptedPhones] = await Promise.all([
    decryptPIIBatch(emails),
    decryptPIIBatch(phones),
  ]);

  return rows.map((row, i) => ({
    ...row,
    email: decryptedEmails[i] ?? row.email,
    phone: decryptedPhones[i] ?? row.phone,
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
      return decryptLeadRows((data as Lead[]) ?? []);
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes - data considered fresh
    gcTime: 10 * 60 * 1000, // 10 minutes - cache retention
  });

  const addLead = useMutation({
    mutationFn: async (leadData: Omit<Lead, 'id' | 'created_at' | 'updated_at'>) => {
      if (!user?.id) throw new Error('User not authenticated');

      // Dual-write: keep plaintext (transition phase) + encrypted columns.
      // Force ownership to the authenticated user rather than trusting caller-supplied user_id.
      // Both fields go in one encryptPIIBatch call — two encryptPII calls would
      // be two round trips to pii-crypto (US-066).
      const [encryptedEmail, encryptedPhone] = await encryptPIIBatch([
        leadData.email,
        leadData.phone,
      ]);
      const payload = {
        ...leadData,
        user_id: user.id,
        encrypted_email: encryptedEmail,
        encrypted_phone: encryptedPhone,
      } as typeof leadData;

      const { data, error } = await supabase.from('leads').insert(payload).select().single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads', user?.id] });
    },
  });

  const updateLead = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Lead> & { id: string }) => {
      if (!user?.id) throw new Error('User not authenticated');

      // Dual-write encrypted columns when PII fields are being updated, in a
      // single batched call (US-066).
      const encryptedUpdates: Record<string, unknown> = { ...updates };
      const changed = (['email', 'phone'] as const).filter((f) => f in updates);
      if (changed.length > 0) {
        const encrypted = await encryptPIIBatch(changed.map((f) => updates[f]));
        changed.forEach((field, i) => {
          encryptedUpdates[`encrypted_${field}`] = encrypted[i];
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
