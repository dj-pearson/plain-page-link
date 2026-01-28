/**
 * Secure Leads Hook
 *
 * Enhanced version of useLeads with defense-in-depth security layers.
 *
 * Security Layers Applied:
 * 1. Authentication - All operations require valid session
 * 2. Authorization - Permission checks for each operation
 * 3. Ownership - Data scoped to current user (admins can see all)
 * 4. Validation - Input sanitization on all mutations
 * 5. RLS - Database enforces final access control
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/useAuthStore';
import { useSecurity } from '@/hooks/useSecurity';
import { logger } from '@/lib/logger';
import type { Lead } from '@/types/lead';

// ============================================================
// Hook
// ============================================================

export function useSecureLeads() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const {
    isAuthenticated,
    isAdmin,
    userId,
    requireAccess,
    sanitize,
    validate,
  } = useSecurity();

  // --------------------------------------------------------
  // Query: Fetch Leads (with ownership filtering)
  // --------------------------------------------------------
  const {
    data: leads = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['secure-leads', userId, isAdmin],
    queryFn: async () => {
      // Layer 1 & 2: Authentication + Authorization
      await requireAccess({
        authenticated: true,
        permission: 'lead.view_own',
      });

      // Build query
      let query = supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      // Layer 3: Ownership filtering (admins see all, users see own)
      if (!isAdmin && userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) {
        logger.error('Failed to fetch leads', error, { action: 'fetch_leads' });
        throw error;
      }

      return data as Lead[];
    },
    enabled: isAuthenticated && !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // --------------------------------------------------------
  // Mutation: Add Lead
  // --------------------------------------------------------
  const addLead = useMutation({
    mutationFn: async (
      leadData: Omit<Lead, 'id' | 'user_id' | 'created_at' | 'updated_at'>
    ) => {
      // Layer 1 & 2: Authentication + Authorization
      await requireAccess({
        authenticated: true,
        permission: 'lead.create',
      });

      if (!userId) throw new Error('User not authenticated');

      // Layer 4: Input Sanitization
      const sanitizedData = sanitize.lead({
        name: leadData.name,
        email: leadData.email,
        phone: leadData.phone,
        message: leadData.message,
        source: leadData.source,
      });

      // Validate email if provided
      if (sanitizedData.email && !validate.email(sanitizedData.email)) {
        throw new Error('Invalid email format');
      }

      const { data, error } = await supabase
        .from('leads')
        .insert({
          ...leadData,
          ...sanitizedData,
          user_id: userId,
        })
        .select()
        .single();

      if (error) {
        logger.error('Failed to add lead', error, { action: 'add_lead' });
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['secure-leads', userId] });
    },
  });

  // --------------------------------------------------------
  // Mutation: Update Lead
  // --------------------------------------------------------
  const updateLead = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Lead> & { id: string }) => {
      // Validate resource ID
      validate.resourceId(id, 'lead');

      // Layer 1 & 2: Authentication + Authorization
      await requireAccess({
        authenticated: true,
        permission: 'lead.update_own',
      });

      if (!userId) throw new Error('User not authenticated');

      // Layer 4: Input Sanitization
      const sanitizedUpdates = sanitize.lead({
        name: updates.name,
        email: updates.email,
        phone: updates.phone,
        message: updates.message,
        source: updates.source,
      });

      // Validate email if being updated
      if (sanitizedUpdates.email && !validate.email(sanitizedUpdates.email)) {
        throw new Error('Invalid email format');
      }

      // Build update with sanitized data
      const updateData = {
        ...updates,
        ...Object.fromEntries(
          Object.entries(sanitizedUpdates).filter(([_, v]) => v !== undefined)
        ),
        updated_at: new Date().toISOString(),
      };

      // Layer 3: Ownership check in query (RLS backup)
      let query = supabase
        .from('leads')
        .update(updateData)
        .eq('id', id);

      // Non-admins must own the resource
      if (!isAdmin) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query.select().single();

      if (error) {
        if (error.code === 'PGRST116') {
          logger.warn('Lead update ownership violation', {
            leadId: id.substring(0, 8),
            userId: userId?.substring(0, 8),
          });
          throw new Error('Lead not found or access denied');
        }
        logger.error('Failed to update lead', error, { action: 'update_lead' });
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['secure-leads', userId] });
    },
  });

  // --------------------------------------------------------
  // Mutation: Delete Lead
  // --------------------------------------------------------
  const deleteLead = useMutation({
    mutationFn: async (id: string) => {
      // Validate resource ID
      validate.resourceId(id, 'lead');

      // Layer 1 & 2: Authentication + Authorization
      await requireAccess({
        authenticated: true,
        permission: 'lead.delete_own',
      });

      if (!userId) throw new Error('User not authenticated');

      // Layer 3: Ownership check in query (RLS backup)
      let query = supabase.from('leads').delete().eq('id', id);

      // Non-admins must own the resource
      if (!isAdmin) {
        query = query.eq('user_id', userId);
      }

      const { error, count } = await query;

      if (error) {
        logger.error('Failed to delete lead', error, { action: 'delete_lead' });
        throw error;
      }

      // Check if deletion succeeded
      if (count === 0) {
        logger.warn('Lead delete ownership violation', {
          leadId: id.substring(0, 8),
          userId: userId?.substring(0, 8),
        });
        throw new Error('Lead not found or access denied');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['secure-leads', userId] });
    },
  });

  // --------------------------------------------------------
  // Query: Get Single Lead
  // --------------------------------------------------------
  const getLead = async (id: string): Promise<Lead | null> => {
    // Validate resource ID
    validate.resourceId(id, 'lead');

    // Layer 1 & 2: Authentication + Authorization
    await requireAccess({
      authenticated: true,
      permission: 'lead.view_own',
    });

    if (!userId) return null;

    // Build query with ownership filter
    let query = supabase.from('leads').select('*').eq('id', id);

    // Non-admins must own the resource
    if (!isAdmin) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query.single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found or access denied
      }
      throw error;
    }

    return data as Lead;
  };

  return {
    leads,
    isLoading,
    isError,
    error,
    refetch,
    addLead,
    updateLead,
    deleteLead,
    getLead,
  };
}
