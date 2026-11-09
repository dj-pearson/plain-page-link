import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/useAuthStore';
import { encryptPIIBatch, decryptLeadContacts } from '@/lib/pii';
import { LEAD_COLUMNS } from '@/lib/leadColumns';
import { normalizeStatusFilter, statusFilterValues } from '@/lib/leadStatus';
import { normalizeAssigneeFilter, type AssigneeFilter } from '@/lib/leadAssignee';
import type { Lead, LeadReadRow } from '@/types/lead';

/**
 * Turns stored lead rows into the app's Lead shape by decrypting the contact
 * details. Since US-086 dropped the plaintext columns, encrypted_email and
 * encrypted_phone are the only store — and since US-254 the browser cannot
 * select them at all (LEAD_COLUMNS), so the plaintext comes only from here.
 *
 * By id, not by value (US-119): pii-crypto used to accept raw ciphertext from
 * anyone with a JWT, which made it an oracle for any ciphertext that leaked —
 * and audit_logs held a copy of every one ever written. It now reads the rows
 * itself and returns only those the caller owns.
 *
 * One call for the whole page rather than one per row: the crypto lives in an
 * Edge Function since US-066, so per-row would be a round trip per lead.
 */
async function decryptLeadRows(rows: LeadReadRow[]): Promise<Lead[]> {
  const contacts = await decryptLeadContacts(rows.map((row) => row.id));

  return rows.map((rest) => ({
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
  /**
   * Who holds the lead (US-515): 'unassigned' or one teammate's user id, the
   * owner's view of how their team's leads are split. Anything else is ignored.
   */
  assignee?: string | null;
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
  filters: {
    statuses?: readonly string[];
    leadType?: string;
    search?: string;
    assignedToMe?: boolean;
    assignee?: AssigneeFilter | null;
  }
) {
  // US-226: my leads AND the ones assigned to me. RLS always allowed the
  // assignee to read them; this query filtered on user_id alone, so a lead the
  // team's routing handed to a member never appeared anywhere they could see.
  // userId is the session's own id, safe in the filter string.
  let query = supabase
    .from('leads')
    .select(LEAD_COLUMNS)
    .or(`user_id.eq.${userId},assigned_to.eq.${userId}`);
  if (filters.assignedToMe) query = query.eq('assigned_to', userId);
  if (filters.assignee === 'unassigned') query = query.is('assigned_to', null);
  else if (filters.assignee) query = query.eq('assigned_to', filters.assignee);
  // One status or a group of them (US-439: "In progress", "Won").
  const statuses = filters.statuses;
  if (statuses?.length === 1) query = query.eq('status', statuses[0]);
  else if (statuses?.length) query = query.in('status', [...statuses]);
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
    statuses: statusFilterValues(filters.status),
    leadType: filters.leadType && filters.leadType !== 'all' ? filters.leadType : undefined,
    search: filters.search?.trim() || undefined,
    assignedToMe: filters.assignedToMe,
    assignee: normalizeAssigneeFilter(filters.assignee),
  };
  const out: Lead[] = [];
  for (let from = 0; from < EXPORT_MAX_LEADS; from += EXPORT_BATCH) {
    const { data, error } = await leadsQuery(userId, normalized).range(
      from,
      from + EXPORT_BATCH - 1
    );
    if (error) throw error;
    const rows = data ?? [];
    out.push(...(await decryptLeadRows(rows)));
    if (rows.length < EXPORT_BATCH) return { leads: out, truncated: false };
  }
  return { leads: out, truncated: true };
}

const LEAD_DEPENDENT_KEYS = [['leads'], ['analytics-leads'], ['conversion-funnel'], ['lead-stats']];

export function useLeads(filters: LeadFilters = {}) {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  const status = normalizeStatusFilter(filters.status);
  const statuses = statusFilterValues(status);
  const leadType = filters.leadType && filters.leadType !== 'all' ? filters.leadType : undefined;
  const search = filters.search?.trim() || undefined;
  const assignedToMe = filters.assignedToMe || undefined;
  const assignee = normalizeAssigneeFilter(filters.assignee) ?? undefined;

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
    queryKey: ['leads', user?.id, { status, leadType, search, assignedToMe, assignee }],
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      if (!user?.id) return [];

      // Every filter that CAN go to the database does. The page used to select
      // every lead the agent had ever received and filter in JavaScript, which
      // also meant decryptLeadRows sent every ciphertext to pii-crypto on each
      // visit (US-104).
      const from = (pageParam as number) * LEADS_PAGE_SIZE;
      const { data, error } = await leadsQuery(user.id, {
        statuses,
        leadType,
        search,
        assignedToMe,
        assignee,
      }).range(from, from + LEADS_PAGE_SIZE - 1);

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

      const { data, error } = await supabase
        .from('leads')
        .insert(payload)
        // Not a bare .select(): that asks for `*`, and the ciphertext columns
        // are not selectable by the browser (US-254).
        .select(LEAD_COLUMNS)
        .single();

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
        .select(LEAD_COLUMNS)
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
    mutationFn: async ({
      ids,
      patch,
    }: {
      ids: string[];
      patch: Record<string, unknown>;
    }): Promise<string[]> => {
      if (!user?.id) throw new Error('User not authenticated');
      if (ids.length === 0) return [];
      // US-588: the owner OR the assignee, as the leads UPDATE policy allows
      // (and as the detail dialog's single-lead status change already does).
      // Scoped by user_id alone, a teammate's bulk change to the leads
      // assigned to them matched no row and was reported as done. Returns the
      // ids the server changed, so the page reports what really happened.
      const { data, error } = await supabase
        .from('leads')
        .update(patch)
        .in('id', ids)
        .or(`user_id.eq.${user.id},assigned_to.eq.${user.id}`)
        .select('id');
      if (error) throw error;
      return (data ?? []).map((row) => row.id);
    },
    onSuccess: invalidateLeadCaches,
  });

  // US-573: hand the selected leads to one teammate, or to nobody. The same
  // guard_lead_assignee trigger as the detail dialog (20261108000497) refuses
  // anyone who is not an accepted member of the owner's team. Returns the ids
  // the server actually changed, so the page can report the rest.
  const bulkAssign = useMutation({
    mutationFn: async ({
      ids,
      assignedTo,
    }: {
      ids: string[];
      assignedTo: string | null;
    }): Promise<string[]> => {
      if (!user?.id) throw new Error('User not authenticated');
      if (ids.length === 0) return [];
      const { data, error } = await supabase
        .from('leads')
        .update({ assigned_to: assignedTo })
        .in('id', ids)
        .eq('user_id', user.id)
        .select('id');
      if (error) throw error;
      return (data ?? []).map((row) => row.id);
    },
    onSuccess: invalidateLeadCaches,
  });

  // Only the owner can delete a lead (an assignee cannot destroy the team's
  // record of it). Returns the ids the server actually deleted (US-588).
  const bulkDelete = useMutation({
    mutationFn: async (ids: string[]): Promise<string[]> => {
      if (!user?.id) throw new Error('User not authenticated');
      if (ids.length === 0) return [];
      const { data, error } = await supabase
        .from('leads')
        .delete()
        .in('id', ids)
        .eq('user_id', user.id)
        .select('id');
      if (error) throw error;
      return (data ?? []).map((row) => row.id);
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
    bulkAssign,
    bulkDelete,
  };
}
