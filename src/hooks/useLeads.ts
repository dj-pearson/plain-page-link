import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/useAuthStore';
import { encryptPIIBatch, decryptLeadContacts } from '@/lib/pii';
import type { Lead, LeadRow } from '@/types/lead';

/**
 * Turns stored lead rows into the app's Lead shape by decrypting the contact
 * details. Since US-086 dropped the plaintext columns, encrypted_email and
 * encrypted_phone are the only store.
 *
 * By id, not by value (US-119): pii-crypto used to accept raw ciphertext from
 * anyone with a JWT, which made it an oracle for any ciphertext that leaked —
 * and audit_logs held a copy of every one ever written. It now reads the rows
 * itself and returns only those the caller owns.
 *
 * One call for the whole page rather than one per row: the crypto lives in an
 * Edge Function since US-066, so per-row would be a round trip per lead.
 */
async function decryptLeadRows(rows: LeadRow[]): Promise<Lead[]> {
  const contacts = await decryptLeadContacts(rows.map((row) => row.id));

  return rows.map(({ encrypted_email: _e, encrypted_phone: _p, ...rest }) => ({
    ...rest,
    email: contacts.get(rest.id)?.email ?? null,
    phone: contacts.get(rest.id)?.phone ?? null,
    contact_locked: contacts.get(rest.id)?.locked === true,
  }));
}

/** How many leads one page holds. */
export const LEADS_PAGE_SIZE = 50;

export interface LeadFilters {
  /** A `leads.status` value, or 'all'. Pushed into the query, not filtered client-side. */
  status?: string;
  /** A `leads.lead_type` value, or 'all'. */
  leadType?: string;
  /** Matched against the name in SQL. Email cannot be searched — it is ciphertext. */
  search?: string;
  /** Only leads a teammate's routing assigned to me (US-226). */
  assignedToMe?: boolean;
}

/**
 * Sibling caches that hold the same rows under a different shape. A bulk
 * status change or delete has to invalidate all of them, or Overview keeps
 * showing counts the Leads page has already contradicted — for up to the five
 * minutes their staleTime allows (US-104).
 */
/** The list's filters as a query; shared by the paged list and the export. */
function leadsQuery(
  userId: string,
  filters: { status?: string; leadType?: string; search?: string; assignedToMe?: boolean }
) {
  // US-226: my leads AND the ones assigned to me. RLS always allowed the
  // assignee to read them; this query filtered on user_id alone, so a lead the
  // team's routing handed to a member never appeared anywhere they could see.
  // userId is the session's own id, safe in the filter string.
  let query = supabase.from('leads').select('*').or(`user_id.eq.${userId},assigned_to.eq.${userId}`);
  if (filters.assignedToMe) query = query.eq('assigned_to', userId);
  if (filters.status) query = query.eq('status', filters.status);
  if (filters.leadType) query = query.eq('lead_type', filters.leadType);
  // Name only: email and phone are ciphertext since US-086, so an ilike
  // against them would match nothing.
  if (filters.search) query = query.ilike('name', `%${filters.search}%`);
  return query.order('created_at', { ascending: false });
}

/** pii-crypto decrypts at most 100 rows per call (MAX_ROWS). */
const EXPORT_BATCH = 100;
/** A ceiling so a runaway export cannot loop forever. */
export const EXPORT_MAX_LEADS = 10_000;

/**
 * Every lead matching the filters, decrypted (US-225).
 *
 * Export CSV used to write the rows already loaded on the page — the first 50,
 * or however many the agent had scrolled through — so an agent with 300 leads
 * silently got 50. This pages through all of them.
 */
export async function fetchAllLeads(
  userId: string,
  filters: LeadFilters = {}
): Promise<{ leads: Lead[]; truncated: boolean }> {
  const normalized = {
    status: filters.status && filters.status !== 'all' ? filters.status : undefined,
    leadType: filters.leadType && filters.leadType !== 'all' ? filters.leadType : undefined,
    search: filters.search?.trim() || undefined,
    assignedToMe: filters.assignedToMe,
  };
  const out: Lead[] = [];
  for (let from = 0; from < EXPORT_MAX_LEADS; from += EXPORT_BATCH) {
    const { data, error } = await leadsQuery(userId, normalized).range(from, from + EXPORT_BATCH - 1);
    if (error) throw error;
    const rows = data ?? [];
    out.push(...(await decryptLeadRows(rows)));
    if (rows.length < EXPORT_BATCH) return { leads: out, truncated: false };
  }
  return { leads: out, truncated: true };
}

const LEAD_DEPENDENT_KEYS = [['leads'], ['analytics-leads'], ['conversion-funnel'], ['lead-stats']];

export function useLeads(filters: LeadFilters = {}) {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const status = filters.status && filters.status !== 'all' ? filters.status : undefined;
  const leadType = filters.leadType && filters.leadType !== 'all' ? filters.leadType : undefined;
  const search = filters.search?.trim() || undefined;
  const assignedToMe = filters.assignedToMe || undefined;

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['leads', user?.id, { status, leadType, search, assignedToMe }],
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      if (!user?.id) return [];

      // Every filter that CAN go to the database does. The page used to select
      // every lead the agent had ever received and filter in JavaScript, which
      // also meant decryptLeadRows sent every ciphertext to pii-crypto on each
      // visit (US-104).
      const from = (pageParam as number) * LEADS_PAGE_SIZE;
      const { data, error } = await leadsQuery(user.id, { status, leadType, search, assignedToMe }).range(
        from,
        from + LEADS_PAGE_SIZE - 1
      );

      if (error) throw error;
      return decryptLeadRows(data ?? []);
    },
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === LEADS_PAGE_SIZE ? allPages.length : undefined,
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes - data considered fresh
    gcTime: 10 * 60 * 1000, // 10 minutes - cache retention
  });

  const leads: Lead[] = data?.pages.flat() ?? [];

  /**
   * Invalidate every cache that holds these rows. Keyed by prefix, so a
   * filtered ['leads', userId, {...}] page is refreshed whatever its filters.
   */
  const invalidateLeadCaches = () => {
    for (const key of LEAD_DEPENDENT_KEYS) {
      queryClient.invalidateQueries({ queryKey: key });
    }
  };

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
    onSuccess: invalidateLeadCaches,
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
    onSuccess: invalidateLeadCaches,
  });

  const deleteLead = useMutation({
    mutationFn: async (id: string) => {
      if (!user?.id) throw new Error('User not authenticated');

      // Security: Verify user owns this lead by requiring both id and user_id match
      const { error } = await supabase.from('leads').delete().eq('id', id).eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: invalidateLeadCaches,
  });

  /**
   * Bulk status change. This lived in Leads.tsx and hit supabase directly,
   * refetching only ['leads'] — so Overview's counts and the conversion funnel
   * stayed stale for up to five minutes and contradicted the page the agent
   * was looking at (US-104).
   */
  const bulkUpdateStatus = useMutation({
    mutationFn: async ({ ids, patch }: { ids: string[]; patch: Record<string, unknown> }) => {
      if (!user?.id) throw new Error('User not authenticated');
      // Scoped by user_id as well as id: RLS covers it, but the same
      // defence-in-depth the single-row mutations use.
      const { error } = await supabase
        .from('leads')
        .update(patch)
        .in('id', ids)
        .eq('user_id', user.id);
      if (error) throw error;
    },
    onSuccess: invalidateLeadCaches,
  });

  const bulkDelete = useMutation({
    mutationFn: async (ids: string[]) => {
      if (!user?.id) throw new Error('User not authenticated');
      const { error } = await supabase.from('leads').delete().in('id', ids).eq('user_id', user.id);
      if (error) throw error;
    },
    onSuccess: invalidateLeadCaches,
  });

  return {
    leads,
    isLoading,
    isError,
    error,
    refetch,
    fetchNextPage,
    hasNextPage: !!hasNextPage,
    isFetchingNextPage,
    addLead,
    updateLead,
    deleteLead,
    bulkUpdateStatus,
    bulkDelete,
  };
}
