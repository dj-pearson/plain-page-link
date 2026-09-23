/**
 * The agent's client sphere: contacts, their key dates and the touch log.
 *
 * Email and phone are encrypted at rest exactly as they are on `leads`
 * (US-086): written as ciphertext through pii-crypto's encrypt op, read back
 * through decrypt_contacts, which filters to the caller's own rows. The list
 * view never decrypts — it shows names, relationships and dates — so opening
 * the Clients page costs no crypto round trips; only a single contact's detail
 * view does.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { useAuthStore } from '@/stores/useAuthStore';
import { decryptContactDetails, encryptPIIBatch } from '@/lib/pii';
import { errorHandler } from '@/lib/errorHandler';

type ContactRow = Database['public']['Tables']['contacts']['Row'];
export type KeyDateRow = Database['public']['Tables']['contact_key_dates']['Row'];
export type InteractionRow = Database['public']['Tables']['contact_interactions']['Row'];

export type ContactRelationship =
  | 'active_buyer'
  | 'active_seller'
  | 'past_client'
  | 'sphere'
  | 'prospect'
  | 'referral_partner'
  | 'vendor';

export const RELATIONSHIPS: { value: ContactRelationship; label: string }[] = [
  { value: 'active_buyer', label: 'Active buyer' },
  { value: 'active_seller', label: 'Active seller' },
  { value: 'past_client', label: 'Past client' },
  { value: 'sphere', label: 'Sphere' },
  { value: 'prospect', label: 'Prospect' },
  { value: 'referral_partner', label: 'Referral partner' },
  { value: 'vendor', label: 'Vendor' },
];

export function relationshipLabel(value: string): string {
  return RELATIONSHIPS.find((r) => r.value === value)?.label ?? value;
}

export type InteractionKind =
  | 'call'
  | 'text'
  | 'email'
  | 'meeting'
  | 'gift'
  | 'card'
  | 'social'
  | 'event'
  | 'note';

export const INTERACTION_KINDS: { value: InteractionKind; label: string }[] = [
  { value: 'call', label: 'Call' },
  { value: 'text', label: 'Text' },
  { value: 'email', label: 'Email' },
  { value: 'meeting', label: 'Met in person' },
  { value: 'gift', label: 'Sent a gift' },
  { value: 'card', label: 'Sent a card' },
  { value: 'social', label: 'Social media' },
  { value: 'event', label: 'Client event' },
  { value: 'note', label: 'Note' },
];

/** Someone in the contact's household: spouse, child, pet. */
export interface HouseholdMember {
  name: string;
  relation: string;
  notes?: string;
}

/** The columns the list selects. Never the ciphertext. */
const SUMMARY_COLUMNS =
  'id, lead_id, first_name, last_name, relationship, preferred_contact, city, household, interests, tags, touch_frequency_days, last_contacted_at, next_touch_at, created_at, updated_at';

export type ContactSummary = Pick<
  ContactRow,
  | 'id'
  | 'lead_id'
  | 'first_name'
  | 'last_name'
  | 'relationship'
  | 'preferred_contact'
  | 'city'
  | 'interests'
  | 'tags'
  | 'touch_frequency_days'
  | 'last_contacted_at'
  | 'next_touch_at'
  | 'created_at'
  | 'updated_at'
> & { household: HouseholdMember[] };

/** A contact as the detail view consumes it: the row, decrypted. */
export type Contact = Omit<ContactRow, 'encrypted_email' | 'encrypted_phone' | 'household'> & {
  email: string | null;
  phone: string | null;
  household: HouseholdMember[];
};

/** What the contact form writes. `next_touch_at` is derived by a trigger. */
export interface ContactInput {
  first_name: string;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
  relationship: ContactRelationship;
  preferred_contact?: 'call' | 'text' | 'email' | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
  occupation?: string | null;
  employer?: string | null;
  referred_by?: string | null;
  source?: string | null;
  household?: HouseholdMember[];
  interests?: string[];
  tags?: string[];
  notes?: string | null;
  touch_frequency_days?: number | null;
  lead_id?: string | null;
}

export interface KeyDateInput {
  contact_id: string;
  kind: string;
  label: string;
  person_name?: string | null;
  event_date: string;
  year_known: boolean;
  recurs_annually: boolean;
  remind_days_before: number;
  notes?: string | null;
}

/** A key date with the name of the contact it belongs to. */
export type KeyDateWithContact = KeyDateRow & {
  contacts: { first_name: string; last_name: string | null } | null;
};

export function contactName(c: { first_name: string; last_name?: string | null }): string {
  return [c.first_name, c.last_name].filter(Boolean).join(' ');
}

function toHousehold(value: unknown): HouseholdMember[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((m): m is Record<string, unknown> => !!m && typeof m === 'object')
    .map((m) => ({
      name: String(m.name ?? ''),
      relation: String(m.relation ?? ''),
      notes: m.notes ? String(m.notes) : undefined,
    }))
    .filter((m) => m.name);
}

/** Empty strings become NULL so optional columns do not fill with ''. */
function blankToNull<T extends object>(input: T): T {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    out[key] = typeof value === 'string' && value.trim() === '' ? null : value;
  }
  return out as T;
}

/**
 * The input, minus plaintext email/phone, plus their ciphertext. Fails closed:
 * if pii-crypto cannot encrypt, the write does not happen, rather than storing
 * plaintext in a column named encrypted_*.
 */
async function toStoredContact(input: Partial<ContactInput>) {
  const { email, phone, household, ...rest } = blankToNull(input);
  const stored: Record<string, unknown> = { ...rest };
  if (household !== undefined) stored.household = household;

  if (email !== undefined || phone !== undefined) {
    const [encryptedEmail, encryptedPhone] = await encryptPIIBatch([
      email?.trim().toLowerCase() || null,
      phone?.trim() || null,
    ]);
    if (email !== undefined) stored.encrypted_email = encryptedEmail;
    if (phone !== undefined) stored.encrypted_phone = encryptedPhone;
  }
  return stored;
}

const SPHERE_KEYS = [['contacts'], ['contact'], ['contact-key-dates'], ['contacts-due']];

function useInvalidateSphere() {
  const queryClient = useQueryClient();
  return () => {
    for (const key of SPHERE_KEYS) queryClient.invalidateQueries({ queryKey: key });
  };
}

// ---------------------------------------------------------------------------
// Contacts
// ---------------------------------------------------------------------------

export function useContacts() {
  const { user } = useAuthStore();
  const invalidate = useInvalidateSphere();

  const query = useQuery({
    queryKey: ['contacts', user?.id],
    queryFn: async (): Promise<ContactSummary[]> => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('contacts')
        .select(SUMMARY_COLUMNS)
        .eq('user_id', user.id)
        .order('first_name', { ascending: true })
        .limit(2000);
      if (error) throw error;
      return (data ?? []).map((row) => ({ ...row, household: toHousehold(row.household) }));
    },
    enabled: !!user?.id,
    staleTime: 60 * 1000,
  });

  const createContact = useMutation({
    mutationFn: async (input: ContactInput) => {
      if (!user?.id) throw new Error('User not authenticated');
      const stored = await toStoredContact(input);
      const { data, error } = await supabase
        .from('contacts')
        .insert({
          ...(stored as Database['public']['Tables']['contacts']['Insert']),
          user_id: user.id,
        })
        .select('id')
        .single();
      if (error) throw error;
      return data.id as string;
    },
    onSuccess: invalidate,
    onError: (error) =>
      errorHandler.captureException(error as Error, {
        action: 'create_contact',
        component: 'useContacts',
      }),
  });

  const updateContact = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: Partial<ContactInput> }) => {
      if (!user?.id) throw new Error('User not authenticated');
      const stored = await toStoredContact(input);
      const { error } = await supabase
        .from('contacts')
        .update(stored as Database['public']['Tables']['contacts']['Update'])
        .eq('id', id)
        .eq('user_id', user.id);
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: (error) =>
      errorHandler.captureException(error as Error, {
        action: 'update_contact',
        component: 'useContacts',
      }),
  });

  const deleteContact = useMutation({
    mutationFn: async (id: string) => {
      if (!user?.id) throw new Error('User not authenticated');
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: (error) =>
      errorHandler.captureException(error as Error, {
        action: 'delete_contact',
        component: 'useContacts',
      }),
  });

  return {
    contacts: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    createContact,
    updateContact,
    deleteContact,
  };
}

/** One contact, with email and phone decrypted. */
export function useContact(contactId: string | null | undefined) {
  const { user } = useAuthStore();
  return useQuery({
    queryKey: ['contact', contactId],
    queryFn: async (): Promise<Contact | null> => {
      if (!user?.id || !contactId) return null;
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', contactId)
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;

      const details = await decryptContactDetails([data.id]);
      const { encrypted_email: _e, encrypted_phone: _p, household, ...rest } = data;
      return {
        ...rest,
        household: toHousehold(household),
        email: details.get(data.id)?.email ?? null,
        phone: details.get(data.id)?.phone ?? null,
      };
    },
    enabled: !!user?.id && !!contactId,
  });
}

/** Contacts whose stay-in-touch date is today or overdue, most overdue first. */
export function useContactsDueForTouch(limit = 10) {
  const { user } = useAuthStore();
  return useQuery({
    queryKey: ['contacts-due', user?.id, limit],
    queryFn: async () => {
      if (!user?.id) return [];
      const endOfToday = new Date();
      endOfToday.setHours(23, 59, 59, 999);
      const { data, error } = await supabase
        .from('contacts')
        .select(
          'id, first_name, last_name, relationship, preferred_contact, next_touch_at, last_contacted_at'
        )
        .eq('user_id', user.id)
        .not('next_touch_at', 'is', null)
        .lte('next_touch_at', endOfToday.toISOString())
        .order('next_touch_at', { ascending: true })
        .limit(limit);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user?.id,
    staleTime: 60 * 1000,
  });
}

// ---------------------------------------------------------------------------
// Key dates
// ---------------------------------------------------------------------------

/**
 * Key dates for one contact, or — with no contact id — every key date the
 * agent has, with the contact's name, for the dashboard's "coming up" list.
 * A sphere of a few hundred people has a few hundred dates; the upcoming
 * window is computed client-side by lib/keyDates, since "next occurrence of
 * an annual date" is not something PostgREST can filter on.
 */
export function useKeyDates(contactId?: string) {
  const { user } = useAuthStore();
  const invalidate = useInvalidateSphere();

  const query = useQuery({
    queryKey: ['contact-key-dates', user?.id, contactId ?? 'all'],
    queryFn: async (): Promise<KeyDateWithContact[]> => {
      if (!user?.id) return [];
      let q = supabase
        .from('contact_key_dates')
        .select('*, contacts(first_name, last_name)')
        .eq('user_id', user.id);
      if (contactId) q = q.eq('contact_id', contactId);
      const { data, error } = await q.order('event_date', { ascending: true }).limit(5000);
      if (error) throw error;
      return (data ?? []) as KeyDateWithContact[];
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  const addKeyDate = useMutation({
    mutationFn: async (input: KeyDateInput) => {
      if (!user?.id) throw new Error('User not authenticated');
      const { error } = await supabase
        .from('contact_key_dates')
        .insert({ ...blankToNull(input), user_id: user.id });
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: (error) =>
      errorHandler.captureException(error as Error, {
        action: 'add_key_date',
        component: 'useKeyDates',
      }),
  });

  const updateKeyDate = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: Partial<KeyDateInput> }) => {
      if (!user?.id) throw new Error('User not authenticated');
      const { error } = await supabase
        .from('contact_key_dates')
        .update(blankToNull(input))
        .eq('id', id)
        .eq('user_id', user.id);
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: (error) =>
      errorHandler.captureException(error as Error, {
        action: 'update_key_date',
        component: 'useKeyDates',
      }),
  });

  const deleteKeyDate = useMutation({
    mutationFn: async (id: string) => {
      if (!user?.id) throw new Error('User not authenticated');
      const { error } = await supabase
        .from('contact_key_dates')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: (error) =>
      errorHandler.captureException(error as Error, {
        action: 'delete_key_date',
        component: 'useKeyDates',
      }),
  });

  return {
    keyDates: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    addKeyDate,
    updateKeyDate,
    deleteKeyDate,
  };
}

// ---------------------------------------------------------------------------
// Interactions (the touch log)
// ---------------------------------------------------------------------------

export function useContactInteractions(contactId: string | null | undefined) {
  const { user } = useAuthStore();
  const invalidate = useInvalidateSphere();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['contact-interactions', contactId],
    queryFn: async (): Promise<InteractionRow[]> => {
      if (!user?.id || !contactId) return [];
      const { data, error } = await supabase
        .from('contact_interactions')
        .select('*')
        .eq('user_id', user.id)
        .eq('contact_id', contactId)
        .order('occurred_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user?.id && !!contactId,
  });

  const logInteraction = useMutation({
    mutationFn: async (input: {
      contact_id: string;
      kind: InteractionKind;
      summary?: string | null;
      occurred_at?: string;
    }) => {
      if (!user?.id) throw new Error('User not authenticated');
      const { error } = await supabase
        .from('contact_interactions')
        .insert({ ...blankToNull(input), user_id: user.id });
      if (error) throw error;
    },
    onSuccess: () => {
      // The insert trigger moves last_contacted_at and next_touch_at, so the
      // contact and every list showing it are stale too.
      invalidate();
      queryClient.invalidateQueries({ queryKey: ['contact-interactions'] });
    },
    onError: (error) =>
      errorHandler.captureException(error as Error, {
        action: 'log_interaction',
        component: 'useContactInteractions',
      }),
  });

  const deleteInteraction = useMutation({
    mutationFn: async (id: string) => {
      if (!user?.id) throw new Error('User not authenticated');
      const { error } = await supabase
        .from('contact_interactions')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contact-interactions'] }),
  });

  return {
    interactions: query.data ?? [],
    isLoading: query.isLoading,
    logInteraction,
    deleteInteraction,
  };
}
