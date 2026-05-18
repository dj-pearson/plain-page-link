import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/useAuthStore';
import { encryptPII, decryptPII } from '@/lib/pii';
import type { Lead } from '@/types/lead';

/**
 * Decrypts the PII fields of a fetched lead row. Prefers the encrypted_*
 * columns (US-016); falls back to the still-present plaintext columns for
 * rows not yet backfilled. decryptPII passes plaintext through unchanged.
 */
async function decryptLeadRow(row: Lead): Promise<Lead> {
  const r = row as Lead & {
    encrypted_email?: string | null;
    encrypted_phone?: string | null;
  };
  const email = await decryptPII(r.encrypted_email ?? r.email);
  const phone = await decryptPII(r.encrypted_phone ?? r.phone);
  return { ...row, email: email ?? row.email, phone: phone ?? row.phone };
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
      return Promise.all(((data as Lead[]) ?? []).map(decryptLeadRow));
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes - data considered fresh
    gcTime: 10 * 60 * 1000, // 10 minutes - cache retention
  });

  const addLead = useMutation({
    mutationFn: async (leadData: Omit<Lead, 'id' | 'created_at' | 'updated_at'>) => {
      // Dual-write: keep plaintext (transition phase) + encrypted columns.
      const payload = {
        ...leadData,
        encrypted_email: await encryptPII(leadData.email),
        encrypted_phone: await encryptPII(leadData.phone),
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

      // Dual-write encrypted columns when PII fields are being updated.
      const encryptedUpdates: Record<string, unknown> = { ...updates };
      if ('email' in updates) {
        encryptedUpdates.encrypted_email = await encryptPII(updates.email);
      }
      if ('phone' in updates) {
        encryptedUpdates.encrypted_phone = await encryptPII(updates.phone);
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
